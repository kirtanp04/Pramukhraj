using pramukhraj.DTOs.HomepageCms;
using pramukhraj.Validators.HomepageCms;
using Xunit;

namespace pramukhraj.Tests;

public sealed class HomepageCmsWriteRequestValidatorTests
{
    private readonly HomepageCmsWriteRequestValidator _validator = new();

    [Fact]
    public void ValidDefaultsWithoutCustomImage_Pass()
    {
        Assert.True(_validator.Validate(ValidRequest()).IsValid);
    }

    [Theory]
    [InlineData(nameof(HomepageCmsWriteRequest.EyebrowBadge))]
    [InlineData(nameof(HomepageCmsWriteRequest.Headline))]
    [InlineData(nameof(HomepageCmsWriteRequest.Subtext))]
    [InlineData(nameof(HomepageCmsWriteRequest.HeroImageAltText))]
    public void RequiredTextField_WhenBlank_Fails(string field)
    {
        var request = ValidRequest();
        typeof(HomepageCmsWriteRequest).GetProperty(field)!.SetValue(request, "   ");

        Assert.Contains(_validator.Validate(request).Errors, error => error.PropertyName == field);
    }

    [Fact]
    public void UnsupportedImageType_Fails()
    {
        var request = ValidRequest();
        request.HeroImageBase64 = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yw=";

        Assert.Contains(
            _validator.Validate(request).Errors,
            error => error.PropertyName == nameof(request.HeroImageBase64));
    }

    [Fact]
    public void ImageWhoseBytesDoNotMatchMimeType_Fails()
    {
        var request = ValidRequest();
        request.HeroImageBase64 = "data:image/png;base64,SGVsbG8=";

        Assert.Contains(
            _validator.Validate(request).Errors,
            error => error.PropertyName == nameof(request.HeroImageBase64));
    }

    [Fact]
    public void PngDataUri_Passes()
    {
        var request = ValidRequest();
        request.HeroImageBase64 = "data:image/png;base64,iVBORw0KGgo=";

        Assert.True(_validator.Validate(request).IsValid);
    }

    [Theory]
    [InlineData(nameof(HomepageCmsWriteRequest.HappyCustomersLabel))]
    [InlineData(nameof(HomepageCmsWriteRequest.ProductCountLabel))]
    [InlineData(nameof(HomepageCmsWriteRequest.AverageRatingLabel))]
    public void StatisticLabel_WhenLongerThanSixtyCharacters_Fails(string field)
    {
        var request = ValidRequest();
        typeof(HomepageCmsWriteRequest).GetProperty(field)!.SetValue(request, new string('x', 61));

        Assert.Contains(_validator.Validate(request).Errors, error => error.PropertyName == field);
    }

    private static HomepageCmsWriteRequest ValidRequest() => new();
}
