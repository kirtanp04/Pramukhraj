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
        RuleFor(x => x.StoreAddress).NotEmpty().MaximumLength(1000);
        RuleFor(x => x.TaxRatePercent).Equal(0m)
            .WithMessage("As an unregistered business without a GSTIN, Tax Rate must be 0%. All prices must be all-inclusive (CGST Act Section 32).");
        RuleFor(x => x.PaymentServiceTaxRatePercent).InclusiveBetween(0m, 10m)
            .WithMessage("Payment processing fee must be between 0% and 10%.");
        RuleFor(x => x.FreeShippingMinimumAmount).InclusiveBetween(0m, 10_000_000m)
            .WithMessage("Free shipping minimum must be between 0 and 10,000,000.");
        RuleFor(x => x.ReturnWindowDays).InclusiveBetween(0, 365)
            .WithMessage("Return window must be between 0 and 365 days (0 means returns are not accepted).");
        RuleFor(x => x.ConcurrencyStamp).MaximumLength(64);
    }
}
