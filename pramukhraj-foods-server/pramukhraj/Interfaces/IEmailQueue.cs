namespace pramukhraj.Interfaces;

public interface IEmailQueue
{
    bool TryQueueWelcomeEmail(string recipientEmail, string recipientName);
    bool TryQueueEmailVerification(string recipientEmail, string recipientName, string code, int expiresInMinutes, Guid challengeId);
}
