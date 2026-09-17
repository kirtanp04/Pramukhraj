namespace pramukhraj.DTOs.Email;

public sealed record EmailMessage(
    string RecipientEmail,
    string RecipientName,
    string Subject,
    string HtmlBody,
    string TextBody,
    IReadOnlyList<EmailAttachment>? Attachments = null);

public sealed record EmailAttachment(string FileName, string ContentType, byte[] Content);
