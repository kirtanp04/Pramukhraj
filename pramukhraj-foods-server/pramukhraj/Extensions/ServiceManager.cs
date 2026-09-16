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
            IAdminCustomerService adminCustomerService
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
      
    }
}
