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

            // Validate CategoryId
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

            //await using var transaction =
            //    await _db.Database.BeginTransactionAsync(cancellationToken);

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
                    .AnyAsync(
                        x => x.Id == categoryId && x.IsActive
,
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
                    UpdatedOn = currentTime
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
                        DisplayOrder = image.DisplayOrder
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
                        IsActive = variant.IsActive
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
    }
}
