using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using pramukhraj.Common;
using pramukhraj.Database;
using pramukhraj.DTOs.Return;
using pramukhraj.Entities;
using pramukhraj.Entities.Customer;
using pramukhraj.Entities.Order;
using pramukhraj.Entities.Return;
using pramukhraj.Entities.Shipment;
using pramukhraj.Interfaces;
using pramukhraj.DTOs.Email;
using pramukhraj.DTOs.Notifications;
using static pramukhraj.Common.AdminActions;

namespace pramukhraj.Services;

public sealed class ReturnService(
    AppDbContext db,
    IStoreSettingsService settingsService,
    IHttpContextAccessor httpContextAccessor,
    IAdminNotificationService adminNotifications,
    IEmailService emailService,
    IShiprocketFulfillmentService shiprocketService,
    ICacheService cache,
    ILogger<ReturnService> logger) : IReturnService
{
    // ==========================================
    // Customer Operations
    // ==========================================

    public async Task<ApiResponse<ReturnEligibilityResponse>> GetOrderReturnEligibilityAsync(
        Guid orderId,
        Guid customerId,
        CancellationToken ct = default)
    {
        try
        {
            var order = await db.Orders.AsNoTracking()
                .Include(o => o.Items)
                .Include(o => o.Shipments)
                .Include(o => o.Returns).ThenInclude(r => r.Items)
                .SingleOrDefaultAsync(o => o.Id == orderId && o.CustomerId == customerId, ct);

            if (order is null)
                return ApiResponse<ReturnEligibilityResponse>.Fail("Order was not found.", 404);

            var settings = await settingsService.GetCurrentAsync(ct);
            var returnWindowDays = Math.Clamp(settings.ReturnWindowDays, 0, 365);

            if (returnWindowDays == 0)
            {
                return ApiResponse<ReturnEligibilityResponse>.Ok(new ReturnEligibilityResponse(
                    IsEligible: false,
                    ReturnWindowDays: 0,
                    DeliveredOn: null,
                    ReturnWindowExpiresOn: null,
                    IneligibilityReason: "Returns are not applicable for this store as per store policy.",
                    Items: []));
            }

            if (order.Status != OrderStatus.Confirmed)
            {
                return ApiResponse<ReturnEligibilityResponse>.Ok(new ReturnEligibilityResponse(
                    IsEligible: false,
                    ReturnWindowDays: returnWindowDays,
                    DeliveredOn: null,
                    ReturnWindowExpiresOn: null,
                    IneligibilityReason: "Returns can only be requested for confirmed and delivered orders.",
                    Items: []));
            }

            var latestDeliveredShipment = order.Shipments
                .Where(s => s.Status == ShipmentStatus.Delivered || s.DeliveredOn.HasValue)
                .OrderByDescending(s => s.DeliveredOn ?? s.ShippedOn)
                .FirstOrDefault();

            if (latestDeliveredShipment is null || !latestDeliveredShipment.DeliveredOn.HasValue)
            {
                return ApiResponse<ReturnEligibilityResponse>.Ok(new ReturnEligibilityResponse(
                    IsEligible: false,
                    ReturnWindowDays: returnWindowDays,
                    DeliveredOn: null,
                    ReturnWindowExpiresOn: null,
                    IneligibilityReason: "This order has not been marked as delivered yet. Returns can only be initiated after delivery.",
                    Items: []));
            }

            var deliveredOn = latestDeliveredShipment.DeliveredOn.Value;
            var expiresOn = deliveredOn.AddDays(returnWindowDays);

            if (DateTime.UtcNow > expiresOn)
            {
                return ApiResponse<ReturnEligibilityResponse>.Ok(new ReturnEligibilityResponse(
                    IsEligible: false,
                    ReturnWindowDays: returnWindowDays,
                    DeliveredOn: deliveredOn,
                    ReturnWindowExpiresOn: expiresOn,
                    IneligibilityReason: $"The return window of {returnWindowDays} day(s) for this order expired on {expiresOn:dd MMM yyyy, hh:mm tt} UTC.",
                    Items: []));
            }

            var eligibleItems = await CalculateEligibleItemsAsync(order, ct);
            var anyReturnable = eligibleItems.Any(i => i.ReturnableQuantity > 0);
            var policies = (await GetReturnReasonPoliciesAsync(ct)).Data;

            return ApiResponse<ReturnEligibilityResponse>.Ok(new ReturnEligibilityResponse(
                IsEligible: anyReturnable,
                ReturnWindowDays: returnWindowDays,
                DeliveredOn: deliveredOn,
                ReturnWindowExpiresOn: expiresOn,
                IneligibilityReason: anyReturnable ? null : "All items in this order have already been returned, are non-returnable, or have an active return request.",
                Items: eligibleItems,
                OrderShippingAmount: order.ShippingAmount,
                OrderPaymentFeeAmount: order.PaymentServiceTaxAmount,
                Policies: policies));
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to determine return eligibility for OrderId={OrderId}, CustomerId={CustomerId}", orderId, customerId);
            return ApiResponse<ReturnEligibilityResponse>.Fail("Unable to check return eligibility right now. Please try again.", 500);
        }
    }

    public async Task<ApiResponse<CustomerReturnDetailsResponse>> CreateReturnRequestAsync(
        Guid orderId,
        Guid customerId,
        CreateReturnRequest request,
        CancellationToken ct = default)
    {
        if (request is null || request.Items is null || request.Items.Count == 0)
            return ApiResponse<CustomerReturnDetailsResponse>.Fail("At least one item must be selected for return.", 400);

        try
        {
            var order = await db.Orders
                .Include(o => o.Items)
                .Include(o => o.Shipments)
                .Include(o => o.Returns).ThenInclude(r => r.Items)
                .SingleOrDefaultAsync(o => o.Id == orderId && o.CustomerId == customerId, ct);

            if (order is null)
                return ApiResponse<CustomerReturnDetailsResponse>.Fail("Order was not found.", 404);

            var settings = await settingsService.GetCurrentAsync(ct);
            var returnWindowDays = Math.Clamp(settings.ReturnWindowDays, 0, 365);

            if (returnWindowDays == 0)
                return ApiResponse<CustomerReturnDetailsResponse>.Fail("Returns are not applicable for this store as per store policy.", 400);

            if (order.Status != OrderStatus.Confirmed)
                return ApiResponse<CustomerReturnDetailsResponse>.Fail("Returns can only be requested for confirmed and delivered orders.", 400);

            var deliveredShipment = order.Shipments
                .Where(s => s.Status == ShipmentStatus.Delivered || s.DeliveredOn.HasValue)
                .OrderByDescending(s => s.DeliveredOn)
                .FirstOrDefault();

            if (deliveredShipment is null || !deliveredShipment.DeliveredOn.HasValue)
                return ApiResponse<CustomerReturnDetailsResponse>.Fail("This order has not been marked as delivered yet.", 400);

            var expiresOn = deliveredShipment.DeliveredOn.Value.AddDays(returnWindowDays);
            if (DateTime.UtcNow > expiresOn)
                return ApiResponse<CustomerReturnDetailsResponse>.Fail($"The return window of {returnWindowDays} day(s) for this order has expired.", 400);

            var eligibleItems = (await CalculateEligibleItemsAsync(order, ct)).ToDictionary(i => i.OrderItemId);

            decimal totalRefundAmount = 0m;
            var returnItems = new List<ReturnItem>();
            var now = DateTime.UtcNow;

            foreach (var reqItem in request.Items)
            {
                if (!eligibleItems.TryGetValue(reqItem.OrderItemId, out var eligible) || eligible.ReturnableQuantity <= 0)
                    return ApiResponse<CustomerReturnDetailsResponse>.Fail($"Item '{reqItem.OrderItemId}' is not eligible for return.", 400);

                if (!eligible.IsReturnable)
                    return ApiResponse<CustomerReturnDetailsResponse>.Fail($"Item '{eligible.ProductName}' is non-returnable as per store policy.", 400);

                if (reqItem.Quantity <= 0 || reqItem.Quantity > eligible.ReturnableQuantity)
                    return ApiResponse<CustomerReturnDetailsResponse>.Fail(
                        $"Requested return quantity for '{eligible.ProductName}' exceeds the available returnable quantity of {eligible.ReturnableQuantity}.", 400);

                var itemRefund = Math.Round(eligible.RefundPerItem * reqItem.Quantity, 2, MidpointRounding.AwayFromZero);
                totalRefundAmount += itemRefund;

                returnItems.Add(new ReturnItem
                {
                    Id = Guid.NewGuid(),
                    OrderItemId = eligible.OrderItemId,
                    ProductVariantId = eligible.ProductVariantId,
                    ProductName = eligible.ProductName,
                    VariantName = eligible.VariantName,
                    Quantity = reqItem.Quantity,
                    UnitPrice = eligible.UnitPrice,
                    RefundAmount = itemRefund,
                    InspectionStatus = InspectionOutcome.Pending,
                    RestockInventory = true
                });
            }

            // Load refund policy for this specific return reason
            var policy = await db.ReturnReasonPolicies.AsNoTracking().SingleOrDefaultAsync(p => p.Reason == request.Reason, ct);
            bool allowProduct = policy?.RefundProductAmount ?? true;
            bool allowShipping = policy?.RefundShippingAmount ?? false;
            bool allowPaymentFee = policy?.RefundPaymentFee ?? false;

            // Prevent duplicate refund of shipping and payment fee across returns for the same order
            var priorReturns = await db.ReturnRequests
                .Where(r => r.OrderId == order.Id && r.Status != ReturnStatus.Rejected && r.Status != ReturnStatus.Cancelled)
                .ToListAsync(ct);

            decimal alreadyRefundedShipping = priorReturns.Sum(r => r.ShippingRefundAmount);
            decimal availableShipping = Math.Max(0m, order.ShippingAmount - alreadyRefundedShipping);

            decimal alreadyRefundedPaymentFee = priorReturns.Sum(r => r.PaymentFeeRefundAmount);
            decimal availablePaymentFee = Math.Max(0m, order.PaymentServiceTaxAmount - alreadyRefundedPaymentFee);

            decimal productRefund = allowProduct ? totalRefundAmount : 0m;
            decimal shippingRefund = allowShipping ? availableShipping : 0m;
            decimal paymentFeeRefund = allowPaymentFee ? availablePaymentFee : 0m;
            decimal calculatedTotalRefund = productRefund + shippingRefund + paymentFeeRefund;

            var returnNumber = await GenerateReturnNumberAsync(ct);
            var returnRequest = new ReturnRequest
            {
                Id = Guid.NewGuid(),
                OrderId = order.Id,
                CustomerId = customerId,
                ReturnNumber = returnNumber,
                Status = ReturnStatus.Requested,
                Reason = request.Reason,
                Resolution = request.Resolution,
                CustomerComments = (request.CustomerComments ?? string.Empty).Trim().Length > 1000
                    ? (request.CustomerComments ?? string.Empty).Trim()[..1000]
                    : (request.CustomerComments ?? string.Empty).Trim(),
                ProductRefundAmount = productRefund,
                ShippingRefundAmount = shippingRefund,
                PaymentFeeRefundAmount = paymentFeeRefund,
                TotalRefundAmount = calculatedTotalRefund,
                ReverseShippingDeduction = 0m,
                NetRefundAmount = calculatedTotalRefund,
                CreatedOn = now,
                UpdatedOn = now,
                ConcurrencyStamp = Guid.NewGuid().ToString("N"),
                Items = returnItems
            };

            if (request.Media is not null)
            {
                foreach (var m in request.Media.Take(5))
                {
                    if (!string.IsNullOrWhiteSpace(m.Url))
                    {
                        returnRequest.Media.Add(new ReturnMedia
                        {
                            Id = Guid.NewGuid(),
                            ReturnRequestId = returnRequest.Id,
                            Url = m.Url.Trim(),
                            FileName = string.IsNullOrWhiteSpace(m.FileName) ? "photo.jpg" : m.FileName.Trim(),
                            ContentType = string.IsNullOrWhiteSpace(m.ContentType) ? "image/jpeg" : m.ContentType.Trim(),
                            FileSizeBytes = m.FileSizeBytes,
                            CreatedOn = now
                        });
                    }
                }
            }

            returnRequest.StatusHistory.Add(new ReturnStatusHistory
            {
                ReturnRequestId = returnRequest.Id,
                Status = ReturnStatus.Requested,
                Note = "Return request initiated by customer.",
                CreatedOn = now
            });

            db.ReturnRequests.Add(returnRequest);
            await db.SaveChangesAsync(ct);

            logger.LogInformation("Return request {ReturnNumber} created successfully for OrderId={OrderId}, CustomerId={CustomerId}", returnNumber, orderId, customerId);

            // Real-time admin notification
            try
            {
                await adminNotifications.CreateAsync(new CreateAdminNotification(
                    Type: "ReturnRequested",
                    Severity: "Info",
                    Title: $"New Return Request #{returnNumber}",
                    Message: $"Customer requested return for {returnItems.Count} item(s) on Order #{order.OrderNumber} (Refund value: ₹{totalRefundAmount:N2}).",
                    EntityType: "Return",
                    EntityId: returnRequest.Id.ToString(),
                    ActionUrl: "/admin/returns"), publishImmediately: true, cancellationToken: ct);
            }
            catch (Exception notifEx)
            {
                logger.LogWarning(notifEx, "Failed to publish admin notification for Return {ReturnNumber}", returnNumber);
            }

            // Customer confirmation email
            try
            {
                var customer = await db.Customers.AsNoTracking().SingleOrDefaultAsync(c => c.Id == customerId, ct);
                if (customer is not null && !string.IsNullOrWhiteSpace(customer.Email))
                {
                    await emailService.SendAsync(new EmailMessage(
                        customer.Email,
                        customer.FullName ?? "Customer",
                        $"Return Request Received - #{returnNumber}",
                        $"<p>Dear {customer.FullName ?? "Customer"},</p><p>We have received your return request <strong>#{returnNumber}</strong> for Order #{order.OrderNumber}.</p><p>Our team is reviewing your request and will update you shortly.</p>",
                        $"Dear {customer.FullName ?? "Customer"},\n\nWe have received your return request #{returnNumber} for Order #{order.OrderNumber}.\nOur team is reviewing your request and will update you shortly."), ct);
                }
            }
            catch (Exception emailEx)
            {
                logger.LogWarning(emailEx, "Failed to send customer return acknowledgement email for Return {ReturnNumber}", returnNumber);
            }

            return ApiResponse<CustomerReturnDetailsResponse>.Ok(
                MapCustomerReturnDetails(returnRequest, order.OrderNumber),
                "Return request submitted successfully. Our team will review your request shortly.");
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to create return request for OrderId={OrderId}, CustomerId={CustomerId}", orderId, customerId);
            return ApiResponse<CustomerReturnDetailsResponse>.Fail("Failed to submit return request. Please try again.", 500);
        }
    }

    public async Task<ApiResponse<CustomerReturnListPageResponse>> GetCustomerReturnsAsync(
        Guid customerId,
        int page,
        int pageSize,
        CancellationToken ct = default)
    {
        try
        {
            var pageNumber = Math.Max(1, page);
            var safeSize = Math.Clamp(pageSize, 1, 50);

            var query = db.ReturnRequests.AsNoTracking()
                .Where(r => r.CustomerId == customerId);

            var totalCount = await query.CountAsync(ct);
            var totalPages = (int)Math.Ceiling(totalCount / (double)safeSize);

            var items = await query
                .OrderByDescending(r => r.CreatedOn)
                .Skip((pageNumber - 1) * safeSize)
                .Take(safeSize)
                .Select(r => new CustomerReturnSummaryResponse(
                    r.Id,
                    r.ReturnNumber,
                    r.OrderId,
                    r.Order.OrderNumber,
                    r.Status,
                    r.Reason,
                    r.Items.Sum(i => i.Quantity),
                    r.NetRefundAmount,
                    r.CreatedOn,
                    r.CompletedOn))
                .ToListAsync(ct);

            return ApiResponse<CustomerReturnListPageResponse>.Ok(new CustomerReturnListPageResponse(
                Returns: items,
                PageNumber: pageNumber,
                PageSize: safeSize,
                TotalCount: totalCount,
                TotalPages: totalPages));
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to load returns for CustomerId={CustomerId}", customerId);
            return ApiResponse<CustomerReturnListPageResponse>.Fail("Unable to retrieve return history.", 500);
        }
    }

    public async Task<ApiResponse<CustomerReturnDetailsResponse>> GetCustomerReturnDetailsAsync(
        Guid returnId,
        Guid customerId,
        CancellationToken ct = default)
    {
        try
        {
            var returnRequest = await db.ReturnRequests.AsNoTracking()
                .Include(r => r.Order)
                .Include(r => r.Items)
                .Include(r => r.Media)
                .Include(r => r.StatusHistory.OrderBy(h => h.CreatedOn))
                .Include(r => r.Refund)
                .SingleOrDefaultAsync(r => r.Id == returnId && r.CustomerId == customerId, ct);

            if (returnRequest is null)
                return ApiResponse<CustomerReturnDetailsResponse>.Fail("Return request was not found.", 404);

            var storeSettings = await settingsService.GetCurrentAsync(ct);
            return ApiResponse<CustomerReturnDetailsResponse>.Ok(
                MapCustomerReturnDetails(returnRequest, returnRequest.Order.OrderNumber, storeSettings));
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to load return details for ReturnId={ReturnId}, CustomerId={CustomerId}", returnId, customerId);
            return ApiResponse<CustomerReturnDetailsResponse>.Fail("Unable to retrieve return details.", 500);
        }
    }

    public async Task<ApiResponse<CustomerReturnDetailsResponse>> CancelReturnRequestAsync(
        Guid returnId,
        Guid customerId,
        CancellationToken ct = default)
    {
        try
        {
            var returnRequest = await db.ReturnRequests
                .Include(r => r.Order)
                .Include(r => r.Items)
                .Include(r => r.Media)
                .Include(r => r.StatusHistory)
                .Include(r => r.Refund)
                .SingleOrDefaultAsync(r => r.Id == returnId && r.CustomerId == customerId, ct);

            if (returnRequest is null)
                return ApiResponse<CustomerReturnDetailsResponse>.Fail("Return request was not found.", 404);

            if (returnRequest.Status != ReturnStatus.Requested)
                return ApiResponse<CustomerReturnDetailsResponse>.Fail("Only return requests in 'Requested' status can be cancelled.", 400);

            var now = DateTime.UtcNow;
            returnRequest.Status = ReturnStatus.Cancelled;
            returnRequest.UpdatedOn = now;
            returnRequest.CompletedOn = now;
            returnRequest.ConcurrencyStamp = Guid.NewGuid().ToString("N");

            returnRequest.StatusHistory.Add(new ReturnStatusHistory
            {
                ReturnRequestId = returnRequest.Id,
                Status = ReturnStatus.Cancelled,
                Note = "Return request cancelled by customer.",
                CreatedOn = now
            });

            await db.SaveChangesAsync(ct);
            logger.LogInformation("Return request {ReturnNumber} cancelled by customer {CustomerId}", returnRequest.ReturnNumber, customerId);

            return ApiResponse<CustomerReturnDetailsResponse>.Ok(
                MapCustomerReturnDetails(returnRequest, returnRequest.Order.OrderNumber),
                "Return request cancelled successfully.");
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to cancel return ReturnId={ReturnId}, CustomerId={CustomerId}", returnId, customerId);
            return ApiResponse<CustomerReturnDetailsResponse>.Fail("Unable to cancel return request.", 500);
        }
    }

    // ==========================================
    // Admin Operations
    // ==========================================

    public async Task<ApiResponse<AdminReturnListPageResponse>> GetAdminReturnsAsync(
        AdminReturnFilterRequest filter,
        CancellationToken ct = default)
    {
        try
        {
            var pageNumber = Math.Max(1, filter.Page);
            var safeSize = Math.Clamp(filter.PageSize, 1, 50);

            var counts = new AdminReturnStatusCounts(
                Total: await db.ReturnRequests.CountAsync(ct),
                Requested: await db.ReturnRequests.CountAsync(r => r.Status == ReturnStatus.Requested, ct),
                Approved: await db.ReturnRequests.CountAsync(r => r.Status == ReturnStatus.Approved, ct),
                Rejected: await db.ReturnRequests.CountAsync(r => r.Status == ReturnStatus.Rejected, ct),
                PickupScheduled: await db.ReturnRequests.CountAsync(r => r.Status == ReturnStatus.PickupScheduled, ct),
                InTransit: await db.ReturnRequests.CountAsync(r => r.Status == ReturnStatus.InTransit, ct),
                DeliveredToWarehouse: await db.ReturnRequests.CountAsync(r => r.Status == ReturnStatus.DeliveredToWarehouse, ct),
                InspectionPassed: await db.ReturnRequests.CountAsync(r => r.Status == ReturnStatus.InspectionPassed, ct),
                InspectionFailed: await db.ReturnRequests.CountAsync(r => r.Status == ReturnStatus.InspectionFailed, ct),
                RefundCompleted: await db.ReturnRequests.CountAsync(r => r.Status == ReturnStatus.RefundCompleted, ct),
                Cancelled: await db.ReturnRequests.CountAsync(r => r.Status == ReturnStatus.Cancelled, ct));

            var query = from r in db.ReturnRequests.AsNoTracking()
                        join o in db.Orders.AsNoTracking() on r.OrderId equals o.Id
                        join c in db.Customers.AsNoTracking() on r.CustomerId equals c.Id into custGroup
                        from c in custGroup.DefaultIfEmpty()
                        select new
                        {
                            Return = r,
                            OrderNumber = o.OrderNumber,
                            CustomerName = c != null ? c.FullName : "Customer",
                            CustomerEmail = c != null ? c.Email : string.Empty,
                            CustomerPhone = c != null ? c.MobileNumber : string.Empty
                        };

            if (filter.Status.HasValue)
                query = query.Where(x => x.Return.Status == filter.Status.Value);

            if (!string.IsNullOrWhiteSpace(filter.SearchQuery))
            {
                var search = filter.SearchQuery.Trim().ToLower();
                query = query.Where(x =>
                    x.Return.ReturnNumber.ToLower().Contains(search) ||
                    x.OrderNumber.ToLower().Contains(search) ||
                    x.CustomerName.ToLower().Contains(search) ||
                    x.CustomerEmail.ToLower().Contains(search) ||
                    x.CustomerPhone.Contains(search));
            }

            if (filter.StartDate.HasValue)
                query = query.Where(x => x.Return.CreatedOn >= filter.StartDate.Value);

            if (filter.EndDate.HasValue)
                query = query.Where(x => x.Return.CreatedOn <= filter.EndDate.Value);

            var totalCount = await query.CountAsync(ct);
            var totalPages = (int)Math.Ceiling(totalCount / (double)safeSize);

            var items = await query
                .OrderByDescending(x => x.Return.CreatedOn)
                .Skip((pageNumber - 1) * safeSize)
                .Take(safeSize)
                .Select(x => new AdminReturnSummaryResponse(
                    x.Return.Id,
                    x.Return.ReturnNumber,
                    x.Return.OrderId,
                    x.OrderNumber,
                    x.Return.CustomerId,
                    x.CustomerName,
                    x.CustomerEmail,
                    x.CustomerPhone,
                    x.Return.Status,
                    x.Return.Reason,
                    x.Return.Resolution,
                    x.Return.Items.Sum(i => i.Quantity),
                    x.Return.TotalRefundAmount,
                    x.Return.ReverseShippingDeduction,
                    x.Return.NetRefundAmount,
                    x.Return.CreatedOn,
                    x.Return.UpdatedOn))
                .ToListAsync(ct);

            return ApiResponse<AdminReturnListPageResponse>.Ok(new AdminReturnListPageResponse(
                Returns: items,
                PageNumber: pageNumber,
                PageSize: safeSize,
                TotalCount: totalCount,
                TotalPages: totalPages,
                StatusCounts: counts));
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to load admin returns list");
            return ApiResponse<AdminReturnListPageResponse>.Fail("Unable to retrieve return requests.", 500);
        }
    }

    public async Task<ApiResponse<AdminReturnDetailsResponse>> GetAdminReturnDetailsAsync(
        Guid returnId,
        CancellationToken ct = default)
    {
        try
        {
            var returnRequest = await db.ReturnRequests.AsNoTracking()
                .Include(r => r.Order)
                .Include(r => r.Items)
                .Include(r => r.Media)
                .Include(r => r.StatusHistory.OrderBy(h => h.CreatedOn))
                .Include(r => r.Refund)
                .SingleOrDefaultAsync(r => r.Id == returnId, ct);

            if (returnRequest is null)
                return ApiResponse<AdminReturnDetailsResponse>.Fail("Return request was not found.", 404);

            var customer = await db.Customers.AsNoTracking().SingleOrDefaultAsync(c => c.Id == returnRequest.CustomerId, ct);
            var storeSettings = await settingsService.GetCurrentAsync(ct);
            var policy = await db.ReturnReasonPolicies.AsNoTracking().SingleOrDefaultAsync(p => p.Reason == returnRequest.Reason, ct);

            return ApiResponse<AdminReturnDetailsResponse>.Ok(
                MapAdminReturnDetails(returnRequest, returnRequest.Order.OrderNumber, customer, storeSettings, policy));
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to load admin return details for ReturnId={ReturnId}", returnId);
            return ApiResponse<AdminReturnDetailsResponse>.Fail("Unable to retrieve return details.", 500);
        }
    }

    public async Task<ApiResponse<AdminReturnDetailsResponse>> ApproveReturnAsync(
        Guid returnId,
        AdminApproveReturnRequest request,
        CancellationToken ct = default)
    {
        var adminInfo = Common.Common.GetAdminClaimInfo(httpContextAccessor);
        if (!adminInfo.Success || adminInfo.Data is null || !Guid.TryParse(adminInfo.Data.Id, out var adminId))
            return ApiResponse<AdminReturnDetailsResponse>.Fail("Admin authentication required.", 401);

        try
        {
            var returnRequest = await db.ReturnRequests
                .Include(r => r.Order)
                .Include(r => r.Items)
                .Include(r => r.Media)
                .Include(r => r.StatusHistory)
                .Include(r => r.Refund)
                .SingleOrDefaultAsync(r => r.Id == returnId, ct);

            if (returnRequest is null)
                return ApiResponse<AdminReturnDetailsResponse>.Fail("Return request was not found.", 404);

            if (returnRequest.Status != ReturnStatus.Requested)
                return ApiResponse<AdminReturnDetailsResponse>.Fail($"Return cannot be approved from current status '{returnRequest.Status}'.", 400);

            var deduction = Math.Clamp(request.ReverseShippingDeduction, 0m, returnRequest.TotalRefundAmount);
            var now = DateTime.UtcNow;

            returnRequest.Status = ReturnStatus.Approved;
            returnRequest.ReverseShippingDeduction = deduction;
            returnRequest.NetRefundAmount = Math.Max(0m, returnRequest.TotalRefundAmount - deduction);
            returnRequest.AdminNotes = request.AdminNotes?.Trim();
            returnRequest.ApprovedOn = now;
            returnRequest.UpdatedOn = now;
            returnRequest.ConcurrencyStamp = Guid.NewGuid().ToString("N");

            returnRequest.StatusHistory.Add(new ReturnStatusHistory
            {
                ReturnRequestId = returnRequest.Id,
                Status = ReturnStatus.Approved,
                Note = $"Return approved by {adminInfo.Data.UserName}. Reverse shipping fee: ₹{deduction:F2}. Net refund: ₹{returnRequest.NetRefundAmount:F2}.",
                ActorAdminId = adminId,
                ActorAdminName = adminInfo.Data.UserName,
                CreatedOn = now
            });

            db.AdminActions.Add(new AdminAction
            {
                Id = Guid.NewGuid(),
                AdminId = adminId,
                AdminName = adminInfo.Data.UserName ?? "Admin",
                Module = AdminActionModules.StoreSettings,
                Action = AdminActionTypes.Update,
                EntityName = $"Return {returnRequest.ReturnNumber}",
                Description = $"Approved return request with ₹{deduction:F2} deduction.",
                CreatedOn = now
            });

            await db.SaveChangesAsync(ct);
            logger.LogInformation("Return request {ReturnNumber} approved by admin {AdminId}", returnRequest.ReturnNumber, adminId);

            var customer = await db.Customers.AsNoTracking().SingleOrDefaultAsync(c => c.Id == returnRequest.CustomerId, ct);

            var storeSettings = await settingsService.GetCurrentAsync(ct);

            if (customer is not null && !string.IsNullOrWhiteSpace(customer.Email))
            {
                try
                {
                    var returnFacility = !string.IsNullOrWhiteSpace(storeSettings.StoreAddress)
                        ? $"<p><strong>Return Facility / Dispatch Address:</strong><br/>{storeSettings.StoreName}<br/>{storeSettings.StoreAddress}</p>"
                        : "";
                    var returnFacilityText = !string.IsNullOrWhiteSpace(storeSettings.StoreAddress)
                        ? $"\n\nReturn Facility / Dispatch Address:\n{storeSettings.StoreName}\n{storeSettings.StoreAddress}"
                        : "";

                    await emailService.SendAsync(new EmailMessage(
                        customer.Email,
                        customer.FullName ?? "Customer",
                        $"Return Request Approved - #{returnRequest.ReturnNumber}",
                        $"<p>Dear {customer.FullName ?? "Customer"},</p><p>Your return request <strong>#{returnRequest.ReturnNumber}</strong> for Order #{returnRequest.Order.OrderNumber} has been <strong>Approved</strong>.</p><p>Please pack the item(s) securely in their original packaging. We will coordinate reverse pickup shortly.</p>{returnFacility}",
                        $"Dear {customer.FullName ?? "Customer"},\n\nYour return request #{returnRequest.ReturnNumber} for Order #{returnRequest.Order.OrderNumber} has been Approved.\nPlease pack the item(s) securely in their original packaging. We will coordinate reverse pickup shortly.{returnFacilityText}"), ct);
                }
                catch (Exception emailEx)
                {
                    logger.LogWarning(emailEx, "Failed to send return approval email for Return {ReturnNumber}", returnRequest.ReturnNumber);
                }
            }

            var policy = await db.ReturnReasonPolicies.AsNoTracking().SingleOrDefaultAsync(p => p.Reason == returnRequest.Reason, ct);
            return ApiResponse<AdminReturnDetailsResponse>.Ok(
                MapAdminReturnDetails(returnRequest, returnRequest.Order.OrderNumber, customer, storeSettings, policy),
                "Return request approved successfully.");
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to approve return ReturnId={ReturnId}", returnId);
            return ApiResponse<AdminReturnDetailsResponse>.Fail("Unable to approve return request.", 500);
        }
    }

    public async Task<ApiResponse<AdminReturnDetailsResponse>> RejectReturnAsync(
        Guid returnId,
        AdminRejectReturnRequest request,
        CancellationToken ct = default)
    {
        var adminInfo = Common.Common.GetAdminClaimInfo(httpContextAccessor);
        if (!adminInfo.Success || adminInfo.Data is null || !Guid.TryParse(adminInfo.Data.Id, out var adminId))
            return ApiResponse<AdminReturnDetailsResponse>.Fail("Admin authentication required.", 401);

        if (string.IsNullOrWhiteSpace(request?.RejectionReason))
            return ApiResponse<AdminReturnDetailsResponse>.Fail("Rejection reason is required.", 400);

        try
        {
            var returnRequest = await db.ReturnRequests
                .Include(r => r.Order)
                .Include(r => r.Items)
                .Include(r => r.Media)
                .Include(r => r.StatusHistory)
                .Include(r => r.Refund)
                .SingleOrDefaultAsync(r => r.Id == returnId, ct);

            if (returnRequest is null)
                return ApiResponse<AdminReturnDetailsResponse>.Fail("Return request was not found.", 404);

            if (returnRequest.Status != ReturnStatus.Requested)
                return ApiResponse<AdminReturnDetailsResponse>.Fail($"Return cannot be rejected from status '{returnRequest.Status}'.", 400);

            var now = DateTime.UtcNow;
            returnRequest.Status = ReturnStatus.Rejected;
            returnRequest.RejectionReason = request.RejectionReason.Trim();
            returnRequest.UpdatedOn = now;
            returnRequest.CompletedOn = now;
            returnRequest.ConcurrencyStamp = Guid.NewGuid().ToString("N");

            returnRequest.StatusHistory.Add(new ReturnStatusHistory
            {
                ReturnRequestId = returnRequest.Id,
                Status = ReturnStatus.Rejected,
                Note = $"Return rejected by {adminInfo.Data.UserName}: {request.RejectionReason.Trim()}",
                ActorAdminId = adminId,
                ActorAdminName = adminInfo.Data.UserName,
                CreatedOn = now
            });

            db.AdminActions.Add(new AdminAction
            {
                Id = Guid.NewGuid(),
                AdminId = adminId,
                AdminName = adminInfo.Data.UserName ?? "Admin",
                Module = AdminActionModules.StoreSettings,
                Action = AdminActionTypes.Update,
                EntityName = $"Return {returnRequest.ReturnNumber}",
                Description = $"Rejected return request: {request.RejectionReason.Trim()}",
                CreatedOn = now
            });

            await db.SaveChangesAsync(ct);
            logger.LogInformation("Return request {ReturnNumber} rejected by admin {AdminId}", returnRequest.ReturnNumber, adminId);

            var customer = await db.Customers.AsNoTracking().SingleOrDefaultAsync(c => c.Id == returnRequest.CustomerId, ct);

            if (customer is not null && !string.IsNullOrWhiteSpace(customer.Email))
            {
                try
                {
                    await emailService.SendAsync(new EmailMessage(
                        customer.Email,
                        customer.FullName ?? "Customer",
                        $"Return Request Update - #{returnRequest.ReturnNumber}",
                        $"<p>Dear {customer.FullName ?? "Customer"},</p><p>Your return request <strong>#{returnRequest.ReturnNumber}</strong> for Order #{returnRequest.Order.OrderNumber} could not be approved for the following reason:</p><blockquote>{request.RejectionReason.Trim()}</blockquote>",
                        $"Dear {customer.FullName ?? "Customer"},\n\nYour return request #{returnRequest.ReturnNumber} for Order #{returnRequest.Order.OrderNumber} could not be approved for the following reason:\n{request.RejectionReason.Trim()}"), ct);
                }
                catch (Exception emailEx)
                {
                    logger.LogWarning(emailEx, "Failed to send return rejection email for Return {ReturnNumber}", returnRequest.ReturnNumber);
                }
            }

            return ApiResponse<AdminReturnDetailsResponse>.Ok(
                MapAdminReturnDetails(returnRequest, returnRequest.Order.OrderNumber, customer),
                "Return request has been rejected.");
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to reject return ReturnId={ReturnId}", returnId);
            return ApiResponse<AdminReturnDetailsResponse>.Fail("Unable to reject return request.", 500);
        }
    }

    public async Task<ApiResponse<AdminReturnDetailsResponse>> SchedulePickupAsync(
        Guid returnId,
        ScheduleReversePickupRequest request,
        CancellationToken ct = default)
    {
        var adminInfo = Common.Common.GetAdminClaimInfo(httpContextAccessor);
        if (!adminInfo.Success || adminInfo.Data is null || !Guid.TryParse(adminInfo.Data.Id, out var adminId))
            return ApiResponse<AdminReturnDetailsResponse>.Fail("Admin authentication required.", 401);

        if (string.IsNullOrWhiteSpace(request?.CourierName))
            return ApiResponse<AdminReturnDetailsResponse>.Fail("Courier/carrier name is required.", 400);

        if (string.IsNullOrWhiteSpace(request?.TrackingNumber))
            return ApiResponse<AdminReturnDetailsResponse>.Fail("Reverse AWB / Tracking number is required.", 400);

        try
        {
            var returnRequest = await db.ReturnRequests
                .Include(r => r.Order)
                .Include(r => r.Items)
                .Include(r => r.Media)
                .Include(r => r.StatusHistory)
                .Include(r => r.Refund)
                .SingleOrDefaultAsync(r => r.Id == returnId, ct);

            if (returnRequest is null)
                return ApiResponse<AdminReturnDetailsResponse>.Fail("Return request was not found.", 404);

            if (returnRequest.Status != ReturnStatus.Approved && returnRequest.Status != ReturnStatus.PickupScheduled)
                return ApiResponse<AdminReturnDetailsResponse>.Fail($"Reverse pickup can only be scheduled for Approved returns (current status: '{returnRequest.Status}').", 400);

            var now = DateTime.UtcNow;
            returnRequest.CourierName = request.CourierName.Trim();
            returnRequest.TrackingNumber = request.TrackingNumber.Trim();
            returnRequest.TrackingUrl = string.IsNullOrWhiteSpace(request.TrackingUrl) ? null : request.TrackingUrl.Trim();
            returnRequest.PickupScheduledDate = request.PickupScheduledDate;
            returnRequest.Status = ReturnStatus.PickupScheduled;
            returnRequest.UpdatedOn = now;
            returnRequest.ConcurrencyStamp = Guid.NewGuid().ToString("N");

            var note = $"Reverse pickup scheduled with {returnRequest.CourierName}. AWB: {returnRequest.TrackingNumber}.";
            if (request.PickupScheduledDate.HasValue)
                note += $" Scheduled Date: {request.PickupScheduledDate.Value:yyyy-MM-dd}.";
            if (!string.IsNullOrWhiteSpace(request.Notes))
                note += $" Note: {request.Notes.Trim()}";

            returnRequest.StatusHistory.Add(new ReturnStatusHistory
            {
                ReturnRequestId = returnRequest.Id,
                Status = ReturnStatus.PickupScheduled,
                Note = note,
                ActorAdminId = adminId,
                ActorAdminName = adminInfo.Data.UserName,
                CreatedOn = now
            });

            await db.SaveChangesAsync(ct);
            logger.LogInformation("Reverse pickup scheduled for Return {ReturnNumber}. Courier: {Courier}, AWB: {AWB}", returnRequest.ReturnNumber, returnRequest.CourierName, returnRequest.TrackingNumber);

            var customer = await db.Customers.AsNoTracking().SingleOrDefaultAsync(c => c.Id == returnRequest.CustomerId, ct);

            if (customer is not null && !string.IsNullOrWhiteSpace(customer.Email))
            {
                try
                {
                    await emailService.SendAsync(new EmailMessage(
                        customer.Email,
                        customer.FullName ?? "Customer",
                        $"Reverse Pickup Scheduled - #{returnRequest.ReturnNumber}",
                        $"<p>Dear {customer.FullName ?? "Customer"},</p><p>A reverse pickup has been scheduled for your return request <strong>#{returnRequest.ReturnNumber}</strong> (Order #{returnRequest.Order.OrderNumber}).</p><p><strong>Courier:</strong> {returnRequest.CourierName}<br/><strong>Tracking Number (AWB):</strong> {returnRequest.TrackingNumber}" + (returnRequest.PickupScheduledDate.HasValue ? $"<br/><strong>Pickup Date:</strong> {returnRequest.PickupScheduledDate.Value:dd MMM yyyy}" : "") + "</p><p>Please keep the package securely packed and hand it over to the courier executive.</p>",
                        $"Dear {customer.FullName ?? "Customer"},\n\nA reverse pickup has been scheduled for your return #{returnRequest.ReturnNumber}.\nCourier: {returnRequest.CourierName}\nAWB: {returnRequest.TrackingNumber}\nPlease hand over the package to the pickup executive."), ct);
                }
                catch (Exception emailEx)
                {
                    logger.LogWarning(emailEx, "Failed to send pickup scheduled email for Return {ReturnNumber}", returnRequest.ReturnNumber);
                }
            }

            return ApiResponse<AdminReturnDetailsResponse>.Ok(
                MapAdminReturnDetails(returnRequest, returnRequest.Order.OrderNumber, customer),
                "Reverse pickup scheduled successfully.");
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to schedule reverse pickup for ReturnId={ReturnId}", returnId);
            return ApiResponse<AdminReturnDetailsResponse>.Fail("Unable to schedule reverse pickup.", 500);
        }
    }

    public async Task<ApiResponse<IReadOnlyList<ReverseCourierOptionDto>>> GetReverseCouriersAsync(
        Guid returnId,
        CancellationToken ct = default)
    {
        try
        {
            var returnRequest = await db.ReturnRequests.AsNoTracking()
                .Include(r => r.Order).ThenInclude(o => o.Addresses)
                .Include(r => r.Order).ThenInclude(o => o.Items)
                .Include(r => r.Items)
                .SingleOrDefaultAsync(r => r.Id == returnId, ct);

            if (returnRequest is null)
                return ApiResponse<IReadOnlyList<ReverseCourierOptionDto>>.Fail("Return request was not found.", 404);

            var shippingAddress = returnRequest.Order.Addresses.FirstOrDefault(a => a.Type == "Shipping")
                ?? returnRequest.Order.Addresses.FirstOrDefault();

            if (shippingAddress is null || string.IsNullOrWhiteSpace(shippingAddress.PostalCode))
                return ApiResponse<IReadOnlyList<ReverseCourierOptionDto>>.Fail("Customer postal code is missing from original order shipping address.", 400);

            var totalWeight = returnRequest.Items.Sum(ri =>
            {
                var matchedOrder = returnRequest.Order.Items.FirstOrDefault(oi => oi.Id == ri.OrderItemId);
                var unitW = matchedOrder is not null ? (matchedOrder.Weight > 0 ? (matchedOrder.Weight >= 5m ? matchedOrder.Weight / 1000m : matchedOrder.Weight) : 0.25m) : 0.25m;
                return unitW * Math.Max(1, ri.Quantity);
            });
            totalWeight = Math.Max(0.2m, totalWeight);

            var couriers = await shiprocketService.GetReverseCouriersAsync(shippingAddress.PostalCode, totalWeight, ct);
            return ApiResponse<IReadOnlyList<ReverseCourierOptionDto>>.Ok(couriers,
                couriers.Count > 0 ? $"Found {couriers.Count} available reverse delivery partners." : "No reverse delivery partners found for this route.");
        }
        catch (ShiprocketProviderException spEx)
        {
            logger.LogWarning(spEx, "Shiprocket serviceability error for ReturnId={ReturnId}", returnId);
            return ApiResponse<IReadOnlyList<ReverseCourierOptionDto>>.Fail(spEx.Message, spEx.StatusCode);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to retrieve reverse couriers for ReturnId={ReturnId}", returnId);
            return ApiResponse<IReadOnlyList<ReverseCourierOptionDto>>.Fail("Unable to fetch available delivery partners from Shiprocket.", 500);
        }
    }

    public async Task<ApiResponse<AdminReturnDetailsResponse>> BookShiprocketReversePickupAsync(
        Guid returnId,
        BookReversePickupRequest request,
        CancellationToken ct = default)
    {
        var adminInfo = Common.Common.GetAdminClaimInfo(httpContextAccessor);
        if (!adminInfo.Success || adminInfo.Data is null || !Guid.TryParse(adminInfo.Data.Id, out var adminId))
            return ApiResponse<AdminReturnDetailsResponse>.Fail("Admin authentication required.", 401);

        try
        {
            var returnRequest = await db.ReturnRequests
                .Include(r => r.Order).ThenInclude(o => o.Addresses)
                .Include(r => r.Order).ThenInclude(o => o.Items)
                .Include(r => r.Items)
                .Include(r => r.Media)
                .Include(r => r.StatusHistory)
                .Include(r => r.Refund)
                .SingleOrDefaultAsync(r => r.Id == returnId, ct);

            if (returnRequest is null)
                return ApiResponse<AdminReturnDetailsResponse>.Fail("Return request was not found.", 404);

            if (returnRequest.Status != ReturnStatus.Approved && returnRequest.Status != ReturnStatus.PickupScheduled)
                return ApiResponse<AdminReturnDetailsResponse>.Fail($"Reverse pickup can only be booked for Approved returns (current status: '{returnRequest.Status}').", 400);

            var bookingResult = await shiprocketService.BookReversePickupAsync(returnRequest, request.CourierCompanyId, ct);
            if (!bookingResult.Success)
            {
                return ApiResponse<AdminReturnDetailsResponse>.Fail($"Shiprocket booking failed: {bookingResult.Message ?? "Unknown provider error."}", 400);
            }

            var now = DateTime.UtcNow;
            var courier = !string.IsNullOrWhiteSpace(bookingResult.CourierName)
                ? bookingResult.CourierName
                : (!string.IsNullOrWhiteSpace(request.CourierName) ? request.CourierName.Trim() : "Shiprocket Reverse Logistics");

            var awb = !string.IsNullOrWhiteSpace(bookingResult.AwbCode)
                ? bookingResult.AwbCode
                : (bookingResult.ProviderShipmentId > 0 ? $"SR-RET-{bookingResult.ProviderShipmentId}" : $"SR-RET-{now:yyyyMMddHHmmss}");

            var trackingUrl = !string.IsNullOrWhiteSpace(bookingResult.AwbCode)
                ? $"https://shiprocket.co/tracking/{bookingResult.AwbCode}"
                : null;

            returnRequest.CourierName = courier;
            returnRequest.TrackingNumber = awb;
            returnRequest.TrackingUrl = trackingUrl;
            returnRequest.PickupScheduledDate = request.PickupScheduledDate ?? now.AddDays(1);
            returnRequest.Status = ReturnStatus.PickupScheduled;
            returnRequest.UpdatedOn = now;
            returnRequest.ConcurrencyStamp = Guid.NewGuid().ToString("N");

            var note = $"Reverse pickup booked via Shiprocket with {returnRequest.CourierName}. AWB: {returnRequest.TrackingNumber}.";
            if (returnRequest.PickupScheduledDate.HasValue)
                note += $" Scheduled Date: {returnRequest.PickupScheduledDate.Value:yyyy-MM-dd}.";
            if (!string.IsNullOrWhiteSpace(request.Notes))
                note += $" Note: {request.Notes.Trim()}";

            returnRequest.StatusHistory.Add(new ReturnStatusHistory
            {
                ReturnRequestId = returnRequest.Id,
                Status = ReturnStatus.PickupScheduled,
                Note = note,
                ActorAdminId = adminId,
                ActorAdminName = adminInfo.Data.UserName,
                CreatedOn = now
            });

            db.AdminActions.Add(new AdminAction
            {
                Id = Guid.NewGuid(),
                AdminId = adminId,
                AdminName = adminInfo.Data.UserName ?? "Admin",
                Module = AdminActionModules.StoreSettings,
                Action = AdminActionTypes.Update,
                EntityName = $"Return {returnRequest.ReturnNumber}",
                Description = $"Booked Shiprocket reverse pickup: {courier}, AWB: {awb}",
                CreatedOn = now
            });

            await db.SaveChangesAsync(ct);
            logger.LogInformation("Shiprocket reverse pickup booked for Return {ReturnNumber}. Courier: {Courier}, AWB: {AWB}", returnRequest.ReturnNumber, returnRequest.CourierName, returnRequest.TrackingNumber);

            var customer = await db.Customers.AsNoTracking().SingleOrDefaultAsync(c => c.Id == returnRequest.CustomerId, ct);

            if (customer is not null && !string.IsNullOrWhiteSpace(customer.Email))
            {
                try
                {
                    await emailService.SendAsync(new EmailMessage(
                        customer.Email,
                        customer.FullName ?? "Customer",
                        $"Reverse Pickup Scheduled - #{returnRequest.ReturnNumber}",
                        $"<p>Dear {customer.FullName ?? "Customer"},</p><p>A reverse pickup has been scheduled for your return request <strong>#{returnRequest.ReturnNumber}</strong> (Order #{returnRequest.Order.OrderNumber}) via <strong>{returnRequest.CourierName}</strong>.</p><p><strong>Tracking Number (AWB):</strong> {returnRequest.TrackingNumber}" + (returnRequest.PickupScheduledDate.HasValue ? $"<br/><strong>Pickup Date:</strong> {returnRequest.PickupScheduledDate.Value:dd MMM yyyy}" : "") + "</p><p>Please keep the package safely packed and hand it over to the pickup executive.</p>",
                        $"Dear {customer.FullName ?? "Customer"},\n\nA reverse pickup has been scheduled for your return #{returnRequest.ReturnNumber}.\nCourier: {returnRequest.CourierName}\nAWB: {returnRequest.TrackingNumber}\nPlease hand over the package to the pickup executive."), ct);
                }
                catch (Exception emailEx)
                {
                    logger.LogWarning(emailEx, "Failed to send pickup scheduled email for Return {ReturnNumber}", returnRequest.ReturnNumber);
                }
            }

            return ApiResponse<AdminReturnDetailsResponse>.Ok(
                MapAdminReturnDetails(returnRequest, returnRequest.Order.OrderNumber, customer),
                "Reverse pickup successfully booked with Shiprocket.");
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to book reverse pickup for ReturnId={ReturnId}", returnId);
            return ApiResponse<AdminReturnDetailsResponse>.Fail("Unable to book reverse pickup with Shiprocket.", 500);
        }
    }

    public async Task<ApiResponse<AdminReturnDetailsResponse>> UpdateReverseTrackingStatusAsync(

        Guid returnId,
        UpdateReverseTrackingRequest request,
        CancellationToken ct = default)
    {
        var adminInfo = Common.Common.GetAdminClaimInfo(httpContextAccessor);
        if (!adminInfo.Success || adminInfo.Data is null || !Guid.TryParse(adminInfo.Data.Id, out var adminId))
            return ApiResponse<AdminReturnDetailsResponse>.Fail("Admin authentication required.", 401);

        var validTargetStatuses = new[]
        {
            ReturnStatus.InTransit,
            ReturnStatus.DeliveredToWarehouse
        };

        if (!validTargetStatuses.Contains(request.Status))
            return ApiResponse<AdminReturnDetailsResponse>.Fail($"Invalid reverse tracking status '{request.Status}'. Valid transitions are 'InTransit' or 'DeliveredToWarehouse'.", 400);

        try
        {
            var returnRequest = await db.ReturnRequests
                .Include(r => r.Order)
                .Include(r => r.Items)
                .Include(r => r.Media)
                .Include(r => r.StatusHistory)
                .Include(r => r.Refund)
                .SingleOrDefaultAsync(r => r.Id == returnId, ct);

            if (returnRequest is null)
                return ApiResponse<AdminReturnDetailsResponse>.Fail("Return request was not found.", 404);

            var now = DateTime.UtcNow;

            if (request.Status == ReturnStatus.InTransit)
            {
                if (returnRequest.Status != ReturnStatus.PickupScheduled && returnRequest.Status != ReturnStatus.Approved)
                    return ApiResponse<AdminReturnDetailsResponse>.Fail($"Cannot mark InTransit from status '{returnRequest.Status}'.", 400);

                returnRequest.Status = ReturnStatus.InTransit;
                returnRequest.PickedUpOn = now;
            }
            else if (request.Status == ReturnStatus.DeliveredToWarehouse)
            {
                if (returnRequest.Status != ReturnStatus.InTransit && returnRequest.Status != ReturnStatus.PickupScheduled && returnRequest.Status != ReturnStatus.Approved)
                    return ApiResponse<AdminReturnDetailsResponse>.Fail($"Cannot mark DeliveredToWarehouse from status '{returnRequest.Status}'.", 400);

                returnRequest.Status = ReturnStatus.DeliveredToWarehouse;
                returnRequest.DeliveredToWarehouseOn = now;
                returnRequest.ReceivedOn = now;
            }

            returnRequest.UpdatedOn = now;
            returnRequest.ConcurrencyStamp = Guid.NewGuid().ToString("N");

            var note = $"Reverse tracking updated to {returnRequest.Status} by {adminInfo.Data.UserName}.";
            if (!string.IsNullOrWhiteSpace(request.Notes))
                note += $" Note: {request.Notes.Trim()}";

            returnRequest.StatusHistory.Add(new ReturnStatusHistory
            {
                ReturnRequestId = returnRequest.Id,
                Status = returnRequest.Status,
                Note = note,
                ActorAdminId = adminId,
                ActorAdminName = adminInfo.Data.UserName,
                CreatedOn = now
            });

            await db.SaveChangesAsync(ct);
            logger.LogInformation("Return {ReturnNumber} status updated to {Status}", returnRequest.ReturnNumber, returnRequest.Status);

            var customer = await db.Customers.AsNoTracking().SingleOrDefaultAsync(c => c.Id == returnRequest.CustomerId, ct);

            if (returnRequest.Status == ReturnStatus.DeliveredToWarehouse && customer is not null && !string.IsNullOrWhiteSpace(customer.Email))
            {
                try
                {
                    await emailService.SendAsync(new EmailMessage(
                        customer.Email,
                        customer.FullName ?? "Customer",
                        $"Return Package Received at Warehouse - #{returnRequest.ReturnNumber}",
                        $"<p>Dear {customer.FullName ?? "Customer"},</p><p>We have received your returned item(s) for <strong>#{returnRequest.ReturnNumber}</strong> (Order #{returnRequest.Order.OrderNumber}) at our fulfillment warehouse.</p><p>Our quality assurance team is performing inspection. Once verified, your refund will be processed immediately.</p>",
                        $"Dear {customer.FullName ?? "Customer"},\n\nWe have received your return package #{returnRequest.ReturnNumber} at our warehouse.\nOur quality team is conducting inspection."), ct);
                }
                catch (Exception emailEx)
                {
                    logger.LogWarning(emailEx, "Failed to send package received email for Return {ReturnNumber}", returnRequest.ReturnNumber);
                }
            }

            return ApiResponse<AdminReturnDetailsResponse>.Ok(
                MapAdminReturnDetails(returnRequest, returnRequest.Order.OrderNumber, customer),
                $"Return status updated to {returnRequest.Status}.");
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to update reverse tracking for ReturnId={ReturnId}", returnId);
            return ApiResponse<AdminReturnDetailsResponse>.Fail("Unable to update reverse tracking status.", 500);
        }
    }

    public async Task<ApiResponse<AdminReturnDetailsResponse>> InspectReturnAsync(
        Guid returnId,
        AdminInspectReturnRequest request,
        CancellationToken ct = default)
    {
        var adminInfo = Common.Common.GetAdminClaimInfo(httpContextAccessor);
        if (!adminInfo.Success || adminInfo.Data is null || !Guid.TryParse(adminInfo.Data.Id, out var adminId))
            return ApiResponse<AdminReturnDetailsResponse>.Fail("Admin authentication required.", 401);

        if (request?.Items is null || request.Items.Count == 0)
            return ApiResponse<AdminReturnDetailsResponse>.Fail("Inspection items are required.", 400);

        try
        {
            var returnRequest = await db.ReturnRequests
                .Include(r => r.Order)
                .Include(r => r.Items)
                .Include(r => r.Media)
                .Include(r => r.StatusHistory)
                .Include(r => r.Refund)
                .SingleOrDefaultAsync(r => r.Id == returnId, ct);

            if (returnRequest is null)
                return ApiResponse<AdminReturnDetailsResponse>.Fail("Return request was not found.", 404);

            var allowedStatuses = new[]
            {
                ReturnStatus.Approved,
                ReturnStatus.PickupScheduled,
                ReturnStatus.PickedUp,
                ReturnStatus.InTransit,
                ReturnStatus.DeliveredToWarehouse
            };

            if (!allowedStatuses.Contains(returnRequest.Status))
                return ApiResponse<AdminReturnDetailsResponse>.Fail($"Inspection cannot be performed for return in status '{returnRequest.Status}'.", 400);

            var inspectionMap = request.Items.ToDictionary(i => i.ReturnItemId);
            bool allPassed = true;
            bool anyPassed = false;
            decimal passedRefundTotal = 0m;

            foreach (var item in returnRequest.Items)
            {
                if (inspectionMap.TryGetValue(item.Id, out var res))
                {
                    item.InspectionStatus = res.Outcome;
                    item.RestockInventory = res.RestockInventory;

                    if (res.Outcome == InspectionOutcome.Passed)
                    {
                        anyPassed = true;
                        passedRefundTotal += item.RefundAmount;
                    }
                    else
                    {
                        allPassed = false;
                    }
                }
            }

            var now = DateTime.UtcNow;
            returnRequest.InspectedOn = now;
            returnRequest.UpdatedOn = now;
            returnRequest.ConcurrencyStamp = Guid.NewGuid().ToString("N");

            var policy = await db.ReturnReasonPolicies.AsNoTracking().SingleOrDefaultAsync(p => p.Reason == returnRequest.Reason, ct);
            bool allowProduct = policy?.RefundProductAmount ?? true;
            bool allowShipping = policy?.RefundShippingAmount ?? false;
            bool allowPaymentFee = policy?.RefundPaymentFee ?? false;

            decimal passedProductRefund = allowProduct ? passedRefundTotal : 0m;
            decimal shippingRefund = (allowShipping && anyPassed) ? returnRequest.ShippingRefundAmount : 0m;
            decimal paymentFeeRefund = (allowPaymentFee && anyPassed) ? returnRequest.PaymentFeeRefundAmount : 0m;

            if (allPassed || anyPassed)
            {
                returnRequest.Status = ReturnStatus.InspectionPassed;
                returnRequest.ProductRefundAmount = passedProductRefund;
                returnRequest.ShippingRefundAmount = shippingRefund;
                returnRequest.PaymentFeeRefundAmount = paymentFeeRefund;
                returnRequest.TotalRefundAmount = passedProductRefund + shippingRefund + paymentFeeRefund;
                returnRequest.NetRefundAmount = Math.Max(0m, returnRequest.TotalRefundAmount - returnRequest.ReverseShippingDeduction);
            }
            else
            {
                returnRequest.Status = ReturnStatus.InspectionFailed;
                returnRequest.ProductRefundAmount = 0m;
                returnRequest.ShippingRefundAmount = 0m;
                returnRequest.PaymentFeeRefundAmount = 0m;
                returnRequest.TotalRefundAmount = 0m;
                returnRequest.NetRefundAmount = 0m;
                returnRequest.CompletedOn = now;
            }

            returnRequest.StatusHistory.Add(new ReturnStatusHistory
            {
                ReturnRequestId = returnRequest.Id,
                Status = returnRequest.Status,
                Note = $"Quality control inspection completed by {adminInfo.Data.UserName}. Status: {returnRequest.Status}. Note: {request.InspectionNotes}",
                ActorAdminId = adminId,
                ActorAdminName = adminInfo.Data.UserName,
                CreatedOn = now
            });

            await db.SaveChangesAsync(ct);
            logger.LogInformation("Return {ReturnNumber} inspection completed. Result: {Status}", returnRequest.ReturnNumber, returnRequest.Status);

            var customer = await db.Customers.AsNoTracking().SingleOrDefaultAsync(c => c.Id == returnRequest.CustomerId, ct);
            return ApiResponse<AdminReturnDetailsResponse>.Ok(
                MapAdminReturnDetails(returnRequest, returnRequest.Order.OrderNumber, customer, null, policy),
                $"Inspection recorded successfully. Return status updated to {returnRequest.Status}.");
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to record inspection for ReturnId={ReturnId}", returnId);
            return ApiResponse<AdminReturnDetailsResponse>.Fail("Unable to record inspection result.", 500);
        }
    }

    public async Task<ApiResponse<AdminReturnDetailsResponse>> FulfillReplacementOrderAsync(
        Guid returnId,
        AdminFulfillReplacementRequest request,
        CancellationToken ct = default)
    {
        var adminInfo = Common.Common.GetAdminClaimInfo(httpContextAccessor);
        if (!adminInfo.Success || adminInfo.Data is null || !Guid.TryParse(adminInfo.Data.Id, out var adminId))
            return ApiResponse<AdminReturnDetailsResponse>.Fail("Admin authentication required.", 401);

        try
        {
            var returnRequest = await db.ReturnRequests
                .Include(r => r.Order)
                    .ThenInclude(o => o.Addresses)
                .Include(r => r.Order)
                    .ThenInclude(o => o.Items)
                .Include(r => r.Items)
                .Include(r => r.StatusHistory)
                .Include(r => r.Refund)
                .Include(r => r.Media)
                .FirstOrDefaultAsync(r => r.Id == returnId, ct);

            if (returnRequest is null)
                return ApiResponse<AdminReturnDetailsResponse>.Fail("Return request was not found.", 404);

            if (returnRequest.Resolution != ReturnResolution.Replacement)
                return ApiResponse<AdminReturnDetailsResponse>.Fail("Only return requests with 'Replacement' resolution can be fulfilled with a replacement order.", 400);

            if (returnRequest.ReplacementOrderId.HasValue)
                return ApiResponse<AdminReturnDetailsResponse>.Fail($"A replacement order ({returnRequest.ReplacementOrderNumber}) has already been generated for this return.", 400);

            var eligibleStatuses = new[]
            {
                ReturnStatus.Approved,
                ReturnStatus.DeliveredToWarehouse,
                ReturnStatus.InspectionPassed
            };

            if (!eligibleStatuses.Contains(returnRequest.Status))
                return ApiResponse<AdminReturnDetailsResponse>.Fail($"Cannot fulfill replacement for a return in status '{returnRequest.Status}'. Return must be Approved or InspectionPassed.", 400);

            var itemsToReplace = returnRequest.Items
                .Where(i => i.InspectionStatus != InspectionOutcome.Failed)
                .ToList();

            if (itemsToReplace.Count == 0)
                return ApiResponse<AdminReturnDetailsResponse>.Fail("No return items passed inspection to fulfill replacement.", 400);

            var originalOrder = returnRequest.Order;
            var now = DateTime.UtcNow;
            var adminName = adminInfo.Data.UserName?.Trim() ?? "Admin";

            var shortStamp = now.ToString("yyyyMMddHHmmss");
            var randSuffix = Random.Shared.Next(100, 999);
            var repOrderNumber = $"ORD-REP-{shortStamp}-{randSuffix}";
            var repOrderId = Guid.NewGuid();

            var replacementOrder = new Order
            {
                Id = repOrderId,
                CustomerId = returnRequest.CustomerId,
                CheckoutSessionId = Guid.NewGuid(),
                OrderNumber = repOrderNumber,
                IdempotencyKey = $"REP-{returnRequest.Id:N}",
                Status = OrderStatus.Confirmed,
                CustomerNote = string.IsNullOrWhiteSpace(request?.Notes)
                    ? $"Replacement order for RMA #{returnRequest.ReturnNumber}"
                    : $"Replacement order for RMA #{returnRequest.ReturnNumber}. Notes: {request.Notes.Trim()}",
                Subtotal = 0m,
                ItemDiscountAmount = 0m,
                CouponDiscountAmount = 0m,
                TaxAmount = 0m,
                ProductTaxAmount = 0m,
                PaymentServiceTaxAmount = 0m,
                ProductTaxRatePercent = 0m,
                PaymentServiceTaxRatePercent = 0m,
                ShippingAmount = 0m,
                ProviderShippingCost = 0m,
                GrandTotal = 0m,
                Currency = originalOrder.Currency,
                CreatedOn = now,
                UpdatedOn = now,
                PaymentExpiresOn = now.AddDays(30),
                Items = new List<OrderItem>(),
                Addresses = new List<OrderAddress>()
            };

            foreach (var retItem in itemsToReplace)
            {
                var origItem = originalOrder.Items.FirstOrDefault(oi => oi.Id == retItem.OrderItemId);
                var orderItem = new OrderItem
                {
                    Id = Guid.NewGuid(),
                    OrderId = repOrderId,
                    ProductId = origItem?.ProductId ?? Guid.Empty,
                    ProductVariantId = retItem.ProductVariantId,
                    ProductName = retItem.ProductName,
                    ProductSlug = origItem?.ProductSlug ?? string.Empty,
                    VariantName = retItem.VariantName,
                    Sku = origItem?.Sku ?? string.Empty,
                    HsnCode = origItem?.HsnCode,
                    Weight = origItem?.Weight ?? 0m,
                    WeightUnit = origItem?.WeightUnit ?? "g",
                    Quantity = retItem.Quantity,
                    UnitPrice = 0m,
                    UnitMrp = origItem?.UnitMrp ?? retItem.UnitPrice,
                    TaxPercentage = 0m,
                    TaxableAmount = 0m,
                    DiscountAmount = 0m,
                    TaxAmount = 0m,
                    LineTotal = 0m
                };
                replacementOrder.Items.Add(orderItem);
            }

            var origShippingAddress = originalOrder.Addresses.FirstOrDefault(a => a.Type.Equals("Shipping", StringComparison.OrdinalIgnoreCase))
                ?? originalOrder.Addresses.FirstOrDefault();

            if (origShippingAddress is not null)
            {
                replacementOrder.Addresses.Add(new OrderAddress
                {
                    Id = Guid.NewGuid(),
                    OrderId = repOrderId,
                    Type = "Shipping",
                    RecipientName = origShippingAddress.RecipientName,
                    MobileNumber = origShippingAddress.MobileNumber,
                    Email = origShippingAddress.Email,
                    AddressLine1 = origShippingAddress.AddressLine1,
                    AddressLine2 = origShippingAddress.AddressLine2,
                    Landmark = origShippingAddress.Landmark,
                    City = origShippingAddress.City,
                    State = origShippingAddress.State,
                    PostalCode = origShippingAddress.PostalCode,
                    Country = origShippingAddress.Country
                });
            }

            db.Orders.Add(replacementOrder);
            db.OrderStatusHistories.Add(new OrderStatusHistory
            {
                Id = Guid.NewGuid(),
                OrderId = repOrderId,
                Status = OrderStatus.Confirmed,
                Note = $"Replacement order created from Return RMA #{returnRequest.ReturnNumber}.",
                CreatedOn = now
            });

            returnRequest.ReplacementOrderId = repOrderId;
            returnRequest.ReplacementOrderNumber = repOrderNumber;
            returnRequest.Status = ReturnStatus.RefundCompleted;
            returnRequest.CompletedOn = now;
            returnRequest.UpdatedOn = now;
            returnRequest.ConcurrencyStamp = Guid.NewGuid().ToString("N");

            returnRequest.StatusHistory.Add(new ReturnStatusHistory
            {
                ReturnRequestId = returnRequest.Id,
                Status = ReturnStatus.RefundCompleted,
                Note = $"Replacement order #{repOrderNumber} created and confirmed by {adminName}." +
                    (string.IsNullOrWhiteSpace(request?.Notes) ? "" : $" Notes: {request.Notes.Trim()}"),
                ActorAdminId = adminId,
                ActorAdminName = adminName,
                CreatedOn = now
            });

            db.AdminActions.Add(new AdminAction
            {
                Id = Guid.NewGuid(),
                AdminId = adminId,
                AdminName = adminName,
                Module = AdminActionModules.StoreSettings,
                Action = AdminActionTypes.Update,
                EntityName = $"Return {returnRequest.ReturnNumber}",
                Description = $"Created replacement order #{repOrderNumber} for return #{returnRequest.ReturnNumber}.",
                CreatedOn = now
            });

            foreach (var retItem in itemsToReplace)
            {
                var variant = await db.ProductVariants.SingleOrDefaultAsync(v => v.Id == retItem.ProductVariantId, ct);
                if (variant is not null && variant.StockQuantity >= retItem.Quantity)
                {
                    variant.StockQuantity -= retItem.Quantity;
                }
            }

            await db.SaveChangesAsync(ct);
            try
            {
                cache.RemoveByPrefix(CacheKey.Products.AllPrefix, "Replacement order fulfilled - product stock deducted");
                cache.RemoveByPrefix(CacheKey.Categories.AllPrefix, "Replacement order fulfilled - category cache invalidated");
                cache.RemoveByPrefix(CacheKey.Sales.AllPrefix, "Replacement order fulfilled - sales cache invalidated");
            }
            catch { /* non-fatal */ }
            logger.LogInformation("Replacement order {OrderNumber} created for return {ReturnNumber}", repOrderNumber, returnRequest.ReturnNumber);

            var customer = await db.Customers.AsNoTracking().SingleOrDefaultAsync(c => c.Id == returnRequest.CustomerId, ct);

            if (customer is not null && !string.IsNullOrWhiteSpace(customer.Email))
            {
                try
                {
                    var itemsList = string.Join("", itemsToReplace.Select(i => $"<li>{i.ProductName} ({i.VariantName}) x {i.Quantity}</li>"));
                    var htmlBody = $@"<p>Dear {customer.FullName ?? "Customer"},</p>
<p>Your replacement order for return request <strong>#{returnRequest.ReturnNumber}</strong> (Original Order #{originalOrder.OrderNumber}) has been confirmed!</p>
<p><strong>Replacement Order Number:</strong> {repOrderNumber}</p>
<p><strong>Items:</strong></p>
<ul>{itemsList}</ul>
<p>Your replacement order is now being processed and will be shipped to your registered delivery address.</p>
<p>Thank you for shopping with Pramukhraj Foods!</p>";

                    var textBody = $"Dear {customer.FullName ?? "Customer"},\n\nYour replacement order #{repOrderNumber} for return #{returnRequest.ReturnNumber} has been confirmed and queued for fulfillment.\n\nThank you,\nPramukhraj Foods";

                    await emailService.SendAsync(new EmailMessage(
                        customer.Email,
                        customer.FullName ?? "Customer",
                        $"Replacement Order Confirmed - #{repOrderNumber}",
                        htmlBody,
                        textBody), ct);
                }
                catch (Exception emailEx)
                {
                    logger.LogWarning(emailEx, "Failed to send replacement confirmation email for Return {ReturnNumber}", returnRequest.ReturnNumber);
                }
            }

            return ApiResponse<AdminReturnDetailsResponse>.Ok(
                MapAdminReturnDetails(returnRequest, originalOrder.OrderNumber, customer),
                $"Replacement order #{repOrderNumber} successfully generated.");
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to fulfill replacement order for ReturnId={ReturnId}", returnId);
            return ApiResponse<AdminReturnDetailsResponse>.Fail("Unable to fulfill replacement order.", 500);
        }
    }

    public async Task<byte[]> ExportReturnsCsvAsync(
        AdminReturnFilterRequest filter,
        CancellationToken ct = default)
    {
        var query = db.ReturnRequests
            .Include(r => r.Order)
            .Include(r => r.Items)
            .AsNoTracking()
            .AsQueryable();

        if (filter.Status.HasValue)
            query = query.Where(r => r.Status == filter.Status.Value);

        if (!string.IsNullOrWhiteSpace(filter.SearchQuery))
        {
            var search = filter.SearchQuery.Trim();
            query = query.Where(r =>
                EF.Functions.ILike(r.ReturnNumber, $"%{search}%") ||
                EF.Functions.ILike(r.Order.OrderNumber, $"%{search}%"));
        }

        if (filter.StartDate.HasValue)
            query = query.Where(r => r.CreatedOn >= filter.StartDate.Value);

        if (filter.EndDate.HasValue)
            query = query.Where(r => r.CreatedOn <= filter.EndDate.Value);

        var returns = await query
            .OrderByDescending(r => r.CreatedOn)
            .ToListAsync(ct);

        var customerIds = returns.Select(r => r.CustomerId).Distinct().ToList();
        var customerMap = await db.Customers
            .AsNoTracking()
            .Where(c => customerIds.Contains(c.Id))
            .ToDictionaryAsync(c => c.Id, ct);

        var sb = new System.Text.StringBuilder();
        sb.AppendLine("Return Number,Order Number,Customer Name,Customer Email,Customer Phone,Status,Reason,Resolution,Item Count,Total Refund (INR),Deductions (INR),Net Refund (INR),Courier,Tracking Number,Replacement Order,Created On,Completed On");

        foreach (var r in returns)
        {
            customerMap.TryGetValue(r.CustomerId, out var cust);
            var custName = EscapeCsv(cust?.FullName ?? "Customer");
            var custEmail = EscapeCsv(cust?.Email ?? "");
            var custPhone = EscapeCsv(cust?.MobileNumber ?? "");
            var status = r.Status.ToString();
            var reason = EscapeCsv(r.Reason.ToString());
            var resolution = r.Resolution.ToString();
            var itemCount = r.Items.Sum(i => i.Quantity);
            var totalRefund = r.TotalRefundAmount.ToString("F2");
            var deductions = r.ReverseShippingDeduction.ToString("F2");
            var netRefund = r.NetRefundAmount.ToString("F2");
            var courier = EscapeCsv(r.CourierName ?? "");
            var tracking = EscapeCsv(r.TrackingNumber ?? "");
            var repOrder = EscapeCsv(r.ReplacementOrderNumber ?? "");
            var created = r.CreatedOn.ToString("yyyy-MM-dd HH:mm:ss");
            var completed = r.CompletedOn.HasValue ? r.CompletedOn.Value.ToString("yyyy-MM-dd HH:mm:ss") : "";

            sb.AppendLine($"{r.ReturnNumber},{r.Order.OrderNumber},{custName},{custEmail},{custPhone},{status},{reason},{resolution},{itemCount},{totalRefund},{deductions},{netRefund},{courier},{tracking},{repOrder},{created},{completed}");
        }

        var preamble = System.Text.Encoding.UTF8.GetPreamble();
        var content = System.Text.Encoding.UTF8.GetBytes(sb.ToString());
        return preamble.Concat(content).ToArray();
    }

    private static string EscapeCsv(string value)
    {
        if (string.IsNullOrEmpty(value)) return "";
        if (value.Contains(',') || value.Contains('\"') || value.Contains('\n') || value.Contains('\r'))
        {
            return $"\"{value.Replace("\"", "\"\"")}\"";
        }
        return value;
    }

    // ==========================================
    // Internal Helpers
    // ==========================================

    private async Task<IReadOnlyList<EligibleOrderItemDto>> CalculateEligibleItemsAsync(Order order, CancellationToken ct)
    {
        var existingReturns = order.Returns
            .Where(r => r.Status != ReturnStatus.Rejected && r.Status != ReturnStatus.Cancelled)
            .SelectMany(r => r.Items)
            .GroupBy(i => i.OrderItemId)
            .ToDictionary(g => g.Key, g => g.Sum(i => i.Quantity));

        var productIds = order.Items.Select(i => i.ProductId).Distinct().ToList();
        var nonReturnableMap = await db.Products.AsNoTracking()
            .Include(p => p.Category)
            .Where(p => productIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id, p => (!p.IsReturnable || (p.Category != null && !p.Category.IsReturnable)), ct);

        var items = new List<EligibleOrderItemDto>();

        foreach (var orderItem in order.Items)
        {
            var alreadyReturned = existingReturns.TryGetValue(orderItem.Id, out var returnedQty) ? returnedQty : 0;
            var isNonReturnable = nonReturnableMap.TryGetValue(orderItem.ProductId, out var nonRet) && nonRet;
            var returnableQty = isNonReturnable ? 0 : Math.Max(0, orderItem.Quantity - alreadyReturned);

            decimal couponShare = 0m;
            if (order.Subtotal > 0m && order.CouponDiscountAmount > 0m)
            {
                var proportion = orderItem.LineTotal / order.Subtotal;
                couponShare = Math.Round(proportion * order.CouponDiscountAmount, 2, MidpointRounding.AwayFromZero);
            }

            var netLineTotal = Math.Max(0m, orderItem.LineTotal - couponShare);
            var refundPerItem = orderItem.Quantity > 0
                ? Math.Round(netLineTotal / orderItem.Quantity, 2, MidpointRounding.AwayFromZero)
                : 0m;

            items.Add(new EligibleOrderItemDto(
                OrderItemId: orderItem.Id,
                ProductVariantId: orderItem.ProductVariantId,
                ProductName: orderItem.ProductName,
                VariantName: orderItem.VariantName,
                PurchasedQuantity: orderItem.Quantity,
                AlreadyReturnedQuantity: alreadyReturned,
                ReturnableQuantity: returnableQty,
                UnitPrice: orderItem.UnitPrice,
                RefundPerItem: refundPerItem,
                IsReturnable: !isNonReturnable,
                NonReturnableReason: isNonReturnable ? "Non-returnable item as per store policy." : null));
        }

        return items;
    }

    private async Task<string> GenerateReturnNumberAsync(CancellationToken ct)
    {
        for (int i = 0; i < 5; i++)
        {
            var rand = RandomNumberGenerator.GetInt32(1000, 9999);
            var number = $"RMA-{DateTime.UtcNow:yyyyMM}-{rand}";
            var exists = await db.ReturnRequests.AnyAsync(r => r.ReturnNumber == number, ct);
            if (!exists) return number;
        }
        return $"RMA-{DateTime.UtcNow:yyyyMMddHHmmss}";
    }

    private static CustomerReturnDetailsResponse MapCustomerReturnDetails(ReturnRequest r, string orderNumber, DTOs.Settings.StoreSettingsData? storeSettings = null) =>
        new(
            Id: r.Id,
            ReturnNumber: r.ReturnNumber,
            OrderId: r.OrderId,
            OrderNumber: orderNumber,
            Status: r.Status,
            Reason: r.Reason,
            Resolution: r.Resolution,
            CustomerComments: r.CustomerComments,
            RejectionReason: r.RejectionReason,
            TotalRefundAmount: r.TotalRefundAmount,
            ReverseShippingDeduction: r.ReverseShippingDeduction,
            NetRefundAmount: r.NetRefundAmount,
            CreatedOn: r.CreatedOn,
            UpdatedOn: r.UpdatedOn,
            ApprovedOn: r.ApprovedOn,
            CompletedOn: r.CompletedOn,
            Items: r.Items.Select(i => new CustomerReturnItemDetailDto(
                i.Id, i.OrderItemId, i.ProductName, i.VariantName, i.Quantity, i.UnitPrice, i.RefundAmount, i.InspectionStatus)).ToList(),
            Media: r.Media.Select(m => new CustomerReturnMediaDto(m.Id, m.Url, m.FileName)).ToList(),
            Timeline: r.StatusHistory.OrderBy(h => h.CreatedOn).Select(h => new CustomerReturnTimelineDto(h.Status, h.Note, h.CreatedOn)).ToList(),
            Refund: r.Refund is null ? null : new CustomerRefundDetailDto(
                r.Refund.ProviderRefundId, (decimal)r.Refund.AmountPaise / 100m, r.Refund.Status, r.Refund.SettledOn),
            CourierName: r.CourierName,
            TrackingNumber: r.TrackingNumber,
            TrackingUrl: r.TrackingUrl,
            PickupScheduledDate: r.PickupScheduledDate,
            PickedUpOn: r.PickedUpOn,
            DeliveredToWarehouseOn: r.DeliveredToWarehouseOn,
            ReceivedOn: r.ReceivedOn,
            InspectedOn: r.InspectedOn,
            ReplacementOrderId: r.ReplacementOrderId,
            ReplacementOrderNumber: r.ReplacementOrderNumber,
            StoreAddress: storeSettings?.StoreAddress,
            StoreName: storeSettings?.StoreName,
            SupportPhone: storeSettings?.SupportPhoneNumber,
            SupportEmail: storeSettings?.SupportEmail,
            ProductRefundAmount: r.ProductRefundAmount,
            ShippingRefundAmount: r.ShippingRefundAmount,
            PaymentFeeRefundAmount: r.PaymentFeeRefundAmount);

    private static AdminReturnDetailsResponse MapAdminReturnDetails(
        ReturnRequest r,
        string orderNumber,
        Customer? customer,
        DTOs.Settings.StoreSettingsData? storeSettings = null,
        ReturnReasonPolicy? policy = null) =>
        new(
            Id: r.Id,
            ReturnNumber: r.ReturnNumber,
            OrderId: r.OrderId,
            OrderNumber: orderNumber,
            CustomerId: r.CustomerId,
            CustomerName: customer?.FullName ?? "Customer",
            CustomerEmail: customer?.Email ?? string.Empty,
            CustomerPhone: customer?.MobileNumber ?? string.Empty,
            Status: r.Status,
            Reason: r.Reason,
            Resolution: r.Resolution,
            CustomerComments: r.CustomerComments,
            AdminNotes: r.AdminNotes,
            RejectionReason: r.RejectionReason,
            TotalRefundAmount: r.TotalRefundAmount,
            ReverseShippingDeduction: r.ReverseShippingDeduction,
            NetRefundAmount: r.NetRefundAmount,
            CreatedOn: r.CreatedOn,
            UpdatedOn: r.UpdatedOn,
            ApprovedOn: r.ApprovedOn,
            ReceivedOn: r.ReceivedOn,
            InspectedOn: r.InspectedOn,
            CompletedOn: r.CompletedOn,
            ConcurrencyStamp: r.ConcurrencyStamp,
            Items: r.Items.Select(i => new AdminReturnItemDetailDto(
                i.Id, i.OrderItemId, i.ProductVariantId, i.ProductName, i.VariantName, i.Quantity, i.UnitPrice, i.RefundAmount, i.InspectionStatus, i.RestockInventory)).ToList(),
            Media: r.Media.Select(m => new CustomerReturnMediaDto(m.Id, m.Url, m.FileName)).ToList(),
            Timeline: r.StatusHistory.OrderBy(h => h.CreatedOn).Select(h => new AdminReturnTimelineDto(h.Id, h.Status, h.Note, h.ActorAdminId, h.ActorAdminName, h.CreatedOn)).ToList(),
            Refund: r.Refund is null ? null : new AdminRefundDetailDto(
                r.Refund.Id, r.Refund.IdempotencyKey, r.Refund.ProviderRefundId, (decimal)r.Refund.AmountPaise / 100m, r.Refund.AmountPaise, r.Refund.Currency, r.Refund.Status, r.Refund.RefundSpeed, r.Refund.FailureReason, r.Refund.CreatedOn, r.Refund.SettledOn),
            CourierName: r.CourierName,
            TrackingNumber: r.TrackingNumber,
            TrackingUrl: r.TrackingUrl,
            PickupScheduledDate: r.PickupScheduledDate,
            PickedUpOn: r.PickedUpOn,
            DeliveredToWarehouseOn: r.DeliveredToWarehouseOn,
            ReplacementOrderId: r.ReplacementOrderId,
            ReplacementOrderNumber: r.ReplacementOrderNumber,
            StoreAddress: storeSettings?.StoreAddress,
            StoreName: storeSettings?.StoreName,
            SupportPhone: storeSettings?.SupportPhoneNumber,
            SupportEmail: storeSettings?.SupportEmail,
            PolicyRefundProductAmount: policy?.RefundProductAmount ?? true,
            PolicyRefundShippingAmount: policy?.RefundShippingAmount ?? false,
            PolicyRefundPaymentFee: policy?.RefundPaymentFee ?? false,
            ProductRefundAmount: r.ProductRefundAmount,
            ShippingRefundAmount: r.ShippingRefundAmount,
            PaymentFeeRefundAmount: r.PaymentFeeRefundAmount);

    public async Task<ApiResponse<IReadOnlyList<ReturnReasonPolicyDto>>> GetReturnReasonPoliciesAsync(CancellationToken ct = default)
    {
        var policies = await db.ReturnReasonPolicies.AsNoTracking().ToListAsync(ct);
        var activeReasons = new[]
        {
            ReturnReason.DamagedInTransit,
            ReturnReason.DefectiveOrExpired,
            ReturnReason.WrongItemReceived,
            ReturnReason.QualityMismatch,
            ReturnReason.MissingItem,
            ReturnReason.LateDelivery,
            ReturnReason.OrderedByMistake,
            ReturnReason.PackageTampered,
            ReturnReason.TasteNotAsExpected
        };

        var policyDict = policies.ToDictionary(p => p.Reason);
        var result = new List<ReturnReasonPolicyDto>();

        foreach (var reason in activeReasons)
        {
            if (policyDict.TryGetValue(reason, out var existing))
            {
                result.Add(new ReturnReasonPolicyDto(
                    existing.Reason,
                    GetReturnReasonName(existing.Reason),
                    existing.RefundProductAmount,
                    existing.RefundShippingAmount,
                    existing.RefundPaymentFee,
                    existing.UpdatedOn));
            }
            else
            {
                var isSellerFault = reason is ReturnReason.DamagedInTransit or ReturnReason.DefectiveOrExpired or ReturnReason.WrongItemReceived or ReturnReason.PackageTampered;
                var isLate = reason == ReturnReason.LateDelivery;
                var isTaste = reason == ReturnReason.TasteNotAsExpected;

                result.Add(new ReturnReasonPolicyDto(
                    reason,
                    GetReturnReasonName(reason),
                    RefundProductAmount: !isTaste,
                    RefundShippingAmount: isSellerFault || isLate,
                    RefundPaymentFee: isSellerFault,
                    UpdatedOn: DateTime.UtcNow));
            }
        }

        return ApiResponse<IReadOnlyList<ReturnReasonPolicyDto>>.Ok(result.OrderBy(r => (int)r.Reason).ToList(), "Policies retrieved successfully.");
    }

    public async Task<ApiResponse<IReadOnlyList<ReturnReasonPolicyDto>>> UpdateReturnReasonPoliciesAsync(UpdateReturnReasonPoliciesRequest request, CancellationToken ct = default)
    {
        var adminInfo = Common.Common.GetAdminClaimInfo(httpContextAccessor);
        if (!adminInfo.Success || adminInfo.Data is null || !Guid.TryParse(adminInfo.Data.Id, out var adminId))
            return ApiResponse<IReadOnlyList<ReturnReasonPolicyDto>>.Fail("Admin authentication required.", 401);

        if (request?.Policies is null || request.Policies.Count == 0)
            return ApiResponse<IReadOnlyList<ReturnReasonPolicyDto>>.Fail("At least one policy rule must be provided.", 400);

        var existingPolicies = await db.ReturnReasonPolicies.ToListAsync(ct);
        var existingDict = existingPolicies.ToDictionary(p => p.Reason);
        var now = DateTime.UtcNow;

        foreach (var item in request.Policies)
        {
            if (existingDict.TryGetValue(item.Reason, out var existing))
            {
                existing.RefundProductAmount = item.RefundProductAmount;
                existing.RefundShippingAmount = item.RefundShippingAmount;
                existing.RefundPaymentFee = item.RefundPaymentFee;
                existing.UpdatedOn = now;
            }
            else
            {
                db.ReturnReasonPolicies.Add(new ReturnReasonPolicy
                {
                    Reason = item.Reason,
                    RefundProductAmount = item.RefundProductAmount,
                    RefundShippingAmount = item.RefundShippingAmount,
                    RefundPaymentFee = item.RefundPaymentFee,
                    UpdatedOn = now
                });
            }
        }

        db.AdminActions.Add(new AdminAction
        {
            Id = Guid.NewGuid(),
            AdminId = adminId,
            AdminName = adminInfo.Data.UserName ?? "Admin",
            Module = AdminActionModules.StoreSettings,
            Action = AdminActionTypes.Update,
            EntityName = "ReturnReasonPolicies",
            Description = "Updated return reason refund rules & policies.",
            CreatedOn = now
        });

        await db.SaveChangesAsync(ct);
        try
        {
            cache.RemoveByPrefix(CacheKey.Products.AllPrefix, "Return policies updated - product cache invalidated");
        }
        catch { /* non-fatal */ }
        return await GetReturnReasonPoliciesAsync(ct);
    }

    public static string GetReturnReasonName(ReturnReason reason) => reason switch
    {
        ReturnReason.DamagedInTransit => "Damaged in transit",
        ReturnReason.DefectiveOrExpired => "Defective or expired product",
        ReturnReason.WrongItemReceived => "Wrong item received",
        ReturnReason.QualityMismatch => "Quality not as expected",
        ReturnReason.MissingItem => "Missing item from shipment",
        ReturnReason.LateDelivery => "Arrived too late",
        ReturnReason.OrderedByMistake => "Ordered by mistake",
        ReturnReason.PackageTampered => "Package tampered or leaked",
        ReturnReason.TasteNotAsExpected => "Taste not as expected",
        _ => reason.ToString()
    };
}
