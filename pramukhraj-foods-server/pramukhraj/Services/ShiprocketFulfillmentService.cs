using System.Globalization;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using pramukhraj.Common;
using pramukhraj.Database;
using pramukhraj.DTOs.Notifications;
using pramukhraj.DTOs.ProviderCredentials;
using pramukhraj.DTOs.Shipment;
using pramukhraj.Entities.Notifications;
using pramukhraj.Entities.Order;
using pramukhraj.Entities.ProviderCredentials;
using pramukhraj.Entities.Shipment;
using pramukhraj.Interfaces;

namespace pramukhraj.Services;

public sealed class ShiprocketFulfillmentService(
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
        var existing = await db.Shipments.AsNoTracking().FirstOrDefaultAsync(x => x.OrderId == orderId, cancellationToken);
        if (existing is not null)
        {
            logger.LogInformation("Shipment already exists for order {OrderId}.", orderId);
            return true;
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
        var pickupLocation = string.IsNullOrWhiteSpace(credentials.PickupPostalCode) ? "Primary" : credentials.PickupPostalCode.Trim();

        var (billingFirst, billingLast) = SplitName(billingAddress.RecipientName);
        var (shippingFirst, shippingLast) = SplitName(shippingAddress.RecipientName);

        var totalWeight = Math.Max(0.5m, order.Items.Sum(i => i.Weight > 0 ? (i.WeightUnit.Equals("g", StringComparison.OrdinalIgnoreCase) ? i.Weight / 1000m : i.Weight) * i.Quantity : 0.5m * i.Quantity));
        if (credentials.MinimumChargeableWeightKg > 0 && totalWeight < credentials.MinimumChargeableWeightKg)
        {
            totalWeight = credentials.MinimumChargeableWeightKg;
        }

        var orderItems = order.Items.Select(item => new
        {
            name = item.ProductName,
            sku = string.IsNullOrWhiteSpace(item.Sku) ? $"SKU-{item.ProductVariantId.ToString("N")[..6]}" : item.Sku,
            units = item.Quantity,
            selling_price = item.UnitPrice.ToString("0.00", CultureInfo.InvariantCulture),
            discount = item.DiscountAmount.ToString("0.00", CultureInfo.InvariantCulture),
            tax = item.TaxAmount.ToString("0.00", CultureInfo.InvariantCulture),
            hsn = item.HsnCode ?? string.Empty
        }).ToList();

        var requestBody = new
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
            sub_total = order.GrandTotal.ToString("0.00", CultureInfo.InvariantCulture),
            length = 15,
            breadth = 15,
            height = 10,
            weight = Math.Round(totalWeight, 3, MidpointRounding.AwayFromZero).ToString("0.###", CultureInfo.InvariantCulture)
        };

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
            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("Shiprocket create order returned status {StatusCode}: {Response}", (int)response.StatusCode, responseJson);
                await RecordShipmentNotificationAsync(AdminNotificationTypes.ShipmentCreationFailed, NotificationSeverities.Warning,
                    "Shipment order rejected", $"Shiprocket rejected order {order.OrderNumber} with status {(int)response.StatusCode}.", order.Id, cancellationToken);
                throw new HttpRequestException($"Shiprocket rejected order creation: {response.StatusCode}", null, response.StatusCode);
            }

            using var doc = JsonDocument.Parse(responseJson);
            var root = doc.RootElement;

            long providerOrderId = 0;
            long providerShipmentId = 0;
            if (root.TryGetProperty("order_id", out var orderIdProp)) providerOrderId = orderIdProp.GetInt64();
            if (root.TryGetProperty("shipment_id", out var shipmentIdProp)) providerShipmentId = shipmentIdProp.GetInt64();

            if (providerShipmentId == 0)
            {
                logger.LogWarning("Shiprocket response did not contain shipment_id: {Json}", responseJson);
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
            if (providerShipmentId > 0)
            {
                await TryAssignAwbAndPickupAsync(shipment, order, cancellationToken);
            }

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
}

