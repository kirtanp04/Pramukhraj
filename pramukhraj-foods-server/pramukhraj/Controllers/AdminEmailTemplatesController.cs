using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using pramukhraj.DTOs.EmailTemplates;
using pramukhraj.Interfaces;

namespace pramukhraj.Controllers;

[ApiController]
[Route("api/admin/email-templates")]
[Authorize(Roles = "Admin")]
[EnableRateLimiting("rate-limit")]
public sealed class AdminEmailTemplatesController(IServiceManager serviceManager) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetList(CancellationToken token)
    {
        var response = await serviceManager.EmailTemplateService.GetListAsync(token);
        return StatusCode(response.StatusCode, response);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken token)
    {
        var response = await serviceManager.EmailTemplateService.GetByIdAsync(id, token);
        return StatusCode(response.StatusCode, response);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] EmailTemplateWriteRequest request, CancellationToken token)
    {
        var response = await serviceManager.EmailTemplateService.CreateAsync(request, token);
        return StatusCode(response.StatusCode, response);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] EmailTemplateWriteRequest request, CancellationToken token)
    {
        var response = await serviceManager.EmailTemplateService.UpdateAsync(id, request, token);
        return StatusCode(response.StatusCode, response);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken token)
    {
        var response = await serviceManager.EmailTemplateService.DeleteAsync(id, token);
        return StatusCode(response.StatusCode, response);
    }

    [HttpPost("seed-defaults")]
    public async Task<IActionResult> SeedDefaults([FromQuery] bool overwrite = false, CancellationToken token = default)
    {
        var response = await serviceManager.EmailTemplateService.SeedDefaultsAsync(overwrite, token);
        return StatusCode(response.StatusCode, response);
    }
}
