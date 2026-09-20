using Microsoft.AspNetCore.Identity;
using pramukhraj.Entities;

namespace pramukhraj.Interfaces
{
    public interface IServiceManager
    {
        IProductService ProductService { get; }
        ICouponService CouponService { get; }
        ITokenService TokenService { get; }
        UserManager<ApplicationUser> UserManager { get; }
        SignInManager<ApplicationUser> SignInManager { get; }
        IReviewService ReviewService { get; }
        IFaqService FaqService { get; }
        IHomepageCmsService HomepageCmsService { get; }
        ICustomerOtpSender CustomerOtpService { get; }
        IProviderCredentialService ProviderCredentialService { get; }
        ICartService CartService { get; }
        IAdminMonitoringService MonitoringService { get; }
        IAdminCustomerService AdminCustomerService { get; }
        IAdminNotificationService AdminNotificationService { get; }
        IEmailService EmailService { get; }
        IEmailQueue EmailQueue { get; }
        IEmailTemplateService EmailTemplateService { get; }
        ICustomerVerificationService CustomerVerificationService { get; }
        ICustomerAddressService CustomerAddressService { get; }
        ICheckoutService CheckoutService { get; }
        IPricingService PricingService { get; }
        IShiprocketRateService ShiprocketRateService { get; }
        IStoreSettingsService StoreSettingsService { get; }
        IOrderService OrderService { get; }
        IPaymentService PaymentService { get; }
        IInventoryReservationService InventoryReservationService { get; }
    }
}
