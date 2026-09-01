using FluentValidation;
using pramukhraj.DTOs.Auth;
using pramukhraj.DTOs.Coupon;
using pramukhraj.DTOs.Product;
using pramukhraj.Interfaces;
using static pramukhraj.DTOs.Product.ProductCategoryRequestResponse;
using static pramukhraj.DTOs.Product.ProductInventoryRequestResponse;

namespace pramukhraj.Extensions;

public sealed class ValidatorManager : IValidatorManager
{
    public ValidatorManager(
        IValidator<RegisterRequest> registerRequest,
        IValidator<LoginRequest> loginRequest,
        IValidator<CustomerRegisterRequest> customerRegisterRequest,
        IValidator<CustomerLoginRequest> customerLoginRequest,
        IValidator<AddProductRequest> productRequest,
        IValidator<AddProductCategoryRequest> productCategoryRequest,
        IValidator<GetProductCategoriesImagesRequest> productCategoryImagesRequest,
        IValidator<GetProductImagesRequest> productImagesRequest,
        IValidator<UpdateProductVariantInventoryRequest> productInventoryRequest,
        IValidator<CreateCouponRequest> createCouponRequest,
        IValidator<UpdateCouponRequest> updateCouponRequest)
    {
        RegisterRequest = registerRequest;
        LoginRequest = loginRequest;
        CustomerRegisterRequest = customerRegisterRequest;
        CustomerLoginRequest = customerLoginRequest;
        ProductRequest = productRequest;
        ProductCategoryRequest = productCategoryRequest;
        ProductCategoryImagesRequest = productCategoryImagesRequest;
        ProductImagesRequest = productImagesRequest;
        ProductInventoryRequest = productInventoryRequest;
        CreateCouponRequest = createCouponRequest;
        UpdateCouponRequest = updateCouponRequest;
    }

    public IValidator<RegisterRequest> RegisterRequest { get; }
    public IValidator<LoginRequest> LoginRequest { get; }
    public IValidator<CustomerRegisterRequest> CustomerRegisterRequest { get; }
    public IValidator<CustomerLoginRequest> CustomerLoginRequest { get; }
    public IValidator<AddProductRequest> ProductRequest { get; }
    public IValidator<AddProductCategoryRequest> ProductCategoryRequest { get; }
    public IValidator<GetProductCategoriesImagesRequest> ProductCategoryImagesRequest { get; }
    public IValidator<GetProductImagesRequest> ProductImagesRequest { get; }
    public IValidator<UpdateProductVariantInventoryRequest> ProductInventoryRequest { get; }
    public IValidator<CreateCouponRequest> CreateCouponRequest { get; }
    public IValidator<UpdateCouponRequest> UpdateCouponRequest { get; }
}
