namespace pramukhraj.DTOs.Cart.Requests;

public sealed class ChangeCartItemVariantRequest
{
    public Guid ProductVariantId { get; set; }
    public int CartVersion { get; set; }
}
