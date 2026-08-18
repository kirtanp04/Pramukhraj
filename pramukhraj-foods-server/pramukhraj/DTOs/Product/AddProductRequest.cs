namespace pramukhraj.DTOs.Product
{
    public class AddProductRequest
    {
        // Basic Info
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

        // Details
        public string CountryOfOrigin { get; set; } = string.Empty;
        public bool IsVegetarian { get; set; }
        public string ShelfLife { get; set; } = string.Empty;
        public string StorageInstruction { get; set; } = string.Empty;
        public string Ingredients { get; set; } = string.Empty;
        public string NutritionalInformation { get; set; } = string.Empty;
        public string? Barcode { get; set; }
        public AddProductVariantRequest[] Variants { get; set; } = [];
        public AddProductTagRequest[] Tags { get; set; } = [];
        public AddProductImageRequest[] Images { get; set; } = [];
    }

    public class AddProductVariantRequest
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

    public class AddProductTagRequest
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
    }
    
        public class AddProductImageRequest
    {
        public string Id { get; set; }       = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
                public string? AltText { get; set; }
                public bool IsPrimary  { get; set; }
                public int DisplayOrder{ get; set; }
                public string? FileName{ get; set; }
                public long? FileSize  { get; set; }
                public string? MimeType{ get; set; }              
    }        
}