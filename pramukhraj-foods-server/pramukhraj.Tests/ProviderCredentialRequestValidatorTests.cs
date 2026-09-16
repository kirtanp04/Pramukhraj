using System.Text.Json;
using pramukhraj.DTOs.ProviderCredentials;
using pramukhraj.Validators.ProviderCredentials;
using FluentValidation.TestHelper;
using Xunit;

namespace pramukhraj.Tests;

public sealed class ProviderCredentialRequestValidatorTests
{
    [Fact]
    public async Task Create_accepts_valid_provider_credentials()
    {
        var request = new CreateProviderCredentialRequest
        {
            ProviderKey = "twilio_sms",
            Credentials = Json("""{"accountSid":"sid","authToken":"secret"}""")
        };

        var result = await new CreateProviderCredentialRequestValidator().ValidateAsync(request);

        Assert.True(result.IsValid);
    }

    [Theory]
    [InlineData("")]
    [InlineData("1TWILIO")]
    [InlineData("TWILIO SMS")]
    [InlineData("TWILIO/SMS")]
    public async Task Create_rejects_invalid_provider_key(string providerKey)
    {
        var request = new CreateProviderCredentialRequest
        {
            ProviderKey = providerKey,
            Credentials = Json("""{"token":"secret"}""")
        };

        var result = await new CreateProviderCredentialRequestValidator().ValidateAsync(request);

        Assert.Contains(result.Errors, error => error.PropertyName == nameof(request.ProviderKey));
    }

    [Theory]
    [InlineData("[]")]
    [InlineData("{}")]
    [InlineData("null")]
    public async Task Update_rejects_non_object_or_empty_credentials(string json)
    {
        var request = new UpdateProviderCredentialRequest { Credentials = Json(json) };

        var result = await new UpdateProviderCredentialRequestValidator().ValidateAsync(request);

        Assert.Contains(result.Errors, error => error.PropertyName == nameof(request.Credentials));
    }

    [Fact]
    public void Smtp_schema_accepts_all_required_fields()
    {
        new SmtpProviderCredentialsValidator().TestValidate(ValidSmtp())
            .ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData("", 587, "store@example.com")]
    [InlineData("smtp.gmail.com", 0, "store@example.com")]
    [InlineData("smtp.gmail.com", 587, "invalid")]
    public void Smtp_schema_rejects_invalid_required_fields(string host, int port, string senderEmail)
    {
        var settings = ValidSmtp();
        settings.Host = host;
        settings.Port = port;
        settings.SenderEmail = senderEmail;

        new SmtpProviderCredentialsValidator().TestValidate(settings).ShouldHaveAnyValidationError();
    }

    private static SmtpProviderCredentials ValidSmtp() => new()
    {
        Host = "smtp.gmail.com", Port = 587, SenderName = "Pramukhraj Foods",
        SenderEmail = "store@example.com", Username = "store@example.com", Password = "app-password"
    };

    private static JsonElement Json(string value)
    {
        using var document = JsonDocument.Parse(value);
        return document.RootElement.Clone();
    }
}
