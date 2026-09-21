using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.Options;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Policy;
using pramukhraj.BackgroundServices;
using pramukhraj.BackgroundServices.Tasks;
using pramukhraj.Configurations;
using pramukhraj.Database;
using pramukhraj.DTOs.Coupon;
using pramukhraj.DTOs.FAQ;
using pramukhraj.DTOs.HomepageCms;
using pramukhraj.DTOs.Product;
using pramukhraj.DTOs.ProviderCredentials;
using pramukhraj.DTOs.Cart.Requests;
using pramukhraj.DTOs.EmailTemplates;
using pramukhraj.Common;
using pramukhraj.Entities;
using pramukhraj.Interfaces;
using pramukhraj.Services;
using pramukhraj.Authorization;
using pramukhraj.DTOs.Checkout;
using pramukhraj.DTOs.Customer;
using pramukhraj.DTOs.Settings;
using System.Text;
using System.Net;
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
            services.Configure<ForwardedHeadersOptions>(options =>
            {
                options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
                options.ForwardLimit = 1;
                foreach (var value in configuration.GetSection("ReverseProxy:KnownProxies").Get<string[]>() ?? [])
                {
                    if (IPAddress.TryParse(value, out var address)) options.KnownProxies.Add(address);
                }
            });

            services.AddOptions<BackgroundServiceOptions>()
                .Bind(configuration.GetSection(BackgroundServiceOptions.SectionName))
                .ValidateOnStart();
            services.AddSingleton<IValidateOptions<BackgroundServiceOptions>, BackgroundServiceOptionsValidator>();
            services.AddSingleton<IBackgroundMetricsStore, BackgroundMetricsStore>();
            services.AddSingleton<ServerMetricsSampler>();
            services.AddHealthChecks()
                .AddCheck<DatabaseHealthCheck>("PostgreSQL");
            services.AddScoped<IApplicationBackgroundTask, ManageExpiredCartsTask>();
            services.AddScoped<IApplicationBackgroundTask, RemoveExpiredOtpChallengesTask>();
            services.AddScoped<IApplicationBackgroundTask, CleanExpiredRefreshTokensTask>();
            services.AddScoped<IApplicationBackgroundTask, CleanExpiredAdminRefreshTokensTask>();
            services.AddScoped<IApplicationBackgroundTask, ExpireCheckoutSessionsTask>();
            services.AddScoped<IApplicationBackgroundTask, ExpirePendingPaymentOrdersTask>();
            services.AddScoped<IApplicationBackgroundTask, ExpireInventoryReservationsTask>();
            services.AddScoped<IApplicationBackgroundTask, ReconcilePendingRazorpayPaymentsTask>();
            services.AddScoped<IApplicationBackgroundTask, ProcessPaymentOutboxTask>();
            services.AddScoped<IApplicationBackgroundTask, CleanupAdminNotificationsTask>();
            services.AddHostedService<ApplicationBackgroundService>();

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
            var authentication = services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            });

            void ConfigureCustomerJwt(JwtBearerOptions options)
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
            }

            authentication.AddJwtBearer(JwtBearerDefaults.AuthenticationScheme, ConfigureCustomerJwt);
            authentication.AddJwtBearer(CustomerAuthenticationDefaults.AuthenticationScheme, ConfigureCustomerJwt);

            services.AddAuthorization(options => options.AddPolicy(
                CustomerAuthenticationDefaults.VerifiedCustomerPolicy,
                policy =>
                {
                    policy.AddAuthenticationSchemes(CustomerAuthenticationDefaults.AuthenticationScheme);
                    policy.RequireAuthenticatedUser();
                    policy.AddRequirements(new VerifiedCustomerRequirement());
                }));
            services.AddScoped<IAuthorizationHandler, VerifiedCustomerAuthorizationHandler>();
            services.AddSingleton<IAuthorizationMiddlewareResultHandler, CustomerAuthorizationResultHandler>();

            // CORS - enterprise default policy
            var allowedOrigins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? new[] { "https://localhost:7136", "http://localhost:5173", "https://bufing-orbit-productivity-divisions.trycloudflare.com" };
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
                options.AddPolicy("cart-mutation", context => RateLimitPartition.GetFixedWindowLimiter(
                    context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                        ?? context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 60, Window = TimeSpan.FromMinutes(1), QueueLimit = 0,
                        AutoReplenishment = true
                    }));
                options.AddPolicy("guest-cart-resolve", context => RateLimitPartition.GetFixedWindowLimiter(
                    context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 30, Window = TimeSpan.FromMinutes(1), QueueLimit = 0,
                        AutoReplenishment = true
                    }));
                options.AddPolicy("admin-notification-stream", context => RateLimitPartition.GetConcurrencyLimiter(
                    context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                        ?? context.User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
                        ?? context.Connection.RemoteIpAddress?.ToString()
                        ?? "unknown",
                    _ => new ConcurrencyLimiterOptions
                    {
                        PermitLimit = 2,
                        QueueLimit = 0,
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst
                    }));
                options.AddPolicy("customer-verification-send", context => RateLimitPartition.GetFixedWindowLimiter(
                    context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                        ?? context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 5, Window = TimeSpan.FromMinutes(10), QueueLimit = 0,
                        AutoReplenishment = true
                    }));
                options.AddPolicy("customer-verification-verify", context => RateLimitPartition.GetFixedWindowLimiter(
                    context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                        ?? context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 15, Window = TimeSpan.FromMinutes(10), QueueLimit = 0,
                        AutoReplenishment = true
                    }));
                options.AddPolicy("customer-checkout", context => RateLimitPartition.GetFixedWindowLimiter(
                    context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                        ?? context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 60, Window = TimeSpan.FromMinutes(1), QueueLimit = 0,
                        AutoReplenishment = true
                    }));
                options.AddPolicy("razorpay-webhook", context => RateLimitPartition.GetFixedWindowLimiter(
                    context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 120, Window = TimeSpan.FromMinutes(1), QueueLimit = 0,
                        AutoReplenishment = true
                    }));
                options.AddPolicy("shiprocket-webhook", context => RateLimitPartition.GetFixedWindowLimiter(
                    context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 120, Window = TimeSpan.FromMinutes(1), QueueLimit = 0,
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
            services.AddScoped<IEmailService, SmtpEmailService>();
            services.AddScoped<IEmailTemplateService, EmailTemplateService>();
            services.AddSingleton<EmailDeliveryQueue>();
            services.AddSingleton<IEmailQueue>(provider => provider.GetRequiredService<EmailDeliveryQueue>());
            services.AddHostedService(provider => provider.GetRequiredService<EmailDeliveryQueue>());
            services.AddHttpContextAccessor();
            services.AddScoped<CustomerClaimsHelper>();
            services.AddScoped<ICartService, CartService>();
            services.AddScoped<IAdminMonitoringService, AdminMonitoringService>();
            services.AddScoped<IAdminCustomerService, AdminCustomerService>();
            services.AddSingleton<AdminNotificationStreamHub>();
            services.AddSingleton<PostgresAdminNotificationBackplane>();
            services.AddSingleton<IAdminNotificationBackplane>(provider => provider.GetRequiredService<PostgresAdminNotificationBackplane>());
            services.AddHostedService(provider => provider.GetRequiredService<PostgresAdminNotificationBackplane>());
            services.AddScoped<IAdminNotificationService, AdminNotificationService>();
            services.AddScoped<ICustomerOtpSender, TwilioCustomerOtpSender>();
            services.AddScoped<ICustomerVerificationService, CustomerVerificationService>();
            services.AddScoped<ICustomerAddressService, CustomerAddressService>();
            services.AddScoped<IPricingService, PricingService>();
            services.AddHttpClient<IShiprocketRateService, ShiprocketRateService>(client =>
            {
                client.BaseAddress = new Uri("https://apiv2.shiprocket.in/v1/external/");
                client.Timeout = TimeSpan.FromSeconds(15);
            });
            services.AddScoped<ICheckoutService, CheckoutService>();
            services.AddScoped<IStoreSettingsService, StoreSettingsService>();
            services.AddScoped<IInventoryReservationService, InventoryReservationService>();
            services.AddHttpClient<IPaymentService, RazorpayPaymentService>(client =>
            {
                client.BaseAddress = new Uri("https://api.razorpay.com/v1/");
                client.Timeout = TimeSpan.FromSeconds(15);
            });
            services.AddScoped<IOrderService, OrderService>();
            services.AddHttpClient<IShiprocketFulfillmentService, ShiprocketFulfillmentService>(client =>
            {
                client.BaseAddress = new Uri("https://apiv2.shiprocket.in/v1/external/");
                client.Timeout = TimeSpan.FromSeconds(30);
            });
            services.AddScoped<ICustomerOrderService, CustomerOrderService>();
            services.AddScoped<IAdminOrderService, AdminOrderService>();
            services.AddScoped<IAdminPaymentService, AdminPaymentService>();
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
            services.AddTransient<FluentValidation.IValidator<DTOs.Customer.AdminCustomerListRequest>, Validators.Customer.AdminCustomerListRequestValidator>();
            services.AddTransient<FluentValidation.IValidator<DTOs.Customer.PatchAdminCustomerRequest>, Validators.Customer.PatchAdminCustomerRequestValidator>();
            services.AddTransient<FluentValidation.IValidator<SmtpProviderCredentials>, Validators.ProviderCredentials.SmtpProviderCredentialsValidator>();
            services.AddTransient<FluentValidation.IValidator<ShiprocketProviderCredentials>, Validators.ProviderCredentials.ShiprocketProviderCredentialsValidator>();
            services.AddTransient<FluentValidation.IValidator<RazorpayProviderCredentials>, Validators.ProviderCredentials.RazorpayProviderCredentialsValidator>();
            services.AddTransient<FluentValidation.IValidator<EmailTemplateWriteRequest>, Validators.EmailTemplates.EmailTemplateWriteRequestValidator>();
            services.AddTransient<FluentValidation.IValidator<AddCartItemRequest>, Validators.Cart.AddCartItemRequestValidator>();
            services.AddTransient<FluentValidation.IValidator<UpdateCartItemQuantityRequest>, Validators.Cart.UpdateCartItemQuantityRequestValidator>();
            services.AddTransient<FluentValidation.IValidator<ChangeCartItemVariantRequest>, Validators.Cart.ChangeCartItemVariantRequestValidator>();
            services.AddTransient<FluentValidation.IValidator<UpdateCartItemSelectionRequest>, Validators.Cart.UpdateCartItemSelectionRequestValidator>();
            services.AddTransient<FluentValidation.IValidator<ResolveGuestCartRequest>, Validators.Cart.ResolveGuestCartRequestValidator>();
            services.AddTransient<FluentValidation.IValidator<MergeGuestCartRequest>, Validators.Cart.MergeGuestCartRequestValidator>();
            services.AddTransient<FluentValidation.IValidator<VerifyContactCodeRequest>, Validators.Customer.VerifyContactCodeRequestValidator>();
            services.AddTransient<FluentValidation.IValidator<UpdateCustomerEmailRequest>, Validators.Customer.UpdateCustomerEmailRequestValidator>();
            services.AddTransient<FluentValidation.IValidator<CustomerAddressWriteRequest>, Validators.Customer.CustomerAddressWriteRequestValidator>();
            services.AddTransient<FluentValidation.IValidator<InitializeCheckoutRequest>, Validators.Checkout.InitializeCheckoutRequestValidator>();
            services.AddTransient<FluentValidation.IValidator<UpdateCheckoutAddressRequest>, Validators.Checkout.UpdateCheckoutAddressRequestValidator>();
            services.AddTransient<FluentValidation.IValidator<ApplyCheckoutCouponRequest>, Validators.Checkout.ApplyCheckoutCouponRequestValidator>();
            services.AddTransient<FluentValidation.IValidator<StoreSettingsWriteRequest>, Validators.Settings.StoreSettingsWriteRequestValidator>();
            services.AddTransient<FluentValidation.IValidator<DTOs.Order.PlaceOrderRequest>, Validators.Order.PlaceOrderRequestValidator>();
            services.AddTransient<FluentValidation.IValidator<DTOs.Order.VerifyRazorpayPaymentRequest>, Validators.Order.VerifyRazorpayPaymentRequestValidator>();
            services.AddScoped<IValidatorManager, ValidatorManager>();

            return services;
        }
    }
}
