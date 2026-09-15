namespace pramukhraj.DTOs.Cart.Requests;

public sealed class ResolveGuestCartRequest
{
    public List<GuestCartItemRequest> Items { get; set; } = [];
}

public sealed class GuestCartItemRequest
{
    public Guid ProductVariantId { get; set; }
    public int Quantity { get; set; }
}
