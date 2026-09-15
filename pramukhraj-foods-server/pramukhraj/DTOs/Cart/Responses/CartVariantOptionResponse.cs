namespace pramukhraj.DTOs.Cart.Responses;

public sealed class CartVariantOptionResponse
{
    public Guid VariantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public decimal MRP { get; set; }
    public decimal Weight { get; set; }
    public string WeightUnit { get; set; } = string.Empty;
    public int AvailableStock { get; set; }
    public CartStockStatus StockStatus { get; set; }
    public bool IsActive { get; set; }
    public bool IsCurrentVariant { get; set; }
    public bool CanSelect { get; set; }
}
