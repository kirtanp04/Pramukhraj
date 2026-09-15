namespace pramukhraj.DTOs.Cart.Responses;

public sealed class CartItemResponse
{
    public Guid? CartItemId { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ProductSlug { get; set; } = string.Empty;
    public Guid ProductVariantId { get; set; }
    public string VariantName { get; set; } = string.Empty;
    public string SKU { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal Price { get; set; }
    public decimal MRP { get; set; }
    public decimal Weight { get; set; }
    public string WeightUnit { get; set; } = string.Empty;
    public int AvailableStock { get; set; }
    public CartStockStatus StockStatus { get; set; }
    public string StockMessage { get; set; } = string.Empty;
    public bool IsProductActive { get; set; }
    public bool IsVariantActive { get; set; }
    public bool IsAvailable { get; set; }
    public bool CanIncreaseQuantity { get; set; }
    public bool CanDecreaseQuantity { get; set; }
    public bool IsSelected { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public List<CartVariantOptionResponse> OtherVariants { get; set; } = [];
    public decimal LineSubtotal { get; set; }
    public decimal LineMRP { get; set; }
    public decimal LineDiscount { get; set; }
}

public enum CartStockStatus
{
    InStock = 1,
    LowStock = 2,
    OutOfStock = 3,
    Unavailable = 4
}
