using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using pramukhraj.Common;
using pramukhraj.DTOs.CacheMetrics;
using pramukhraj.Interfaces;

namespace pramukhraj.Controllers;

[ApiController]
[Route("api/admin/cache-metrics")]
[Authorize(Roles = "Admin")]
[EnableRateLimiting("rate-limit")]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public sealed class AdminCacheMetricsController : ControllerBase
{
    private readonly ICacheService _cacheService;

    public AdminCacheMetricsController(ICacheService cacheService)
    {
        _cacheService = cacheService;
    }

    [HttpGet]
    public IActionResult Get()
    {
        return Ok(ApiResponse<CacheMetricsResponse>.Ok(
            _cacheService.GetMetrics(),
            "Cache metrics retrieved successfully."));
    }

    [HttpDelete]
    public IActionResult ClearAll()
    {
        var count = _cacheService.Clear("Entire cache cleared from the Cache Metrics dashboard");
        return Ok(ApiResponse<CacheInvalidationResponse>.Ok(
            new CacheInvalidationResponse
            {
                Scope = "All",
                InvalidatedEntries = count
            },
            $"Cleared {count} cache {(count == 1 ? "entry" : "entries")}."));
    }

    [HttpDelete("key")]
    public IActionResult ClearByKey([FromQuery] string? key)
    {
        if (string.IsNullOrWhiteSpace(key) || key.Length > 1_000)
        {
            return BadRequest(ApiResponse<CacheInvalidationResponse>.Fail(
                "A valid cache key is required.",
                StatusCodes.Status400BadRequest));
        }

        var removed = _cacheService.InvalidateKey(
            key,
            $"Key cleared from the Cache Metrics dashboard: {key}");
        if (!removed)
        {
            return NotFound(ApiResponse<CacheInvalidationResponse>.Fail(
                "The cache key is no longer active.",
                StatusCodes.Status404NotFound));
        }

        return Ok(ApiResponse<CacheInvalidationResponse>.Ok(
            new CacheInvalidationResponse
            {
                Scope = "Key",
                Target = key,
                InvalidatedEntries = 1
            },
            "Cache key cleared successfully."));
    }

    [HttpDelete("module")]
    public IActionResult ClearByModule([FromQuery] string? module)
    {
        if (string.IsNullOrWhiteSpace(module) || module.Length > 100)
        {
            return BadRequest(ApiResponse<CacheInvalidationResponse>.Fail(
                "A valid cache module is required.",
                StatusCodes.Status400BadRequest));
        }

        var normalizedModule = module.Trim();
        var count = _cacheService.InvalidateModule(
            normalizedModule,
            $"Module cleared from the Cache Metrics dashboard: {normalizedModule}");
        if (count == 0)
        {
            return NotFound(ApiResponse<CacheInvalidationResponse>.Fail(
                "The cache module has no active entries.",
                StatusCodes.Status404NotFound));
        }

        return Ok(ApiResponse<CacheInvalidationResponse>.Ok(
            new CacheInvalidationResponse
            {
                Scope = "Module",
                Target = normalizedModule,
                InvalidatedEntries = count
            },
            $"Cleared {count} cache {(count == 1 ? "entry" : "entries")} from {normalizedModule}."));
    }
}
