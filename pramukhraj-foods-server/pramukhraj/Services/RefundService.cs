using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using pramukhraj.Common;
using pramukhraj.Database;
using pramukhraj.DTOs.ProviderCredentials;
using pramukhraj.DTOs.Return;
using pramukhraj.Entities;
using pramukhraj.Entities.Order;
using pramukhraj.Entities.ProviderCredentials;
using pramukhraj.Entities.Return;
using pramukhraj.Interfaces;
using pramukhraj.DTOs.Notifications;
using static pramukhraj.Common.AdminActions;

namespace pramukhraj.Services;

public sealed class RefundService(
    HttpClient httpClient,
    AppDbContext db,
    IProviderCredentialService credentialsService,
    IHttpContextAccessor httpContextAccessor,
    ICacheService cache,
    IAdminNotificationService notifications,
    ILogger<RefundService> logger) : IRefundService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task<ApiResponse<AdminRefundDetailDto>> ProcessRefundAsync(
        Guid returnId,
        AdminProcessRefundRequest request,
        CancellationToken ct = default)
    {
        var adminInfo = Common.Common.GetAdminClaimInfo(httpContextAccessor);
        if (!adminInfo.Success || adminInfo.Data is null || !Guid.TryParse(adminInfo.Data.Id, out var adminId))
            return ApiResponse<AdminRefundDetailDto>.Fail("Admin authentication required.", 401);

        try
        {
            var returnRequest = await db.ReturnRequests
                .Include(r => r.Order).ThenInclude(o => o.Payments)
                .Include(r => r.Items)
                .Include(r => r.StatusHistory)
                .Include(r => r.Refund)
                .SingleOrDefaultAsync(r => r.Id == returnId, ct);

            if (returnRequest is null)
                return ApiResponse<AdminRefundDetailDto>.Fail("Return request was not found.", 404);

            var eligibleStatuses = new[] { ReturnStatus.Approved, ReturnStatus.InspectionPassed };
            if (!eligibleStatuses.Contains(returnRequest.Status))
                return ApiResponse<AdminRefundDetailDto>.Fail($"Refund cannot be processed for return in status '{returnRequest.Status}'. Return must be Approved or InspectionPassed.", 400);

            if (returnRequest.NetRefundAmount <= 0)
                return ApiResponse<AdminRefundDetailDto>.Fail("Net refund amount is zero. No refund is required.", 400);

            if (returnRequest.Refund is not null && returnRequest.Refund.Status == RefundStatus.Processed)
                return ApiResponse<AdminRefundDetailDto>.Fail("A refund has already been successfully processed for this return request.", 400);

            var successfulPayment = returnRequest.Order.Payments
                .Where(p => p.Status == PaymentStatus.Paid && !string.IsNullOrWhiteSpace(p.ProviderPaymentId))
                .OrderByDescending(p => p.PaidOn ?? p.CreatedOn)
                .FirstOrDefault();

            if (successfulPayment is null || string.IsNullOrWhiteSpace(successfulPayment.ProviderPaymentId))
                return ApiResponse<AdminRefundDetailDto>.Fail("No completed digital payment was found on the order to issue a refund against.", 400);

            var credentials = await credentialsService.GetRequiredAsync<RazorpayProviderCredentials>(ProviderKey.Razorpay, ct);
            if (string.IsNullOrWhiteSpace(credentials?.ApiKey) || string.IsNullOrWhiteSpace(credentials?.KeySecret))
                return ApiResponse<AdminRefundDetailDto>.Fail("Razorpay payment credentials are not configured.", 500);

            var refundPaise = (long)Math.Round(returnRequest.NetRefundAmount * 100m, MidpointRounding.AwayFromZero);
            var idempotencyKey = $"rfnd_{returnRequest.Id:N}";
            var speed = string.Equals(request?.RefundSpeed, "optimum", StringComparison.OrdinalIgnoreCase) ? "optimum" : "normal";

            var refundPayload = new
            {
                amount = refundPaise,
                speed = speed,
                receipt = returnRequest.ReturnNumber,
                notes = new Dictionary<string, string>
                {
                    ["return_id"] = returnRequest.Id.ToString(),
                    ["return_number"] = returnRequest.ReturnNumber,
                    ["order_number"] = returnRequest.Order.OrderNumber
                }
            };

            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, $"payments/{successfulPayment.ProviderPaymentId}/refund")
            {
                Content = JsonContent.Create(refundPayload, options: JsonOptions)
            };
            Authorize(httpRequest, credentials);
            httpRequest.Headers.TryAddWithoutValidation("X-Razorpay-Idempotency", idempotencyKey);

            using var response = await httpClient.SendAsync(httpRequest, ct);
            var responseBody = await response.Content.ReadAsStringAsync(ct);

            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("Razorpay refund failed with status {StatusCode}: {Body}", (int)response.StatusCode, responseBody);
                string errorMessage = "Gateway declined refund request.";
                try
                {
                    using var errJson = JsonDocument.Parse(responseBody);
                    if (errJson.RootElement.TryGetProperty("error", out var errObj) &&
                        errObj.TryGetProperty("description", out var desc))
                    {
                        errorMessage = desc.GetString() ?? errorMessage;
                    }
                }
                catch { }

                return ApiResponse<AdminRefundDetailDto>.Fail($"Payment gateway error: {errorMessage}", 400);
            }

            using var json = JsonDocument.Parse(responseBody);
            var root = json.RootElement;
            var providerRefundId = root.GetProperty("id").GetString() ?? string.Empty;
            var statusStr = root.TryGetProperty("status", out var st) ? st.GetString() : "processed";
            var refundStatus = string.Equals(statusStr, "processed", StringComparison.OrdinalIgnoreCase)
                ? RefundStatus.Processed
                : RefundStatus.Pending;

            var now = DateTime.UtcNow;

            var refundRecord = returnRequest.Refund;
            if (refundRecord is null)
            {
                refundRecord = new RefundRecord
                {
                    Id = Guid.NewGuid(),
                    ReturnRequestId = returnRequest.Id,
                    OrderId = returnRequest.OrderId,
                    PaymentId = successfulPayment.Id,
                    IdempotencyKey = idempotencyKey,
                    ProviderRefundId = providerRefundId,
                    AmountPaise = refundPaise,
                    Currency = "INR",
                    Status = refundStatus,
                    RefundSpeed = speed,
                    RawGatewayResponseJson = responseBody,
                    CreatedOn = now,
                    SettledOn = refundStatus == RefundStatus.Processed ? now : null
                };
                db.RefundRecords.Add(refundRecord);
            }
            else
            {
                refundRecord.ProviderRefundId = providerRefundId;
                refundRecord.AmountPaise = refundPaise;
                refundRecord.Status = refundStatus;
                refundRecord.RefundSpeed = speed;
                refundRecord.RawGatewayResponseJson = responseBody;
                refundRecord.SettledOn = refundStatus == RefundStatus.Processed ? now : null;
            }

            if (refundStatus == RefundStatus.Processed)
            {
                returnRequest.Status = ReturnStatus.RefundCompleted;
                returnRequest.CompletedOn = now;

                // Restock inventory for items approved and marked for restock
                foreach (var item in returnRequest.Items.Where(i => i.RestockInventory && i.InspectionStatus == InspectionOutcome.Passed))
                {
                    var variant = await db.ProductVariants.SingleOrDefaultAsync(v => v.Id == item.ProductVariantId, ct);
                    if (variant is not null)
                    {
                        variant.StockQuantity += item.Quantity;
                        logger.LogInformation("Restocked variant {VariantId} by {Quantity} units for Return {ReturnNumber}",
                            variant.Id, item.Quantity, returnRequest.ReturnNumber);
                    }
                }
            }
            else
            {
                returnRequest.Status = ReturnStatus.RefundInitiated;
            }

            returnRequest.UpdatedOn = now;
            returnRequest.ConcurrencyStamp = Guid.NewGuid().ToString("N");

            returnRequest.StatusHistory.Add(new ReturnStatusHistory
            {
                ReturnRequestId = returnRequest.Id,
                Status = returnRequest.Status,
                Note = $"Refund of ₹{returnRequest.NetRefundAmount:F2} processed via Razorpay. Reference: {providerRefundId}. Status: {refundStatus}.",
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
                Description = $"Issued Razorpay refund of ₹{returnRequest.NetRefundAmount:F2} (Ref: {providerRefundId}).",
                CreatedOn = now
            });

            await db.SaveChangesAsync(ct);
            try
            {
                cache.RemoveByPrefix(CacheKey.Products.AllPrefix, "Return items restocked - product cache invalidated");
                cache.RemoveByPrefix(CacheKey.Categories.AllPrefix, "Return items restocked - category cache invalidated");
                cache.RemoveByPrefix(CacheKey.Sales.AllPrefix, "Refund processed - invalidating sales cache");
            }
            catch { /* non-fatal */ }
            logger.LogInformation("Refund {ProviderRefundId} successfully processed for Return {ReturnNumber}", providerRefundId, returnRequest.ReturnNumber);

            return ApiResponse<AdminRefundDetailDto>.Ok(new AdminRefundDetailDto(
                Id: refundRecord.Id,
                IdempotencyKey: refundRecord.IdempotencyKey,
                ProviderRefundId: refundRecord.ProviderRefundId,
                Amount: (decimal)refundRecord.AmountPaise / 100m,
                AmountPaise: refundRecord.AmountPaise,
                Currency: refundRecord.Currency,
                Status: refundRecord.Status,
                RefundSpeed: refundRecord.RefundSpeed,
                FailureReason: null,
                CreatedOn: refundRecord.CreatedOn,
                SettledOn: refundRecord.SettledOn),
                "Refund has been processed successfully through payment gateway.");
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to process refund for ReturnId={ReturnId}", returnId);
            return ApiResponse<AdminRefundDetailDto>.Fail("Unable to process refund right now. Please try again.", 500);
        }
    }

    public async Task<bool> HandleRazorpayRefundWebhookAsync(
        string payloadJson,
        string signature,
        CancellationToken ct = default)
    {
        try
        {
            var credentials = await credentialsService.GetRequiredAsync<RazorpayProviderCredentials>(ProviderKey.Razorpay, ct);
            if (string.IsNullOrWhiteSpace(credentials?.WebhookSecret))
            {
                logger.LogWarning("Razorpay webhook secret is not configured; cannot verify refund webhook.");
                return false;
            }

            if (!VerifySignature(payloadJson, signature, credentials.WebhookSecret))
            {
                logger.LogWarning("Invalid Razorpay webhook signature for refund event.");
                return false;
            }

            using var doc = JsonDocument.Parse(payloadJson);
            var root = doc.RootElement;
            var eventType = root.GetProperty("event").GetString();

            if (eventType is not ("refund.processed" or "refund.failed" or "refund.speed_changed"))
                return true; // Ignored non-refund events

            var refundEntity = root.GetProperty("payload").GetProperty("refund").GetProperty("entity");
            var providerRefundId = refundEntity.GetProperty("id").GetString();

            if (string.IsNullOrWhiteSpace(providerRefundId))
                return true;

            var refundRecord = await db.RefundRecords
                .Include(r => r.ReturnRequest).ThenInclude(rr => rr.Order)
                .Include(r => r.ReturnRequest).ThenInclude(rr => rr.Items)
                .SingleOrDefaultAsync(r => r.ProviderRefundId == providerRefundId, ct);

            if (refundRecord is null)
            {
                logger.LogInformation("Refund record not found for webhook {ProviderRefundId}", providerRefundId);
                return true;
            }

            var now = DateTime.UtcNow;
            if (eventType == "refund.processed")
            {
                refundRecord.Status = RefundStatus.Processed;
                refundRecord.SettledOn = now;
                refundRecord.ReturnRequest.Status = ReturnStatus.RefundCompleted;
                refundRecord.ReturnRequest.CompletedOn = now;

                // Restock items
                foreach (var item in refundRecord.ReturnRequest.Items.Where(i => i.RestockInventory && i.InspectionStatus == InspectionOutcome.Passed))
                {
                    var variant = await db.ProductVariants.SingleOrDefaultAsync(v => v.Id == item.ProductVariantId, ct);
                    if (variant is not null) variant.StockQuantity += item.Quantity;
                }

                try
                {
                    cache.RemoveByPrefix(CacheKey.Products.AllPrefix, "Return items restocked via webhook - product cache invalidated");
                    cache.RemoveByPrefix(CacheKey.Categories.AllPrefix, "Return items restocked via webhook - category cache invalidated");
                    cache.RemoveByPrefix(CacheKey.Sales.AllPrefix, "Refund webhook processed - invalidating sales cache");
                }
                catch { /* non-fatal */ }

                try
                {
                    await notifications.CreateAsync(new CreateAdminNotification(
                        Type: "RefundCompleted",
                        Severity: "Success",
                        Title: $"Refund Completed #{refundRecord.ReturnRequest.ReturnNumber}",
                        Message: $"Razorpay confirmed refund of ₹{((decimal)refundRecord.AmountPaise / 100m):N2} for Order #{refundRecord.ReturnRequest.Order?.OrderNumber}.",
                        EntityType: "Return",
                        EntityId: refundRecord.ReturnRequest.Id.ToString(),
                        ActionUrl: "/admin/returns"), publishImmediately: true, cancellationToken: ct);
                }
                catch (Exception nEx)
                {
                    logger.LogWarning(nEx, "Failed to publish admin notification for refund.processed");
                }
            }
            else if (eventType == "refund.failed")
            {
                refundRecord.Status = RefundStatus.Failed;
                refundRecord.FailureReason = "Gateway reported refund failure.";

                try
                {
                    await notifications.CreateAsync(new CreateAdminNotification(
                        Type: "RefundFailed",
                        Severity: "Error",
                        Title: $"Refund Failed #{refundRecord.ReturnRequest.ReturnNumber}",
                        Message: $"Razorpay refund of ₹{((decimal)refundRecord.AmountPaise / 100m):N2} failed: {refundRecord.FailureReason}",
                        EntityType: "Return",
                        EntityId: refundRecord.ReturnRequest.Id.ToString(),
                        ActionUrl: "/admin/returns"), publishImmediately: true, cancellationToken: ct);
                }
                catch (Exception nEx)
                {
                    logger.LogWarning(nEx, "Failed to publish admin notification for refund.failed");
                }
            }

            await db.SaveChangesAsync(ct);
            return true;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error processing Razorpay refund webhook");
            return false;
        }
    }

    private static void Authorize(HttpRequestMessage request, RazorpayProviderCredentials credentials)
    {
        var raw = $"{credentials.ApiKey}:{credentials.KeySecret}";
        request.Headers.Authorization = new AuthenticationHeaderValue("Basic", Convert.ToBase64String(Encoding.UTF8.GetBytes(raw)));
    }

    private static bool VerifySignature(string payload, string signature, string secret)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
        var hex = Convert.ToHexStringLower(hash);
        return CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(hex), Encoding.UTF8.GetBytes(signature));
    }
}
