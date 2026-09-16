using System.Net;
using FluentValidation;
using pramukhraj.DTOs.ProviderCredentials;

namespace pramukhraj.Validators.ProviderCredentials;

public sealed class SmtpProviderCredentialsValidator : AbstractValidator<SmtpProviderCredentials>
{
    public SmtpProviderCredentialsValidator()
    {
        RuleFor(settings => settings.Host)
            .NotEmpty().WithMessage("SMTP host is required.")
            .MaximumLength(253).WithMessage("SMTP host cannot exceed 253 characters.")
            .Must(BeValidHost).WithMessage("A valid SMTP host is required.");
        RuleFor(settings => settings.Port)
            .InclusiveBetween(1, 65535).WithMessage("SMTP port must be between 1 and 65535.");
        RuleFor(settings => settings.SenderName)
            .NotEmpty().WithMessage("SMTP sender name is required.")
            .MaximumLength(120).WithMessage("SMTP sender name cannot exceed 120 characters.");
        RuleFor(settings => settings.SenderEmail)
            .NotEmpty().WithMessage("SMTP sender email is required.")
            .EmailAddress().WithMessage("A valid SMTP sender email is required.")
            .MaximumLength(256);
        RuleFor(settings => settings.Username)
            .NotEmpty().WithMessage("SMTP username is required.")
            .EmailAddress().WithMessage("A valid SMTP username is required.")
            .MaximumLength(256);
        RuleFor(settings => settings.Password)
            .NotEmpty().WithMessage("SMTP password is required.")
            .MaximumLength(500).WithMessage("SMTP password cannot exceed 500 characters.");
    }

    private static bool BeValidHost(string host) =>
        !string.IsNullOrWhiteSpace(host) &&
        (Uri.CheckHostName(host.Trim()) == UriHostNameType.Dns || IPAddress.TryParse(host.Trim(), out _));
}
