namespace pramukhraj.DTOs.Cart.Requests;

public sealed class MergeGuestCartRequest
{
    public Guid MergeRequestId { get; set; }
    public List<GuestCartItemRequest> Items { get; set; } = [];
}
