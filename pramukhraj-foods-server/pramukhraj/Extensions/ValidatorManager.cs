using FluentValidation;
using pramukhraj.DTOs.Auth;
using pramukhraj.DTOs.Coupon;
using pramukhraj.DTOs.FAQ;
using pramukhraj.DTOs.HomepageCms;
using pramukhraj.DTOs.Product;
using pramukhraj.DTOs.ProviderCredentials;
using pramukhraj.DTOs.Customer;
using pramukhraj.DTOs.EmailTemplates;
using pramukhraj.Interfaces;
using static pramukhraj.DTOs.Product.ProductCategoryRequestResponse;
using static pramukhraj.DTOs.Product.ProductInventoryRequestResponse;
using static pramukhraj.DTOs.Product.CustomerProductListRequestResponse;
using static pramukhraj.DTOs.Review.AdminReviewRequestResponse;

namespace pramukhraj.Extensions;

public sealed class ValidatorManager : IValidatorManager
{
    public ValidatorManager(
        IValidator<RegisterRequest> registerRequest,
        IValidator<LoginRequest> loginRequest,
        IValidator<SendCustomerOtpRequest> sendCustomerOtpRequest,
        IValidator<VerifyCustomerOtpRequest> verifyCustomerOtpRequest,
        IValidator<CompleteCustomerProfileRequest> completeCustomerProfileRequest,
        IValidator<AddProductRequest> productRequest,
        IValidator<AddProductCategoryRequest> productCategoryRequest,
        IValidator<GetProductCategoriesImagesRequest> productCategoryImagesRequest,
        IValidator<GetProductImagesRequest> productImagesRequest,
        IValidator<UpdateProductVariantInventoryRequest> productInventoryRequest,
        IValidator<CustomerProductListRequest> customerProductListRequest,
        IValidator<CreateCouponRequest> createCouponRequest,
        IValidator<UpdateCouponRequest> updateCouponRequest,
        IValidator<CreateAdminReviewRequest> createAdminReviewRequest,
        IValidator<UpdateAdminReviewRequest> updateAdminReviewRequest,
        IValidator<FaqWriteRequest> faqWriteRequest,
        IValidator<HomepageCmsWriteRequest> homepageCmsWriteRequest,
        IValidator<CreateProviderCredentialRequest> createProviderCredentialRequest,
        IValidator<UpdateProviderCredentialRequest> updateProviderCredentialRequest,
        IValidator<SmtpProviderCredentials> smtpProviderCredentials,
        IValidator<AdminCustomerListRequest> adminCustomerListRequest,
        IValidator<PatchAdminCustomerRequest> patchAdminCustomerRequest,
        IValidator<EmailTemplateWriteRequest> emailTemplateWriteRequest)
    {
        RegisterRequest = registerRequest;
        LoginRequest = loginRequest;
        SendCustomerOtpRequest = sendCustomerOtpRequest;
        VerifyCustomerOtpRequest = verifyCustomerOtpRequest;
        CompleteCustomerProfileRequest = completeCustomerProfileRequest;
        ProductRequest = productRequest;
        ProductCategoryRequest = productCategoryRequest;
        ProductCategoryImagesRequest = productCategoryImagesRequest;
        ProductImagesRequest = productImagesRequest;
        ProductInventoryRequest = productInventoryRequest;
        CustomerProductListRequest = customerProductListRequest;
        CreateCouponRequest = createCouponRequest;
        UpdateCouponRequest = updateCouponRequest;
        CreateAdminReviewRequest = createAdminReviewRequest;
        UpdateAdminReviewRequest = updateAdminReviewRequest;
        FaqWriteRequest = faqWriteRequest;
        HomepageCmsWriteRequest = homepageCmsWriteRequest;
        CreateProviderCredentialRequest = createProviderCredentialRequest;
        UpdateProviderCredentialRequest = updateProviderCredentialRequest;
        AdminCustomerListRequest = adminCustomerListRequest;
        PatchAdminCustomerRequest = patchAdminCustomerRequest;
        SmtpProviderCredentials = smtpProviderCredentials;
        EmailTemplateWriteRequest = emailTemplateWriteRequest;
    }

    public IValidator<RegisterRequest> RegisterRequest { get; }
    public IValidator<LoginRequest> LoginRequest { get; }
    public IValidator<SendCustomerOtpRequest> SendCustomerOtpRequest { get; }
    public IValidator<VerifyCustomerOtpRequest> VerifyCustomerOtpRequest { get; }
    public IValidator<CompleteCustomerProfileRequest> CompleteCustomerProfileRequest { get; }
    public IValidator<AddProductRequest> ProductRequest { get; }
    public IValidator<AddProductCategoryRequest> ProductCategoryRequest { get; }
    public IValidator<GetProductCategoriesImagesRequest> ProductCategoryImagesRequest { get; }
    public IValidator<GetProductImagesRequest> ProductImagesRequest { get; }
    public IValidator<UpdateProductVariantInventoryRequest> ProductInventoryRequest { get; }
    public IValidator<CustomerProductListRequest> CustomerProductListRequest { get; }
    public IValidator<CreateCouponRequest> CreateCouponRequest { get; }
    public IValidator<UpdateCouponRequest> UpdateCouponRequest { get; }
    public IValidator<CreateAdminReviewRequest> CreateAdminReviewRequest { get; }
    public IValidator<UpdateAdminReviewRequest> UpdateAdminReviewRequest { get; }
    public IValidator<FaqWriteRequest> FaqWriteRequest { get; }
    public IValidator<HomepageCmsWriteRequest> HomepageCmsWriteRequest { get; }
    public IValidator<CreateProviderCredentialRequest> CreateProviderCredentialRequest { get; }
    public IValidator<UpdateProviderCredentialRequest> UpdateProviderCredentialRequest { get; }
    public IValidator<AdminCustomerListRequest> AdminCustomerListRequest { get; }
    public IValidator<PatchAdminCustomerRequest> PatchAdminCustomerRequest { get; }
    public IValidator<SmtpProviderCredentials> SmtpProviderCredentials { get; }
    public IValidator<EmailTemplateWriteRequest> EmailTemplateWriteRequest { get; }
}
