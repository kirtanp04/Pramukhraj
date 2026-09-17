using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Policy;
using pramukhraj.Common;
using pramukhraj.Interfaces;

namespace pramukhraj.Authorization;

public sealed class VerifiedCustomerRequirement : IAuthorizationRequirement;

public sealed class VerifiedCustomerAuthorizationHandler(IServiceManager serviceManager)
    : AuthorizationHandler<VerifiedCustomerRequirement>
{
    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        VerifiedCustomerRequirement requirement)
    {
        var identifier = context.User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? context.User.FindFirstValue("sub");
        if (!Guid.TryParse(identifier, out var customerId) || customerId == Guid.Empty)
        {
            context.Fail(new AuthorizationFailureReason(this, "INVALID_CUSTOMER_SESSION"));
            return;
        }

        var decision = await serviceManager.CustomerVerificationService.EvaluateAccessAsync(
            customerId,
            context.User.FindFirstValue("token_version"));
        if (decision.IsAllowed) context.Succeed(requirement);
        else context.Fail(new AuthorizationFailureReason(this, decision.ErrorCode));
    }
}

public sealed class CustomerAuthorizationResultHandler : IAuthorizationMiddlewareResultHandler
{
    private readonly AuthorizationMiddlewareResultHandler _defaultHandler = new();

    public async Task HandleAsync(
        RequestDelegate next,
        HttpContext context,
        AuthorizationPolicy policy,
        PolicyAuthorizationResult authorizeResult)
    {
        if (authorizeResult.Forbidden && policy.Requirements.OfType<VerifiedCustomerRequirement>().Any())
        {
            var code = authorizeResult.AuthorizationFailure?.FailureReasons
                .Select(reason => reason.Message)
                .FirstOrDefault(message => !string.IsNullOrWhiteSpace(message))
                ?? DTOs.Customer.CustomerVerificationErrorCodes.ContactVerificationRequired;
            var isInvalidSession = string.Equals(code, "INVALID_CUSTOMER_SESSION", StringComparison.Ordinal);
            var statusCode = isInvalidSession ? StatusCodes.Status401Unauthorized : StatusCodes.Status403Forbidden;
            context.Response.StatusCode = statusCode;
            await context.Response.WriteAsJsonAsync(
                ApiResponse<object>.Fail(
                    isInvalidSession
                        ? "Your customer session is no longer valid. Please sign in again."
                        : "Verify your mobile number and email address before continuing to checkout.",
                    statusCode,
                    new Dictionary<string, string[]> { ["code"] = [code] }),
                context.RequestAborted);
            return;
        }

        await _defaultHandler.HandleAsync(next, context, policy, authorizeResult);
    }
}
