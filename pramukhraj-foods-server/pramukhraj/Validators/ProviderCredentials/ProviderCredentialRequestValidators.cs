using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using FluentValidation;
using pramukhraj.DTOs.ProviderCredentials;

namespace pramukhraj.Validators.ProviderCredentials;

public sealed partial class CreateProviderCredentialRequestValidator : AbstractValidator<CreateProviderCredentialRequest>
{
    public CreateProviderCredentialRequestValidator()
    {
        RuleFor(request => request.ProviderKey)
            .Must(value => !string.IsNullOrWhiteSpace(value)).WithMessage("Provider key is required.")
            .MaximumLength(100).WithMessage("Provider key cannot exceed 100 characters.")
            .Must(value => string.IsNullOrWhiteSpace(value) || ProviderKeyPattern().IsMatch(value.Trim()))
            .WithMessage("Provider key may contain only letters, numbers, underscores and hyphens, and must start with a letter.");

        RuleFor(request => request.Credentials).Custom((credentials, context) =>
        {
            var error = GetCredentialsError(credentials);
            if (error is not null)
                context.AddFailure(nameof(CreateProviderCredentialRequest.Credentials), error);
        });
    }

    internal static string? GetCredentialsError(JsonElement credentials)
    {
        if (credentials.ValueKind != JsonValueKind.Object)
            return "Credentials must be a JSON object.";
        if (!credentials.EnumerateObject().Any())
            return "Credentials cannot be empty.";

        return Encoding.UTF8.GetByteCount(credentials.GetRawText()) > 64 * 1024
            ? "Credentials cannot exceed 64 KB."
            : null;
    }

    [GeneratedRegex("^[A-Za-z][A-Za-z0-9_-]*$", RegexOptions.CultureInvariant)]
    private static partial Regex ProviderKeyPattern();
}

public sealed class UpdateProviderCredentialRequestValidator : AbstractValidator<UpdateProviderCredentialRequest>
{
    public UpdateProviderCredentialRequestValidator()
    {
        RuleFor(request => request.Credentials).Custom((credentials, context) =>
        {
            var error = CreateProviderCredentialRequestValidator.GetCredentialsError(credentials);
            if (error is not null)
                context.AddFailure(nameof(UpdateProviderCredentialRequest.Credentials), error);
        });
    }
}
