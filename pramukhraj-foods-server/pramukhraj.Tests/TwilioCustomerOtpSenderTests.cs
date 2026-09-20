using System.Text.Json;
using Microsoft.Extensions.Logging.Abstractions;
using pramukhraj.Common;
using pramukhraj.DTOs.ProviderCredentials;
using pramukhraj.Interfaces;
using pramukhraj.Services;
using Xunit;

namespace pramukhraj.Tests;

public sealed class TwilioCustomerOtpSenderTests
{
    [Fact]
    public async Task Send_rejects_missing_provider_configuration()
    {
        var service = new StubProviderCredentialService(
            ApiResponse<ProviderCredentialResponse>.Fail("Not found.", 404));
        var sender = new TwilioCustomerOtpSender(service, NullLogger<TwilioCustomerOtpSender>.Instance);

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            sender.SendAsync("+919999999999", "123456", 5, CancellationToken.None));

        Assert.Equal("The SMS provider is not configured.", exception.Message);
    }

    [Fact]
    public async Task Send_rejects_inactive_provider_configuration()
    {
        var service = new StubProviderCredentialService(SuccessResponse(
            """{"accountSid":"AC123","authToken":"secret","fromNumber":"+17372508034","serviceId":""}""",
            isActive: false));
        var sender = new TwilioCustomerOtpSender(service, NullLogger<TwilioCustomerOtpSender>.Instance);

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            sender.SendAsync("+919999999999", "123456", 5, CancellationToken.None));

        Assert.Equal("The SMS provider is inactive.", exception.Message);
    }

    [Fact]
    public async Task Send_rejects_incomplete_provider_configuration()
    {
        var service = new StubProviderCredentialService(SuccessResponse(
            """{"accountSid":"AC123","authToken":"","fromNumber":"+17372508034","serviceId":""}""",
            isActive: true));
        var sender = new TwilioCustomerOtpSender(service, NullLogger<TwilioCustomerOtpSender>.Instance);

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            sender.SendAsync("+919999999999", "123456", 5, CancellationToken.None));

        Assert.Equal("The SMS provider configuration is incomplete.", exception.Message);
    }

    private static ApiResponse<ProviderCredentialResponse> SuccessResponse(string credentialsJson, bool isActive)
    {
        using var document = JsonDocument.Parse(credentialsJson);
        return ApiResponse<ProviderCredentialResponse>.Ok(new ProviderCredentialResponse
        {
            ProviderKey = "TWILIO",
            Credentials = document.RootElement.Clone(),
            IsActive = isActive,
        });
    }

    private sealed class StubProviderCredentialService : IProviderCredentialService
    {
        private readonly ApiResponse<ProviderCredentialResponse> _response;

        public StubProviderCredentialService(ApiResponse<ProviderCredentialResponse> response) => _response = response;

        public Task<ApiResponse<ProviderCredentialResponse>> GetByKeyAsync(
            string providerKey,
            CancellationToken cancellationToken = default) => Task.FromResult(_response);

        public Task<ApiResponse<Guid>> CreateAsync(
            CreateProviderCredentialRequest request,
            CancellationToken cancellationToken = default) => throw new NotSupportedException();

        public Task<ApiResponse<Guid>> UpdateAsync(
            string providerKey,
            UpdateProviderCredentialRequest request,
            CancellationToken cancellationToken = default) => throw new NotSupportedException();

        public Task<TCredential> GetRequiredAsync<TCredential>(
            string providerKey,
            CancellationToken cancellationToken = default) where TCredential : class => throw new NotSupportedException();
    }
}
