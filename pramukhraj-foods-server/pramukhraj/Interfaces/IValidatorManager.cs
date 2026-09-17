using FluentValidation;
using pramukhraj.DTOs.Auth;
using pramukhraj.DTOs.Coupon;
using pramukhraj.DTOs.FAQ;
using pramukhraj.DTOs.HomepageCms;
using pramukhraj.DTOs.Product;
using pramukhraj.DTOs.ProviderCredentials;
using pramukhraj.DTOs.Customer;
using pramukhraj.DTOs.EmailTemplates;
using static pramukhraj.DTOs.Product.ProductCategoryRequestResponse;
using static pramukhraj.DTOs.Product.ProductInventoryRequestResponse;
using static pramukhraj.DTOs.Product.CustomerProductListRequestResponse;
using static pramukhraj.DTOs.Review.AdminReviewRequestResponse;

namespace pramukhraj.Interfaces;

public interface IValidatorManager
{
    IValidator<RegisterRequest> RegisterRequest { get; }
    IValidator<LoginRequest> LoginRequest { get; }
    IValidator<SendCustomerOtpRequest> SendCustomerOtpRequest { get; }
    IValidator<VerifyCustomerOtpRequest> VerifyCustomerOtpRequest { get; }
    IValidator<CompleteCustomerProfileRequest> CompleteCustomerProfileRequest { get; }
    IValidator<AddProductRequest> ProductRequest { get; }
    IValidator<AddProductCategoryRequest> ProductCategoryRequest { get; }
    IValidator<GetProductCategoriesImagesRequest> ProductCategoryImagesRequest { get; }
    IValidator<GetProductImagesRequest> ProductImagesRequest { get; }
    IValidator<UpdateProductVariantInventoryRequest> ProductInventoryRequest { get; }
    IValidator<CustomerProductListRequest> CustomerProductListRequest { get; }
    IValidator<CreateCouponRequest> CreateCouponRequest { get; }
    IValidator<UpdateCouponRequest> UpdateCouponRequest { get; }
    IValidator<CreateAdminReviewRequest> CreateAdminReviewRequest { get; }
    IValidator<UpdateAdminReviewRequest> UpdateAdminReviewRequest { get; }
    IValidator<FaqWriteRequest> FaqWriteRequest { get; }
    IValidator<HomepageCmsWriteRequest> HomepageCmsWriteRequest { get; }
    IValidator<CreateProviderCredentialRequest> CreateProviderCredentialRequest { get; }
    IValidator<UpdateProviderCredentialRequest> UpdateProviderCredentialRequest { get; }
    IValidator<AdminCustomerListRequest> AdminCustomerListRequest { get; }
    IValidator<PatchAdminCustomerRequest> PatchAdminCustomerRequest { get; }
    IValidator<SmtpProviderCredentials> SmtpProviderCredentials { get; }
    IValidator<EmailTemplateWriteRequest> EmailTemplateWriteRequest { get; }
}
