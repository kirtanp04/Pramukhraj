using pramukhraj.DTOs.FAQ;
using pramukhraj.Validators.FAQ;
using static pramukhraj.Entities.FAQs.FAQsEnum;
using Xunit;

namespace pramukhraj.Tests;

public sealed class FaqWriteRequestValidatorTests
{
    private readonly FaqWriteRequestValidator _validator = new();

    [Fact]
    public void ValidFaq_Passes()
    {
        Assert.True(_validator.Validate(ValidRequest()).IsValid);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void BlankQuestion_Fails(string question)
    {
        var request = ValidRequest();
        request.Question = question;
        Assert.Contains(_validator.Validate(request).Errors, error => error.PropertyName == nameof(request.Question));
    }

    [Fact]
    public void BlankAnswer_Fails()
    {
        var request = ValidRequest();
        request.Answer = "  ";
        Assert.Contains(_validator.Validate(request).Errors, error => error.PropertyName == nameof(request.Answer));
    }

    [Fact]
    public void InvalidCategory_Fails()
    {
        var request = ValidRequest();
        request.Category = (FaqCategory)999;
        Assert.Contains(_validator.Validate(request).Errors, error => error.PropertyName == nameof(request.Category));
    }

    [Fact]
    public void NegativeDisplayOrder_Fails()
    {
        var request = ValidRequest();
        request.DisplayOrder = -1;
        Assert.Contains(_validator.Validate(request).Errors, error => error.PropertyName == nameof(request.DisplayOrder));
    }

    private static FaqWriteRequest ValidRequest() => new()
    {
        Category = FaqCategory.General,
        Question = "How long does delivery take?",
        Answer = "Most orders arrive within three to five business days.",
        DisplayOrder = 1,
        IsFeatured = true,
        IsActive = true
    };
}
