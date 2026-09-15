using FluentValidation;
using pramukhraj.DTOs.Cart.Requests;

namespace pramukhraj.Validators.Cart;

public sealed class UpdateCartItemSelectionRequestValidator : AbstractValidator<UpdateCartItemSelectionRequest>
{
    public UpdateCartItemSelectionRequestValidator() => RuleFor(x => x.CartVersion).GreaterThan(0);
}
