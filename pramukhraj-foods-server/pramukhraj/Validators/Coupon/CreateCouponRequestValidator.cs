using FluentValidation;
using pramukhraj.DTOs.Coupon;

namespace pramukhraj.Validators.Coupon;

public sealed class CreateCouponRequestValidator : CouponRequestValidatorBase<CreateCouponRequest>
{
    private static readonly TimeSpan ImmediateStartTolerance = TimeSpan.FromMinutes(2);

    public CreateCouponRequestValidator()
    {
        RuleFor(request => request.EndOn)
            .Must(endOn => endOn.ToUniversalTime() > DateTime.UtcNow.Subtract(ImmediateStartTolerance))
            .WithMessage("An already-expired coupon cannot be created.");
    }
}
