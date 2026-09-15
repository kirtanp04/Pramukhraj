using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using pramukhraj.DTOs.Cart.Requests;
using pramukhraj.Interfaces;

namespace pramukhraj.Controllers;

[ApiController]
public sealed class CustomerCartController(IServiceManager serviceManager) : ControllerBase
{
    [HttpGet("api/customer/cart")]
    [Authorize(Roles = "Customer")]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var response = await serviceManager.CartService.GetAsync(cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpPost("api/customer/cart/items")]
    [Authorize(Roles = "Customer")]
    [EnableRateLimiting("cart-mutation")]
    public async Task<IActionResult> Add([FromBody] AddCartItemRequest request, CancellationToken cancellationToken)
    {
        var response = await serviceManager.CartService.AddItemAsync(request, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpPatch("api/customer/cart/items/{cartItemId:guid}")]
    [Authorize(Roles = "Customer")]
    [EnableRateLimiting("cart-mutation")]
    public async Task<IActionResult> UpdateQuantity(Guid cartItemId, [FromBody] UpdateCartItemQuantityRequest request, CancellationToken cancellationToken)
    {
        var response = await serviceManager.CartService.UpdateQuantityAsync(cartItemId, request, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpDelete("api/customer/cart/items/{cartItemId:guid}")]
    [Authorize(Roles = "Customer")]
    [EnableRateLimiting("cart-mutation")]
    public async Task<IActionResult> Remove(Guid cartItemId, CancellationToken cancellationToken)
    {
        var response = await serviceManager.CartService.RemoveItemAsync(cartItemId, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpDelete("api/customer/cart")]
    [Authorize(Roles = "Customer")]
    [EnableRateLimiting("cart-mutation")]
    public async Task<IActionResult> Clear(CancellationToken cancellationToken)
    {
        var response = await serviceManager.CartService.ClearAsync(cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpPatch("api/customer/cart/items/{cartItemId:guid}/selection")]
    [Authorize(Roles = "Customer")]
    [EnableRateLimiting("cart-mutation")]
    public async Task<IActionResult> UpdateSelection(Guid cartItemId, [FromBody] UpdateCartItemSelectionRequest request, CancellationToken cancellationToken)
    {
        var response = await serviceManager.CartService.UpdateSelectionAsync(cartItemId, request, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpPatch("api/customer/cart/items/{cartItemId:guid}/variant")]
    [Authorize(Roles = "Customer")]
    [EnableRateLimiting("cart-mutation")]
    public async Task<IActionResult> ChangeVariant(Guid cartItemId, [FromBody] ChangeCartItemVariantRequest request, CancellationToken cancellationToken)
    {
        var response = await serviceManager.CartService.ChangeVariantAsync(cartItemId, request, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpPost("api/customer/cart/merge")]
    [Authorize(Roles = "Customer")]
    [EnableRateLimiting("cart-mutation")]
    public async Task<IActionResult> Merge([FromBody] MergeGuestCartRequest request, CancellationToken cancellationToken)
    {
        var response = await serviceManager.CartService.MergeAsync(request, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpPost("api/guest/cart/resolve")]
    [AllowAnonymous]
    [EnableRateLimiting("guest-cart-resolve")]
    public async Task<IActionResult> ResolveGuest([FromBody] ResolveGuestCartRequest request, CancellationToken cancellationToken)
    {
        var response = await serviceManager.CartService.ResolveGuestAsync(request, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }
}
