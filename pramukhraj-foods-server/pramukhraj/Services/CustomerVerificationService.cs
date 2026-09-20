using System.Security.Cryptography;
using System.Text;
using FluentValidation.Results;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using pramukhraj.Common;
using pramukhraj.Configurations;
using pramukhraj.Database;
using pramukhraj.DTOs.Customer;
using pramukhraj.Entities.Customer;
using pramukhraj.Interfaces;

namespace pramukhraj.Services;

public sealed class CustomerVerificationService(
    AppDbContext db,
    CustomerClaimsHelper claimsHelper,
    IValidatorManager validatorManager,
    ICustomerOtpSender otpSender,
    IEmailQueue emailQueue,
    IOptions<CustomerOtpSettings> otpOptions,
    IHttpContextAccessor httpContextAccessor,
    ILogger<CustomerVerificationService> logger) : ICustomerVerificationService
{
    private readonly CustomerOtpSettings _settings = otpOptions.Value;

    public async Task<ApiResponse<CustomerVerificationStatusResponse>> GetStatusAsync(CancellationToken cancellationToken = default)
    {
        var customer = await GetCurrentCustomerAsync(cancellationToken);
        return customer.Response is not null
            ? ApiResponse<CustomerVerificationStatusResponse>.Fail(customer.Response.Message, customer.Response.StatusCode, customer.Response.Errors)
            : ApiResponse<CustomerVerificationStatusResponse>.Ok(ToStatus(customer.Customer!));
    }

    public async Task<ApiResponse<VerificationChallengeResponse>> RequestMobileCodeAsync(CancellationToken cancellationToken = default)
    {
        var current = await GetCurrentCustomerAsync(cancellationToken);
        if (current.Response is not null) return Failure<VerificationChallengeResponse>(current.Response);
        var customer = current.Customer!;
        if (string.IsNullOrWhiteSpace(customer.MobileNumber))
            return ApiResponse<VerificationChallengeResponse>.Fail("A mobile number is required.", 403, Code(CustomerVerificationErrorCodes.MobileVerificationRequired));
        if (customer.IsMobileVerified)
            return ApiResponse<VerificationChallengeResponse>.Fail("Your mobile number is already verified.", 409);

        var now = DateTime.UtcNow;
        var limited = await CheckMobileRateLimitAsync(customer, now, cancellationToken);
        if (limited is not null) return limited;
        await db.CustomerOtpChallenges.Where(x => x.CustomerId == customer.Id &&
                x.Purpose == CustomerOtpPurpose.ChangeMobileNumber && x.ConsumedOn == null)
            .ExecuteUpdateAsync(setters => setters.SetProperty(x => x.ConsumedOn, now), cancellationToken);

        var code = CreateCode();
        var challenge = new CustomerOtpChallenge
        {
            Id = Guid.NewGuid(), CustomerId = customer.Id, MobileNumber = customer.MobileNumber,
            Purpose = CustomerOtpPurpose.ChangeMobileNumber, MaxAttempts = _settings.MaxAttempts,
            CreatedOn = now, ExpiresOn = now.AddMinutes(_settings.ExpirationMinutes),
            RequestIpHash = HashValue(ClientIp())
        };
        challenge.OtpHash = HashCode(challenge.Id, customer.MobileNumber, code);
        db.CustomerOtpChallenges.Add(challenge);
        await db.SaveChangesAsync(cancellationToken);
        try
        {
            await otpSender.SendAsync(customer.MobileNumber, code, _settings.ExpirationMinutes, cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { throw; }
        catch (Exception exception)
        {
            logger.LogError(exception, "Mobile verification delivery failed for customer {CustomerId}.", customer.Id);
            db.CustomerOtpChallenges.Remove(challenge);
            await db.SaveChangesAsync(cancellationToken);
            return ApiResponse<VerificationChallengeResponse>.Fail("Mobile verification is temporarily unavailable. Please try again.", 503);
        }
        return ApiResponse<VerificationChallengeResponse>.Ok(
            Challenge(challenge.Id), "Verification code sent.");
    }

    public async Task<ApiResponse<CustomerVerificationStatusResponse>> VerifyMobileCodeAsync(
        VerifyContactCodeRequest request,
        CancellationToken cancellationToken = default)
    {
        var validation = await validatorManager.VerifyContactCodeRequest.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid) return ValidationFailure<CustomerVerificationStatusResponse>(validation);
        var current = await GetCurrentCustomerAsync(cancellationToken);
        if (current.Response is not null) return Failure<CustomerVerificationStatusResponse>(current.Response);
        var customer = current.Customer!;
        var challenge = await db.CustomerOtpChallenges.SingleOrDefaultAsync(x =>
            x.Id == request.ChallengeId && x.CustomerId == customer.Id &&
            x.MobileNumber == customer.MobileNumber && x.Purpose == CustomerOtpPurpose.ChangeMobileNumber,
            cancellationToken);
        if (!Valid(challenge)) return InvalidCode<CustomerVerificationStatusResponse>();
        if (!FixedEquals(challenge!.OtpHash, HashCode(challenge.Id, challenge.MobileNumber, request.Code)))
        {
            challenge.FailedAttempts++;
            await db.SaveChangesAsync(cancellationToken);
            return InvalidCode<CustomerVerificationStatusResponse>();
        }
        var now = DateTime.UtcNow;
        challenge.VerifiedOn = now;
        challenge.ConsumedOn = now;
        customer.IsMobileVerified = true;
        customer.MobileVerifiedOn = now;
        customer.UpdatedOn = now;
        customer.ConcurrencyStamp = Guid.NewGuid().ToString("N");
        await db.SaveChangesAsync(cancellationToken);
        return ApiResponse<CustomerVerificationStatusResponse>.Ok(ToStatus(customer), "Mobile number verified successfully.");
    }

    public async Task<ApiResponse<CustomerVerificationStatusResponse>> UpdateEmailAsync(
        UpdateCustomerEmailRequest request,
        CancellationToken cancellationToken = default)
    {
        var validation = await validatorManager.UpdateCustomerEmailRequest.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid) return ValidationFailure<CustomerVerificationStatusResponse>(validation);
        var current = await GetCurrentCustomerAsync(cancellationToken);
        if (current.Response is not null) return Failure<CustomerVerificationStatusResponse>(current.Response);
        var customer = current.Customer!;
        var email = request.Email.Trim().ToLowerInvariant();
        var normalized = email.ToUpperInvariant();
        if (await db.Customers.AsNoTracking().AnyAsync(x => x.Id != customer.Id && x.NormalizedEmail == normalized, cancellationToken))
            return ApiResponse<CustomerVerificationStatusResponse>.Fail("This email address cannot be used.", 409);
        if (string.Equals(customer.NormalizedEmail, normalized, StringComparison.Ordinal))
            return ApiResponse<CustomerVerificationStatusResponse>.Ok(ToStatus(customer), "Email address is unchanged.");

        var now = DateTime.UtcNow;
        customer.Email = email;
        customer.NormalizedEmail = normalized;
        customer.IsEmailVerified = false;
        customer.EmailVerifiedOn = null;
        customer.UpdatedOn = now;
        customer.ConcurrencyStamp = Guid.NewGuid().ToString("N");
        await db.CustomerEmailVerificationChallenges.Where(x => x.CustomerId == customer.Id && x.ConsumedOn == null)
            .ExecuteUpdateAsync(setters => setters.SetProperty(x => x.ConsumedOn, now), cancellationToken);
        try { await db.SaveChangesAsync(cancellationToken); }
        catch (DbUpdateException)
        {
            return ApiResponse<CustomerVerificationStatusResponse>.Fail("This email address cannot be used.", 409);
        }
        return ApiResponse<CustomerVerificationStatusResponse>.Ok(ToStatus(customer), "Email address saved. Verify it to continue.");
    }

    public async Task<ApiResponse<VerificationChallengeResponse>> RequestEmailCodeAsync(CancellationToken cancellationToken = default)
    {
        var current = await GetCurrentCustomerAsync(cancellationToken);
        if (current.Response is not null) return Failure<VerificationChallengeResponse>(current.Response);
        var customer = current.Customer!;
        if (string.IsNullOrWhiteSpace(customer.Email) || string.IsNullOrWhiteSpace(customer.NormalizedEmail))
            return ApiResponse<VerificationChallengeResponse>.Fail("Add an email address before requesting verification.", 403, Code(CustomerVerificationErrorCodes.EmailAddressRequired));
        if (customer.IsEmailVerified)
            return ApiResponse<VerificationChallengeResponse>.Fail("Your email address is already verified.", 409);

        var now = DateTime.UtcNow;
        var last = await db.CustomerEmailVerificationChallenges.AsNoTracking()
            .Where(x => x.CustomerId == customer.Id && x.NormalizedEmail == customer.NormalizedEmail)
            .OrderByDescending(x => x.CreatedOn).Select(x => (DateTime?)x.CreatedOn).FirstOrDefaultAsync(cancellationToken);
        if (last.HasValue && last.Value.AddSeconds(_settings.ResendCooldownSeconds) > now)
            return ApiResponse<VerificationChallengeResponse>.Fail("Please wait before requesting another code.", 429);
        var sent = await db.CustomerEmailVerificationChallenges.CountAsync(x =>
            x.CustomerId == customer.Id && x.CreatedOn > now.AddHours(-1), cancellationToken);
        if (sent >= _settings.MaxSendsPerPhonePerHour)
            return ApiResponse<VerificationChallengeResponse>.Fail("Too many codes requested. Please try again later.", 429);

        await db.CustomerEmailVerificationChallenges.Where(x => x.CustomerId == customer.Id && x.ConsumedOn == null)
            .ExecuteUpdateAsync(setters => setters.SetProperty(x => x.ConsumedOn, now), cancellationToken);
        var code = CreateCode();
        var challenge = new CustomerEmailVerificationChallenge
        {
            Id = Guid.NewGuid(), CustomerId = customer.Id, NormalizedEmail = customer.NormalizedEmail,
            MaxAttempts = _settings.MaxAttempts, CreatedOn = now,
            ExpiresOn = now.AddMinutes(_settings.ExpirationMinutes), RequestIpHash = HashValue(ClientIp())
        };
        challenge.CodeHash = HashCode(challenge.Id, challenge.NormalizedEmail, code);
        db.CustomerEmailVerificationChallenges.Add(challenge);
        await db.SaveChangesAsync(cancellationToken);
        if (!emailQueue.TryQueueEmailVerification(
                customer.Email, customer.FullName, code, _settings.ExpirationMinutes, challenge.Id))
        {
            db.CustomerEmailVerificationChallenges.Remove(challenge);
            await db.SaveChangesAsync(cancellationToken);
            return ApiResponse<VerificationChallengeResponse>.Fail("Email verification is temporarily unavailable. Please try again.", 503);
        }
        return ApiResponse<VerificationChallengeResponse>.Ok(Challenge(challenge.Id), "Verification code sent.");
    }

    public async Task<ApiResponse<CustomerVerificationStatusResponse>> VerifyEmailCodeAsync(
        VerifyContactCodeRequest request,
        CancellationToken cancellationToken = default)
    {
        var validation = await validatorManager.VerifyContactCodeRequest.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid) return ValidationFailure<CustomerVerificationStatusResponse>(validation);
        var current = await GetCurrentCustomerAsync(cancellationToken);
        if (current.Response is not null) return Failure<CustomerVerificationStatusResponse>(current.Response);
        var customer = current.Customer!;
        if (string.IsNullOrWhiteSpace(customer.NormalizedEmail))
            return ApiResponse<CustomerVerificationStatusResponse>.Fail("Add an email address before verifying it.", 403, Code(CustomerVerificationErrorCodes.EmailAddressRequired));
        var challenge = await db.CustomerEmailVerificationChallenges.SingleOrDefaultAsync(x =>
            x.Id == request.ChallengeId && x.CustomerId == customer.Id && x.NormalizedEmail == customer.NormalizedEmail,
            cancellationToken);
        if (!Valid(challenge)) return InvalidCode<CustomerVerificationStatusResponse>();
        if (!FixedEquals(challenge!.CodeHash, HashCode(challenge.Id, challenge.NormalizedEmail, request.Code)))
        {
            challenge.FailedAttempts++;
            await db.SaveChangesAsync(cancellationToken);
            return InvalidCode<CustomerVerificationStatusResponse>();
        }
        var now = DateTime.UtcNow;
        challenge.VerifiedOn = now;
        challenge.ConsumedOn = now;
        customer.IsEmailVerified = true;
        customer.EmailVerifiedOn = now;
        customer.UpdatedOn = now;
        customer.ConcurrencyStamp = Guid.NewGuid().ToString("N");
        await db.SaveChangesAsync(cancellationToken);
        return ApiResponse<CustomerVerificationStatusResponse>.Ok(ToStatus(customer), "Email address verified successfully.");
    }

    public async Task<CustomerAccessDecision> EvaluateAccessAsync(
        Guid customerId,
        string? tokenVersion,
        CancellationToken cancellationToken = default)
    {
        var customer = await db.Customers.AsNoTracking().SingleOrDefaultAsync(x => x.Id == customerId, cancellationToken);
        if (customer is null || !customer.IsActive || customer.IsBlocked || customer.IsDeleted ||
            tokenVersion != customer.TokenVersion.ToString())
            return new(false, 401, "INVALID_CUSTOMER_SESSION", "Your customer session is no longer valid.");
        if (string.IsNullOrWhiteSpace(customer.MobileNumber) || !customer.IsMobileVerified)
            return new(false, 403, CustomerVerificationErrorCodes.MobileVerificationRequired, "Verify your mobile number before continuing.");
        if (string.IsNullOrWhiteSpace(customer.Email))
            return new(false, 403, CustomerVerificationErrorCodes.EmailAddressRequired, "Add an email address before continuing.");
        if (!customer.IsEmailVerified)
            return new(false, 403, CustomerVerificationErrorCodes.EmailVerificationRequired, "Verify your email address before continuing.");
        return new(true, 200, string.Empty, string.Empty);
    }

    private async Task<(Customer? Customer, ApiResponse<object>? Response)> GetCurrentCustomerAsync(CancellationToken cancellationToken)
    {
        var claims = claimsHelper.GetCustomer();
        if (!claims.Success || claims.Data is null)
            return (null, ApiResponse<object>.Fail(claims.Message, claims.StatusCode, claims.Errors));
        var customer = await db.Customers.SingleOrDefaultAsync(x => x.Id == claims.Data.CustomerId, cancellationToken);
        if (customer is null || !customer.IsActive || customer.IsBlocked || customer.IsDeleted ||
            claims.Data.TokenVersion != customer.TokenVersion.ToString())
            return (null, ApiResponse<object>.Fail("Invalid or expired customer session.", 401));
        return (customer, null);
    }

    private async Task<ApiResponse<VerificationChallengeResponse>?> CheckMobileRateLimitAsync(
        Customer customer, DateTime now, CancellationToken cancellationToken)
    {
        var last = await db.CustomerOtpChallenges.AsNoTracking()
            .Where(x => x.CustomerId == customer.Id && x.Purpose == CustomerOtpPurpose.ChangeMobileNumber)
            .OrderByDescending(x => x.CreatedOn).Select(x => (DateTime?)x.CreatedOn).FirstOrDefaultAsync(cancellationToken);
        if (last.HasValue && last.Value.AddSeconds(_settings.ResendCooldownSeconds) > now)
            return ApiResponse<VerificationChallengeResponse>.Fail("Please wait before requesting another code.", 429);
        var sent = await db.CustomerOtpChallenges.CountAsync(x => x.CustomerId == customer.Id &&
            x.Purpose == CustomerOtpPurpose.ChangeMobileNumber && x.CreatedOn > now.AddHours(-1), cancellationToken);
        return sent >= _settings.MaxSendsPerPhonePerHour
            ? ApiResponse<VerificationChallengeResponse>.Fail("Too many codes requested. Please try again later.", 429)
            : null;
    }

    private CustomerVerificationStatusResponse ToStatus(Customer customer)
    {
        var required = new List<string>();
        if (string.IsNullOrWhiteSpace(customer.MobileNumber) || !customer.IsMobileVerified)
            required.Add(CustomerVerificationErrorCodes.MobileVerificationRequired);
        if (string.IsNullOrWhiteSpace(customer.Email)) required.Add(CustomerVerificationErrorCodes.EmailAddressRequired);
        else if (!customer.IsEmailVerified) required.Add(CustomerVerificationErrorCodes.EmailVerificationRequired);
        return new(
            !string.IsNullOrWhiteSpace(customer.MobileNumber), customer.IsMobileVerified,
            MaskMobile(customer.MobileNumber), !string.IsNullOrWhiteSpace(customer.Email), customer.IsEmailVerified,
            MaskEmail(customer.Email), required.Count == 0, required);
    }

    private VerificationChallengeResponse Challenge(Guid id) =>
        new(id, _settings.ExpirationMinutes * 60, _settings.ResendCooldownSeconds);
    private string CreateCode() => RandomNumberGenerator.GetInt32(100_000, 1_000_000).ToString();
    private string HashCode(Guid challengeId, string destination, string code) =>
        HashValue($"{challengeId:N}:{destination}:{code}");
    private string HashValue(string value)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(_settings.HashPepper));
        return Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(value)));
    }
    private string ClientIp() => httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    private static bool FixedEquals(string left, string right) => CryptographicOperations.FixedTimeEquals(
        Convert.FromHexString(left), Convert.FromHexString(right));
    private static bool Valid(CustomerOtpChallenge? challenge) => challenge is not null && challenge.ConsumedOn is null &&
        challenge.VerifiedOn is null && challenge.ExpiresOn > DateTime.UtcNow && challenge.FailedAttempts < challenge.MaxAttempts;
    private static bool Valid(CustomerEmailVerificationChallenge? challenge) => challenge is not null && challenge.ConsumedOn is null &&
        challenge.VerifiedOn is null && challenge.ExpiresOn > DateTime.UtcNow && challenge.FailedAttempts < challenge.MaxAttempts;
    private static string? MaskMobile(string? value) => string.IsNullOrWhiteSpace(value) || value.Length < 4
        ? null : $"{value[..Math.Min(3, value.Length - 4)]}******{value[^4..]}";
    private static string? MaskEmail(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        var at = value.IndexOf('@');
        if (at <= 0) return null;
        return $"{value[0]}***{value[at..]}";
    }
    private static Dictionary<string, string[]> Code(string value) => new() { ["code"] = [value] };
    private static ApiResponse<T> Failure<T>(ApiResponse<object> response) => ApiResponse<T>.Fail(response.Message, response.StatusCode, response.Errors);
    private static ApiResponse<T> InvalidCode<T>() => ApiResponse<T>.Fail("The verification code is invalid or expired.", 400);
    private static ApiResponse<T> ValidationFailure<T>(ValidationResult validation) => ApiResponse<T>.Fail(
        "Please correct the highlighted fields.", 400,
        validation.Errors.GroupBy(x => x.PropertyName).ToDictionary(x => x.Key, x => x.Select(e => e.ErrorMessage).Distinct().ToArray()));
}
