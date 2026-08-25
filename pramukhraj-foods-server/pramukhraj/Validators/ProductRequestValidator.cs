using FluentValidation;
using pramukhraj.DTOs.Product;
using static pramukhraj.DTOs.Product.ProductCategoryRequestResponse;

namespace pramukhraj.Validators
{

    public sealed class ProductRequestValidator : AbstractValidator<AddProductRequest>
    {
        public ProductRequestValidator()
        {
            RuleFor(x => x.CategoryId)
                .NotEmpty().WithMessage("Category is required");

            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Product name is required")
                .MaximumLength(200).WithMessage("Name is too long");

            RuleFor(x => x.ShortDescription)
                .MaximumLength(300).WithMessage("Short description must be under 300 characters");

            RuleFor(x => x.Brand)
                .NotEmpty().WithMessage("Brand is required");

            RuleFor(x => x.CountryOfOrigin)
                .NotEmpty().WithMessage("Country of origin is required");

            RuleFor(x => x.Images)
                .NotEmpty().WithMessage("At least one image is required")
                .Must(images => images != null && images.Count(i => i.IsPrimary) == 1)
                .WithMessage("Exactly one image must be set as primary")
                .Must(images => images.Length <= 2)
                .WithMessage("A maximum of 2 images is allowed.") ;

            RuleFor(x => x.Variants)
            .NotEmpty().WithMessage("At least one variant is required")
            .Must(variants => variants != null && variants.Length > 0)
            .WithMessage("At least one variant is required")
            .Must(variants => variants.Length <= 5)
            .WithMessage("A maximum of 5 variants is allowed.");


            RuleFor(x => x.Tags)
            .Must(tags => tags is null || tags.Length <= 7)
            .WithMessage("A maximum of 7 tags is allowed.");


            RuleForEach(x => x.Images).SetValidator(new ProductImageRequestValidator());

            RuleFor(x => x.Variants)
            .Cascade(CascadeMode.Stop)
            .NotNull()
            .WithMessage("Variants are required.")
            .NotEmpty()
            .WithMessage("At least one variant is required.")
            .Must(variants =>
                variants.Count(variant => variant.IsDefault) == 1)
            .WithMessage(
                "Exactly one variant must be set as the default variant.")
            .Must(HaveUniqueWeights)
            .WithMessage(
                "Each variant must have a unique weight.");

            RuleForEach(x => x.Variants)
                .SetValidator(new ProductVariantRequestValidator());

            RuleForEach(x => x.Tags).SetValidator(new ProductTagRequestValidator());
        }

        private static bool HaveUniqueWeights(IEnumerable<AddProductVariantRequest> variants)
        {
            return variants
                .GroupBy(variant => new
                {
                    variant.Weight,
                    Unit = variant.WeightUnit?.Trim().ToLowerInvariant()
                })
                .All(group => group.Count() == 1);
        }
    }

   
    public sealed class ProductImageRequestValidator : AbstractValidator<AddProductImageRequest>
    {
        public ProductImageRequestValidator()
        {
            RuleFor(x => x.ImageUrl)
                .NotEmpty().WithMessage("Image is required")
                .Must(url => !string.IsNullOrWhiteSpace(url) &&
                             (url.StartsWith("data:image/") ||
                              url.StartsWith("http://") ||
                              url.StartsWith("https://")))
                .WithMessage("Must be a valid image");

            RuleFor(x => x.DisplayOrder)
                .GreaterThanOrEqualTo(0).WithMessage("Display order cannot be negative");
        }
    }

    public sealed class ProductVariantRequestValidator: AbstractValidator<AddProductVariantRequest>
    {
        public ProductVariantRequestValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty()
                .WithMessage("Variant name is required.");

            RuleFor(x => x.Sku)
                .NotEmpty()
                .WithMessage("SKU is required.");

            RuleFor(x => x.Mrp)
                .GreaterThan(0)
                .WithMessage("MRP must be greater than 0.");

            RuleFor(x => x.Price)
                .GreaterThan(0)
                .WithMessage("Price must be greater than 0.")
                .LessThanOrEqualTo(x => x.Mrp)
                .WithMessage("Selling price must be less than or equal to MRP.");

            RuleFor(x => x.StockQuantity)
                .GreaterThanOrEqualTo(0)
                .WithMessage("Stock cannot be negative.");

            RuleFor(x => x.Weight)
                .GreaterThan(0)
                .WithMessage("Weight must be greater than 0.");

            RuleFor(x => x.WeightUnit)
                .NotEmpty()
                .WithMessage("Weight unit is required.");
        }
    }

    public sealed class ProductTagRequestValidator : AbstractValidator<AddProductTagRequest>
    {
        public ProductTagRequestValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Tag cannot be empty")
                .MaximumLength(50).WithMessage("Tag is too long");
        }
    }

    public sealed class ProductCategoryImageRequestValidator : AbstractValidator<GetProductCategoriesImagesRequest>
    {
        public ProductCategoryImageRequestValidator()
        {
            RuleFor(x => x.CategoryIds)
                .NotEmpty().WithMessage("Category IDs are required");
        }
    }

    public sealed class GetProductImageRequestValidator : AbstractValidator<GetProductImagesRequest>
    {
        public GetProductImageRequestValidator()
        {
            RuleFor(x => x.ProductIds)
                .NotEmpty().WithMessage("ProductIds IDs are required");
        }
    }

    public sealed class ProductCategoryRequestValidator : AbstractValidator<AddProductCategoryRequest>
    {
        public ProductCategoryRequestValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Category name is required")
                .MaximumLength(100).WithMessage("Category name is too long");

            RuleFor(x => x.Description)
                .MaximumLength(500).WithMessage("Description is too long");

            RuleFor(x => x.ImageUrl)
                .Must(url => string.IsNullOrWhiteSpace(url) ||
                             url.StartsWith("data:image/") ||
                             url.StartsWith("http://") ||
                             url.StartsWith("https://"))
                .WithMessage("Must be a valid image URL");

            RuleFor(x => x.DisplayOrder)
                .GreaterThanOrEqualTo(0).WithMessage("Display order cannot be negative");

            RuleFor(x => x.IsFeatured)
                .NotNull().WithMessage("IsFeatured must be specified");

            RuleFor(x => x.IsActive)
                .NotNull().WithMessage("IsActive must be specified");
        }
    }
}
               