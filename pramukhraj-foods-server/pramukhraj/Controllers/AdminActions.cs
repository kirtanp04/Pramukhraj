using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using pramukhraj.Common;
using pramukhraj.Database;
using pramukhraj.Interfaces;
using pramukhraj.Services;
using System.Data.Common;
using static pramukhraj.DTOs.AdminActions.AdminActionRequestResponse;

namespace pramukhraj.Controllers
{
    [Route("api/admin")]
    [ApiController]
    [EnableRateLimiting("rate-limit")]
    public class AdminActions : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly ILogger<ProductService> _logger;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public AdminActions(AppDbContext db, ILogger<ProductService> logger, IHttpContextAccessor httpContextAccessor)
        {
            _db = db;
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
        }

        [HttpGet("get-admin-actions")]
        [Authorize]
        public async Task<IActionResult> GetAdminActions(
        [FromQuery] int pageNumber = 1,
        CancellationToken cancellationToken = default)
        {
            if (pageNumber < 1)
            {
                return BadRequest(new ApiResponse<List<AdminActionResponse>>
                {
                    StatusCode = StatusCodes.Status400BadRequest,
                    Success = false,
                    Message = "Invalid page number.",
                    Errors = "Page number must be greater than zero."
                });
            }

            int pageSize = 30;

            try
            {
                var query = _db.AdminActions
                    .AsNoTracking();

                var totalCount = await query.CountAsync(cancellationToken);

                var actions = await query
                    .OrderByDescending(action => action.CreatedOn)
                    .ThenByDescending(action => action.Id)
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .Select(action => new AdminActionResponse
                    {
                        Id = action.Id,
                        AdminId = action.AdminId,
                        AdminName = action.AdminName,
                        Module = action.Module,
                        Action = action.Action,
                        EntityId = action.EntityId,
                        EntityName = action.EntityName ?? "",
                        Description = action.Description ?? "",
                        CreatedOn  = action.CreatedOn.AddMinutes(-Common.Common.GetTimeZone(_httpContextAccessor)).ToString("yyyy-MM-dd HH:mm:ss")
                    })
                    .ToListAsync(cancellationToken);

                var response = new ApiResponse<List<AdminActionResponse>>
                {
                    StatusCode = StatusCodes.Status200OK,
                    Success = true,
                    Message = actions.Count > 0
                        ? "Admin actions retrieved successfully."
                        : "No admin actions were found.",
                    Data = actions

                };

                return Ok(response);
            }
            catch (OperationCanceledException)
                when (cancellationToken.IsCancellationRequested)
            {
                _logger.LogInformation(
                    "The admin-actions request was cancelled.");

                // Preserve ASP.NET Core request-cancellation behavior.
                throw;
            }
            catch (DbException exception)
            {
                _logger.LogError(
                    exception,
                    "A database error occurred while retrieving admin actions.");

                var response = new ApiResponse<List<AdminActionResponse>>
                {
                    StatusCode = StatusCodes.Status500InternalServerError,
                    Success = false,
                    Message = "Unable to retrieve admin actions.",
                    Errors = "A database error occurred. Please try again later."
                };

                return StatusCode(response.StatusCode, response);
            }
            catch (Exception exception)
            {
                _logger.LogError(
                    exception,
                    "An unexpected error occurred while retrieving admin actions.");

                var response = new ApiResponse<List<AdminActionResponse>>
                {
                    StatusCode = StatusCodes.Status500InternalServerError,
                    Success = false,
                    Message = "Unable to retrieve admin actions.",
                    Errors = "An unexpected error occurred. Please try again later."
                };

                return StatusCode(response.StatusCode, response);
            }
        }
    }
}
