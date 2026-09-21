using Microsoft.EntityFrameworkCore;
using pramukhraj.Common;
using pramukhraj.Database;
using pramukhraj.DTOs.Order;
using pramukhraj.Entities.Order;
using pramukhraj.Entities.Shipment;
using pramukhraj.Interfaces;

namespace pramukhraj.Services;

public sealed class AdminOrderService(
    AppDbContext db,
    ILogger<AdminOrderService> logger) : IAdminOrderService
{
    public async Task<ApiResponse<AdminOrderListPageResponse>> GetOrdersAsync(
        AdminOrderListRequest request,
        CancellationToken cancellationToken = default)
    {
        var pageNumber = Math.Max(1, request.PageNumber);
        var pageSize = Math.Clamp(request.PageSize, 1, 50);

        var totalOrders = await db.Orders.CountAsync(cancellationToken);
        var pendingCount = await db.Orders.CountAsync(o => o.Status == OrderStatus.PendingPayment, cancellationToken);
        var confirmedCount = await db.Orders.CountAsync(o => o.Status == OrderStatus.Confirmed, cancellationToken);
        var paymentFailedCount = await db.Orders.CountAsync(o => o.Status == OrderStatus.PaymentFailed, cancellationToken);
        var cancelledCount = await db.Orders.CountAsync(o => o.Status == OrderStatus.Cancelled, cancellationToken);
        var expiredCount = await db.Orders.CountAsync(o => o.Status == OrderStatus.Expired, cancellationToken);

        var summary = new AdminOrderSummaryResponse(
            totalOrders,
            pendingCount,
            confirmedCount,
            paymentFailedCount,
            cancelledCount,
            expiredCount);

        var baseQuery = from order in db.Orders.AsNoTracking()
                        join customer in db.Customers.AsNoTracking() on order.CustomerId equals customer.Id into custGroup
                        from customer in custGroup.DefaultIfEmpty()
                        select new
                        {
                            Order = order,
                            Customer = customer
                        };

        if (!string.IsNullOrWhiteSpace(request.Status) && !request.Status.Equals(AdminOrderStatuses.All, StringComparison.OrdinalIgnoreCase))
        {
            if (Enum.TryParse<OrderStatus>(request.Status, true, out var parsedStatus))
            {
                baseQuery = baseQuery.Where(x => x.Order.Status == parsedStatus);
            }
        }

        if (!string.IsNullOrWhiteSpace(request.PaymentStatus) && !request.PaymentStatus.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            if (Enum.TryParse<PaymentStatus>(request.PaymentStatus, true, out var parsedPaymentStatus))
            {
                baseQuery = baseQuery.Where(x => x.Order.Payments.OrderByDescending(p => p.CreatedOn).Select(p => p.Status).FirstOrDefault() == parsedPaymentStatus);
            }
        }

        if (!string.IsNullOrWhiteSpace(request.ShipmentStatus) && !request.ShipmentStatus.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            if (Enum.TryParse<ShipmentStatus>(request.ShipmentStatus, true, out var parsedShipmentStatus))
            {
                baseQuery = baseQuery.Where(x => x.Order.Shipments.OrderByDescending(s => s.CreatedOn).Select(s => s.Status).FirstOrDefault() == parsedShipmentStatus);
            }
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.Trim().ToLower();
            baseQuery = baseQuery.Where(x =>
                x.Order.OrderNumber.ToLower().Contains(term) ||
                (x.Customer != null && x.Customer.FullName.ToLower().Contains(term)) ||
                (x.Customer != null && x.Customer.MobileNumber.Contains(term)) ||
                (x.Customer != null && x.Customer.Email != null && x.Customer.Email.ToLower().Contains(term)));
        }

        var isAsc = string.Equals(request.SortDirection, "asc", StringComparison.OrdinalIgnoreCase);
        baseQuery = (request.SortBy?.ToLowerInvariant()) switch
        {
            "ordernumber" => isAsc ? baseQuery.OrderBy(x => x.Order.OrderNumber) : baseQuery.OrderByDescending(x => x.Order.OrderNumber),
            "grandtotal" => isAsc ? baseQuery.OrderBy(x => x.Order.GrandTotal) : baseQuery.OrderByDescending(x => x.Order.GrandTotal),
            _ => isAsc ? baseQuery.OrderBy(x => x.Order.CreatedOn) : baseQuery.OrderByDescending(x => x.Order.CreatedOn)
        };

        var totalCount = await baseQuery.CountAsync(cancellationToken);
        var totalPages = totalCount == 0 ? 1 : (int)Math.Ceiling((double)totalCount / pageSize);

        var pagedRows = await baseQuery
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new
            {
                x.Order.Id,
                x.Order.OrderNumber,
                x.Order.CreatedOn,
                OrderStatus = x.Order.Status.ToString(),
                PaymentStatus = x.Order.Payments.OrderByDescending(p => p.CreatedOn).Select(p => p.Status.ToString()).FirstOrDefault() ?? "Pending",
                LatestShipment = x.Order.Shipments.OrderByDescending(s => s.CreatedOn).Select(s => new
                {
                    ShipmentStatus = s.Status.ToString(),
                    s.CourierName,
                    s.AwbCode,
                    s.TrackingUrl,
                    s.EstimatedDeliveryOn
                }).FirstOrDefault(),
                x.Order.GrandTotal,
                x.Order.Currency,
                ItemCount = x.Order.Items.Sum(i => i.Quantity),
                CustomerId = x.Customer != null ? x.Customer.Id : x.Order.CustomerId,
                CustomerName = x.Customer != null ? x.Customer.FullName : "Guest / Unknown",
                CustomerMobile = x.Customer != null ? x.Customer.MobileNumber : string.Empty,
                CustomerEmail = x.Customer != null ? x.Customer.Email : null,
                CustomerCity = x.Customer != null ? x.Customer.City : null,
                CustomerState = x.Customer != null ? x.Customer.State : null,
                CustomerBlocked = x.Customer != null && x.Customer.IsBlocked,
                Items = x.Order.Items.Select(i => new AdminOrderItemSummary(
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

        var items = pagedRows.Select(row => new AdminOrderListItemResponse(
            row.Id,
            row.OrderNumber,
            row.CreatedOn,
            row.OrderStatus,
            row.PaymentStatus,
            row.LatestShipment?.ShipmentStatus,
            row.LatestShipment?.CourierName,
            row.LatestShipment?.AwbCode,
            row.LatestShipment?.TrackingUrl,
            row.LatestShipment?.EstimatedDeliveryOn,
            row.GrandTotal,
            row.Currency,
            row.ItemCount,
            new AdminOrderCustomerSummary(
                row.CustomerId,
                row.CustomerName,
                row.CustomerMobile,
                row.CustomerEmail,
                row.CustomerCity,
                row.CustomerState,
                row.CustomerBlocked),
            row.Items)).ToList();

        var response = new AdminOrderListPageResponse(
            items,
            pageNumber,
            pageSize,
            totalCount,
            totalPages,
            summary);

        return ApiResponse<AdminOrderListPageResponse>.Ok(response);
    }

    public async Task<ApiResponse<AdminOrderDetailResponse>> GetOrderDetailAsync(
        Guid orderId,
        CancellationToken cancellationToken = default)
    {
        var order = await db.Orders.AsNoTracking()
            .Include(x => x.Items)
            .Include(x => x.Addresses)
            .Include(x => x.Payments)
            .Include(x => x.Shipments)
                .ThenInclude(s => s.Activities)
            .SingleOrDefaultAsync(x => x.Id == orderId, cancellationToken);

        if (order is null)
        {
            return ApiResponse<AdminOrderDetailResponse>.Fail("Order not found.", 404);
        }

        var customer = await db.Customers.AsNoTracking()
            .SingleOrDefaultAsync(c => c.Id == order.CustomerId, cancellationToken);

        var customerDto = new AdminOrderCustomerDetailResponse(
            customer?.Id ?? order.CustomerId,
            customer?.FullName ?? "Guest / Unregistered",
            customer?.MobileNumber ?? order.Addresses.FirstOrDefault()?.MobileNumber ?? string.Empty,
            customer?.Email ?? order.Addresses.FirstOrDefault()?.Email,
            customer?.City,
            customer?.State,
            customer?.PostalCode,
            customer?.IsMobileVerified ?? false,
            customer?.IsEmailVerified ?? false,
            customer?.IsProfileCompleted ?? false,
            customer?.IsBlocked ?? false,
            customer?.BlockReason,
            customer?.CreatedOn ?? order.CreatedOn);

        var shippingAddress = order.Addresses.FirstOrDefault(a => a.Type == "Shipping");
        var billingAddress = order.Addresses.FirstOrDefault(a => a.Type == "Billing") ?? shippingAddress;

        var shippingDto = shippingAddress is null ? null : new AdminOrderAddressResponse(
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

        var billingDto = billingAddress is null ? null : new AdminOrderAddressResponse(
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

        var itemsDto = order.Items.Select(i => new AdminOrderDetailItemResponse(
            i.Id,
            i.ProductId,
            i.ProductVariantId,
            i.ProductName,
            i.ProductSlug,
            i.VariantName,
            i.Sku,
            i.HsnCode,
            i.Weight,
            i.WeightUnit,
            i.Quantity,
            i.UnitPrice,
            i.UnitMrp,
            i.TaxPercentage,
            i.TaxableAmount,
            i.DiscountAmount,
            i.TaxAmount,
            i.LineTotal)).ToList();

        var paymentIds = order.Payments.Select(p => p.Id).ToList();
        var transactions = await db.PaymentTransactions.AsNoTracking()
            .Where(t => paymentIds.Contains(t.PaymentId))
            .OrderByDescending(t => t.CreatedOn)
            .ToListAsync(cancellationToken);

        var transactionsByPayment = transactions.ToLookup(t => t.PaymentId);

        var paymentsDto = order.Payments
            .OrderByDescending(p => p.CreatedOn)
            .Select(p => new AdminOrderPaymentResponse(
                p.Id,
                p.IdempotencyKey,
                p.ProviderOrderId,
                p.ProviderPaymentId,
                p.Status.ToString(),
                p.AmountPaise,
                p.AmountPaise / 100m,
                p.Currency,
                p.LastError,
                p.ExpiresOn,
                p.CreatedOn,
                p.PaidOn,
                transactionsByPayment[p.Id].Select(t => new AdminPaymentTransactionResponse(
                    t.Id,
                    t.Type,
                    t.ProviderReference,
                    t.Status,
                    t.SafePayloadJson,
                    t.CreatedOn)).ToList()))
            .ToList();

        var shipmentsDto = order.Shipments
            .OrderByDescending(s => s.CreatedOn)
            .Select(s => new AdminOrderShipmentResponse(
                s.Id,
                s.ProviderOrderId,
                s.ProviderShipmentId,
                s.CourierCompanyId,
                s.CourierName,
                s.AwbCode,
                s.TrackingUrl,
                s.LabelUrl,
                s.ManifestUrl,
                s.ProviderShippingCharge,
                s.EstimatedDeliveryOn,
                s.Status.ToString(),
                s.ProviderStatus,
                s.ProviderStatusCode,
                s.PickupScheduledOn,
                s.ShippedOn,
                s.DeliveredOn,
                s.LastError,
                s.CreatedOn,
                s.UpdatedOn,
                s.Activities
                    .OrderByDescending(a => a.Date)
                    .Select(a => new AdminShipmentActivityResponse(
                        a.Id,
                        a.Activity,
                        a.Location,
                        a.Status,
                        a.Date))
                    .ToList()))
            .ToList();

        var statusHistory = await db.OrderStatusHistories.AsNoTracking()
            .Where(h => h.OrderId == orderId)
            .OrderByDescending(h => h.CreatedOn)
            .Select(h => new AdminOrderStatusHistoryResponse(
                h.Id,
                h.Status.ToString(),
                h.Note,
                h.CreatedOn))
            .ToListAsync(cancellationToken);

        var reservations = await db.InventoryReservations.AsNoTracking()
            .Where(r => r.OrderId == orderId)
            .OrderByDescending(r => r.CreatedOn)
            .Select(r => new AdminInventoryReservationResponse(
                r.Id,
                r.ProductVariantId,
                r.Quantity,
                r.Status.ToString(),
                r.ExpiresOn,
                r.CreatedOn,
                r.CompletedOn,
                r.ReleasedOn))
            .ToListAsync(cancellationToken);

        var response = new AdminOrderDetailResponse(
            order.Id,
            order.OrderNumber,
            order.Status.ToString(),
            order.CreatedOn,
            order.UpdatedOn,
            order.PaymentExpiresOn,
            order.CheckoutSessionId,
            order.Subtotal,
            order.ItemDiscountAmount,
            order.CouponDiscountAmount,
            order.ShippingAmount,
            order.ProviderShippingCost,
            order.TaxAmount,
            order.ProductTaxAmount,
            order.PaymentServiceTaxAmount,
            order.ProductTaxRatePercent,
            order.PaymentServiceTaxRatePercent,
            order.GrandTotal,
            order.Currency,
            order.CouponId,
            order.CouponCode,
            order.CustomerNote,
            customerDto,
            shippingDto,
            billingDto,
            itemsDto,
            paymentsDto,
            shipmentsDto,
            statusHistory,
            reservations);

        return ApiResponse<AdminOrderDetailResponse>.Ok(response);
    }
}

