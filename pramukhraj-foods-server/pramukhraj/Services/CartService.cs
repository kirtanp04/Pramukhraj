using System.Data;
using System.Data.Common;
using FluentValidation;
using FluentValidation.Results;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Npgsql;
using pramukhraj.BackgroundServices;
using pramukhraj.Common;
using pramukhraj.Database;
using pramukhraj.DTOs.Cart.Requests;
using pramukhraj.DTOs.Cart.Responses;
using pramukhraj.Entities.Cart;
using pramukhraj.Interfaces;

namespace pramukhraj.Services;

public sealed class CartService(
    AppDbContext db,
    ILogger<CartService> logger,
    CustomerClaimsHelper claimsHelper,
    IValidator<AddCartItemRequest> addValidator,
    IValidator<UpdateCartItemQuantityRequest> quantityValidator,
    IValidator<ChangeCartItemVariantRequest> variantValidator,
    IValidator<UpdateCartItemSelectionRequest> selectionValidator,
    IValidator<ResolveGuestCartRequest> resolveValidator,
    IValidator<MergeGuestCartRequest> mergeValidator,
    IOptions<BackgroundServiceOptions> backgroundOptions) : ICartService
{
    private const int MaximumQuantity = 20;
    private readonly TimeSpan _cartLifetime = TimeSpan.FromDays(backgroundOptions.Value.CartExpirationDays);

    public async Task<ApiResponse<CartResponse>> GetAsync(CancellationToken cancellationToken)
    {
        var customer = await GetActiveCustomerAsync(cancellationToken);
        if (!customer.Success) return Failure(customer);

        try
        {
            await AbandonExpiredCartAsync(customer.Data!.CustomerId, cancellationToken);
            return ApiResponse<CartResponse>.Ok(
                await BuildAuthenticatedCartAsync(customer.Data.CustomerId, cancellationToken));
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { throw; }
        catch (DbException exception)
        {
            logger.LogError(exception, "Database error while loading customer cart.");
            return DatabaseFailure();
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Unexpected error while loading customer cart.");
            return UnexpectedFailure();
        }
    }

    public async Task<ApiResponse<CartResponse>> AddItemAsync(AddCartItemRequest request, CancellationToken cancellationToken)
    {
        var validation = await addValidator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid) return ValidationFailure(validation);
        var customer = await GetActiveCustomerAsync(cancellationToken);
        if (!customer.Success) return Failure(customer);

        try
        {
            var variant = await FindVariantAsync(request.ProductVariantId, cancellationToken);
            var unavailable = ValidateVariantForAddition(variant, request.Quantity);
            if (unavailable is not null) return unavailable;

            await AbandonExpiredCartAsync(customer.Data!.CustomerId, cancellationToken);
            var cart = await db.Carts.Include(x => x.Items).SingleOrDefaultAsync(
                x => x.CustomerId == customer.Data.CustomerId && x.Status == CartStatus.Active, cancellationToken);
            var now = DateTime.UtcNow;
            if (cart is null)
            {
                cart = NewCart(customer.Data.CustomerId, now);
                db.Carts.Add(cart);
            }

            var item = cart.Items.SingleOrDefault(x => x.ProductVariantId == request.ProductVariantId);
            var finalQuantity = (item?.Quantity ?? 0) + request.Quantity;
            if (finalQuantity > MaximumQuantity)
                return ApiResponse<CartResponse>.Fail($"Quantity cannot exceed {MaximumQuantity}.", 400);
            if (finalQuantity > variant!.StockQuantity)
                return ApiResponse<CartResponse>.Fail("Requested quantity exceeds available stock.", 400);

            if (item is null)
            {
                cart.Items.Add(new CartItem
                {
                    Id = Guid.NewGuid(), ProductVariantId = request.ProductVariantId,
                    Quantity = request.Quantity, IsSelected = true, CreatedOn = now, UpdatedOn = now
                });
            }
            else
            {
                item.Quantity = finalQuantity;
                item.UpdatedOn = now;
            }
            Touch(cart, now);
            await db.SaveChangesAsync(cancellationToken);
            return ApiResponse<CartResponse>.Ok(await BuildAuthenticatedCartAsync(customer.Data.CustomerId, cancellationToken), "Item added to cart.");
        }
        catch (DbUpdateConcurrencyException exception) { return ConcurrencyFailure(exception); }
        catch (DbUpdateException exception) when (IsUniqueViolation(exception))
        {
            logger.LogWarning(exception, "A cart uniqueness conflict occurred while adding an item.");
            return ApiResponse<CartResponse>.Fail("The cart changed at the same time. Reload it and try again.", 409);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { throw; }
        catch (DbException exception) { logger.LogError(exception, "Database error while adding a cart item."); return DatabaseFailure(); }
        catch (Exception exception) { logger.LogError(exception, "Unexpected error while adding a cart item."); return UnexpectedFailure(); }
    }

    public Task<ApiResponse<CartResponse>> UpdateQuantityAsync(Guid cartItemId, UpdateCartItemQuantityRequest request, CancellationToken cancellationToken) =>
        ModifyOwnedItemAsync(cartItemId, request.CartVersion, quantityValidator, request, async (cart, item, now) =>
        {
            var variant = await FindVariantAsync(item.ProductVariantId, cancellationToken);
            var unavailable = ValidateVariantForAddition(variant, request.Quantity);
            if (unavailable is not null) return unavailable;
            item.Quantity = request.Quantity;
            item.UpdatedOn = now;
            return null;
        }, "Cart quantity updated.", cancellationToken);

    public async Task<ApiResponse<CartResponse>> RemoveItemAsync(Guid cartItemId, CancellationToken cancellationToken)
    {
        var customer = await GetActiveCustomerAsync(cancellationToken);
        if (!customer.Success) return Failure(customer);
        try
        {
            await AbandonExpiredCartAsync(customer.Data!.CustomerId, cancellationToken);
            var owned = await LoadOwnedItemAsync(customer.Data!.CustomerId, cartItemId, cancellationToken);
            if (owned is null) return ApiResponse<CartResponse>.Fail("Cart item was not found.", 404);
            db.CartItems.Remove(owned.Value.Item);
            Touch(owned.Value.Cart, DateTime.UtcNow);
            await db.SaveChangesAsync(cancellationToken);
            return ApiResponse<CartResponse>.Ok(await BuildAuthenticatedCartAsync(customer.Data.CustomerId, cancellationToken), "Item removed from cart.");
        }
        catch (DbUpdateConcurrencyException exception) { return ConcurrencyFailure(exception); }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { throw; }
        catch (DbException exception) { logger.LogError(exception, "Database error while removing a cart item."); return DatabaseFailure(); }
        catch (Exception exception) { logger.LogError(exception, "Unexpected error while removing a cart item."); return UnexpectedFailure(); }
    }

    public async Task<ApiResponse<CartResponse>> ClearAsync(CancellationToken cancellationToken)
    {
        var customer = await GetActiveCustomerAsync(cancellationToken);
        if (!customer.Success) return Failure(customer);
        try
        {
            await AbandonExpiredCartAsync(customer.Data!.CustomerId, cancellationToken);
            var cart = await db.Carts.Include(x => x.Items).SingleOrDefaultAsync(
                x => x.CustomerId == customer.Data!.CustomerId && x.Status == CartStatus.Active, cancellationToken);
            if (cart is null) return ApiResponse<CartResponse>.Ok(EmptyCart(true), "Cart is already empty.");
            db.CartItems.RemoveRange(cart.Items);
            Touch(cart, DateTime.UtcNow);
            await db.SaveChangesAsync(cancellationToken);
            return ApiResponse<CartResponse>.Ok(await BuildAuthenticatedCartAsync(customer.Data!.CustomerId, cancellationToken), "Cart cleared.");
        }
        catch (DbUpdateConcurrencyException exception) { return ConcurrencyFailure(exception); }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { throw; }
        catch (DbException exception) { logger.LogError(exception, "Database error while clearing a cart."); return DatabaseFailure(); }
        catch (Exception exception) { logger.LogError(exception, "Unexpected error while clearing a cart."); return UnexpectedFailure(); }
    }

    public Task<ApiResponse<CartResponse>> UpdateSelectionAsync(Guid cartItemId, UpdateCartItemSelectionRequest request, CancellationToken cancellationToken) =>
        ModifyOwnedItemAsync(cartItemId, request.CartVersion, selectionValidator, request, (cart, item, now) =>
        {
            item.IsSelected = request.IsSelected;
            item.UpdatedOn = now;
            return Task.FromResult<ApiResponse<CartResponse>?>(null);
        }, "Cart selection updated.", cancellationToken);

    public Task<ApiResponse<CartResponse>> ChangeVariantAsync(Guid cartItemId, ChangeCartItemVariantRequest request, CancellationToken cancellationToken) =>
        ModifyOwnedItemAsync(cartItemId, request.CartVersion, variantValidator, request, async (cart, item, now) =>
        {
            var current = await FindVariantAsync(item.ProductVariantId, cancellationToken);
            var replacement = await FindVariantAsync(request.ProductVariantId, cancellationToken);
            if (current is null || replacement is null || current.ProductId != replacement.ProductId)
                return ApiResponse<CartResponse>.Fail("The selected variant does not belong to this product.", 400);
            var invalid = ValidateVariantForAddition(replacement, item.Quantity);
            if (invalid is not null) return invalid;

            var duplicate = cart.Items.SingleOrDefault(x => x.Id != item.Id && x.ProductVariantId == replacement.Id);
            if (duplicate is not null)
            {
                var finalQuantity = Math.Min(duplicate.Quantity + item.Quantity, Math.Min(replacement.StockQuantity, MaximumQuantity));
                if (finalQuantity <= duplicate.Quantity)
                    return ApiResponse<CartResponse>.Fail("The selected variant cannot accept more quantity.", 400);
                duplicate.Quantity = finalQuantity;
                duplicate.IsSelected |= item.IsSelected;
                duplicate.UpdatedOn = now;
                db.CartItems.Remove(item);
            }
            else item.ProductVariantId = replacement.Id;
            return null;
        }, "Cart variant updated.", cancellationToken);

    public async Task<ApiResponse<CartResponse>> ResolveGuestAsync(ResolveGuestCartRequest request, CancellationToken cancellationToken)
    {
        var validation = await resolveValidator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid) return ValidationFailure(validation);
        try
        {
            if (request.Items.Count == 0) return ApiResponse<CartResponse>.Ok(EmptyCart(false));
            var requestedIds = request.Items.Select(x => x.ProductVariantId).ToArray();
            var variants = await QueryVariants().Where(x => requestedIds.Contains(x.Id)).ToListAsync(cancellationToken);
            var byId = variants.ToDictionary(x => x.Id);
            var response = EmptyCart(false);
            foreach (var requested in request.Items)
            {
                if (!byId.TryGetValue(requested.ProductVariantId, out var variant))
                {
                    response.AvailabilityWarnings.Add(Warning(requested.ProductVariantId, "invalid_variant", "This cart item no longer exists."));
                    continue;
                }
                response.Items.Add(ToItem(variant, null, requested.Quantity, true));
            }
            FinalizeCart(response);
            return ApiResponse<CartResponse>.Ok(response);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { throw; }
        catch (DbException exception) { logger.LogError(exception, "Database error while resolving a guest cart."); return DatabaseFailure(); }
        catch (Exception exception) { logger.LogError(exception, "Unexpected error while resolving a guest cart."); return UnexpectedFailure(); }
    }

    public async Task<ApiResponse<CartResponse>> MergeAsync(MergeGuestCartRequest request, CancellationToken cancellationToken)
    {
        var validation = await mergeValidator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid) return ValidationFailure(validation);
        var customer = await GetActiveCustomerAsync(cancellationToken);
        if (!customer.Success) return Failure(customer);

        try
        {
            var warnings = new List<CartAvailabilityWarningResponse>();
            var strategy = db.Database.CreateExecutionStrategy();
            await strategy.ExecuteAsync(async () =>
            {
                db.ChangeTracker.Clear();
                await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
                await AbandonExpiredCartAsync(customer.Data!.CustomerId, cancellationToken);
                var cart = await db.Carts.Include(x => x.Items).SingleOrDefaultAsync(
                    x => x.CustomerId == customer.Data.CustomerId && x.Status == CartStatus.Active, cancellationToken);
                var now = DateTime.UtcNow;
                if (cart is null)
                {
                    cart = NewCart(customer.Data.CustomerId, now);
                    db.Carts.Add(cart);
                }
                if (cart.LastMergeRequestId == request.MergeRequestId.ToString("N"))
                {
                    await transaction.CommitAsync(cancellationToken);
                    return;
                }

                var ids = request.Items.Select(x => x.ProductVariantId).ToArray();
                var variants = await QueryVariants().Where(x => ids.Contains(x.Id)).ToDictionaryAsync(x => x.Id, cancellationToken);
                foreach (var guestItem in request.Items)
                {
                    if (!variants.TryGetValue(guestItem.ProductVariantId, out var variant) || !variant.ProductActive || !variant.Active)
                    {
                        warnings.Add(Warning(guestItem.ProductVariantId, "unavailable", "An unavailable item was not merged."));
                        continue;
                    }
                    if (variant.StockQuantity <= 0)
                    {
                        warnings.Add(Warning(guestItem.ProductVariantId, "out_of_stock", "An out-of-stock item was not merged."));
                        continue;
                    }
                    var existing = cart.Items.SingleOrDefault(x => x.ProductVariantId == guestItem.ProductVariantId);
                    var original = existing?.Quantity ?? 0;
                    var finalQuantity = Math.Min(original + guestItem.Quantity, Math.Min(variant.StockQuantity, MaximumQuantity));
                    if (finalQuantity < original + guestItem.Quantity)
                        warnings.Add(Warning(guestItem.ProductVariantId, "quantity_adjusted", $"Quantity was limited to {finalQuantity}."));
                    if (existing is null)
                        cart.Items.Add(new CartItem { Id = Guid.NewGuid(), ProductVariantId = guestItem.ProductVariantId, Quantity = finalQuantity, IsSelected = true, CreatedOn = now, UpdatedOn = now });
                    else { existing.Quantity = finalQuantity; existing.UpdatedOn = now; }
                }
                cart.LastMergeRequestId = request.MergeRequestId.ToString("N");
                Touch(cart, now);
                await db.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);
            });
            var result = await BuildAuthenticatedCartAsync(customer.Data!.CustomerId, cancellationToken);
            result.AvailabilityWarnings.InsertRange(0, warnings);
            return ApiResponse<CartResponse>.Ok(result, "Guest cart merged.");
        }
        catch (DbUpdateConcurrencyException exception) { return ConcurrencyFailure(exception); }
        catch (DbUpdateException exception) when (IsUniqueViolation(exception))
        {
            logger.LogWarning(exception, "A unique conflict occurred while merging a cart.");
            return ApiResponse<CartResponse>.Fail("The cart changed at the same time. Reload it and try again.", 409);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { throw; }
        catch (DbException exception) { logger.LogError(exception, "Database error while merging a cart."); return DatabaseFailure(); }
        catch (Exception exception) { logger.LogError(exception, "Unexpected error while merging a cart."); return UnexpectedFailure(); }
    }

    private async Task<ApiResponse<CartResponse>> ModifyOwnedItemAsync<T>(Guid itemId, int expectedVersion, IValidator<T> validator, T request,
        Func<Cart, CartItem, DateTime, Task<ApiResponse<CartResponse>?>> update, string successMessage, CancellationToken cancellationToken)
    {
        if (itemId == Guid.Empty) return ApiResponse<CartResponse>.Fail("A valid cart item ID is required.", 400);
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid) return ValidationFailure(validation);
        var customer = await GetActiveCustomerAsync(cancellationToken);
        if (!customer.Success) return Failure(customer);
        try
        {
            await AbandonExpiredCartAsync(customer.Data!.CustomerId, cancellationToken);
            var owned = await LoadOwnedItemAsync(customer.Data!.CustomerId, itemId, cancellationToken);
            if (owned is null) return ApiResponse<CartResponse>.Fail("Cart item was not found.", 404);
            if (owned.Value.Cart.Version != expectedVersion)
                return ApiResponse<CartResponse>.Fail("The cart was modified elsewhere. Reload it and try again.", 409);
            var error = await update(owned.Value.Cart, owned.Value.Item, DateTime.UtcNow);
            if (error is not null) return error;
            Touch(owned.Value.Cart, DateTime.UtcNow);
            await db.SaveChangesAsync(cancellationToken);
            return ApiResponse<CartResponse>.Ok(await BuildAuthenticatedCartAsync(customer.Data.CustomerId, cancellationToken), successMessage);
        }
        catch (DbUpdateConcurrencyException exception) { return ConcurrencyFailure(exception); }
        catch (DbUpdateException exception) when (IsUniqueViolation(exception)) { logger.LogWarning(exception, "Cart item uniqueness conflict."); return ApiResponse<CartResponse>.Fail("The cart changed at the same time. Reload it and try again.", 409); }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { throw; }
        catch (DbException exception) { logger.LogError(exception, "Database error while updating a cart item."); return DatabaseFailure(); }
        catch (Exception exception) { logger.LogError(exception, "Unexpected error while updating a cart item."); return UnexpectedFailure(); }
    }

    private async Task<ApiResponse<CustomerClaims>> GetActiveCustomerAsync(CancellationToken cancellationToken)
    {
        var claims = claimsHelper.GetCustomer();
        if (!claims.Success || claims.Data is null) return claims;
        var valid = await db.Customers.AsNoTracking().AnyAsync(x => x.Id == claims.Data.CustomerId && x.IsActive && !x.IsBlocked && !x.IsDeleted, cancellationToken);
        return valid ? claims : ApiResponse<CustomerClaims>.Fail("Invalid or expired customer session.", 401);
    }

    private async Task<(Cart Cart, CartItem Item)?> LoadOwnedItemAsync(Guid customerId, Guid itemId, CancellationToken cancellationToken)
    {
        var cart = await db.Carts.Include(x => x.Items).SingleOrDefaultAsync(
            x => x.CustomerId == customerId && x.Status == CartStatus.Active && x.Items.Any(i => i.Id == itemId), cancellationToken);
        var item = cart?.Items.SingleOrDefault(x => x.Id == itemId);
        return cart is null || item is null ? null : (cart, item);
    }

    private async Task<CartResponse> BuildAuthenticatedCartAsync(Guid customerId, CancellationToken cancellationToken)
    {
        var cart = await db.Carts.AsNoTracking().Where(x => x.CustomerId == customerId && x.Status == CartStatus.Active)
            .Select(x => new { x.Id, x.Version }).SingleOrDefaultAsync(cancellationToken);
        if (cart is null) return EmptyCart(true);
        var variants = await QueryVariants().Where(x => db.CartItems.Any(i => i.CartId == cart.Id && i.ProductVariantId == x.Id))
            .ToListAsync(cancellationToken);
        var cartItems = await db.CartItems.AsNoTracking().Where(x => x.CartId == cart.Id)
            .Select(x => new { x.Id, x.ProductVariantId, x.Quantity, x.IsSelected }).ToListAsync(cancellationToken);
        var byId = variants.ToDictionary(x => x.Id);
        var response = EmptyCart(true);
        response.CartId = cart.Id;
        response.CartVersion = cart.Version;
        foreach (var cartItem in cartItems)
        {
            if (!byId.TryGetValue(cartItem.ProductVariantId, out var variant))
            {
                response.AvailabilityWarnings.Add(Warning(cartItem.ProductVariantId, "invalid_variant", "This cart item no longer exists."));
                continue;
            }
            response.Items.Add(ToItem(variant, cartItem.Id, cartItem.Quantity, cartItem.IsSelected));
        }
        FinalizeCart(response);
        return response;
    }

    private IQueryable<VariantProjection> QueryVariants() => db.ProductVariants.AsNoTracking().Select(v => new VariantProjection
    {
        Id = v.Id, ProductId = v.ProductId, ProductName = v.Product.Name, ProductSlug = v.Product.Slug,
        ProductActive = v.Product.IsActive, Name = v.Name, SKU = v.SKU, Price = v.Price, MRP = v.MRP,
        StockQuantity = v.StockQuantity, Weight = v.Weight, WeightUnit = v.WeightUnit, Active = v.IsActive,
        OtherVariants = v.Product.Variants.Where(o => o.IsActive).Select(o => new VariantOptionProjection
        {
            Id = o.Id, Name = o.Name, Price = o.Price, MRP = o.MRP, StockQuantity = o.StockQuantity,
            Weight = o.Weight, WeightUnit = o.WeightUnit, Active = o.IsActive
        }).ToList()
    });

    private static CartItemResponse ToItem(VariantProjection v, Guid? itemId, int quantity, bool selected)
    {
        var status = StockStatus(v.ProductActive, v.Active, v.StockQuantity);
        var available = v.ProductActive && v.Active && v.StockQuantity > 0 && quantity <= v.StockQuantity;
        return new CartItemResponse
        {
            CartItemId = itemId, ProductId = v.ProductId, ProductName = v.ProductName, ProductSlug = v.ProductSlug,
            ProductVariantId = v.Id, VariantName = v.Name, SKU = v.SKU, Quantity = quantity,
            Price = v.Price, MRP = v.MRP, Weight = v.Weight, WeightUnit = v.WeightUnit,
            AvailableStock = Math.Max(0, v.StockQuantity), StockStatus = status, StockMessage = StockMessage(status, v.StockQuantity),
            IsProductActive = v.ProductActive, IsVariantActive = v.Active, IsAvailable = available,
            CanIncreaseQuantity = available && quantity < Math.Min(v.StockQuantity, MaximumQuantity), CanDecreaseQuantity = quantity > 1,
            IsSelected = selected, ImageUrl = string.Empty, LineSubtotal = v.Price * quantity,
            LineMRP = v.MRP * quantity, LineDiscount = Math.Max(0, (v.MRP - v.Price) * quantity),
            OtherVariants = v.OtherVariants.Select(o =>
            {
                var optionStatus = StockStatus(v.ProductActive, o.Active, o.StockQuantity);
                return new CartVariantOptionResponse
                {
                    VariantId = o.Id, Name = o.Name, Price = o.Price, MRP = o.MRP, Weight = o.Weight,
                    WeightUnit = o.WeightUnit, AvailableStock = Math.Max(0, o.StockQuantity), StockStatus = optionStatus,
                    IsActive = o.Active, IsCurrentVariant = o.Id == v.Id,
                    CanSelect = v.ProductActive && o.Active && o.StockQuantity > 0
                };
            }).ToList()
        };
    }

    private static void FinalizeCart(CartResponse response)
    {
        response.DistinctItemCount = response.Items.Count;
        response.TotalItemCount = response.Items.Sum(x => x.Quantity);
        var selected = response.Items.Where(x => x.IsSelected).ToList();
        response.Subtotal = selected.Sum(x => x.LineSubtotal);
        response.TotalMRP = selected.Sum(x => x.LineMRP);
        response.TotalDiscount = selected.Sum(x => x.LineDiscount);
        foreach (var item in response.Items.Where(x => !x.IsAvailable))
            response.AvailabilityWarnings.Add(Warning(item.ProductVariantId, "unavailable", item.StockMessage));
        response.CanCheckout = selected.Count > 0 && selected.All(x => x.IsAvailable);
    }

    private static CartResponse EmptyCart(bool authenticated) => new() { IsAuthenticatedCart = authenticated };
    private static CartAvailabilityWarningResponse Warning(Guid? id, string code, string message) => new() { ProductVariantId = id, Code = code, Message = message };
    private static CartStockStatus StockStatus(bool productActive, bool variantActive, int stock) =>
        !productActive || !variantActive ? CartStockStatus.Unavailable : stock <= 0 ? CartStockStatus.OutOfStock : stock <= 4 ? CartStockStatus.LowStock : CartStockStatus.InStock;
    private static string StockMessage(CartStockStatus status, int stock) => status switch
    {
        CartStockStatus.InStock => "In stock", CartStockStatus.LowStock => $"Hurry! Only {stock} left",
        CartStockStatus.OutOfStock => "Currently out of stock", _ => "This item is currently unavailable"
    };

    private async Task<VariantProjection?> FindVariantAsync(Guid id, CancellationToken cancellationToken) =>
        await QueryVariants().SingleOrDefaultAsync(x => x.Id == id, cancellationToken);

    private static ApiResponse<CartResponse>? ValidateVariantForAddition(VariantProjection? variant, int quantity)
    {
        if (variant is null) return ApiResponse<CartResponse>.Fail("Product variant was not found.", 404);
        if (!variant.ProductActive) return ApiResponse<CartResponse>.Fail("This product is unavailable.", 400);
        if (!variant.Active) return ApiResponse<CartResponse>.Fail("This product variant is unavailable.", 400);
        if (variant.StockQuantity <= 0) return ApiResponse<CartResponse>.Fail("This product variant is out of stock.", 409);
        if (quantity > variant.StockQuantity) return ApiResponse<CartResponse>.Fail("Requested quantity exceeds available stock.", 400);
        return null;
    }

    private async Task AbandonExpiredCartAsync(Guid customerId, CancellationToken cancellationToken)
    {
        await db.Carts.Where(x => x.CustomerId == customerId && x.Status == CartStatus.Active && x.ExpiresOn != null && x.ExpiresOn <= DateTime.UtcNow)
            .ExecuteUpdateAsync(x => x
                .SetProperty(c => c.Status, CartStatus.Abandoned)
                .SetProperty(c => c.UpdatedOn, DateTime.UtcNow)
                .SetProperty(c => c.Version, c => c.Version + 1), cancellationToken);
    }

    private Cart NewCart(Guid customerId, DateTime now) => new()
    {
        Id = Guid.NewGuid(), CustomerId = customerId, Status = CartStatus.Active, Version = 0,
        CreatedOn = now, UpdatedOn = now, ExpiresOn = now.Add(_cartLifetime)
    };

    private void Touch(Cart cart, DateTime now)
    {
        cart.Version++;
        cart.UpdatedOn = now;
        cart.ExpiresOn = now.Add(_cartLifetime);
        cart.ConcurrencyStamp = Guid.NewGuid().ToString("N");
    }

    private ApiResponse<CartResponse> ConcurrencyFailure(Exception exception)
    {
        logger.LogWarning(exception, "Concurrent cart update rejected.");
        return ApiResponse<CartResponse>.Fail("The cart was modified elsewhere. Reload it and try again.", 409);
    }

    private static bool IsUniqueViolation(DbUpdateException exception) => exception.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation };
    private static ApiResponse<CartResponse> Failure(ApiResponse<CustomerClaims> response) => ApiResponse<CartResponse>.Fail(response.Message, response.StatusCode, response.Errors);
    private static ApiResponse<CartResponse> ValidationFailure(ValidationResult validation) => ApiResponse<CartResponse>.Fail(
        "Please correct the highlighted fields.", 400,
        validation.Errors.GroupBy(x => x.PropertyName).ToDictionary(x => x.Key, x => x.Select(e => e.ErrorMessage).Distinct().ToArray()));
    private static ApiResponse<CartResponse> DatabaseFailure() => ApiResponse<CartResponse>.Fail("Unable to process the cart right now.", 500);
    private static ApiResponse<CartResponse> UnexpectedFailure() => ApiResponse<CartResponse>.Fail("An unexpected error occurred while processing the cart.", 500);

    private sealed class VariantProjection
    {
        public Guid Id { get; set; }
        public Guid ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string ProductSlug { get; set; } = string.Empty;
        public bool ProductActive { get; set; }
        public string Name { get; set; } = string.Empty;
        public string SKU { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public decimal MRP { get; set; }
        public int StockQuantity { get; set; }
        public decimal Weight { get; set; }
        public string WeightUnit { get; set; } = string.Empty;
        public bool Active { get; set; }
        public List<VariantOptionProjection> OtherVariants { get; set; } = [];
    }

    private sealed class VariantOptionProjection
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public decimal MRP { get; set; }
        public int StockQuantity { get; set; }
        public decimal Weight { get; set; }
        public string WeightUnit { get; set; } = string.Empty;
        public bool Active { get; set; }
    }
}
