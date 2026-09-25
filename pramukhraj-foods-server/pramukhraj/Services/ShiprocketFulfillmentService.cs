using System.Globalization;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using pramukhraj.Common;
using pramukhraj.Database;
using pramukhraj.DTOs.Notifications;
using pramukhraj.DTOs.ProviderCredentials;
using pramukhraj.DTOs.Return;
using pramukhraj.DTOs.Shipment;
using pramukhraj.Entities.Notifications;
using pramukhraj.Entities.Order;
using pramukhraj.Entities.ProviderCredentials;
using pramukhraj.Entities.Return;
using pramukhraj.Entities.Shipment;
using pramukhraj.Interfaces;

namespace pramukhraj.Services;

public sealed partial class ShiprocketFulfillmentService(

    HttpClient httpClient,
    AppDbContext db,
    IProviderCredentialService providerCredentialService,
    ICacheService cache,
    IAdminNotificationService notifications,
    ILogger<ShiprocketFulfillmentService> logger) : IShiprocketFulfillmentService
{
    private const string TokenCacheKey = "provider:shiprocket:access-token";
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task<bool> CreateShipmentAsync(Guid orderId, CancellationToken cancellationToken = default)
    {
        var existing = await db.Shipments.FirstOrDefaultAsync(x => x.OrderId == orderId, cancellationToken);
        if (existing is not null)
        {
            if (existing.ProviderOrderId > 0 && existing.ProviderShipmentId > 0)
            {
                logger.LogInformation("Shipment already exists for order {OrderId} (ProviderShipmentId={ShipmentId}).", orderId, existing.ProviderShipmentId);
                return true;
            }

            var activities = await db.ShipmentActivities.Where(a => a.ShipmentId == existing.Id).ToListAsync(cancellationToken);
            db.ShipmentActivities.RemoveRange(activities);
            db.Shipments.Remove(existing);
            await db.SaveChangesAsync(cancellationToken);
        }

        var order = await db.Orders
            .Include(x => x.Items)
            .Include(x => x.Addresses)
            .Include(x => x.Payments)
            .SingleOrDefaultAsync(x => x.Id == orderId, cancellationToken);

        if (order is null)
        {
            logger.LogError("Order {OrderId} was not found for shipment creation.", orderId);
            return false;
        }

        var payment = order.Payments.OrderByDescending(p => p.CreatedOn).FirstOrDefault();
        if (order.Status != OrderStatus.Confirmed || payment?.Status != PaymentStatus.Paid)
        {
            logger.LogWarning("Order {OrderId} is not in Confirmed/Paid state (Status={OrderStatus}, PaymentStatus={PaymentStatus}). Shipment cannot be created.",
                orderId, order.Status, payment?.Status);
            return false;
        }

        var shippingAddress = order.Addresses.FirstOrDefault(a => a.Type == "Shipping")
            ?? order.Addresses.FirstOrDefault()
            ?? throw new InvalidOperationException($"No shipping address found for order {order.OrderNumber}.");

        var billingAddress = order.Addresses.FirstOrDefault(a => a.Type == "Billing") ?? shippingAddress;

        var credentials = await GetCredentialsAsync(cancellationToken);
        var pickupLocation = await ResolvePickupLocationAsync(credentials, cancellationToken);

        var calculatedWeightKg = order.Items.Sum(i => ConvertWeightToKg(i.Weight, i.WeightUnit) * Math.Max(1, i.Quantity));
        var totalWeight = Math.Max(0.05m, calculatedWeightKg);

        var requestBody = BuildCreateOrderRequestBody(order, billingAddress, shippingAddress, pickupLocation, totalWeight);

        HttpResponseMessage response;
        try
        {
            response = await SendAuthorizedAsync(HttpMethod.Post, "orders/create/adhoc", requestBody, cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to call Shiprocket create order API for order {OrderNumber}.", order.OrderNumber);
            await RecordShipmentNotificationAsync(AdminNotificationTypes.ShipmentCreationFailed, NotificationSeverities.Error,
                "Shipment creation failed", $"Could not contact Shiprocket for order {order.OrderNumber}.", order.Id, cancellationToken);
            throw;
        }

        using (response)
        {
            var responseJson = await response.Content.ReadAsStringAsync(cancellationToken);
            using var doc = JsonDocument.Parse(responseJson);
            var root = doc.RootElement.Clone();

            if (root.TryGetProperty("message", out var msgProp) &&
                msgProp.GetString()?.Contains("Wrong Pickup location", StringComparison.OrdinalIgnoreCase) == true &&
                root.TryGetProperty("data", out var dataObj) &&
                dataObj.TryGetProperty("data", out var locArray) &&
                locArray.ValueKind == JsonValueKind.Array)
            {
                var firstValidLoc = locArray.EnumerateArray()
                    .Select(x => x.TryGetProperty("pickup_location", out var p) ? p.GetString() : null)
                    .FirstOrDefault(x => !string.IsNullOrWhiteSpace(x));

                if (!string.IsNullOrWhiteSpace(firstValidLoc) && !string.Equals(firstValidLoc, pickupLocation, StringComparison.OrdinalIgnoreCase))
                {
                    logger.LogInformation("Retrying Shiprocket order creation with valid pickup location '{PickupLocation}'.", firstValidLoc);
                    pickupLocation = firstValidLoc;
                    await cache.SetAsync("provider:shiprocket:pickup-location", firstValidLoc, TimeSpan.FromDays(1), cancellationToken: cancellationToken);

                    var retryRequestBody = BuildCreateOrderRequestBody(order, billingAddress, shippingAddress, pickupLocation, totalWeight);
                    using var retryResponse = await SendAuthorizedAsync(HttpMethod.Post, "orders/create/adhoc", retryRequestBody, cancellationToken);
                    responseJson = await retryResponse.Content.ReadAsStringAsync(cancellationToken);
                    using var retryDoc = JsonDocument.Parse(responseJson);
                    root = retryDoc.RootElement.Clone();
                }
            }

            long providerOrderId = 0;
            long providerShipmentId = 0;
            if (root.TryGetProperty("order_id", out var orderIdProp) && orderIdProp.TryGetInt64(out var oId)) providerOrderId = oId;
            if (root.TryGetProperty("shipment_id", out var shipmentIdProp) && shipmentIdProp.TryGetInt64(out var sId)) providerShipmentId = sId;

            if (providerOrderId <= 0 || providerShipmentId <= 0)
            {
                var errorMsg = root.TryGetProperty("message", out var m) ? m.GetString() : null;
                if (string.IsNullOrWhiteSpace(errorMsg)) errorMsg = $"Shiprocket rejected order creation (HTTP {(int)response.StatusCode}).";
                logger.LogError("Shiprocket order creation failed for order {OrderNumber}. Reason: {Reason}. Response: {Response}", order.OrderNumber, errorMsg, responseJson);
                await RecordShipmentNotificationAsync(AdminNotificationTypes.ShipmentCreationFailed, NotificationSeverities.Error,
                    "Shipment creation failed", $"Shiprocket could not create shipment for order {order.OrderNumber}: {errorMsg}", order.Id, cancellationToken);
                throw new InvalidOperationException($"Shiprocket order creation failed: {errorMsg}");
            }

            var now = DateTime.UtcNow;
            var shipment = new Shipment
            {
                Id = Guid.NewGuid(),
                OrderId = order.Id,
                ProviderOrderId = providerOrderId,
                ProviderShipmentId = providerShipmentId,
                CourierCompanyId = order.SelectedCourierId,
                CourierName = order.SelectedCourierName,
                ProviderShippingCharge = order.ProviderShippingCost,
                EstimatedDeliveryOn = order.EstimatedDeliveryOn,
                Status = ShipmentStatus.Created,
                ProviderStatus = "NEW",
                CreatedOn = now,
                UpdatedOn = now
            };

            db.Shipments.Add(shipment);
            db.ShipmentActivities.Add(new ShipmentActivity
            {
                Id = Guid.NewGuid(),
                ShipmentId = shipment.Id,
                Activity = "Shipment order created in Shiprocket.",
                Location = pickupLocation,
                Status = "Created",
                Date = now,
                CreatedOn = now
            });

            await db.SaveChangesAsync(cancellationToken);

            await RecordShipmentNotificationAsync(AdminNotificationTypes.ShipmentCreationSucceeded, NotificationSeverities.Success,
                "Shipment created", $"Shipment for order {order.OrderNumber} was created with Shiprocket ID {providerShipmentId}.", order.Id, cancellationToken);

            // Step 2: Attempt Courier / AWB assignment
            await TryAssignAwbAndPickupAsync(shipment, order, cancellationToken);

            return true;
        }
    }

    private async Task TryAssignAwbAndPickupAsync(Shipment shipment, Order order, CancellationToken cancellationToken)
    {
        try
        {
            var awbRequest = new
            {
                shipment_id = shipment.ProviderShipmentId,
                courier_id = shipment.CourierCompanyId.HasValue && shipment.CourierCompanyId.Value > 0
                    ? shipment.CourierCompanyId.Value.ToString(CultureInfo.InvariantCulture)
                    : string.Empty
            };

            using var awbResponse = await SendAuthorizedAsync(HttpMethod.Post, "courier/assign/awb", awbRequest, cancellationToken);
            if (awbResponse.IsSuccessStatusCode)
            {
                var awbJson = await awbResponse.Content.ReadAsStringAsync(cancellationToken);
                using var awbDoc = JsonDocument.Parse(awbJson);
                var root = awbDoc.RootElement;

                string? awbCode = null;
                string? courierName = null;
                int? courierId = null;

                if (root.TryGetProperty("response", out var resp))
                {
                    if (resp.TryGetProperty("data", out var data))
                    {
                        if (data.TryGetProperty("awb_code", out var codeProp)) awbCode = codeProp.GetString();
                        if (data.TryGetProperty("courier_name", out var nameProp)) courierName = nameProp.GetString();
                        if (data.TryGetProperty("courier_company_id", out var idProp) && idProp.TryGetInt32(out var idVal)) courierId = idVal;
                    }
                }

                if (!string.IsNullOrWhiteSpace(awbCode))
                {
                    shipment.AwbCode = awbCode;
                    if (!string.IsNullOrWhiteSpace(courierName)) shipment.CourierName = courierName;
                    if (courierId.HasValue) shipment.CourierCompanyId = courierId;
                    shipment.Status = ShipmentStatus.AwbAssigned;
                    shipment.TrackingUrl = $"https://shiprocket.co/tracking/{awbCode}";
                    shipment.UpdatedOn = DateTime.UtcNow;

                    db.ShipmentActivities.Add(new ShipmentActivity
                    {
                        Id = Guid.NewGuid(),
                        ShipmentId = shipment.Id,
                        Activity = $"AWB assigned: {awbCode} via {shipment.CourierName ?? "Courier"}.",
                        Status = "AwbAssigned",
                        Date = DateTime.UtcNow,
                        CreatedOn = DateTime.UtcNow
                    });

                    await db.SaveChangesAsync(cancellationToken);

                    await RecordShipmentNotificationAsync(AdminNotificationTypes.AwbAssigned, NotificationSeverities.Info,
                        "AWB assigned", $"AWB {awbCode} assigned to order {order.OrderNumber}.", order.Id, cancellationToken);

                    // Step 3: Attempt Pickup scheduling
                    await TrySchedulePickupAsync(shipment, order, cancellationToken);
                }
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "AWB assignment attempt failed for shipment {ShipmentId}.", shipment.Id);
        }
    }

    private async Task TrySchedulePickupAsync(Shipment shipment, Order order, CancellationToken cancellationToken)
    {
        try
        {
            var pickupRequest = new { shipment_id = new[] { shipment.ProviderShipmentId } };
            using var pickupResponse = await SendAuthorizedAsync(HttpMethod.Post, "courier/generate/pickup", pickupRequest, cancellationToken);
            if (pickupResponse.IsSuccessStatusCode)
            {
                var pickupJson = await pickupResponse.Content.ReadAsStringAsync(cancellationToken);
                using var pickupDoc = JsonDocument.Parse(pickupJson);
                var root = pickupDoc.RootElement;

                shipment.Status = ShipmentStatus.PickupScheduled;
                shipment.PickupScheduledOn = DateTime.UtcNow;
                shipment.UpdatedOn = DateTime.UtcNow;

                db.ShipmentActivities.Add(new ShipmentActivity
                {
                    Id = Guid.NewGuid(),
                    ShipmentId = shipment.Id,
                    Activity = "Courier pickup generated.",
                    Status = "PickupScheduled",
                    Date = DateTime.UtcNow,
                    CreatedOn = DateTime.UtcNow
                });

                await db.SaveChangesAsync(cancellationToken);

                await RecordShipmentNotificationAsync(AdminNotificationTypes.PickupScheduled, NotificationSeverities.Info,
                    "Pickup scheduled", $"Pickup scheduled for order {order.OrderNumber} (AWB: {shipment.AwbCode}).", order.Id, cancellationToken);
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Pickup scheduling attempt failed for shipment {ShipmentId}.", shipment.Id);
        }
    }

    public async Task<int> ProcessWebhookAsync(string body, string? token, CancellationToken cancellationToken = default)
    {
        var credentials = await GetCredentialsAsync(cancellationToken);
        if (!string.IsNullOrWhiteSpace(credentials.WebhookSecret) && !string.Equals(credentials.WebhookSecret, token, StringComparison.Ordinal))
        {
            logger.LogWarning("Shiprocket webhook signature token mismatch.");
            throw new UnauthorizedAccessException("Invalid webhook token.");
        }

        var eventId = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(body))).ToLowerInvariant();
        if (await db.WebhookInboxEvents.AnyAsync(x => x.Provider == "Shiprocket" && x.ProviderEventId == eventId, cancellationToken))
        {
            logger.LogInformation("Shiprocket webhook event {EventId} was already processed.", eventId);
            return 0;
        }

        var inbox = new WebhookInboxEvent
        {
            Id = Guid.NewGuid(),
            Provider = "Shiprocket",
            ProviderEventId = eventId,
            EventType = "shipment.status_update",
            PayloadJson = body,
            ReceivedOn = DateTime.UtcNow
        };
        db.WebhookInboxEvents.Add(inbox);
        await db.SaveChangesAsync(cancellationToken);

        using var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;

        string? awb = null;
        long shipmentId = 0;
        string? currentStatus = null;
        string? location = null;
        string? activityText = null;

        if (root.TryGetProperty("awb", out var awbProp)) awb = awbProp.GetString();
        if (root.TryGetProperty("shipment_id", out var sidProp) && sidProp.TryGetInt64(out var sVal)) shipmentId = sVal;
        if (root.TryGetProperty("current_status", out var csProp)) currentStatus = csProp.GetString();
        if (root.TryGetProperty("location", out var locProp)) location = locProp.GetString();
        if (root.TryGetProperty("activity", out var actProp)) activityText = actProp.GetString();

        var query = db.Shipments.Include(s => s.Order).AsQueryable();
        Shipment? shipment = null;
        if (!string.IsNullOrWhiteSpace(awb))
            shipment = await query.FirstOrDefaultAsync(s => s.AwbCode == awb, cancellationToken);
        if (shipment is null && shipmentId > 0)
            shipment = await query.FirstOrDefaultAsync(s => s.ProviderShipmentId == shipmentId, cancellationToken);

        if (shipment is not null && !string.IsNullOrWhiteSpace(currentStatus))
        {
            var newStatus = MapShipmentStatus(currentStatus);
            if (CanTransition(shipment.Status, newStatus))
            {
                shipment.Status = newStatus;
                shipment.ProviderStatus = currentStatus;
                shipment.UpdatedOn = DateTime.UtcNow;

                if (newStatus == ShipmentStatus.Delivered) shipment.DeliveredOn = DateTime.UtcNow;
                if (newStatus == ShipmentStatus.InTransit && shipment.ShippedOn is null) shipment.ShippedOn = DateTime.UtcNow;
                if (!string.IsNullOrWhiteSpace(awb) && string.IsNullOrWhiteSpace(shipment.AwbCode))
                {
                    shipment.AwbCode = awb;
                    if (string.IsNullOrWhiteSpace(shipment.TrackingUrl))
                    {
                        shipment.TrackingUrl = $"https://shiprocket.co/tracking/{awb}";
                    }
                }

                db.ShipmentActivities.Add(new ShipmentActivity
                {
                    Id = Guid.NewGuid(),
                    ShipmentId = shipment.Id,
                    Activity = string.IsNullOrWhiteSpace(activityText) ? $"Shipment status: {currentStatus}" : activityText,
                    Location = location,
                    Status = currentStatus,
                    Date = DateTime.UtcNow,
                    CreatedOn = DateTime.UtcNow
                });

                var notificationType = GetNotificationTypeForStatus(newStatus);
                if (notificationType is not null)
                {
                    await RecordShipmentNotificationAsync(notificationType,
                        newStatus is ShipmentStatus.Delivered ? NotificationSeverities.Success :
                        newStatus is ShipmentStatus.DeliveryFailed or ShipmentStatus.RtoInitiated ? NotificationSeverities.Warning : NotificationSeverities.Info,
                        $"Shipment update: {currentStatus}",
                        $"Order {shipment.Order.OrderNumber} status is now {currentStatus}.",
                        shipment.OrderId, cancellationToken);
                }

                await db.SaveChangesAsync(cancellationToken);
            }
        }

        inbox.ProcessedOn = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        return 1;
    }

    private static ShipmentStatus MapShipmentStatus(string providerStatus) =>
        providerStatus.Trim().ToUpperInvariant() switch
        {
            "PICKED UP" or "PICKUP DONE" => ShipmentStatus.PickedUp,
            "IN TRANSIT" or "REACHED AT DESTINATION" or "OUT FOR PICKUP" => ShipmentStatus.InTransit,
            "OUT FOR DELIVERY" => ShipmentStatus.OutForDelivery,
            "DELIVERED" => ShipmentStatus.Delivered,
            "UNDELIVERED" or "DELIVERY FAILED" or "RTO IN TRANSIT" => ShipmentStatus.DeliveryFailed,
            "RTO INITIATED" or "RTO OFD" => ShipmentStatus.RtoInitiated,
            "RTO DELIVERED" => ShipmentStatus.RtoDelivered,
            "CANCELED" or "CANCELLED" => ShipmentStatus.Cancelled,
            _ => ShipmentStatus.Created
        };

    private static bool CanTransition(ShipmentStatus current, ShipmentStatus next)
    {
        if (current == ShipmentStatus.Delivered && next != ShipmentStatus.Delivered) return false;
        if (current == ShipmentStatus.RtoDelivered) return false;
        return true;
    }

    private static string? GetNotificationTypeForStatus(ShipmentStatus status) => status switch
    {
        ShipmentStatus.PickedUp => AdminNotificationTypes.ShipmentPickedUp,
        ShipmentStatus.InTransit => AdminNotificationTypes.ShipmentInTransit,
        ShipmentStatus.OutForDelivery => AdminNotificationTypes.ShipmentOutForDelivery,
        ShipmentStatus.Delivered => AdminNotificationTypes.ShipmentDelivered,
        ShipmentStatus.DeliveryFailed => AdminNotificationTypes.ShipmentDeliveryFailed,
        ShipmentStatus.RtoInitiated => AdminNotificationTypes.RtoInitiated,
        ShipmentStatus.RtoDelivered => AdminNotificationTypes.RtoDelivered,
        _ => null
    };

    private async Task RecordShipmentNotificationAsync(string type, string severity, string title, string message, Guid orderId, CancellationToken cancellationToken)
    {
        try
        {
            var notification = await notifications.CreateAsync(new CreateAdminNotification(type, severity, title, message,
                "Order", orderId.ToString(), $"/admin/orders", DeduplicationKey: $"shipment:{orderId}:{type}"), false, cancellationToken);
            if (notification is not null)
            {
                db.OutboxMessages.Add(new OutboxMessage
                {
                    Id = Guid.NewGuid(),
                    Type = "BroadcastAdminNotification",
                    AggregateId = notification.Id.ToString(),
                    PayloadJson = JsonSerializer.Serialize(new { notificationId = notification.Id }),
                    CreatedOn = DateTime.UtcNow,
                    NextAttemptOn = DateTime.UtcNow
                });
                await db.SaveChangesAsync(cancellationToken);
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to record admin notification for shipment {Type}.", type);
        }
    }

    private async Task<HttpResponseMessage> SendAuthorizedAsync(HttpMethod method, string path, object? body, CancellationToken cancellationToken)
    {
        var token = await GetTokenAsync(cancellationToken);
        var response = await SendAsync(method, path, body, token, cancellationToken);
        if (response.StatusCode != HttpStatusCode.Unauthorized) return response;

        response.Dispose();
        cache.Remove(TokenCacheKey, "Shiprocket rejected cached access token");
        token = await GetTokenAsync(cancellationToken);
        return await SendAsync(method, path, body, token, cancellationToken);
    }

    private async Task<HttpResponseMessage> SendAsync(HttpMethod method, string path, object? body, string token, CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(method, path);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        if (body is not null)
        {
            request.Content = JsonContent.Create(body, options: JsonOptions);
        }
        return await httpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
    }

    private Task<string> GetTokenAsync(CancellationToken cancellationToken) => cache.GetOrCreateAsync(
        TokenCacheKey,
        async token =>
        {
            var credentials = await GetCredentialsAsync(token);
            if (string.IsNullOrWhiteSpace(credentials.Email) || string.IsNullOrWhiteSpace(credentials.Password))
                throw new ShiprocketProviderException("Shiprocket credentials are incomplete.", 503);
            using var response = await httpClient.PostAsJsonAsync("auth/login", new
            {
                email = credentials.Email.Trim(),
                password = credentials.Password
            }, token);
            if (!response.IsSuccessStatusCode)
            {
                logger.LogError("Shiprocket authentication failed with status {StatusCode}.", (int)response.StatusCode);
                throw new ShiprocketProviderException("Shiprocket provider authentication failed.", 503);
            }
            using var document = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync(token), cancellationToken: token);
            return document.RootElement.GetProperty("token").GetString()
                ?? throw new ShiprocketProviderException("Shiprocket returned an empty token.", 503);
        },
        TimeSpan.FromDays(8));

    private Task<ShiprocketProviderCredentials> GetCredentialsAsync(CancellationToken token) =>
        providerCredentialService.GetRequiredAsync<ShiprocketProviderCredentials>(ProviderKey.Shiprocket, token);

    private async Task<string> ResolvePickupLocationAsync(ShiprocketProviderCredentials credentials, CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(credentials.PickupLocation))
        {
            return credentials.PickupLocation.Trim();
        }

        var cached = await cache.GetAsync<string>("provider:shiprocket:pickup-location", cancellationToken);
        if (!string.IsNullOrWhiteSpace(cached))
        {
            return cached;
        }

        try
        {
            using var response = await SendAuthorizedAsync(HttpMethod.Get, "settings/company/pickup", null, cancellationToken);
            if (response.IsSuccessStatusCode)
            {
                var json = await response.Content.ReadAsStringAsync(cancellationToken);
                using var doc = JsonDocument.Parse(json);
                if (doc.RootElement.TryGetProperty("data", out var data) &&
                    data.TryGetProperty("shipping_address", out var addresses) &&
                    addresses.ValueKind == JsonValueKind.Array)
                {
                    foreach (var addr in addresses.EnumerateArray())
                    {
                        if (addr.TryGetProperty("pickup_location", out var locProp))
                        {
                            var loc = locProp.GetString();
                            if (!string.IsNullOrWhiteSpace(loc))
                            {
                                await cache.SetAsync("provider:shiprocket:pickup-location", loc, TimeSpan.FromDays(1), cancellationToken: cancellationToken);
                                return loc;
                            }
                        }
                    }
                }
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Could not fetch pickup locations from Shiprocket settings.");
        }

        return "Pramukhraj store";
    }

    private static object BuildCreateOrderRequestBody(Order order, OrderAddress billingAddress, OrderAddress shippingAddress, string pickupLocation, decimal totalWeight)
    {
        var (billingFirst, billingLast) = SplitName(billingAddress.RecipientName);
        var (shippingFirst, shippingLast) = SplitName(shippingAddress.RecipientName);

        var orderItems = order.Items.Select(item =>
        {
            var unitPrice = item.UnitPrice > 0 ? item.UnitPrice : item.UnitMrp;
            var mrp = item.UnitMrp > unitPrice ? item.UnitMrp : unitPrice;
            var itemDiscount = Math.Max(0, mrp - unitPrice);

            return new
            {
                name = item.ProductName,
                sku = string.IsNullOrWhiteSpace(item.Sku) ? $"SKU-{item.ProductVariantId.ToString("N")[..6]}" : item.Sku,
                units = item.Quantity,
                selling_price = mrp.ToString("0.00", CultureInfo.InvariantCulture),
                discount = itemDiscount.ToString("0.00", CultureInfo.InvariantCulture),
                tax = item.TaxPercentage.ToString("0.##", CultureInfo.InvariantCulture),
                hsn = item.HsnCode ?? string.Empty
            };
        }).ToList();

        // In Shiprocket: Order Total = sub_total + shipping_charges - total_discount.
        // Therefore, sub_total must exclude shipping charges so shipping isn't added twice.
        var subTotal = Math.Max(0, order.GrandTotal - order.ShippingAmount + order.CouponDiscountAmount);

        return new
        {
            order_id = order.OrderNumber,
            order_date = order.CreatedOn.ToString("yyyy-MM-dd HH:mm", CultureInfo.InvariantCulture),
            pickup_location = pickupLocation,
            channel_id = string.Empty,
            comment = order.CustomerNote ?? "Standard prepaid fulfillment",
            billing_customer_name = billingFirst,
            billing_last_name = billingLast,
            billing_address = billingAddress.AddressLine1,
            billing_address_2 = billingAddress.AddressLine2 ?? string.Empty,
            billing_city = billingAddress.City,
            billing_pincode = billingAddress.PostalCode,
            billing_state = billingAddress.State,
            billing_country = string.IsNullOrWhiteSpace(billingAddress.Country) ? "India" : billingAddress.Country,
            billing_email = billingAddress.Email ?? "orders@pramukhrajfoods.com",
            billing_phone = billingAddress.MobileNumber,
            shipping_is_billing = true,
            shipping_customer_name = shippingFirst,
            shipping_last_name = shippingLast,
            shipping_address = shippingAddress.AddressLine1,
            shipping_address_2 = shippingAddress.AddressLine2 ?? string.Empty,
            shipping_city = shippingAddress.City,
            shipping_pincode = shippingAddress.PostalCode,
            shipping_country = string.IsNullOrWhiteSpace(shippingAddress.Country) ? "India" : shippingAddress.Country,
            shipping_state = shippingAddress.State,
            shipping_email = shippingAddress.Email ?? "orders@pramukhrajfoods.com",
            shipping_phone = shippingAddress.MobileNumber,
            order_items = orderItems,
            payment_method = "Prepaid",
            shipping_charges = order.ShippingAmount.ToString("0.00", CultureInfo.InvariantCulture),
            total_discount = order.CouponDiscountAmount.ToString("0.00", CultureInfo.InvariantCulture),
            sub_total = subTotal.ToString("0.00", CultureInfo.InvariantCulture),
            length = 15,
            breadth = 15,
            height = 10,
            weight = Math.Round(totalWeight, 3, MidpointRounding.AwayFromZero).ToString("0.###", CultureInfo.InvariantCulture)
        };
    }

    private static (string First, string Last) SplitName(string fullName)
    {
        if (string.IsNullOrWhiteSpace(fullName)) return ("Customer", string.Empty);
        var parts = fullName.Trim().Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
        return parts.Length switch
        {
            1 => (parts[0], "."),
            _ => (parts[0], parts[1])
        };
    }

    private static decimal ConvertWeightToKg(decimal weight, string? unit)
    {
        if (weight <= 0) return 0.2m;
        var normalized = unit?.Trim().ToLowerInvariant() ?? string.Empty;

        return normalized switch
        {
            "kg" or "kgs" or "kilogram" or "kilograms" => weight,
            "g" or "gm" or "gms" or "gram" or "grams" => weight / 1000m,
            "ml" when normalized == "ml" => weight / 1000m,
            "ltr" or "liter" or "litre" => weight,
            _ => weight >= 5m ? weight / 1000m : weight
        };
    }

    public async Task<IReadOnlyList<ReverseCourierOptionDto>> GetReverseCouriersAsync(
        string customerPostalCode,
        decimal weightKg,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(customerPostalCode))
            throw new ShiprocketProviderException("Customer postal code is required for courier lookup.", 400);

        var credentials = await GetCredentialsAsync(cancellationToken);
        var deliveryPostcode = credentials.PickupPostalCode?.Trim();
        if (string.IsNullOrWhiteSpace(deliveryPostcode))
        {
            var storeSettings = await db.StoreSettings.AsNoTracking().SingleOrDefaultAsync(s => s.Id == 1, cancellationToken);
            if (storeSettings is not null && !string.IsNullOrWhiteSpace(storeSettings.SettingsJson))
            {
                try
                {
                    using var sDoc = JsonDocument.Parse(storeSettings.SettingsJson);
                    if (sDoc.RootElement.TryGetProperty("storePostalCode", out var spc) && !string.IsNullOrWhiteSpace(spc.GetString()))
                        deliveryPostcode = spc.GetString()!.Trim();
                }
                catch { }
            }
        }

        if (string.IsNullOrWhiteSpace(deliveryPostcode))
            throw new ShiprocketProviderException("Store destination postal code is not configured in Shiprocket or Store settings.", 503);

        var chargeableWeight = Math.Max(weightKg, credentials.MinimumChargeableWeightKg > 0 ? credentials.MinimumChargeableWeightKg : 0.5m);
        var path = string.Create(CultureInfo.InvariantCulture,
            $"courier/serviceability/?pickup_postcode={customerPostalCode.Trim()}&delivery_postcode={deliveryPostcode}&weight={chargeableWeight:0.###}&cod=0&is_return=1");

        using var response = await SendAuthorizedAsync(HttpMethod.Get, path, null, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            logger.LogWarning("Shiprocket reverse serviceability check failed with HTTP {StatusCode}.", (int)response.StatusCode);
            return [];
        }

        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
        var couriers = ReadReverseCouriers(doc.RootElement).Where(x => x.FreightCharge > 0).ToList();

        return couriers
            .GroupBy(x => x.CourierCompanyId)
            .Select(g => g.OrderBy(x => x.FreightCharge).First())
            .OrderByDescending(x => x.IsRecommended)
            .ThenByDescending(x => x.Rating ?? 0)
            .ThenBy(x => x.FreightCharge)
            .ToList();
    }

    public async Task<ReverseBookingResult> BookReversePickupAsync(
        ReturnRequest returnRequest,
        int? courierCompanyId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var credentials = await GetCredentialsAsync(cancellationToken);
            var order = returnRequest.Order;
            if (order is null)
                return new ReverseBookingResult(false, null, null, 0, 0, "Associated order was not loaded.");

            var shippingAddress = order.Addresses.FirstOrDefault(a => a.Type == "Shipping")
                ?? order.Addresses.FirstOrDefault();
            if (shippingAddress is null)
                return new ReverseBookingResult(false, null, null, 0, 0, "No customer shipping address was found on order.");

            var customer = await db.Customers.AsNoTracking().SingleOrDefaultAsync(c => c.Id == returnRequest.CustomerId, cancellationToken);
            var storeSettings = await db.StoreSettings.AsNoTracking().SingleOrDefaultAsync(s => s.Id == 1, cancellationToken);

            string storeName = "Pramukhraj Foods";
            string storeAddress = "Ahmedabad, Gujarat";
            string storeEmail = credentials.Email;
            string storePhone = "9999999999";
            string storeCity = "Ahmedabad";
            string storeState = "Gujarat";
            string storeAddressLine1 = "";
            string storeAddressLine2 = "";
            string storePostalCode = "";
            string storeCountry = "India";

            if (storeSettings is not null && !string.IsNullOrWhiteSpace(storeSettings.SettingsJson))
            {
                try
                {
                    using var sDoc = JsonDocument.Parse(storeSettings.SettingsJson);
                    var sRoot = sDoc.RootElement;
                    if (sRoot.TryGetProperty("storeName", out var sn) && !string.IsNullOrWhiteSpace(sn.GetString()))
                        storeName = sn.GetString()!;
                    if (sRoot.TryGetProperty("storeAddress", out var sa) && !string.IsNullOrWhiteSpace(sa.GetString()))
                        storeAddress = sa.GetString()!;
                    if (sRoot.TryGetProperty("storeAddressLine1", out var sal1) && !string.IsNullOrWhiteSpace(sal1.GetString()))
                        storeAddressLine1 = sal1.GetString()!;
                    if (sRoot.TryGetProperty("storeAddressLine2", out var sal2) && !string.IsNullOrWhiteSpace(sal2.GetString()))
                        storeAddressLine2 = sal2.GetString()!;
                    if (sRoot.TryGetProperty("storeCity", out var sc) && !string.IsNullOrWhiteSpace(sc.GetString()))
                        storeCity = sc.GetString()!;
                    if (sRoot.TryGetProperty("storeState", out var ss) && !string.IsNullOrWhiteSpace(ss.GetString()))
                        storeState = ss.GetString()!;
                    if (sRoot.TryGetProperty("storePostalCode", out var spc) && !string.IsNullOrWhiteSpace(spc.GetString()))
                        storePostalCode = spc.GetString()!;
                    if (sRoot.TryGetProperty("storeCountry", out var scountry) && !string.IsNullOrWhiteSpace(scountry.GetString()))
                        storeCountry = scountry.GetString()!;
                    if (sRoot.TryGetProperty("supportEmail", out var se) && !string.IsNullOrWhiteSpace(se.GetString()))
                        storeEmail = se.GetString()!;
                    if (sRoot.TryGetProperty("supportPhoneNumber", out var sp) && !string.IsNullOrWhiteSpace(sp.GetString()))
                        storePhone = sp.GetString()!;
                }
                catch { /* Fall back to defaults */ }
            }

            var (pickupFirst, pickupLast) = SplitName(customer?.FullName ?? shippingAddress.RecipientName);
            var pickupEmail = customer?.Email ?? shippingAddress.Email ?? "orders@pramukhrajfoods.com";
            var pickupPhone = customer?.MobileNumber ?? shippingAddress.MobileNumber ?? "9999999999";

            var totalWeight = returnRequest.Items.Sum(ri =>
            {
                var matchedOrder = order.Items.FirstOrDefault(oi => oi.Id == ri.OrderItemId);
                var unitW = matchedOrder is not null ? ConvertWeightToKg(matchedOrder.Weight, matchedOrder.WeightUnit) : 0.25m;
                return unitW * Math.Max(1, ri.Quantity);
            });
            totalWeight = Math.Max(0.2m, totalWeight);

            var subTotal = returnRequest.Items.Sum(i => i.UnitPrice * i.Quantity);

            // --- Resolve the Shiprocket pickup location ID ---
            // `pickup_location_id` is required by Shiprocket orders/create/return.
            // We resolve it from settings/company/pickup and cache it for 24 h.
            int? pickupLocationId = null;
            try
            {
                var cachedLocId = await cache.GetAsync<int?>("provider:shiprocket:pickup-location-id", cancellationToken);
                if (cachedLocId.HasValue && cachedLocId.Value > 0)
                {
                    pickupLocationId = cachedLocId.Value;
                }
                else
                {
                    using var locResponse = await SendAuthorizedAsync(HttpMethod.Get, "settings/company/pickup", null, cancellationToken);
                    if (locResponse.IsSuccessStatusCode)
                    {
                        var locJson = await locResponse.Content.ReadAsStringAsync(cancellationToken);
                        using var locDoc = JsonDocument.Parse(locJson);
                        if (locDoc.RootElement.TryGetProperty("data", out var locData) &&
                            locData.TryGetProperty("shipping_address", out var locAddresses) &&
                            locAddresses.ValueKind == JsonValueKind.Array)
                        {
                            foreach (var addr in locAddresses.EnumerateArray())
                            {
                                int? foundId = null;
                                if (addr.TryGetProperty("id", out var idProp) && idProp.TryGetInt32(out var idVal))
                                    foundId = idVal;
                                else if (addr.TryGetProperty("pickup_id", out var pidProp) && pidProp.TryGetInt32(out var pidVal))
                                    foundId = pidVal;

                                if (foundId.HasValue && foundId.Value > 0)
                                {
                                    pickupLocationId = foundId.Value;
                                    await cache.SetAsync("provider:shiprocket:pickup-location-id", foundId.Value, TimeSpan.FromDays(1), cancellationToken: cancellationToken);
                                    break;
                                }
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Could not resolve Shiprocket pickup location ID. Return order will be sent without it.");
            }

            // Normalise phone numbers — Shiprocket expects numeric strings for phone fields
            var pickupPhoneNorm = new string(pickupPhone.Where(char.IsDigit).ToArray());
            if (pickupPhoneNorm.StartsWith("91") && pickupPhoneNorm.Length == 12) pickupPhoneNorm = pickupPhoneNorm[2..];
            var storePhoneNorm = new string(storePhone.Where(char.IsDigit).ToArray());
            if (storePhoneNorm.StartsWith("91") && storePhoneNorm.Length == 12) storePhoneNorm = storePhoneNorm[2..];

            // Split store name into first / last
            var (storeFirst, storeLast) = SplitName(storeName);

            // Determine pincode integers
            _ = int.TryParse(shippingAddress.PostalCode, out var pin);
            int destinationPin = 0;
            if (!int.TryParse(storePostalCode, out destinationPin) || destinationPin <= 0)
            {
                _ = int.TryParse(credentials.PickupPostalCode, out destinationPin);
            }

            var orderItems = returnRequest.Items.Select(item =>
            {
                var matched = order.Items.FirstOrDefault(oi => oi.Id == item.OrderItemId);
                return new
                {
                    name = item.ProductName,
                    sku = matched?.Sku ?? $"SKU-{item.ProductVariantId.ToString("N")[..6]}",
                    units = item.Quantity,
                    selling_price = item.UnitPrice.ToString("0.00", CultureInfo.InvariantCulture),
                    discount = "0.00",
                    qc_enable = false
                };
            }).ToList();

            // Build the return order payload using the dedicated store address.
            var returnBodyObj = new Dictionary<string, object?>
            {
                ["order_id"]               = returnRequest.ReturnNumber,
                ["order_date"]             = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm", CultureInfo.InvariantCulture),
                ["channel_id"]             = "",
                ["pickup_customer_name"]   = pickupFirst,
                ["pickup_last_name"]       = pickupLast,
                ["pickup_address"]         = shippingAddress.AddressLine1,
                ["pickup_address_2"]       = shippingAddress.AddressLine2 ?? "",
                ["pickup_city"]            = shippingAddress.City,
                ["pickup_state"]           = shippingAddress.State,
                ["pickup_country"]         = "India",
                ["pickup_pincode"]         = pin,
                ["pickup_email"]           = pickupEmail,
                ["pickup_phone"]           = pickupPhoneNorm,
                ["pickup_isd_code"]        = "91",
                ["shipping_customer_name"] = storeFirst,
                ["shipping_last_name"]     = storeLast,
                ["shipping_address"]       = !string.IsNullOrWhiteSpace(storeAddressLine1) ? storeAddressLine1 : storeAddress,
                ["shipping_address_2"]     = storeAddressLine2,
                ["shipping_city"]          = storeCity,
                ["shipping_state"]         = storeState,
                ["shipping_country"]       = storeCountry,
                ["shipping_pincode"]       = destinationPin,
                ["shipping_email"]         = storeEmail,
                ["shipping_phone"]         = storePhoneNorm,
                ["shipping_isd_code"]      = "91",
                ["order_items"]            = orderItems,
                ["payment_method"]         = "PREPAID",
                ["total_discount"]         = "0.00",
                ["sub_total"]              = subTotal.ToString("0.00", CultureInfo.InvariantCulture),
                ["length"]                 = 15,
                ["breadth"]                = 15,
                ["height"]                 = 10,
                ["weight"]                 = Math.Round(totalWeight, 3, MidpointRounding.AwayFromZero).ToString("0.###", CultureInfo.InvariantCulture),
            };

            if (pickupLocationId.HasValue && pickupLocationId.Value > 0)
                returnBodyObj["pickup_location_id"] = pickupLocationId.Value;

            using var response = await SendAuthorizedAsync(HttpMethod.Post, "orders/create/return", returnBodyObj, cancellationToken);
            var responseJson = await response.Content.ReadAsStringAsync(cancellationToken);

            // Always log the full Shiprocket response for debugging
            logger.LogInformation("Shiprocket create/return response (HTTP {Status}) for Return {ReturnNumber}: {Response}",
                (int)response.StatusCode, returnRequest.ReturnNumber, responseJson);

            using var doc = JsonDocument.Parse(responseJson);
            var root = doc.RootElement;

            long providerOrderId = 0;
            long providerShipmentId = 0;
            string? awbCode = null;
            string? courierName = null;

            if (root.TryGetProperty("order_id", out var oIdProp) && oIdProp.TryGetInt64(out var oId)) providerOrderId = oId;
            if (root.TryGetProperty("shipment_id", out var sIdProp) && sIdProp.TryGetInt64(out var sId)) providerShipmentId = sId;

            if (root.TryGetProperty("awb_code", out var awbProp) && !string.IsNullOrWhiteSpace(awbProp.GetString()))
                awbCode = awbProp.GetString();
            if (root.TryGetProperty("courier_name", out var cnProp) && !string.IsNullOrWhiteSpace(cnProp.GetString()))
                courierName = cnProp.GetString();

            if (root.TryGetProperty("response", out var resp) && resp.TryGetProperty("data", out var d))
            {
                if (d.TryGetProperty("awb_code", out var code) && !string.IsNullOrWhiteSpace(code.GetString()))
                    awbCode = code.GetString();
                if (d.TryGetProperty("courier_name", out var cname) && !string.IsNullOrWhiteSpace(cname.GetString()))
                    courierName = cname.GetString();
            }

            if (providerShipmentId <= 0 && root.TryGetProperty("data", out var dataObj))
            {
                if (dataObj.TryGetProperty("order_id", out var doId) && doId.TryGetInt64(out var doIdVal)) providerOrderId = doIdVal;
                if (dataObj.TryGetProperty("shipment_id", out var dsId) && dsId.TryGetInt64(out var dsIdVal)) providerShipmentId = dsIdVal;
                if (dataObj.TryGetProperty("awb_code", out var dawb)) awbCode = dawb.GetString();
                if (dataObj.TryGetProperty("courier_name", out var dcn)) courierName = dcn.GetString();
            }

            if (providerShipmentId <= 0)
            {
                // Extract detailed field-level validation errors from Shiprocket's 422 response
                string? errorMsg = root.TryGetProperty("message", out var m) ? m.GetString() : null;
                if (root.TryGetProperty("errors", out var errs) && errs.ValueKind == JsonValueKind.Object)
                {
                    var fieldErrors = errs.EnumerateObject()
                        .SelectMany(p => p.Value.ValueKind == JsonValueKind.Array
                            ? p.Value.EnumerateArray().Select(v => $"{p.Name}: {v.GetString()}")
                            : new[] { $"{p.Name}: {p.Value}" })
                        .ToList();
                    if (fieldErrors.Count > 0)
                        errorMsg = string.Join("; ", fieldErrors);
                }
                logger.LogWarning("Shiprocket return order creation failed for Return {ReturnNumber}. Error: {Error}", returnRequest.ReturnNumber, errorMsg);
                return new ReverseBookingResult(false, null, null, 0, 0, errorMsg ?? "Shiprocket rejected return creation.");
            }

            // If AWB was not immediately assigned, attempt courier/assign/awb
            if (string.IsNullOrWhiteSpace(awbCode))
            {
                try
                {
                    var awbRequest = new
                    {
                        shipment_id = providerShipmentId,
                        courier_id = courierCompanyId.HasValue && courierCompanyId.Value > 0
                            ? courierCompanyId.Value.ToString(CultureInfo.InvariantCulture)
                            : string.Empty,
                        is_return = 1
                    };
                    using var awbResponse = await SendAuthorizedAsync(HttpMethod.Post, "courier/assign/awb", awbRequest, cancellationToken);
                    if (awbResponse.IsSuccessStatusCode)
                    {
                        var awbJson = await awbResponse.Content.ReadAsStringAsync(cancellationToken);
                        using var awbDoc = JsonDocument.Parse(awbJson);
                        var awbRoot = awbDoc.RootElement;
                        if (awbRoot.TryGetProperty("response", out var awbResp) && awbResp.TryGetProperty("data", out var awbData))
                        {
                            if (awbData.TryGetProperty("awb_code", out var codeProp)) awbCode = codeProp.GetString();
                            if (awbData.TryGetProperty("courier_name", out var nameProp)) courierName = nameProp.GetString();
                        }
                    }
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, "Reverse AWB assignment call to Shiprocket failed for shipment {ShipmentId}.", providerShipmentId);
                }
            }

            // Attempt pickup generation if AWB is present
            if (!string.IsNullOrWhiteSpace(awbCode))
            {
                try
                {
                    var pickupRequest = new { shipment_id = new[] { providerShipmentId } };
                    using var pickupResponse = await SendAuthorizedAsync(HttpMethod.Post, "courier/generate/pickup", pickupRequest, cancellationToken);
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, "Reverse pickup generation call to Shiprocket failed for shipment {ShipmentId}.", providerShipmentId);
                }
            }

            return new ReverseBookingResult(true, awbCode, courierName, providerOrderId, providerShipmentId, null);
        }
        catch (ShiprocketProviderException spEx)
        {
            logger.LogWarning(spEx, "Shiprocket provider exception during reverse booking for Return {ReturnNumber}", returnRequest.ReturnNumber);
            return new ReverseBookingResult(false, null, null, 0, 0, spEx.Message);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unexpected error during reverse booking for Return {ReturnNumber}", returnRequest.ReturnNumber);
            return new ReverseBookingResult(false, null, null, 0, 0, ex.Message);
        }
    }

    private static IEnumerable<ReverseCourierOptionDto> ReadReverseCouriers(JsonElement root)
    {
        if (!root.TryGetProperty("data", out var data) ||
            !data.TryGetProperty("available_courier_companies", out var values) ||
            values.ValueKind != JsonValueKind.Array) yield break;

        foreach (var value in values.EnumerateArray())
        {
            var id = Int(value, "courier_company_id");
            var name = Text(value, "courier_name");
            var rate = Decimal(value, "rate") ?? Decimal(value, "freight_charge");
            if (id is null || string.IsNullOrWhiteSpace(name) || rate is null) continue;
            var etdText = Text(value, "etd");
            yield return new ReverseCourierOptionDto(
                id.Value,
                name,
                Math.Round(rate.Value, 2, MidpointRounding.AwayFromZero),
                Int(value, "estimated_delivery_days") ?? FirstInteger(etdText),
                Date(value, "etd"),
                Decimal(value, "rating"),
                Bool(value, "is_recommended") || Bool(value, "recommended_by_shiprocket"));
        }
    }

    private static string? Text(JsonElement value, string name) =>
        value.TryGetProperty(name, out var item) && item.ValueKind == JsonValueKind.String ? item.GetString() : null;

    private static decimal? Decimal(JsonElement value, string name)
    {
        if (!value.TryGetProperty(name, out var item)) return null;
        if (item.ValueKind == JsonValueKind.Number && item.TryGetDecimal(out var number)) return number;
        return item.ValueKind == JsonValueKind.String && decimal.TryParse(item.GetString(), NumberStyles.Number, CultureInfo.InvariantCulture, out number) ? number : null;
    }

    private static int? Int(JsonElement value, string name)
    {
        if (!value.TryGetProperty(name, out var item)) return null;
        if (item.ValueKind == JsonValueKind.Number && item.TryGetInt32(out var number)) return number;
        return item.ValueKind == JsonValueKind.String && int.TryParse(item.GetString(), out number) ? number : null;
    }

    private static bool Bool(JsonElement value, string name) => value.TryGetProperty(name, out var item) &&
        (item.ValueKind == JsonValueKind.True || (item.ValueKind == JsonValueKind.Number && item.TryGetInt32(out var number) && number == 1));

    private static DateTime? Date(JsonElement value, string name) =>
        DateTime.TryParse(Text(value, name), CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out var date) ? date.ToUniversalTime() : null;

    private static int? FirstInteger(string? value) => value is not null && NumberRegex().Match(value) is { Success: true } match &&
        int.TryParse(match.Value, out var number) ? number : null;

    [GeneratedRegex("[0-9]+")]
    private static partial Regex NumberRegex();
}


