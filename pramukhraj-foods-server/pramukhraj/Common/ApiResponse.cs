using System;

namespace pramukhraj.Common
{
    /// <summary>
    /// Standard API response wrapper used across the application.
    /// </summary>
    public sealed class ApiResponse<T>
    {
        public bool Success { get; init; }
        public int StatusCode { get; init; }
        public string? Message { get; init; }
        public T? Data { get; init; }
        public object? Errors { get; init; }
        public DateTimeOffset Timestamp { get; init; } = DateTimeOffset.UtcNow;
        public string? TraceId { get; init; }

        public static ApiResponse<T> Ok(T? data, string? message = null) => new() { Success = true, StatusCode = 200, Data = data, Message = message };
        public static ApiResponse<T> Fail(string? message, int statusCode = 400, object? errors = null) => new() { Success = false, StatusCode = statusCode, Message = message, Errors = errors };
    }
}
