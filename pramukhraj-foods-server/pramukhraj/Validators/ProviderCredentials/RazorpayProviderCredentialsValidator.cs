using FluentValidation;
using pramukhraj.DTOs.ProviderCredentials;

namespace pramukhraj.Validators.ProviderCredentials;

public sealed class RazorpayProviderCredentialsValidator : AbstractValidator<RazorpayProviderCredentials>
{
    public RazorpayProviderCredentialsValidator()
    {
        RuleFor(x => x.ApiKey).NotEmpty().MaximumLength(500);
        RuleFor(x => x.KeySecret).NotEmpty().MaximumLength(500);
        RuleFor(x => x.WebhookSecret).NotEmpty().MaximumLength(500);
        RuleFor(x => x).Must(x => x.IsUpiPaymentEnabled || x.IsCardPaymentEnabled)
            .WithMessage("Enable at least one payment method: UPI or card.");
    }
}
