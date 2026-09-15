using FluentValidation;
using pramukhraj.DTOs.Cart.Requests;

namespace pramukhraj.Validators.Cart;

public sealed class ChangeCartItemVariantRequestValidator : AbstractValidator<ChangeCartItemVariantRequest>
{
    public ChangeCartItemVariantRequestValidator()
    {
        RuleFor(x => x.ProductVariantId).NotEmpty();
        RuleFor(x => x.CartVersion).GreaterThan(0);
    }
}
