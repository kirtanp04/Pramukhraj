namespace pramukhraj.DTOs.Auth;

public sealed record SendCustomerOtpRequest(string MobileNumber);

public sealed record VerifyCustomerOtpRequest(
    Guid ChallengeId,
    string MobileNumber,
    string Code,
    string? DeviceName);

public sealed record CompleteCustomerProfileRequest(
    string FullName,
    string? Email,
    string? City,
    string? State,
    string? PostalCode,
    bool MarketingConsent);

public sealed record SendCustomerOtpResponse(
    Guid ChallengeId,
    int ExpiresInSeconds,
    int ResendAfterSeconds);

public sealed record CustomerAuthResponse(
    string AccessToken,
    int ExpiresInSeconds,
    bool IsNewCustomer,
    CustomerResponse Customer);
