using pramukhraj.DTOs.Customer;
using pramukhraj.DTOs.ProviderCredentials;
using pramukhraj.DTOs.Checkout;
using pramukhraj.Validators.Checkout;
using pramukhraj.Validators.Customer;
using pramukhraj.Validators.ProviderCredentials;
using Xunit;

namespace pramukhraj.Tests;

public sealed class Phase1CheckoutValidatorTests
{
    [Fact]
    public void AddressValidator_RequiresIndianMobileAndPinCode()
    {
        var result = new CustomerAddressWriteRequestValidator().Validate(new CustomerAddressWriteRequest
        {
            RecipientName = "Customer", MobileNumber = "98765", AddressLine1 = "Main road",
            City = "Anand", State = "Gujarat", PostalCode = "123", Country = "India", AddressType = "Home"
        });
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, x => x.PropertyName == nameof(CustomerAddressWriteRequest.MobileNumber));
        Assert.Contains(result.Errors, x => x.PropertyName == nameof(CustomerAddressWriteRequest.PostalCode));
    }

    [Fact]
    public void ShiprocketValidator_RequiresWebhookPickupPinAndMinimumWeight()
    {
        var result = new ShiprocketProviderCredentialsValidator().Validate(new ShiprocketProviderCredentials
        {
            Email = "shipping@example.com", Password = "password", WebhookSecret = "",
            PickupPostalCode = "", MinimumChargeableWeightKg = 0m
        });
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, x => x.PropertyName == nameof(ShiprocketProviderCredentials.WebhookSecret));
        Assert.Contains(result.Errors, x => x.PropertyName == nameof(ShiprocketProviderCredentials.PickupPostalCode));
        Assert.Contains(result.Errors, x => x.PropertyName == nameof(ShiprocketProviderCredentials.MinimumChargeableWeightKg));
    }

    [Fact]
    public void CheckoutAddressValidator_AllowsClearingRemovedAddress()
    {
        var result = new UpdateCheckoutAddressRequestValidator().Validate(
            new UpdateCheckoutAddressRequest(null, null));

        Assert.True(result.IsValid);
    }

    [Fact]
    public void DeliveryVerificationResponse_StoresVerificationStateProperly()
    {
        var deliverable = new DeliveryVerificationResponse(true, true, "388001", "Delivery is available for PIN code 388001.", 3);
        Assert.True(deliverable.IsVerified);
        Assert.True(deliverable.IsDeliverable);
        Assert.Equal("388001", deliverable.PostalCode);
        Assert.Equal(3, deliverable.AvailableCouriersCount);

        var unserviceable = new DeliveryVerificationResponse(true, false, "999999", "No delivery partner is currently serviceable for PIN code 999999.", 0);
        Assert.True(unserviceable.IsVerified);
        Assert.False(unserviceable.IsDeliverable);
        Assert.Equal("999999", unserviceable.PostalCode);
        Assert.Equal(0, unserviceable.AvailableCouriersCount);
    }
}
