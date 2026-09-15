using FluentValidation;
using pramukhraj.DTOs.Cart.Requests;

namespace pramukhraj.Validators.Cart;

public sealed class GuestCartItemRequestValidator : AbstractValidator<GuestCartItemRequest>
{
    public GuestCartItemRequestValidator()
    {
        RuleFor(x => x.ProductVariantId).NotEmpty();
        RuleFor(x => x.Quantity).InclusiveBetween(1, 20);
    }
}

public sealed class ResolveGuestCartRequestValidator : AbstractValidator<ResolveGuestCartRequest>
{
    public ResolveGuestCartRequestValidator()
    {
        RuleFor(x => x.Items).NotNull().Must(x => x.Count <= 50).WithMessage("A cart can contain at most 50 items.");
        RuleForEach(x => x.Items).SetValidator(new GuestCartItemRequestValidator());
        RuleFor(x => x.Items).Must(x => x.Select(i => i.ProductVariantId).Distinct().Count() == x.Count)
            .WithMessage("Duplicate product variants are not allowed.");
    }
}
