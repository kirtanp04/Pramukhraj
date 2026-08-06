using FluentValidation;
using pramukhraj.DTOs.Auth;

namespace pramukhraj.Validators
{
    public sealed class CustomerLoginValidator : AbstractValidator<CustomerLoginRequest>
    {
        public CustomerLoginValidator()
        {
            RuleFor(x => x.Email).NotEmpty().EmailAddress();
            RuleFor(x => x.Password).NotEmpty();
        }
    }
}
