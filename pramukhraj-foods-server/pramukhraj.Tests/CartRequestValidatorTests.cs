using pramukhraj.DTOs.Cart.Requests;
using pramukhraj.Validators.Cart;
using Xunit;

namespace pramukhraj.Tests;

public sealed class CartRequestValidatorTests
{
    [Fact]
    public void AddItem_RejectsInvalidQuantity() =>
        Assert.False(new AddCartItemRequestValidator().Validate(new AddCartItemRequest { ProductVariantId = Guid.NewGuid(), Quantity = 21 }).IsValid);

    [Fact]
    public void ResolveGuest_RejectsDuplicateVariants()
    {
        var id = Guid.NewGuid();
        var request = new ResolveGuestCartRequest { Items = [new() { ProductVariantId = id, Quantity = 1 }, new() { ProductVariantId = id, Quantity = 2 }] };
        Assert.False(new ResolveGuestCartRequestValidator().Validate(request).IsValid);
    }

    [Fact]
    public void Merge_RequiresIdempotencyKey() =>
        Assert.False(new MergeGuestCartRequestValidator().Validate(new MergeGuestCartRequest()).IsValid);

    [Fact]
    public void QuantityUpdate_RequiresCartVersion() =>
        Assert.False(new UpdateCartItemQuantityRequestValidator().Validate(new UpdateCartItemQuantityRequest { Quantity = 2, CartVersion = 0 }).IsValid);
}
