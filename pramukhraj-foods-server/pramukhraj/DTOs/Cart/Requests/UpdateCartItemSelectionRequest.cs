namespace pramukhraj.DTOs.Cart.Requests;

public sealed class UpdateCartItemSelectionRequest
{
    public bool IsSelected { get; set; }
    public int CartVersion { get; set; }
}
