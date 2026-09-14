using pramukhraj.Validators;
using static pramukhraj.DTOs.Product.CustomerProductListRequestResponse;
using Xunit;

namespace pramukhraj.Tests;

public sealed class CustomerProductListRequestValidatorTests
{
    private readonly CustomerProductListRequestValidator _validator = new();

    [Fact]
    public void DefaultRequest_Passes()
    {
        Assert.True(_validator.Validate(new CustomerProductListRequest()).IsValid);
    }

    [Fact]
    public void RequestOutsideAllowedBounds_Fails()
    {
        var request = new CustomerProductListRequest
        {
            CategoryId = "not-a-guid",
            Search = new string('a', MaximumSearchLength + 1),
            Page = 0,
            PageSize = MaximumPageSize + 1,
            MaxPrice = MaximumPrice + 1,
            SortBy = (FilterSortBy)999,
            ProductStatus = (FilterProductStatus)999
        };

        var result = _validator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, error => error.PropertyName == nameof(request.CategoryId));
        Assert.Contains(result.Errors, error => error.PropertyName == nameof(request.Search));
        Assert.Contains(result.Errors, error => error.PropertyName == nameof(request.Page));
        Assert.Contains(result.Errors, error => error.PropertyName == nameof(request.PageSize));
        Assert.Contains(result.Errors, error => error.PropertyName == nameof(request.MaxPrice));
        Assert.Contains(result.Errors, error => error.PropertyName == nameof(request.SortBy));
        Assert.Contains(result.Errors, error => error.PropertyName == nameof(request.ProductStatus));
    }
}
