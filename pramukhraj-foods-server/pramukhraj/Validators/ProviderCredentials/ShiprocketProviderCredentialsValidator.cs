using FluentValidation;
using pramukhraj.DTOs.ProviderCredentials;

namespace pramukhraj.Validators.ProviderCredentials;

public sealed class ShiprocketProviderCredentialsValidator : AbstractValidator<ShiprocketProviderCredentials>
{
    public ShiprocketProviderCredentialsValidator()
    {
        RuleFor(x => x.Email).Cascade(CascadeMode.Stop).NotEmpty().MaximumLength(256).EmailAddress();
        RuleFor(x => x.Password).NotEmpty().MaximumLength(512);
        RuleFor(x => x.WebhookSecret).NotEmpty().MinimumLength(16).MaximumLength(512);
        RuleFor(x => x.PickupPostalCode).NotEmpty().Matches("^[1-9][0-9]{5}$")
            .WithMessage("Enter a valid 6-digit Indian pickup PIN code.");
        RuleFor(x => x.PickupLocation).MaximumLength(100);
        RuleFor(x => x.MinimumChargeableWeightKg).InclusiveBetween(0.1m, 100m)
            .WithMessage("Minimum chargeable weight must be between 0.1 kg and 100 kg.");
    }
}
