using FluentValidation.TestHelper;
using pramukhraj.DTOs.Auth;
using pramukhraj.Validators;
using Xunit;

namespace pramukhraj.Tests;

public sealed class CustomerOtpValidatorTests
{
    [Theory]
    [InlineData("9876543210")]
    [InlineData("+0123456789")]
    [InlineData("+91 98765 43210")]
    public void SendOtp_rejects_non_e164_numbers(string mobile)
    {
        new SendCustomerOtpRequestValidator().TestValidate(new SendCustomerOtpRequest(mobile))
            .ShouldHaveValidationErrorFor(x => x.MobileNumber);
    }

    [Fact]
    public void SendOtp_accepts_e164_number()
    {
        new SendCustomerOtpRequestValidator().TestValidate(new SendCustomerOtpRequest("+919876543210"))
            .ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void VerifyOtp_requires_six_numeric_digits()
    {
        new VerifyCustomerOtpRequestValidator().TestValidate(
            new VerifyCustomerOtpRequest(Guid.NewGuid(), "+919876543210", "12a456", null))
            .ShouldHaveValidationErrorFor(x => x.Code);
    }

    [Fact]
    public void CompleteProfile_requires_name_and_email()
    {
        var result = new CompleteCustomerProfileRequestValidator().TestValidate(
            new CompleteCustomerProfileRequest("", "not-an-email", null, null, null, false));
        result.ShouldHaveValidationErrorFor(x => x.FullName);
        result.ShouldHaveValidationErrorFor(x => x.Email);
    }
}
