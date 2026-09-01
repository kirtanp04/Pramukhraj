using pramukhraj.DTOs.Product;
using pramukhraj.Validators;
using Xunit;
using static pramukhraj.DTOs.Product.ProductCategoryRequestResponse;
using static pramukhraj.DTOs.Product.ProductInventoryRequestResponse;

namespace pramukhraj.Tests;

public sealed class ProductRequestValidatorTests
{
    private readonly ProductRequestValidator _productValidator = new();
    private readonly ProductCategoryRequestValidator _categoryValidator = new();

    [Fact]
    public void ValidProduct_Passes()
    {
        Assert.True(_productValidator.Validate(ValidProduct()).IsValid);
    }

    [Fact]
    public void ProductWithoutCategory_Fails()
    {
        var request = ValidProduct();
        request.CategoryId = string.Empty;
        Assert.Contains(_productValidator.Validate(request).Errors, error => error.PropertyName == nameof(request.CategoryId));
    }

    [Fact]
    public void ProductWithoutPrimaryImage_Fails()
    {
        var request = ValidProduct();
        request.Images[0].IsPrimary = false;
        Assert.False(_productValidator.Validate(request).IsValid);
    }

    [Fact]
    public void ProductWithMultipleDefaultVariants_Fails()
    {
        var request = ValidProduct();
        request.Variants = [request.Variants[0], new AddProductVariantRequest
        {
            Name = "Large", Sku = "TEST-L", Mrp = 200, Price = 180, StockQuantity = 5,
            Weight = 1, WeightUnit = "kg", IsDefault = true, IsActive = true
        }];
        Assert.False(_productValidator.Validate(request).IsValid);
    }

    [Fact]
    public void ProductWithDuplicateVariantWeight_Fails()
    {
        var request = ValidProduct();
        request.Variants = [request.Variants[0], new AddProductVariantRequest
        {
            Name = "Another", Sku = "TEST-2", Mrp = 120, Price = 100, StockQuantity = 5,
            Weight = 500, WeightUnit = "G", IsDefault = false, IsActive = true
        }];
        Assert.False(_productValidator.Validate(request).IsValid);
    }

    [Fact]
    public void VariantPriceAboveMrp_Fails()
    {
        var request = ValidProduct();
        request.Variants[0].Price = request.Variants[0].Mrp + 1;
        Assert.False(_productValidator.Validate(request).IsValid);
    }

    [Fact]
    public void ValidCategory_Passes()
    {
        Assert.True(_categoryValidator.Validate(new AddProductCategoryRequest
        {
            Name = "Snacks", Description = "Traditional snacks", ImageUrl = "https://example.com/snacks.webp",
            DisplayOrder = 1, IsActive = true
        }).IsValid);
    }

    [Fact]
    public void CategoryWithInvalidImage_Fails()
    {
        var result = _categoryValidator.Validate(new AddProductCategoryRequest { Name = "Snacks", ImageUrl = "file://snacks.webp" });
        Assert.False(result.IsValid);
    }

    [Fact]
    public void EmptyCategoryImageRequest_Fails()
    {
        Assert.False(new ProductCategoryImageRequestValidator()
            .Validate(new GetProductCategoriesImagesRequest()).IsValid);
    }

    [Fact]
    public void EmptyProductImageRequest_Fails()
    {
        Assert.False(new GetProductImageRequestValidator()
            .Validate(new GetProductImagesRequest()).IsValid);
    }

    [Fact]
    public void NegativeInventory_Fails()
    {
        var result = new UpdateProductVariantInventoryRequestValidator().Validate(new UpdateProductVariantInventoryRequest
        {
            ProductId = Guid.NewGuid(), VariantId = Guid.NewGuid(), Stock = -1
        });
        Assert.False(result.IsValid);
    }

    private static AddProductRequest ValidProduct() => new()
    {
        CategoryId = Guid.NewGuid().ToString(),
        Name = "Test snack",
        ShortDescription = "A test snack",
        Brand = "Pramukhraj",
        CountryOfOrigin = "India",
        Images = [new AddProductImageRequest
        {
            ImageUrl = "https://example.com/snack.webp", IsPrimary = true, DisplayOrder = 0
        }],
        Variants = [new AddProductVariantRequest
        {
            Name = "Regular", Sku = "TEST-R", Mrp = 120, Price = 100, StockQuantity = 10,
            Weight = 500, WeightUnit = "g", IsDefault = true, IsActive = true
        }],
        Tags = []
    };
}
