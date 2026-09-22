using FluentValidation.Results;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using pramukhraj.Common;
using pramukhraj.Database;
using pramukhraj.DTOs.Checkout;
using pramukhraj.Entities.Cart;
using pramukhraj.Entities.Checkout;
using pramukhraj.Entities.Coupon;
using pramukhraj.Interfaces;
using static pramukhraj.Entities.Coupon.CouponEnums;

namespace pramukhraj.Services;

public sealed class CheckoutService(
    AppDbContext db,
    CustomerClaimsHelper claimsHelper,
    IValidatorManager validatorManager,
    IPricingService pricingService,
    IShiprocketRateService shiprocketRateService,
    IStoreSettingsService storeSettingsService,
    ILogger<CheckoutService> logger) : ICheckoutService
{
    private static readonly TimeSpan SessionLifetime = TimeSpan.FromMinutes(15);
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task<ApiResponse<CheckoutSessionResponse>> InitializeAsync(
        InitializeCheckoutRequest request,
        CancellationToken cancellationToken = default)
    {
        var validation = await validatorManager.InitializeCheckoutRequest.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid) return ValidationFailure(validation);
        var access = await GetVerifiedCustomerIdAsync(cancellationToken);
        if (!access.Success) return Failure(access);
        try
        {
            var cart = await LoadCartAsync(access.Data, cancellationToken);
            var cartFailure = ValidateCart(cart);
            if (cartFailure is not null) return cartFailure;
            var addresses = await ResolveAddressesAsync(
                access.Data, request.ShippingAddressId, request.BillingAddressId, true, cancellationToken);
            if (!addresses.Success) return ApiResponse<CheckoutSessionResponse>.Fail(addresses.Message, addresses.StatusCode, addresses.Errors);

            var quote = addresses.Shipping is null ? null : await GetBestRateAsync(cart!, addresses.Shipping.PostalCode, cancellationToken);
            var settings = await storeSettingsService.GetCurrentAsync(cancellationToken);
            var customerShipping = IsFreeShipping(settings.FreeShippingMinimumAmount, CartSubtotal(cart!), 0, false)
                ? 0 : quote?.Rate ?? 0;
            var pricing = pricingService.Calculate(new PricingCalculationRequest(
                cart!.Lines.Select(ToPricingLine).ToArray(), 0, customerShipping, quote?.Rate ?? 0,
                0m, settings.PaymentServiceTaxRatePercent ?? 0m));
            var now = DateTime.UtcNow;
            var session = new CheckoutSession
            {
                Id = Guid.NewGuid(), CustomerId = access.Data, CartId = cart.Id, CartVersion = cart.Version,
                ShippingAddressId = addresses.Shipping?.Id, BillingAddressId = addresses.Billing?.Id,
                ExpiresOn = now.Add(SessionLifetime), CreatedOn = now, UpdatedOn = now
            };
            Apply(session, pricing, quote, null);
            db.CheckoutSessions.Add(session);
            await db.SaveChangesAsync(cancellationToken);
            return new ApiResponse<CheckoutSessionResponse>
            {
                Success = true, StatusCode = 201, Message = "Checkout initialized successfully.",
                Data = ToResponse(session, cart, pricing, quote, Warnings(addresses.Shipping, quote))
            };
        }
        catch (ShiprocketProviderException exception)
        {
            return ApiResponse<CheckoutSessionResponse>.Fail(exception.Message, exception.StatusCode);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { throw; }
        catch (Exception exception)
        {
            logger.LogError(exception, "Checkout initialization failed for customer {CustomerId}.", access.Data);
            return UnexpectedFailure();
        }
    }

    public async Task<ApiResponse<CheckoutSessionResponse>> GetAsync(Guid checkoutSessionId, CancellationToken cancellationToken = default)
    {
        var context = await LoadOwnedSessionAsync(checkoutSessionId, cancellationToken);
        if (!context.Success) return ApiResponse<CheckoutSessionResponse>.Fail(context.Message, context.StatusCode, context.Errors);
        var cart = await LoadCartAsync(context.CustomerId, cancellationToken);
        var cartFailure = ValidateCartForSession(cart, context.Session!);
        if (cartFailure is not null) return cartFailure;
        var quote = ReadQuote(context.Session!);
        if (context.Session!.ShippingAddressId.HasValue &&
            (quote is null || quote.QuoteExpiresOn <= DateTime.UtcNow))
        {
            return await RecalculateAsync(
                checkoutSessionId, null, null, null, false, false, cancellationToken);
        }
        var settings = await storeSettingsService.GetCurrentAsync(cancellationToken);
        var freeShippingCoupon = await IsFreeShippingCouponAsync(context.Session!.CouponId, cancellationToken);
        var customerShipping = IsFreeShipping(settings.FreeShippingMinimumAmount, CartSubtotal(cart!),
            context.Session.CouponDiscountAmount, freeShippingCoupon) ? 0 : quote?.Rate ?? 0;
        var pricing = pricingService.Calculate(new PricingCalculationRequest(
            cart!.Lines.Select(ToPricingLine).ToArray(), context.Session!.CouponDiscountAmount,
            customerShipping, quote?.Rate ?? 0, 0m, settings.PaymentServiceTaxRatePercent ?? 0m));
        if (!AmountsMatch(context.Session, pricing))
            return ApiResponse<CheckoutSessionResponse>.Fail("Cart prices changed. Refresh checkout to continue.", 409);
        return ApiResponse<CheckoutSessionResponse>.Ok(
            ToResponse(context.Session, cart, pricing, quote, Warnings(context.Session.ShippingAddressId, quote)));
    }

    public async Task<ApiResponse<CheckoutSessionResponse>> UpdateAddressAsync(
        Guid checkoutSessionId,
        UpdateCheckoutAddressRequest request,
        CancellationToken cancellationToken = default)
    {
        var validation = await validatorManager.UpdateCheckoutAddressRequest.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid) return ValidationFailure(validation);
        return await RecalculateAsync(checkoutSessionId, request.ShippingAddressId,
            request.BillingAddressId, null, false, true, cancellationToken);
    }

    public async Task<ApiResponse<CheckoutSessionResponse>> ApplyCouponAsync(
        Guid checkoutSessionId,
        ApplyCheckoutCouponRequest request,
        CancellationToken cancellationToken = default)
    {
        var validation = await validatorManager.ApplyCheckoutCouponRequest.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid) return ValidationFailure(validation);
        return await RecalculateAsync(checkoutSessionId, null, null, request.CouponCode.Trim().ToUpperInvariant(), false, false, cancellationToken);
    }

    public Task<ApiResponse<CheckoutSessionResponse>> RemoveCouponAsync(
        Guid checkoutSessionId,
        CancellationToken cancellationToken = default) =>
        RecalculateAsync(checkoutSessionId, null, null, string.Empty, true, false, cancellationToken);

    public Task<ApiResponse<CheckoutSessionResponse>> RefreshAsync(
        Guid checkoutSessionId,
        CancellationToken cancellationToken = default) =>
        RecalculateAsync(checkoutSessionId, null, null, null, false, false, cancellationToken);

    private async Task<ApiResponse<CheckoutSessionResponse>> RecalculateAsync(
        Guid checkoutSessionId,
        Guid? shippingAddressId,
        Guid? billingAddressId,
        string? couponCode,
        bool removeCoupon,
        bool updateAddresses,
        CancellationToken cancellationToken)
    {
        var context = await LoadOwnedSessionAsync(checkoutSessionId, cancellationToken);
        if (!context.Success) return ApiResponse<CheckoutSessionResponse>.Fail(context.Message, context.StatusCode, context.Errors);
        var session = context.Session!;
        try
        {
            var cart = await LoadCartAsync(context.CustomerId, cancellationToken);
            var cartFailure = ValidateCart(cart);
            if (cartFailure is not null) return cartFailure;
            var effectiveShippingId = updateAddresses ? shippingAddressId : shippingAddressId ?? session.ShippingAddressId;
            var effectiveBillingId = updateAddresses ? billingAddressId : billingAddressId ?? session.BillingAddressId;
            var addresses = await ResolveAddressesAsync(
                context.CustomerId, effectiveShippingId, effectiveBillingId, false, cancellationToken);
            if (!addresses.Success) return ApiResponse<CheckoutSessionResponse>.Fail(addresses.Message, addresses.StatusCode, addresses.Errors);

            var quote = addresses.Shipping is null ? null : await GetBestRateAsync(cart!, addresses.Shipping.PostalCode, cancellationToken);
            CouponResult? coupon = null;
            var requestedCoupon = removeCoupon ? null : couponCode ?? session.CouponCode;
            if (!string.IsNullOrWhiteSpace(requestedCoupon))
            {
                var couponResponse = await ValidateCouponAsync(requestedCoupon, context.CustomerId, cart!, cancellationToken);
                if (!couponResponse.Success)
                    return ApiResponse<CheckoutSessionResponse>.Fail(couponResponse.Message, couponResponse.StatusCode, couponResponse.Errors);
                coupon = couponResponse.Data;
            }
            var settings = await storeSettingsService.GetCurrentAsync(cancellationToken);
            var customerShipping = IsFreeShipping(settings.FreeShippingMinimumAmount, CartSubtotal(cart!),
                coupon?.Discount ?? 0, coupon?.FreeShipping == true) ? 0 : quote?.Rate ?? 0;
            var pricing = pricingService.Calculate(new PricingCalculationRequest(
                cart!.Lines.Select(ToPricingLine).ToArray(), coupon?.Discount ?? 0,
                customerShipping, quote?.Rate ?? 0, 0m, settings.PaymentServiceTaxRatePercent ?? 0m));
            session.CartId = cart.Id;
            session.CartVersion = cart.Version;
            session.ShippingAddressId = addresses.Shipping?.Id;
            session.BillingAddressId = addresses.Billing?.Id;
            session.UpdatedOn = DateTime.UtcNow;
            session.ExpiresOn = session.UpdatedOn.Add(SessionLifetime);
            session.ConcurrencyStamp = Guid.NewGuid().ToString("N");
            Apply(session, pricing, quote, coupon);
            await db.SaveChangesAsync(cancellationToken);
            var message = removeCoupon ? "Coupon removed successfully."
                : couponCode is not null ? "Coupon applied successfully."
                : "Checkout refreshed successfully.";
            return ApiResponse<CheckoutSessionResponse>.Ok(
                ToResponse(session, cart, pricing, quote, Warnings(addresses.Shipping, quote)), message);
        }
        catch (ShiprocketProviderException exception)
        {
            return ApiResponse<CheckoutSessionResponse>.Fail(exception.Message, exception.StatusCode);
        }
        catch (DbUpdateConcurrencyException)
        {
            return ApiResponse<CheckoutSessionResponse>.Fail("Checkout changed elsewhere. Refresh and try again.", 409);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { throw; }
        catch (Exception exception)
        {
            logger.LogError(exception, "Checkout recalculation failed for session {CheckoutSessionId}.", checkoutSessionId);
            return UnexpectedFailure();
        }
    }

    private async Task<CartProjection?> LoadCartAsync(Guid customerId, CancellationToken cancellationToken)
    {
        var cart = await db.Carts.AsNoTracking().Where(x => x.CustomerId == customerId && x.Status == CartStatus.Active)
            .Select(x => new CartProjection
            {
                Id = x.Id, Version = x.Version,
                Lines = x.Items.Where(item => item.IsSelected).Select(item => new CheckoutLine
                {
                    ProductId = item.ProductVariant.ProductId,
                    CategoryId = item.ProductVariant.Product.CategoryId,
                    ProductName = item.ProductVariant.Product.Name,
                    ProductSlug = item.ProductVariant.Product.Slug,
                    ProductActive = item.ProductVariant.Product.IsActive,
                    VariantId = item.ProductVariantId,
                    VariantName = item.ProductVariant.Name,
                    Sku = item.ProductVariant.SKU,
                    VariantActive = item.ProductVariant.IsActive,
                    Quantity = item.Quantity,
                    StockQuantity = item.ProductVariant.StockQuantity,
                    UnitPrice = item.ProductVariant.Price,
                    UnitMrp = item.ProductVariant.MRP,
                    Weight = item.ProductVariant.Weight,
                    WeightUnit = item.ProductVariant.WeightUnit
                }).ToList()
            }).SingleOrDefaultAsync(cancellationToken);
        if (cart is not null)
            foreach (var line in cart.Lines) line.WeightKg = WeightKg(line.Weight, line.WeightUnit);
        return cart;
    }

    private static ApiResponse<CheckoutSessionResponse>? ValidateCart(CartProjection? cart)
    {
        if (cart is null || cart.Lines.Count == 0)
            return ApiResponse<CheckoutSessionResponse>.Fail("Your selected cart is empty.", 409);
        if (cart.Lines.Any(x => !x.ProductActive || !x.VariantActive))
            return ApiResponse<CheckoutSessionResponse>.Fail("A selected product is no longer available. Review your cart.", 409);
        if (cart.Lines.Any(x => x.Quantity <= 0 || x.Quantity > x.StockQuantity))
            return ApiResponse<CheckoutSessionResponse>.Fail("Stock changed for a selected product. Review your cart.", 409);
        if (cart.Lines.Any(x => x.UnitPrice < 0 || x.UnitMrp < x.UnitPrice || x.WeightKg <= 0))
            return ApiResponse<CheckoutSessionResponse>.Fail("A selected product has invalid checkout details.", 409);
        return null;
    }

    private static ApiResponse<CheckoutSessionResponse>? ValidateCartForSession(CartProjection? cart, CheckoutSession session)
    {
        var failure = ValidateCart(cart);
        if (failure is not null) return failure;
        return cart!.Id != session.CartId || cart.Version != session.CartVersion
            ? ApiResponse<CheckoutSessionResponse>.Fail("Your cart changed. Refresh checkout to continue.", 409)
            : null;
    }

    private async Task<(bool Success, int StatusCode, string Message, object? Errors, AddressProjection? Shipping, AddressProjection? Billing)>
        ResolveAddressesAsync(Guid customerId, Guid? shippingId, Guid? billingId, bool useDefaults, CancellationToken cancellationToken)
    {
        var query = db.CustomerAddresses.AsNoTracking().Where(x => x.CustomerId == customerId && x.IsActive);
        if (useDefaults)
        {
            shippingId ??= await query.Where(x => x.IsDefaultShipping).Select(x => (Guid?)x.Id).FirstOrDefaultAsync(cancellationToken);
            billingId ??= await query.Where(x => x.IsDefaultBilling).Select(x => (Guid?)x.Id).FirstOrDefaultAsync(cancellationToken);
        }
        billingId ??= shippingId;
        var ids = new[] { shippingId, billingId }.Where(x => x.HasValue).Select(x => x!.Value).Distinct().ToArray();
        var addresses = await query.Where(x => ids.Contains(x.Id)).Select(x => new AddressProjection
        {
            Id = x.Id, PostalCode = x.PostalCode
        }).ToListAsync(cancellationToken);
        var shipping = shippingId.HasValue ? addresses.SingleOrDefault(x => x.Id == shippingId.Value) : null;
        var billing = billingId.HasValue ? addresses.SingleOrDefault(x => x.Id == billingId.Value) : null;
        if (shippingId.HasValue && shipping is null || billingId.HasValue && billing is null)
            return (false, 404, "A selected address was not found.", null, null, null);
        return (true, 200, string.Empty, null, shipping, billing);
    }

    private Task<ShippingRateResult> GetBestRateAsync(CartProjection cart, string postalCode, CancellationToken cancellationToken) =>
        shiprocketRateService.GetBestRateAsync(new ShippingRateRequest(
            postalCode, cart.Lines.Sum(x => x.WeightKg * x.Quantity), cart.Lines.Sum(x => x.UnitPrice * x.Quantity)), cancellationToken);

    private async Task<ApiResponse<CouponResult>> ValidateCouponAsync(
        string code, Guid customerId, CartProjection cart, CancellationToken cancellationToken)
    {
        var normalized = code.Trim().ToUpperInvariant();
        var coupon = await db.Coupons.AsNoTracking().Include(x => x.Scopes)
            .SingleOrDefaultAsync(x => x.Code == normalized && !x.IsDeleted, cancellationToken);
        var now = DateTime.UtcNow;
        if (coupon is null || !coupon.IsActive || coupon.StartOn > now || coupon.EndOn <= now)
            return ApiResponse<CouponResult>.Fail("This coupon is invalid or unavailable.", 422);
        var subtotal = cart.Lines.Sum(x => x.UnitPrice * x.Quantity);
        if (subtotal < coupon.MinimumOrderAmount)
            return ApiResponse<CouponResult>.Fail($"A minimum subtotal of {coupon.MinimumOrderAmount:0.00} is required for this coupon.", 422);
        var redeemed = await db.CouponUsages.AsNoTracking().CountAsync(x => x.CouponId == coupon.Id && x.Status == CouponUsageStatus.Redeemed, cancellationToken);
        if (coupon.TotalUsageLimit.HasValue && redeemed >= coupon.TotalUsageLimit.Value)
            return ApiResponse<CouponResult>.Fail("This coupon has reached its usage limit.", 422);
        var customerRedeemed = await db.CouponUsages.AsNoTracking().CountAsync(x => x.CouponId == coupon.Id &&
            x.CustomerId == customerId && x.Status == CouponUsageStatus.Redeemed, cancellationToken);
        if (coupon.PerCustomerUsageLimit.HasValue && customerRedeemed >= coupon.PerCustomerUsageLimit.Value)
            return ApiResponse<CouponResult>.Fail("This coupon is no longer available for your account.", 422);
        if (coupon.IsFirstOrderOnly && await db.CouponUsages.AsNoTracking().AnyAsync(x =>
                x.CustomerId == customerId && x.Status == CouponUsageStatus.Redeemed, cancellationToken))
            return ApiResponse<CouponResult>.Fail("This coupon is available only for a first order.", 422);

        var eligible = coupon.ApplicationScope switch
        {
            CouponApplicationScope.AllProducts => subtotal,
            CouponApplicationScope.SpecificProducts => cart.Lines.Where(line => coupon.Scopes.Any(scope => scope.ProductId == line.ProductId)).Sum(line => line.UnitPrice * line.Quantity),
            CouponApplicationScope.SpecificCategories => cart.Lines.Where(line => coupon.Scopes.Any(scope => scope.CategoryId == line.CategoryId)).Sum(line => line.UnitPrice * line.Quantity),
            _ => 0
        };
        if (eligible <= 0) return ApiResponse<CouponResult>.Fail("This coupon does not apply to the selected products.", 422);
        var discount = coupon.DiscountType switch
        {
            CouponDiscountType.Percentage => eligible * coupon.DiscountValue / 100m,
            CouponDiscountType.FlatAmount => Math.Min(eligible, coupon.DiscountValue),
            CouponDiscountType.FreeShipping => 0,
            _ => 0
        };
        if (coupon.MaximumDiscountAmount.HasValue) discount = Math.Min(discount, coupon.MaximumDiscountAmount.Value);
        discount = Math.Round(discount, 2, MidpointRounding.AwayFromZero);
        return ApiResponse<CouponResult>.Ok(new CouponResult(
            coupon.Id, coupon.Code, discount, coupon.DiscountType == CouponDiscountType.FreeShipping));
    }

    private async Task<(bool Success, int StatusCode, string Message, object? Errors, Guid CustomerId, CheckoutSession? Session)>
        LoadOwnedSessionAsync(Guid sessionId, CancellationToken cancellationToken)
    {
        if (sessionId == Guid.Empty) return (false, 400, "A valid checkout session ID is required.", null, Guid.Empty, null);
        var access = await GetVerifiedCustomerIdAsync(cancellationToken);
        if (!access.Success) return (false, access.StatusCode, access.Message ?? string.Empty, access.Errors, Guid.Empty, null);
        var session = await db.CheckoutSessions.SingleOrDefaultAsync(x => x.Id == sessionId && x.CustomerId == access.Data, cancellationToken);
        if (session is null) return (false, 404, "Checkout session was not found.", null, access.Data, null);
        if (session.ConsumedOn is not null) return (false, 409, "Checkout session has already been used.", null, access.Data, null);
        if (session.ExpiresOn <= DateTime.UtcNow) return (false, 409, "Checkout session expired. Start checkout again.", null, access.Data, null);
        return (true, 200, string.Empty, null, access.Data, session);
    }

    private async Task<ApiResponse<Guid>> GetVerifiedCustomerIdAsync(CancellationToken cancellationToken)
    {
        var claims = claimsHelper.GetCustomer();
        if (!claims.Success || claims.Data is null) return ApiResponse<Guid>.Fail(claims.Message, claims.StatusCode, claims.Errors);
        var decision = await db.Customers.AsNoTracking().Where(x => x.Id == claims.Data.CustomerId)
            .Select(x => new { x.IsActive, x.IsBlocked, x.IsDeleted, x.IsMobileVerified, x.IsEmailVerified, x.Email, x.TokenVersion })
            .SingleOrDefaultAsync(cancellationToken);
        if (decision is null || !decision.IsActive || decision.IsBlocked || decision.IsDeleted ||
            decision.TokenVersion.ToString() != claims.Data.TokenVersion)
            return ApiResponse<Guid>.Fail("Invalid or expired customer session.", 401);
        if (!decision.IsMobileVerified || string.IsNullOrWhiteSpace(decision.Email) || !decision.IsEmailVerified)
            return ApiResponse<Guid>.Fail("Contact verification is required.", 403,
                new Dictionary<string, string[]> { ["code"] = [DTOs.Customer.CustomerVerificationErrorCodes.ContactVerificationRequired] });
        return ApiResponse<Guid>.Ok(claims.Data.CustomerId);
    }

    private static void Apply(
        CheckoutSession session,
        CheckoutPricingResponse pricing,
        ShippingRateResult? quote,
        CouponResult? coupon)
    {
        session.CouponId = coupon?.Id;
        session.CouponCode = coupon?.Code;
        session.Subtotal = pricing.Subtotal;
        session.ItemDiscountAmount = pricing.ItemDiscountAmount;
        session.CouponDiscountAmount = pricing.CouponDiscountAmount;
        session.CustomerShippingAmount = pricing.CustomerShippingAmount;
        session.ProviderShippingCost = pricing.ProviderShippingCost;
        session.TaxAmount = pricing.TaxAmount;
        session.ProductTaxAmount = pricing.ProductTaxAmount;
        session.PaymentServiceTaxAmount = pricing.PaymentServiceTaxAmount;
        session.GrandTotal = pricing.GrandTotal;
        session.Currency = pricing.Currency;
        session.SelectedCourierId = quote?.CourierCompanyId;
        session.SelectedCourierName = quote?.CourierName;
        session.EstimatedDeliveryOn = CustomerEstimateMinDate(quote);
        session.ShippingQuoteExpiresOn = quote?.QuoteExpiresOn;
        session.ShippingQuoteJson = quote is null ? null : JsonSerializer.Serialize(quote, JsonOptions);
    }

    private static CheckoutSessionResponse ToResponse(
        CheckoutSession session, CartProjection cart, CheckoutPricingResponse pricing,
        ShippingRateResult? quote, IReadOnlyList<string> warnings) => new(
        session.Id, session.CartId, session.CartVersion, session.ShippingAddressId, session.BillingAddressId,
        session.CouponId, session.CouponCode,
        cart.Lines.Select(x => new CheckoutItemResponse(
            x.ProductId, x.VariantId, x.ProductName, x.ProductSlug, x.VariantName, x.Sku, x.Quantity,
            x.UnitPrice, x.UnitMrp, x.UnitPrice * x.Quantity, x.UnitMrp * x.Quantity,
            Math.Max(0, (x.UnitMrp - x.UnitPrice) * x.Quantity), x.WeightKg, string.Empty)).ToArray(),
        pricing,
        quote is null ? null : new CheckoutShippingQuoteResponse(
            quote.CourierCompanyId, quote.CourierName, CustomerDeliveryMethod(quote), quote.Rate, pricing.CustomerShippingAmount,
            CustomerEstimateMinDays(quote), CustomerEstimateMaxDays(quote),
            CustomerEstimateMinDate(quote), CustomerEstimateMaxDate(quote), quote.Rating,
            quote.IsRecommended, quote.QuoteExpiresOn),
        session.ShippingAddressId.HasValue && session.BillingAddressId.HasValue && quote is not null && warnings.Count == 0,
        warnings, session.ExpiresOn, session.ConcurrencyStamp);

    private static ShippingRateResult? ReadQuote(CheckoutSession session)
    {
        if (string.IsNullOrWhiteSpace(session.ShippingQuoteJson)) return null;
        try
        {
            return JsonSerializer.Deserialize<ShippingRateResult>(session.ShippingQuoteJson, JsonOptions);
        }
        catch (JsonException)
        {
            return null;
        }
    }
    private static IReadOnlyList<string> Warnings(AddressProjection? address, ShippingRateResult? quote) =>
        Warnings(address?.Id, quote);
    private static IReadOnlyList<string> Warnings(Guid? addressId, ShippingRateResult? quote)
    {
        var warnings = new List<string>();
        if (!addressId.HasValue) warnings.Add("Select a delivery address.");
        if (addressId.HasValue && quote is null) warnings.Add("Refresh the shipping rate.");
        if (quote?.QuoteExpiresOn <= DateTime.UtcNow) warnings.Add("The shipping quote expired. Refresh checkout.");
        return warnings;
    }
    private static bool AmountsMatch(CheckoutSession session, CheckoutPricingResponse pricing) =>
        session.Subtotal == pricing.Subtotal && session.ItemDiscountAmount == pricing.ItemDiscountAmount &&
        session.CouponDiscountAmount == pricing.CouponDiscountAmount && session.CustomerShippingAmount == pricing.CustomerShippingAmount &&
        session.ProviderShippingCost == pricing.ProviderShippingCost && session.TaxAmount == pricing.TaxAmount &&
        session.ProductTaxAmount == pricing.ProductTaxAmount && session.PaymentServiceTaxAmount == pricing.PaymentServiceTaxAmount &&
        session.GrandTotal == pricing.GrandTotal;
    private static PricingLine ToPricingLine(CheckoutLine x) => new(x.ProductId, x.CategoryId, x.UnitPrice, x.UnitMrp, x.Quantity);
    private static int? CustomerEstimateMinDays(ShippingRateResult? quote) => AddEstimateDays(quote?.EstimatedDeliveryDays, 2);
    private static int? CustomerEstimateMaxDays(ShippingRateResult? quote) => AddEstimateDays(quote?.EstimatedDeliveryDays, 3);
    private static DateTime? CustomerEstimateMinDate(ShippingRateResult? quote) => AddEstimateDays(quote?.EstimatedDeliveryDate, 2);
    private static DateTime? CustomerEstimateMaxDate(ShippingRateResult? quote) => AddEstimateDays(quote?.EstimatedDeliveryDate, 3);
    private static string CustomerDeliveryMethod(ShippingRateResult quote) =>
        quote.EstimatedDeliveryDays is > 0 and <= 3 ? "Express Delivery" : "Standard Delivery";
    private static int? AddEstimateDays(int? days, int buffer) => days is > 0 ? Math.Min(days.Value, int.MaxValue - buffer) + buffer : null;
    private static DateTime? AddEstimateDays(DateTime? date, int buffer) => date is null || date > DateTime.MaxValue.AddDays(-buffer) ? null : date.Value.AddDays(buffer);
    private static decimal CartSubtotal(CartProjection cart) => cart.Lines.Sum(x => x.UnitPrice * x.Quantity);
    private static bool IsFreeShipping(decimal minimum, decimal subtotal, decimal discount, bool couponFreeShipping) =>
        couponFreeShipping || minimum > 0 && Math.Max(0, subtotal - discount) >= minimum;
    private async Task<bool> IsFreeShippingCouponAsync(Guid? couponId, CancellationToken cancellationToken) =>
        couponId.HasValue && await db.Coupons.AsNoTracking().AnyAsync(x => x.Id == couponId.Value &&
            x.DiscountType == CouponDiscountType.FreeShipping && !x.IsDeleted && x.IsActive, cancellationToken);
    private static decimal WeightKg(decimal weight, string unit) => unit.Trim().ToLowerInvariant() switch
    {
        "kg" or "kilogram" or "kilograms" => weight,
        "g" or "gm" or "gram" or "grams" => weight / 1000m,
        "ml" => weight / 1000m,
        _ => 0
    };
    private static ApiResponse<CheckoutSessionResponse> ValidationFailure(ValidationResult validation) => ApiResponse<CheckoutSessionResponse>.Fail(
        "Please correct the highlighted fields.", 400,
        validation.Errors.GroupBy(x => x.PropertyName).ToDictionary(x => x.Key, x => x.Select(e => e.ErrorMessage).Distinct().ToArray()));
    private static ApiResponse<CheckoutSessionResponse> Failure(ApiResponse<Guid> response) => ApiResponse<CheckoutSessionResponse>.Fail(response.Message, response.StatusCode, response.Errors);
    private static ApiResponse<CheckoutSessionResponse> UnexpectedFailure() => ApiResponse<CheckoutSessionResponse>.Fail("Unable to process checkout right now. Please try again.", 500);

    private sealed class CartProjection { public Guid Id { get; set; } public int Version { get; set; } public List<CheckoutLine> Lines { get; set; } = []; }
    private sealed class CheckoutLine
    {
        public Guid ProductId { get; set; } public Guid CategoryId { get; set; }
        public string ProductName { get; set; } = string.Empty; public string ProductSlug { get; set; } = string.Empty;
        public bool ProductActive { get; set; } public Guid VariantId { get; set; }
        public string VariantName { get; set; } = string.Empty; public string Sku { get; set; } = string.Empty;
        public bool VariantActive { get; set; } public int Quantity { get; set; } public int StockQuantity { get; set; }
        public decimal UnitPrice { get; set; } public decimal UnitMrp { get; set; }
        public decimal Weight { get; set; } public string WeightUnit { get; set; } = string.Empty; public decimal WeightKg { get; set; }
    }
    private sealed class AddressProjection { public Guid Id { get; set; } public string PostalCode { get; set; } = string.Empty; }
    private sealed record CouponResult(Guid Id, string Code, decimal Discount, bool FreeShipping);
}
