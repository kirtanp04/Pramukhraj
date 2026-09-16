using pramukhraj.DTOs.Email;

namespace pramukhraj.Interfaces;

public interface IEmailService
{
    Task SendAsync(EmailMessage message, CancellationToken cancellationToken = default);
    Task SendWelcomeAsync(string recipientEmail, string recipientName, CancellationToken cancellationToken = default);
}
