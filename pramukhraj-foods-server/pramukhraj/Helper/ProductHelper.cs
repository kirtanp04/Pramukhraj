using System.Globalization;
using System.Text;

namespace pramukhraj.Helper
{
    public class ProductHelper
    {

       public static string GenerateSku(
       string productName,
       string? variantName,
       int index)
        {
            static string Normalize(string? value)
            {
                if (string.IsNullOrWhiteSpace(value))
                    return string.Empty;

                var normalized = new string(
                    value
                        .Trim()
                        .ToUpperInvariant()
                        .Select(c => char.IsLetterOrDigit(c) ? c : '-')
                        .ToArray());

                while (normalized.Contains("--"))
                {
                    normalized = normalized.Replace("--", "-");
                }

                return normalized.Trim('-');
            }

            var product = Normalize(productName);
            var variant = Normalize(variantName);

            var timestamp = DateTimeOffset.UtcNow
                .ToUnixTimeMilliseconds();

            return string.IsNullOrWhiteSpace(variant)
                ? $"{product}-{timestamp}-{index + 1}"
                : $"{product}-{variant}-{timestamp}-{index + 1}";
        }

        public static string GenerateMetaKeywords(string categoryName)
        {
            var nameKeywords = categoryName
                .Split(
                    [' ', '-', '_'],
                    StringSplitOptions.RemoveEmptyEntries |
                    StringSplitOptions.TrimEntries)
                .Where(keyword => keyword.Length >= 2);

            var keywords = nameKeywords
                .Append(categoryName)
                .Append("Pramukhraj")
                .Append("Namkeen")
                .Append("Farsan")
                .Distinct(StringComparer.OrdinalIgnoreCase);

            return Truncate(
                string.Join(", ", keywords),
                500);
        }

        public static string GenerateMetaDescription(
        string categoryName,
        string? description)
        {
            if (!string.IsNullOrWhiteSpace(description))
            {
                return Truncate(description, 500);
            }

            return Truncate(
                $"Explore {categoryName} products from Pramukhraj. Discover authentic taste and quality products.",
                500);
        }

        public static string GenerateMetaTitle(string categoryName)
        {
            return Truncate(
                $"{categoryName} | Pramukhraj",
                255);
        }

        public static string GenerateSlug(
        string value,
        int maximumLength)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return "category";
            }

            var builder = new StringBuilder();
            var previousCharacterWasDash = false;

            foreach (var character in value.Normalize(NormalizationForm.FormD))
            {
                var unicodeCategory =
                    CharUnicodeInfo.GetUnicodeCategory(character);

                if (unicodeCategory == UnicodeCategory.NonSpacingMark)
                {
                    continue;
                }

                if (char.IsAsciiLetterOrDigit(character))
                {
                    builder.Append(char.ToLowerInvariant(character));
                    previousCharacterWasDash = false;
                }
                else if (!previousCharacterWasDash && builder.Length > 0)
                {
                    builder.Append('-');
                    previousCharacterWasDash = true;
                }
            }

            var slug = builder
                .ToString()
                .Trim('-');

            if (string.IsNullOrWhiteSpace(slug))
            {
                slug = "category";
            }

            return Truncate(slug, maximumLength)
                .TrimEnd('-');
        }

        public static string Truncate(
        string value,
        int maximumLength)
        {
            if (string.IsNullOrEmpty(value))
            {
                return string.Empty;
            }

            return value.Length <= maximumLength
                ? value
                : value[..maximumLength].TrimEnd();
        }
    }
}
