namespace pramukhraj.DTOs.Product
{
    public class CustomerHomePageProductRequestResponse
    {
        public sealed class CustomerHomeProductGroupsResponse
        {
            public List<CustomerProductCardResponse> FeaturedProducts { get; set; } = [];
            public List<CustomerProductCardResponse> BestSellerProducts { get; set; } = [];
            public List<CustomerProductCardResponse> NewArrivalProducts { get; set; } = [];
            public List<CustomerProductCardResponse> TrendingProducts { get; set; } = [];
        }

        public sealed class CustomerProductCardResponse
        {
            public string Id { get; set; } = string.Empty;
            public string CategoryId { get; set; } = string.Empty;
            public string CategoryName { get; set; } = string.Empty;
            public string Name { get; set; } = string.Empty;
            public string Slug { get; set; } = string.Empty;
            public string ImageUrl { get; set; } = string.Empty;

            public decimal Price { get; set; }
            public decimal Mrp { get; set; }
            public decimal Weight { get; set; }
            public string WeightUnit { get; set; } = string.Empty;

            public bool IsInStock { get; set; }
            public bool IsFeatured { get; set; }
            public bool IsBestSeller { get; set; }
            public bool IsNewArrival { get; set; }
            public bool IsTrending { get; set; }
        }
    }
}
