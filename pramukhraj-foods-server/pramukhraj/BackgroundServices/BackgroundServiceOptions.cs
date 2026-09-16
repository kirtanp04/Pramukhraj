using Microsoft.Extensions.Options;

namespace pramukhraj.BackgroundServices;

public sealed class BackgroundServiceOptions
{
    public const string SectionName = "BackgroundServices";

    public bool Enabled { get; set; } = true;
    public int InitialDelaySeconds { get; set; } = 30;
    public int ExecutionIntervalMinutes { get; set; } = 60;
    public int CartExpirationDays { get; set; } = 30;
}

public sealed class BackgroundServiceOptionsValidator : IValidateOptions<BackgroundServiceOptions>
{
    public ValidateOptionsResult Validate(string? name, BackgroundServiceOptions options)
    {
        var failures = new List<string>();

        if (options.InitialDelaySeconds is < 0 or > 3600)
            failures.Add("BackgroundServices:InitialDelaySeconds must be between 0 and 3600.");
        if (options.ExecutionIntervalMinutes is < 1 or > 1440)
            failures.Add("BackgroundServices:ExecutionIntervalMinutes must be between 1 and 1440.");
        if (options.CartExpirationDays is < 1 or > 365)
            failures.Add("BackgroundServices:CartExpirationDays must be between 1 and 365.");

        return failures.Count == 0
            ? ValidateOptionsResult.Success
            : ValidateOptionsResult.Fail(failures);
    }
}
