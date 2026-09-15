using FluentValidation;
using pramukhraj.DTOs.Cart.Requests;

namespace pramukhraj.Validators.Cart;

public sealed class UpdateCartItemQuantityRequestValidator : AbstractValidator<UpdateCartItemQuantityRequest>
{
    public UpdateCartItemQuantityRequestValidator()
    {
        RuleFor(x => x.Quantity).InclusiveBetween(1, 20);
        RuleFor(x => x.CartVersion).GreaterThan(0);
    }
}
