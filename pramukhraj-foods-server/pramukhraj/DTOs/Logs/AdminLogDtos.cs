namespace pramukhraj.DTOs.Logs;

public sealed record AdminLogEntryDto(
    string Id,
    DateTimeOffset Timestamp,
    string Level,
    string? SourceContext,
    string SubModule,
    string Message,
    string? Details,
    string Raw,
    bool IsSuccess
);

public sealed record AdminLogFileInfoDto(
    string Date,
    string FileName,
    long SizeBytes,
    string FormattedSize,
    DateTime LastModified,
    bool IsActive
);

public sealed record AdminLogChunkResponse(
    IReadOnlyList<AdminLogEntryDto> Entries,
    string? NextCursor,
    bool HasMore,
    long TotalFileSizeBytes,
    string SubModule,
    string Date,
    IReadOnlyList<AdminLogFileInfoDto> AvailableDates
);

public sealed record AdminLogQueryRequest(
    string? SubModule = "all",
    string? Date = null,
    string? Cursor = null,
    int Limit = 50,
    string? Level = "all",
    string? Search = null
);

public sealed record ClearLogsRequest(
    string? Date = null,
    string? SubModule = null
);

