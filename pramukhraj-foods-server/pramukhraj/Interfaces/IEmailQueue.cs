namespace pramukhraj.Interfaces;

public interface IEmailQueue
{
    bool TryQueueWelcomeEmail(string recipientEmail, string recipientName);
}
