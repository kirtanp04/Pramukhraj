using System.Text.Json;
using System.Text.RegularExpressions;
using FluentValidation;
using pramukhraj.DTOs.EmailTemplates;

namespace pramukhraj.Validators.EmailTemplates;

public sealed partial class EmailTemplateWriteRequestValidator : AbstractValidator<EmailTemplateWriteRequest>
{
    public EmailTemplateWriteRequestValidator()
    {
        RuleFor(request => request.Key).NotEmpty().MaximumLength(100)
            .Matches("^[A-Za-z][A-Za-z0-9_-]*$")
            .WithMessage("Template key may contain letters, numbers, underscores and hyphens and must start with a letter.");
        RuleFor(request => request.Name).NotEmpty().MaximumLength(150);
        RuleFor(request => request.Description).MaximumLength(500);
        RuleFor(request => request.Category).IsInEnum();
        RuleFor(request => request.Subject).NotEmpty().MaximumLength(300).Must(BeSafeText)
            .WithMessage("Subject contains unsupported control characters.");
        RuleFor(request => request.DesignJson).NotEmpty().Must(BeValidDesignJson)
            .WithMessage("Email design must be valid JSON.")
            .Must(value => Utf8Size(value) <= 2_000_000).WithMessage("Email design cannot exceed 2 MB.");
        RuleFor(request => request.HtmlContent).NotEmpty()
            .Must(value => Utf8Size(value) <= 2_000_000).WithMessage("Email HTML cannot exceed 2 MB.")
            .Must(BeSafeHtml).WithMessage("Email HTML contains unsafe or unsupported content.");
        RuleFor(request => request.PlainTextContent)
            .Must(value => value is null || Utf8Size(value) <= 200_000).WithMessage("Plain-text content cannot exceed 200 KB.");
        RuleFor(request => request.Variables).NotNull().Must(items => items.Count <= 100)
            .WithMessage("A template cannot define more than 100 variables.");
        RuleForEach(request => request.Variables).NotEmpty().MaximumLength(100)
            .Matches("^[a-z][a-z0-9_]*$").WithMessage("Variables must use lower snake_case names.");
        RuleFor(request => request.Attachments).NotNull().Must(items => items.Count <= 10)
            .WithMessage("A template cannot define more than 10 attachments.");
        RuleForEach(request => request.Attachments).ChildRules(attachment =>
        {
            attachment.RuleFor(item => item.Name).NotEmpty().MaximumLength(200).Must(BeSafeText);
            attachment.RuleFor(item => item.ContentType).NotEmpty().MaximumLength(100)
                .Matches("^[a-zA-Z0-9][a-zA-Z0-9.+-]*/[a-zA-Z0-9][a-zA-Z0-9.+-]*$");
            attachment.RuleFor(item => item.SourceVariable).NotEmpty().MaximumLength(100)
                .Matches("^[a-z][a-z0-9_]*$");
        });
        RuleFor(request => request).Custom((request, context) =>
        {
            var declared = request.Variables.ToHashSet(StringComparer.Ordinal);
            var content = $"{request.Subject}\n{request.HtmlContent}\n{request.PlainTextContent}";
            var missing = MergeTokenPattern().Matches(content)
                .Select(match => match.Groups[1].Value)
                .Where(variable => !declared.Contains(variable))
                .Distinct(StringComparer.Ordinal)
                .ToArray();
            if (missing.Length > 0)
                context.AddFailure(nameof(request.Variables), $"Declare these merge variables: {string.Join(", ", missing)}.");
        });
    }

    private static bool BeValidDesignJson(string value)
    {
        try
        {
            using var document = JsonDocument.Parse(value);
            return document.RootElement.ValueKind == JsonValueKind.Object;
        }
        catch (JsonException) { return false; }
    }

    private static bool BeSafeHtml(string value) =>
        !UnsafeHtmlPattern().IsMatch(value);

    private static bool BeSafeText(string value) =>
        !value.Any(character => char.IsControl(character) && character is not '\t');

    private static int Utf8Size(string value) => System.Text.Encoding.UTF8.GetByteCount(value);

    [GeneratedRegex(@"<\s*(script|iframe|object|embed|form|input|base)\b|javascript\s*:|\bon[a-z]+\s*=", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex UnsafeHtmlPattern();
    [GeneratedRegex(@"\{\{\s*([a-z][a-z0-9_]*)\s*\}\}", RegexOptions.CultureInvariant)]
    private static partial Regex MergeTokenPattern();
}
