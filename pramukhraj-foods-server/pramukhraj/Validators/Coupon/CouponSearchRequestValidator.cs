using FluentValidation;
using pramukhraj.DTOs.Coupon;

namespace pramukhraj.Validators.Coupon;

public sealed class CouponSearchRequestValidator : AbstractValidator<CouponSearchRequest>
{
    private static readonly string[] AllowedSortFields = ["UpdatedOn", "CreatedOn", "Code", "Name", "StartOn", "EndOn"];

    public CouponSearchRequestValidator()
    {
        RuleFor(request => request.PageNumber).GreaterThan(0);
        RuleFor(request => request.PageSize).Equal(20).WithMessage("Coupon pages contain 20 records.");
        RuleFor(request => request.Search).MaximumLength(150);
        RuleFor(request => request.DiscountType).IsInEnum().When(request => request.DiscountType.HasValue);
        RuleFor(request => request.ApplicationScope).IsInEnum().When(request => request.ApplicationScope.HasValue);
        RuleFor(request => request.Status).IsInEnum().When(request => request.Status.HasValue);
        RuleFor(request => request.SortBy)
            .Must(value => AllowedSortFields.Contains(value, StringComparer.OrdinalIgnoreCase))
            .WithMessage("The requested coupon sort field is not supported.");
        RuleFor(request => request.EndsOnOrBefore)
            .GreaterThanOrEqualTo(request => request.StartsOnOrAfter)
            .When(request => request.StartsOnOrAfter.HasValue && request.EndsOnOrBefore.HasValue)
            .WithMessage("The end-date filter must not be before the start-date filter.");
    }
}
