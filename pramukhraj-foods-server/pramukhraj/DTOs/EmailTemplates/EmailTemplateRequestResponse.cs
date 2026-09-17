using pramukhraj.Entities.EmailTemplates;

namespace pramukhraj.DTOs.EmailTemplates;

public class EmailTemplateWriteRequest
{
    public string Key { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public EmailTemplateCategory Category { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string DesignJson { get; set; } = string.Empty;
    public string HtmlContent { get; set; } = string.Empty;
    public string? PlainTextContent { get; set; }
    public List<string> Variables { get; set; } = [];
    public List<EmailTemplateAttachmentDefinition> Attachments { get; set; } = [];
    public bool IsActive { get; set; } = true;
}

public sealed class EmailTemplateAttachmentDefinition
{
    public string Name { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public string SourceVariable { get; set; } = string.Empty;
    public bool IsRequired { get; set; }
}

public sealed class EmailTemplateResponse : EmailTemplateWriteRequest
{
    public Guid Id { get; set; }
    public DateTime CreatedOn { get; set; }
    public DateTime UpdatedOn { get; set; }
}

public sealed class EmailTemplateListItemResponse
{
    public Guid Id { get; set; }
    public string Key { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public EmailTemplateCategory Category { get; set; }
    public string Subject { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime UpdatedOn { get; set; }
}

public sealed record RenderedEmailTemplate(
    string Subject,
    string HtmlContent,
    string PlainTextContent,
    IReadOnlyList<EmailTemplateAttachmentDefinition> Attachments);
