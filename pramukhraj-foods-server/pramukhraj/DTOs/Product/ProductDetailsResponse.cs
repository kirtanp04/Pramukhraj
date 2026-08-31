namespace pramukhraj.DTOs.Product
{
    public sealed class ProductDetailsResponse
    {
        public string Id { get; set; } = string.Empty;
        public string CategoryId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string ShortDescription { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Brand { get; set; } = string.Empty;
        public bool IsFeatured { get; set; }
        public bool IsBestSeller { get; set; }
        public bool IsTrending { get; set; }
        public bool IsNewArrival { get; set; }
        public bool IsActive { get; set; }
        public string CountryOfOrigin { get; set; } = string.Empty;
        public bool IsVegetarian { get; set; }
        public string ShelfLife { get; set; } = string.Empty;
        public string StorageInstruction { get; set; } = string.Empty;
        public string Ingredients { get; set; } = string.Empty;
        public string NutritionalInformation { get; set; } = string.Empty;
        public string? Barcode { get; set; }
        public ProductImageDetailsResponse[] Images { get; set; } = [];
        public ProductVariantDetailsResponse[] Variants { get; set; } = [];
        public ProductTagDetailsResponse[] Tags { get; set; } = [];
    }

    public sealed class ProductImageDetailsResponse
    {
        public string Id { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public string? AltText { get; set; }
        public bool IsPrimary { get; set; }
        public int DisplayOrder { get; set; }
    }

    public sealed class ProductVariantDetailsResponse
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Sku { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public decimal Mrp { get; set; }
        public int StockQuantity { get; set; }
        public decimal Weight { get; set; }
        public string WeightUnit { get; set; } = string.Empty;
        public bool IsDefault { get; set; }
        public bool IsActive { get; set; }
    }

    public sealed class ProductTagDetailsResponse
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
    }

    public sealed class ProductCategoryDetailsResponse
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public int DisplayOrder { get; set; }
        public bool IsFeatured { get; set; }
        public bool IsActive { get; set; }
    }
}
