using pramukhraj.Common;
using pramukhraj.DTOs.Cart.Requests;
using pramukhraj.DTOs.Cart.Responses;

namespace pramukhraj.Interfaces;

public interface ICartService
{
    Task<ApiResponse<CartResponse>> GetAsync(CancellationToken cancellationToken);
    Task<ApiResponse<CartResponse>> AddItemAsync(AddCartItemRequest request, CancellationToken cancellationToken);
    Task<ApiResponse<CartResponse>> UpdateQuantityAsync(Guid cartItemId, UpdateCartItemQuantityRequest request, CancellationToken cancellationToken);
    Task<ApiResponse<CartResponse>> RemoveItemAsync(Guid cartItemId, CancellationToken cancellationToken);
    Task<ApiResponse<CartResponse>> ClearAsync(CancellationToken cancellationToken);
    Task<ApiResponse<CartResponse>> UpdateSelectionAsync(Guid cartItemId, UpdateCartItemSelectionRequest request, CancellationToken cancellationToken);
    Task<ApiResponse<CartResponse>> ChangeVariantAsync(Guid cartItemId, ChangeCartItemVariantRequest request, CancellationToken cancellationToken);
    Task<ApiResponse<CartResponse>> ResolveGuestAsync(ResolveGuestCartRequest request, CancellationToken cancellationToken);
    Task<ApiResponse<CartResponse>> MergeAsync(MergeGuestCartRequest request, CancellationToken cancellationToken);
}
