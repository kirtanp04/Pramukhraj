using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using pramukhraj.Common;
using pramukhraj.DTOs.Customer;
using pramukhraj.Interfaces;

namespace pramukhraj.Controllers;

[ApiController]
[Route("api/customer/addresses")]
[Authorize(AuthenticationSchemes = CustomerAuthenticationDefaults.AuthenticationScheme, Roles = "Customer")]
[EnableRateLimiting("cart-mutation")]
public sealed class CustomerAddressesController(IServiceManager serviceManager) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var response = await serviceManager.CustomerAddressService.GetAllAsync(cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpGet("{addressId:guid}")]
    public async Task<IActionResult> Get(Guid addressId, CancellationToken cancellationToken)
    {
        var response = await serviceManager.CustomerAddressService.GetByIdAsync(addressId, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CustomerAddressWriteRequest request, CancellationToken cancellationToken)
    {
        var response = await serviceManager.CustomerAddressService.CreateAsync(request, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpPut("{addressId:guid}")]
    public async Task<IActionResult> Update(Guid addressId, [FromBody] CustomerAddressWriteRequest request, CancellationToken cancellationToken)
    {
        var response = await serviceManager.CustomerAddressService.UpdateAsync(addressId, request, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpDelete("{addressId:guid}")]
    public async Task<IActionResult> Delete(Guid addressId, CancellationToken cancellationToken)
    {
        var response = await serviceManager.CustomerAddressService.DeleteAsync(addressId, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpPatch("{addressId:guid}/default-shipping")]
    public async Task<IActionResult> SetDefaultShipping(Guid addressId, CancellationToken cancellationToken)
    {
        var response = await serviceManager.CustomerAddressService.SetDefaultShippingAsync(addressId, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpPatch("{addressId:guid}/default-billing")]
    public async Task<IActionResult> SetDefaultBilling(Guid addressId, CancellationToken cancellationToken)
    {
        var response = await serviceManager.CustomerAddressService.SetDefaultBillingAsync(addressId, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }
}
