using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using pramukhraj.Configurations;
using pramukhraj.Database;
using pramukhraj.DTOs.Coupon;
using pramukhraj.DTOs.FAQ;
using pramukhraj.DTOs.HomepageCms;
using pramukhraj.DTOs.Product;
using pramukhraj.DTOs.ProviderCredentials;
using pramukhraj.Entities;
using pramukhraj.Interfaces;
using pramukhraj.Services;
using System.Text;
using System.Threading.RateLimiting;
using static pramukhraj.DTOs.Product.ProductCategoryRequestResponse;
using static pramukhraj.DTOs.Product.ProductInventoryRequestResponse;
using static pramukhraj.DTOs.Product.CustomerProductListRequestResponse;
using static pramukhraj.DTOs.Review.AdminReviewRequestResponse;


namespace pramukhraj.Extensions
{
    /// <summary>
    /// Central place to register application services.
    /// </summary>
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
        {
            // Configure JwtSettings
            services.Configure<JwtSettings>(configuration.GetSection("JwtSettings"));
            var jwtSettings = configuration.GetSection("JwtSettings").Get<JwtSettings>() ?? new JwtSettings();
            services.AddOptions<CustomerOtpSettings>()
                .Bind(configuration.GetSection(CustomerOtpSettings.SectionName))
                .Validate(x => x.CodeLength == 6, "Customer OTP codes must contain exactly 6 digits.")
                .Validate(x => x.AccessTokenExpirationMinutes == 1440, "Customer access tokens must expire after one day.")
                .Validate(x => !string.IsNullOrWhiteSpace(x.HashPepper) && x.HashPepper.Length >= 32,
                    "CustomerOtp:HashPepper must contain at least 32 characters.")
                .ValidateOnStart();

            // Configure EncryptionSettings
            services.Configure<pramukhraj.Configurations.EncryptionSettings>(configuration.GetSection("Encryption"));
            var encryptionSettings = configuration.GetSection("Encryption").Get<pramukhraj.Configurations.EncryptionSettings>() ?? new pramukhraj.Configurations.EncryptionSettings();

            // Register DbContext
            services.AddDbContext<AppDbContext>(options =>
            {
                var conn = configuration.GetConnectionString("DefaultConnection");
                options.UseNpgsql(conn, npg => npg.EnableRetryOnFailure());
            });

            // Identity (no roles) - configure and register SignInManager via IdentityBuilder
            var identityBuilder = services.AddIdentityCore<ApplicationUser>(opts =>
            {
                opts.User.RequireUniqueEmail = true;
                opts.Password.RequireDigit = true;
                opts.Password.RequireLowercase = true;
                opts.Password.RequireUppercase = true;
                opts.Password.RequireNonAlphanumeric = true;
                opts.Password.RequiredLength = 8;

                opts.Lockout.MaxFailedAccessAttempts = 5;
                opts.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);

                opts.SignIn.RequireConfirmedEmail = true;
            });

            // Create IdentityBuilder to register EF stores, token providers and SignInManager
            var extendedIdentityBuilder = new IdentityBuilder(identityBuilder.UserType, typeof(IdentityRole), services);
            extendedIdentityBuilder.AddEntityFrameworkStores<AppDbContext>();
            extendedIdentityBuilder.AddDefaultTokenProviders();
            extendedIdentityBuilder.AddSignInManager();

            // Authentication - JWT Bearer
            var key = Encoding.UTF8.GetBytes(jwtSettings.Secret ?? string.Empty);
            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.RequireHttpsMetadata = true;
                options.SaveToken = true;
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = jwtSettings.Issuer,
                    ValidateAudience = true,
                    ValidAudience = jwtSettings.Audience,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.FromSeconds(30)
                };
            });

            // Authorization (no role-based policies)
            services.AddAuthorization();

            // CORS - enterprise default policy
            var allowedOrigins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? new[] { "https://localhost:7136", "http://localhost:5173" };
            services.AddCors(options =>
            {
                options.AddPolicy("EnterpriseCorsPolicy", policy =>
                {
                    policy.WithOrigins(allowedOrigins)
                          .AllowAnyHeader()
                          .AllowAnyMethod()
                          .AllowCredentials()
                          .SetPreflightMaxAge(TimeSpan.FromMinutes(10));
                });
            });

            services.AddRateLimiter(options =>
            {
                options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
                options.AddFixedWindowLimiter("rate-limit", opt =>
                {
                    opt.PermitLimit = 100;
                    opt.Window = TimeSpan.FromMinutes(1);
                    opt.QueueLimit = 0;
                });
                options.AddPolicy("customer-otp-send", context => RateLimitPartition.GetFixedWindowLimiter(
                    context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 10, Window = TimeSpan.FromMinutes(10), QueueLimit = 0,
                        AutoReplenishment = true
                    }));
                options.AddPolicy("customer-otp-verify", context => RateLimitPartition.GetFixedWindowLimiter(
                    context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 30, Window = TimeSpan.FromMinutes(10), QueueLimit = 0,
                        AutoReplenishment = true
                    }));
                options.AddPolicy("customer-token", context => RateLimitPartition.GetFixedWindowLimiter(
                    context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 30, Window = TimeSpan.FromMinutes(1), QueueLimit = 0,
                        AutoReplenishment = true
                    }));
            });

            // caching setup
            services.AddMemoryCache(options =>
            {
                options.SizeLimit = 10_000;
                options.CompactionPercentage = 0.20;
                options.ExpirationScanFrequency = TimeSpan.FromMinutes(2);
            });


            services.AddSingleton<ICacheService, MemoryCacheService>();
            services.AddScoped<ICustomerTokenService, CustomerTokenService>();
            services.AddScoped<IProviderCredentialService, ProviderCredentialsService>();
            services.AddScoped<ICustomerOtpSender, TwilioCustomerOtpSender>();
            // Register token service
            services.AddScoped<IServiceManager, ServiceManager>();

            return services;
        }

        public static IServiceCollection AddApplication(this IServiceCollection services)
        {
            // AutoMapper
            services.AddAutoMapper(typeof(pramukhraj.Mapping.MappingProfile));

            // FluentValidation - register validators explicitly
            services.AddTransient<FluentValidation.IValidator<DTOs.Auth.RegisterRequest>, Validators.RegisterRequestValidator>();
            services.AddTransient<FluentValidation.IValidator<DTOs.Auth.LoginRequest>, Validators.LoginRequestValidator>();
            services.AddTransient<FluentValidation.IValidator<DTOs.Auth.SendCustomerOtpRequest>, Validators.SendCustomerOtpRequestValidator>();
            services.AddTransient<FluentValidation.IValidator<DTOs.Auth.VerifyCustomerOtpRequest>, Validators.VerifyCustomerOtpRequestValidator>();
            services.AddTransient<FluentValidation.IValidator<DTOs.Auth.CompleteCustomerProfileRequest>, Validators.CompleteCustomerProfileRequestValidator>();
            services.AddTransient<FluentValidation.IValidator<AddProductCategoryRequest>, Validators.ProductCategoryRequestValidator>();
            services.AddTransient<FluentValidation.IValidator<AddProductRequest>, Validators.ProductRequestValidator>();
            services.AddTransient<FluentValidation.IValidator<GetProductCategoriesImagesRequest>, Validators.ProductCategoryImageRequestValidator>();
            services.AddTransient<FluentValidation.IValidator<GetProductImagesRequest>, Validators.GetProductImageRequestValidator>();
            services.AddTransient<FluentValidation.IValidator<UpdateProductVariantInventoryRequest>, Validators.UpdateProductVariantInventoryRequestValidator>();
            services.AddTransient<FluentValidation.IValidator<CustomerProductListRequest>, Validators.CustomerProductListRequestValidator>();
            services.AddTransient<FluentValidation.IValidator<CreateCouponRequest>, Validators.Coupon.CreateCouponRequestValidator>();
            services.AddTransient<FluentValidation.IValidator<UpdateCouponRequest>, Validators.Coupon.UpdateCouponRequestValidator>();
            services.AddTransient<FluentValidation.IValidator<CreateAdminReviewRequest>, Validators.Review.AdminReviewRequestValidator>();
            services.AddTransient<FluentValidation.IValidator<UpdateAdminReviewRequest>, Validators.Review.UpdateAdminReviewRequestValidator>();
            services.AddTransient<FluentValidation.IValidator<FaqWriteRequest>, Validators.FAQ.FaqWriteRequestValidator>();
            services.AddTransient<FluentValidation.IValidator<HomepageCmsWriteRequest>, Validators.HomepageCms.HomepageCmsWriteRequestValidator>();
            services.AddTransient<FluentValidation.IValidator<CreateProviderCredentialRequest>, Validators.ProviderCredentials.CreateProviderCredentialRequestValidator>();
            services.AddTransient<FluentValidation.IValidator<UpdateProviderCredentialRequest>, Validators.ProviderCredentials.UpdateProviderCredentialRequestValidator>();
            services.AddScoped<IValidatorManager, ValidatorManager>();

            return services;
        }
    }
}
