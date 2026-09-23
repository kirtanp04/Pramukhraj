using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using pramukhraj.Common;
using pramukhraj.Database;
using pramukhraj.DTOs.Notifications;
using pramukhraj.DTOs.Order;
using pramukhraj.DTOs.ProviderCredentials;
using pramukhraj.Entities.Cart;
using pramukhraj.Entities.Coupon;
using pramukhraj.Entities.Notifications;
using pramukhraj.Entities.Order;
using pramukhraj.Entities.ProviderCredentials;
using pramukhraj.Interfaces;

namespace pramukhraj.Services;

public sealed class RazorpayPaymentService(
    HttpClient httpClient,
    AppDbContext db,
    CustomerClaimsHelper claimsHelper,
    IValidatorManager validators,
    IProviderCredentialService credentialsService,
    IStoreSettingsService settingsService,
    IAdminNotificationService notifications,
    ICacheService cache,
    ILogger<RazorpayPaymentService> logger) : IPaymentService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task<RazorpayCheckoutResponse> EnsureProviderOrderAsync(Guid orderId, Guid customerId, CancellationToken cancellationToken = default)
    {
        var data = await db.Orders.Where(x => x.Id == orderId && x.CustomerId == customerId)
            .Select(x => new { Order = x, Payment = x.Payments.OrderByDescending(p => p.CreatedOn).First(),
                Customer = db.Customers.First(c => c.Id == x.CustomerId) }).SingleOrDefaultAsync(cancellationToken)
            ?? throw new InvalidOperationException("Order was not found.");
        if (data.Order.Status != OrderStatus.PendingPayment || data.Payment.Status == PaymentStatus.Paid)
            throw new InvalidOperationException("This order is not awaiting payment.");
        if (data.Payment.ExpiresOn <= DateTime.UtcNow) throw new InvalidOperationException("The payment window has expired.");
        var credentials = await CredentialsAsync(cancellationToken);
        if (string.IsNullOrWhiteSpace(data.Payment.ProviderOrderId))
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, "orders")
            {
                Content = JsonContent.Create(new { amount = data.Payment.AmountPaise, currency = data.Payment.Currency,
                    receipt = data.Order.OrderNumber, payment_capture = 1 })
            };
            Authorize(request, credentials);
            using var response = await httpClient.SendAsync(request, cancellationToken);
            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("Razorpay order creation failed. Status={Status}; OrderId={OrderId}", (int)response.StatusCode, orderId);
                await RecordInitiationFailureAsync(data.Payment, data.Order, cancellationToken);
                throw new HttpRequestException("Payment provider order creation failed.", null, response.StatusCode);
            }
            using var json = JsonDocument.Parse(body);
            var providerOrderId = RequiredString(json.RootElement, "id");
            if (json.RootElement.GetProperty("amount").GetInt64() != data.Payment.AmountPaise ||
                !string.Equals(RequiredString(json.RootElement, "currency"), data.Payment.Currency, StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("Payment provider returned an inconsistent order.");
            var strategy = db.Database.CreateExecutionStrategy();
            await strategy.ExecuteAsync(async () =>
            {
                await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
                data.Payment.ProviderOrderId = providerOrderId;
                data.Payment.Status = PaymentStatus.ProviderOrderCreated;
                data.Payment.UpdatedOn = DateTime.UtcNow;
                data.Payment.ConcurrencyStamp = Guid.NewGuid().ToString("N");
                db.PaymentTransactions.Add(Transaction(data.Payment.Id, "ProviderOrderCreated", providerOrderId, "Success", null));
                await db.SaveChangesAsync(cancellationToken);
                var initiated = await notifications.CreateAsync(new CreateAdminNotification(AdminNotificationTypes.PaymentInitiated,
                    NotificationSeverities.Info, "Payment initiated", $"Secure payment started for order {data.Order.OrderNumber}.",
                    "Order", data.Order.Id.ToString(), "/admin/orders", DeduplicationKey: $"payment:{data.Payment.Id}:initiated"), false, cancellationToken);
                if (initiated is not null) db.OutboxMessages.Add(NotificationOutbox(initiated.Id, DateTime.UtcNow));
                await db.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);
            });
        }
        var settings = await settingsService.GetCurrentAsync(cancellationToken);
        return new RazorpayCheckoutResponse(data.Order.Id, data.Order.OrderNumber, credentials.ApiKey,
            data.Payment.ProviderOrderId!, data.Payment.AmountPaise, data.Payment.Currency, data.Customer.FullName,
            data.Customer.Email, data.Customer.MobileNumber, data.Payment.ExpiresOn, settings.StoreName,
            credentials.IsUpiPaymentEnabled, credentials.IsCardPaymentEnabled);
    }

    public async Task<ApiResponse<PaymentVerificationResponse>> VerifyAsync(Guid orderId, VerifyRazorpayPaymentRequest request, CancellationToken cancellationToken = default)
    {
        var validation = await validators.VerifyRazorpayPaymentRequest.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid) return ApiResponse<PaymentVerificationResponse>.Fail("Invalid payment verification details.", 400);
        var claims = claimsHelper.GetCustomer();
        if (!claims.Success || claims.Data is null) return ApiResponse<PaymentVerificationResponse>.Fail(claims.Message, claims.StatusCode);
        var payment = await db.Payments.Include(x => x.Order).SingleOrDefaultAsync(x => x.OrderId == orderId && x.Order.CustomerId == claims.Data.CustomerId, cancellationToken);
        if (payment is null) return ApiResponse<PaymentVerificationResponse>.Fail("Order was not found.", 404);
        if (payment.Status == PaymentStatus.Paid) return Success(payment);
        if (payment.ExpiresOn <= DateTime.UtcNow) return ApiResponse<PaymentVerificationResponse>.Fail("The payment window has expired.", 409);
        if (!string.Equals(payment.ProviderOrderId, request.RazorpayOrderId, StringComparison.Ordinal))
            return ApiResponse<PaymentVerificationResponse>.Fail("Payment verification failed.", 400);
        var credentials = await CredentialsAsync(cancellationToken);
        if (!VerifySignature($"{request.RazorpayOrderId}|{request.RazorpayPaymentId}", request.RazorpaySignature, credentials.KeySecret))
        {
            db.PaymentTransactions.Add(Transaction(payment.Id, "FrontendVerification", request.RazorpayPaymentId, "InvalidSignature", null));
            await db.SaveChangesAsync(cancellationToken);
            var failed = await notifications.CreateAsync(new CreateAdminNotification(AdminNotificationTypes.PaymentVerificationFailed,
                NotificationSeverities.Warning, "Payment verification rejected", $"A payment response for order {payment.Order.OrderNumber} had an invalid signature.",
                "Order", payment.OrderId.ToString(), "/admin/orders", DeduplicationKey: $"payment:{payment.Id}:verification-failed"), false, cancellationToken);
            if (failed is not null) { db.OutboxMessages.Add(NotificationOutbox(failed.Id, DateTime.UtcNow)); await db.SaveChangesAsync(cancellationToken); }
            return ApiResponse<PaymentVerificationResponse>.Fail("Payment verification failed.", 400);
        }
        var provider = await FetchPaymentAsync(request.RazorpayPaymentId, credentials, cancellationToken);
        if (provider.OrderId != payment.ProviderOrderId || provider.Amount != payment.AmountPaise ||
            !string.Equals(provider.Currency, payment.Currency, StringComparison.OrdinalIgnoreCase) || provider.Status != "captured")
            return ApiResponse<PaymentVerificationResponse>.Fail("Payment is not captured yet. Please wait and retry.", 409);
        await ConfirmAsync(payment, request.RazorpayPaymentId, "FrontendVerification", cancellationToken);
        return Success(payment);
    }

    public async Task<ApiResponse<RazorpayCheckoutResponse>> RetryAsync(Guid orderId, CancellationToken cancellationToken = default)
    {
        var claims = claimsHelper.GetCustomer();
        if (!claims.Success || claims.Data is null) return ApiResponse<RazorpayCheckoutResponse>.Fail(claims.Message, claims.StatusCode);
        try { return ApiResponse<RazorpayCheckoutResponse>.Ok(await EnsureProviderOrderAsync(orderId, claims.Data.CustomerId, cancellationToken), "Payment is ready."); }
        catch (InvalidOperationException exception) { return ApiResponse<RazorpayCheckoutResponse>.Fail(exception.Message, 409); }
        catch (Exception exception) { logger.LogError(exception, "Payment retry failed for {OrderId}.", orderId); return ApiResponse<RazorpayCheckoutResponse>.Fail("Payment provider is temporarily unavailable.", 503); }
    }

    public async Task<ApiResponse<PaymentStatusResponse>> GetStatusAsync(Guid orderId, CancellationToken cancellationToken = default)
    {
        var claims = claimsHelper.GetCustomer();
        if (!claims.Success || claims.Data is null) return ApiResponse<PaymentStatusResponse>.Fail(claims.Message, claims.StatusCode);
        var data = await db.Payments.AsNoTracking().Where(x => x.OrderId == orderId && x.Order.CustomerId == claims.Data.CustomerId)
            .Select(x => new PaymentStatusResponse(x.OrderId, x.Order.OrderNumber, x.Order.Status.ToString(), x.Status.ToString(),
                x.Status == PaymentStatus.Paid, x.Order.Status == OrderStatus.PendingPayment && x.ExpiresOn > DateTime.UtcNow, x.ExpiresOn))
            .SingleOrDefaultAsync(cancellationToken);
        return data is null ? ApiResponse<PaymentStatusResponse>.Fail("Order was not found.", 404) : ApiResponse<PaymentStatusResponse>.Ok(data);
    }

    public async Task<ApiResponse<PendingOrderSummaryResponse>> GetPendingSummaryAsync(Guid orderId, CancellationToken cancellationToken = default)
    {
        var claims = claimsHelper.GetCustomer();
        if (!claims.Success || claims.Data is null) return ApiResponse<PendingOrderSummaryResponse>.Fail(claims.Message, claims.StatusCode);

        var order = await db.Orders.AsNoTracking()
            .Include(x => x.Items)
            .Include(x => x.Addresses)
            .Include(x => x.Payments)
            .Where(x => x.Id == orderId && x.CustomerId == claims.Data.CustomerId)
            .SingleOrDefaultAsync(cancellationToken);

        if (order is null) return ApiResponse<PendingOrderSummaryResponse>.Fail("Order was not found.", 404);

        var latestPayment = order.Payments.OrderByDescending(p => p.CreatedOn).FirstOrDefault();
        var paymentStatus = latestPayment?.Status.ToString() ?? PaymentStatus.Pending.ToString();
        var isPaid = latestPayment?.Status == PaymentStatus.Paid;
        var canRetry = order.Status == OrderStatus.PendingPayment && order.PaymentExpiresOn > DateTime.UtcNow && !isPaid;

        var shippingAddress = order.Addresses.FirstOrDefault(a => a.Type == "Shipping");
        var billingAddress = order.Addresses.FirstOrDefault(a => a.Type == "Billing");

        var shippingDto = shippingAddress is null ? null : new PendingOrderAddressResponse(
            shippingAddress.Type,
            shippingAddress.RecipientName,
            shippingAddress.MobileNumber,
            shippingAddress.Email,
            shippingAddress.AddressLine1,
            shippingAddress.AddressLine2,
            shippingAddress.Landmark,
            shippingAddress.City,
            shippingAddress.State,
            shippingAddress.PostalCode,
            shippingAddress.Country);

        var billingDto = billingAddress is null ? null : new PendingOrderAddressResponse(
            billingAddress.Type,
            billingAddress.RecipientName,
            billingAddress.MobileNumber,
            billingAddress.Email,
            billingAddress.AddressLine1,
            billingAddress.AddressLine2,
            billingAddress.Landmark,
            billingAddress.City,
            billingAddress.State,
            billingAddress.PostalCode,
            billingAddress.Country);

        var itemsDto = order.Items.Select(i => new PendingOrderItemResponse(
            i.ProductId,
            i.ProductVariantId,
            i.ProductName,
            i.ProductSlug,
            i.VariantName,
            i.Sku,
            i.Quantity,
            i.UnitPrice,
            i.UnitMrp,
            i.LineTotal,
            i.Weight,
            i.WeightUnit)).ToList();

        var settings = await settingsService.GetCurrentAsync(cancellationToken);

        var response = new PendingOrderSummaryResponse(
            order.Id,
            order.OrderNumber,
            order.Status.ToString(),
            paymentStatus,
            order.PaymentExpiresOn,
            order.Subtotal,
            order.ItemDiscountAmount,
            order.CouponDiscountAmount,
            order.ShippingAmount,
            order.TaxAmount,
            order.ProductTaxAmount,
            order.PaymentServiceTaxAmount,
            order.ProductTaxRatePercent,
            order.PaymentServiceTaxRatePercent,
            order.GrandTotal,
            order.Currency,
            order.CouponCode,
            order.SelectedCourierName,
            order.EstimatedDeliveryOn,
            settings.StoreName,
            shippingDto,
            billingDto,
            itemsDto,
            canRetry,
            isPaid);

        return ApiResponse<PendingOrderSummaryResponse>.Ok(response);
    }

    public async Task<ApiResponse<CancelPendingOrderResponse>> CancelPendingAsync(Guid orderId, CancellationToken cancellationToken = default)
    {
        var claims = claimsHelper.GetCustomer();
        if (!claims.Success || claims.Data is null) return ApiResponse<CancelPendingOrderResponse>.Fail(claims.Message, claims.StatusCode);

        var order = await db.Orders
            .Include(x => x.Payments)
            .SingleOrDefaultAsync(x => x.Id == orderId && x.CustomerId == claims.Data.CustomerId, cancellationToken);

        if (order is null) return ApiResponse<CancelPendingOrderResponse>.Fail("Order was not found.", 404);

        var payment = order.Payments.OrderByDescending(p => p.CreatedOn).FirstOrDefault();
        if (order.Status != OrderStatus.PendingPayment || (payment is not null && payment.Status == PaymentStatus.Paid))
            return ApiResponse<CancelPendingOrderResponse>.Fail("This order cannot be cancelled because it is not awaiting payment.", 409);

        var strategy = db.Database.CreateExecutionStrategy();
        await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
            var now = DateTime.UtcNow;

            var reservations = await db.InventoryReservations
                .Where(x => x.OrderId == orderId && x.Status == InventoryReservationStatus.Reserved)
                .ToListAsync(cancellationToken);

            foreach (var reservation in reservations)
            {
                await db.ProductVariants.Where(x => x.Id == reservation.ProductVariantId)
                    .ExecuteUpdateAsync(s => s.SetProperty(x => x.StockQuantity, x => x.StockQuantity + reservation.Quantity), cancellationToken);
                reservation.Status = InventoryReservationStatus.Released;
                reservation.ReleasedOn = now;
            }

            await db.CouponUsages.Where(x => x.OrderId == orderId && x.Status == CouponEnums.CouponUsageStatus.Reserved)
                .ExecuteUpdateAsync(s => s.SetProperty(x => x.Status, CouponEnums.CouponUsageStatus.Released)
                    .SetProperty(x => x.ReleasedOn, now).SetProperty(x => x.ReleaseReason, "Cancelled by customer"), cancellationToken);

            order.Status = OrderStatus.Cancelled;
            order.UpdatedOn = now;
            if (payment is not null)
            {
                payment.Status = PaymentStatus.Failed;
                payment.LastError = "Cancelled by customer.";
                payment.UpdatedOn = now;
                db.PaymentTransactions.Add(Transaction(payment.Id, "CustomerCancellation", payment.ProviderPaymentId, "Cancelled", null));
            }

            db.OrderStatusHistories.Add(new OrderStatusHistory
            {
                Id = Guid.NewGuid(),
                OrderId = orderId,
                Status = OrderStatus.Cancelled,
                Note = "Order reservation cancelled by customer.",
                CreatedOn = now
            });

            var checkoutSession = await db.CheckoutSessions.AsNoTracking()
                .SingleOrDefaultAsync(x => x.Id == order.CheckoutSessionId, cancellationToken);
            if (checkoutSession is not null)
            {
                var cart = await db.Carts.SingleOrDefaultAsync(x => x.Id == checkoutSession.CartId && x.CustomerId == claims.Data.CustomerId, cancellationToken);
                if (cart is not null && cart.Status == CartStatus.Converted)
                {
                    cart.Status = CartStatus.Active;
                    cart.ConvertedToOrderOn = null;
                    cart.Version++;
                    cart.UpdatedOn = now;
                }
            }

            await db.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            cache.RemoveByPrefix(CacheKey.Products.AllPrefix, "Order pending payment cancelled - stock restored");
            cache.RemoveByPrefix(CacheKey.Categories.AllPrefix, "Order pending payment cancelled - stock restored");
            cache.RemoveByPrefix(CacheKey.Sales.AllPrefix, "Order pending payment cancelled - sales report updated");
            if (order.CouponId.HasValue)
                cache.RemoveByPrefix(CacheKey.Coupons.AllPrefix, "Order pending payment cancelled - coupon released");
        });

        return ApiResponse<CancelPendingOrderResponse>.Ok(
            new CancelPendingOrderResponse(order.Id, order.OrderNumber, OrderStatus.Cancelled.ToString(), "Order reservation was cancelled and your cart has been restored."));
    }

    public async Task<int> ProcessWebhookAsync(string body, string signature, CancellationToken cancellationToken = default)
    {
        var credentials = await CredentialsAsync(cancellationToken);
        if (!VerifySignature(body, signature, credentials.WebhookSecret)) throw new UnauthorizedAccessException("Invalid webhook signature.");
        using var json = JsonDocument.Parse(body);
        var root = json.RootElement;
        var eventType = RequiredString(root, "event");
        var eventId = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(body))).ToLowerInvariant();
        if (await db.WebhookInboxEvents.AnyAsync(x => x.Provider == ProviderKey.Razorpay && x.ProviderEventId == eventId, cancellationToken)) return 0;
        var inbox = new WebhookInboxEvent { Id = Guid.NewGuid(), Provider = ProviderKey.Razorpay, ProviderEventId = eventId,
            EventType = eventType, PayloadJson = body, ReceivedOn = DateTime.UtcNow };
        db.WebhookInboxEvents.Add(inbox);
        await db.SaveChangesAsync(cancellationToken);
        if (eventType == "payment.captured")
        {
            var entity = root.GetProperty("payload").GetProperty("payment").GetProperty("entity");
            var providerPaymentId = RequiredString(entity, "id");
            var providerOrderId = RequiredString(entity, "order_id");
            var payment = await db.Payments.Include(x => x.Order).SingleOrDefaultAsync(x => x.ProviderOrderId == providerOrderId, cancellationToken);
            if (payment is not null && entity.GetProperty("amount").GetInt64() == payment.AmountPaise &&
                string.Equals(RequiredString(entity, "currency"), payment.Currency, StringComparison.OrdinalIgnoreCase))
            {
                await ConfirmAsync(payment, providerPaymentId, "Webhook", cancellationToken);
            }
        }
        else if (eventType == "payment.failed")
        {
            var entity = root.GetProperty("payload").GetProperty("payment").GetProperty("entity");
            var providerPaymentId = RequiredString(entity, "id");
            var providerOrderId = RequiredString(entity, "order_id");
            var payment = await db.Payments.Include(x => x.Order).SingleOrDefaultAsync(x => x.ProviderOrderId == providerOrderId, cancellationToken);
            if (payment is not null && payment.Status != PaymentStatus.Paid)
            {
                var errorDesc = entity.TryGetProperty("error_description", out var desc) ? desc.GetString() : "Payment attempt failed.";
                db.PaymentTransactions.Add(Transaction(payment.Id, "Webhook", providerPaymentId, "AttemptFailed", errorDesc));
                payment.LastError = errorDesc;
                payment.UpdatedOn = DateTime.UtcNow;
                await db.SaveChangesAsync(cancellationToken);
            }
        }
        inbox.ProcessedOn = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        return 1;
    }

    public async Task<int> ExpirePendingAsync(CancellationToken cancellationToken = default)
    {
        var ids = await db.Payments.Where(x => (x.Status == PaymentStatus.Pending || x.Status == PaymentStatus.ProviderOrderCreated) && x.ExpiresOn <= DateTime.UtcNow)
            .OrderBy(x => x.ExpiresOn).Select(x => x.OrderId).Take(100).ToListAsync(cancellationToken);
        foreach (var id in ids)
        {
            var payment = await db.Payments.Include(x => x.Order).SingleAsync(x => x.OrderId == id, cancellationToken);
            await ReleaseAsync(payment, PaymentStatus.Expired, OrderStatus.Expired, "Payment window expired.", cancellationToken);
        }
        return ids.Count;
    }

    public async Task<int> ReconcilePendingAsync(CancellationToken cancellationToken = default)
    {
        var payments = await db.Payments.Include(x => x.Order)
            .Where(x => x.Status == PaymentStatus.ProviderOrderCreated && x.ProviderOrderId != null && x.ExpiresOn > DateTime.UtcNow && x.UpdatedOn < DateTime.UtcNow.AddMinutes(-2))
            .OrderBy(x => x.UpdatedOn).Take(50).ToListAsync(cancellationToken);
        if (payments.Count == 0) return 0;
        var credentials = await CredentialsAsync(cancellationToken);
        var reconciled = 0;
        foreach (var payment in payments)
        {
            try
            {
                using var request = new HttpRequestMessage(HttpMethod.Get, $"orders/{Uri.EscapeDataString(payment.ProviderOrderId!)}/payments");
                Authorize(request, credentials);
                using var response = await httpClient.SendAsync(request, cancellationToken);
                if (!response.IsSuccessStatusCode) continue;
                using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync(cancellationToken));
                if (!json.RootElement.TryGetProperty("items", out var itemsElement) || itemsElement.ValueKind != JsonValueKind.Array) continue;

                var items = itemsElement.EnumerateArray().ToList();
                var captured = items.FirstOrDefault(item =>
                    item.GetProperty("amount").GetInt64() == payment.AmountPaise &&
                    string.Equals(RequiredString(item, "currency"), payment.Currency, StringComparison.OrdinalIgnoreCase) &&
                    RequiredString(item, "status") == "captured");

                if (captured.ValueKind != JsonValueKind.Undefined)
                {
                    var providerPaymentId = RequiredString(captured, "id");
                    await ConfirmAsync(payment, providerPaymentId, "Reconciliation", cancellationToken);
                    reconciled++;
                }
            }
            catch (Exception exception) when (exception is not OperationCanceledException)
            {
                logger.LogWarning(exception, "Razorpay reconciliation failed for order {OrderId}.", payment.OrderId);
            }
        }
        return reconciled;
    }

    private async Task ConfirmAsync(Payment payment, string providerPaymentId, string source, CancellationToken token)
    {
        if (payment.Status == PaymentStatus.Paid) return;
        var strategy = db.Database.CreateExecutionStrategy();
        await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await db.Database.BeginTransactionAsync(token);
            var now = DateTime.UtcNow;
            payment.ProviderPaymentId = providerPaymentId; payment.Status = PaymentStatus.Paid; payment.PaidOn = now; payment.UpdatedOn = now;
            payment.Order.Status = OrderStatus.Confirmed; payment.Order.UpdatedOn = now;

            var releasedReservations = await db.InventoryReservations
                .Where(x => x.OrderId == payment.OrderId && x.Status == InventoryReservationStatus.Released)
                .ToListAsync(token);
            foreach (var reservation in releasedReservations)
            {
                await db.ProductVariants.Where(x => x.Id == reservation.ProductVariantId)
                    .ExecuteUpdateAsync(s => s.SetProperty(x => x.StockQuantity, x => x.StockQuantity - reservation.Quantity), token);
                reservation.Status = InventoryReservationStatus.Completed;
                reservation.CompletedOn = now;
            }

            await db.InventoryReservations.Where(x => x.OrderId == payment.OrderId && x.Status == InventoryReservationStatus.Reserved)
                .ExecuteUpdateAsync(s => s.SetProperty(x => x.Status, InventoryReservationStatus.Completed).SetProperty(x => x.CompletedOn, now), token);

            await db.CouponUsages.Where(x => x.OrderId == payment.OrderId && (x.Status == CouponEnums.CouponUsageStatus.Reserved || x.Status == CouponEnums.CouponUsageStatus.Released))
                .ExecuteUpdateAsync(s => s.SetProperty(x => x.Status, CouponEnums.CouponUsageStatus.Redeemed)
                    .SetProperty(x => x.RedeemedOn, now)
                    .SetProperty(x => x.ReleaseReason, (string?)null), token);

            db.OrderStatusHistories.Add(new() { Id = Guid.NewGuid(), OrderId = payment.OrderId, Status = OrderStatus.Confirmed, Note = "Payment captured and verified.", CreatedOn = now });
            db.PaymentTransactions.Add(Transaction(payment.Id, source, providerPaymentId, "Captured", null));
            db.OutboxMessages.Add(new() { Id = Guid.NewGuid(), Type = "CreateShiprocketOrder", AggregateId = payment.OrderId.ToString(), PayloadJson = JsonSerializer.Serialize(new { orderId = payment.OrderId }), CreatedOn = now, NextAttemptOn = now });

            var checkoutSession = await db.CheckoutSessions.AsNoTracking()
                .SingleOrDefaultAsync(x => x.Id == payment.Order.CheckoutSessionId, token);
            if (checkoutSession is not null)
            {
                var cart = await db.Carts.SingleOrDefaultAsync(x => x.Id == checkoutSession.CartId && x.CustomerId == payment.Order.CustomerId, token);
                if (cart is not null && cart.Status == CartStatus.Active)
                {
                    cart.Status = CartStatus.Converted;
                    cart.ConvertedToOrderOn = now;
                    cart.Version++;
                    cart.UpdatedOn = now;
                }
            }

            await db.SaveChangesAsync(token);
            var notification = await notifications.CreateAsync(new CreateAdminNotification(AdminNotificationTypes.PaymentSucceeded, NotificationSeverities.Success,
                "Payment received", $"Payment for order {payment.Order.OrderNumber} was captured successfully.", "Order", payment.OrderId.ToString(), "/admin/orders"), false, token);
            if (notification is not null) db.OutboxMessages.Add(NotificationOutbox(notification.Id, now));
            await db.SaveChangesAsync(token);
            await transaction.CommitAsync(token);

            cache.RemoveByPrefix(CacheKey.Products.AllPrefix, "Order payment confirmed - stock finalized");
            cache.RemoveByPrefix(CacheKey.Categories.AllPrefix, "Order payment confirmed - stock finalized");
            cache.RemoveByPrefix(CacheKey.Sales.AllPrefix, "Order payment confirmed - sales report updated");
            if (payment.Order.CouponId.HasValue)
                cache.RemoveByPrefix(CacheKey.Coupons.AllPrefix, "Order payment confirmed - coupon redeemed");
        });
    }

    private async Task FailAsync(Payment payment, string providerPaymentId, CancellationToken token)
    {
        if (payment.Status == PaymentStatus.Paid) return;
        payment.ProviderPaymentId = providerPaymentId;
        await ReleaseAsync(payment, PaymentStatus.Failed, OrderStatus.PaymentFailed, "Payment failed.", token);
    }

    private async Task ReleaseAsync(Payment payment, PaymentStatus paymentStatus, OrderStatus orderStatus, string reason, CancellationToken token)
    {
        var strategy = db.Database.CreateExecutionStrategy();
        await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await db.Database.BeginTransactionAsync(token);
            var reservations = await db.InventoryReservations.Where(x => x.OrderId == payment.OrderId && x.Status == InventoryReservationStatus.Reserved).ToListAsync(token);
            foreach (var reservation in reservations)
            {
                await db.ProductVariants.Where(x => x.Id == reservation.ProductVariantId)
                    .ExecuteUpdateAsync(s => s.SetProperty(x => x.StockQuantity, x => x.StockQuantity + reservation.Quantity), token);
                reservation.Status = InventoryReservationStatus.Released; reservation.ReleasedOn = DateTime.UtcNow;
            }
            var now = DateTime.UtcNow;
            payment.Status = paymentStatus; payment.LastError = reason; payment.UpdatedOn = now;
            payment.Order.Status = orderStatus; payment.Order.UpdatedOn = now;
            await db.CouponUsages.Where(x => x.OrderId == payment.OrderId && x.Status == CouponEnums.CouponUsageStatus.Reserved)
                .ExecuteUpdateAsync(s => s.SetProperty(x => x.Status, CouponEnums.CouponUsageStatus.Released)
                    .SetProperty(x => x.ReleasedOn, now).SetProperty(x => x.ReleaseReason, reason), token);
            db.OrderStatusHistories.Add(new() { Id = Guid.NewGuid(), OrderId = payment.OrderId, Status = orderStatus, Note = reason, CreatedOn = now });
            db.PaymentTransactions.Add(Transaction(payment.Id, "FinalStatus", payment.ProviderPaymentId, paymentStatus.ToString(), null));

            var checkoutSession = await db.CheckoutSessions.AsNoTracking()
                .SingleOrDefaultAsync(x => x.Id == payment.Order.CheckoutSessionId, token);
            if (checkoutSession is not null)
            {
                var cart = await db.Carts.SingleOrDefaultAsync(x => x.Id == checkoutSession.CartId && x.CustomerId == payment.Order.CustomerId, token);
                if (cart is not null && cart.Status == CartStatus.Converted)
                {
                    cart.Status = CartStatus.Active;
                    cart.ConvertedToOrderOn = null;
                    cart.Version++;
                    cart.UpdatedOn = now;
                }
            }

            await db.SaveChangesAsync(token);
            var notificationType = paymentStatus == PaymentStatus.Expired ? AdminNotificationTypes.PaymentExpired : AdminNotificationTypes.PaymentFailed;
            var notification = await notifications.CreateAsync(new CreateAdminNotification(notificationType, NotificationSeverities.Error,
                "Payment not completed", $"Payment for order {payment.Order.OrderNumber} failed or expired.", "Order", payment.OrderId.ToString(), "/admin/orders"), false, token);
            if (notification is not null) db.OutboxMessages.Add(NotificationOutbox(notification.Id, now));
            await db.SaveChangesAsync(token);
            await transaction.CommitAsync(token);

            cache.RemoveByPrefix(CacheKey.Products.AllPrefix, "Order payment released - stock restored");
            cache.RemoveByPrefix(CacheKey.Categories.AllPrefix, "Order payment released - stock restored");
            cache.RemoveByPrefix(CacheKey.Sales.AllPrefix, "Order payment released/failed - sales report updated");
            if (payment.Order.CouponId.HasValue)
                cache.RemoveByPrefix(CacheKey.Coupons.AllPrefix, "Order payment released - coupon released");
        });
    }

    private async Task RecordInitiationFailureAsync(Payment payment, Order order, CancellationToken token)
    {
        payment.LastError = "Payment provider order creation failed."; payment.UpdatedOn = DateTime.UtcNow;
        db.PaymentTransactions.Add(Transaction(payment.Id, "ProviderOrderCreation", null, "Failed", null));
        await db.SaveChangesAsync(token);
        var notification = await notifications.CreateAsync(new CreateAdminNotification(AdminNotificationTypes.PaymentFailed,
            NotificationSeverities.Warning, "Payment provider unavailable", $"Payment could not be started for order {order.OrderNumber}; the customer can retry.",
            "Order", order.Id.ToString(), "/admin/orders", DeduplicationKey: $"payment:{payment.Id}:initiation-failed"), false, token);
        if (notification is not null) db.OutboxMessages.Add(NotificationOutbox(notification.Id, DateTime.UtcNow));
        await db.SaveChangesAsync(token);
    }

    private async Task<ProviderPayment> FetchPaymentAsync(string id, RazorpayProviderCredentials credentials, CancellationToken token)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, $"payments/{Uri.EscapeDataString(id)}"); Authorize(request, credentials);
        using var response = await httpClient.SendAsync(request, token);
        if (!response.IsSuccessStatusCode) throw new InvalidOperationException("Payment could not be confirmed with the provider.");
        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync(token));
        return new(RequiredString(json.RootElement, "order_id"), json.RootElement.GetProperty("amount").GetInt64(),
            RequiredString(json.RootElement, "currency"), RequiredString(json.RootElement, "status"));
    }

    private Task<RazorpayProviderCredentials> CredentialsAsync(CancellationToken token) =>
        credentialsService.GetRequiredAsync<RazorpayProviderCredentials>(ProviderKey.Razorpay, token);
    private static void Authorize(HttpRequestMessage request, RazorpayProviderCredentials c) => request.Headers.Authorization =
        new AuthenticationHeaderValue("Basic", Convert.ToBase64String(Encoding.UTF8.GetBytes($"{c.ApiKey}:{c.KeySecret}")));
    private static bool VerifySignature(string payload, string supplied, string secret)
    {
        if (string.IsNullOrWhiteSpace(supplied)) return false;
        var expected = HMACSHA256.HashData(Encoding.UTF8.GetBytes(secret), Encoding.UTF8.GetBytes(payload));
        try { return CryptographicOperations.FixedTimeEquals(expected, Convert.FromHexString(supplied)); } catch (FormatException) { return false; }
    }
    private static string RequiredString(JsonElement e, string property) => e.GetProperty(property).GetString() ?? throw new JsonException($"Missing {property}.");
    private static PaymentTransaction Transaction(Guid paymentId, string type, string? reference, string status, object? safePayload) =>
        new() { Id = Guid.NewGuid(), PaymentId = paymentId, Type = type, ProviderReference = reference, Status = status,
            SafePayloadJson = safePayload is null ? null : JsonSerializer.Serialize(safePayload), CreatedOn = DateTime.UtcNow };
    private static OutboxMessage NotificationOutbox(Guid id, DateTime now) => new() { Id = Guid.NewGuid(), Type = "BroadcastAdminNotification",
        AggregateId = id.ToString(), PayloadJson = JsonSerializer.Serialize(new { notificationId = id }), CreatedOn = now, NextAttemptOn = now };
    private static ApiResponse<PaymentVerificationResponse> Success(Payment p) => ApiResponse<PaymentVerificationResponse>.Ok(
        new(p.OrderId, p.Order.OrderNumber, p.Order.Status.ToString(), p.Status.ToString(), true), "Payment verified successfully.");
    private sealed record ProviderPayment(string OrderId, long Amount, string Currency, string Status);
}
