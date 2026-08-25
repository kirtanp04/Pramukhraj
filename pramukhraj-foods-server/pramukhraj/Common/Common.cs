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

        public static int GetTimeZone(IHttpContextAccessor httpContextAccessor)
        {
            ArgumentNullException.ThrowIfNull(httpContextAccessor);

            var httpContext = httpContextAccessor.HttpContext;

             const string TimeZoneKey = "time-zone";

             const int MinTimeZoneOffsetMinutes = -840;
             const int MaxTimeZoneOffsetMinutes = 840;

            if (httpContext is null ||
                !httpContext.Items.TryGetValue(TimeZoneKey, out var rawValue) ||
                rawValue is null)
            {
                return 0;
            }

            int? timeZone = rawValue switch
            {
                int value => value,

                string value when int.TryParse(value, out var parsedValue)
                    => parsedValue,

                _ => null
            };

            if (!timeZone.HasValue)
            {
                return 0;
            }

            return timeZone.Value is >= MinTimeZoneOffsetMinutes
                and <= MaxTimeZoneOffsetMinutes
                    ? timeZone.Value
                    : 0;
        }
    }
}
