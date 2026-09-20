using FluentValidation;
using pramukhraj.DTOs.Checkout;

namespace pramukhraj.Validators.Checkout;

public sealed class InitializeCheckoutRequestValidator : AbstractValidator<InitializeCheckoutRequest>
{
    public InitializeCheckoutRequestValidator()
    {
        RuleFor(x => x.ShippingAddressId).NotEqual(Guid.Empty).When(x => x.ShippingAddressId.HasValue);
        RuleFor(x => x.BillingAddressId).NotEqual(Guid.Empty).When(x => x.BillingAddressId.HasValue);
    }
}

public sealed class UpdateCheckoutAddressRequestValidator : AbstractValidator<UpdateCheckoutAddressRequest>
{
    public UpdateCheckoutAddressRequestValidator()
    {
        RuleFor(x => x.ShippingAddressId).NotEqual(Guid.Empty).When(x => x.ShippingAddressId.HasValue);
        RuleFor(x => x.BillingAddressId).NotEqual(Guid.Empty).When(x => x.BillingAddressId.HasValue);
    }
}

public sealed class ApplyCheckoutCouponRequestValidator : AbstractValidator<ApplyCheckoutCouponRequest>
{
    public ApplyCheckoutCouponRequestValidator() => RuleFor(x => x.CouponCode)
        .Cascade(CascadeMode.Stop).NotEmpty().MaximumLength(50).Matches("^[A-Za-z0-9_-]+$")
        .WithMessage("Enter a valid coupon code.");
}
