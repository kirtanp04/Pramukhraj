using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using pramukhraj.Common;
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


        public AuthController(IServiceManager serviceManager)
        {
            _serviceManager = serviceManager;
        }



        [HttpPost("admin/refresh")]
        public async Task<IActionResult> AdminRefresh([FromBody] pramukhraj.DTOs.Auth.RefreshRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.RefreshToken))
            {
                return BadRequest(ApiResponse<string>.Fail("Refresh token is required."));
            }

            var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

            try
            {
                var (accessToken, refreshToken) = await _serviceManager.TokenService.RefreshTokensAsync(request.RefreshToken, ip, IsAdmin: true);

                // load the newly created refresh token to get the associated user
                var db = HttpContext.RequestServices.GetService<pramukhraj.Database.AppDbContext>()!;
                var newRefresh = await db.RefreshTokens.SingleOrDefaultAsync(t => t.Token == refreshToken);
                if (newRefresh == null)
                {
                    return Unauthorized(ApiResponse<string>.Fail("Unable to refresh token."));
                }

                var user = await _serviceManager.UserManager.FindByIdAsync(newRefresh.UserId);
                if (user == null)
                {
                    return Unauthorized(ApiResponse<string>.Fail("Invalid user for refresh token."));
                }

                var response = new AuthResponse
                {
                    AccessToken = accessToken,
                    RefreshToken = refreshToken,
                    ExpiresIn = 60 * 60,
                    UserId = user.Id,
                    Email = user.Email ?? string.Empty,
                    Username = user.UserName ?? string.Empty,
                    IsDeleted = user.IsDeleted
                };

                return Ok(ApiResponse<AuthResponse>.Ok(response, "Token refreshed."));
            }
            catch (InvalidOperationException ex)
            {
                return Unauthorized(ApiResponse<string>.Fail(ex.Message, 401));
            }
            catch
            {
                return StatusCode(500, ApiResponse<string>.Fail("An unexpected error occurred while refreshing token."));
            }
        }

        [HttpPost("admin/register")]
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
                RefreshToken = refreshToken,
                ExpiresIn = 60 * 60, // seconds, aligns with JwtSettings.AccessTokenExpirationMinutes if 60
                UserId = user.Id,
                Email = user.Email ?? string.Empty,
                Username = user.UserName ?? "",
                IsDeleted = user.IsDeleted
            };

            return Ok(ApiResponse<AuthResponse>.Ok(response, "Login successful."));
        }

        [HttpPost("customer/register")]
        public async Task<IActionResult> CustomerRegister([FromBody] CustomerRegisterRequest request)
        {
            // check existing email in customers table
            var existing = await HttpContext.RequestServices.GetService<pramukhraj.Database.AppDbContext>()!.Customers.SingleOrDefaultAsync(c => c.Email == request.Email);
            if (existing != null)
            {
                return BadRequest(ApiResponse<string>.Fail("Email is already registered."));
            }

            var customer = new pramukhraj.Entities.Customer
            {
                FirstName = request.FirstName,
                LastName = request.LastName,
                Email = request.Email,
                CreatedAt = System.DateTimeOffset.UtcNow
            };

            var hasher = new Microsoft.AspNetCore.Identity.PasswordHasher<pramukhraj.Entities.Customer>();
            customer.PasswordHash = hasher.HashPassword(customer, request.Password);

            var db = HttpContext.RequestServices.GetService<pramukhraj.Database.AppDbContext>()!;
            db.Customers.Add(customer);
            await db.SaveChangesAsync();

            // create tokens
            var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            var (accessToken, refreshToken) = await _serviceManager.TokenService.CreateTokensForCustomerAsync(customer, ip);

            var response = new AuthResponse
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                ExpiresIn = 60 * 60,
                UserId = customer.Id.ToString(),
                Email = customer.Email,
            };

            return Created(string.Empty, ApiResponse<AuthResponse>.Ok(response, "Customer registration successful."));
        }

        [HttpPost("customer/login")]
        public async Task<IActionResult> CustomerLogin([FromBody] CustomerLoginRequest request)
        {
            var db = HttpContext.RequestServices.GetService<pramukhraj.Database.AppDbContext>()!;
            var customer = await db.Customers.SingleOrDefaultAsync(c => c.Email == request.Email);
            if (customer == null)
            {
                return Unauthorized(ApiResponse<string>.Fail("Invalid credentials.", 401));
            }

            var hasher = new Microsoft.AspNetCore.Identity.PasswordHasher<pramukhraj.Entities.Customer>();
            var verify = hasher.VerifyHashedPassword(customer, customer.PasswordHash, request.Password);
            if (verify == Microsoft.AspNetCore.Identity.PasswordVerificationResult.Failed)
            {
                return Unauthorized(ApiResponse<string>.Fail("Invalid credentials.", 401));
            }

            var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            var (accessToken, refreshToken) = await _serviceManager.TokenService.CreateTokensForCustomerAsync(customer, ip);

            var response = new AuthResponse
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                ExpiresIn = 60 * 60,
                UserId = customer.Id.ToString(),
                Email = customer.Email,
            };

            return Ok(ApiResponse<AuthResponse>.Ok(response, "Login successful."));
        }
    }
}
