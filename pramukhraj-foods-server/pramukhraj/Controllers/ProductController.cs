using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using pramukhraj.Common;
using pramukhraj.DTOs.Auth;
using pramukhraj.DTOs.Product;
using pramukhraj.Entities.Product;
using pramukhraj.Interfaces;

namespace pramukhraj.Controllers
{
    [Route("api/admin/products")]
    [ApiController]
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
    }
}
