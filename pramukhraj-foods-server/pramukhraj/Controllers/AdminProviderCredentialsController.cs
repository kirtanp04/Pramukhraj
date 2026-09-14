using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using pramukhraj.DTOs.ProviderCredentials;
using pramukhraj.Interfaces;

namespace pramukhraj.Controllers;

[ApiController]
[Route("api/admin/provider-credentials")]
[Authorize(Roles = "Admin")]
[EnableRateLimiting("rate-limit")]
public sealed class AdminProviderCredentialsController : ControllerBase
{
    private readonly IServiceManager _serviceManager;

    public AdminProviderCredentialsController(IServiceManager serviceManager) => _serviceManager = serviceManager;

    [HttpGet("{providerKey}")]
    public async Task<IActionResult> GetByKey(string providerKey, CancellationToken cancellationToken)
    {
        var response = await _serviceManager.ProviderCredentialService.GetByKeyAsync(providerKey, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateProviderCredentialRequest request, CancellationToken cancellationToken)
    {
        var response = await _serviceManager.ProviderCredentialService.CreateAsync(request, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpPut("{providerKey}")]
    public async Task<IActionResult> Update(
        string providerKey,
        [FromBody] UpdateProviderCredentialRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _serviceManager.ProviderCredentialService.UpdateAsync(providerKey, request, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }
}
