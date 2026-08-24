using Microsoft.EntityFrameworkCore;
using pramukhraj.Entities;
using System.Security.Claims;

namespace pramukhraj.Common
{
    public class Common
    {
        public static ApiResponse<Entities.ApplicationUser> GetAdminClaimInfo(
     IHttpContextAccessor httpContextAccessor)
        {
            var httpContext = httpContextAccessor.HttpContext;

            if (httpContext is null)
            {
                return ApiResponse<Entities.ApplicationUser>.Fail(
                    "HTTP context is unavailable.",
                    StatusCodes.Status401Unauthorized);
            }

            if (!httpContext.Items.TryGetValue("UserInfo", out var value) ||
                value is not Entities.ApplicationUser applicationUser)
            {
                return ApiResponse<Entities.ApplicationUser>.Fail(
                    "Authenticated administrator information was not found.",
                    StatusCodes.Status401Unauthorized);
            }

            if (!Guid.TryParse(
                    applicationUser.Id.ToString(),
                    out var adminId))
            {
                return ApiResponse<Entities.ApplicationUser>.Fail(
                    "The administrator ID is invalid.",
                    StatusCodes.Status401Unauthorized);
            }

            var adminName = applicationUser.UserName?.Trim();

            if (string.IsNullOrWhiteSpace(adminName))
            {
                return ApiResponse<Entities.ApplicationUser>.Fail(
                    "The administrator name is missing.",
                    StatusCodes.Status401Unauthorized);
            }

            return new ApiResponse<Entities.ApplicationUser>
            {
                StatusCode = StatusCodes.Status200OK,
                Success = true,
                Message = "Administrator information retrieved successfully.",
                Data = applicationUser
            };
        }
    }
}
