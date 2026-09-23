using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using pramukhraj.Configurations;
using pramukhraj.Database;
using pramukhraj.Entities;
using pramukhraj.Interfaces;
using pramukhraj.Services;

namespace pramukhraj.Extensions
{
    public class ServiceManager: IServiceManager
    {
        private readonly Lazy<IProductService> _ProductService;

        private readonly Lazy<ICouponService> _CouponService;

        private readonly Lazy<ITokenService> _TokenService;

        private readonly Lazy<UserManager<ApplicationUser>> _UserManager;

        private readonly Lazy<SignInManager<ApplicationUser>> _SignInManager;

        private readonly Lazy<IReviewService> _ReviewService;

        private readonly Lazy<IFaqService> _FaqService;
        private readonly Lazy<IHomepageCmsService> _HomepageCmsService;
        private readonly Lazy<ICustomerOtpSender> _CustomerOtpService;
        private readonly Lazy<IProviderCredentialService> _ProviderCredentialService;
        private readonly Lazy<ICartService> _CartService;
        private readonly Lazy<IAdminMonitoringService> _MonitoringService;
        private readonly Lazy<IAdminCustomerService> _AdminCustomerService;
        private readonly Lazy<IAdminNotificationService> _AdminNotificationService;
        private readonly Lazy<IEmailService> _EmailService;
        private readonly Lazy<IEmailQueue> _EmailQueue;
        private readonly Lazy<IEmailTemplateService> _EmailTemplateService;
        private readonly Lazy<ICustomerVerificationService> _CustomerVerificationService;
        private readonly Lazy<ICustomerAddressService> _CustomerAddressService;
        private readonly Lazy<ICheckoutService> _CheckoutService;
        private readonly Lazy<IPricingService> _PricingService;
        private readonly Lazy<IShiprocketRateService> _ShiprocketRateService;
        private readonly Lazy<IStoreSettingsService> _StoreSettingsService;
        private readonly Lazy<IOrderService> _OrderService;
        private readonly Lazy<IPaymentService> _PaymentService;
        private readonly Lazy<IInventoryReservationService> _InventoryReservationService;
        private readonly Lazy<IShiprocketFulfillmentService> _ShiprocketFulfillmentService;
        private readonly Lazy<ICustomerOrderService> _CustomerOrderService;
        private readonly Lazy<IAdminOrderService> _AdminOrderService;
        private readonly Lazy<IAdminPaymentService> _AdminPaymentService;
        private readonly Lazy<IAdminShipmentService> _AdminShipmentService;
        private readonly Lazy<IAdminLogService> _AdminLogService;
        private readonly Lazy<IAdminSalesService> _AdminSalesService;

      
        public ServiceManager(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            IOptions<JwtSettings> jwtOptions,
            AppDbContext _db,
            IHttpContextAccessor httpContextAccessor,
            ILoggerFactory loggerFactory,
            IValidatorManager validatorManager,
            ICacheService cache,
            ICustomerOtpSender customerOtpService,
            IProviderCredentialService providerCredentialService,
            ICartService cartService,
            IAdminMonitoringService monitoringService,
            IAdminCustomerService adminCustomerService,
            IAdminNotificationService adminNotificationService,
            IEmailService emailService,
            IEmailQueue emailQueue,
            IEmailTemplateService emailTemplateService,
            ICustomerVerificationService customerVerificationService,
            ICustomerAddressService customerAddressService,
            ICheckoutService checkoutService,
            IPricingService pricingService,
            IShiprocketRateService shiprocketRateService,
            IStoreSettingsService storeSettingsService,
            IOrderService orderService,
            IPaymentService paymentService,
            IInventoryReservationService inventoryReservationService,
            IShiprocketFulfillmentService shiprocketFulfillmentService,
            ICustomerOrderService customerOrderService,
            IAdminOrderService adminOrderService,
            IAdminPaymentService adminPaymentService,
            IAdminShipmentService adminShipmentService,
            IAdminLogService adminLogService,
            IAdminSalesService adminSalesService
            )
        {
          

            _ProductService = new Lazy<IProductService>(() => new ProductService(_db, loggerFactory.CreateLogger<ProductService>(), httpContextAccessor, validatorManager, cache));

            _CouponService = new Lazy<ICouponService>(() => new CouponService(_db,loggerFactory.CreateLogger<CouponService>(),httpContextAccessor,validatorManager, cache));

            _TokenService = new Lazy<ITokenService>(() => new TokenService(jwtOptions, userManager, _db));

            _UserManager = new Lazy<UserManager<ApplicationUser>>(() => userManager);

            _SignInManager = new Lazy<SignInManager<ApplicationUser>>(() => signInManager);

            _ReviewService = new Lazy<IReviewService>(() => new ReviewService(_db, loggerFactory.CreateLogger<ReviewService>(), httpContextAccessor, validatorManager, cache));

            _FaqService = new Lazy<IFaqService>(() => new FaqService(_db, loggerFactory.CreateLogger<FaqService>(), httpContextAccessor, validatorManager, cache));

            _HomepageCmsService = new Lazy<IHomepageCmsService>(() => new HomepageCmsService(_db, loggerFactory.CreateLogger<HomepageCmsService>(), httpContextAccessor, validatorManager, cache));

            _CustomerOtpService = new Lazy<ICustomerOtpSender>(() => customerOtpService);
            _ProviderCredentialService = new Lazy<IProviderCredentialService>(() => providerCredentialService);
            _CartService = new Lazy<ICartService>(() => cartService);
            _MonitoringService = new Lazy<IAdminMonitoringService>(() => monitoringService);
            _AdminCustomerService = new Lazy<IAdminCustomerService>(() => adminCustomerService);
            _AdminNotificationService = new Lazy<IAdminNotificationService>(() => adminNotificationService);
            _EmailService = new Lazy<IEmailService>(() => emailService);
            _EmailQueue = new Lazy<IEmailQueue>(() => emailQueue);
            _EmailTemplateService = new Lazy<IEmailTemplateService>(() => emailTemplateService);
            _CustomerVerificationService = new Lazy<ICustomerVerificationService>(() => customerVerificationService);
            _CustomerAddressService = new Lazy<ICustomerAddressService>(() => customerAddressService);
            _CheckoutService = new Lazy<ICheckoutService>(() => checkoutService);
            _PricingService = new Lazy<IPricingService>(() => pricingService);
            _ShiprocketRateService = new Lazy<IShiprocketRateService>(() => shiprocketRateService);
            _StoreSettingsService = new Lazy<IStoreSettingsService>(() => storeSettingsService);
            _OrderService = new Lazy<IOrderService>(() => orderService);
            _PaymentService = new Lazy<IPaymentService>(() => paymentService);
            _InventoryReservationService = new Lazy<IInventoryReservationService>(() => inventoryReservationService);
            _ShiprocketFulfillmentService = new Lazy<IShiprocketFulfillmentService>(() => shiprocketFulfillmentService);
            _CustomerOrderService = new Lazy<ICustomerOrderService>(() => customerOrderService);
            _AdminOrderService = new Lazy<IAdminOrderService>(() => adminOrderService);
            _AdminPaymentService = new Lazy<IAdminPaymentService>(() => adminPaymentService);
            _AdminShipmentService = new Lazy<IAdminShipmentService>(() => adminShipmentService);
            _AdminLogService = new Lazy<IAdminLogService>(() => adminLogService);
            _AdminSalesService = new Lazy<IAdminSalesService>(() => adminSalesService);
        }

        public IProductService ProductService => _ProductService.Value;
        public ICouponService CouponService => _CouponService.Value;
        public ITokenService TokenService => _TokenService.Value;
        public UserManager<ApplicationUser> UserManager => _UserManager.Value;
        public SignInManager<ApplicationUser> SignInManager => _SignInManager.Value;
        public IReviewService ReviewService => _ReviewService.Value;
        public IFaqService FaqService => _FaqService.Value;
        public IHomepageCmsService HomepageCmsService => _HomepageCmsService.Value;
        public ICustomerOtpSender CustomerOtpService => _CustomerOtpService.Value;
        public IProviderCredentialService ProviderCredentialService => _ProviderCredentialService.Value;
        public ICartService CartService => _CartService.Value;
        public IAdminMonitoringService MonitoringService => _MonitoringService.Value;
        public IAdminCustomerService AdminCustomerService => _AdminCustomerService.Value;
        public IAdminNotificationService AdminNotificationService => _AdminNotificationService.Value;
        public IEmailService EmailService => _EmailService.Value;
        public IEmailQueue EmailQueue => _EmailQueue.Value;
        public IEmailTemplateService EmailTemplateService => _EmailTemplateService.Value;
        public ICustomerVerificationService CustomerVerificationService => _CustomerVerificationService.Value;
        public ICustomerAddressService CustomerAddressService => _CustomerAddressService.Value;
        public ICheckoutService CheckoutService => _CheckoutService.Value;
        public IPricingService PricingService => _PricingService.Value;
        public IShiprocketRateService ShiprocketRateService => _ShiprocketRateService.Value;
        public IStoreSettingsService StoreSettingsService => _StoreSettingsService.Value;
        public IOrderService OrderService => _OrderService.Value;
        public IPaymentService PaymentService => _PaymentService.Value;
        public IInventoryReservationService InventoryReservationService => _InventoryReservationService.Value;
        public IShiprocketFulfillmentService ShiprocketFulfillmentService => _ShiprocketFulfillmentService.Value;
        public ICustomerOrderService CustomerOrderService => _CustomerOrderService.Value;
        public IAdminOrderService AdminOrderService => _AdminOrderService.Value;
        public IAdminPaymentService AdminPaymentService => _AdminPaymentService.Value;
        public IAdminShipmentService AdminShipmentService => _AdminShipmentService.Value;
        public IAdminLogService AdminLogService => _AdminLogService.Value;
        public IAdminSalesService AdminSalesService => _AdminSalesService.Value;
      
    }
}
