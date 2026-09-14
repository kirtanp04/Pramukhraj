using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using pramukhraj.DTOs.FAQ;
using pramukhraj.Interfaces;

namespace pramukhraj.Controllers;

[ApiController]
[Route("api/admin/faqs")]
[Authorize(Roles = "Admin")]
[EnableRateLimiting("rate-limit")]
public sealed class AdminFaqController : ControllerBase
{
    private readonly IServiceManager _serviceManager;

    public AdminFaqController(IServiceManager serviceManager)
    {
        _serviceManager = serviceManager;
    }

    [HttpGet]
    public async Task<IActionResult> GetList(
        [FromQuery] int pageNumber = 1,
        CancellationToken cancellationToken = default)
    {
        var response = await _serviceManager.FaqService.GetListAsync(pageNumber, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpGet("{faqId:guid}")]
    public async Task<IActionResult> GetById(Guid faqId, CancellationToken cancellationToken)
    {
        var response = await _serviceManager.FaqService.GetByIdAsync(faqId, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] FaqWriteRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _serviceManager.FaqService.CreateAsync(request, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpPut("{faqId:guid}")]
    public async Task<IActionResult> Update(
        Guid faqId,
        [FromBody] FaqWriteRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _serviceManager.FaqService.UpdateAsync(faqId, request, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }
}
