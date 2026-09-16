using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using pramukhraj.Common;
using pramukhraj.Configurations;
using pramukhraj.DTOs.Auth;
using pramukhraj.Entities;
using pramukhraj.Interfaces;

namespace pramukhraj.Controllers
{
    [ApiController]
    [Route("api/auth")]
    [EnableRateLimiting("rate-limit")]
    public sealed class AuthController : ControllerBase
    {
        private readonly IServiceManager _serviceManager;
        private readonly IWebHostEnvironment _environment;
        private readonly JwtSettings _jwtSettings;
        private const string AdminRefreshCookieName = "pramukhraj_admin_refresh";

        public AuthController(IServiceManager serviceManager, IWebHostEnvironment environment, IOptions<JwtSettings> jwtOptions)
        {
            _serviceManager = serviceManager;
            _environment = environment;
            _jwtSettings = jwtOptions.Value;
        }



        [HttpPost("admin/refresh")]
        public async Task<IActionResult> AdminRefresh()
        {
            var suppliedRefreshToken = Request.Cookies[AdminRefreshCookieName];
            if (string.IsNullOrWhiteSpace(suppliedRefreshToken))
            {
                return BadRequest(ApiResponse<string>.Fail("Refresh token is required."));
            }

            var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

            try
            {
                var (accessToken, refreshToken, userId) = await _serviceManager.TokenService.RefreshTokensAsync(suppliedRefreshToken, ip, IsAdmin: true);
                var user = await _serviceManager.UserManager.FindByIdAsync(userId);
                if (user == null)
                {
                    return Unauthorized(ApiResponse<string>.Fail("Invalid user for refresh token."));
                }

                var response = new AuthResponse
                {
                    AccessToken = accessToken,
                    ExpiresIn = checked(_jwtSettings.AccessTokenExpirationMinutes * 60),
                    UserId = user.Id,
                    Email = user.Email ?? string.Empty,
                    Username = user.UserName ?? string.Empty,
                    IsDeleted = user.IsDeleted
                };

                SetAdminRefreshCookie(refreshToken);
                return Ok(ApiResponse<AuthResponse>.Ok(response, "Token refreshed."));
            }
            catch (Exception ex) when (ex is InvalidOperationException or UnauthorizedAccessException)
            {
                DeleteAdminRefreshCookie();
                return Unauthorized(ApiResponse<string>.Fail(ex.Message, 401));
            }
            catch
            {
                return StatusCode(500, ApiResponse<string>.Fail("An unexpected error occurred while refreshing token."));
            }
        }

        [HttpPost("admin/register")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AdminRegister([FromBody] RegisterRequest request)
        {
           
            var existingName = await _serviceManager.UserManager.FindByNameAsync(request.Username.Trim().ToLower());

            if (existingName != null)
            {
                return BadRequest(ApiResponse<string>.Fail("Username is already registered."));
            }

            var existingEmail = await _serviceManager.UserManager.FindByEmailAsync(request.Email.Trim().ToLower());

            if (existingEmail != null)
            {
                return BadRequest(ApiResponse<string>.Fail("Email is already registered."));
            }

            var user = new ApplicationUser
            {
                UserName = request.Username.Trim().ToLower(),
                Email = request.Email.Trim().ToLower(),
                CreatedAt = System.DateTimeOffset.UtcNow
            };

            var result = await _serviceManager.UserManager.CreateAsync(user, request.Password);
            if (!result.Succeeded)
            {
                return BadRequest(ApiResponse<object>.Fail("Registration failed.", 400, result.Errors));
            }

           
            var token = await _serviceManager.UserManager.GenerateEmailConfirmationTokenAsync(user);

            return Created(string.Empty, ApiResponse<object>.Ok(new { user.Id, Email = user.Email, EmailConfirmationToken = token }, "Admin registration successful. Please verify your email."));
        }

        [HttpPost("admin/login")]
        public async Task<IActionResult> AdminLogin([FromBody] LoginRequest request)
        {
            var user = await _serviceManager.UserManager.FindByNameAsync(request.Username);

            if (user == null)
            {
                return Unauthorized(ApiResponse<string>.Fail("Invalid credentials.", 401));
            }

            if (!await _serviceManager.UserManager.IsEmailConfirmedAsync(user))
            {
                return Forbid();
            }

            var result = await _serviceManager.SignInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: true);
            if (!result.Succeeded)
            {
                if (result.IsLockedOut)
                {
                    
                        return Forbid("Your account is temporarily locked due to multiple failed login attempts. Please try again later.");

                }

                return Unauthorized(ApiResponse<string>.Fail("Invalid credentials.", 401));
            }

            if (user.IsDeleted)
            {
                return Unauthorized(
                    ApiResponse<string>.Fail(
                        "Your account has been disabled. Please contact admin for assistance.",
                        401
                    )
                );
            }
            var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

            var (accessToken, refreshToken) = await _serviceManager.TokenService.CreateTokensAsync(user, ip, IsAdmin: true);

            var response = new AuthResponse
            {
                AccessToken = accessToken,
                ExpiresIn = checked(_jwtSettings.AccessTokenExpirationMinutes * 60),
                UserId = user.Id,
                Email = user.Email ?? string.Empty,
                Username = user.UserName ?? "",
                IsDeleted = user.IsDeleted
            };

            SetAdminRefreshCookie(refreshToken);
            return Ok(ApiResponse<AuthResponse>.Ok(response, "Login successful."));
        }

        [HttpPost("admin/logout")]
        public async Task<IActionResult> AdminLogout()
        {
            var refreshToken = Request.Cookies[AdminRefreshCookieName];
            if (!string.IsNullOrWhiteSpace(refreshToken))
            {
                var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
                await _serviceManager.TokenService.RevokeRefreshTokenAsync(refreshToken, ip);
            }

            DeleteAdminRefreshCookie();
            return Ok(ApiResponse<object>.Ok(new { }, "Logged out successfully."));
        }

        private void SetAdminRefreshCookie(string refreshToken)
        {
            var options = AdminRefreshCookieOptions();
            options.Expires = DateTimeOffset.UtcNow.AddDays(_jwtSettings.RefreshTokenExpirationDays);
            Response.Cookies.Append(AdminRefreshCookieName, refreshToken, options);
        }

        private void DeleteAdminRefreshCookie() =>
            Response.Cookies.Delete(AdminRefreshCookieName, AdminRefreshCookieOptions());

        private CookieOptions AdminRefreshCookieOptions()
        {
            var crossSchemeDevelopment = _environment.IsDevelopment() && Request.IsHttps;
            return new CookieOptions
            {
                HttpOnly = true,
                Secure = !_environment.IsDevelopment() || Request.IsHttps,
                SameSite = crossSchemeDevelopment ? SameSiteMode.None : SameSiteMode.Strict,
                Path = "/api/auth/admin",
                IsEssential = true
            };
        }

    }
}
