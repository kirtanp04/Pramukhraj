using FluentValidation;
using pramukhraj.DTOs.HomepageCms;

namespace pramukhraj.Validators.HomepageCms;

public sealed class HomepageCmsWriteRequestValidator : AbstractValidator<HomepageCmsWriteRequest>
{
    private const int MaxImageBytes = 4 * 1024 * 1024;
    private static readonly string[] SupportedPrefixes =
    [
        "data:image/png;base64,",
        "data:image/jpeg;base64,",
        "data:image/webp;base64,"
    ];

    public HomepageCmsWriteRequestValidator()
    {
        RuleFor(request => request.EyebrowBadge)
            .Must(value => !string.IsNullOrWhiteSpace(value))
            .WithMessage("Eyebrow badge is required.")
            .MaximumLength(150)
            .WithMessage("Eyebrow badge cannot exceed 150 characters.");

        RuleFor(request => request.Headline)
            .Must(value => !string.IsNullOrWhiteSpace(value))
            .WithMessage("Headline is required.")
            .MaximumLength(250)
            .WithMessage("Headline cannot exceed 250 characters.");

        RuleFor(request => request.Subtext)
            .Must(value => !string.IsNullOrWhiteSpace(value))
            .WithMessage("Subtext is required.")
            .MaximumLength(1000)
            .WithMessage("Subtext cannot exceed 1,000 characters.");

        RuleFor(request => request.HeroImageAltText)
            .Must(value => !string.IsNullOrWhiteSpace(value))
            .WithMessage("Hero image alt text is required.")
            .MaximumLength(250)
            .WithMessage("Hero image alt text cannot exceed 250 characters.");

        RuleFor(request => request.HeroImageBase64)
            .Custom(ValidateImage);

        RuleFor(request => request.HappyCustomersCount)
            .MaximumLength(30)
            .WithMessage("Happy customers count cannot exceed 30 characters.");

        RuleFor(request => request.HappyCustomersLabel)
            .MaximumLength(60)
            .WithMessage("Statistic 1 label cannot exceed 60 characters.");

        RuleFor(request => request.ProductCount)
            .MaximumLength(30)
            .WithMessage("Product count cannot exceed 30 characters.");

        RuleFor(request => request.ProductCountLabel)
            .MaximumLength(60)
            .WithMessage("Statistic 2 label cannot exceed 60 characters.");

        RuleFor(request => request.AverageRating)
            .MaximumLength(30)
            .WithMessage("Average rating cannot exceed 30 characters.");

        RuleFor(request => request.AverageRatingLabel)
            .MaximumLength(60)
            .WithMessage("Statistic 3 label cannot exceed 60 characters.");
    }

    private static void ValidateImage(string? value, ValidationContext<HomepageCmsWriteRequest> context)
    {
        if (string.IsNullOrWhiteSpace(value)) return;

        var prefix = SupportedPrefixes.FirstOrDefault(item =>
            value.StartsWith(item, StringComparison.OrdinalIgnoreCase));
        if (prefix is null)
        {
            context.AddFailure(
                nameof(HomepageCmsWriteRequest.HeroImageBase64),
                "Hero image must be a PNG, JPG, JPEG or WebP base64 data URI.");
            return;
        }

        var payload = value[prefix.Length..];
        var maximumEncodedLength = ((MaxImageBytes + 2) / 3) * 4;
        if (payload.Length > maximumEncodedLength)
        {
            context.AddFailure(
                nameof(HomepageCmsWriteRequest.HeroImageBase64),
                "Hero image cannot exceed 4 MB.");
            return;
        }

        try
        {
            var bytes = Convert.FromBase64String(payload);
            if (bytes.Length == 0 || bytes.Length > MaxImageBytes)
            {
                context.AddFailure(
                    nameof(HomepageCmsWriteRequest.HeroImageBase64),
                    bytes.Length == 0 ? "Hero image data is empty." : "Hero image cannot exceed 4 MB.");
                return;
            }

            if (!HasExpectedSignature(prefix, bytes))
            {
                context.AddFailure(
                    nameof(HomepageCmsWriteRequest.HeroImageBase64),
                    "Hero image content does not match its declared file type.");
            }
        }
        catch (FormatException)
        {
            context.AddFailure(
                nameof(HomepageCmsWriteRequest.HeroImageBase64),
                "Hero image contains invalid base64 data.");
        }
    }

    private static bool HasExpectedSignature(string prefix, byte[] bytes)
    {
        if (prefix.Contains("png", StringComparison.OrdinalIgnoreCase))
        {
            return bytes.Length >= 8 &&
                   bytes[0] == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4E && bytes[3] == 0x47 &&
                   bytes[4] == 0x0D && bytes[5] == 0x0A && bytes[6] == 0x1A && bytes[7] == 0x0A;
        }

        if (prefix.Contains("jpeg", StringComparison.OrdinalIgnoreCase))
            return bytes.Length >= 3 && bytes[0] == 0xFF && bytes[1] == 0xD8 && bytes[2] == 0xFF;

        return bytes.Length >= 12 &&
               bytes[0] == 0x52 && bytes[1] == 0x49 && bytes[2] == 0x46 && bytes[3] == 0x46 &&
               bytes[8] == 0x57 && bytes[9] == 0x45 && bytes[10] == 0x42 && bytes[11] == 0x50;
    }
}
