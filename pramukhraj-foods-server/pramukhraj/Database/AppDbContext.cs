using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using pramukhraj.Entities;
using pramukhraj.Entities.Cart;
using pramukhraj.Entities.Coupon;
using pramukhraj.Entities.Customer;
using pramukhraj.Entities.FAQs;
using pramukhraj.Entities.Product;
using pramukhraj.Entities.ProviderCredentials;
using pramukhraj.Entities.Notifications;
using pramukhraj.Entities.Review; // Ensure this namespace covers your new models
using pramukhraj.Entities.EmailTemplates;
using pramukhraj.Entities.Checkout;
using pramukhraj.Entities.Settings;
using pramukhraj.Entities.Order;
using pramukhraj.Entities.Shipment;
using pramukhraj.Entities.Return;

namespace pramukhraj.Database
{
    /// <summary>
    /// Application Entity Framework Core DbContext.
    /// </summary>
    public class AppDbContext : IdentityDbContext<ApplicationUser>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
        // --- New E-Commerce DbSets ---
        public DbSet<Product> Products => Set<Product>();
        public DbSet<ProductCategory> ProductCategories => Set<ProductCategory>();
        public DbSet<ProductImage> ProductImages => Set<ProductImage>();
        public DbSet<ProductTag> ProductTags => Set<ProductTag>();
        public DbSet<ProductVariant> ProductVariants => Set<ProductVariant>();
        public DbSet<Cart> Carts => Set<Cart>();
        public DbSet<CartItem> CartItems => Set<CartItem>();
        public DbSet<AdminAction> AdminActions => Set<AdminAction>();
        public DbSet<Coupon> Coupons => Set<Coupon>();
        public DbSet<CouponScope> CouponScopes => Set<CouponScope>();
        public DbSet<CouponUsage> CouponUsages => Set<CouponUsage>();
        public DbSet<Review> Reviews => Set<Review>();
        public DbSet<FAQs> Faqs => Set<FAQs>();
        public DbSet<HomepageCMS> HomepageCms => Set<HomepageCMS>();
        public DbSet<Customer> Customers => Set<Customer>();
        public DbSet<CustomerOtpChallenge> CustomerOtpChallenges => Set<CustomerOtpChallenge>();
        public DbSet<CustomerRefreshTokens> CustomerRefreshTokens => Set<CustomerRefreshTokens>();
        public DbSet<CustomerAddresses> CustomerAddresses => Set<CustomerAddresses>();
        public DbSet<ProviderCredentials> ProviderCredentials => Set<ProviderCredentials>();
        public DbSet<AdminNotification> AdminNotifications => Set<AdminNotification>();
        public DbSet<AdminNotificationRecipient> AdminNotificationRecipients => Set<AdminNotificationRecipient>();
        public DbSet<EmailTemplate> EmailTemplates => Set<EmailTemplate>();
        public DbSet<CustomerEmailVerificationChallenge> CustomerEmailVerificationChallenges => Set<CustomerEmailVerificationChallenge>();
        public DbSet<CheckoutSession> CheckoutSessions => Set<CheckoutSession>();
        public DbSet<StoreSettings> StoreSettings => Set<StoreSettings>();
        public DbSet<Order> Orders => Set<Order>();
        public DbSet<OrderItem> OrderItems => Set<OrderItem>();
        public DbSet<OrderAddress> OrderAddresses => Set<OrderAddress>();
        public DbSet<OrderStatusHistory> OrderStatusHistories => Set<OrderStatusHistory>();
        public DbSet<Payment> Payments => Set<Payment>();
        public DbSet<PaymentTransaction> PaymentTransactions => Set<PaymentTransaction>();
        public DbSet<InventoryReservation> InventoryReservations => Set<InventoryReservation>();
        public DbSet<WebhookInboxEvent> WebhookInboxEvents => Set<WebhookInboxEvent>();
        public DbSet<OutboxMessage> OutboxMessages => Set<OutboxMessage>();
        public DbSet<Shipment> Shipments => Set<Shipment>();
        public DbSet<ShipmentActivity> ShipmentActivities => Set<ShipmentActivity>();
        public DbSet<ReturnRequest> ReturnRequests => Set<ReturnRequest>();
        public DbSet<ReturnItem> ReturnItems => Set<ReturnItem>();
        public DbSet<ReturnMedia> ReturnMedia => Set<ReturnMedia>();
        public DbSet<ReturnStatusHistory> ReturnStatusHistories => Set<ReturnStatusHistory>();
        public DbSet<RefundRecord> RefundRecords => Set<RefundRecord>();

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Configure RowVersion for concurrency across entities that include it.
            builder.Entity<ApplicationUser>(b =>
            {
                b.Property(u => u.RowVersion).IsRowVersion();
                b.HasIndex(u => u.NormalizedEmail).HasDatabaseName("IX_Users_NormalizedEmail");
            });

            builder.Entity<RefreshToken>(b =>
            {
                b.HasKey(t => t.Id);
                b.Property(t => t.Token).IsRequired();
                b.HasIndex(t => t.Token).IsUnique();
                b.Property(t => t.CreatedAt).HasDefaultValueSql("now()");
                b.HasOne<ApplicationUser>().WithMany().HasForeignKey(t => t.UserId).OnDelete(DeleteBehavior.Cascade);
            });

            builder.Entity<AdminNotification>(entity =>
            {
                entity.HasKey(item => item.Id);
                entity.Property(item => item.Type).HasMaxLength(100).IsRequired();
                entity.Property(item => item.Severity).HasMaxLength(30).IsRequired();
                entity.Property(item => item.Title).HasMaxLength(200).IsRequired();
                entity.Property(item => item.Message).HasMaxLength(1000).IsRequired();
                entity.Property(item => item.EntityType).HasMaxLength(100);
                entity.Property(item => item.EntityId).HasMaxLength(100);
                entity.Property(item => item.ActionUrl).HasMaxLength(500);
                if (Database.IsNpgsql())
                    entity.Property(item => item.SequenceNumber).HasDefaultValueSql("nextval('\"AdminNotificationSequence\"')").ValueGeneratedOnAdd();
                else
                    entity.Property(item => item.SequenceNumber).ValueGeneratedNever();
                entity.Property(item => item.DeduplicationKey).HasMaxLength(250).IsRequired();
                entity.HasIndex(item => item.SequenceNumber).IsUnique();
                entity.HasIndex(item => item.DeduplicationKey).IsUnique();
                entity.HasIndex(item => item.CreatedOn);
                entity.HasIndex(item => new { item.Type, item.CreatedOn });
            });

            builder.Entity<AdminNotificationRecipient>(entity =>
            {
                entity.ToTable("AdminNotificationStates");
                entity.HasKey(item => item.Id);
                entity.Property(item => item.Id).HasDefaultValueSql("gen_random_uuid()");
                entity.Property(item => item.AdminId).HasMaxLength(450).IsRequired();
                entity.HasIndex(item => new { item.NotificationId, item.AdminId }).IsUnique();
                entity.HasIndex(item => new { item.AdminId, item.ReadOn, item.DismissedOn, item.NotificationId });
                entity.HasOne(item => item.Notification).WithMany(item => item.Recipients)
                    .HasForeignKey(item => item.NotificationId).OnDelete(DeleteBehavior.Cascade);
                entity.HasOne<ApplicationUser>().WithMany().HasForeignKey(item => item.AdminId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            builder.Entity<EmailTemplate>(entity =>
            {
                entity.HasKey(item => item.Id);
                entity.Property(item => item.Key).HasMaxLength(100).IsRequired();
                entity.Property(item => item.Name).HasMaxLength(150).IsRequired();
                entity.Property(item => item.Description).HasMaxLength(500);
                entity.Property(item => item.Category).HasConversion<string>().HasMaxLength(30);
                entity.Property(item => item.Subject).HasMaxLength(300).IsRequired();
                entity.Property(item => item.DesignJson).HasColumnType("jsonb").IsRequired();
                entity.Property(item => item.HtmlContent).HasColumnType("text").IsRequired();
                entity.Property(item => item.PlainTextContent).HasColumnType("text");
                entity.Property(item => item.VariablesJson).HasColumnType("jsonb").IsRequired();
                entity.Property(item => item.AttachmentsJson).HasColumnType("jsonb").IsRequired();
                entity.Property(item => item.ConcurrencyStamp).IsConcurrencyToken();
                entity.HasIndex(item => item.Key).IsUnique().HasFilter("\"IsDeleted\" = FALSE");
                entity.HasIndex(item => new { item.IsActive, item.IsDeleted, item.Category });
            });

            // --- Admin Actions ---
            builder.Entity<AdminAction>(entity =>
            {
                entity.HasKey(x => x.Id);
                entity.HasIndex(x => x.AdminId);
                entity.HasIndex(x => x.Module);
                entity.HasIndex(x => x.Action);
                entity.HasIndex(x => x.EntityId);
                entity.HasIndex(x => x.CreatedOn);
                entity.HasIndex(x => new
                {
                    x.Module,
                    x.CreatedOn
                });
                entity.HasIndex(x => new
                {
                    x.AdminId,
                    x.CreatedOn
                });
                entity.Property(x => x.AdminName)
                    .HasMaxLength(150)
                    .IsRequired();
                entity.Property(x => x.Module)
                    .HasMaxLength(100)
                    .IsRequired();
                entity.Property(x => x.Action)
                    .HasMaxLength(50)
                    .IsRequired();
                entity.Property(x => x.EntityName)
                    .HasMaxLength(250);
                entity.Property(x => x.Description)
                    .HasMaxLength(1000);
            });

            // --- Customer Configurations ---

            builder.Entity<Customer>(b =>
            {
                b.Property(c => c.CreatedOn).HasDefaultValueSql("now()");
                b.Property(c => c.UpdatedOn).HasDefaultValueSql("now()");
                b.HasMany(c => c.RefreshTokens).WithOne(t => t.Customer)
                    .HasForeignKey(t => t.CustomerId).OnDelete(DeleteBehavior.Cascade);
                b.HasMany(c => c.Addresses).WithOne(a => a.Customer)
                    .HasForeignKey(a => a.CustomerId).OnDelete(DeleteBehavior.Cascade);
            });

            builder.Entity<CustomerOtpChallenge>()
                .HasOne(x => x.Customer).WithMany()
                .HasForeignKey(x => x.CustomerId).OnDelete(DeleteBehavior.SetNull);

            builder.Entity<CustomerEmailVerificationChallenge>(b =>
            {
                b.HasOne(x => x.Customer).WithMany(x => x.EmailVerificationChallenges)
                    .HasForeignKey(x => x.CustomerId).OnDelete(DeleteBehavior.Cascade);
            });
            if (Database.IsNpgsql()) builder.HasSequence<long>("AdminNotificationSequence");

            builder.Entity<CustomerAddresses>(b =>
            {
                b.Property(x => x.ConcurrencyStamp).IsConcurrencyToken();
                b.HasIndex(x => x.CustomerId).IsUnique()
                    .HasFilter("\"IsActive\" AND \"IsDefaultShipping\"")
                    .HasDatabaseName("IX_CustomerAddresses_DefaultShipping");
                b.HasIndex(x => x.CustomerId).IsUnique()
                    .HasFilter("\"IsActive\" AND \"IsDefaultBilling\"")
                    .HasDatabaseName("IX_CustomerAddresses_DefaultBilling");
            });

            builder.Entity<CheckoutSession>(b =>
            {
                b.Property(x => x.ConcurrencyStamp).IsConcurrencyToken();
                b.HasOne<Customer>().WithMany().HasForeignKey(x => x.CustomerId).OnDelete(DeleteBehavior.Restrict);
                b.HasOne<Cart>().WithMany().HasForeignKey(x => x.CartId).OnDelete(DeleteBehavior.Restrict);
                b.HasOne<CustomerAddresses>().WithMany().HasForeignKey(x => x.ShippingAddressId).OnDelete(DeleteBehavior.Restrict);
                b.HasOne<CustomerAddresses>().WithMany().HasForeignKey(x => x.BillingAddressId).OnDelete(DeleteBehavior.Restrict);
                b.HasOne<Coupon>().WithMany().HasForeignKey(x => x.CouponId).OnDelete(DeleteBehavior.Restrict);
            });

            builder.Entity<StoreSettings>(b =>
            {
                b.Property(x => x.Id).ValueGeneratedNever();
                b.Property(x => x.SettingsJson).HasColumnType("jsonb").IsRequired();
                b.Property(x => x.ConcurrencyStamp).HasMaxLength(64).IsConcurrencyToken();
                b.ToTable("StoreSettings", table => table.HasCheckConstraint("CK_StoreSettings_SingleRow", "\"Id\" = 1"));
            });

            builder.Entity<Order>(b =>
            {
                b.Property(x => x.Status).HasConversion<string>().HasMaxLength(30);
                b.Property(x => x.ConcurrencyStamp).IsConcurrencyToken();
                b.HasOne<Customer>().WithMany().HasForeignKey(x => x.CustomerId).OnDelete(DeleteBehavior.Restrict);
                b.HasOne<CheckoutSession>().WithMany().HasForeignKey(x => x.CheckoutSessionId).OnDelete(DeleteBehavior.Restrict);
                b.HasMany(x => x.Items).WithOne(x => x.Order).HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.Restrict);
                b.HasMany(x => x.Addresses).WithOne(x => x.Order).HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.Restrict);
                b.HasMany(x => x.Payments).WithOne(x => x.Order).HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.Restrict);
            });
            builder.Entity<OrderStatusHistory>(b =>
            {
                b.Property(x => x.Status).HasConversion<string>().HasMaxLength(30);
                b.HasOne<Order>().WithMany().HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.Restrict);
                b.HasIndex(x => new { x.OrderId, x.CreatedOn });
            });
            builder.Entity<Payment>(b =>
            {
                b.Property(x => x.Status).HasConversion<string>().HasMaxLength(30);
                b.Property(x => x.ConcurrencyStamp).IsConcurrencyToken();
                b.HasIndex(x => x.OrderId);
            });
            builder.Entity<PaymentTransaction>(b =>
            {
                b.Property(x => x.SafePayloadJson).HasColumnType("jsonb");
                b.HasOne<Payment>().WithMany().HasForeignKey(x => x.PaymentId).OnDelete(DeleteBehavior.Restrict);
                b.HasIndex(x => new { x.PaymentId, x.CreatedOn });
            });
            builder.Entity<InventoryReservation>(b =>
            {
                b.Property(x => x.Status).HasConversion<string>().HasMaxLength(30);
                b.HasOne<Order>().WithMany().HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.Restrict);
                b.HasOne<ProductVariant>().WithMany().HasForeignKey(x => x.ProductVariantId).OnDelete(DeleteBehavior.Restrict);
                b.HasIndex(x => new { x.Status, x.ExpiresOn });
            });
            builder.Entity<WebhookInboxEvent>(b => b.Property(x => x.PayloadJson).HasColumnType("jsonb"));
            builder.Entity<OutboxMessage>(b =>
            {
                b.Property(x => x.PayloadJson).HasColumnType("jsonb");
                b.Property(x => x.Status).HasConversion<string>().HasMaxLength(30);
            });

            // --- Product Category Configurations ---
            builder.Entity<ProductCategory>(b =>
            {
                b.Property(c => c.CreatedOn).HasDefaultValueSql("now()");
                b.Property(c => c.UpdatedOn).HasDefaultValueSql("now()");

            });

            // --- Product Configurations ---
            builder.Entity<Product>(b =>
            {
                b.Property(p => p.CreatedOn).HasDefaultValueSql("now()");
                b.Property(p => p.UpdatedOn).HasDefaultValueSql("now()");

                // Prevent accidentally deleting all products if a category is deleted
                b.HasOne(p => p.Category)
                 .WithMany()
                 .HasForeignKey(p => p.CategoryId)
                 .OnDelete(DeleteBehavior.Restrict);

                builder.Entity<Product>()
                .HasIndex(product => new
                {
                    product.CategoryId,
                    product.IsActive
                });
            });

            // --- Product Image Configurations ---
            builder.Entity<ProductImage>(b =>
            {
                b.HasOne(pi => pi.Product)
                 .WithMany(p => p.Images)
                 .HasForeignKey(pi => pi.ProductId)
                 .OnDelete(DeleteBehavior.Cascade); // Deleting a product deletes its images
            });

            // --- Product Tag Configurations ---
            builder.Entity<ProductTag>(b =>
            {
                b.HasOne(pt => pt.Product)
                 .WithMany(p => p.Tags)
                 .HasForeignKey(pt => pt.ProductId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            // --- Product Variant Configurations ---
            builder.Entity<ProductVariant>(b =>
            {
                b.HasOne(pv => pv.Product)
                 .WithMany(p => p.Variants)
                 .HasForeignKey(pv => pv.ProductId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            // --- Cart Configurations ---
            builder.Entity<Cart>(b =>
            {
                b.HasKey(cart => cart.Id);

                /*
                 * PostgreSQL partial unique index:
                 * one active cart per customer.
                 */
                b.HasIndex(cart => cart.CustomerId)
                    .IsUnique()
                    .HasFilter("\"Status\" = 1");

                b.HasOne(cart => cart.Customer)
                    .WithMany(customer => customer.Carts)
                    .HasForeignKey(cart => cart.CustomerId)
                    .OnDelete(DeleteBehavior.Restrict);

                b.HasMany(cart => cart.Items)
                    .WithOne(item => item.Cart)
                    .HasForeignKey(item => item.CartId)
                    .OnDelete(DeleteBehavior.Cascade);

                b.Property(cart => cart.ConcurrencyStamp)
                    .IsConcurrencyToken();
            });

            // --- Cart Item Configurations ---
            builder.Entity<CartItem>(b =>
            {
                b.HasKey(item => item.Id);

                b.Property(item => item.Quantity)
                    .IsRequired();

                b.HasIndex(item => new
                {
                    item.CartId,
                    item.ProductVariantId
                })
                .IsUnique();

                b.HasOne(item => item.ProductVariant)
                    .WithMany()
                    .HasForeignKey(item => item.ProductVariantId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // --- Coupon Configurations ---
            builder.Entity<Coupon>(entity =>
            {
                entity.Property(coupon => coupon.Version)
                    .IsConcurrencyToken();

                entity.HasIndex(coupon => coupon.IsDeleted);

                entity.Property(coupon => coupon.DiscountType)
                    .HasConversion<string>()
                    .HasMaxLength(30);

                entity.Property(coupon => coupon.ApplicationScope)
                    .HasConversion<string>()
                    .HasMaxLength(30);

                entity.ToTable("Coupons", table =>
                {
                    table.HasCheckConstraint(
                        "CK_Coupons_CodeUppercase",
                        "\"Code\" = UPPER(\"Code\")");

                    table.HasCheckConstraint(
                        "CK_Coupons_DateRange",
                        "\"StartOn\" < \"EndOn\"");

                    table.HasCheckConstraint(
                        "CK_Coupons_DiscountValue",
                        """
                        (
                            "DiscountType" = 'FreeShipping'
                            AND "DiscountValue" = 0
                        )
                        OR
                        (
                            "DiscountType" = 'FlatAmount'
                            AND "DiscountValue" > 0
                        )
                        OR
                        (
                            "DiscountType" = 'Percentage'
                            AND "DiscountValue" > 0
                            AND "DiscountValue" <= 100
                        )
                        """);

                    table.HasCheckConstraint(
                        "CK_Coupons_MinimumOrderAmount",
                        "\"MinimumOrderAmount\" >= 0");

                    table.HasCheckConstraint(
                            "CK_Coupons_MaximumDiscountAmount",
                            """
                            "MaximumDiscountAmount" IS NULL
                            OR "MaximumDiscountAmount" > 0
                            """);

                    table.HasCheckConstraint(
                        "CK_Coupons_TotalUsageLimit",
                        """
                        "TotalUsageLimit" IS NULL
                        OR "TotalUsageLimit" > 0
                        """);

                    table.HasCheckConstraint(
                        "CK_Coupons_PerCustomerUsageLimit",
                        """
                        "PerCustomerUsageLimit" IS NULL
                        OR "PerCustomerUsageLimit" > 0
                        """);
                });
            });

            builder.Entity<CouponScope>(entity =>
            {
                entity.Property(scope => scope.ScopeType)
                    .HasConversion<string>()
                    .HasMaxLength(20);

                entity.HasIndex(scope => new
                {
                    scope.CouponId,
                    scope.ProductId
                })
                    .IsUnique()
                    .HasFilter("\"ProductId\" IS NOT NULL");

                entity.HasIndex(scope => new
                {
                    scope.CouponId,
                    scope.CategoryId
                })
                    .IsUnique()
                    .HasFilter("\"CategoryId\" IS NOT NULL");

                entity.HasOne(scope => scope.Coupon)
                    .WithMany(coupon => coupon.Scopes)
                    .HasForeignKey(scope => scope.CouponId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(scope => scope.Product)
                    .WithMany()
                    .HasForeignKey(scope => scope.ProductId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(scope => scope.Category)
                    .WithMany()
                    .HasForeignKey(scope => scope.CategoryId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.ToTable("CouponScopes", table =>
                {
                    table.HasCheckConstraint(
                        "CK_CouponScopes_Target",
                        """
                        (
                            "ScopeType" = 'Product'
                            AND "ProductId" IS NOT NULL
                            AND "CategoryId" IS NULL
                        )
                        OR
                        (
                            "ScopeType" = 'Category'
                            AND "CategoryId" IS NOT NULL
                            AND "ProductId" IS NULL
                        )
                        """);
                });
            });

            builder.Entity<CouponUsage>(entity =>
            {
                entity.Property(usage => usage.Status)
                    .HasConversion<string>()
                    .HasMaxLength(20);

                entity.Property(usage => usage.ReleaseReason)
                    .HasMaxLength(500);

                entity.HasIndex(usage => new
                {
                    usage.CouponId,
                    usage.OrderId
                })
                    .IsUnique()
                    .HasFilter("\"OrderId\" IS NOT NULL");

                entity.HasOne(usage => usage.Coupon)
                    .WithMany(coupon => coupon.Usages)
                    .HasForeignKey(usage => usage.CouponId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.ToTable("CouponUsages", table =>
                {
                    table.HasCheckConstraint(
                        "CK_CouponUsages_OrderSubtotal",
                        "\"OrderSubtotal\" >= 0");

                    table.HasCheckConstraint(
                        "CK_CouponUsages_DiscountAmount",
                        """
                        "DiscountAmount" >= 0
                        AND "DiscountAmount" <= "OrderSubtotal"
                        """);
                 });
            });

            // --- Review Configurations ---
            builder.Entity<Review>(review =>
            {
                        review.Property(item => item.ReviewType)
                            .HasConversion<int>();

                        review.Property(item => item.Source)
                            .HasConversion<int>();

                        review.Property(item => item.Status)
                            .HasConversion<int>();

                        review.HasOne(item => item.Customer)
                            .WithMany()
                            .HasForeignKey(item => item.CustomerId)
                            .OnDelete(DeleteBehavior.SetNull);

                        review.HasOne(item => item.Product)
                            .WithMany()
                            .HasForeignKey(item => item.ProductId)
                            .OnDelete(DeleteBehavior.Restrict);

                        review.HasIndex(item => item.OrderItemId)
                            .IsUnique()
                            .HasFilter("\"OrderItemId\" IS NOT NULL");

                        review.HasIndex(item => new
                            {
                                item.Rating,
                                item.CreatedOn,
                                item.Id
                            })
                            .HasDatabaseName("IX_Reviews_PublicTestimonials")
                            .IsDescending()
                            .HasFilter(
                                "\"ReviewType\" = 2 AND \"Status\" = 2 AND \"IsFeatured\" AND \"IsActive\" AND \"HasCustomerConsent\"");

                        review.ToTable("Reviews", table =>
                        {
                            table.HasCheckConstraint(
                                "CK_Reviews_Rating",
                                "\"Rating\" BETWEEN 1 AND 5");

                            table.HasCheckConstraint(
                                "CK_Reviews_ProductReview_Product",
                                "\"ReviewType\" <> 1 OR \"ProductId\" IS NOT NULL");

                            table.HasCheckConstraint(
                                "CK_Reviews_FeaturedApproved",
                                "NOT \"IsFeatured\" OR \"Status\" = 2");

                            table.HasCheckConstraint(
                                "CK_Reviews_VerifiedPurchase",
                                """
                                NOT "IsVerifiedPurchase"
                                OR (
                                    "CustomerId" IS NOT NULL
                                    AND "ProductId" IS NOT NULL
                                    AND "OrderId" IS NOT NULL
                                    AND "OrderItemId" IS NOT NULL
                                )
                                """);

                            table.HasCheckConstraint(
                                "CK_Reviews_TestimonialConsent",
                                "\"ReviewType\" <> 2 OR \"HasCustomerConsent\" = TRUE");
                        });
            });

            // -- FAQs Configurations ---
            builder.Entity<FAQs>(faq =>
            {
                        faq.Property(item => item.Category)
                            .HasConversion<int>();

                        faq.ToTable("Faqs", table =>
                        {
                            table.HasCheckConstraint(
                                "CK_Faqs_DisplayOrder",
                                "\"DisplayOrder\" >= 0");

                            table.HasCheckConstraint(
                                "CK_Faqs_Question_NotEmpty",
                                "LENGTH(TRIM(\"Question\")) > 0");

                            table.HasCheckConstraint(
                                "CK_Faqs_Answer_NotEmpty",
                                "LENGTH(TRIM(\"Answer\")) > 0");
                        });
            });

            builder.Entity<HomepageCMS>(homepage =>
            {
                homepage.Property(item => item.Id)
                    .ValueGeneratedNever();

                homepage.Property(item => item.HeroImageUrl)
                    .HasColumnType("text");

                homepage.ToTable("HomepageCms", table =>
                {
                    // Guarantees that only one row with Id = 1 can exist.
                    table.HasCheckConstraint(
                        "CK_HomepageCms_SingleRow",
                        "\"Id\" = 1");

                    table.HasCheckConstraint(
                        "CK_HomepageCms_Headline_NotEmpty",
                        "LENGTH(TRIM(\"Headline\")) > 0");

                    table.HasCheckConstraint(
                        "CK_HomepageCms_EyebrowBadge_NotEmpty",
                        "LENGTH(TRIM(\"EyebrowBadge\")) > 0");

                    table.HasCheckConstraint(
                        "CK_HomepageCms_Subtext_NotEmpty",
                        "LENGTH(TRIM(\"Subtext\")) > 0");

                    table.HasCheckConstraint(
                        "CK_HomepageCms_HeroImageAltText_NotEmpty",
                        "LENGTH(TRIM(\"HeroImageAltText\")) > 0");
                });
            });

            builder.Entity<ProviderCredentials>(provider =>
            {
                provider.ToTable("ProviderCredentials");

                provider.HasKey(x => x.Id);

                provider.Property(x => x.ProviderKey)
                    .HasMaxLength(100)
                    .IsRequired();

                provider.Property(x => x.EncryptedData)
                    .HasColumnType("text")
                    .IsRequired();

                provider.Property(x => x.EncryptionKeyVersion)
                    .HasMaxLength(50)
                    .IsRequired();

                provider.Property(x => x.IsActive)
                    .HasDefaultValue(true);

                provider.Property(x => x.CreatedOn)
                    .IsRequired();

                provider.HasIndex(x => x.ProviderKey)
                    .IsUnique()
                    .HasDatabaseName("IX_ProviderCredentials_ProviderKey");
            });

            builder.Entity<ReturnRequest>(entity =>
            {
                entity.ToTable("ReturnRequests");
                entity.HasKey(x => x.Id);
                entity.Property(x => x.ReturnNumber).HasMaxLength(40).IsRequired();
                entity.HasIndex(x => x.ReturnNumber).IsUnique().HasDatabaseName("IX_ReturnRequests_ReturnNumber");
                entity.HasIndex(x => x.OrderId).HasDatabaseName("IX_ReturnRequests_OrderId");
                entity.HasIndex(x => new { x.CustomerId, x.CreatedOn }).HasDatabaseName("IX_ReturnRequests_CustomerId_CreatedOn");
                entity.HasIndex(x => x.Status).HasDatabaseName("IX_ReturnRequests_Status");

                entity.Property(x => x.TotalRefundAmount).HasPrecision(18, 2);
                entity.Property(x => x.ReverseShippingDeduction).HasPrecision(18, 2);
                entity.Property(x => x.NetRefundAmount).HasPrecision(18, 2);

                entity.HasOne(x => x.Order)
                    .WithMany(o => o.Returns)
                    .HasForeignKey(x => x.OrderId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasMany(x => x.Items)
                    .WithOne(i => i.ReturnRequest)
                    .HasForeignKey(i => i.ReturnRequestId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(x => x.Media)
                    .WithOne(m => m.ReturnRequest)
                    .HasForeignKey(m => m.ReturnRequestId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(x => x.StatusHistory)
                    .WithOne(h => h.ReturnRequest)
                    .HasForeignKey(h => h.ReturnRequestId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(x => x.Refund)
                    .WithOne(r => r.ReturnRequest)
                    .HasForeignKey<RefundRecord>(r => r.ReturnRequestId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            builder.Entity<ReturnItem>(entity =>
            {
                entity.ToTable("ReturnItems");
                entity.HasKey(x => x.Id);
                entity.Property(x => x.UnitPrice).HasPrecision(18, 2);
                entity.Property(x => x.RefundAmount).HasPrecision(18, 2);

                entity.HasOne(x => x.OrderItem)
                    .WithMany()
                    .HasForeignKey(x => x.OrderItemId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            builder.Entity<ReturnMedia>(entity =>
            {
                entity.ToTable("ReturnMedia");
                entity.HasKey(x => x.Id);
            });

            builder.Entity<ReturnStatusHistory>(entity =>
            {
                entity.ToTable("ReturnStatusHistories");
                entity.HasKey(x => x.Id);
            });

            builder.Entity<RefundRecord>(entity =>
            {
                entity.ToTable("RefundRecords");
                entity.HasKey(x => x.Id);
                entity.HasIndex(x => x.IdempotencyKey).IsUnique().HasDatabaseName("IX_RefundRecords_IdempotencyKey");
                entity.HasIndex(x => x.ProviderRefundId).IsUnique().HasDatabaseName("IX_RefundRecords_ProviderRefundId");

                entity.HasOne(x => x.Order)
                    .WithMany()
                    .HasForeignKey(x => x.OrderId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(x => x.Payment)
                    .WithMany()
                    .HasForeignKey(x => x.PaymentId)
                    .OnDelete(DeleteBehavior.Restrict);
            });
        }
    }
}
