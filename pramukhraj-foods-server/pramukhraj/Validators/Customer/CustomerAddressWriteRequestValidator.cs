using FluentValidation;
using pramukhraj.DTOs.Customer;

namespace pramukhraj.Validators.Customer;

public sealed class CustomerAddressWriteRequestValidator : AbstractValidator<CustomerAddressWriteRequest>
{
    private static readonly string[] AddressTypes = ["Home", "Work", "Other"];

    public CustomerAddressWriteRequestValidator()
    {
        RuleFor(x => x.RecipientName).NotEmpty().MaximumLength(120);
        RuleFor(x => x.MobileNumber).NotEmpty().Matches("^\\+91[6-9][0-9]{9}$")
            .WithMessage("Enter an Indian mobile number in +91XXXXXXXXXX format.");
        RuleFor(x => x.Email).MaximumLength(256).EmailAddress()
            .When(x => !string.IsNullOrWhiteSpace(x.Email));
        RuleFor(x => x.AddressLine1).NotEmpty().MaximumLength(250);
        RuleFor(x => x.AddressLine2).MaximumLength(250);
        RuleFor(x => x.Landmark).MaximumLength(150);
        RuleFor(x => x.City).NotEmpty().MaximumLength(100);
        RuleFor(x => x.State).NotEmpty().MaximumLength(100);
        RuleFor(x => x.PostalCode).NotEmpty().Matches("^[1-9][0-9]{5}$")
            .WithMessage("Enter a valid 6-digit Indian postal code.");
        RuleFor(x => x.Country).NotEmpty().Equal("India", StringComparer.OrdinalIgnoreCase)
            .WithMessage("Only Indian delivery addresses are supported.");
        RuleFor(x => x.AddressType).NotEmpty().Must(value =>
                AddressTypes.Contains(value?.Trim(), StringComparer.OrdinalIgnoreCase))
            .WithMessage("Address type must be Home, Work, or Other.");
        RuleFor(x => x.ConcurrencyStamp).Length(32).Matches("^[a-fA-F0-9]{32}$")
            .When(x => !string.IsNullOrWhiteSpace(x.ConcurrencyStamp));
    }
}
