namespace pramukhraj.DTOs.Email;

public sealed record EmailMessage(
    string RecipientEmail,
    string RecipientName,
    string Subject,
    string HtmlBody,
    string TextBody);
