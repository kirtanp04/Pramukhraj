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

        public static string GenerateProductMetaKeywords(
        string productName,
        string? categoryName = null,
        string? brand = null,
        IEnumerable<string>? tags = null)
        {
            if (string.IsNullOrWhiteSpace(productName))
            {
                return string.Empty;
            }

            var keywords = new List<string>();

            AddKeywords(keywords, productName);
            AddKeywords(keywords, categoryName);
            AddKeywords(keywords, brand);

            if (tags is not null)
            {
                foreach (var tag in tags)
                {
                    AddKeywords(keywords, tag);
                }
            }

            keywords.Add(productName.Trim());
            keywords.Add("Pramukhraj");
            keywords.Add("Pramukhraj Foods");
            keywords.Add("Namkeen");
            keywords.Add("Farsan");
            keywords.Add("Gujarati Snacks");
            keywords.Add("Buy Online");

            return Truncate(
                string.Join(
                    ", ",
                    keywords
                        .Where(keyword => !string.IsNullOrWhiteSpace(keyword))
                        .Select(keyword => keyword.Trim())
                        .Distinct(StringComparer.OrdinalIgnoreCase)),
                500);
        }

        public static string GenerateProductMetaDescription(
            string productName,
            string? shortDescription = null,
            string? description = null,
            string? categoryName = null)
        {
            if (string.IsNullOrWhiteSpace(productName))
            {
                return string.Empty;
            }

            var sourceDescription = !string.IsNullOrWhiteSpace(shortDescription)
                ? shortDescription.Trim()
                : !string.IsNullOrWhiteSpace(description)
                    ? description.Trim()
                    : null;

            if (sourceDescription is not null)
            {
                return Truncate(
                    $"{productName.Trim()} - {sourceDescription}",
                    500);
            }

            var categoryText = string.IsNullOrWhiteSpace(categoryName)
                ? "authentic Gujarati snacks"
                : categoryName.Trim();

            return Truncate(
                $"Buy {productName.Trim()} online from Pramukhraj. " +
                $"Discover fresh and delicious {categoryText}, prepared with authentic taste and quality ingredients.",
                500);
        }

        public static string GenerateProductMetaTitle(
            string productName,
            string? brand = null)
        {
            if (string.IsNullOrWhiteSpace(productName))
            {
                return string.Empty;
            }

            var product = productName.Trim();
            var normalizedBrand = brand?.Trim();

            var title = string.IsNullOrWhiteSpace(normalizedBrand) ||
                        product.Contains(
                            normalizedBrand,
                            StringComparison.OrdinalIgnoreCase)
                ? $"{product} | Pramukhraj"
                : $"{product} by {normalizedBrand} | Pramukhraj";

            return Truncate(title, 255);
        }

        private static void AddKeywords(
            ICollection<string> keywords,
            string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return;
            }

            var normalizedValue = value.Trim();

            foreach (var keyword in normalizedValue.Split(
                         [' ', '-', '_', '/', ','],
                         StringSplitOptions.RemoveEmptyEntries |
                         StringSplitOptions.TrimEntries))
            {
                if (keyword.Length >= 2)
                {
                    keywords.Add(keyword);
                }
            }

            keywords.Add(normalizedValue);
        }
    }
}
