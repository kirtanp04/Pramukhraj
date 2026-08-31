using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using pramukhraj.DTOs.Product;
using pramukhraj.Interfaces;
using static pramukhraj.DTOs.Product.ProductCategoryRequestResponse;

namespace pramukhraj.Controllers
{
    [Route("api/products")]
    [ApiController]
    [EnableRateLimiting("rate-limit")]
    public class ProductController : ControllerBase
    {
        private readonly IServiceManager _serviceManager;

        public ProductController(IServiceManager serviceManager)
        {
            _serviceManager = serviceManager;
        }

        [HttpPost("admin/add")]
        [Authorize]
        public async Task<IActionResult> AddNewProduct(
            [FromBody] AddProductRequest request,
            CancellationToken cancellationToken)
        {
            var response = await _serviceManager.ProductService
                .AddNewProductAsync(request, cancellationToken);

            return StatusCode(response.StatusCode, response);
        }


        [HttpGet("admin/{id}")]
        [Authorize]
        public async Task<IActionResult> GetProductById(
            string id,
            CancellationToken cancellationToken)
        {
            var response = await _serviceManager.ProductService
                .GetProductByIdAsync(id, cancellationToken);

            return StatusCode(response.StatusCode, response);
        }


        [HttpPut("admin/{id}")]
        [Authorize]
        public async Task<IActionResult> UpdateProduct(
            string id,
            [FromBody] AddProductRequest request,
            CancellationToken cancellationToken)
        {
            var response = await _serviceManager.ProductService
                .UpdateProductAsync(id, request, cancellationToken);

            return StatusCode(response.StatusCode, response);
        }


        [HttpPost("admin/category/add")]
        [Authorize]
        public async Task<IActionResult> AddNewCategory(
            [FromBody] AddProductCategoryRequest request,
            CancellationToken cancellationToken)
        {
            var response = await _serviceManager.ProductService
                .AddProductCategoryAsync(request, cancellationToken);

            return StatusCode(response.StatusCode, response);
        }


        [HttpGet("admin/category/{id}")]
        [Authorize]
        public async Task<IActionResult> GetCategoryById(
            string id,
            CancellationToken cancellationToken)
        {
            var response = await _serviceManager.ProductService
                .GetProductCategoryByIdAsync(id, cancellationToken);

            return StatusCode(response.StatusCode, response);
        }


        [HttpPut("admin/category/{id}")]
        [Authorize]
        public async Task<IActionResult> UpdateCategory(
            string id,
            [FromBody] AddProductCategoryRequest request,
            CancellationToken cancellationToken)
        {
            var response = await _serviceManager.ProductService
                .UpdateProductCategoryAsync(id, request, cancellationToken);

            return StatusCode(response.StatusCode, response);
        }


        [HttpGet("admin/category/get-combo-list")]
        [Authorize]
        public async Task<IActionResult> GetCategoryComboList(CancellationToken cancellationToken)
        {
            var response = await _serviceManager.ProductService.GetCategoryComboList(cancellationToken);

            return StatusCode(response.StatusCode, response);
        }


        [HttpGet("admin/get-list/{pageNumber:int?}")]
        [Authorize]
        public async Task<IActionResult> GetProductList([FromRoute] int? pageNumber, CancellationToken cancellationToken)
        {
            var productPage = pageNumber.GetValueOrDefault(0);

            if (productPage < 0)
            {
                productPage  = 0;
            }

            var response = await _serviceManager.ProductService.GetProductList(
                productPage,
                cancellationToken);

            return StatusCode(response.StatusCode, response);
        }


        [HttpPost("admin/get-product-images")]
        [Authorize]
        public async Task<IActionResult> GetProductImages(
            [FromBody] GetProductImagesRequest request,
            CancellationToken cancellationToken)
        {
            var response = await _serviceManager.ProductService.GetProductImagesByProductIds(
                request.ProductIds,
                cancellationToken);

            return StatusCode(response.StatusCode, response);
        }


        [HttpGet("admin/category/get-list/{pageNumber:int?}")]
        [Authorize]
        public async Task<IActionResult> GetCategoryList([FromRoute] int? pageNumber,CancellationToken cancellationToken)
        {
            var categoryPage = pageNumber.GetValueOrDefault(0);

            if (categoryPage < 0)
            {
                categoryPage = 0;
            }

            var response = await _serviceManager.ProductService.GetCategoryList(
                categoryPage,
                cancellationToken);

            return StatusCode(response.StatusCode, response);
        }


        [HttpPost("admin/category/get-category-images")]
        [Authorize]
        public async Task<IActionResult> GetCategoryImages([FromBody] GetProductCategoriesImagesRequest request, CancellationToken cancellationToken)
        {
            var response = await _serviceManager.ProductService.GetCategoryImagesByCategoryIds(
                request.CategoryIds,
                cancellationToken);

            return StatusCode(response.StatusCode, response);
        }
    }
}
