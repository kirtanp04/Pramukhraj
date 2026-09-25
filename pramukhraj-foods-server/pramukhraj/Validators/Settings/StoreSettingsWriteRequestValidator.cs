using FluentValidation;
using pramukhraj.DTOs.Settings;

namespace pramukhraj.Validators.Settings;

public sealed class StoreSettingsWriteRequestValidator : AbstractValidator<StoreSettingsWriteRequest>
{
    public StoreSettingsWriteRequestValidator()
    {
        RuleFor(x => x.StoreName).NotEmpty().MaximumLength(150);
        RuleFor(x => x.SupportEmail).NotEmpty().MaximumLength(254).EmailAddress();
        RuleFor(x => x.SupportPhoneNumber)
            .NotEmpty().MaximumLength(20)
            .Matches(@"^\+?[1-9]\d{7,14}$")
            .WithMessage("Support phone number must be a valid international number, for example +919876543210.");
        RuleFor(x => x.StoreAddressLine1)
            .NotEmpty().WithMessage("Store address line 1 (street/building/plot) is required.")
            .MaximumLength(250);
        RuleFor(x => x.StoreAddressLine2)
            .MaximumLength(250);
        RuleFor(x => x.StoreCity)
            .NotEmpty().WithMessage("Store city is required.")
            .MaximumLength(100);
        RuleFor(x => x.StoreState)
            .NotEmpty().WithMessage("Store state is required.")
            .MaximumLength(100);
        RuleFor(x => x.StorePostalCode)
            .NotEmpty().WithMessage("Store PIN / postal code is required.")
            .Matches(@"^\d{6}$")
            .WithMessage("Store PIN code must be a valid 6-digit Indian postal code.");
        RuleFor(x => x.StoreCountry)
            .NotEmpty().WithMessage("Store country is required.")
            .MaximumLength(100);
        RuleFor(x => x.StoreAddress)
            .MaximumLength(1000);
        RuleFor(x => x.TaxRatePercent).Equal(0m)
            .WithMessage("As an unregistered business without a GSTIN, Tax Rate must be 0%. All prices must be all-inclusive (CGST Act Section 32).");
        RuleFor(x => x.PaymentProcessingFee ?? x.PaymentServiceTaxRatePercent ?? 0m)
            .InclusiveBetween(0m, 10_000m)
            .WithMessage("Payment processing fee must be between ₹0 and ₹10,000.");
        RuleFor(x => x.FreeShippingMinimumAmount).InclusiveBetween(0m, 10_000_000m)
            .WithMessage("Free shipping minimum must be between 0 and 10,000,000.");
        RuleFor(x => x.ReturnWindowDays).InclusiveBetween(0, 365)
            .WithMessage("Return window must be between 0 and 365 days (0 means returns are not accepted).");
        RuleFor(x => x.ConcurrencyStamp).MaximumLength(64);
    }
}
