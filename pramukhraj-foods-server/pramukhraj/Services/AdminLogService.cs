using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using pramukhraj.Common;
using pramukhraj.DTOs.Logs;
using pramukhraj.Interfaces;

namespace pramukhraj.Services;

public sealed partial class AdminLogService(
    IWebHostEnvironment environment,
    ILogger<AdminLogService> logger) : IAdminLogService
{
    private static readonly Regex LogHeaderRegex = CreateLogHeaderRegex();

    [GeneratedRegex(@"^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}(?:\.\d{1,7})?(?:\s+[+-]\d{2}:\d{2})?)\s+\[([A-Z]{3,4})\](?:\s+\[(.*?)\])?\s*(.*)$", RegexOptions.Compiled)]
    private static partial Regex CreateLogHeaderRegex();

    private string LogsDirectory => Path.Combine(environment.ContentRootPath, "Logs");

    public Task<ApiResponse<IReadOnlyList<AdminLogFileInfoDto>>> GetAvailableLogFilesAsync(CancellationToken cancellationToken = default)
    {
        var list = new List<AdminLogFileInfoDto>();
        if (!Directory.Exists(LogsDirectory))
        {
            return Task.FromResult(ApiResponse<IReadOnlyList<AdminLogFileInfoDto>>.Ok(list));
        }

        var today = DateTime.UtcNow.ToString("yyyyMMdd", CultureInfo.InvariantCulture);
        var files = Directory.GetFiles(LogsDirectory, "log-*.txt");

        foreach (var file in files)
        {
            var fileName = Path.GetFileName(file);
            var match = Regex.Match(fileName, @"^log-(\d{8})\.txt$");
            if (!match.Success) continue;

            var rawDate = match.Groups[1].Value;
            var formattedDate = DateTime.TryParseExact(rawDate, "yyyyMMdd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var dt)
                ? dt.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)
                : rawDate;

            var fi = new FileInfo(file);
            list.Add(new AdminLogFileInfoDto(
                Date: formattedDate,
                FileName: fileName,
                SizeBytes: fi.Length,
                FormattedSize: FormatBytes(fi.Length),
                LastModified: fi.LastWriteTimeUtc,
                IsActive: rawDate == today
            ));
        }

        list.Sort((a, b) => string.Compare(b.Date, a.Date, StringComparison.Ordinal));
        return Task.FromResult(ApiResponse<IReadOnlyList<AdminLogFileInfoDto>>.Ok(list));
    }

    public async Task<ApiResponse<AdminLogChunkResponse>> GetLogsChunkAsync(AdminLogQueryRequest request, CancellationToken cancellationToken = default)
    {
        var availableFilesResult = await GetAvailableLogFilesAsync(cancellationToken);
        var availableFiles = availableFilesResult.Data ?? [];

        var targetDate = string.IsNullOrWhiteSpace(request.Date)
            ? (availableFiles.FirstOrDefault(x => x.IsActive)?.Date ?? availableFiles.FirstOrDefault()?.Date ?? DateTime.UtcNow.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture))
            : request.Date.Trim();

        var dateCompact = targetDate.Replace("-", string.Empty);
        var targetFileName = $"log-{dateCompact}.txt";
        var targetFilePath = Path.Combine(LogsDirectory, targetFileName);

        if (!File.Exists(targetFilePath))
        {
            return ApiResponse<AdminLogChunkResponse>.Ok(new AdminLogChunkResponse(
                Entries: [],
                NextCursor: null,
                HasMore: false,
                TotalFileSizeBytes: 0,
                SubModule: request.SubModule ?? "all",
                Date: targetDate,
                AvailableDates: availableFiles
            ));
        }

        var fileInfo = new FileInfo(targetFilePath);
        var totalSizeBytes = fileInfo.Length;
        var limit = Math.Clamp(request.Limit <= 0 ? 50 : request.Limit, 1, 200);

        var (entries, nextCursor, hasMore) = await ReadLogsBackwardsAsync(
            targetFilePath,
            totalSizeBytes,
            request.Cursor,
            limit,
            request.SubModule ?? "all",
            request.Level ?? "all",
            request.Search,
            cancellationToken);

        return ApiResponse<AdminLogChunkResponse>.Ok(new AdminLogChunkResponse(
            Entries: entries,
            NextCursor: nextCursor,
            HasMore: hasMore,
            TotalFileSizeBytes: totalSizeBytes,
            SubModule: request.SubModule ?? "all",
            Date: targetDate,
            AvailableDates: availableFiles
        ));
    }

    public async Task<ApiResponse<bool>> ClearLogsAsync(ClearLogsRequest request, CancellationToken cancellationToken = default)
    {
        var targetDate = string.IsNullOrWhiteSpace(request.Date)
            ? DateTime.UtcNow.ToString("yyyyMMdd", CultureInfo.InvariantCulture)
            : request.Date.Replace("-", string.Empty);

        var targetFileName = $"log-{targetDate}.txt";
        var targetFilePath = Path.Combine(LogsDirectory, targetFileName);

        if (!File.Exists(targetFilePath))
        {
            return ApiResponse<bool>.Ok(true, "No log file found to clear.");
        }

        try
        {
            await using (var fs = new FileStream(targetFilePath, FileMode.Truncate, FileAccess.Write, FileShare.ReadWrite))
            await using (var writer = new StreamWriter(fs, Encoding.UTF8))
            {
                var now = DateTimeOffset.Now;
                await writer.WriteLineAsync($"{now:yyyy-MM-dd HH:mm:ss.fff zzz} [INF] [pramukhraj.Services.AdminLogService] Logs cleared by administrator.");
                await writer.FlushAsync(cancellationToken);
            }

            logger.LogInformation("Log file {FileName} was truncated by admin.", targetFileName);
            return ApiResponse<bool>.Ok(true, "Log file cleared successfully.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to clear log file {FileName}.", targetFileName);
            return ApiResponse<bool>.Fail("Could not clear log file: " + ex.Message, 500);
        }
    }

    public Task<(Stream Stream, string FileName, string ContentType)?> GetLogFileStreamAsync(string? date, CancellationToken cancellationToken = default)
    {
        var targetDate = string.IsNullOrWhiteSpace(date)
            ? DateTime.UtcNow.ToString("yyyyMMdd", CultureInfo.InvariantCulture)
            : date.Replace("-", string.Empty);

        var targetFileName = $"log-{targetDate}.txt";
        var targetFilePath = Path.Combine(LogsDirectory, targetFileName);

        if (!File.Exists(targetFilePath))
        {
            return Task.FromResult<(Stream, string, string)?>(null);
        }

        var stream = new FileStream(targetFilePath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite, 4096, FileOptions.Asynchronous);
        return Task.FromResult<(Stream, string, string)?>((stream, targetFileName, "text/plain; charset=utf-8"));
    }

    private sealed record LineInfo(string Text, long StreamByteOffset);

    private static async Task<(List<AdminLogEntryDto> Entries, string? NextCursor, bool HasMore)> ReadLogsBackwardsAsync(
        string filePath,
        long fileLength,
        string? cursor,
        int limit,
        string subModuleFilter,
        string levelFilter,
        string? searchKeyword,
        CancellationToken cancellationToken)
    {
        var matched = new List<AdminLogEntryDto>();
        long currentPosition = fileLength;

        if (!string.IsNullOrWhiteSpace(cursor) && long.TryParse(cursor, NumberStyles.Integer, CultureInfo.InvariantCulture, out var parsedCursor))
        {
            currentPosition = Math.Clamp(parsedCursor, 0, fileLength);
        }

        if (currentPosition <= 0)
        {
            return (matched, null, false);
        }

        const int bufferSize = 64 * 1024; // 64 KB chunks
        string? leftoverText = null;
        var pendingDetails = new List<string>();
        long? oldestMatchedEntryOffset = null;

        await using var stream = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite, 4096, useAsync: true);

        while (currentPosition > 0 && matched.Count < limit)
        {
            cancellationToken.ThrowIfCancellationRequested();

            var bytesToRead = (int)Math.Min(bufferSize, currentPosition);
            currentPosition -= bytesToRead;
            var readStart = currentPosition;
            stream.Seek(readStart, SeekOrigin.Begin);

            var buffer = new byte[bytesToRead];
            var bytesRead = await stream.ReadAsync(buffer.AsMemory(0, bytesToRead), cancellationToken);

            var lines = new List<LineInfo>();
            var lineStart = 0;
            for (var idx = 0; idx < bytesRead; idx++)
            {
                if (buffer[idx] == (byte)'\n')
                {
                    var lineEnd = idx;
                    if (lineEnd > lineStart && buffer[lineEnd - 1] == (byte)'\r')
                    {
                        lineEnd--;
                    }
                    var text = Encoding.UTF8.GetString(buffer, lineStart, lineEnd - lineStart);
                    lines.Add(new LineInfo(text, readStart + lineStart));
                    lineStart = idx + 1;
                }
            }
            if (lineStart < bytesRead)
            {
                var text = Encoding.UTF8.GetString(buffer, lineStart, bytesRead - lineStart);
                lines.Add(new LineInfo(text, readStart + lineStart));
            }

            if (leftoverText != null && lines.Count > 0)
            {
                var last = lines[^1];
                lines[^1] = new LineInfo(last.Text + leftoverText, last.StreamByteOffset);
                leftoverText = null;
            }

            var startIndex = 0;
            if (readStart > 0 && lines.Count > 0)
            {
                leftoverText = lines[0].Text;
                startIndex = 1;
            }

            for (var i = lines.Count - 1; i >= startIndex; i--)
            {
                var lineInfo = lines[i];
                var line = lineInfo.Text;
                if (string.IsNullOrWhiteSpace(line)) continue;

                var match = LogHeaderRegex.Match(line);
                if (match.Success)
                {
                    var timestampStr = match.Groups[1].Value;
                    var rawLevel = match.Groups[2].Value;
                    var sourceContext = match.Groups[3].Success && !string.IsNullOrWhiteSpace(match.Groups[3].Value)
                        ? match.Groups[3].Value.Trim()
                        : null;
                    var message = match.Groups[4].Value;

                    var details = pendingDetails.Count > 0
                        ? string.Join(Environment.NewLine, pendingDetails)
                        : null;
                    pendingDetails.Clear();

                    var parsedTimestamp = DateTimeOffset.TryParse(timestampStr, CultureInfo.InvariantCulture, DateTimeStyles.None, out var dto)
                        ? dto
                        : DateTimeOffset.UtcNow;

                    var level = NormalizeLevel(rawLevel);
                    var isSuccess = DetectIsSuccess(level, message, details);
                    var subModule = ClassifySubModule(sourceContext, message, details);

                    if (MatchesFilter(subModule, subModuleFilter, level, isSuccess, levelFilter, message, details, sourceContext, searchKeyword))
                    {
                        oldestMatchedEntryOffset = lineInfo.StreamByteOffset;
                        var id = $"{parsedTimestamp.ToUnixTimeMilliseconds()}_{matched.Count}_{lineInfo.StreamByteOffset}";
                        var raw = string.IsNullOrEmpty(details) ? line : $"{line}{Environment.NewLine}{details}";

                        matched.Add(new AdminLogEntryDto(
                            Id: id,
                            Timestamp: parsedTimestamp,
                            Level: isSuccess && level == "Information" ? "Success" : level,
                            SourceContext: sourceContext,
                            SubModule: subModule,
                            Message: message,
                            Details: details,
                            Raw: raw,
                            IsSuccess: isSuccess
                        ));

                        if (matched.Count >= limit)
                        {
                            break;
                        }
                    }
                }
                else
                {
                    pendingDetails.Insert(0, line);
                }
            }
        }

        var nextCursor = oldestMatchedEntryOffset.HasValue && oldestMatchedEntryOffset.Value > 0
            ? oldestMatchedEntryOffset.Value.ToString(CultureInfo.InvariantCulture)
            : null;
        var hasMore = oldestMatchedEntryOffset.HasValue && oldestMatchedEntryOffset.Value > 0;

        return (matched, nextCursor, hasMore);
    }

    private static string NormalizeLevel(string raw) => raw.ToUpperInvariant() switch
    {
        "ERR" or "ERROR" => "Error",
        "FTL" or "FATAL" => "Fatal",
        "WRN" or "WARN" or "WARNING" => "Warning",
        "INF" or "INFO" or "INFORMATION" => "Information",
        "DBG" or "DEBUG" => "Debug",
        "VRB" or "VERBOSE" => "Verbose",
        _ => "Information"
    };

    private static bool DetectIsSuccess(string level, string message, string? details)
    {
        if (level != "Information") return false;
        var text = (message + " " + details).ToLowerInvariant();

        if (text.Contains("fail") || text.Contains("error") || text.Contains("exception") || text.Contains("unsuccessful") || text.Contains("rejected"))
            return false;

        return text.Contains("captured") ||
               text.Contains("succeeded") ||
               text.Contains("success") ||
               text.Contains("completed") ||
               text.Contains("verified") ||
               text.Contains("delivered") ||
               text.Contains("confirmed") ||
               text.Contains("200 ok") ||
               text.Contains("status=200") ||
               text.Contains("status 200") ||
               text.Contains(" - 200 ") ||
               text.Contains(" - 201 ");
    }

    private static string ClassifySubModule(string? sourceContext, string message, string? details)
    {
        var combined = $"{sourceContext} {message} {details}".ToLowerInvariant();

        // Check Payment
        if (combined.Contains("payment") ||
            combined.Contains("razorpay") ||
            combined.Contains("refund") ||
            combined.Contains("capture") ||
            combined.Contains("order_") ||
            combined.Contains("pay_") ||
            combined.Contains("inventoryreservation") ||
            combined.Contains("couponusage") ||
            combined.Contains("checkoutsession") ||
            combined.Contains("processpaymentoutbox"))
        {
            return "Payment";
        }

        // Check Email
        if (combined.Contains("email") ||
            combined.Contains("smtp") ||
            combined.Contains("mailkit") ||
            combined.Contains("mimekit") ||
            combined.Contains("emailtemplate") ||
            combined.Contains("emaildeliveryqueue") ||
            combined.Contains("customerotp") ||
            combined.Contains("twilio") ||
            combined.Contains("verificationchallenge"))
        {
            return "Email";
        }

        // Check Shipment
        if (combined.Contains("shipment") ||
            combined.Contains("shiprocket") ||
            combined.Contains("courier") ||
            combined.Contains("tracking") ||
            combined.Contains("awb") ||
            combined.Contains("fulfillment") ||
            combined.Contains("manifest") ||
            combined.Contains("createshiprocketorder"))
        {
            return "Shipment";
        }

        return "General";
    }

    private static bool MatchesFilter(
        string subModule,
        string subModuleFilter,
        string level,
        bool isSuccess,
        string levelFilter,
        string message,
        string? details,
        string? sourceContext,
        string? searchKeyword)
    {
        // 1. SubModule Filter
        if (!string.Equals(subModuleFilter, "all", StringComparison.OrdinalIgnoreCase))
        {
            if (!string.Equals(subModule, subModuleFilter, StringComparison.OrdinalIgnoreCase))
                return false;
        }

        // 2. Level Filter
        if (!string.Equals(levelFilter, "all", StringComparison.OrdinalIgnoreCase))
        {
            if (string.Equals(levelFilter, "success", StringComparison.OrdinalIgnoreCase))
            {
                if (!isSuccess) return false;
            }
            else if (string.Equals(levelFilter, "error", StringComparison.OrdinalIgnoreCase))
            {
                if (level != "Error" && level != "Fatal") return false;
            }
            else if (!string.Equals(level, levelFilter, StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }
        }

        // 3. Search Filter
        if (!string.IsNullOrWhiteSpace(searchKeyword))
        {
            var search = searchKeyword.Trim();
            var matchedSearch = message.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                                (details != null && details.Contains(search, StringComparison.OrdinalIgnoreCase)) ||
                                (sourceContext != null && sourceContext.Contains(search, StringComparison.OrdinalIgnoreCase));
            if (!matchedSearch) return false;
        }

        return true;
    }

    private static string FormatBytes(long bytes)
    {
        if (bytes < 1024) return $"{bytes} B";
        if (bytes < 1024 * 1024) return $"{bytes / 1024.0:F1} KB";
        if (bytes < 1024 * 1024 * 1024) return $"{bytes / (1024.0 * 1024.0):F1} MB";
        return $"{bytes / (1024.0 * 1024.0 * 1024.0):F2} GB";
    }
}
