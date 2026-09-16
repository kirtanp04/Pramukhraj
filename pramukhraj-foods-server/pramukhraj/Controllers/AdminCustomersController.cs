using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using pramukhraj.DTOs.Customer;
using pramukhraj.Interfaces;

namespace pramukhraj.Controllers;

[ApiController]
[Route("api/admin/customers")]
[Authorize(Roles = "Admin")]
[EnableRateLimiting("rate-limit")]
public sealed class AdminCustomersController(IServiceManager serviceManager) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetList(
        [FromQuery] AdminCustomerListRequest request,
        CancellationToken cancellationToken)
    {
        var response = await serviceManager.AdminCustomerService.GetListAsync(request, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var response = await serviceManager.AdminCustomerService.GetByIdAsync(id, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpPatch("{id:guid}")]
    public async Task<IActionResult> Patch(
        Guid id,
        [FromBody] PatchAdminCustomerRequest request,
        CancellationToken cancellationToken)
    {
        var response = await serviceManager.AdminCustomerService.PatchAsync(id, request, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }
}
