using Microsoft.AspNetCore.Mvc;
using pramukhraj.Common;
using pramukhraj.DTOs.Common;
using pramukhraj.DTOs.Product;

namespace pramukhraj.Interfaces
{
    public interface IProductService
    {
        public Task<ApiResponse<string>> AddNewProductAsync(AddProductRequest request, CancellationToken cancellationToken);

        public Task<ApiResponse<string>> AddProductCategoryAsync(AddProductCategoryRequest request,CancellationToken cancellationToken = default);

        public Task<ApiResponse<List<ComboData>>> GetCategoryComboList(CancellationToken cancellationToken = default);
    }
}
