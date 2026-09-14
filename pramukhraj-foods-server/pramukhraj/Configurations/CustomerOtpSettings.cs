namespace pramukhraj.Configurations;

public sealed class CustomerOtpSettings
{
    public const string SectionName = "CustomerOtp";

    public string HashPepper { get; set; } = string.Empty;
    public int CodeLength { get; set; } = 6;
    public int ExpirationMinutes { get; set; } = 5;
    public int ResendCooldownSeconds { get; set; } = 60;
    public int MaxAttempts { get; set; } = 5;
    public int MaxSendsPerPhonePerHour { get; set; } = 5;
    public int AccessTokenExpirationMinutes { get; set; } = 1440;
}
