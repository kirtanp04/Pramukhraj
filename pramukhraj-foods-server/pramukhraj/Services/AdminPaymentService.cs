using Microsoft.EntityFrameworkCore;
using pramukhraj.Common;
using pramukhraj.Database;
using pramukhraj.DTOs.Payment;
using pramukhraj.Entities.Order;
using pramukhraj.Interfaces;

namespace pramukhraj.Services;

public sealed class AdminPaymentService(
    AppDbContext db,
    ILogger<AdminPaymentService> logger) : IAdminPaymentService
{
    public async Task<ApiResponse<AdminPaymentListPageResponse>> GetPaymentsAsync(
        AdminPaymentListRequest request,
        CancellationToken cancellationToken = default)
    {
        var pageNumber = Math.Max(1, request.PageNumber);
        var pageSize = Math.Clamp(request.PageSize, 1, 50);

        var totalPayments = await db.Payments.CountAsync(cancellationToken);
        var paidCount = await db.Payments.CountAsync(p => p.Status == PaymentStatus.Paid, cancellationToken);
        var pendingCount = await db.Payments.CountAsync(p => p.Status == PaymentStatus.Pending || p.Status == PaymentStatus.ProviderOrderCreated, cancellationToken);
        var failedCount = await db.Payments.CountAsync(p => p.Status == PaymentStatus.Failed || p.Status == PaymentStatus.VerificationFailed, cancellationToken);
        var expiredCount = await db.Payments.CountAsync(p => p.Status == PaymentStatus.Expired, cancellationToken);

        var totalPaidAmountPaise = await db.Payments
            .Where(p => p.Status == PaymentStatus.Paid)
            .SumAsync(p => (decimal)p.AmountPaise, cancellationToken);
        var totalPaidAmount = Math.Round(totalPaidAmountPaise / 100m, 2);

        var summary = new AdminPaymentSummaryResponse(
            totalPayments,
            paidCount,
            pendingCount,
            failedCount,
            expiredCount,
            totalPaidAmount);

        var baseQuery = from payment in db.Payments.AsNoTracking()
                        join order in db.Orders.AsNoTracking() on payment.OrderId equals order.Id
                        join customer in db.Customers.AsNoTracking() on order.CustomerId equals customer.Id into custGroup
                        from customer in custGroup.DefaultIfEmpty()
                        select new
                        {
                            Payment = payment,
                            Order = order,
                            Customer = customer
                        };

        if (!string.IsNullOrWhiteSpace(request.Status) && !request.Status.Equals(AdminPaymentStatuses.All, StringComparison.OrdinalIgnoreCase))
        {
            if (request.Status.Equals("Pending", StringComparison.OrdinalIgnoreCase))
            {
                baseQuery = baseQuery.Where(x => x.Payment.Status == PaymentStatus.Pending || x.Payment.Status == PaymentStatus.ProviderOrderCreated);
            }
            else if (request.Status.Equals("Failed", StringComparison.OrdinalIgnoreCase))
            {
                baseQuery = baseQuery.Where(x => x.Payment.Status == PaymentStatus.Failed || x.Payment.Status == PaymentStatus.VerificationFailed);
            }
            else if (Enum.TryParse<PaymentStatus>(request.Status, true, out var parsedStatus))
            {
                baseQuery = baseQuery.Where(x => x.Payment.Status == parsedStatus);
            }
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.Trim().ToLower();
            baseQuery = baseQuery.Where(x =>
                x.Payment.Id.ToString().ToLower().Contains(term) ||
                (x.Payment.ProviderPaymentId != null && x.Payment.ProviderPaymentId.ToLower().Contains(term)) ||
                (x.Payment.ProviderOrderId != null && x.Payment.ProviderOrderId.ToLower().Contains(term)) ||
                x.Payment.IdempotencyKey.ToLower().Contains(term) ||
                x.Order.OrderNumber.ToLower().Contains(term) ||
                (x.Customer != null && x.Customer.FullName.ToLower().Contains(term)) ||
                (x.Customer != null && x.Customer.MobileNumber.Contains(term)) ||
                (x.Customer != null && x.Customer.Email != null && x.Customer.Email.ToLower().Contains(term)));
        }

        var isAsc = string.Equals(request.SortDirection, "asc", StringComparison.OrdinalIgnoreCase);
        baseQuery = (request.SortBy?.ToLowerInvariant()) switch
        {
            "amount" => isAsc ? baseQuery.OrderBy(x => x.Payment.AmountPaise) : baseQuery.OrderByDescending(x => x.Payment.AmountPaise),
            "paidon" => isAsc ? baseQuery.OrderBy(x => x.Payment.PaidOn) : baseQuery.OrderByDescending(x => x.Payment.PaidOn),
            "status" => isAsc ? baseQuery.OrderBy(x => x.Payment.Status) : baseQuery.OrderByDescending(x => x.Payment.Status),
            "ordernumber" => isAsc ? baseQuery.OrderBy(x => x.Order.OrderNumber) : baseQuery.OrderByDescending(x => x.Order.OrderNumber),
            _ => isAsc ? baseQuery.OrderBy(x => x.Payment.CreatedOn) : baseQuery.OrderByDescending(x => x.Payment.CreatedOn)
        };

        var totalCount = await baseQuery.CountAsync(cancellationToken);
        var totalPages = totalCount == 0 ? 1 : (int)Math.Ceiling((double)totalCount / pageSize);

        var pagedRows = await baseQuery
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new
            {
                x.Payment.Id,
                x.Payment.OrderId,
                x.Order.OrderNumber,
                x.Payment.IdempotencyKey,
                x.Payment.ProviderOrderId,
                x.Payment.ProviderPaymentId,
                PaymentStatus = x.Payment.Status.ToString(),
                x.Payment.AmountPaise,
                Amount = Math.Round(x.Payment.AmountPaise / 100m, 2),
                x.Payment.Currency,
                x.Payment.LastError,
                x.Payment.ExpiresOn,
                x.Payment.CreatedOn,
                x.Payment.UpdatedOn,
                x.Payment.PaidOn,
                CustomerId = x.Customer != null ? x.Customer.Id : x.Order.CustomerId,
                CustomerName = x.Customer != null ? x.Customer.FullName : "Guest / Unknown",
                CustomerMobile = x.Customer != null ? x.Customer.MobileNumber : string.Empty,
                CustomerEmail = x.Customer != null ? x.Customer.Email : null,
                CustomerCity = x.Customer != null ? x.Customer.City : null,
                CustomerState = x.Customer != null ? x.Customer.State : null,
                CustomerBlocked = x.Customer != null && x.Customer.IsBlocked,
                OrderStatus = x.Order.Status.ToString(),
                x.Order.GrandTotal,
                ItemCount = x.Order.Items.Sum(i => i.Quantity)
            })
            .ToListAsync(cancellationToken);

        var items = pagedRows.Select(row => new AdminPaymentListItemResponse(
            row.Id,
            row.OrderId,
            row.OrderNumber,
            row.IdempotencyKey,
            row.ProviderOrderId,
            row.ProviderPaymentId,
            row.PaymentStatus,
            row.AmountPaise,
            row.Amount,
            row.Currency,
            row.LastError,
            row.ExpiresOn,
            row.CreatedOn,
            row.UpdatedOn,
            row.PaidOn,
            new AdminPaymentCustomerSummary(
                row.CustomerId,
                row.CustomerName,
                row.CustomerMobile,
                row.CustomerEmail,
                row.CustomerCity,
                row.CustomerState,
                row.CustomerBlocked),
            new AdminPaymentOrderSummary(
                row.OrderId,
                row.OrderNumber,
                row.OrderStatus,
                row.GrandTotal,
                row.Currency,
                row.ItemCount))).ToList();

        var response = new AdminPaymentListPageResponse(
            items,
            pageNumber,
            pageSize,
            totalCount,
            totalPages,
            summary);

        return ApiResponse<AdminPaymentListPageResponse>.Ok(response);
    }

    public async Task<ApiResponse<AdminPaymentDetailResponse>> GetPaymentDetailAsync(
        Guid paymentId,
        CancellationToken cancellationToken = default)
    {
        var payment = await db.Payments.AsNoTracking()
            .Include(p => p.Order)
                .ThenInclude(o => o.Items)
            .Include(p => p.Order)
                .ThenInclude(o => o.Addresses)
            .Include(p => p.Order)
                .ThenInclude(o => o.Shipments)
            .SingleOrDefaultAsync(p => p.Id == paymentId, cancellationToken);

        if (payment is null)
        {
            return ApiResponse<AdminPaymentDetailResponse>.Fail("Payment record was not found.", 404);
        }

        var order = payment.Order;
        var customer = await db.Customers.AsNoTracking()
            .SingleOrDefaultAsync(c => c.Id == order.CustomerId, cancellationToken);

        var customerSummary = new AdminPaymentCustomerSummary(
            customer?.Id ?? order.CustomerId,
            customer?.FullName ?? "Guest / Unregistered",
            customer?.MobileNumber ?? order.Addresses.FirstOrDefault()?.MobileNumber ?? string.Empty,
            customer?.Email ?? order.Addresses.FirstOrDefault()?.Email,
            customer?.City,
            customer?.State,
            customer?.IsBlocked ?? false);

        var shippingAddress = order.Addresses.FirstOrDefault(a => a.Type == "Shipping");
        var billingAddress = order.Addresses.FirstOrDefault(a => a.Type == "Billing") ?? shippingAddress;

        var shippingDto = shippingAddress is null ? null : new AdminPaymentAddressResponse(
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

        var billingDto = billingAddress is null ? null : new AdminPaymentAddressResponse(
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

        var itemsDto = order.Items.Select(i => new AdminPaymentDetailItemResponse(
            i.Id,
            i.ProductId,
            i.ProductVariantId,
            i.ProductName,
            i.ProductSlug,
            i.VariantName,
            i.Sku,
            i.Weight,
            i.WeightUnit,
            i.Quantity,
            i.UnitPrice,
            i.UnitMrp,
            i.TaxPercentage,
            i.DiscountAmount,
            i.TaxAmount,
            i.LineTotal)).ToList();

        var orderDto = new AdminPaymentOrderDetailResponse(
            order.Id,
            order.OrderNumber,
            order.Status.ToString(),
            order.CreatedOn,
            order.Subtotal,
            order.ItemDiscountAmount,
            order.CouponDiscountAmount,
            order.ShippingAmount,
            order.TaxAmount,
            order.GrandTotal,
            order.Currency,
            order.CouponCode,
            order.CustomerNote,
            shippingDto,
            billingDto,
            itemsDto);

        var latestShipment = order.Shipments.OrderByDescending(s => s.CreatedOn).FirstOrDefault();
        var shipmentDto = latestShipment is null ? null : new AdminPaymentShipmentSummaryResponse(
            latestShipment.AwbCode,
            latestShipment.CourierName,
            latestShipment.Status.ToString(),
            latestShipment.TrackingUrl,
            latestShipment.EstimatedDeliveryOn);

        var transactions = await db.PaymentTransactions.AsNoTracking()
            .Where(t => t.PaymentId == paymentId)
            .OrderByDescending(t => t.CreatedOn)
            .Select(t => new AdminPaymentTransactionDetailResponse(
                t.Id,
                t.PaymentId,
                t.Type,
                t.ProviderReference,
                t.Status,
                t.SafePayloadJson,
                t.CreatedOn))
            .ToListAsync(cancellationToken);

        var detailResponse = new AdminPaymentDetailResponse(
            payment.Id,
            payment.OrderId,
            order.OrderNumber,
            payment.IdempotencyKey,
            payment.ProviderOrderId,
            payment.ProviderPaymentId,
            payment.Status.ToString(),
            payment.AmountPaise,
            Math.Round(payment.AmountPaise / 100m, 2),
            payment.Currency,
            payment.LastError,
            payment.ExpiresOn,
            payment.CreatedOn,
            payment.UpdatedOn,
            payment.PaidOn,
            payment.ConcurrencyStamp,
            customerSummary,
            orderDto,
            shipmentDto,
            transactions);

        return ApiResponse<AdminPaymentDetailResponse>.Ok(detailResponse);
    }
}

