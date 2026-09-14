using FluentValidation;
using static pramukhraj.DTOs.Product.CustomerProductListRequestResponse;

namespace pramukhraj.Validators;

public sealed class CustomerProductListRequestValidator : AbstractValidator<CustomerProductListRequest>
{
    public CustomerProductListRequestValidator()
    {
        RuleFor(request => request.CategoryId)
            .Must(categoryId => string.IsNullOrWhiteSpace(categoryId) || Guid.TryParse(categoryId, out _))
            .WithMessage("Category ID must be a valid identifier.");

        RuleFor(request => request.Search)
            .MaximumLength(MaximumSearchLength)
            .WithMessage($"Search cannot exceed {MaximumSearchLength} characters.");

        RuleFor(request => request.Page)
            .GreaterThanOrEqualTo(1)
            .WithMessage("Page must be at least 1.");

        RuleFor(request => request.PageSize)
            .InclusiveBetween(1, MaximumPageSize)
            .WithMessage($"Page size must be between 1 and {MaximumPageSize}.");

        RuleFor(request => request.MaxPrice)
            .InclusiveBetween(0m, MaximumPrice)
            .WithMessage($"Maximum price must be between 0 and {MaximumPrice:0}.");

        RuleFor(request => request.SortBy)
            .IsInEnum()
            .WithMessage("The selected sort option is invalid.");

        RuleFor(request => request.ProductStatus)
            .IsInEnum()
            .When(request => request.ProductStatus.HasValue)
            .WithMessage("The selected product status is invalid.");
    }
}
