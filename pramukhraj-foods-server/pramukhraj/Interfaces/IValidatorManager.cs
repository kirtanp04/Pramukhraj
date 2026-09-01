using FluentValidation;
using pramukhraj.DTOs.Auth;
using pramukhraj.DTOs.Coupon;
using pramukhraj.DTOs.Product;
using static pramukhraj.DTOs.Product.ProductCategoryRequestResponse;
using static pramukhraj.DTOs.Product.ProductInventoryRequestResponse;

namespace pramukhraj.Interfaces;

public interface IValidatorManager
{
    IValidator<RegisterRequest> RegisterRequest { get; }
    IValidator<LoginRequest> LoginRequest { get; }
    IValidator<CustomerRegisterRequest> CustomerRegisterRequest { get; }
    IValidator<CustomerLoginRequest> CustomerLoginRequest { get; }
    IValidator<AddProductRequest> ProductRequest { get; }
    IValidator<AddProductCategoryRequest> ProductCategoryRequest { get; }
    IValidator<GetProductCategoriesImagesRequest> ProductCategoryImagesRequest { get; }
    IValidator<GetProductImagesRequest> ProductImagesRequest { get; }
    IValidator<UpdateProductVariantInventoryRequest> ProductInventoryRequest { get; }
    IValidator<CreateCouponRequest> CreateCouponRequest { get; }
    IValidator<UpdateCouponRequest> UpdateCouponRequest { get; }
}
