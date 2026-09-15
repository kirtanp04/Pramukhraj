namespace pramukhraj.DTOs.Cart.Requests;

public sealed class UpdateCartItemQuantityRequest
{
    public int Quantity { get; set; }
    public int CartVersion { get; set; }
}
