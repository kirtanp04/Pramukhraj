using Microsoft.EntityFrameworkCore;
using pramukhraj.Common;
using pramukhraj.Database;
using pramukhraj.DTOs.Order;
using pramukhraj.Entities.Order;
using pramukhraj.Entities.Shipment;
using pramukhraj.Interfaces;

namespace pramukhraj.Services;

public sealed class CustomerOrderService(
    AppDbContext db,
    CustomerClaimsHelper claimsHelper,
    IStoreSettingsService settingsService,
    ILogger<CustomerOrderService> logger) : ICustomerOrderService
{
    public async Task<ApiResponse<CustomerOrderListResponse>> GetCustomerOrdersAsync(
        int page,
        int pageSize,
        string? status,
        CancellationToken cancellationToken = default)
    {
        var claims = claimsHelper.GetCustomer();
        if (!claims.Success || claims.Data is null)
            return ApiResponse<CustomerOrderListResponse>.Fail(claims.Message, claims.StatusCode);

        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);

        var query = db.Orders.AsNoTracking()
            .Where(x => x.CustomerId == claims.Data.CustomerId);

        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            if (Enum.TryParse<OrderStatus>(status, true, out var parsedStatus))
            {
                query = query.Where(x => x.Status == parsedStatus);
            }
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var orders = await query
            .OrderByDescending(x => x.CreatedOn)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new
            {
                x.Id,
                x.OrderNumber,
                x.CreatedOn,
                OrderStatus = x.Status.ToString(),
                PaymentStatus = x.Payments.OrderByDescending(p => p.CreatedOn).Select(p => p.Status.ToString()).FirstOrDefault() ?? "Pending",
                LatestShipment = x.Shipments.OrderByDescending(s => s.CreatedOn).Select(s => new
                {
                    ShipmentStatus = s.Status.ToString(),
                    s.CourierName,
                    s.AwbCode,
                    s.TrackingUrl,
                    s.EstimatedDeliveryOn
                }).FirstOrDefault(),
                x.GrandTotal,
                x.Currency,
                ItemCount = x.Items.Sum(i => i.Quantity),
                Items = x.Items.Select(i => new CustomerOrderItemSummaryResponse(
                    i.ProductId,
                    i.ProductVariantId,
                    i.ProductName,
                    i.ProductSlug,
                    i.VariantName,
                    i.Sku,
                    i.Quantity,
                    i.UnitPrice,
                    i.LineTotal)).ToList()
            })
            .ToListAsync(cancellationToken);

        var items = orders.Select(o => new CustomerOrderListItemResponse(
            o.Id,
            o.OrderNumber,
            o.CreatedOn,
            o.OrderStatus,
            o.PaymentStatus,
            o.LatestShipment?.ShipmentStatus,
            o.LatestShipment?.CourierName,
            o.LatestShipment?.AwbCode,
            o.LatestShipment?.TrackingUrl,
            o.LatestShipment?.EstimatedDeliveryOn,
            o.GrandTotal,
            o.Currency,
            o.ItemCount,
            o.Items)).ToList();

        var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);
        return ApiResponse<CustomerOrderListResponse>.Ok(new CustomerOrderListResponse(items, page, pageSize, totalCount, totalPages));
    }

    public async Task<ApiResponse<CustomerOrderDetailResponse>> GetCustomerOrderDetailAsync(
        Guid orderId,
        CancellationToken cancellationToken = default)
    {
        var claims = claimsHelper.GetCustomer();
        if (!claims.Success || claims.Data is null)
            return ApiResponse<CustomerOrderDetailResponse>.Fail(claims.Message, claims.StatusCode);

        var order = await db.Orders.AsNoTracking()
            .Include(x => x.Items)
            .Include(x => x.Addresses)
            .Include(x => x.Payments)
            .Include(x => x.Shipments)
                .ThenInclude(s => s.Activities)
            .Where(x => x.Id == orderId && x.CustomerId == claims.Data.CustomerId)
            .SingleOrDefaultAsync(cancellationToken);

        if (order is null) return ApiResponse<CustomerOrderDetailResponse>.Fail("Order was not found.", 404);

        var payment = order.Payments.OrderByDescending(p => p.CreatedOn).FirstOrDefault();
        var shipment = order.Shipments.OrderByDescending(s => s.CreatedOn).FirstOrDefault();

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

        CustomerOrderShipmentDetailResponse? shipmentDto = null;
        if (shipment is not null)
        {
            var activitiesDto = shipment.Activities
                .OrderByDescending(a => a.Date)
                .Select(a => new CustomerShipmentActivityResponse(a.Activity, a.Location, a.Status, a.Date))
                .ToList();

            shipmentDto = new CustomerOrderShipmentDetailResponse(
                shipment.Id,
                shipment.Status.ToString(),
                shipment.CourierName,
                shipment.AwbCode,
                shipment.TrackingUrl,
                shipment.LabelUrl,
                shipment.EstimatedDeliveryOn,
                shipment.ShippedOn,
                shipment.DeliveredOn,
                activitiesDto);
        }

        var settings = await settingsService.GetCurrentAsync(cancellationToken);
        var canCancel = order.Status == OrderStatus.PendingPayment && payment?.Status != PaymentStatus.Paid;

        var response = new CustomerOrderDetailResponse(
            order.Id,
            order.OrderNumber,
            order.CreatedOn,
            order.Status.ToString(),
            payment?.Status.ToString() ?? "Pending",
            shipment?.Status.ToString(),
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
            order.CustomerNote,
            settings.StoreName,
            shippingDto,
            billingDto,
            itemsDto,
            shipmentDto,
            canCancel,
            settings.StoreAddress);

        return ApiResponse<CustomerOrderDetailResponse>.Ok(response);
    }

    public async Task<ApiResponse<CustomerOrderTrackingResponse>> GetCustomerOrderTrackingAsync(
        Guid orderId,
        CancellationToken cancellationToken = default)
    {
        var claims = claimsHelper.GetCustomer();
        if (!claims.Success || claims.Data is null)
            return ApiResponse<CustomerOrderTrackingResponse>.Fail(claims.Message, claims.StatusCode);

        var order = await db.Orders.AsNoTracking()
            .Include(x => x.Payments)
            .Include(x => x.Shipments)
                .ThenInclude(s => s.Activities)
            .Where(x => x.Id == orderId && x.CustomerId == claims.Data.CustomerId)
            .SingleOrDefaultAsync(cancellationToken);

        if (order is null) return ApiResponse<CustomerOrderTrackingResponse>.Fail("Order was not found.", 404);

        var payment = order.Payments.OrderByDescending(p => p.CreatedOn).FirstOrDefault();
        var shipment = order.Shipments.OrderByDescending(s => s.CreatedOn).FirstOrDefault();

        var isOrderPlaced = true;
        var isPaymentConfirmed = payment?.Status == PaymentStatus.Paid;
        var isShipped = shipment is not null && (shipment.Status is ShipmentStatus.AwbAssigned or ShipmentStatus.PickupScheduled or ShipmentStatus.PickedUp or ShipmentStatus.InTransit or ShipmentStatus.OutForDelivery or ShipmentStatus.Delivered);
        var isOutForDelivery = shipment is not null && (shipment.Status is ShipmentStatus.OutForDelivery or ShipmentStatus.Delivered);
        var isDelivered = shipment is not null && shipment.Status == ShipmentStatus.Delivered;

        var steps = new List<TrackingTimelineStep>
        {
            new("Order Placed", $"Order {order.OrderNumber} was placed.", null, order.CreatedOn, isOrderPlaced, !isPaymentConfirmed),
            new("Payment Confirmed", isPaymentConfirmed ? "Prepaid payment captured." : "Awaiting payment.", null, payment?.PaidOn, isPaymentConfirmed, isPaymentConfirmed && !isShipped),
            new("Shipped / In Transit", isShipped ? $"{shipment?.CourierName ?? "Courier"} assigned (AWB: {shipment?.AwbCode ?? "Pending"})." : "Packaging and preparing for courier pickup.", null, shipment?.ShippedOn ?? shipment?.PickupScheduledOn, isShipped, isShipped && !isOutForDelivery),
            new("Out for Delivery", isOutForDelivery ? "Package is out with your local delivery agent." : "Package will arrive at local hub soon.", null, null, isOutForDelivery, isOutForDelivery && !isDelivered),
            new("Delivered", isDelivered ? "Package delivered to your address." : (shipment?.EstimatedDeliveryOn.HasValue == true ? $"Est. delivery by {shipment.EstimatedDeliveryOn.Value:MMM dd, yyyy}." : "Pending delivery."), null, shipment?.DeliveredOn, isDelivered, isDelivered)
        };

        var response = new CustomerOrderTrackingResponse(
            order.Id,
            order.OrderNumber,
            order.Status.ToString(),
            shipment?.Status.ToString(),
            shipment?.CourierName,
            shipment?.AwbCode,
            shipment?.TrackingUrl,
            shipment?.EstimatedDeliveryOn,
            steps);

        return ApiResponse<CustomerOrderTrackingResponse>.Ok(response);
    }
}
