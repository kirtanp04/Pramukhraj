using FluentValidation;
using pramukhraj.DTOs.Customer;

namespace pramukhraj.Validators.Customer;

public sealed class VerifyContactCodeRequestValidator : AbstractValidator<VerifyContactCodeRequest>
{
    public VerifyContactCodeRequestValidator()
    {
        RuleFor(x => x.ChallengeId).NotEmpty();
        RuleFor(x => x.Code).NotEmpty().Matches("^[0-9]{6}$")
            .WithMessage("Enter the 6-digit verification code.");
    }
}

public sealed class UpdateCustomerEmailRequestValidator : AbstractValidator<UpdateCustomerEmailRequest>
{
    public UpdateCustomerEmailRequestValidator() => RuleFor(x => x.Email)
        .Cascade(CascadeMode.Stop)
        .NotEmpty()
        .MaximumLength(256)
        .EmailAddress()
        .WithMessage("Enter a valid email address.");
}
