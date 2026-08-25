using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using pramukhraj.Configurations;
using pramukhraj.Database;
using pramukhraj.DTOs.Product;
using pramukhraj.Entities;
using pramukhraj.Interfaces;
using System.Text;
using static pramukhraj.DTOs.Product.ProductCategoryRequestResponse;


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
                    opt.PermitLimit = 7;
                    opt.Window = TimeSpan.FromMinutes(1);
                    opt.QueueLimit = 0;
                });
            });

            // Register token service
            services.AddScoped<IServiceManager, ServiceManager>();

            return services;
        }

        public static IServiceCollection AddApplication(this IServiceCollection services)
        {
            // AutoMapper
            services.AddAutoMapper(typeof(pramukhraj.Mapping.MappingProfile));

            // FluentValidation - register validators explicitly
            services.AddTransient<FluentValidation.IValidator<pramukhraj.DTOs.Auth.RegisterRequest>, pramukhraj.Validators.RegisterRequestValidator>();
            services.AddTransient<FluentValidation.IValidator<pramukhraj.DTOs.Auth.LoginRequest>, pramukhraj.Validators.LoginRequestValidator>();
            services.AddTransient<FluentValidation.IValidator<pramukhraj.DTOs.Auth.CustomerRegisterRequest>, pramukhraj.Validators.CustomerRegisterValidator>();
            services.AddTransient<FluentValidation.IValidator<pramukhraj.DTOs.Auth.CustomerLoginRequest>, pramukhraj.Validators.CustomerLoginValidator>();
            services.AddTransient<FluentValidation.IValidator<pramukhraj.DTOs.Product.AddProductCategoryRequest>, pramukhraj.Validators.ProductCategoryRequestValidator>();
            services.AddTransient<FluentValidation.IValidator<pramukhraj.DTOs.Product.AddProductRequest>, pramukhraj.Validators.ProductRequestValidator>();
            services.AddTransient<FluentValidation.IValidator<GetProductCategoriesImagesRequest>, pramukhraj.Validators.ProductCategoryImageRequestValidator>();
            services.AddTransient<FluentValidation.IValidator<GetProductImagesRequest>, pramukhraj.Validators.GetProductImageRequestValidator>();

            return services;
        }
    }
}
