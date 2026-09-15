namespace pramukhraj.DTOs.Cart.Responses;

public sealed class CartAvailabilityWarningResponse
{
    public Guid? ProductVariantId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}
