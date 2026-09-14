using FluentValidation;
using pramukhraj.DTOs.Auth;

namespace pramukhraj.Validators;

internal static class CustomerAuthValidationRules
{
    public const string E164Pattern = @"^\+[1-9]\d{7,14}$";
}

public sealed class SendCustomerOtpRequestValidator : AbstractValidator<SendCustomerOtpRequest>
{
    public SendCustomerOtpRequestValidator() => RuleFor(x => x.MobileNumber)
        .NotEmpty().Matches(CustomerAuthValidationRules.E164Pattern)
        .WithMessage("Mobile number must use E.164 format, for example +919876543210.");
}

public sealed class VerifyCustomerOtpRequestValidator : AbstractValidator<VerifyCustomerOtpRequest>
{
    public VerifyCustomerOtpRequestValidator()
    {
        RuleFor(x => x.ChallengeId).NotEmpty();
        RuleFor(x => x.MobileNumber).NotEmpty().Matches(CustomerAuthValidationRules.E164Pattern);
        RuleFor(x => x.Code).NotEmpty().Matches(@"^\d{6}$");
        RuleFor(x => x.DeviceName).MaximumLength(200);
    }
}

public sealed class CompleteCustomerProfileRequestValidator : AbstractValidator<CompleteCustomerProfileRequest>
{
    public CompleteCustomerProfileRequestValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(120);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(x => x.City).MaximumLength(100);
        RuleFor(x => x.State).MaximumLength(100);
        RuleFor(x => x.PostalCode).Matches(@"^[A-Za-z0-9 -]{3,10}$")
            .When(x => !string.IsNullOrWhiteSpace(x.PostalCode));
    }
}
