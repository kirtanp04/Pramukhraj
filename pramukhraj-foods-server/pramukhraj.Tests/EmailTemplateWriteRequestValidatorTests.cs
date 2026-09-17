using FluentValidation.TestHelper;
using pramukhraj.DTOs.EmailTemplates;
using pramukhraj.Entities.EmailTemplates;
using pramukhraj.Validators.EmailTemplates;
using Xunit;

namespace pramukhraj.Tests;

public sealed class EmailTemplateWriteRequestValidatorTests
{
    [Fact]
    public void Accepts_valid_Unlayer_template()
    {
        new EmailTemplateWriteRequestValidator().TestValidate(Valid()).ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData("<script>alert(1)</script>")]
    [InlineData("<a href=\"javascript:alert(1)\">Open</a>")]
    [InlineData("<img src=\"x\" onerror=\"alert(1)\">")]
    public void Rejects_unsafe_html(string html)
    {
        var request = Valid();
        request.HtmlContent = html;
        new EmailTemplateWriteRequestValidator().TestValidate(request)
            .ShouldHaveValidationErrorFor(item => item.HtmlContent);
    }

    [Fact]
    public void Rejects_invalid_attachment_definition()
    {
        var request = Valid();
        request.Attachments.Add(new EmailTemplateAttachmentDefinition
        {
            Name = "Invoice.pdf", ContentType = "invalid", SourceVariable = "Invoice File"
        });
        new EmailTemplateWriteRequestValidator().TestValidate(request).ShouldHaveAnyValidationError();
    }

    private static EmailTemplateWriteRequest Valid() => new()
    {
        Key = "WELCOME", Name = "Welcome Email", Category = EmailTemplateCategory.Account,
        Subject = "Welcome {{customer_name}}", DesignJson = "{\"body\":{},\"counters\":{}}",
        HtmlContent = "<html><body><h1>Welcome {{customer_name}}</h1></body></html>",
        Variables = ["customer_name"], IsActive = true
    };
}
