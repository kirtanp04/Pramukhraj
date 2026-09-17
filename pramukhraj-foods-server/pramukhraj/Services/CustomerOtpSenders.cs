using System.Text.Json;
using pramukhraj.DTOs.ProviderCredentials;
using pramukhraj.Entities.ProviderCredentials;
using pramukhraj.Interfaces;
using Twilio.Rest.Api.V2010.Account;
using Twilio.Types;

namespace pramukhraj.Services;

public sealed class TwilioCustomerOtpSender : ICustomerOtpSender
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);
    private readonly IProviderCredentialService _providerCredentialService;
    private readonly ILogger<TwilioCustomerOtpSender> _logger;

    public TwilioCustomerOtpSender(
        IProviderCredentialService providerCredentialService,
        ILogger<TwilioCustomerOtpSender> logger)
    {
        _providerCredentialService = providerCredentialService;
        _logger = logger;
    }

    public async Task SendAsync(string mobileNumber, string code, int expiresInMinutes, CancellationToken cancellationToken)
    {
        var response = await _providerCredentialService.GetByKeyAsync(ProviderKey.Twilio, cancellationToken);
        if (!response.Success || response.Data is null)
        {
            _logger.LogError(
                "Cannot send customer OTP because {ProviderKey} credentials could not be loaded. StatusCode={StatusCode}",
                ProviderKey.Twilio,
                response.StatusCode);
            throw new InvalidOperationException("The SMS provider is not configured.");
        }

        if (!response.Data.IsActive)
        {
            _logger.LogWarning("Cannot send customer OTP because {ProviderKey} is inactive.", ProviderKey.Twilio);
            throw new InvalidOperationException("The SMS provider is inactive.");
        }

        var credentials = response.Data.Credentials.Deserialize<TwilioProviderCredentials>(SerializerOptions);
        if (credentials is null ||
            string.IsNullOrWhiteSpace(credentials.AccountSid) ||
            string.IsNullOrWhiteSpace(credentials.AuthToken) ||
            string.IsNullOrWhiteSpace(credentials.FromNumber))
        {
            _logger.LogError("Cannot send customer OTP because {ProviderKey} credentials are incomplete.", ProviderKey.Twilio);
            throw new InvalidOperationException("The SMS provider configuration is incomplete.");
        }

        var client = new Twilio.Clients.TwilioRestClient(
            credentials.AccountSid.Trim(),
            credentials.AuthToken.Trim());
        var message = $"{code} is your Pramukhraj verification code. It expires in {expiresInMinutes} minutes. Never share it.";

        if (string.IsNullOrWhiteSpace(credentials.ServiceId))
        {
            await MessageResource.CreateAsync(
                to: new PhoneNumber(mobileNumber),
                from: new PhoneNumber(credentials.FromNumber.Trim()),
                body: message,
                client: client);
            return;
        }


        await MessageResource.CreateAsync(
            to: new PhoneNumber(mobileNumber),
            from: new PhoneNumber(credentials.FromNumber.Trim()),
            messagingServiceSid: credentials.ServiceId.Trim(),
            body: message,
            client: client);
    }
}
