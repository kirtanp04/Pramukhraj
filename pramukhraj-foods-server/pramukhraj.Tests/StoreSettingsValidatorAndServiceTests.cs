using System.Text.Json;
using pramukhraj.DTOs.Settings;
using pramukhraj.Validators.Settings;
using Xunit;

namespace pramukhraj.Tests;

public sealed class StoreSettingsValidatorAndServiceTests
{
    private readonly StoreSettingsWriteRequestValidator _validator = new();
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private static StoreSettingsWriteRequest ValidRequest() => new(
        SupportEmail: "support@pramukhraj.com",
        SupportPhoneNumber: "+919876543210",
        TaxRatePercent: 0m,
        PaymentServiceTaxRatePercent: 2m,
        StoreAddress: "123 Market Street, Ahmedabad, Gujarat - 380001, India",
        StoreName: "Pramukhraj Foods",
        FreeShippingMinimumAmount: 500m,
        ConcurrencyStamp: null,
        ReturnWindowDays: 0,
        StoreAddressLine1: "123 Market Street",
        StoreAddressLine2: "Opp. Central Mall",
        StoreCity: "Ahmedabad",
        StoreState: "Gujarat",
        StorePostalCode: "380001",
        StoreCountry: "India");

    [Fact]
    public void ValidRequest_WithAllRequiredFields_Passes()
    {
        var result = _validator.Validate(ValidRequest());
        Assert.True(result.IsValid);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData(null)]
    public void StoreAddressLine1_Required_FailsWhenMissing(string? line1)
    {
        var request = ValidRequest() with { StoreAddressLine1 = line1! };
        var result = _validator.Validate(request);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(StoreSettingsWriteRequest.StoreAddressLine1));
    }

    [Theory]
    [InlineData("")]
    [InlineData("12345")]
    [InlineData("1234567")]
    [InlineData("38000A")]
    public void StorePostalCode_MustBeSixDigits_FailsWhenInvalid(string invalidPin)
    {
        var request = ValidRequest() with { StorePostalCode = invalidPin };
        var result = _validator.Validate(request);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(StoreSettingsWriteRequest.StorePostalCode));
    }

    [Fact]
    public void ValidRequest_WithZeroReturnWindow_Passes()
    {
        var request = ValidRequest() with { ReturnWindowDays = 0 };
        var result = _validator.Validate(request);
        Assert.True(result.IsValid);
    }

    [Theory]
    [InlineData(1)]
    [InlineData(7)]
    [InlineData(14)]
    [InlineData(30)]
    [InlineData(365)]
    public void ValidRequest_WithPositiveReturnWindow_Passes(int days)
    {
        var request = ValidRequest() with { ReturnWindowDays = days };
        var result = _validator.Validate(request);
        Assert.True(result.IsValid);
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(-10)]
    [InlineData(366)]
    [InlineData(1000)]
    public void InvalidReturnWindow_FailsValidation(int days)
    {
        var request = ValidRequest() with { ReturnWindowDays = days };
        var result = _validator.Validate(request);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(StoreSettingsWriteRequest.ReturnWindowDays));
    }

    [Fact]
    public void StoreSettingsData_Serialization_PreservesReturnWindowDays()
    {
        var data = new StoreSettingsData(
            "support@pramukhraj.com",
            "+919876543210",
            0m,
            2m,
            "123 Market Street",
            "Pramukhraj Foods",
            500m,
            ReturnWindowDays: 14);

        var json = JsonSerializer.Serialize(data, JsonOptions);
        var deserialized = JsonSerializer.Deserialize<StoreSettingsData>(json, JsonOptions);

        Assert.NotNull(deserialized);
        Assert.Equal(14, deserialized.ReturnWindowDays);
    }

    [Fact]
    public void StoreSettingsData_Deserialization_DefaultsToZero_WhenFieldMissing()
    {
        // Legacy JSON without ReturnWindowDays
        var legacyJson = """
        {
            "supportEmail": "support@pramukhraj.com",
            "supportPhoneNumber": "+919876543210",
            "taxRatePercent": 0,
            "paymentServiceTaxRatePercent": 2,
            "storeAddress": "123 Market Street",
            "storeName": "Pramukhraj Foods",
            "freeShippingMinimumAmount": 500
        }
        """;

        var deserialized = JsonSerializer.Deserialize<StoreSettingsData>(legacyJson, JsonOptions);

        Assert.NotNull(deserialized);
        Assert.Equal(0, deserialized.ReturnWindowDays);
    }
}

