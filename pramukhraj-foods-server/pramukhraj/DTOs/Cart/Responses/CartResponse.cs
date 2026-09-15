namespace pramukhraj.DTOs.Cart.Responses;

public sealed class CartResponse
{
    public Guid? CartId { get; set; }
    public int CartVersion { get; set; }
    public bool IsAuthenticatedCart { get; set; }
    public int TotalItemCount { get; set; }
    public int DistinctItemCount { get; set; }
    public decimal Subtotal { get; set; }
    public decimal TotalMRP { get; set; }
    public decimal TotalDiscount { get; set; }
    public bool CanCheckout { get; set; }
    public List<CartAvailabilityWarningResponse> AvailabilityWarnings { get; set; } = [];
    public List<CartItemResponse> Items { get; set; } = [];
}
