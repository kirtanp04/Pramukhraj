namespace pramukhraj.DTOs.HomepageCms;

public class HomepageCmsWriteRequest
{
    public string EyebrowBadge { get; set; } = "Since 1997 · Gujarat";
    public string Headline { get; set; } = "Traditional taste, modern shopping.";
    public string Subtext { get; set; } = "Hand-rolled papad, stone-ground masala and small-batch sweets — sourced from home kitchens across Gujarat and shipped to your door.";
    public string HeroImageBase64 { get; set; } = string.Empty;
    public string HeroImageAltText { get; set; } = "Pramukhraj Foods traditional namkeen, farsan and papad products";
    public string? HappyCustomersCount { get; set; }
    public string? HappyCustomersLabel { get; set; }
    public string? ProductCount { get; set; }
    public string? ProductCountLabel { get; set; }
    public string? AverageRating { get; set; }
    public string? AverageRatingLabel { get; set; }
    public bool ShowShopByCategory { get; set; } = true;
    public bool ShowFeaturedProducts { get; set; } = true;
    public bool ShowTrendingProducts { get; set; } = true;
    public bool ShowBestSellerProducts { get; set; } = true;
    public bool ShowNewArrivalProducts { get; set; } = true;
    public bool ShowCustomerTestimonials { get; set; } = true;
    public bool ShowFaqSection { get; set; } = true;
}

public sealed class AdminHomepageCmsResponse : HomepageCmsWriteRequest
{
    public int Id { get; set; } = 1;
    public DateTime CreatedOn { get; set; }
    public DateTime UpdatedOn { get; set; }
}

public sealed class CustomerHomepageHeroResponse
{
    public string EyebrowBadge { get; set; } = string.Empty;
    public string Headline { get; set; } = string.Empty;
    public string Subtext { get; set; } = string.Empty;
    public string HeroImageBase64 { get; set; } = string.Empty;
    public string HeroImageAltText { get; set; } = string.Empty;
    public string? HappyCustomersCount { get; set; }
    public string? HappyCustomersLabel { get; set; }
    public string? ProductCount { get; set; }
    public string? ProductCountLabel { get; set; }
    public string? AverageRating { get; set; }
    public string? AverageRatingLabel { get; set; }
}
