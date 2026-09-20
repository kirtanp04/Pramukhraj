using System.Text.Json;
using FluentValidation.Results;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using pramukhraj.Common;
using pramukhraj.Database;
using pramukhraj.DTOs.Checkout;
using pramukhraj.DTOs.Notifications;
using pramukhraj.DTOs.Order;
using pramukhraj.Entities.Cart;
using pramukhraj.Entities.Coupon;
using pramukhraj.Entities.Notifications;
using pramukhraj.Entities.Order;
using pramukhraj.Interfaces;

namespace pramukhraj.Services;

public sealed class OrderService(
    AppDbContext db, CustomerClaimsHelper claimsHelper, IValidatorManager validators,
    IPricingService pricingService, IStoreSettingsService settingsService,
    IPaymentService paymentService, IAdminNotificationService notifications,
    ILogger<OrderService> logger) : IOrderService
{
    private static readonly TimeSpan PaymentLifetime = TimeSpan.FromMinutes(20);

    public async Task<ApiResponse<PlaceOrderResponse>> PlaceAsync(PlaceOrderRequest request, string idempotencyKey, CancellationToken cancellationToken = default)
    {
        if (request is null) return ApiResponse<PlaceOrderResponse>.Fail("Order details are required.", 400);
        var validation = await validators.PlaceOrderRequest.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid) return ValidationFailure(validation);
        if (!Guid.TryParse(idempotencyKey, out var requestId) || requestId == Guid.Empty)
            return ApiResponse<PlaceOrderResponse>.Fail("A valid Idempotency-Key header is required.", 400);
        var claims = claimsHelper.GetCustomer();
        if (!claims.Success || claims.Data is null) return ApiResponse<PlaceOrderResponse>.Fail(claims.Message, claims.StatusCode, claims.Errors);
        var customerId = claims.Data.CustomerId;
        try
        {
            var customer = await db.Customers.AsNoTracking().SingleOrDefaultAsync(x => x.Id == customerId, cancellationToken);
            if (customer is null || !customer.IsActive || customer.IsBlocked || customer.IsDeleted || !customer.IsMobileVerified || !customer.IsEmailVerified)
                return ApiResponse<PlaceOrderResponse>.Fail("A verified active customer account is required.", 403);

            var existing = await db.Orders.AsNoTracking().SingleOrDefaultAsync(x => x.IdempotencyKey == idempotencyKey, cancellationToken);
            if (existing is not null)
            {
                if (existing.CustomerId != customerId) return ApiResponse<PlaceOrderResponse>.Fail("The idempotency key is already in use.", 409);
                return await ExistingResponseAsync(existing, customerId, cancellationToken);
            }

            var prepared = await PrepareAsync(request.CheckoutSessionId, customerId, cancellationToken);
            if (!prepared.Success) return ApiResponse<PlaceOrderResponse>.Fail(prepared.Message, prepared.StatusCode, prepared.Errors);
            var data = prepared.Data!;
            var orderId = Guid.NewGuid();
            var paymentId = Guid.NewGuid();
            var now = DateTime.UtcNow;
            var orderNumber = $"ORD-{now:yyyyMMddHHmmss}-{orderId.ToString("N")[..6].ToUpperInvariant()}";
            var strategy = db.Database.CreateExecutionStrategy();
            await strategy.ExecuteAsync(async () =>
            {
                db.ChangeTracker.Clear();
                await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
                if (await db.Orders.AnyAsync(x => x.IdempotencyKey == idempotencyKey || x.CheckoutSessionId == request.CheckoutSessionId, cancellationToken))
                    throw new DuplicateOrderException();
                var session = await db.CheckoutSessions.SingleAsync(x => x.Id == request.CheckoutSessionId && x.CustomerId == customerId, cancellationToken);
                var cart = await db.Carts.SingleAsync(x => x.Id == session.CartId && x.CustomerId == customerId, cancellationToken);
                if (session.ConsumedOn is not null || session.ExpiresOn <= now || cart.Status != CartStatus.Active || cart.Version != session.CartVersion)
                    throw new CheckoutConflictException();

                foreach (var line in data.Lines)
                {
                    var updated = await db.ProductVariants.Where(x => x.Id == line.VariantId && x.IsActive && x.StockQuantity >= line.Quantity)
                        .ExecuteUpdateAsync(setters => setters.SetProperty(x => x.StockQuantity, x => x.StockQuantity - line.Quantity), cancellationToken);
                    if (updated != 1) throw new InventoryConflictException();
                }

                var order = BuildOrder(orderId, orderNumber, idempotencyKey, request.CustomerNote, customerId, session, data.Pricing, now);
                db.Orders.Add(order);
                var allocatedDiscount = 0m;
                var allocatedTax = 0m;
                for (var index = 0; index < data.Lines.Count; index++)
                {
                    var line = data.Lines[index];
                    var baseAmount = line.UnitPrice * line.Quantity;
                    var discount = index == data.Lines.Count - 1 ? data.Pricing.CouponDiscountAmount - allocatedDiscount
                        : Math.Round(data.Pricing.CouponDiscountAmount * baseAmount / data.Pricing.Subtotal, 2, MidpointRounding.AwayFromZero);
                    var taxable = baseAmount - discount;
                    var tax = index == data.Lines.Count - 1 ? data.Pricing.ProductTaxAmount - allocatedTax
                        : Math.Round(taxable * data.Pricing.TaxRatePercent / 100m, 2, MidpointRounding.AwayFromZero);
                    allocatedDiscount += discount; allocatedTax += tax;
                    order.Items.Add(new OrderItem { Id = Guid.NewGuid(), ProductId = line.ProductId, ProductVariantId = line.VariantId,
                        ProductName = line.ProductName, ProductSlug = line.ProductSlug, VariantName = line.VariantName, Sku = line.Sku,
                        Weight = line.Weight, WeightUnit = line.WeightUnit, Quantity = line.Quantity, UnitPrice = line.UnitPrice,
                        UnitMrp = line.UnitMrp, TaxPercentage = data.Pricing.TaxRatePercent, TaxableAmount = taxable,
                        DiscountAmount = discount + Math.Max(0, (line.UnitMrp - line.UnitPrice) * line.Quantity), TaxAmount = tax, LineTotal = taxable + tax });
                    db.InventoryReservations.Add(new InventoryReservation { Id = Guid.NewGuid(), OrderId = orderId,
                        ProductVariantId = line.VariantId, Quantity = line.Quantity, ExpiresOn = order.PaymentExpiresOn, CreatedOn = now });
                }
                order.Addresses.Add(Snapshot(data.ShippingAddress, orderId, "Shipping"));
                order.Addresses.Add(Snapshot(data.BillingAddress, orderId, "Billing"));
                db.OrderStatusHistories.Add(new OrderStatusHistory { Id = Guid.NewGuid(), OrderId = orderId, Status = OrderStatus.PendingPayment, Note = "Order created; awaiting verified payment.", CreatedOn = now });
                db.Payments.Add(new Payment { Id = paymentId, OrderId = orderId, IdempotencyKey = idempotencyKey, AmountPaise = ToPaise(order.GrandTotal), Currency = order.Currency, ExpiresOn = order.PaymentExpiresOn, CreatedOn = now, UpdatedOn = now });
                if (session.CouponId.HasValue)
                    db.CouponUsages.Add(new CouponUsage { Id = Guid.NewGuid(), CouponId = session.CouponId.Value, CustomerId = customerId,
                        OrderId = orderId, CouponCode = session.CouponCode!, OrderSubtotal = session.Subtotal,
                        DiscountAmount = session.CouponDiscountAmount, Status = CouponEnums.CouponUsageStatus.Reserved,
                        ReservationExpiresOn = order.PaymentExpiresOn, CreatedOn = now });
                session.ConsumedOn = now; session.UpdatedOn = now; session.ConcurrencyStamp = Guid.NewGuid().ToString("N");
                cart.Status = CartStatus.Converted; cart.ConvertedToOrderOn = now; cart.UpdatedOn = now; cart.ConcurrencyStamp = Guid.NewGuid().ToString("N");
                await db.SaveChangesAsync(cancellationToken);
                var notification = await notifications.CreateAsync(new CreateAdminNotification(AdminNotificationTypes.OrderPlaced,
                    NotificationSeverities.Info, "New prepaid order", $"Order {orderNumber} was placed and is awaiting payment.",
                    "Order", orderId.ToString(), "/admin/orders"), false, cancellationToken);
                if (notification is not null) db.OutboxMessages.Add(Outbox("BroadcastAdminNotification", notification.Id, now));
                await db.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);
            });

            try
            {
                var checkout = await paymentService.EnsureProviderOrderAsync(orderId, customerId, cancellationToken);
                return new ApiResponse<PlaceOrderResponse> { Success = true, StatusCode = 201, Message = "Order placed. Complete payment to confirm it.",
                    Data = new(orderId, orderNumber, OrderStatus.PendingPayment.ToString(), PaymentStatus.ProviderOrderCreated.ToString(), checkout, null) };
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Razorpay order creation failed for local order {OrderId}.", orderId);
                return new ApiResponse<PlaceOrderResponse> { Success = true, StatusCode = 201,
                    Message = "Order was reserved, but payment could not be started. Please retry payment.",
                    Data = new(orderId, orderNumber, OrderStatus.PendingPayment.ToString(), PaymentStatus.Pending.ToString(), null, "Payment provider is temporarily unavailable.") };
            }
        }
        catch (DuplicateOrderException)
        {
            var existing = await db.Orders.AsNoTracking().SingleAsync(x => x.IdempotencyKey == idempotencyKey || x.CheckoutSessionId == request.CheckoutSessionId, cancellationToken);
            return existing.CustomerId == customerId ? await ExistingResponseAsync(existing, customerId, cancellationToken) : ApiResponse<PlaceOrderResponse>.Fail("Order already exists.", 409);
        }
        catch (Exception exception) when (exception is CheckoutConflictException or InventoryConflictException)
        {
            return ApiResponse<PlaceOrderResponse>.Fail(exception is InventoryConflictException ? "Stock changed. Refresh checkout and try again." : "Checkout changed or expired. Refresh checkout and try again.", 409);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { throw; }
        catch (Exception exception)
        {
            logger.LogError(exception, "Order placement failed for customer {CustomerId}.", customerId);
            return ApiResponse<PlaceOrderResponse>.Fail("Unable to place the order right now. Please try again.", 500);
        }
    }

    private async Task<ApiResponse<PreparedOrder>> PrepareAsync(Guid sessionId, Guid customerId, CancellationToken token)
    {
        var session = await db.CheckoutSessions.AsNoTracking().SingleOrDefaultAsync(x => x.Id == sessionId && x.CustomerId == customerId, token);
        if (session is null) return ApiResponse<PreparedOrder>.Fail("Checkout session was not found.", 404);
        if (session.ConsumedOn is not null || session.ExpiresOn <= DateTime.UtcNow || session.ShippingQuoteExpiresOn <= DateTime.UtcNow)
            return ApiResponse<PreparedOrder>.Fail("Checkout expired. Refresh checkout and try again.", 409);
        if (!session.ShippingAddressId.HasValue || !session.BillingAddressId.HasValue) return ApiResponse<PreparedOrder>.Fail("Shipping and billing addresses are required.", 409);
        var cart = await db.Carts.AsNoTracking().Where(x => x.Id == session.CartId && x.CustomerId == customerId && x.Status == CartStatus.Active)
            .Include(x => x.Items.Where(i => i.IsSelected)).ThenInclude(x => x.ProductVariant).ThenInclude(x => x.Product).SingleOrDefaultAsync(token);
        if (cart is null || cart.Version != session.CartVersion || cart.Items.Count == 0) return ApiResponse<PreparedOrder>.Fail("Cart changed. Refresh checkout and try again.", 409);
        var lines = cart.Items.Select(x => new PreparedLine(x.ProductVariant.ProductId, x.ProductVariantId,
            x.ProductVariant.Product.Name, x.ProductVariant.Product.Slug, x.ProductVariant.Name, x.ProductVariant.SKU,
            x.Quantity, x.ProductVariant.Price, x.ProductVariant.MRP, x.ProductVariant.Weight, x.ProductVariant.WeightUnit,
            x.ProductVariant.StockQuantity, x.ProductVariant.IsActive && x.ProductVariant.Product.IsActive)).ToList();
        if (lines.Any(x => !x.Active || x.Quantity <= 0 || x.Stock < x.Quantity)) return ApiResponse<PreparedOrder>.Fail("Product availability changed. Refresh checkout.", 409);
        if (session.CouponId.HasValue && !await db.Coupons.AsNoTracking().AnyAsync(x => x.Id == session.CouponId && x.IsActive && !x.IsDeleted && x.StartOn <= DateTime.UtcNow && x.EndOn > DateTime.UtcNow, token))
            return ApiResponse<PreparedOrder>.Fail("Coupon availability changed. Refresh checkout.", 409);
        var settings = await settingsService.GetCurrentAsync(token);
        var pricing = pricingService.Calculate(new PricingCalculationRequest(lines.Select(x => new PricingLine(x.ProductId, Guid.Empty, x.UnitPrice, x.UnitMrp, x.Quantity)).ToArray(),
            session.CouponDiscountAmount, session.CustomerShippingAmount, session.ProviderShippingCost,
            settings.TaxRatePercent ?? 0m, settings.PaymentServiceTaxRatePercent ?? 0m));
        if (pricing.Subtotal != session.Subtotal || pricing.ItemDiscountAmount != session.ItemDiscountAmount ||
            pricing.ProductTaxAmount != session.ProductTaxAmount || pricing.PaymentServiceTaxAmount != session.PaymentServiceTaxAmount ||
            pricing.TaxAmount != session.TaxAmount || pricing.GrandTotal != session.GrandTotal)
            return ApiResponse<PreparedOrder>.Fail("Prices changed. Refresh checkout and try again.", 409);
        var addresses = await db.CustomerAddresses.AsNoTracking().Where(x => x.CustomerId == customerId && x.IsActive && (x.Id == session.ShippingAddressId || x.Id == session.BillingAddressId)).ToListAsync(token);
        var shipping = addresses.SingleOrDefault(x => x.Id == session.ShippingAddressId);
        var billing = addresses.SingleOrDefault(x => x.Id == session.BillingAddressId);
        if (shipping is null || billing is null) return ApiResponse<PreparedOrder>.Fail("A selected address is unavailable. Refresh checkout.", 409);
        return ApiResponse<PreparedOrder>.Ok(new(lines, pricing, shipping, billing));
    }

    private async Task<ApiResponse<PlaceOrderResponse>> ExistingResponseAsync(Order order, Guid customerId, CancellationToken token)
    {
        RazorpayCheckoutResponse? checkout = null; string? error = null;
        try { if (order.Status == OrderStatus.PendingPayment) checkout = await paymentService.EnsureProviderOrderAsync(order.Id, customerId, token); }
        catch { error = "Payment provider is temporarily unavailable."; }
        var payment = await db.Payments.AsNoTracking().Where(x => x.OrderId == order.Id).OrderByDescending(x => x.CreatedOn).FirstAsync(token);
        return ApiResponse<PlaceOrderResponse>.Ok(new(order.Id, order.OrderNumber, order.Status.ToString(), payment.Status.ToString(), checkout, error), "Existing order returned for this request.");
    }

    private static Order BuildOrder(Guid id, string number, string key, string? note, Guid customerId, Entities.Checkout.CheckoutSession session, CheckoutPricingResponse p, DateTime now) => new()
    { Id = id, CustomerId = customerId, CheckoutSessionId = session.Id, OrderNumber = number, IdempotencyKey = key,
      CustomerNote = string.IsNullOrWhiteSpace(note) ? null : note.Trim(), Status = OrderStatus.PendingPayment,
      Subtotal = p.Subtotal, ItemDiscountAmount = p.ItemDiscountAmount, CouponDiscountAmount = p.CouponDiscountAmount,
      TaxAmount = p.TaxAmount, ProductTaxAmount = p.ProductTaxAmount, PaymentServiceTaxAmount = p.PaymentServiceTaxAmount,
      ProductTaxRatePercent = p.TaxRatePercent, PaymentServiceTaxRatePercent = p.PaymentServiceTaxRatePercent,
      ShippingAmount = p.CustomerShippingAmount, ProviderShippingCost = p.ProviderShippingCost,
      GrandTotal = p.GrandTotal, Currency = p.Currency, CouponId = session.CouponId, CouponCode = session.CouponCode,
      SelectedCourierId = session.SelectedCourierId, SelectedCourierName = session.SelectedCourierName,
      EstimatedDeliveryOn = session.EstimatedDeliveryOn, PaymentExpiresOn = now.Add(PaymentLifetime), CreatedOn = now, UpdatedOn = now };
    private static OrderAddress Snapshot(Entities.Customer.CustomerAddresses a, Guid orderId, string type) => new()
    { Id = Guid.NewGuid(), OrderId = orderId, Type = type, RecipientName = a.RecipientName, MobileNumber = a.MobileNumber,
      Email = a.Email, AddressLine1 = a.AddressLine1, AddressLine2 = a.AddressLine2, Landmark = a.Landmark,
      City = a.City, State = a.State, PostalCode = a.PostalCode, Country = a.Country };
    private static OutboxMessage Outbox(string type, Guid id, DateTime now) => new() { Id = Guid.NewGuid(), Type = type, AggregateId = id.ToString(), PayloadJson = JsonSerializer.Serialize(new { notificationId = id }), CreatedOn = now, NextAttemptOn = now };
    private static long ToPaise(decimal amount) => checked((long)Math.Round(amount * 100m, 0, MidpointRounding.AwayFromZero));
    private static ApiResponse<PlaceOrderResponse> ValidationFailure(ValidationResult result) => ApiResponse<PlaceOrderResponse>.Fail("Please correct the highlighted fields.", 400,
        result.Errors.GroupBy(x => x.PropertyName).ToDictionary(x => x.Key, x => x.Select(e => e.ErrorMessage).Distinct().ToArray()));
    private sealed record PreparedOrder(List<PreparedLine> Lines, CheckoutPricingResponse Pricing, Entities.Customer.CustomerAddresses ShippingAddress, Entities.Customer.CustomerAddresses BillingAddress);
    private sealed record PreparedLine(Guid ProductId, Guid VariantId, string ProductName, string ProductSlug, string VariantName, string Sku, int Quantity, decimal UnitPrice, decimal UnitMrp, decimal Weight, string WeightUnit, int Stock, bool Active);
    private sealed class DuplicateOrderException : Exception;
    private sealed class CheckoutConflictException : Exception;
    private sealed class InventoryConflictException : Exception;
}
