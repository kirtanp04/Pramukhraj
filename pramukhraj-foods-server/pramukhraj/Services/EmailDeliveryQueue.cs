using System.Threading.Channels;
using System.Net;
using pramukhraj.Interfaces;

namespace pramukhraj.Services;

public sealed class EmailDeliveryQueue : BackgroundService, IEmailQueue
{
    private const int MaxAttempts = 3;
    private readonly Channel<EmailDeliveryRequest> _queue = Channel.CreateBounded<EmailDeliveryRequest>(
        new BoundedChannelOptions(1_000)
        {
            FullMode = BoundedChannelFullMode.Wait,
            SingleReader = true,
            SingleWriter = false
        });
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<EmailDeliveryQueue> _logger;

    public EmailDeliveryQueue(IServiceScopeFactory scopeFactory, ILogger<EmailDeliveryQueue> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public bool TryQueueWelcomeEmail(string recipientEmail, string recipientName) =>
        !string.IsNullOrWhiteSpace(recipientEmail) &&
        _queue.Writer.TryWrite(new WelcomeEmailRequest(recipientEmail, recipientName));

    public bool TryQueueEmailVerification(
        string recipientEmail,
        string recipientName,
        string code,
        int expiresInMinutes,
        Guid challengeId) =>
        !string.IsNullOrWhiteSpace(recipientEmail) &&
        !string.IsNullOrWhiteSpace(code) &&
        _queue.Writer.TryWrite(new VerificationEmailRequest(
            recipientEmail, recipientName, code, expiresInMinutes, challengeId));

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var request in _queue.Reader.ReadAllAsync(stoppingToken))
        {
            for (var attempt = 1; attempt <= MaxAttempts; attempt++)
            {
                try
                {
                    await using var scope = _scopeFactory.CreateAsyncScope();
                    var serviceManager = scope.ServiceProvider.GetRequiredService<IServiceManager>();
                    var message = await BuildMessageAsync(serviceManager, request, stoppingToken);
                    if (message is null) break;
                    await serviceManager.EmailService.SendAsync(message, stoppingToken);
                    break;
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    return;
                }
                catch (Exception exception) when (attempt < MaxAttempts)
                {
                    _logger.LogWarning(exception,
                        "Transactional email delivery attempt {Attempt}/{MaxAttempts} failed; retrying. Type={EmailType}",
                        attempt, MaxAttempts, request.GetType().Name);
                    await Task.Delay(TimeSpan.FromSeconds(Math.Pow(2, attempt)), stoppingToken);
                }
                catch (Exception exception)
                {
                    _logger.LogError(exception,
                        "Transactional email delivery failed after {MaxAttempts} attempts. Type={EmailType}",
                        MaxAttempts, request.GetType().Name);
                }
            }
        }
    }

    private async Task<DTOs.Email.EmailMessage?> BuildMessageAsync(
        IServiceManager serviceManager,
        EmailDeliveryRequest request,
        CancellationToken cancellationToken)
    {
        var storeSettings = await serviceManager.StoreSettingsService.GetCurrentAsync(cancellationToken);
        if (request is VerificationEmailRequest verification)
        {
            var template = await serviceManager.EmailTemplateService.RenderActiveAsync(
                Entities.EmailTemplates.EmailTemplateKeys.EmailVerificationOtp,
                new Dictionary<string, string?>
                {
                    ["customer_name"] = verification.RecipientName,
                    ["otp_code"] = verification.Code,
                    ["expires_in"] = verification.ExpiresInMinutes.ToString(),
                    ["verification_code"] = verification.Code,
                    ["expires_in_minutes"] = verification.ExpiresInMinutes.ToString(),
                    ["store_name"] = storeSettings.StoreName,
                    ["store_address"] = storeSettings.StoreAddress,
                    ["store_address_line1"] = storeSettings.StoreAddressLine1 ?? "",
                    ["store_address_line2"] = storeSettings.StoreAddressLine2 ?? "",
                    ["store_city"] = storeSettings.StoreCity ?? "",
                    ["store_state"] = storeSettings.StoreState ?? "",
                    ["store_postal_code"] = storeSettings.StorePostalCode ?? "",
                    ["store_country"] = storeSettings.StoreCountry ?? "India",
                    ["support_email"] = storeSettings.SupportEmail,
                    ["support_phone"] = storeSettings.SupportPhoneNumber,
                    ["store_logo_url"] = storeSettings.LogoUrl ?? ""
                }, cancellationToken);
            if (template is not null)
                return new DTOs.Email.EmailMessage(
                    verification.RecipientEmail, verification.RecipientName,
                    template.Subject, template.HtmlContent, template.PlainTextContent);

            var safeName = WebUtility.HtmlEncode(verification.RecipientName);
            var safeCode = WebUtility.HtmlEncode(verification.Code);
            var safeStoreName = WebUtility.HtmlEncode(storeSettings.StoreName);
            var safeStoreAddress = WebUtility.HtmlEncode(storeSettings.StoreAddress);
            return new DTOs.Email.EmailMessage(
                verification.RecipientEmail,
                verification.RecipientName,
                $"Verify your email for {storeSettings.StoreName}",
                $"<html lang=\"en\"><body><h1>Verify your email</h1><p>Hello {safeName},</p><p>Your {safeStoreName} verification code is:</p><p style=\"font:700 28px monospace;letter-spacing:6px\">{safeCode}</p><p>This code expires in {verification.ExpiresInMinutes} minutes. If you did not request it, you can ignore this email.</p><hr/><p style=\"font-size:12px;color:#666;\">{safeStoreName}<br/>{safeStoreAddress}<br/>Support: {WebUtility.HtmlEncode(storeSettings.SupportEmail)} | {WebUtility.HtmlEncode(storeSettings.SupportPhoneNumber)}</p></body></html>",
                $"Hello {verification.RecipientName},\n\nYour {storeSettings.StoreName} verification code is {verification.Code}. It expires in {verification.ExpiresInMinutes} minutes.\n\nIf you did not request it, you can ignore this email.\n\n--\n{storeSettings.StoreName}\n{storeSettings.StoreAddress}\nSupport: {storeSettings.SupportEmail} | {storeSettings.SupportPhoneNumber}");
        }

        var welcome = (WelcomeEmailRequest)request;
        var welcomeTemplate = await serviceManager.EmailTemplateService.RenderActiveAsync(
            Entities.EmailTemplates.EmailTemplateKeys.Welcome,
            new Dictionary<string, string?>
            {
                ["customer_name"] = welcome.RecipientName,
                ["customer_email"] = welcome.RecipientEmail,
                ["store_name"] = storeSettings.StoreName,
                ["store_address"] = storeSettings.StoreAddress,
                ["store_address_line1"] = storeSettings.StoreAddressLine1 ?? "",
                ["store_address_line2"] = storeSettings.StoreAddressLine2 ?? "",
                ["store_city"] = storeSettings.StoreCity ?? "",
                ["store_state"] = storeSettings.StoreState ?? "",
                ["store_postal_code"] = storeSettings.StorePostalCode ?? "",
                ["store_country"] = storeSettings.StoreCountry ?? "India",
                ["support_email"] = storeSettings.SupportEmail,
                ["support_phone"] = storeSettings.SupportPhoneNumber,
                ["store_logo_url"] = storeSettings.LogoUrl ?? ""
            }, cancellationToken);
        if (welcomeTemplate is null)
        {
            _logger.LogWarning("Active WELCOME email template was not found; welcome email was skipped.");
            return null;
        }
        return new DTOs.Email.EmailMessage(
            welcome.RecipientEmail, welcome.RecipientName,
            welcomeTemplate.Subject, welcomeTemplate.HtmlContent, welcomeTemplate.PlainTextContent);
    }

    private abstract record EmailDeliveryRequest(string RecipientEmail, string RecipientName);
    private sealed record WelcomeEmailRequest(string RecipientEmail, string RecipientName)
        : EmailDeliveryRequest(RecipientEmail, RecipientName);
    private sealed record VerificationEmailRequest(
        string RecipientEmail,
        string RecipientName,
        string Code,
        int ExpiresInMinutes,
        Guid ChallengeId)
        : EmailDeliveryRequest(RecipientEmail, RecipientName);
}
