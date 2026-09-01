namespace pramukhraj.DTOs.Product
{
    public class ProductInventoryRequestResponse
    {
        public class ProductInventoryResponse
        {
            public string Id { get; set; } = string.Empty;
            public string ProductId { get; set; } = string.Empty;
            public string Name { get; set; } = string.Empty;
            public string Slug { get; set; } = string.Empty;
            public string CategoryId { get; set; } = string.Empty;
            public string CategoryName { get; set; } = string.Empty;
            public int Stock{ get; set; } = 0;
            public string ImageUrl { get; set; } = string.Empty;
            public decimal Weight { get; set; } = 0;
            public string WeightUnit { get; set; } = string.Empty;
            public bool IsVariantActive { get; set; } = true;
            public bool IsProductActive { get; set; } = true;
        }

        public sealed class UpdateProductVariantInventoryRequest
        {
            public Guid ProductId { get; set; }
            public Guid VariantId { get; set; }
            public int Stock { get; set; }
            public bool IsActive { get; set; }
        }

        public sealed class UpdateProductVariantInventoryResponse
        {
            public Guid ProductId { get; set; }
            public Guid VariantId { get; set; }
            public int Stock { get; set; }
            public bool IsActive { get; set; }

        }
    }
}
