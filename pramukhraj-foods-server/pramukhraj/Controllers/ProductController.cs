using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using pramukhraj.DTOs.Product;
using pramukhraj.Interfaces;
using static pramukhraj.DTOs.Product.ProductCategoryRequestResponse;

namespace pramukhraj.Controllers
{
    [Route("api/admin/products")]
    [ApiController]
    [EnableRateLimiting("rate-limit")]
    public class ProductController : ControllerBase
    {
        private readonly IServiceManager _serviceManager;

        public ProductController(IServiceManager serviceManager)
        {
            _serviceManager = serviceManager;
        }

        [HttpPost("add")]
        [Authorize]
        public async Task<IActionResult> AddNewProduct(
            [FromBody] AddProductRequest request,
            CancellationToken cancellationToken)
        {
            var response = await _serviceManager.ProductService
                .AddNewProductAsync(request, cancellationToken);

            return StatusCode(response.StatusCode, response);
        }

        [HttpPost("category/add")]
        [Authorize]
        public async Task<IActionResult> AddNewCategory(
            [FromBody] AddProductCategoryRequest request,
            CancellationToken cancellationToken)
        {
            var response = await _serviceManager.ProductService
                .AddProductCategoryAsync(request, cancellationToken);

            return StatusCode(response.StatusCode, response);
        }

        [HttpGet("category/get-combo-list")]
        [Authorize]
        public async Task<IActionResult> GetCategoryComboList(CancellationToken cancellationToken)
        {
            var response = await _serviceManager.ProductService.GetCategoryComboList(cancellationToken);

            return StatusCode(response.StatusCode, response);
        }

        [HttpGet("get-list/{pageNumber:int?}")]
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

        [HttpPost("get-product-images")]
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


        [HttpGet("category/get-list/{pageNumber:int?}")]
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

        [HttpPost("category/get-category-images")]
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
