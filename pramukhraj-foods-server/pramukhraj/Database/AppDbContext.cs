using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using pramukhraj.Entities;
using pramukhraj.Entities.Cart;
using pramukhraj.Entities.Coupon;
using pramukhraj.Entities.Product; // Ensure this namespace covers your new models

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

        public DbSet<RefreshToken> RefreshTokens { get; set; } = null!;
        public DbSet<Customer> Customers { get; set; } = null!;

        // --- New E-Commerce DbSets ---
        public DbSet<Product> Products { get; set; } = null!;
        public DbSet<ProductCategory> ProductCategories { get; set; } = null!;
        public DbSet<ProductImage> ProductImages { get; set; } = null!;
        public DbSet<ProductTag> ProductTags { get; set; } = null!;
        public DbSet<ProductVariant> ProductVariants { get; set; } = null!;
        public DbSet<Cart> Carts { get; set; } = null!;
        public DbSet<CartItem> CartItems { get; set; } = null!;
        public DbSet<AdminAction> AdminActions { get; set; } = null!;
        public DbSet<Coupon> Coupons { get; set; } = null!;
        public DbSet<CouponScope> CouponScopes { get; set; } = null!;
        public DbSet<CouponUsage> CouponUsages { get; set; } = null!;

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
                b.HasKey(c => c.Id);
                b.Property(c => c.Email).IsRequired();
                b.HasIndex(c => c.Email).IsUnique();
                b.Property(c => c.CreatedAt).HasDefaultValueSql("now()");
                b.Property(c => c.RowVersion).IsRowVersion();
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
                b.Property(c => c.CreatedOn).HasDefaultValueSql("now()");
                b.Property(c => c.UpdatedOn).HasDefaultValueSql("now()");
            });

            // --- Cart Item Configurations ---
            builder.Entity<CartItem>(b =>
            {
                b.Property(ci => ci.CreatedOn).HasDefaultValueSql("now()");
                b.Property(ci => ci.UpdatedOn).HasDefaultValueSql("now()");

                b.HasOne(ci => ci.Cart)
                 .WithMany(c => c.Items)
                 .HasForeignKey(ci => ci.CartId)
                 .OnDelete(DeleteBehavior.Cascade); // Deleting a cart deletes its items

                // Prevent deleting a product or variant if it is currently in someone's cart
                b.HasOne(ci => ci.Product)
                 .WithMany()
                 .HasForeignKey(ci => ci.ProductId)
                 .OnDelete(DeleteBehavior.Restrict);

                b.HasOne(ci => ci.Variant)
                 .WithMany()
                 .HasForeignKey(ci => ci.VariantId)
                 .OnDelete(DeleteBehavior.Restrict);
            });

            // --- Coupon Configurations ---
            builder.Entity<Coupon>(entity =>
            {
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
        }
    }
}