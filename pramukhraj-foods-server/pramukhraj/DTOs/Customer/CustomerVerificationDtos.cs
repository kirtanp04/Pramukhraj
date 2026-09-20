namespace pramukhraj.DTOs.Customer;

public static class CustomerVerificationErrorCodes
{
    public const string MobileVerificationRequired = "MOBILE_VERIFICATION_REQUIRED";
    public const string EmailAddressRequired = "EMAIL_ADDRESS_REQUIRED";
    public const string EmailVerificationRequired = "EMAIL_VERIFICATION_REQUIRED";
    public const string ContactVerificationRequired = "CONTACT_VERIFICATION_REQUIRED";
}

public sealed record CustomerVerificationStatusResponse(
    bool HasMobileNumber,
    bool IsMobileVerified,
    string? MaskedMobileNumber,
    bool HasEmailAddress,
    bool IsEmailVerified,
    string? MaskedEmailAddress,
    bool IsCheckoutEligible,
    IReadOnlyList<string> RequiredActions);

public sealed record VerificationChallengeResponse(Guid ChallengeId, int ExpiresInSeconds, int ResendAfterSeconds);
public sealed record VerifyContactCodeRequest(Guid ChallengeId, string Code);
public sealed record UpdateCustomerEmailRequest(string Email);
public sealed record CustomerAccessDecision(bool IsAllowed, int StatusCode, string ErrorCode, string Message);
