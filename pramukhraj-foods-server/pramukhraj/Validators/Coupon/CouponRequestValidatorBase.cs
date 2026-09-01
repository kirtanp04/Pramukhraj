using FluentValidation;
using pramukhraj.DTOs.Coupon;
using static pramukhraj.Entities.Coupon.CouponEnums;

namespace pramukhraj.Validators.Coupon;

public abstract class CouponRequestValidatorBase<T> : AbstractValidator<T>
    where T : CouponWriteRequest
{
    protected CouponRequestValidatorBase()
    {
        RuleFor(request => request.Code)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Coupon code is required.")
            .Must(code => code == code.Trim()).WithMessage("Coupon code must not contain leading or trailing spaces.")
            .Length(3, 50).WithMessage("Coupon code must be between 3 and 50 characters.")
            .Matches("^[A-Za-z0-9_-]+$").WithMessage("Coupon code may contain only letters, numbers, hyphens and underscores.");

        RuleFor(request => request.Name)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Coupon name is required.")
            .Must(name => name == name.Trim()).WithMessage("Coupon name must not contain leading or trailing spaces.")
            .MaximumLength(150).WithMessage("Coupon name cannot exceed 150 characters.");

        RuleFor(request => request.Description)
            .MaximumLength(1000).WithMessage("Coupon description cannot exceed 1,000 characters.");

        RuleFor(request => request.DiscountType).IsInEnum();
        RuleFor(request => request.ApplicationScope).IsInEnum();

        When(request => request.DiscountType == CouponDiscountType.Percentage, () =>
        {
            RuleFor(request => request.DiscountValue)
                .GreaterThan(0).WithMessage("Percentage discount must be greater than 0.")
                .LessThanOrEqualTo(100).WithMessage("Percentage discount cannot exceed 100.");
            RuleFor(request => request.MaximumDiscountAmount)
                .GreaterThan(0).When(request => request.MaximumDiscountAmount.HasValue)
                .WithMessage("Maximum discount amount must be greater than 0.");
        });

        When(request => request.DiscountType == CouponDiscountType.FlatAmount, () =>
        {
            RuleFor(request => request.DiscountValue)
                .GreaterThan(0).WithMessage("Flat discount amount must be greater than 0.");
            RuleFor(request => request.MaximumDiscountAmount)
                .Null().WithMessage("Maximum discount amount is available only for percentage coupons.");
        });

        When(request => request.DiscountType == CouponDiscountType.FreeShipping, () =>
        {
            RuleFor(request => request.DiscountValue)
                .Equal(0).WithMessage("Discount value must be 0 for free-shipping coupons.");
            RuleFor(request => request.MaximumDiscountAmount)
                .Null().WithMessage("Maximum discount amount is available only for percentage coupons.");
        });

        RuleFor(request => request.MinimumOrderAmount)
            .GreaterThanOrEqualTo(0).WithMessage("Minimum order amount cannot be negative.");

        RuleFor(request => request.TotalUsageLimit)
            .GreaterThan(0).When(request => request.TotalUsageLimit.HasValue)
            .WithMessage("Total usage limit must be greater than 0.");

        RuleFor(request => request.PerCustomerUsageLimit)
            .GreaterThan(0).When(request => request.PerCustomerUsageLimit.HasValue)
            .WithMessage("Per-customer usage limit must be greater than 0.");

        RuleFor(request => request.PerCustomerUsageLimit)
            .LessThanOrEqualTo(request => request.TotalUsageLimit!.Value)
            .When(request => request.PerCustomerUsageLimit.HasValue && request.TotalUsageLimit.HasValue)
            .WithMessage("Per-customer usage limit cannot exceed the total usage limit.");

        RuleFor(request => request.StartOn)
            .NotEmpty().WithMessage("Coupon start date is required.");

        RuleFor(request => request.EndOn)
            .NotEmpty().WithMessage("Coupon end date is required.")
            .GreaterThan(request => request.StartOn).WithMessage("Coupon end date must be after its start date.");

        RuleFor(request => request.ProductIds)
            .NotNull().WithMessage("Product selections are required.")
            .Must(HaveNoEmptyIds).WithMessage("Product selections contain an invalid ID.")
            .Must(HaveUniqueIds).WithMessage("Duplicate products are not allowed.");

        RuleFor(request => request.CategoryIds)
            .NotNull().WithMessage("Category selections are required.")
            .Must(HaveNoEmptyIds).WithMessage("Category selections contain an invalid ID.")
            .Must(HaveUniqueIds).WithMessage("Duplicate categories are not allowed.");

        When(request => request.ApplicationScope == CouponApplicationScope.AllProducts, () =>
        {
            RuleFor(request => request.ProductIds).Empty().WithMessage("Products cannot be selected for an all-products coupon.");
            RuleFor(request => request.CategoryIds).Empty().WithMessage("Categories cannot be selected for an all-products coupon.");
        });

        When(request => request.ApplicationScope == CouponApplicationScope.SpecificProducts, () =>
        {
            RuleFor(request => request.ProductIds).NotEmpty().WithMessage("Select at least one product.");
            RuleFor(request => request.CategoryIds).Empty().WithMessage("Categories cannot be selected for a product-scoped coupon.");
        });

        When(request => request.ApplicationScope == CouponApplicationScope.SpecificCategories, () =>
        {
            RuleFor(request => request.CategoryIds).NotEmpty().WithMessage("Select at least one category.");
            RuleFor(request => request.ProductIds).Empty().WithMessage("Products cannot be selected for a category-scoped coupon.");
        });
    }

    private static bool HaveNoEmptyIds(IEnumerable<Guid> ids) => ids.All(id => id != Guid.Empty);
    private static bool HaveUniqueIds(IEnumerable<Guid> ids) => ids.Distinct().Count() == ids.Count();
}
