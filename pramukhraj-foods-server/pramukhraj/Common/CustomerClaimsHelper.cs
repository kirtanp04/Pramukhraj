using System.Security.Claims;

namespace pramukhraj.Common;

public sealed record CustomerClaims(Guid CustomerId, string? Name, string? MobileNumber, string? TokenVersion);

public sealed class CustomerClaimsHelper(IHttpContextAccessor httpContextAccessor)
{
    public ApiResponse<CustomerClaims> GetCustomer()
    {
        var user = httpContextAccessor.HttpContext?.User;
        if (user?.Identity?.IsAuthenticated != true || !user.IsInRole("Customer"))
            return ApiResponse<CustomerClaims>.Fail("Invalid or expired customer session.", StatusCodes.Status401Unauthorized);

        var identifier = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(identifier, out var customerId) || customerId == Guid.Empty)
            return ApiResponse<CustomerClaims>.Fail("Invalid or expired customer session.", StatusCodes.Status401Unauthorized);

        var name = user.FindFirst(ClaimTypes.Name)?.Value;
        var mobile = user.FindFirst(ClaimTypes.MobilePhone)?.Value;
        return ApiResponse<CustomerClaims>.Ok(new CustomerClaims(
            customerId, name, mobile, user.FindFirst("token_version")?.Value));
    }
}
