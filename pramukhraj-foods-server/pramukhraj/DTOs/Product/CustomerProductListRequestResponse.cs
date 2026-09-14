namespace pramukhraj.DTOs.Product;

public static class CustomerProductListRequestResponse
{
    public const int DefaultPageSize = 20;
    public const int MaximumPageSize = 20;
    public const decimal MaximumPrice = 1000m;
    public const int MaximumSearchLength = 100;

    public enum FilterSortBy
    {
        PriceAsc,
        PriceDesc
    }

    public enum FilterProductStatus
    {
        NewArrivals,
        BestSellers,
        Trending,
        Featured,
        Deals
    }

    public sealed class CustomerProductListRequest
    {
        public string? CategoryId { get; set; }
        public string? Search { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = DefaultPageSize;
        public decimal MaxPrice { get; set; } = MaximumPrice;
        public FilterSortBy SortBy { get; set; } = FilterSortBy.PriceAsc;
        public FilterProductStatus? ProductStatus { get; set; }
    }

    public sealed class CustomerProductDto
    {
        public string ProductId { get; set; } = string.Empty;
        public string ProductName { get; set; } = string.Empty;
        public string ProductSlug { get; set; } = string.Empty;
        public string CategoryId { get; set; } = string.Empty;
        public string CategoryName { get; set; } = string.Empty;
        public string CategorySlug { get; set; } = string.Empty;
        public string Brand { get; set; } = string.Empty;
        public string ShortDescription { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public decimal Mrp { get; set; }
        public string Sku { get; set; } = string.Empty;
        public string WeightUnit { get; set; } = string.Empty;
        public decimal Weight { get; set; }
        public string ProductVariantId { get; set; } = string.Empty;
        public string ProductVariantSku { get; set; } = string.Empty;
        public int StockQuantity { get; set; }
        public bool IsLowStock { get; set; }
        public bool IsFeatured { get; set; }
        public bool IsBestSeller { get; set; }
        public bool IsNewArrival { get; set; }
        public bool IsTrending { get; set; }
        public string ImageUrl { get; set; } = string.Empty;
    }

    public sealed class CustomerProductListResponse
    {
        public List<CustomerProductDto> Products { get; set; } = [];
        public int TotalCount { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = DefaultPageSize;
    }
}
