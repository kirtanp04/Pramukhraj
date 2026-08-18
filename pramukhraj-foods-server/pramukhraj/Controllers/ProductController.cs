using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using pramukhraj.Interfaces;

namespace pramukhraj.Controllers
{
    [Route("api/products")]
    [ApiController]
    public class ProductController : ControllerBase
    {
        private readonly IServiceManager _serviceManager;

        public ProductController(IServiceManager serviceManager)
        {
            _serviceManager = serviceManager;
        }
    }
}
