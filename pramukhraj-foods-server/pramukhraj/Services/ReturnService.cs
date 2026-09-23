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
using static pramukhraj.Common.AdminActions;

namespace pramukhraj.Services;

public sealed class ReturnService(
    AppDbContext db,
    IStoreSettingsService settingsService,
    IHttpContextAccessor httpContextAccessor,
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

            var eligibleItems = CalculateEligibleItems(order);
            var anyReturnable = eligibleItems.Any(i => i.ReturnableQuantity > 0);

            return ApiResponse<ReturnEligibilityResponse>.Ok(new ReturnEligibilityResponse(
                IsEligible: anyReturnable,
                ReturnWindowDays: returnWindowDays,
                DeliveredOn: deliveredOn,
                ReturnWindowExpiresOn: expiresOn,
                IneligibilityReason: anyReturnable ? null : "All items in this order have already been returned or have an active return request.",
                Items: eligibleItems));
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

        await using var tx = await db.Database.BeginTransactionAsync(ct);
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

            var eligibleItems = CalculateEligibleItems(order).ToDictionary(i => i.OrderItemId);

            decimal totalRefundAmount = 0m;
            var returnItems = new List<ReturnItem>();
            var now = DateTime.UtcNow;

            foreach (var reqItem in request.Items)
            {
                if (!eligibleItems.TryGetValue(reqItem.OrderItemId, out var eligible) || eligible.ReturnableQuantity <= 0)
                    return ApiResponse<CustomerReturnDetailsResponse>.Fail($"Item '{reqItem.OrderItemId}' is not eligible for return.", 400);

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
                CustomerComments = request.CustomerComments.Trim(),
                TotalRefundAmount = totalRefundAmount,
                ReverseShippingDeduction = 0m,
                NetRefundAmount = totalRefundAmount,
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
                Id = Guid.NewGuid(),
                ReturnRequestId = returnRequest.Id,
                Status = ReturnStatus.Requested,
                Note = "Return request initiated by customer.",
                CreatedOn = now
            });

            db.ReturnRequests.Add(returnRequest);
            await db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);

            logger.LogInformation("Return request {ReturnNumber} created successfully for OrderId={OrderId}, CustomerId={CustomerId}", returnNumber, orderId, customerId);

            return ApiResponse<CustomerReturnDetailsResponse>.Ok(
                MapCustomerReturnDetails(returnRequest, order.OrderNumber),
                "Return request submitted successfully. Our team will review your request shortly.");
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
        catch (Exception ex)
        {
            await tx.RollbackAsync(ct);
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

            return ApiResponse<CustomerReturnDetailsResponse>.Ok(
                MapCustomerReturnDetails(returnRequest, returnRequest.Order.OrderNumber));
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
                Id = Guid.NewGuid(),
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

            return ApiResponse<AdminReturnDetailsResponse>.Ok(
                MapAdminReturnDetails(returnRequest, returnRequest.Order.OrderNumber, customer));
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
                Id = Guid.NewGuid(),
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
            return ApiResponse<AdminReturnDetailsResponse>.Ok(
                MapAdminReturnDetails(returnRequest, returnRequest.Order.OrderNumber, customer),
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
                Id = Guid.NewGuid(),
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

            if (allPassed)
            {
                returnRequest.Status = ReturnStatus.InspectionPassed;
            }
            else if (anyPassed)
            {
                // Partial pass: update net refund to only reflect items that passed QC
                returnRequest.Status = ReturnStatus.InspectionPassed;
                returnRequest.TotalRefundAmount = passedRefundTotal;
                returnRequest.NetRefundAmount = Math.Max(0m, passedRefundTotal - returnRequest.ReverseShippingDeduction);
            }
            else
            {
                returnRequest.Status = ReturnStatus.InspectionFailed;
                returnRequest.NetRefundAmount = 0m;
                returnRequest.CompletedOn = now;
            }

            returnRequest.StatusHistory.Add(new ReturnStatusHistory
            {
                Id = Guid.NewGuid(),
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
                MapAdminReturnDetails(returnRequest, returnRequest.Order.OrderNumber, customer),
                $"Inspection recorded successfully. Return status updated to {returnRequest.Status}.");
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to record inspection for ReturnId={ReturnId}", returnId);
            return ApiResponse<AdminReturnDetailsResponse>.Fail("Unable to record inspection result.", 500);
        }
    }

    // ==========================================
    // Internal Helpers
    // ==========================================

    private static IReadOnlyList<EligibleOrderItemDto> CalculateEligibleItems(Order order)
    {
        var existingReturns = order.Returns
            .Where(r => r.Status != ReturnStatus.Rejected && r.Status != ReturnStatus.Cancelled)
            .SelectMany(r => r.Items)
            .GroupBy(i => i.OrderItemId)
            .ToDictionary(g => g.Key, g => g.Sum(i => i.Quantity));

        var items = new List<EligibleOrderItemDto>();

        foreach (var orderItem in order.Items)
        {
            var alreadyReturned = existingReturns.TryGetValue(orderItem.Id, out var returnedQty) ? returnedQty : 0;
            var returnableQty = Math.Max(0, orderItem.Quantity - alreadyReturned);

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
                RefundPerItem: refundPerItem));
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

    private static CustomerReturnDetailsResponse MapCustomerReturnDetails(ReturnRequest r, string orderNumber) =>
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
                r.Refund.ProviderRefundId, (decimal)r.Refund.AmountPaise / 100m, r.Refund.Status, r.Refund.SettledOn));

    private static AdminReturnDetailsResponse MapAdminReturnDetails(ReturnRequest r, string orderNumber, Customer? customer) =>
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
                r.Refund.Id, r.Refund.IdempotencyKey, r.Refund.ProviderRefundId, (decimal)r.Refund.AmountPaise / 100m, r.Refund.AmountPaise, r.Refund.Currency, r.Refund.Status, r.Refund.RefundSpeed, r.Refund.FailureReason, r.Refund.CreatedOn, r.Refund.SettledOn));
}
