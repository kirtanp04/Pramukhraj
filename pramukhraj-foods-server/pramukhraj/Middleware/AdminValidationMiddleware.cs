using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using pramukhraj.Common;
using pramukhraj.Configurations;
using pramukhraj.Database;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace pramukhraj.Middleware
{
    /// <summary>
    /// Middleware that validates that requests to admin endpoints have a valid JWT for an active admin user.
    /// It expects Bearer token in Authorization header and checks token validity and user record.
    /// </summary>
    public sealed class AdminValidationMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<AdminValidationMiddleware> _logger;
        private readonly string _adminPrefix;

        public AdminValidationMiddleware(RequestDelegate next, IOptions<EncryptionSettings> options, ILogger<AdminValidationMiddleware> logger)
        {
            _next = next;
            _logger = logger;
            // reuse EncryptionSettings.ApiPathPrefix as configuration for prefixes if desired; default to /api/admin
            _adminPrefix = options?.Value?.ApiPathPrefix ?? "/api";
            if (!_adminPrefix.EndsWith("/admin", StringComparison.OrdinalIgnoreCase))
            {
                // if configured prefix is "/api" then admin endpoints usually start with /api/admin
                _adminPrefix = _adminPrefix.TrimEnd('/') + "/admin";
            }
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var path = context.Request.Path.Value ?? string.Empty;
            // Allow unauthenticated access to admin auth endpoints (login/register/refresh)
            var allowedAdminAuthPaths = new[] { "/api/auth/admin/login", "/api/auth/admin/register", "/api/auth/admin/refresh" };
            foreach (var p in allowedAdminAuthPaths)
            {
                if (path.StartsWith(p, StringComparison.OrdinalIgnoreCase))
                {
                    await _next(context);
                    return;
                }
            }

            if (!path.Contains(_adminPrefix, StringComparison.OrdinalIgnoreCase))
            {
                await _next(context);
                return;
            }

            _logger.LogDebug("AdminValidationMiddleware: protecting path {Path}", path);

            // Ensure authentication happened - try to authenticate the bearer token
            var authResult = await context.AuthenticateAsync(JwtBearerDefaults.AuthenticationScheme);
            if (!authResult.Succeeded || authResult.Principal == null)
            {
                _logger.LogWarning("AdminValidationMiddleware: authentication failed for path {Path}", path);
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                await context.Response.WriteAsJsonAsync(ApiResponse<string>.Fail("Invalid or missing authentication token.",StatusCodes.Status401Unauthorized));
                return;
            }

            var principal = authResult.Principal;

            // Extract subject claim (user id)
            var userId = principal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value ?? principal.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning("AdminValidationMiddleware: token missing subject claim");
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                await context.Response.WriteAsJsonAsync(ApiResponse<string>.Fail("Invalid token claims.",StatusCodes.Status401Unauthorized));
                return;
            }

            // Validate user exists, not deleted and is admin
            var db = context.RequestServices.GetService<AppDbContext>();
            if (db == null)
            {
                _logger.LogError("AdminValidationMiddleware: AppDbContext not available");
                context.Response.StatusCode = StatusCodes.Status500InternalServerError;
                await context.Response.WriteAsJsonAsync(ApiResponse<string>.Fail("Server configuration error.",StatusCodes.Status500InternalServerError));
                return;
            }

            var user = await db.Users.FindAsync(userId);
            if (user == null)
            {
                _logger.LogWarning("AdminValidationMiddleware: user not found {UserId}", userId);
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                await context.Response.WriteAsJsonAsync(ApiResponse<string>.Fail("Invalid user.",StatusCodes.Status401Unauthorized));
                return;
            }

            if (user.IsDeleted)
            {
                _logger.LogWarning("AdminValidationMiddleware: user is deleted {UserId}", userId);
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                await context.Response.WriteAsJsonAsync(ApiResponse<string>.Fail("Account disabled.",StatusCodes.Status403Forbidden));
                return;
            }

           

            // All good — set the HttpContext.User to the principal from the token and continue
            context.User = principal;
            context.Items["UserInfo"] = user; // optional: store user info in context items for downstream access
            await _next(context);
        }
    }
}
