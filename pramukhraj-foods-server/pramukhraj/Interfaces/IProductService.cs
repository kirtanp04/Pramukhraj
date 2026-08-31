using Microsoft.AspNetCore.Mvc;
using pramukhraj.Common;
using pramukhraj.DTOs.Common;
using pramukhraj.DTOs.Product;
using static pramukhraj.DTOs.Product.ProductCategoryRequestResponse;

namespace pramukhraj.Interfaces
{
    public interface IProductService
    {
        public Task<ApiResponse<string>> AddNewProductAsync(AddProductRequest request, CancellationToken cancellationToken);

        public Task<ApiResponse<string>> UpdateProductAsync(string productId,AddProductRequest request, CancellationToken cancellationToken);

        public Task<ApiResponse<ProductDetailsResponse>> GetProductByIdAsync(string productId, CancellationToken cancellationToken = default);

        public Task<ApiResponse<string>> AddProductCategoryAsync(AddProductCategoryRequest request,CancellationToken cancellationToken = default);

        public  Task<ApiResponse<string>> UpdateProductCategoryAsync(string strCategoryId,AddProductCategoryRequest request,CancellationToken cancellationToken = default);

        public Task<ApiResponse<ProductCategoryDetailsResponse>> GetProductCategoryByIdAsync(string categoryId, CancellationToken cancellationToken = default);

        public Task<ApiResponse<List<ComboData>>> GetCategoryComboList(CancellationToken cancellationToken = default);

        public Task<ApiResponse<List<ProductCategorylistResponse>>> GetCategoryList(int PageNumber,CancellationToken cancellationToken = default);

        public Task<ApiResponse<Dictionary<string,ProductCategoryImagesResponse>>> GetCategoryImagesByCategoryIds(List<string> categoryIds, CancellationToken cancellationToken = default);

        public Task<ApiResponse<List<AdminProductList>>> GetProductList(int PageNumber, CancellationToken cancellationToken = default);

        public Task<ApiResponse<Dictionary<string, ProductImagesResponse>>> GetProductImagesByProductIds(List<string> productIds, CancellationToken cancellationToken = default);
    }
}
