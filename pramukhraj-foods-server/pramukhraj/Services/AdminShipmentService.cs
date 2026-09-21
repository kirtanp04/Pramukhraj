using Microsoft.EntityFrameworkCore;
using pramukhraj.Common;
using pramukhraj.Database;
using pramukhraj.DTOs.Shipment;
using pramukhraj.Entities.Shipment;
using pramukhraj.Interfaces;

namespace pramukhraj.Services;

public sealed class AdminShipmentService(
    AppDbContext db,
    ILogger<AdminShipmentService> logger) : IAdminShipmentService
{
    public async Task<ApiResponse<AdminShipmentListPageResponse>> GetShipmentsAsync(
        AdminShipmentListRequest request,
        CancellationToken cancellationToken = default)
    {
        var pageNumber = Math.Max(1, request.PageNumber);
        var pageSize = Math.Clamp(request.PageSize, 1, 50);

        var totalShipments = await db.Shipments.CountAsync(cancellationToken);
        var pendingPickupCount = await db.Shipments.CountAsync(s =>
            s.Status == ShipmentStatus.Created ||
            s.Status == ShipmentStatus.CourierAssigned ||
            s.Status == ShipmentStatus.AwbAssigned ||
            s.Status == ShipmentStatus.PickupScheduled, cancellationToken);

        var inTransitCount = await db.Shipments.CountAsync(s =>
            s.Status == ShipmentStatus.PickedUp ||
            s.Status == ShipmentStatus.InTransit ||
            s.Status == ShipmentStatus.OutForDelivery, cancellationToken);

        var deliveredCount = await db.Shipments.CountAsync(s => s.Status == ShipmentStatus.Delivered, cancellationToken);

        var failedOrRtoCount = await db.Shipments.CountAsync(s =>
            s.Status == ShipmentStatus.DeliveryFailed ||
            s.Status == ShipmentStatus.RtoInitiated ||
            s.Status == ShipmentStatus.RtoDelivered ||
            s.Status == ShipmentStatus.Cancelled, cancellationToken);

        var totalCharges = await db.Shipments.SumAsync(s => (decimal)s.ProviderShippingCharge, cancellationToken);

        var summary = new AdminShipmentSummaryResponse(
            totalShipments,
            pendingPickupCount,
            inTransitCount,
            deliveredCount,
            failedOrRtoCount,
            Math.Round(totalCharges, 2));

        var baseQuery = from shipment in db.Shipments.AsNoTracking()
                        join order in db.Orders.AsNoTracking() on shipment.OrderId equals order.Id
                        join customer in db.Customers.AsNoTracking() on order.CustomerId equals customer.Id into custGroup
                        from customer in custGroup.DefaultIfEmpty()
                        select new
                        {
                            Shipment = shipment,
                            Order = order,
                            Customer = customer
                        };

        if (!string.IsNullOrWhiteSpace(request.Status) && !request.Status.Equals(AdminShipmentStatuses.All, StringComparison.OrdinalIgnoreCase))
        {
            if (request.Status.Equals(AdminShipmentStatuses.PendingPickup, StringComparison.OrdinalIgnoreCase))
            {
                baseQuery = baseQuery.Where(x =>
                    x.Shipment.Status == ShipmentStatus.Created ||
                    x.Shipment.Status == ShipmentStatus.CourierAssigned ||
                    x.Shipment.Status == ShipmentStatus.AwbAssigned ||
                    x.Shipment.Status == ShipmentStatus.PickupScheduled);
            }
            else if (request.Status.Equals(AdminShipmentStatuses.InTransit, StringComparison.OrdinalIgnoreCase))
            {
                baseQuery = baseQuery.Where(x =>
                    x.Shipment.Status == ShipmentStatus.PickedUp ||
                    x.Shipment.Status == ShipmentStatus.InTransit ||
                    x.Shipment.Status == ShipmentStatus.OutForDelivery);
            }
            else if (request.Status.Equals(AdminShipmentStatuses.Delivered, StringComparison.OrdinalIgnoreCase))
            {
                baseQuery = baseQuery.Where(x => x.Shipment.Status == ShipmentStatus.Delivered);
            }
            else if (request.Status.Equals(AdminShipmentStatuses.FailedOrRto, StringComparison.OrdinalIgnoreCase))
            {
                baseQuery = baseQuery.Where(x =>
                    x.Shipment.Status == ShipmentStatus.DeliveryFailed ||
                    x.Shipment.Status == ShipmentStatus.RtoInitiated ||
                    x.Shipment.Status == ShipmentStatus.RtoDelivered ||
                    x.Shipment.Status == ShipmentStatus.Cancelled);
            }
            else if (Enum.TryParse<ShipmentStatus>(request.Status, true, out var parsedStatus))
            {
                baseQuery = baseQuery.Where(x => x.Shipment.Status == parsedStatus);
            }
        }

        if (!string.IsNullOrWhiteSpace(request.CourierName))
        {
            var courier = request.CourierName.Trim().ToLower();
            baseQuery = baseQuery.Where(x => x.Shipment.CourierName != null && x.Shipment.CourierName.ToLower().Contains(courier));
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.Trim().ToLower();
            baseQuery = baseQuery.Where(x =>
                (x.Shipment.AwbCode != null && x.Shipment.AwbCode.ToLower().Contains(term)) ||
                (x.Shipment.CourierName != null && x.Shipment.CourierName.ToLower().Contains(term)) ||
                x.Order.OrderNumber.ToLower().Contains(term) ||
                x.Shipment.ProviderShipmentId.ToString().Contains(term) ||
                x.Shipment.ProviderOrderId.ToString().Contains(term) ||
                (x.Customer != null && x.Customer.FullName.ToLower().Contains(term)) ||
                (x.Customer != null && x.Customer.MobileNumber.Contains(term)) ||
                (x.Customer != null && x.Customer.Email != null && x.Customer.Email.ToLower().Contains(term)) ||
                (x.Customer != null && x.Customer.City != null && x.Customer.City.ToLower().Contains(term)));
        }

        var isAsc = string.Equals(request.SortDirection, "asc", StringComparison.OrdinalIgnoreCase);
        baseQuery = (request.SortBy?.ToLowerInvariant()) switch
        {
            "deliveredon" => isAsc ? baseQuery.OrderBy(x => x.Shipment.DeliveredOn) : baseQuery.OrderByDescending(x => x.Shipment.DeliveredOn),
            "status" => isAsc ? baseQuery.OrderBy(x => x.Shipment.Status) : baseQuery.OrderByDescending(x => x.Shipment.Status),
            "ordernumber" => isAsc ? baseQuery.OrderBy(x => x.Order.OrderNumber) : baseQuery.OrderByDescending(x => x.Order.OrderNumber),
            _ => isAsc ? baseQuery.OrderBy(x => x.Shipment.CreatedOn) : baseQuery.OrderByDescending(x => x.Shipment.CreatedOn)
        };

        var totalCount = await baseQuery.CountAsync(cancellationToken);
        var totalPages = totalCount == 0 ? 1 : (int)Math.Ceiling((double)totalCount / pageSize);

        var pagedRows = await baseQuery
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new
            {
                x.Shipment.Id,
                x.Shipment.OrderId,
                x.Order.OrderNumber,
                x.Shipment.ProviderOrderId,
                x.Shipment.ProviderShipmentId,
                x.Shipment.CourierCompanyId,
                x.Shipment.CourierName,
                x.Shipment.AwbCode,
                x.Shipment.TrackingUrl,
                x.Shipment.LabelUrl,
                x.Shipment.ManifestUrl,
                x.Shipment.ProviderShippingCharge,
                x.Shipment.EstimatedDeliveryOn,
                ShipmentStatus = x.Shipment.Status.ToString(),
                x.Shipment.ProviderStatus,
                x.Shipment.PickupScheduledOn,
                x.Shipment.ShippedOn,
                x.Shipment.DeliveredOn,
                x.Shipment.LastError,
                x.Shipment.CreatedOn,
                x.Shipment.UpdatedOn,
                CustomerId = x.Customer != null ? x.Customer.Id : x.Order.CustomerId,
                CustomerName = x.Customer != null ? x.Customer.FullName : "Guest / Unknown",
                CustomerMobile = x.Customer != null ? x.Customer.MobileNumber : string.Empty,
                CustomerEmail = x.Customer != null ? x.Customer.Email : null,
                CustomerCity = x.Customer != null ? x.Customer.City : null,
                CustomerState = x.Customer != null ? x.Customer.State : null,
                CustomerPostalCode = x.Customer != null ? x.Customer.PostalCode : null,
                CustomerBlocked = x.Customer != null && x.Customer.IsBlocked,
                OrderStatus = x.Order.Status.ToString(),
                PaymentStatus = x.Order.Payments.OrderByDescending(p => p.CreatedOn).Select(p => p.Status.ToString()).FirstOrDefault() ?? "Pending",
                x.Order.GrandTotal,
                x.Order.Currency,
                ItemCount = x.Order.Items.Sum(i => i.Quantity),
                x.Order.SelectedCourierName,
                ActivityCount = x.Shipment.Activities.Count,
                LatestActivity = x.Shipment.Activities.OrderByDescending(a => a.Date).Select(a => a.Activity).FirstOrDefault(),
                LatestLocation = x.Shipment.Activities.OrderByDescending(a => a.Date).Select(a => a.Location).FirstOrDefault()
            })
            .ToListAsync(cancellationToken);

        var items = pagedRows.Select(row => new AdminShipmentListItemResponse(
            row.Id,
            row.OrderId,
            row.OrderNumber,
            row.ProviderOrderId,
            row.ProviderShipmentId,
            row.CourierCompanyId,
            row.CourierName,
            row.AwbCode,
            row.TrackingUrl,
            row.LabelUrl,
            row.ManifestUrl,
            row.ProviderShippingCharge,
            row.EstimatedDeliveryOn,
            row.ShipmentStatus,
            row.ProviderStatus,
            row.PickupScheduledOn,
            row.ShippedOn,
            row.DeliveredOn,
            row.LastError,
            row.CreatedOn,
            row.UpdatedOn,
            new AdminShipmentCustomerSummary(
                row.CustomerId,
                row.CustomerName,
                row.CustomerMobile,
                row.CustomerEmail,
                row.CustomerCity,
                row.CustomerState,
                row.CustomerPostalCode,
                row.CustomerBlocked),
            new AdminShipmentOrderSummary(
                row.OrderId,
                row.OrderNumber,
                row.OrderStatus,
                row.PaymentStatus,
                row.GrandTotal,
                row.Currency,
                row.ItemCount,
                row.SelectedCourierName),
            row.ActivityCount,
            row.LatestActivity,
            row.LatestLocation)).ToList();

        var response = new AdminShipmentListPageResponse(
            items,
            pageNumber,
            pageSize,
            totalCount,
            totalPages,
            summary);

        return ApiResponse<AdminShipmentListPageResponse>.Ok(response);
    }

    public async Task<ApiResponse<AdminShipmentDetailResponse>> GetShipmentDetailAsync(
        Guid shipmentId,
        CancellationToken cancellationToken = default)
    {
        var shipment = await db.Shipments.AsNoTracking()
            .Include(s => s.Activities)
            .Include(s => s.Order)
                .ThenInclude(o => o.Items)
            .Include(s => s.Order)
                .ThenInclude(o => o.Addresses)
            .Include(s => s.Order)
                .ThenInclude(o => o.Payments)
            .SingleOrDefaultAsync(s => s.Id == shipmentId, cancellationToken);

        if (shipment is null)
        {
            return ApiResponse<AdminShipmentDetailResponse>.Fail("Shipment record was not found.", 404);
        }

        var order = shipment.Order;
        var customer = await db.Customers.AsNoTracking()
            .SingleOrDefaultAsync(c => c.Id == order.CustomerId, cancellationToken);

        var customerSummary = new AdminShipmentCustomerSummary(
            customer?.Id ?? order.CustomerId,
            customer?.FullName ?? "Guest / Unregistered",
            customer?.MobileNumber ?? order.Addresses.FirstOrDefault()?.MobileNumber ?? string.Empty,
            customer?.Email ?? order.Addresses.FirstOrDefault()?.Email,
            customer?.City,
            customer?.State,
            customer?.PostalCode,
            customer?.IsBlocked ?? false);

        var shippingAddress = order.Addresses.FirstOrDefault(a => a.Type == "Shipping");
        var billingAddress = order.Addresses.FirstOrDefault(a => a.Type == "Billing") ?? shippingAddress;

        var shippingDto = shippingAddress is null ? null : new AdminShipmentAddressResponse(
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

        var billingDto = billingAddress is null ? null : new AdminShipmentAddressResponse(
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

        var itemsDto = order.Items.Select(i => new AdminShipmentDetailItemResponse(
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
            i.LineTotal)).ToList();

        var paymentStatus = order.Payments.OrderByDescending(p => p.CreatedOn).Select(p => p.Status.ToString()).FirstOrDefault() ?? "Pending";

        var orderDto = new AdminShipmentOrderDetailResponse(
            order.Id,
            order.OrderNumber,
            order.Status.ToString(),
            paymentStatus,
            order.CreatedOn,
            order.Subtotal,
            order.ShippingAmount,
            order.TaxAmount,
            order.GrandTotal,
            order.Currency,
            order.CustomerNote,
            shippingDto,
            billingDto,
            itemsDto);

        var activitiesDto = shipment.Activities
            .OrderByDescending(a => a.Date)
            .Select(a => new AdminShipmentActivityResponse(
                a.Id,
                a.ShipmentId,
                a.Activity,
                a.Location,
                a.Status,
                a.Date,
                a.CreatedOn))
            .ToList();

        var detailResponse = new AdminShipmentDetailResponse(
            shipment.Id,
            shipment.OrderId,
            order.OrderNumber,
            shipment.ProviderOrderId,
            shipment.ProviderShipmentId,
            shipment.CourierCompanyId,
            shipment.CourierName,
            shipment.AwbCode,
            shipment.TrackingUrl,
            shipment.LabelUrl,
            shipment.ManifestUrl,
            shipment.ProviderShippingCharge,
            shipment.EstimatedDeliveryOn,
            shipment.Status.ToString(),
            shipment.ProviderStatus,
            shipment.ProviderStatusCode,
            shipment.PickupScheduledOn,
            shipment.ShippedOn,
            shipment.DeliveredOn,
            shipment.LastError,
            shipment.CreatedOn,
            shipment.UpdatedOn,
            shipment.ConcurrencyStamp,
            customerSummary,
            orderDto,
            activitiesDto);

        return ApiResponse<AdminShipmentDetailResponse>.Ok(detailResponse);
    }
}

