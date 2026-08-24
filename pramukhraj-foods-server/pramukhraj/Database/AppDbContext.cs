using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using pramukhraj.Entities;
using pramukhraj.Entities.Cart;
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
        public DbSet<AdminAction> AdminActions { get; set; }

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
        }
    }
}