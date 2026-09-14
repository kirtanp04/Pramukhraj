using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using pramukhraj.Common;
using pramukhraj.Configurations;
using pramukhraj.Database;
using pramukhraj.DTOs.Auth;
using pramukhraj.Entities.Customer;
using pramukhraj.Interfaces;
using System.Data;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace pramukhraj.Controllers;

[ApiController]
[Route("api/auth/customer")]
public sealed class CustomerAuthController(
    AppDbContext db,
    IServiceManager serviceManager,
    ICustomerTokenService tokenService,
    IOptions<CustomerOtpSettings> otpOptions,
    IOptions<JwtSettings> jwtOptions,
    IWebHostEnvironment environment,
    IValidatorManager validatorManager) : ControllerBase
{
    private const string RefreshCookieName = "pramukhraj_customer_refresh";
    private readonly CustomerOtpSettings _otp = otpOptions.Value;
    private readonly JwtSettings _jwt = jwtOptions.Value;

    [HttpPost("send-otp")]
    [EnableRateLimiting("customer-otp-send")]
    public async Task<IActionResult> SendOtp([FromBody] SendCustomerOtpRequest request, CancellationToken cancellationToken)
    {
        var invalid = await ValidateAsync(validatorManager.SendCustomerOtpRequest, request, cancellationToken);
        if (invalid is not null) return invalid;

        var mobile = request.MobileNumber.Trim();
        var now = DateTime.UtcNow;
        var last = await db.CustomerOtpChallenges
            .Where(x => x.MobileNumber == mobile && x.Purpose == CustomerOtpPurpose.Authentication)
            .OrderByDescending(x => x.CreatedOn)
            .Select(x => new { x.CreatedOn })
            .FirstOrDefaultAsync(cancellationToken);
        if (last is not null && last.CreatedOn.AddSeconds(_otp.ResendCooldownSeconds) > now)
        {
            Response.Headers.RetryAfter = Math.Ceiling((last.CreatedOn.AddSeconds(_otp.ResendCooldownSeconds) - now).TotalSeconds).ToString();
            return StatusCode(StatusCodes.Status429TooManyRequests,
                ApiResponse<object>.Fail("Please wait before requesting another code.", 429));
        }

        var sentInLastHour = await db.CustomerOtpChallenges.CountAsync(
            x => x.MobileNumber == mobile && x.Purpose == CustomerOtpPurpose.Authentication && x.CreatedOn > now.AddHours(-1),
            cancellationToken);
        if (sentInLastHour >= _otp.MaxSendsPerPhonePerHour)
            return StatusCode(StatusCodes.Status429TooManyRequests,
                ApiResponse<object>.Fail("Too many codes requested. Please try again later.", 429));

        await db.CustomerOtpChallenges
            .Where(x => x.MobileNumber == mobile && x.Purpose == CustomerOtpPurpose.Authentication &&
                        x.ConsumedOn == null && x.VerifiedOn == null)
            .ExecuteUpdateAsync(x => x.SetProperty(c => c.ConsumedOn, now), cancellationToken);

        var code = RandomNumberGenerator.GetInt32(100_000, 1_000_000).ToString();
        var challenge = new CustomerOtpChallenge
        {
            Id = Guid.NewGuid(),
            CustomerId = await db.Customers.Where(x => x.MobileNumber == mobile).Select(x => (Guid?)x.Id).SingleOrDefaultAsync(cancellationToken),
            MobileNumber = mobile,
            Purpose = CustomerOtpPurpose.Authentication,
            FailedAttempts = 0,
            MaxAttempts = _otp.MaxAttempts,
            CreatedOn = now,
            ExpiresOn = now.AddMinutes(_otp.ExpirationMinutes),
            RequestIpHash = HashValue(ClientIp()),
        };
        challenge.OtpHash = HashOtp(challenge.Id, mobile, code);
        db.CustomerOtpChallenges.Add(challenge);
        await db.SaveChangesAsync(cancellationToken);

        try
        {
            await serviceManager.CustomerOtpService.SendAsync(mobile, code, _otp.ExpirationMinutes, cancellationToken);
        }
        catch
        {
            db.CustomerOtpChallenges.Remove(challenge);
            await db.SaveChangesAsync(cancellationToken);
            throw;
        }

        return Ok(ApiResponse<SendCustomerOtpResponse>.Ok(
            new(challenge.Id, _otp.ExpirationMinutes * 60, _otp.ResendCooldownSeconds),
            "Verification code sent."));
    }

    [HttpPost("verify-otp")]
    [EnableRateLimiting("customer-otp-verify")]
    public async Task<IActionResult> VerifyOtp([FromBody] VerifyCustomerOtpRequest request, CancellationToken cancellationToken)
    {
        var invalid = await ValidateAsync(validatorManager.VerifyCustomerOtpRequest, request, cancellationToken);
        if (invalid is not null) return invalid;

        string? refreshToken = null;
        var strategy = db.Database.CreateExecutionStrategy();
        var result = await strategy.ExecuteAsync(async () =>
        {
            db.ChangeTracker.Clear();
            refreshToken = null;
            await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
            var mobile = request.MobileNumber.Trim();
            var challenge = await db.CustomerOtpChallenges.SingleOrDefaultAsync(
                x => x.Id == request.ChallengeId && x.MobileNumber == mobile && x.Purpose == CustomerOtpPurpose.Authentication,
                cancellationToken);

            if (challenge is null || challenge.ConsumedOn is not null || challenge.VerifiedOn is not null ||
                challenge.ExpiresOn <= DateTime.UtcNow || challenge.FailedAttempts >= challenge.MaxAttempts)
                return (IActionResult)Unauthorized(ApiResponse<object>.Fail("The verification code is invalid or expired.", 401));

            if (!CryptographicOperations.FixedTimeEquals(
                    Convert.FromHexString(challenge.OtpHash),
                    Convert.FromHexString(HashOtp(challenge.Id, mobile, request.Code))))
            {
                challenge.FailedAttempts++;
                await db.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);
                return (IActionResult)Unauthorized(ApiResponse<object>.Fail("The verification code is invalid or expired.", 401));
            }

            var now = DateTime.UtcNow;
            challenge.VerifiedOn = now;
            challenge.ConsumedOn = now;
            var customer = await db.Customers.SingleOrDefaultAsync(x => x.MobileNumber == mobile, cancellationToken);
            var isNewCustomer = customer is null;
            if (customer is null)
            {
                customer = new Customer
                {
                    Id = Guid.NewGuid(),
                    MobileNumber = mobile,
                    IsMobileVerified = true,
                    FullName = string.Empty,
                    IsProfileCompleted = false,
                    IsActive = true,
                    CreatedOn = now,
                    UpdatedOn = now,
                    LastLoginOn = now
                };
                db.Customers.Add(customer);
                challenge.CustomerId = customer.Id;
            }
            else
            {
                if (!CanSignIn(customer))
                    return (IActionResult)Unauthorized(ApiResponse<object>.Fail("This account is unavailable. Please contact support.", 401));
                customer.IsMobileVerified = true;
                customer.LastLoginOn = now;
                customer.UpdatedOn = now;
            }

            var tokens = await tokenService.IssueAsync(customer, request.DeviceName, ClientIp(), cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            refreshToken = tokens.RefreshToken;
            return (IActionResult)Ok(ApiResponse<CustomerAuthResponse>.Ok(
                new(tokens.AccessToken, tokens.ExpiresInSeconds, isNewCustomer, ToResponse(customer)),
                isNewCustomer ? "Mobile verified. Complete your profile when ready." : "Welcome back."));
        });

        if (refreshToken is not null) SetRefreshCookie(refreshToken);
        return result;
    }

    [HttpPost("refresh-token")]
    [EnableRateLimiting("customer-token")]
    public async Task<IActionResult> RefreshToken(CancellationToken cancellationToken)
    {
        if (!Request.Cookies.TryGetValue(RefreshCookieName, out var refreshToken) || string.IsNullOrWhiteSpace(refreshToken))
            return Unauthorized(ApiResponse<object>.Fail("Refresh session is missing.", 401));
        try
        {
            var result = await tokenService.RotateAsync(refreshToken, ClientIp(), cancellationToken);
            SetRefreshCookie(result.Tokens.RefreshToken);
            return Ok(ApiResponse<CustomerAuthResponse>.Ok(
                new(result.Tokens.AccessToken, result.Tokens.ExpiresInSeconds, false, ToResponse(result.Customer)),
                "Session refreshed."));
        }
        catch (UnauthorizedAccessException)
        {
            DeleteRefreshCookie();
            return Unauthorized(ApiResponse<object>.Fail("Your session has expired. Please sign in again.", 401));
        }
    }

    [Authorize(Roles = "Customer")]
    [HttpPost("complete-profile")]
    public async Task<IActionResult> CompleteProfile([FromBody] CompleteCustomerProfileRequest request, CancellationToken cancellationToken)
    {
        var invalid = await ValidateAsync(validatorManager.CompleteCustomerProfileRequest, request, cancellationToken);
        if (invalid is not null) return invalid;
        var customer = await CurrentCustomerAsync(cancellationToken);
        if (customer is null) return Unauthorized(ApiResponse<object>.Fail("Invalid customer session.", 401));

        var normalizedEmail = request.Email.Trim().ToUpperInvariant();
        if (await db.Customers.AnyAsync(x => x.Id != customer.Id && x.NormalizedEmail == normalizedEmail, cancellationToken))
            return Conflict(ApiResponse<object>.Fail("Email is already in use.", 409));

        customer.FullName = request.FullName.Trim();
        customer.Email = request.Email.Trim().ToLowerInvariant();
        customer.NormalizedEmail = normalizedEmail;
        customer.City = NullIfWhiteSpace(request.City);
        customer.State = NullIfWhiteSpace(request.State);
        customer.PostalCode = NullIfWhiteSpace(request.PostalCode);
        customer.MarketingConsent = request.MarketingConsent;
        customer.MarketingConsentOn = request.MarketingConsent ? DateTime.UtcNow : null;
        customer.IsProfileCompleted = true;
        customer.UpdatedOn = DateTime.UtcNow;
        customer.ConcurrencyStamp = Guid.NewGuid().ToString("N");
        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            return Conflict(ApiResponse<object>.Fail("Email is already in use.", 409));
        }
        return Ok(ApiResponse<CustomerResponse>.Ok(ToResponse(customer), "Profile completed."));
    }

    [Authorize(Roles = "Customer")]
    [HttpGet("me")]
    public async Task<IActionResult> Me(CancellationToken cancellationToken)
    {
        var customer = await CurrentCustomerAsync(cancellationToken);
        return customer is null
            ? Unauthorized(ApiResponse<object>.Fail("Invalid customer session.", 401))
            : Ok(ApiResponse<CustomerResponse>.Ok(ToResponse(customer)));
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout(CancellationToken cancellationToken)
    {
        if (Request.Cookies.TryGetValue(RefreshCookieName, out var refreshToken) && !string.IsNullOrWhiteSpace(refreshToken))
            await tokenService.RevokeAsync(refreshToken, cancellationToken);
        DeleteRefreshCookie();
        return Ok(ApiResponse<object>.Ok(null, "Signed out."));
    }

    private async Task<Customer?> CurrentCustomerAsync(CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) &&
            !Guid.TryParse(User.FindFirstValue("sub"), out id)) return null;
        var customer = await db.Customers.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (customer is null || !CanSignIn(customer)) return null;
        return User.FindFirstValue("token_version") == customer.TokenVersion.ToString() ? customer : null;
    }

    private void SetRefreshCookie(string token)
    {
        var options = RefreshCookieOptions();
        options.Expires = DateTimeOffset.UtcNow.AddDays(_jwt.RefreshTokenExpirationDays);
        Response.Cookies.Append(RefreshCookieName, token, options);
    }

    private void DeleteRefreshCookie() =>
        Response.Cookies.Delete(RefreshCookieName, RefreshCookieOptions());

    private CookieOptions RefreshCookieOptions()
    {
        var crossSchemeDevelopment = environment.IsDevelopment() && Request.IsHttps;
        return new CookieOptions
        {
            HttpOnly = true,
            Secure = !environment.IsDevelopment() || Request.IsHttps,
            SameSite = crossSchemeDevelopment ? SameSiteMode.None : SameSiteMode.Strict,
            Path = "/api/auth/customer",
            IsEssential = true
        };
    }

    private string HashOtp(Guid challengeId, string mobile, string code)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(_otp.HashPepper));
        return Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes($"{challengeId:N}:{mobile}:{code}")));
    }

    private string HashValue(string value)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(_otp.HashPepper));
        return Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(value)));
    }

    private string ClientIp() => HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    private static bool CanSignIn(Customer x) => x.IsActive && !x.IsBlocked && !x.IsDeleted;
    private static string? NullIfWhiteSpace(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static CustomerResponse ToResponse(Customer x) => new()
    {
        CustomerId = x.Id.ToString(), MobileNumber = x.MobileNumber, FullName = x.FullName,
        Email = x.Email, City = x.City, State = x.State, PostalCode = x.PostalCode,
        IsMobileVerified = x.IsMobileVerified, IsProfileCompleted = x.IsProfileCompleted,
        MarketingConsent = x.MarketingConsent
    };

    private BadRequestObjectResult? ToValidationError(FluentValidation.Results.ValidationResult result)
    {
        if (result.IsValid) return null;
        var errors = result.Errors.GroupBy(x => x.PropertyName)
            .ToDictionary(x => x.Key, x => x.Select(e => e.ErrorMessage).Distinct().ToArray());
        return BadRequest(ApiResponse<object>.Fail("Please correct the highlighted fields.", 400, errors));
    }

    private async Task<BadRequestObjectResult?> ValidateAsync<T>(IValidator<T> validator, T request, CancellationToken cancellationToken) =>
        ToValidationError(await validator.ValidateAsync(request, cancellationToken));
}
