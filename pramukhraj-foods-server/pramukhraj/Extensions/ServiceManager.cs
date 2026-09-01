using Microsoft.AspNetCore.Identity;
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

        private readonly IHttpContextAccessor _httpContextAccessor;

        public ServiceManager(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            IOptions<JwtSettings> jwtOptions,
            AppDbContext _db,
            IHttpContextAccessor httpContextAccessor,
            ILoggerFactory loggerFactory,
            IValidatorManager validatorManager
            )
        {
            _ProductService = new Lazy<IProductService>(() => new ProductService(_db, loggerFactory.CreateLogger<ProductService>(), httpContextAccessor, validatorManager));

            _CouponService = new Lazy<ICouponService>(() => new CouponService(
                _db,
                loggerFactory.CreateLogger<CouponService>(),
                httpContextAccessor,
                validatorManager));

            _TokenService = new Lazy<ITokenService>(() => new TokenService(jwtOptions, userManager, _db));

            _UserManager = new Lazy<UserManager<ApplicationUser>>(() => userManager);

            _SignInManager = new Lazy<SignInManager<ApplicationUser>>(() => signInManager);
        }

        public IProductService ProductService => _ProductService.Value;
        public ICouponService CouponService => _CouponService.Value;
        public ITokenService TokenService => _TokenService.Value;
        public UserManager<ApplicationUser> UserManager => _UserManager.Value;
        public SignInManager<ApplicationUser> SignInManager => _SignInManager.Value;
    }
}
