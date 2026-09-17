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
        var bodyBuilder = new BodyBuilder
        {
            HtmlBody = message.HtmlBody,
            TextBody = message.TextBody
        };
        var attachments = message.Attachments ?? [];
        if (attachments.Count > 10 || attachments.Sum(item => (long)item.Content.Length) > 10 * 1024 * 1024)
            throw new ArgumentException("Email attachments cannot exceed 10 files or 10 MB in total.", nameof(message));
        foreach (var attachment in attachments)
        {
            var safeFileName = Path.GetFileName(attachment.FileName);
            if (string.IsNullOrWhiteSpace(safeFileName) || attachment.Content.Length == 0 ||
                !ContentType.TryParse(attachment.ContentType, out var contentType))
                throw new ArgumentException("An email attachment is invalid.", nameof(message));
            bodyBuilder.Attachments.Add(safeFileName, attachment.Content, contentType);
        }
        email.Body = bodyBuilder.ToMessageBody();

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

    private static string RecipientDomain(string address)
    {
        var separator = address.LastIndexOf('@');
        return separator >= 0 ? address[(separator + 1)..] : "unknown";
    }
}
