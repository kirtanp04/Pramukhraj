using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace pramukhraj.Entities
{
    [Table("HomepageCms")]
    public class HomepageCMS // only one data row will be stored in the database for this entity with Id = 1.
    {
        [Key]
        public int Id { get; set; } // use 1 as id for the only row in the table.


        // --------------------------------------------------
        // Hero section
        // --------------------------------------------------

        [Required]
        [MaxLength(150)]
        public string EyebrowBadge { get; set; } = "Since 1997 · Gujarat";

        [Required]
        [MaxLength(250)]
        public string Headline { get; set; } = "Traditional taste, modern shopping.";

        [Required]
        [MaxLength(1000)]
        public string Subtext { get; set; } = "Hand-rolled papad, stone-ground masala and small-batch sweets — sourced from home kitchens across Gujarat and shipped to your door.";

        /// <summary>
        /// Stores a validated PNG, JPEG or WebP base64 data URI.
        /// An empty value tells the storefront to use its bundled default image.
        /// </summary>
        [Required]
        public string HeroImageUrl { get; set; } = string.Empty;

        /// <summary>
        /// Required for accessibility and SEO.
        /// </summary>
        [Required]
        [MaxLength(250)]
        public string HeroImageAltText { get; set; } = "Pramukhraj Foods traditional namkeen, farsan and papad products";

        [MaxLength(30)]
        public string? HappyCustomersCount { get; set; }

        [MaxLength(60)]
        public string? HappyCustomersLabel { get; set; }

        [MaxLength(30)]
        public string? ProductCount { get; set; }

        [MaxLength(60)]
        public string? ProductCountLabel { get; set; }

        [MaxLength(30)]
        public string? AverageRating { get; set; }

        [MaxLength(60)]
        public string? AverageRatingLabel { get; set; }

        // --------------------------------------------------
        // Homepage section visibility
        // --------------------------------------------------

        public bool ShowShopByCategory { get; set; } = true;

        public bool ShowFeaturedProducts { get; set; } = true;

        public bool ShowTrendingProducts { get; set; } = true;

        public bool ShowBestSellerProducts { get; set; } = true;

        public bool ShowNewArrivalProducts { get; set; } = true;

        public bool ShowCustomerTestimonials { get; set; } = true;

        public bool ShowFaqSection { get; set; } = true;


        public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedOn { get; set; } = DateTime.UtcNow;
    }
}
