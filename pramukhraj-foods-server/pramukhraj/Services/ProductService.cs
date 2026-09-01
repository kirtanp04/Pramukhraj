using Microsoft.EntityFrameworkCore;
using Npgsql;
using pramukhraj.Common;
using pramukhraj.Database;
using pramukhraj.DTOs.Common;
using pramukhraj.DTOs.Product;
using pramukhraj.Entities;
using pramukhraj.Entities.Product;
using pramukhraj.Helper;
using pramukhraj.Interfaces;
using System.Data.Common;
using static pramukhraj.Common.AdminActions;
using static pramukhraj.DTOs.Product.ProductCategoryRequestResponse;
using static pramukhraj.DTOs.Product.ProductInventoryRequestResponse;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace pramukhraj.Services
{
    public class ProductService: IProductService
    {
        private readonly AppDbContext _db;
        private readonly ILogger<ProductService> _logger;
        private readonly IHttpContextAccessor _httpContextAccessor;


        public ProductService(AppDbContext db, ILogger<ProductService> logger, IHttpContextAccessor httpContextAccessor)
        {
            _db = db;
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
        }

       

        public async Task<ApiResponse<string>> AddNewProductAsync(
        AddProductRequest request,
        CancellationToken cancellationToken = default)
        {
            if (request is null)
            {
                return new ApiResponse<string>
                {
                    StatusCode = StatusCodes.Status400BadRequest,
                    Success = false,
                    Message = "Invalid request.",
                    Errors = "Product details are required."
                };
            }

            if (!Guid.TryParse(request.CategoryId, out var categoryId))
            {
                return new ApiResponse<string>
                {
                    StatusCode = StatusCodes.Status400BadRequest,
                    Success = false,
                    Message = "Invalid category.",
                    Errors = "The provided category ID is invalid."
                };
            }

            try
            {
                var data = Common.Common.GetAdminClaimInfo(_httpContextAccessor);

                if (!data.Success)
                {
                    return new ApiResponse<string>
                    {
                        StatusCode = data.StatusCode,
                        Success = data.Success,
                        Message = data.Message,
                        Errors = data.Errors
                    };
                }

                // Check category exists
                var categoryExists = await _db.ProductCategories
                    .AsNoTracking()
                    .FirstAsync(
                        x => x.Id == categoryId && x.IsActive
,
                        cancellationToken);

                if (categoryExists == null)
                {
                    return new ApiResponse<string>
                    {
                        StatusCode = StatusCodes.Status404NotFound,
                        Success = false,
                        Message = "Category not found.",
                        Errors = "The selected product category does not exist."
                    };
                }

                var productId = Guid.NewGuid();
                var currentTime = DateTime.UtcNow;

                // Optional duplicate barcode validation
                if (!string.IsNullOrWhiteSpace(request.Barcode))
                {
                    var barcode = request.Barcode.Trim();

                    var barcodeExists = await _db.Products
                        .AsNoTracking()
                        .AnyAsync(
                            x => x.Barcode == barcode,
                            cancellationToken);

                    if (barcodeExists)
                    {
                        return new ApiResponse<string>
                        {
                            StatusCode = StatusCodes.Status409Conflict,
                            Success = false,
                            Message = "Product already exists.",
                            Errors = "A product with the same barcode already exists."
                        };
                    }
                }

                // Create Product
                var product = new Product
                {
                    Id = productId,
                    CategoryId = categoryId,

                    Name = request.Name?.Trim() ?? string.Empty,
                    ShortDescription = request.ShortDescription?.Trim() ?? "",
                    Description = request.Description?.Trim() ?? "",
                    Brand = request.Brand?.Trim() ?? "",

                    IsFeatured = request.IsFeatured,
                    IsBestSeller = request.IsBestSeller,
                    IsTrending = request.IsTrending,
                    IsNewArrival = request.IsNewArrival,
                    IsActive = request.IsActive,

                    CountryOfOrigin = request.CountryOfOrigin?.Trim() ?? "",
                    IsVegetarian = request.IsVegetarian,
                    ShelfLife = request.ShelfLife?.Trim() ?? "",
                    StorageInstruction = request.StorageInstruction?.Trim() ?? "",
                    Ingredients = request.Ingredients?.Trim() ?? "",
                    NutritionalInformation = request.NutritionalInformation?.Trim() ?? "",

                    Barcode = request.Barcode?.Trim() ?? "",

                    CreatedOn = currentTime,
                    UpdatedOn = currentTime,
                    Slug = ProductHelper.GenerateSlug(request.Name?.Trim() ?? "Product-slug", 6),

                    MetaTitle = ProductHelper.GenerateProductMetaTitle(
                                request.Name?.Trim() ?? "Pramukhraj-Product",
                                request.Brand),

                    MetaDescription = ProductHelper.GenerateProductMetaDescription(
                                        request.Name?.Trim() ?? "Pramukhraj-Product",
                                        request.ShortDescription,
                                        request.Description,
                                        categoryExists.Name),

                    MetaKeywords = ProductHelper.GenerateProductMetaKeywords(
                                    request.Name?.Trim() ?? "Pramukhraj-Product",
                                    categoryExists.Name,
                                    request.Brand,
                                    request.Tags?
                                    .Where(tag => !string.IsNullOrWhiteSpace(tag.Name))
                                    .Select(tag => tag.Name.Trim())),
                };

                // ----------------------------------------------------
                // Product Images
                // ----------------------------------------------------

                var productImages = request.Images?
                    .Select(image => new ProductImage
                    {
                        Id = Guid.NewGuid(),
                        ProductId = productId,
                        ImageUrl = image.ImageUrl?.Trim() ?? string.Empty,
                        AltText = image.AltText?.Trim(),
                        IsPrimary = image.IsPrimary,
                        DisplayOrder = image.DisplayOrder,
                        
                        
                    })
                    .ToList()
                    ?? [];

                // ----------------------------------------------------
                // Product Variants
                // ----------------------------------------------------

                var productVariants = request.Variants?
                    .Select((variant, index) => new ProductVariant
                    {
                        Id = Guid.NewGuid(),
                        ProductId = productId,

                        Name = variant.Name?.Trim() ?? string.Empty,

                        SKU =ProductHelper.GenerateSku(
                            product.Name,
                            variant.Name,
                            index),

                        Price = variant.Price,
                        StockQuantity = variant.StockQuantity,
                        IsActive = variant.IsActive,
                        Weight = variant.Weight,
                        MRP = variant.Mrp,
                        IsDefault = variant.IsDefault,
                        WeightUnit = variant.WeightUnit
                    })
                    .ToList()
                    ?? [];

                // ----------------------------------------------------
                // Product Tags
                // ----------------------------------------------------

                var productTags = request.Tags?
                    .Where(tag => !string.IsNullOrWhiteSpace(tag.Name))
                    .GroupBy(
                        tag => tag.Name.Trim(),
                        StringComparer.OrdinalIgnoreCase)
                    .Select(group => new ProductTag
                    {
                        Id = Guid.NewGuid(),
                        ProductId = productId,
                        Name = group.First().Name.Trim()
                    })
                    .ToList()
                    ?? [];

                // -----------------------------------------
                // Admin Audit Log
                // -----------------------------------------

               

                var _adminAction = new AdminAction
                {
                    Id = Guid.NewGuid(),
                    AdminId =Guid.Parse(data.Data?.Id.ToString() ?? Guid.Empty.ToString()),
                    AdminName = string.IsNullOrWhiteSpace(data.Data?.UserName)
                        ? "Unknown Admin"
                        : data.Data.UserName.Trim(),
                    Module = AdminActionModules.Product,
                    Action = AdminActionTypes.Create,
                    EntityId = productId,
                    EntityName = product.Name,
                    Description =
                        $"Created product '{product.Name}'.",

                    CreatedOn = currentTime
                };

                // ----------------------------------------------------
                // Add everything to EF tracking
                // ----------------------------------------------------

                await _db.Products.AddAsync(
                    product,
                    cancellationToken);

                if (productImages.Count > 0)
                {
                    await _db.ProductImages.AddRangeAsync(
                        productImages,
                        cancellationToken);
                }

                if (productVariants.Count > 0)
                {
                    await _db.ProductVariants.AddRangeAsync(
                        productVariants,
                        cancellationToken);
                }

                if (productTags.Count > 0)
                {
                    await _db.ProductTags.AddRangeAsync(
                        productTags,
                        cancellationToken);
                }

                await _db.AdminActions.AddAsync(
                    _adminAction,
                    cancellationToken);

                // Single database SaveChanges
                await _db.SaveChangesAsync(cancellationToken);

                //await transaction.CommitAsync(cancellationToken);

                return new ApiResponse<string>
                {
                    StatusCode = StatusCodes.Status201Created,
                    Success = true,
                    Message = "Product created successfully.",
                    Data = productId.ToString()
                };
            }
            catch (DbUpdateException ex)
             when (ex.InnerException is PostgresException
             {
                 SqlState: PostgresErrorCodes.UniqueViolation
             })
            {
                //await transaction.RollbackAsync(cancellationToken);

                _logger.LogError(
                    ex,
                    "Database error occurred while creating product {ProductName}.",
                    request.Name);

                return new ApiResponse<string>
                {
                    StatusCode = StatusCodes.Status500InternalServerError,
                    Success = false,
                    Message = "Unable to create the product.",
                    Errors = "A database error occurred while saving the product. Please try again."
                };
            }
            catch (OperationCanceledException)
            {
                //await transaction.RollbackAsync(CancellationToken.None);

                _logger.LogWarning(
                    "Product creation was cancelled for product {ProductName}.",
                    request.Name);

                throw;
            }
            catch (Exception ex)
            {
                //await transaction.RollbackAsync(cancellationToken);

                _logger.LogError(
                    ex,
                    "Unexpected error occurred while creating product {ProductName}.",
                    request.Name);

                return new ApiResponse<string>
                {
                    StatusCode = StatusCodes.Status500InternalServerError,
                    Success = false,
                    Message = "Unable to create the product.",
                    Errors = "An unexpected error occurred while creating the product. Please try again later."
                };
            }
        }

        public async Task<ApiResponse<ProductDetailsResponse>> GetProductByIdAsync(
            string strProductId,
            CancellationToken cancellationToken = default)
        {
            if (!Guid.TryParse(strProductId, out var productId) ||
                productId == Guid.Empty)
            {
                return new ApiResponse<ProductDetailsResponse>
                {
                    StatusCode = StatusCodes.Status400BadRequest,
                    Success = false,
                    Message = "Invalid product.",
                    Errors = "The provided product ID is invalid."
                };
            }

            try
            {
                var product = await _db.Products
                    .AsNoTracking()
                    .Where(entity => entity.Id == productId)
                    .Select(entity => new ProductDetailsResponse
                    {
                        Id = entity.Id.ToString(),
                        CategoryId = entity.CategoryId.ToString(),
                        Name = entity.Name,
                        ShortDescription = entity.ShortDescription,
                        Description = entity.Description,
                        Brand = entity.Brand,
                        IsFeatured = entity.IsFeatured,
                        IsBestSeller = entity.IsBestSeller,
                        IsTrending = entity.IsTrending,
                        IsNewArrival = entity.IsNewArrival,
                        IsActive = entity.IsActive,
                        CountryOfOrigin = entity.CountryOfOrigin,
                        IsVegetarian = entity.IsVegetarian,
                        ShelfLife = entity.ShelfLife,
                        StorageInstruction = entity.StorageInstruction,
                        Ingredients = entity.Ingredients,
                        NutritionalInformation = entity.NutritionalInformation,
                        Barcode = entity.Barcode,
                        Images = entity.Images
                            .OrderBy(image => image.DisplayOrder)
                            .Select(image => new ProductImageDetailsResponse
                            {
                                Id = image.Id.ToString(),
                                ImageUrl = image.ImageUrl,
                                AltText = image.AltText,
                                IsPrimary = image.IsPrimary,
                                DisplayOrder = image.DisplayOrder
                            })
                            .ToArray(),
                        Variants = entity.Variants
                            .OrderByDescending(variant => variant.IsDefault)
                            .ThenBy(variant => variant.Name)
                            .Select(variant => new ProductVariantDetailsResponse
                            {
                                Id = variant.Id.ToString(),
                                Name = variant.Name,
                                Sku = variant.SKU,
                                Price = variant.Price,
                                Mrp = variant.MRP,
                                StockQuantity = variant.StockQuantity,
                                Weight = variant.Weight,
                                WeightUnit = variant.WeightUnit,
                                IsDefault = variant.IsDefault,
                                IsActive = variant.IsActive
                            })
                            .ToArray(),
                        Tags = entity.Tags
                            .OrderBy(tag => tag.Name)
                            .Select(tag => new ProductTagDetailsResponse
                            {
                                Id = tag.Id.ToString(),
                                Name = tag.Name
                            })
                            .ToArray()
                    })
                    .SingleOrDefaultAsync(cancellationToken);

                if (product is null)
                {
                    return new ApiResponse<ProductDetailsResponse>
                    {
                        StatusCode = StatusCodes.Status404NotFound,
                        Success = false,
                        Message = "Product not found.",
                        Errors = "The selected product does not exist."
                    };
                }

                return new ApiResponse<ProductDetailsResponse>
                {
                    StatusCode = StatusCodes.Status200OK,
                    Success = true,
                    Message = "Product retrieved successfully.",
                    Data = product
                };
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                throw;
            }
            catch (DbException exception)
            {
                _logger.LogError(
                    exception,
                    "Database error occurred while retrieving Product {ProductId}.",
                    productId);

                return new ApiResponse<ProductDetailsResponse>
                {
                    StatusCode = StatusCodes.Status500InternalServerError,
                    Success = false,
                    Message = "Unable to retrieve the product.",
                    Errors = "A database error occurred while retrieving the product. Please try again."
                };
            }
            catch (Exception exception)
            {
                _logger.LogError(
                    exception,
                    "Unexpected error occurred while retrieving Product {ProductId}.",
                    productId);

                return new ApiResponse<ProductDetailsResponse>
                {
                    StatusCode = StatusCodes.Status500InternalServerError,
                    Success = false,
                    Message = "Unable to retrieve the product.",
                    Errors = "An unexpected error occurred while retrieving the product. Please try again later."
                };
            }
        }

        public async Task<ApiResponse<string>> UpdateProductAsync(
        string strProductId,
        AddProductRequest request,
        CancellationToken cancellationToken = default)
        {
            // ---------------------------------------------------------
            // Basic request validation
            // ---------------------------------------------------------

            if (request is null)
            {
                return new ApiResponse<string>
                {
                    StatusCode = StatusCodes.Status400BadRequest,
                    Success = false,
                    Message = "Invalid request.",
                    Errors = "Product details are required."
                };
            }

            if (!Guid.TryParse(strProductId, out var productId) ||
                productId == Guid.Empty)
            {
                return new ApiResponse<string>
                {
                    StatusCode = StatusCodes.Status400BadRequest,
                    Success = false,
                    Message = "Invalid product.",
                    Errors = "The provided product ID is invalid."
                };
            }

            if (!Guid.TryParse(request.CategoryId, out var categoryId) ||
                categoryId == Guid.Empty)
            {
                return new ApiResponse<string>
                {
                    StatusCode = StatusCodes.Status400BadRequest,
                    Success = false,
                    Message = "Invalid category.",
                    Errors = "The provided category ID is invalid."
                };
            }

            // ---------------------------------------------------------
            // Admin validation
            // ---------------------------------------------------------

            var adminClaim = Common.Common.GetAdminClaimInfo(_httpContextAccessor);

            if (!adminClaim.Success)
            {
                return new ApiResponse<string>
                {
                    StatusCode = adminClaim.StatusCode,
                    Success = false,
                    Message = adminClaim.Message,
                    Errors = adminClaim.Errors
                };
            }

            if (!Guid.TryParse(
                    adminClaim.Data?.Id?.ToString(),
                    out var adminId) ||
                adminId == Guid.Empty)
            {
                _logger.LogWarning(
                    "Product update rejected because the authenticated admin ID was invalid. ProductId: {ProductId}",
                    productId);

               
                return new ApiResponse<string>
                {
                    StatusCode = StatusCodes.Status401Unauthorized,
                    Success = false,
                    Message = "Unauthorized request.",
                    Errors = "Valid administrator information could not be determined."
                };

            }

            var adminName = string.IsNullOrWhiteSpace(adminClaim.Data?.UserName)
                ? "Unknown Admin"
                : adminClaim.Data.UserName.Trim();

            var productName = request.Name?.Trim() ?? string.Empty;
            var barcode = request.Barcode?.Trim();

            try
            {
                // ---------------------------------------------------------
                // Get existing product
                // Do NOT use AsNoTracking because we are updating this entity
                // ---------------------------------------------------------

                var product = await _db.Products
                    .FirstOrDefaultAsync(
                        x => x.Id == productId,
                        cancellationToken);

                if (product is null)
                {
                    return new ApiResponse<string>
                    {
                        StatusCode = StatusCodes.Status404NotFound,
                        Success = false,
                        Message = "Product not found.",
                        Errors = "The selected product does not exist."
                    };
                }

                // ---------------------------------------------------------
                // Validate category
                // ---------------------------------------------------------

                var categoryExists = await _db.ProductCategories
                    .AsNoTracking()
                    .AnyAsync(
                        x => x.Id == categoryId && x.IsActive,
                        cancellationToken);

                if (!categoryExists)
                {
                    return new ApiResponse<string>
                    {
                        StatusCode = StatusCodes.Status404NotFound,
                        Success = false,
                        Message = "Category not found.",
                        Errors = "The selected product category does not exist."
                    };
                }

                // ---------------------------------------------------------
                // Validate barcode
                //
                // Important:
                // Exclude current product from duplicate check.
                // ---------------------------------------------------------

                if (!string.IsNullOrWhiteSpace(barcode))
                {
                    var barcodeExists = await _db.Products
                        .AsNoTracking()
                        .AnyAsync(
                            x =>
                                x.Id != productId &&
                                x.Barcode == barcode,
                            cancellationToken);

                    if (barcodeExists)
                    {
                        return new ApiResponse<string>
                        {
                            StatusCode = StatusCodes.Status409Conflict,
                            Success = false,
                            Message = "Duplicate barcode.",
                            Errors = "Another product with the same barcode already exists."
                        };
                    }
                }

                // ---------------------------------------------------------
                // Update existing product
                // ---------------------------------------------------------

                product.CategoryId = categoryId;

                product.Name = productName;
                product.ShortDescription =
                    request.ShortDescription?.Trim() ?? string.Empty;

                product.Description =
                    request.Description?.Trim() ?? string.Empty;

                product.Brand =
                    request.Brand?.Trim() ?? string.Empty;

                product.IsFeatured = request.IsFeatured;
                product.IsBestSeller = request.IsBestSeller;
                product.IsTrending = request.IsTrending;
                product.IsNewArrival = request.IsNewArrival;
                product.IsActive = request.IsActive;

                product.CountryOfOrigin =
                    request.CountryOfOrigin?.Trim() ?? string.Empty;

                product.IsVegetarian = request.IsVegetarian;

                product.ShelfLife =
                    request.ShelfLife?.Trim() ?? string.Empty;

                product.StorageInstruction =
                    request.StorageInstruction?.Trim() ?? string.Empty;

                product.Ingredients =
                    request.Ingredients?.Trim() ?? string.Empty;

                product.NutritionalInformation =
                    request.NutritionalInformation?.Trim() ?? string.Empty;

                product.Barcode = barcode ?? string.Empty;

                product.UpdatedOn = DateTime.UtcNow;

                // CreatedOn is intentionally NOT changed.

                // ---------------------------------------------------------
                // Prepare new images
                // ---------------------------------------------------------

                var productImages = request.Images?
                    .Select(image => new ProductImage
                    {
                        Id = Guid.NewGuid(),
                        ProductId = productId,

                        ImageUrl =
                            image.ImageUrl?.Trim() ?? string.Empty,

                        AltText =
                            string.IsNullOrWhiteSpace(image.AltText)
                                ? null
                                : image.AltText.Trim(),

                        IsPrimary = image.IsPrimary,
                        DisplayOrder = image.DisplayOrder
                    })
                    .ToList()
                    ?? [];

                // ---------------------------------------------------------
                // Prepare new variants
                // ---------------------------------------------------------

                var productVariants = request.Variants?
                    .Select((variant, index) => new ProductVariant
                    {
                        Id = Guid.NewGuid(),
                        ProductId = productId,

                        Name =
                            variant.Name?.Trim() ?? string.Empty,

                        SKU = ProductHelper.GenerateSku(
                            product.Name,
                            variant.Name?.Trim(),
                            index),

                        Price = variant.Price,
                        MRP = variant.Mrp,

                        StockQuantity = variant.StockQuantity,

                        Weight = variant.Weight,
                        WeightUnit =
                            variant.WeightUnit?.Trim() ?? string.Empty,

                        IsActive = variant.IsActive,
                        IsDefault = variant.IsDefault
                    })
                    .ToList()
                    ?? [];

                // ---------------------------------------------------------
                // Prepare tags
                //
                // Remove empty and duplicate tags.
                // ---------------------------------------------------------

                var productTags = request.Tags?
                    .Where(tag =>
                        !string.IsNullOrWhiteSpace(tag.Name))
                    .Select(tag => tag.Name.Trim())
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .Select(tagName => new ProductTag
                    {
                        Id = Guid.NewGuid(),
                        ProductId = productId,
                        Name = tagName
                    })
                    .ToList()
                    ?? [];

                // ---------------------------------------------------------
                // Replace child records
                //
                // We delete ONLY child entities.
                // Product itself remains intact.
                // ---------------------------------------------------------

                await _db.ProductImages
                    .Where(x => x.ProductId == productId)
                    .ExecuteDeleteAsync(cancellationToken);

                await _db.ProductVariants
                    .Where(x => x.ProductId == productId)
                    .ExecuteDeleteAsync(cancellationToken);

                await _db.ProductTags
                    .Where(x => x.ProductId == productId)
                    .ExecuteDeleteAsync(cancellationToken);

                // ---------------------------------------------------------
                // Insert replacement children
                // ---------------------------------------------------------

                if (productImages.Count > 0)
                {
                    await _db.ProductImages.AddRangeAsync(
                        productImages,
                        cancellationToken);
                }

                if (productVariants.Count > 0)
                {
                    await _db.ProductVariants.AddRangeAsync(
                        productVariants,
                        cancellationToken);
                }

                if (productTags.Count > 0)
                {
                    await _db.ProductTags.AddRangeAsync(
                        productTags,
                        cancellationToken);
                }

                // ---------------------------------------------------------
                // Audit log
                // ---------------------------------------------------------

                var adminAction = new AdminAction
                {
                    Id = Guid.NewGuid(),

                    AdminId = adminId,
                    AdminName = adminName,

                    Module = AdminActionModules.Product,
                    Action = AdminActionTypes.Update,

                    EntityId = product.Id,
                    EntityName = product.Name,

                    Description =
                        $"Updated product '{product.Name}'.",

                    CreatedOn = DateTime.UtcNow
                };

                await _db.AdminActions.AddAsync(
                    adminAction,
                    cancellationToken);

                // ---------------------------------------------------------
                // Save all tracked modifications
                // ---------------------------------------------------------

                await _db.SaveChangesAsync(cancellationToken);

               
             

                _logger.LogInformation(
                    "Product {ProductId} ({ProductName}) was updated successfully by Admin {AdminId}.",
                    product.Id,
                    product.Name,
                    adminId);

                return new ApiResponse<string>
                {
                    StatusCode = StatusCodes.Status200OK,
                    Success = true,
                    Message = "Product updated successfully.",
                    Data = product.Id.ToString()
                };
            }
            catch (DbUpdateException ex)
                when (ex.InnerException is PostgresException postgresException &&
                      postgresException.SqlState ==
                      PostgresErrorCodes.UniqueViolation)
            {
              
                _logger.LogWarning(
                    ex,
                    "Unique constraint violation while updating Product {ProductId}.",
                    productId);

               
                return new ApiResponse<string>
                {
                    StatusCode = StatusCodes.Status409Conflict,
                    Success = false,
                    Message = "Unable to update product.",
                    Errors = "A product with one or more of the same unique values already exists."
                };
            }
            catch (OperationCanceledException ex)
            {
              
                _logger.LogWarning(
                    "Product update operation was cancelled. ProductId: {ProductId}",
                    productId);

                return new ApiResponse<string>
                {
                    StatusCode = StatusCodes.Status408RequestTimeout,
                    Success = false,
                    Message = "Product update was cancelled.",
                    Errors = "The request was cancelled before the product could be updated. Please try again."
                };
            }
            catch (Exception ex)
            {
               
                _logger.LogError(
                    ex,
                    "Unexpected error while updating Product {ProductId}.",
                    productId);

                

                return new ApiResponse<string>
                {
                    StatusCode = StatusCodes.Status500InternalServerError,
                    Success = false,
                    Message = "Unable to update product.",
                    Errors = "An unexpected error occurred while updating the product. Please try again later."
                };


            }
        }


        public async Task<ApiResponse<string>> AddProductCategoryAsync(
        AddProductCategoryRequest request,
        CancellationToken cancellationToken = default)
        {
            if (request is null)
            {
                return new ApiResponse<string>
                {
                    StatusCode = StatusCodes.Status400BadRequest,
                    Success = false,
                    Message = "Invalid request.",
                    Errors = "Category details are required."
                };
            }

            var categoryName = request.Name?.Trim();

            if (string.IsNullOrWhiteSpace(categoryName))
            {
                return new ApiResponse<string>
                {
                    StatusCode = StatusCodes.Status400BadRequest,
                    Success = false,
                    Message = "Invalid category name.",
                    Errors = "Category name is required."
                };
            }

            try
            {

                var data = Common.Common.GetAdminClaimInfo(_httpContextAccessor);

                if (!data.Success)
                {
                    return new ApiResponse<string>
                    {
                        StatusCode = data.StatusCode,
                        Success = data.Success,
                        Message = data.Message,
                        Errors = data.Errors
                    };
                }

                var normalizedName = categoryName.ToLowerInvariant();

                var categoryExists = await _db.ProductCategories
                    .AsNoTracking()
                    .AnyAsync(
                        category =>
                            category.Name.ToLower() == normalizedName,
                        cancellationToken);

                if (categoryExists)
                {
                    return new ApiResponse<string>
                    {
                        StatusCode = StatusCodes.Status409Conflict,
                        Success = false,
                        Message = "Category already exists.",
                        Errors =
                            $"A product category named '{categoryName}' already exists."
                    };
                }

                var categoryId = Guid.NewGuid();
                var currentTime = DateTime.UtcNow;

                var description =
                    request.Description?.Trim() ?? string.Empty;

                var slug = ProductHelper.GenerateSlug(
                    categoryName,
                    255);

                var slugExists = await _db.ProductCategories
                    .AsNoTracking()
                    .AnyAsync(
                        category => category.Slug == slug,
                        cancellationToken);

                if (slugExists)
                {
                    var timestamp = DateTimeOffset.UtcNow
                        .ToUnixTimeMilliseconds();

                    var suffix = $"-{timestamp}";
                    var maximumBaseLength = 255 - suffix.Length;

                    slug =
                        $"{ProductHelper.GenerateSlug(categoryName, maximumBaseLength)}{suffix}";
                }

                var category = new ProductCategory
                {
                    Id = categoryId,
                    Name = categoryName,
                    Slug = slug,
                    Description = description,
                    ImageUrl = request.ImageUrl?.Trim() ?? string.Empty,
                    ParentCategoryId = null,
                    DisplayOrder = request.DisplayOrder,
                    IsFeatured = request.IsFeatured,
                    IsActive = request.IsActive,

                    MetaTitle = ProductHelper.GenerateMetaTitle(
                        categoryName),

                    MetaDescription =
                        ProductHelper.GenerateMetaDescription(
                            categoryName,
                            description),

                    MetaKeywords =
                        ProductHelper.GenerateMetaKeywords(
                            categoryName),

                    CreatedOn = currentTime,
                    UpdatedOn = currentTime
                };

                var adminAction = new AdminAction
                {
                    Id = Guid.NewGuid(),
                    AdminId = Guid.Parse(data.Data?.Id.ToString() ?? Guid.Empty.ToString()),

                    AdminName = string.IsNullOrWhiteSpace(data.Data?.UserName)
                        ? "Unknown Admin"
                        : data.Data.UserName.Trim(),

                    Module = AdminActionModules.Category,
                    Action = AdminActionTypes.Create,
                    EntityId = categoryId,
                    EntityName = categoryName,
                    Description = $"Created category '{categoryName}'.",
                    CreatedOn = currentTime
                };

                _db.ProductCategories.Add(category);
                _db.AdminActions.Add(adminAction);

                await _db.SaveChangesAsync(cancellationToken);

                return new ApiResponse<string>
                {
                    StatusCode = StatusCodes.Status201Created,
                    Success = true,
                    Message = "Category created successfully.",
                    Data = categoryId.ToString()
                };
            }
            catch (DbUpdateException exception)
                when (exception.InnerException is PostgresException
                {
                    SqlState: PostgresErrorCodes.UniqueViolation
                })
            {
                _logger.LogWarning(
                    exception,
                    "A unique constraint rejected category {CategoryName}.",
                    categoryName);

                return new ApiResponse<string>
                {
                    StatusCode = StatusCodes.Status409Conflict,
                    Success = false,
                    Message = "Category already exists.",
                    Errors =
                        "A category with the same name or slug already exists."
                };
            }
            catch (DbUpdateException exception)
            {
                _logger.LogError(
                    exception,
                    "Database error occurred while creating category {CategoryName}.",
                    categoryName);

                return new ApiResponse<string>
                {
                    StatusCode = StatusCodes.Status500InternalServerError,
                    Success = false,
                    Message = "Unable to create the category.",
                    Errors =
                        "A database error occurred while saving the category. Please try again."
                };
            }
            catch (OperationCanceledException ex)
            {
                _logger.LogWarning(
                    "Category creation was cancelled for category {CategoryName}.",
                    categoryName);

                return new ApiResponse<string>
                {
                    StatusCode = StatusCodes.Status500InternalServerError,
                    Success = false,
                    Message = "Unable to create the category. "+ ex.Message,
                    Errors =
                       "An unexpected error occurred while creating the category. Please try again later."
                };

               
            }
            catch (Exception exception)
            {
                _logger.LogError(
                    exception,
                    "Unexpected error occurred while creating category {CategoryName}.",
                    categoryName);

                return new ApiResponse<string>
                {
                    StatusCode = StatusCodes.Status500InternalServerError,
                    Success = false,
                    Message = "Unable to create the category.",
                    Errors =
                        "An unexpected error occurred while creating the category. Please try again later."
                };
            }
        }


        public async Task<ApiResponse<ProductCategoryDetailsResponse>> GetProductCategoryByIdAsync(
            string strCategoryId,
            CancellationToken cancellationToken = default)
        {
            if (!Guid.TryParse(strCategoryId, out var categoryId) ||
                categoryId == Guid.Empty)
            {
                return new ApiResponse<ProductCategoryDetailsResponse>
                {
                    StatusCode = StatusCodes.Status400BadRequest,
                    Success = false,
                    Message = "Invalid category.",
                    Errors = "The provided category ID is invalid."
                };
            }

            try
            {
                var category = await _db.ProductCategories
                    .AsNoTracking()
                    .Where(entity => entity.Id == categoryId)
                    .Select(entity => new ProductCategoryDetailsResponse
                    {
                        Id = entity.Id.ToString(),
                        Name = entity.Name,
                        Description = entity.Description ?? string.Empty,
                        ImageUrl = entity.ImageUrl,
                        DisplayOrder = entity.DisplayOrder,
                        IsFeatured = entity.IsFeatured,
                        IsActive = entity.IsActive
                    })
                    .SingleOrDefaultAsync(cancellationToken);

                if (category is null)
                {
                    return new ApiResponse<ProductCategoryDetailsResponse>
                    {
                        StatusCode = StatusCodes.Status404NotFound,
                        Success = false,
                        Message = "Category not found.",
                        Errors = "The selected product category does not exist."
                    };
                }

                return new ApiResponse<ProductCategoryDetailsResponse>
                {
                    StatusCode = StatusCodes.Status200OK,
                    Success = true,
                    Message = "Category retrieved successfully.",
                    Data = category
                };
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                throw;
            }
            catch (DbException exception)
            {
                _logger.LogError(
                    exception,
                    "Database error occurred while retrieving Category {CategoryId}.",
                    categoryId);

                return new ApiResponse<ProductCategoryDetailsResponse>
                {
                    StatusCode = StatusCodes.Status500InternalServerError,
                    Success = false,
                    Message = "Unable to retrieve the category.",
                    Errors = "A database error occurred while retrieving the category. Please try again."
                };
            }
            catch (Exception exception)
            {
                _logger.LogError(
                    exception,
                    "Unexpected error occurred while retrieving Category {CategoryId}.",
                    categoryId);

                return new ApiResponse<ProductCategoryDetailsResponse>
                {
                    StatusCode = StatusCodes.Status500InternalServerError,
                    Success = false,
                    Message = "Unable to retrieve the category.",
                    Errors = "An unexpected error occurred while retrieving the category. Please try again later."
                };
            }
        }

        public async Task<ApiResponse<string>> UpdateProductCategoryAsync(
            string strCategoryId,
            AddProductCategoryRequest request,
            CancellationToken cancellationToken = default)
        {
            if (request is null)
            {
                return new ApiResponse<string>
                {
                    StatusCode = StatusCodes.Status400BadRequest,
                    Success = false,
                    Message = "Invalid request.",
                    Errors = "Category details are required."
                };
            }

            if (!Guid.TryParse(strCategoryId, out var categoryId) ||
                categoryId == Guid.Empty)
            {
                return new ApiResponse<string>
                {
                    StatusCode = StatusCodes.Status400BadRequest,
                    Success = false,
                    Message = "Invalid category.",
                    Errors = "The provided category ID is invalid."
                };
            }

            var categoryName = request.Name?.Trim();

            if (string.IsNullOrWhiteSpace(categoryName))
            {
                return new ApiResponse<string>
                {
                    StatusCode = StatusCodes.Status400BadRequest,
                    Success = false,
                    Message = "Invalid category name.",
                    Errors = "Category name is required."
                };
            }

            var adminClaim =
                Common.Common.GetAdminClaimInfo(_httpContextAccessor);

            if (!adminClaim.Success)
            {
                return new ApiResponse<string>
                {
                    StatusCode = adminClaim.StatusCode,
                    Success = false,
                    Message = adminClaim.Message,
                    Errors = adminClaim.Errors
                };
            }

            if (!Guid.TryParse(
                    adminClaim.Data?.Id?.ToString(),
                    out var adminId) ||
                adminId == Guid.Empty)
            {
                _logger.LogWarning(
                    "Category update rejected because authenticated admin ID is invalid. CategoryId: {CategoryId}",
                    categoryId);

                return new ApiResponse<string>
                {
                    StatusCode = StatusCodes.Status401Unauthorized,
                    Success = false,
                    Message = "Unauthorized request.",
                    Errors = "Valid administrator information could not be determined."
                };
            }

            var adminName =
                string.IsNullOrWhiteSpace(adminClaim.Data?.UserName)
                    ? "Unknown Admin"
                    : adminClaim.Data.UserName.Trim();

            var description =
                request.Description?.Trim() ?? string.Empty;

         
            try
            {
                

                var category = await _db.ProductCategories
                    .FirstOrDefaultAsync(
                        x => x.Id == categoryId,
                        cancellationToken);

                if (category is null)
                {
                    return new ApiResponse<string>
                    {
                        StatusCode = StatusCodes.Status404NotFound,
                        Success = false,
                        Message = "Category not found.",
                        Errors = "The selected product category does not exist."
                    };
                }

                var categoryNameExists =
                    await _db.ProductCategories
                        .AsNoTracking()
                        .AnyAsync(
                            x =>
                                x.Id != categoryId &&
                                EF.Functions.ILike(
                                    x.Name,
                                    categoryName),
                            cancellationToken);

                if (categoryNameExists)
                {
                    return new ApiResponse<string>
                    {
                        StatusCode = StatusCodes.Status409Conflict,
                        Success = false,
                        Message = "Category already exists.",
                        Errors =
                            $"A product category named '{categoryName}' already exists."
                    };
                }

                var slug = ProductHelper.GenerateSlug(
                    categoryName,
                    255);

                
                var slugExists =
                    await _db.ProductCategories
                        .AsNoTracking()
                        .AnyAsync(
                            x =>
                                x.Id != categoryId &&
                                x.Slug == slug,
                            cancellationToken);

                if (slugExists)
                {
                    var timestamp =
                        DateTimeOffset.UtcNow
                            .ToUnixTimeMilliseconds();

                    var suffix = $"-{timestamp}";

                    var maximumBaseLength =
                        255 - suffix.Length;

                    slug =
                        $"{ProductHelper.GenerateSlug(
                            categoryName,
                            maximumBaseLength)}{suffix}";
                }

                var currentTime = DateTime.UtcNow;

                category.Name = categoryName;

                category.Slug = slug;

                category.Description = description;

                category.ImageUrl =
                    request.ImageUrl?.Trim() ?? string.Empty;

                category.DisplayOrder =
                    request.DisplayOrder;

                category.IsFeatured =
                    request.IsFeatured;

                category.IsActive =
                    request.IsActive;

                // Do not modify CreatedOn
                category.UpdatedOn = currentTime;

                // ---------------------------------------------------------
                // Regenerate SEO fields
                // ---------------------------------------------------------

                category.MetaTitle =
                    ProductHelper.GenerateMetaTitle(
                        categoryName);

                category.MetaDescription =
                    ProductHelper.GenerateMetaDescription(
                        categoryName,
                        description);

                category.MetaKeywords =
                    ProductHelper.GenerateMetaKeywords(
                        categoryName);

                // ---------------------------------------------------------
                // Audit log
                // ---------------------------------------------------------

                var adminAction = new AdminAction
                {
                    Id = Guid.NewGuid(),

                    AdminId = adminId,

                    AdminName = adminName,

                    Module = AdminActionModules.Category,

                    Action = AdminActionTypes.Update,

                    EntityId = category.Id,

                    EntityName = category.Name,

                    Description =
                        $"Updated category '{category.Name}'.",

                    CreatedOn = currentTime
                };

                await _db.AdminActions.AddAsync(
                    adminAction,
                    cancellationToken);

                // ---------------------------------------------------------
                // Save all changes
                // ---------------------------------------------------------

                await _db.SaveChangesAsync(
                    cancellationToken);

               

                _logger.LogInformation(
                    "Category {CategoryId} ({CategoryName}) was updated successfully by Admin {AdminId}.",
                    category.Id,
                    category.Name,
                    adminId);

                return new ApiResponse<string>
                {
                    StatusCode = StatusCodes.Status200OK,
                    Success = true,
                    Message = "Category updated successfully.",
                    Data = category.Id.ToString()
                };
            }
            catch (DbUpdateException exception)
                when (exception.InnerException is PostgresException
                {
                    SqlState: PostgresErrorCodes.UniqueViolation
                })
            {
               

                _logger.LogWarning(
                    exception,
                    "Unique constraint rejected category update. CategoryId: {CategoryId}, CategoryName: {CategoryName}",
                    categoryId,
                    categoryName);

                return new ApiResponse<string>
                {
                    StatusCode = StatusCodes.Status409Conflict,
                    Success = false,
                    Message = "Unable to update category.",
                    Errors =
                        "Another category with the same name or slug already exists."
                };
            }
            catch (DbUpdateException exception)
            {
                

                _logger.LogError(
                    exception,
                    "Database error occurred while updating Category {CategoryId} ({CategoryName}).",
                    categoryId,
                    categoryName);

                return new ApiResponse<string>
                {
                    StatusCode = StatusCodes.Status500InternalServerError,
                    Success = false,
                    Message = "Unable to update the category.",
                    Errors =
                        "A database error occurred while saving the category. Please try again."
                };
            }
            catch (OperationCanceledException)
            {
               

                _logger.LogWarning(
                    "Category update was cancelled. CategoryId: {CategoryId}, CategoryName: {CategoryName}",
                    categoryId,
                    categoryName);

                return new ApiResponse<string>
                {
                    StatusCode = StatusCodes.Status408RequestTimeout,
                    Success = false,
                    Message = "The update category request was cancelled.",
                    Errors ="The request was cancelled before the category could be update. Please try again.",
                    
                };
            }
            catch (Exception exception)
            {
                

                _logger.LogError(
                    exception,
                    "Unexpected error occurred while updating Category {CategoryId} ({CategoryName}).",
                    categoryId,
                    categoryName);

                return new ApiResponse<string>
                {
                    StatusCode = StatusCodes.Status500InternalServerError,
                    Success = false,
                    Message = "Unable to update the category.",
                    Errors =
                        "An unexpected error occurred while updating the category. Please try again later."
                };
            }
        }


        public async Task<ApiResponse<List<ComboData>>> GetProductComboList(CancellationToken cancellationToken = default)
        {
            try
            {
                var products = await _db.Products
                    .AsNoTracking()
                    .Where(product => product.IsActive)
                    .OrderBy(product => product.Name)
                    .ThenBy(product => product.Id)
                    .Select(product => new ComboData
                    {
                        Id = product.Id.ToString(),
                        Name = product.Name
                    })
                    .ToListAsync(cancellationToken);

                return ApiResponse<List<ComboData>>.Ok(products,
                    products.Count > 0 ? "Product combo list retrieved successfully." : "No active products were found.");
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                return ApiResponse<List<ComboData>>.Fail(
                    "The product combo-list request was cancelled before it could be completed.",
                    StatusCodes.Status408RequestTimeout);
            }
            catch (DbException exception)
            {
                _logger.LogError(exception, "Database error occurred while retrieving the product combo list.");
                return ApiResponse<List<ComboData>>.Fail(
                    "A database error occurred while retrieving the product combo list. Please try again.",
                    StatusCodes.Status500InternalServerError);
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, "Unexpected error occurred while retrieving the product combo list.");
                return ApiResponse<List<ComboData>>.Fail(
                    "An unexpected error occurred while retrieving the product combo list. Please try again later.",
                    StatusCodes.Status500InternalServerError);
            }
        }


        public async Task<ApiResponse<List<ComboData>>> GetCategoryComboList(CancellationToken cancellationToken = default)
        {
            try
            {
                var categories = await _db.ProductCategories
                    .AsNoTracking()
                    .Where(category => category.IsActive)
                    .OrderBy(category => category.DisplayOrder)
                    .ThenBy(category => category.Name)
                    .Select(category => new ComboData
                    {
                        Id = category.Id.ToString(),
                        Name = category.Name
                    })
                    .ToListAsync(cancellationToken);

                return new ApiResponse<List<ComboData>>
                {
                    StatusCode = StatusCodes.Status200OK,
                    Success = true,
                    Message = categories.Count > 0
                        ? "Category list retrieved successfully."
                        : "No active categories were found.",
                    Data = categories
                };
            }
            catch (OperationCanceledException exception)
                when (cancellationToken.IsCancellationRequested)
            {
                _logger.LogWarning(
                    exception,
                    "The category combo-list request was cancelled.");

                return new ApiResponse<List<ComboData>>
                {
                    StatusCode = StatusCodes.Status408RequestTimeout,
                    Success = false,
                    Message = "The category-list request was cancelled.",
                    Errors =
                        "The request was cancelled before the category list could be retrieved. Please try again.",
                    Data = []
                };
            }
            catch (DbException exception)
            {
                _logger.LogError(
                    exception,
                    "Database error occurred while retrieving the category combo list.");

                return new ApiResponse<List<ComboData>>
                {
                    StatusCode = StatusCodes.Status500InternalServerError,
                    Success = false,
                    Message = "Unable to retrieve the category list.",
                    Errors =
                        "A database error occurred while retrieving the categories. Please try again.",
                    Data = []
                };
            }
            catch (Exception exception)
            {
                _logger.LogError(
                    exception,
                    "Unexpected error occurred while retrieving the category combo list.");

                return new ApiResponse<List<ComboData>>
                {
                    StatusCode = StatusCodes.Status500InternalServerError,
                    Success = false,
                    Message = "Unable to retrieve the category list.",
                    Errors =
                        "An unexpected error occurred while retrieving the categories. Please try again later.",
                    Data = []
                };
            }
        }


        public async Task<ApiResponse<List<ProductCategorylistResponse>>> GetCategoryList(
        int pageNumber = 1,
        CancellationToken cancellationToken = default)
        {
            const int pageSize = 10;

            try
            {
                pageNumber = Math.Max(pageNumber, 1);

                var skip = (pageNumber - 1) * pageSize;

                var categories = await _db.ProductCategories
                    .AsNoTracking()
                    .OrderByDescending(category => category.CreatedOn)
                    .Skip(skip)
                    .Take(pageSize)
                    .Select(category => new ProductCategorylistResponse
                    {
                        Id = category.Id.ToString(),
                        Name = category.Name,
                        Description = category.Description,
                        DisplayOrder = category.DisplayOrder,
                        Imageurl = string.Empty,
                        IsActive = category.IsActive,
                        IsFeatured = category.IsFeatured,
                        ProductCount = _db.Products.Count(product =>
                            product.CategoryId == category.Id),
                        Slug = category.Slug,
                        CreatedOn = category.CreatedOn.AddMinutes(-Common.Common.GetTimeZone(_httpContextAccessor)).ToString("yyyy-MM-dd HH:mm:ss")
                    })
                    .ToListAsync(cancellationToken);

                _logger.LogInformation(
                    "Retrieved {CategoryCount} product categories for page {PageNumber}.",
                    categories.Count,
                    pageNumber);

                return new ApiResponse<List<ProductCategorylistResponse>>
                {
                    StatusCode = StatusCodes.Status200OK,
                    Success = true,
                    Message = categories.Count > 0
                        ? "Product categories retrieved successfully."
                        : "No product categories were found.",
                    Data = categories
                };
            }
            catch (OperationCanceledException exception)
                when (cancellationToken.IsCancellationRequested)
            {
                _logger.LogWarning(
                    exception,
                    "Product category list request was cancelled for page {PageNumber}.",
                    pageNumber);

                return new ApiResponse<List<ProductCategorylistResponse>>
                {
                    StatusCode = StatusCodes.Status408RequestTimeout,
                    Success = false,
                    Message = "The product category list request was cancelled.",
                    Errors = "The request was cancelled before the product categories could be retrieved. Please try again.",
                    Data = []
                };
            }
            catch (DbException exception)
            {
                _logger.LogError(
                    exception,
                    "Database error occurred while retrieving product categories for page {PageNumber}.",
                    pageNumber);

                return new ApiResponse<List<ProductCategorylistResponse>>
                {
                    StatusCode = StatusCodes.Status500InternalServerError,
                    Success = false,
                    Message = "Unable to retrieve the product category list.",
                    Errors = "A database error occurred while retrieving the product categories. Please try again.",
                    Data = []
                };
            }
            catch (Exception exception)
            {
                _logger.LogError(
                    exception,
                    "Unexpected error occurred while retrieving product categories for page {PageNumber}.",
                    pageNumber);

                return new ApiResponse<List<ProductCategorylistResponse>>
                {
                    StatusCode = StatusCodes.Status500InternalServerError,
                    Success = false,
                    Message = "Unable to retrieve the product category list.",
                    Errors = "An unexpected error occurred while retrieving the product categories. Please try again later.",
                    Data = []
                };
            }
        }

        public async Task<ApiResponse<Dictionary<string, ProductCategoryImagesResponse>>> GetCategoryImagesByCategoryIds(
         List<string> categoryIds,
         CancellationToken cancellationToken = default)
        {
            if (categoryIds == null || categoryIds.Count == 0)
            {
                return new ApiResponse<Dictionary<string, ProductCategoryImagesResponse>>
                {
                    StatusCode = StatusCodes.Status200OK,
                    Success = true,
                    Message = "No category IDs were provided.",
                    Data = []
                };
            }

            try
            {
                cancellationToken.ThrowIfCancellationRequested();

                var validCategoryIds = categoryIds
                    .Where(id => !string.IsNullOrWhiteSpace(id))
                    .Select(id => Guid.TryParse(id, out var categoryId)
                        ? categoryId
                        : (Guid?)null)
                    .Where(id => id.HasValue)
                    .Select(id => id!.Value)
                    .Distinct()
                    .ToList();

                if (validCategoryIds.Count == 0)
                {
                    return new ApiResponse<Dictionary<string, ProductCategoryImagesResponse>>
                    {
                        StatusCode = StatusCodes.Status200OK,
                        Success = true,
                        Message = "No valid category IDs were provided.",
                        Data = []
                    };
                }

                const int chunkSize = 500;

                var result = new Dictionary<string, ProductCategoryImagesResponse>(
                    validCategoryIds.Count,
                    StringComparer.OrdinalIgnoreCase);

                foreach (var chunk in validCategoryIds.Chunk(chunkSize))
                {
                    cancellationToken.ThrowIfCancellationRequested();

                    var rows = await _db.ProductCategories
                        .AsNoTracking()
                        .Where(category => chunk.Contains(category.Id))
                        .Select(category => new ProductCategoryImagesResponse
                        {
                            CategoryId = category.Id.ToString(),
                            Imageurl = category.ImageUrl ?? string.Empty
                        })
                        .ToListAsync(cancellationToken);

                    foreach (var row in rows)
                    {
                        result[row.CategoryId] = row;
                    }
                }

                return new ApiResponse<Dictionary<string, ProductCategoryImagesResponse>>
                {
                    StatusCode = StatusCodes.Status200OK,
                    Success = true,
                    Message = result.Count > 0
                        ? "Product category images retrieved successfully."
                        : "No product category images were found.",
                    Data = result
                };
            }
            catch (OperationCanceledException exception)
                when (cancellationToken.IsCancellationRequested)
            {
                _logger.LogWarning(
                    exception,
                    "Product category images request was cancelled. Requested category count: {CategoryCount}.",
                    categoryIds.Count);

                return new ApiResponse<Dictionary<string, ProductCategoryImagesResponse>>
                {
                    StatusCode = StatusCodes.Status408RequestTimeout,
                    Success = false,
                    Message = "The product category images request was cancelled.",
                    Errors = "The request was cancelled before the category images could be retrieved. Please try again.",
                    Data = []
                };
            }
            catch (DbException exception)
            {
                _logger.LogError(
                    exception,
                    "Database error occurred while retrieving product category images. Requested category count: {CategoryCount}.",
                    categoryIds.Count);

                return new ApiResponse<Dictionary<string, ProductCategoryImagesResponse>>
                {
                    StatusCode = StatusCodes.Status500InternalServerError,
                    Success = false,
                    Message = "Unable to retrieve the product category images.",
                    Errors = "A database error occurred while retrieving the category images. Please try again.",
                    Data = []
                };
            }
            catch (Exception exception)
            {
                _logger.LogError(
                    exception,
                    "Unexpected error occurred while retrieving product category images. Requested category count: {CategoryCount}.",
                    categoryIds.Count);

                return new ApiResponse<Dictionary<string, ProductCategoryImagesResponse>>
                {
                    StatusCode = StatusCodes.Status500InternalServerError,
                    Success = false,
                    Message = "Unable to retrieve the product category images.",
                    Errors = "An unexpected error occurred while retrieving the category images. Please try again later.",
                    Data = []
                };
            }
        }

        public async Task<ApiResponse<List<AdminProductList>>> GetProductList(int pageNumber, CancellationToken cancellationToken = default)
        {
            const int pageSize = 10;
            try
            {

                pageNumber = Math.Max(pageNumber, 1);

                var skip = (pageNumber - 1) * pageSize;

                var products = await _db.Products
                   .AsNoTracking()
                   .OrderByDescending(product => product.CreatedOn)
                   .Skip(skip)
                   .Take(pageSize)
                   .Select(product => new AdminProductList
                   {
                       Id = product.Id.ToString(),
                       Name = product.Name,
                       IsActive = product.IsActive,
                       Slug = product.Slug,
                       CreatedOn = product.CreatedOn.AddMinutes(-Common.Common.GetTimeZone(_httpContextAccessor)).ToString("yyyy-MM-dd HH:mm:ss"),
                       CategoryName = product.Category.Name,
                       IsCategoryActive = product.Category.IsActive,
                       ImageUrl = "",
                       IsBestSeller = product.IsBestSeller,
                       IsFeatured = product.IsFeatured,
                       IsNewArrival = product.IsNewArrival,
                       IsTrending = product.IsTrending,
                       ShelfLife = product.ShelfLife,
                       Stock = _db.ProductVariants
                            .AsNoTracking()
                           .Where(variant => variant.ProductId == product.Id)
                           .Sum(variant => variant.StockQuantity),
                      Price  =  _db.ProductVariants
                                    .Where(variant => variant.ProductId == product.Id)
                                    //.OrderBy(variant => variant.Weight)
                                    .Select(variant =>
                                        $"{variant.Price:0.##}~{variant.Weight:0.##}{variant.WeightUnit}")
                                    .ToArray()
                   })
                   .ToListAsync(cancellationToken);

                _logger.LogInformation(
                    "Retrieved {productCount} products for page {PageNumber}.",
                    products.Count,
                    pageNumber);

                return new ApiResponse<List<AdminProductList>>
                {
                    StatusCode = StatusCodes.Status200OK,
                    Success = true,
                    Message = products.Count > 0
                        ? "Product retrieved successfully."
                        : "No product were found.",
                    Data = products
                };

            }
            catch (OperationCanceledException exception)
                when (cancellationToken.IsCancellationRequested)
            {
                _logger.LogWarning(
                    exception,
                    "Product list request was cancelled for page {PageNumber}.",
                    pageNumber);

                return new ApiResponse<List<AdminProductList>>
                {
                    StatusCode = StatusCodes.Status408RequestTimeout,
                    Success = false,
                    Message = "The product list request was cancelled.",
                    Errors = "The request was cancelled before the products could be retrieved. Please try again.",
                    Data = []
                };
            }
            catch (DbException exception)
            {
                _logger.LogError(
                    exception,
                    "Database error occurred while retrieving product categories for page {PageNumber}.",
                    pageNumber);

                return new ApiResponse<List<AdminProductList>>
                {
                    StatusCode = StatusCodes.Status500InternalServerError,
                    Success = false,
                    Message = "Unable to retrieve the product list.",
                    Errors = "A database error occurred while retrieving the product. Please try again.",
                    Data = []
                };
            }
            catch (Exception exception)
            {
                _logger.LogError(
                    exception,
                    "Unexpected error occurred while retrieving product categories for page {PageNumber}.",
                    pageNumber);

                return new ApiResponse<List<AdminProductList>>
                {
                    StatusCode = StatusCodes.Status500InternalServerError,
                    Success = false,
                    Message = "Unable to retrieve the product list.",
                    Errors = "An unexpected error occurred while retrieving the product. Please try again later.",
                    Data = []
                };
            }
        }

        public async Task<ApiResponse<Dictionary<string, ProductImagesResponse>>> GetProductImagesByProductIds(
            List<string> productIds,
            CancellationToken cancellationToken = default)
        {
            if (productIds == null || productIds.Count == 0)
            {
                return new ApiResponse<Dictionary<string, ProductImagesResponse>>
                {
                    StatusCode = StatusCodes.Status200OK,
                    Success = true,
                    Message = "No product IDs were provided.",
                    Data = []
                };
            }

            try
            {
                var validProductIds = productIds
                    .Where(id => !string.IsNullOrWhiteSpace(id))
                    .Select(id => Guid.TryParse(id, out var productId)
                        ? productId
                        : (Guid?)null)
                    .Where(id => id.HasValue)
                    .Select(id => id!.Value)
                    .Distinct()
                    .ToList();

                if (validProductIds.Count == 0)
                {
                    return new ApiResponse<Dictionary<string, ProductImagesResponse>>
                    {
                        StatusCode = StatusCodes.Status200OK,
                        Success = true,
                        Message = "No valid product IDs were provided.",
                        Data = []
                    };
                }

                var rows = await _db.ProductImages
                    .AsNoTracking()
                    .Where(image => validProductIds.Contains(image.ProductId))
                    .OrderByDescending(image => image.IsPrimary)
                    .ThenBy(image => image.DisplayOrder)
                    .Select(image => new ProductImagesResponse
                    {
                        ProductId = image.ProductId.ToString(),
                        Imageurl = image.ImageUrl
                    })
                    .ToListAsync(cancellationToken);

                var result = new Dictionary<string, ProductImagesResponse>(
                    validProductIds.Count,
                    StringComparer.OrdinalIgnoreCase);

                foreach (var row in rows)
                {
                    result.TryAdd(row.ProductId, row);
                }

                return new ApiResponse<Dictionary<string, ProductImagesResponse>>
                {
                    StatusCode = StatusCodes.Status200OK,
                    Success = true,
                    Message = result.Count > 0
                        ? "Product images retrieved successfully."
                        : "No product images were found.",
                    Data = result
                };
            }
            catch (OperationCanceledException exception)
                when (cancellationToken.IsCancellationRequested)
            {
                _logger.LogWarning(
                    exception,
                    "Product image request was cancelled. Requested product count: {ProductCount}.",
                    productIds.Count);

                return new ApiResponse<Dictionary<string, ProductImagesResponse>>
                {
                    StatusCode = StatusCodes.Status408RequestTimeout,
                    Success = false,
                    Message = "The product image request was cancelled.",
                    Errors = "The request was cancelled before product images could be retrieved.",
                    Data = []
                };
            }
            catch (DbException exception)
            {
                _logger.LogError(exception, "Database error occurred while retrieving product images.");

                return new ApiResponse<Dictionary<string, ProductImagesResponse>>
                {
                    StatusCode = StatusCodes.Status500InternalServerError,
                    Success = false,
                    Message = "Unable to retrieve product images.",
                    Errors = "A database error occurred while retrieving product images.",
                    Data = []
                };
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, "Unexpected error occurred while retrieving product images.");

                return new ApiResponse<Dictionary<string, ProductImagesResponse>>
                {
                    StatusCode = StatusCodes.Status500InternalServerError,
                    Success = false,
                    Message = "Unable to retrieve product images.",
                    Errors = "An unexpected error occurred while retrieving product images.",
                    Data = []
                };
            }
        }


        public async Task<ApiResponse<List<ProductInventoryResponse>>>GetInventoryProductList(int pageNumber,CancellationToken cancellationToken = default)
        {
            if (pageNumber < 1)
            {
                return new ApiResponse<List<ProductInventoryResponse>>
                {
                    StatusCode = StatusCodes.Status400BadRequest,
                    Success = false,
                    Message = "Invalid page number.",
                    Errors = "Page number must be greater than or equal to 1.",
                    Data = []
                };
            }
            int InventoryPageSize = 20;

            var recordsToSkip =
                ((long)pageNumber - 1) * InventoryPageSize;

            if (recordsToSkip > int.MaxValue)
            {
                return new ApiResponse<List<ProductInventoryResponse>>
                {
                    StatusCode = StatusCodes.Status400BadRequest,
                    Success = false,
                    Message = "Invalid page number.",
                    Errors = "The requested page number exceeds the supported range.",
                    Data = []
                };
            }

            try
            {
                cancellationToken.ThrowIfCancellationRequested();

                var inventory = await _db.ProductVariants
                    .AsNoTracking()
                    .OrderBy(variant => variant.Product.Name)
                    .ThenBy(variant => variant.Weight)
                    .ThenBy(variant => variant.Id)
                    .Skip((int)recordsToSkip)
                    .Take(InventoryPageSize)
                    .Select(variant => new ProductInventoryResponse
                    {

                        Id = variant.Id.ToString(),
                        ProductId = variant.ProductId.ToString(),
                        Name = variant.Product.Name,
                        Slug = variant.Product.Slug,
                        CategoryId =
                            variant.Product.CategoryId.ToString(),
                        CategoryName =
                            variant.Product.Category.Name,
                        Stock = variant.StockQuantity,
                        ImageUrl = string.Empty,
                        Weight = variant.Weight,
                        WeightUnit =
                            variant.WeightUnit ?? string.Empty,
                        IsVariantActive = variant.IsActive,
                        IsProductActive = variant.Product.IsActive
                    })
                    .ToListAsync(cancellationToken);

                return new ApiResponse<List<ProductInventoryResponse>>
                {
                    StatusCode = StatusCodes.Status200OK,
                    Success = true,

                    Message = inventory.Count > 0
                        ? "Product inventory retrieved successfully."
                        : "No inventory records were found for the requested page.",

                    Data = inventory
                };
            }
            catch (OperationCanceledException exception)
                when (cancellationToken.IsCancellationRequested)
            {
                _logger.LogInformation(
                    exception,
                    "Product inventory request was cancelled. PageNumber: {PageNumber}, PageSize: {PageSize}.",
                    pageNumber,
                    InventoryPageSize);

                return new ApiResponse<List<ProductInventoryResponse>>
                {
                    StatusCode = StatusCodes.Status408RequestTimeout,
                    Success = false,
                    Message = "The product inventory request was cancelled.",
                    Errors =
                        "The request was cancelled before the inventory records could be retrieved.",
                    Data = []
                };
            }
            catch (DbException exception)
            {
                _logger.LogError(
                    exception,
                    "Database error occurred while retrieving product inventory. PageNumber: {PageNumber}, PageSize: {PageSize}.",
                    pageNumber,
                    InventoryPageSize);

                return new ApiResponse<List<ProductInventoryResponse>>
                {
                    StatusCode = StatusCodes.Status500InternalServerError,
                    Success = false,
                    Message = "Unable to retrieve product inventory.",
                    Errors =
                        "A database error occurred while retrieving the inventory records. Please try again.",
                    Data = []
                };
            }
            catch (Exception exception)
            {
                _logger.LogError(
                    exception,
                    "Unexpected error occurred while retrieving product inventory. PageNumber: {PageNumber}, PageSize: {PageSize}.",
                    pageNumber,
                    InventoryPageSize);

                return new ApiResponse<List<ProductInventoryResponse>>
                {
                    StatusCode = StatusCodes.Status500InternalServerError,
                    Success = false,
                    Message = "Unable to retrieve product inventory.",
                    Errors =
                        "An unexpected error occurred while retrieving the inventory records. Please try again later.",
                    Data = []
                };
            }
        }

        public async Task<ApiResponse<UpdateProductVariantInventoryResponse>>
    UpdateProductVariantInventoryAsync(
        UpdateProductVariantInventoryRequest request,
        CancellationToken cancellationToken = default)
        {
            if (request is null)
            {
                return new ApiResponse<UpdateProductVariantInventoryResponse>
                {
                    StatusCode = StatusCodes.Status400BadRequest,
                    Success = false,
                    Message = "Invalid inventory update request.",
                    Errors = "Inventory update details are required."
                };
            }

            if (request.ProductId == Guid.Empty)
            {
                return new ApiResponse<UpdateProductVariantInventoryResponse>
                {
                    StatusCode = StatusCodes.Status400BadRequest,
                    Success = false,
                    Message = "Invalid product ID.",
                    Errors = "A valid product ID is required."
                };
            }

            if (request.VariantId == Guid.Empty)
            {
                return new ApiResponse<UpdateProductVariantInventoryResponse>
                {
                    StatusCode = StatusCodes.Status400BadRequest,
                    Success = false,
                    Message = "Invalid product variant ID.",
                    Errors = "A valid product variant ID is required."
                };
            }

            if (request.Stock < 0)
            {
                return new ApiResponse<UpdateProductVariantInventoryResponse>
                {
                    StatusCode = StatusCodes.Status400BadRequest,
                    Success = false,
                    Message = "Invalid stock quantity.",
                    Errors = "Stock quantity cannot be negative."
                };
            }

            try
            {
                cancellationToken.ThrowIfCancellationRequested();

                var adminResult = Common.Common.GetAdminClaimInfo(
                    _httpContextAccessor);

                if (!adminResult.Success ||
                    adminResult.Data is null)
                {
                    return new ApiResponse<UpdateProductVariantInventoryResponse>
                    {
                        StatusCode = adminResult.StatusCode,
                        Success = false,
                        Message = adminResult.Message,
                        Errors = adminResult.Errors
                    };
                }

                if (!Guid.TryParse(
                        adminResult.Data.Id.ToString(),
                        out var adminId))
                {
                    return new ApiResponse<UpdateProductVariantInventoryResponse>
                    {
                        StatusCode = StatusCodes.Status401Unauthorized,
                        Success = false,
                        Message = "Invalid administrator information.",
                        Errors =
                            "The authenticated administrator ID is missing or invalid."
                    };
                }

                var adminName = adminResult.Data.UserName?.Trim();

                if (string.IsNullOrWhiteSpace(adminName))
                {
                    return new ApiResponse<UpdateProductVariantInventoryResponse>
                    {
                        StatusCode = StatusCodes.Status401Unauthorized,
                        Success = false,
                        Message = "Invalid administrator information.",
                        Errors =
                            "The authenticated administrator name is missing."
                    };
                }

              

                var inventoryRecord = await _db.ProductVariants
                    .Where(variant =>
                        variant.Id == request.VariantId &&
                        variant.ProductId == request.ProductId)
                    .Select(variant => new
                    {
                        Variant = variant,
                        ProductName = variant.Product.Name,
                        Product = variant.Product,
                    })
                    .SingleOrDefaultAsync(cancellationToken);

                if (inventoryRecord is null)
                {
                    _logger.LogWarning(
                        "Inventory update rejected because product variant was not found. ProductId: {ProductId}, VariantId: {VariantId}, AdminId: {AdminId}.",
                        request.ProductId,
                        request.VariantId,
                        adminId);

                    return new ApiResponse<UpdateProductVariantInventoryResponse>
                    {
                        StatusCode = StatusCodes.Status404NotFound,
                        Success = false,
                        Message = "Product variant not found.",
                        Errors =
                            "The product variant does not exist or does not belong to the specified product."
                    };
                }

                var variant = inventoryRecord.Variant;

                var previousStock = variant.StockQuantity;
                var previousActiveStatus = variant.IsActive;

                var currentTime = DateTime.UtcNow;

                // Avoid unnecessary database writes and audit records.
                if (previousStock == request.Stock &&
                    previousActiveStatus == request.IsActive)
                {
                    return new ApiResponse<UpdateProductVariantInventoryResponse>
                    {
                        StatusCode = StatusCodes.Status200OK,
                        Success = true,
                        Message =
                            "Product variant inventory already matches the requested values.",

                        Data = new UpdateProductVariantInventoryResponse
                        {
                            ProductId = variant.ProductId,
                            VariantId = variant.Id,
                            Stock = variant.StockQuantity,
                            IsActive = variant.IsActive,
                        }
                    };
                }

                variant.StockQuantity = request.Stock;
                variant.IsActive = request.IsActive;
                variant.Product.UpdatedOn = currentTime;


                var entityName =
                    $"{inventoryRecord.ProductName} - {variant.Name}";

                if (entityName.Length > 250)
                {
                    entityName = entityName[..250];
                }

                var adminAction = new AdminAction
                {
                    Id = Guid.NewGuid(),
                    AdminId = adminId,
                    AdminName = adminName,
                    Module = AdminActionModules.Inventory,
                    Action = AdminActionTypes.Update,
                    EntityId = variant.Id,
                    EntityName = entityName,

                    Description =
                        $"Updated inventory for variant '{variant.Name}'. " +
                        $"Stock changed from {previousStock} to {request.Stock}. " +
                        $"Active status changed from {previousActiveStatus} " +
                        $"to {request.IsActive}.",

                    CreatedOn = currentTime
                };

                _db.AdminActions.Add(adminAction);

                await _db.SaveChangesAsync(cancellationToken);

                _logger.LogInformation(
                    "Product variant inventory updated successfully. ProductId: {ProductId}, VariantId: {VariantId}, OldStock: {OldStock}, NewStock: {NewStock}, OldActiveStatus: {OldActiveStatus}, NewActiveStatus: {NewActiveStatus}, AdminId: {AdminId}.",
                    variant.ProductId,
                    variant.Id,
                    previousStock,
                    variant.StockQuantity,
                    previousActiveStatus,
                    variant.IsActive,
                    adminId);

                return new ApiResponse<UpdateProductVariantInventoryResponse>
                {
                    StatusCode = StatusCodes.Status200OK,
                    Success = true,
                    Message = "Product variant inventory updated successfully.",

                    Data = new UpdateProductVariantInventoryResponse
                    {
                        ProductId = variant.ProductId,
                        VariantId = variant.Id,
                        Stock = variant.StockQuantity,
                        IsActive = variant.IsActive,
                    }
                };
            }
            catch (OperationCanceledException exception)
                when (cancellationToken.IsCancellationRequested)
            {
                _logger.LogInformation(
                    exception,
                    "Product variant inventory update was cancelled. ProductId: {ProductId}, VariantId: {VariantId}.",
                    request.ProductId,
                    request.VariantId);

                return new ApiResponse<UpdateProductVariantInventoryResponse>
                {
                    StatusCode = StatusCodes.Status408RequestTimeout,
                    Success = false,
                    Message = "The inventory update request was cancelled.",
                    Errors =
                        "The request was cancelled before the product variant inventory could be updated."
                };
            }
            catch (DbUpdateConcurrencyException exception)
            {
                _logger.LogWarning(
                    exception,
                    "Concurrent product variant inventory update detected. ProductId: {ProductId}, VariantId: {VariantId}.",
                    request.ProductId,
                    request.VariantId);

                return new ApiResponse<UpdateProductVariantInventoryResponse>
                {
                    StatusCode = StatusCodes.Status409Conflict,
                    Success = false,
                    Message =
                        "The product variant inventory was modified by another request.",
                    Errors =
                        "Refresh the inventory record and try the update again."
                };
            }
            catch (DbUpdateException exception)
            {
                _logger.LogError(
                    exception,
                    "Database update error occurred while updating product variant inventory. ProductId: {ProductId}, VariantId: {VariantId}.",
                    request.ProductId,
                    request.VariantId);

                return new ApiResponse<UpdateProductVariantInventoryResponse>
                {
                    StatusCode = StatusCodes.Status500InternalServerError,
                    Success = false,
                    Message = "Unable to update product variant inventory.",
                    Errors =
                        "A database error occurred while saving the inventory changes. Please try again."
                };
            }
            catch (DbException exception)
            {
                _logger.LogError(
                    exception,
                    "Database error occurred while retrieving product variant inventory. ProductId: {ProductId}, VariantId: {VariantId}.",
                    request.ProductId,
                    request.VariantId);

                return new ApiResponse<UpdateProductVariantInventoryResponse>
                {
                    StatusCode = StatusCodes.Status500InternalServerError,
                    Success = false,
                    Message = "Unable to update product variant inventory.",
                    Errors =
                        "A database error occurred while processing the inventory update. Please try again."
                };
            }
            catch (Exception exception)
            {
                _logger.LogError(
                    exception,
                    "Unexpected error occurred while updating product variant inventory. ProductId: {ProductId}, VariantId: {VariantId}.",
                    request.ProductId,
                    request.VariantId);

                return new ApiResponse<UpdateProductVariantInventoryResponse>
                {
                    StatusCode = StatusCodes.Status500InternalServerError,
                    Success = false,
                    Message = "Unable to update product variant inventory.",
                    Errors =
                        "An unexpected error occurred while updating the inventory. Please try again later."
                };
            }
        }
    }
}
