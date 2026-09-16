using System.Net;
using System.Text.Json;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using pramukhraj.DTOs.Email;
using pramukhraj.DTOs.ProviderCredentials;
using pramukhraj.Entities.ProviderCredentials;
using pramukhraj.Interfaces;

namespace pramukhraj.Services;

public sealed class SmtpEmailService(
    IProviderCredentialService providerCredentialService,
    IValidatorManager validatorManager,
    ILogger<SmtpEmailService> logger) : IEmailService
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);

    public async Task SendAsync(EmailMessage message, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(message);
        if (!MailboxAddress.TryParse(message.RecipientEmail, out var recipient))
            throw new ArgumentException("A valid recipient email address is required.", nameof(message));
        if (string.IsNullOrWhiteSpace(message.Subject))
            throw new ArgumentException("An email subject is required.", nameof(message));
        if (string.IsNullOrWhiteSpace(message.HtmlBody) || string.IsNullOrWhiteSpace(message.TextBody))
            throw new ArgumentException("HTML and plain-text email bodies are required.", nameof(message));

        var response = await providerCredentialService.GetByKeyAsync(ProviderKey.Smtp, cancellationToken);
        if (!response.Success || response.Data is null)
        {
            logger.LogError("Cannot send email because SMTP credentials are not configured. StatusCode={StatusCode}", response.StatusCode);
            throw new InvalidOperationException("The email provider is not configured.");
        }
        if (!response.Data.IsActive)
            throw new InvalidOperationException("The email provider is inactive.");

        var settings = response.Data.Credentials.Deserialize<SmtpProviderCredentials>(SerializerOptions)
            ?? throw new InvalidOperationException("The email provider configuration is invalid.");
        var validation = await validatorManager.SmtpProviderCredentials.ValidateAsync(settings, cancellationToken);
        if (!validation.IsValid)
            throw new InvalidOperationException("The email provider configuration is incomplete.");

        var email = new MimeMessage();
        email.From.Add(new MailboxAddress(settings.SenderName.Trim(), settings.SenderEmail.Trim()));
        email.To.Add(new MailboxAddress(message.RecipientName.Trim(), recipient.Address));
        email.Subject = message.Subject.Trim();
        email.Body = new BodyBuilder
        {
            HtmlBody = message.HtmlBody,
            TextBody = message.TextBody
        }.ToMessageBody();

        using var client = new SmtpClient
        {
            CheckCertificateRevocation = true,
            Timeout = 15_000
        };
        var socketOptions = settings.Port == 465
            ? SecureSocketOptions.SslOnConnect
            : SecureSocketOptions.StartTls;

        try
        {
            await client.ConnectAsync(settings.Host.Trim(), settings.Port, socketOptions, cancellationToken);
            await client.AuthenticateAsync(settings.Username.Trim(), settings.Password, cancellationToken);
            await client.SendAsync(email, cancellationToken);
            await client.DisconnectAsync(true, cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { throw; }
        catch (Exception exception)
        {
            logger.LogError(exception, "SMTP delivery failed for recipient domain {RecipientDomain}.", RecipientDomain(recipient.Address));
            throw;
        }
    }

    public Task SendWelcomeAsync(string recipientEmail, string recipientName, CancellationToken cancellationToken = default)
    {
        var safeName = WebUtility.HtmlEncode(string.IsNullOrWhiteSpace(recipientName) ? "there" : recipientName.Trim());
        const string subject = "Welcome to Pramukhraj Foods";
        var html = $$"""
            <!doctype html>
            <html lang="en">
            <body style="margin:0;background:#f7f1e7;font-family:Arial,sans-serif;color:#27231f">
              <div style="display:none;max-height:0;overflow:hidden">Your Pramukhraj Foods account is ready.</div>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f1e7;padding:24px 12px">
                <tr><td align="center">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fffdf8;border:1px solid #e5dacb;border-radius:18px;overflow:hidden">
                    <tr><td style="height:6px;background:linear-gradient(90deg,#7a2333,#d99b2b,#176b63)"></td></tr>
                    <tr><td style="padding:36px 32px 18px;text-align:center">
                      <div style="font-size:26px;font-weight:700;color:#7a2333">Pramukhraj Foods</div>
                    </td></tr>
                    <tr><td style="padding:0 32px 36px">
                      <h1 style="margin:0 0 16px;font-size:28px;line-height:1.25;color:#27231f">Welcome, {{safeName}}!</h1>
                      <p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:#625b53">Your account has been created successfully. You can now enjoy faster checkout, manage your details, and keep track of your orders in one place.</p>
                      <div style="margin:24px 0;padding:18px;border-radius:12px;background:#edf6f3;color:#245850;font-size:14px;line-height:1.6">For your security, we will never ask you to share a verification code or password by email.</div>
                      <p style="margin:0;font-size:15px;line-height:1.6;color:#625b53">Thank you for choosing Pramukhraj Foods.<br><strong style="color:#27231f">The Pramukhraj Foods team</strong></p>
                    </td></tr>
                    <tr><td style="padding:18px 32px;background:#f4ecdf;text-align:center;font-size:12px;line-height:1.5;color:#776f66">This is an account notification sent to {{WebUtility.HtmlEncode(recipientEmail)}}.</td></tr>
                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """;
        var text = $"Welcome, {(string.IsNullOrWhiteSpace(recipientName) ? "there" : recipientName.Trim())}!\n\nYour Pramukhraj Foods account has been created successfully. You can now enjoy faster checkout, manage your details, and keep track of your orders in one place.\n\nFor your security, we will never ask you to share a verification code or password by email.\n\nThank you for choosing Pramukhraj Foods.\nThe Pramukhraj Foods team";
        return SendAsync(new EmailMessage(recipientEmail, recipientName, subject, html, text), cancellationToken);
    }

    private static string RecipientDomain(string address)
    {
        var separator = address.LastIndexOf('@');
        return separator >= 0 ? address[(separator + 1)..] : "unknown";
    }
}
