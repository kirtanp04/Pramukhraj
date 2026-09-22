using pramukhraj.Common;
using pramukhraj.DTOs.Logs;

namespace pramukhraj.Interfaces;

public interface IAdminLogService
{
    Task<ApiResponse<AdminLogChunkResponse>> GetLogsChunkAsync(AdminLogQueryRequest request, CancellationToken cancellationToken = default);
    Task<ApiResponse<IReadOnlyList<AdminLogFileInfoDto>>> GetAvailableLogFilesAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> ClearLogsAsync(ClearLogsRequest request, CancellationToken cancellationToken = default);
    Task<(Stream Stream, string FileName, string ContentType)?> GetLogFileStreamAsync(string? date, CancellationToken cancellationToken = default);
}

