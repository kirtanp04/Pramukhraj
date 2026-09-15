namespace pramukhraj.DTOs.Cart.Requests;

public sealed class AddCartItemRequest
{
    public Guid ProductVariantId { get; set; }
    public int Quantity { get; set; }
}
