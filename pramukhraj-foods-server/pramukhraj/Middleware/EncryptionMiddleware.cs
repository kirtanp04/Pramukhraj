using Microsoft.Extensions.Options;
using pramukhraj.Configurations;
using pramukhraj.Services;
using System.Text;
using System.Text.Json;

namespace pramukhraj.Middleware
{
    public sealed class EncryptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly Crypto _encryptionService;
        private readonly EncryptionSettings _settings;
        private readonly ILogger<EncryptionMiddleware> _logger;

        public EncryptionMiddleware(
            RequestDelegate next,
            Crypto encryptionService,
            IOptions<EncryptionSettings> options,
            ILogger<EncryptionMiddleware> logger)
        {
            _next = next;
            _encryptionService = encryptionService;
            _settings = options?.Value ?? new EncryptionSettings();
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var path = context.Request.Path.Value ?? string.Empty;
            var method = context.Request.Method;

            // SSE must remain an unbuffered text stream. Authentication and
            // authorization still run for this narrowly scoped admin endpoint.
            if (path.Equals("/api/admin/notifications/stream", StringComparison.OrdinalIgnoreCase) ||
                path.Equals("/api/webhooks/razorpay", StringComparison.OrdinalIgnoreCase)||
                path.Equals("/api/webhooks/shipping", StringComparison.OrdinalIgnoreCase) ||
                path.StartsWith("/api/admin/sales/export", StringComparison.OrdinalIgnoreCase) ||
                path.StartsWith("/api/admin/logs/download", StringComparison.OrdinalIgnoreCase))
            {
                await _next(context);
                return;
            }

            // Check if endpoint is decorated with [SkipEncryption]
            var endpoint = context.GetEndpoint();
            if (endpoint?.Metadata.GetMetadata<pramukhraj.Common.SkipEncryptionAttribute>() != null)
            {
                await _next(context);
                return;
            }

            _logger.LogInformation(
                "EncryptionMiddleware: Path={Path}, Method={Method}, EncryptionEnabled={Enabled}, ApiPrefix={Prefix}",
                path,
                method,
                _settings.Enabled,
                _settings.ApiPathPrefix);

            // Skip encryption when disabled or path is not an API path.
            //if (!_settings.Enabled ||
            //    !path.StartsWith(
            //        _settings.ApiPathPrefix,
            //        StringComparison.OrdinalIgnoreCase))
            //{
            //    await _next(context);
            //    return;
            //}

            // 1. Decrypt incoming request.
            if (HttpMethods.IsPost(method) ||
                HttpMethods.IsPut(method) ||
                HttpMethods.IsPatch(method))
            {
                var requestIsValid = await DecryptRequestAsync(context);

                if (!requestIsValid)
                {
                    return;
                }
            }

            // 2. Intercept outgoing response.
            var originalBodyStream = context.Response.Body;

            await using var responseBody = new MemoryStream();
            context.Response.Body = responseBody;

            try
            {
                await _next(context);

                _logger.LogInformation(
                    "EncryptionMiddleware: Response status={StatusCode}",
                    context.Response.StatusCode);

                // Read captured response.
                responseBody.Seek(0, SeekOrigin.Begin);

                using var reader = new StreamReader(
                    responseBody,
                    Encoding.UTF8,
                    detectEncodingFromByteOrderMarks: false,
                    leaveOpen: true);

                var plainTextResponse =
                    await reader.ReadToEndAsync(context.RequestAborted);

                // Check if the response is a file download or non-JSON binary/text stream
                var contentType = context.Response.ContentType ?? string.Empty;
                var isFileOrNonJson = context.Response.Headers.ContentDisposition.Count > 0 ||
                                     contentType.StartsWith("text/csv", StringComparison.OrdinalIgnoreCase) ||
                                     contentType.StartsWith("application/vnd.", StringComparison.OrdinalIgnoreCase) ||
                                     contentType.StartsWith("application/octet-stream", StringComparison.OrdinalIgnoreCase) ||
                                     contentType.StartsWith("application/pdf", StringComparison.OrdinalIgnoreCase);

                // Encrypt only successful JSON responses.
                if (!isFileOrNonJson &&
                    !string.IsNullOrWhiteSpace(plainTextResponse) &&
                    context.Response.StatusCode is >= 200 and < 300)
                {
                    await WriteEncryptedResponseAsync(
                        context,
                        originalBodyStream,
                        plainTextResponse);
                }
                else
                {
                    // Important: reset position because ReadToEndAsync()
                    // leaves the stream position at the end.
                    responseBody.Seek(0, SeekOrigin.Begin);

                    context.Response.ContentLength = responseBody.Length;

                    await responseBody.CopyToAsync(
                        originalBodyStream,
                        context.RequestAborted);
                }
            }
            finally
            {
                context.Response.Body = originalBodyStream;
            }
        }

        private async Task<bool> DecryptRequestAsync(HttpContext context)
        {
            try
            {
                context.Request.EnableBuffering();

                using var reader = new StreamReader(
                    context.Request.Body,
                    Encoding.UTF8,
                    detectEncodingFromByteOrderMarks: false,
                    leaveOpen: true);

                var requestBody =
                    await reader.ReadToEndAsync(context.RequestAborted);

                if (string.IsNullOrWhiteSpace(requestBody))
                {
                    context.Request.Body.Position = 0;
                    return true;
                }

                try
                {
                    // Axios may send the encrypted value as a JSON string.
                    var encryptedPayload = TryReadJsonString(requestBody);

                    var decryptedBody =
                        _encryptionService.Decrypt(encryptedPayload);

                    var requestData = Encoding.UTF8.GetBytes(decryptedBody);

                    context.Request.Body = new MemoryStream(requestData);
                    context.Request.ContentType =
                        "application/json; charset=utf-8";
                    context.Request.ContentLength = requestData.Length;
                    context.Request.Body.Position = 0;

                    return true;
                }
                catch (Exception exception)
                {
                    _logger.LogWarning(
                        exception,
                        "EncryptionMiddleware: Invalid encrypted request.");

                    await WriteErrorAsync(
                        context,
                        StatusCodes.Status400BadRequest,
                        "Invalid encrypted payload.");

                    return false;
                }
            }
            catch (Exception exception)
            {
                _logger.LogError(
                    exception,
                    "EncryptionMiddleware: Request decryption failed.");

                await WriteErrorAsync(
                    context,
                    StatusCodes.Status500InternalServerError,
                    "Unable to process the encrypted request.");

                return false;
            }
        }

        private async Task WriteEncryptedResponseAsync(
            HttpContext context,
            Stream originalBodyStream,
            string plainTextResponse)
        {
            try
            {
                var encryptedResponse =
                    _encryptionService.Encrypt(plainTextResponse);

                // Serialize it properly as a JSON string instead of
                // manually adding quotation marks.
                var encryptedJson =
                    JsonSerializer.Serialize(encryptedResponse);

                var encryptedData =
                    Encoding.UTF8.GetBytes(encryptedJson);

                context.Response.ContentType =
                    "application/json; charset=utf-8";
                context.Response.ContentLength = encryptedData.Length;

                await originalBodyStream.WriteAsync(
                    encryptedData,
                    context.RequestAborted);

                _logger.LogInformation(
                    "EncryptionMiddleware: Response encrypted successfully.");
            }
            catch (Exception exception)
            {
                _logger.LogError(
                    exception,
                    "EncryptionMiddleware: Response encryption failed.");

                var plainData =
                    Encoding.UTF8.GetBytes(plainTextResponse);

                context.Response.ContentLength = plainData.Length;

                await originalBodyStream.WriteAsync(
                    plainData,
                    context.RequestAborted);
            }
        }

        private static string TryReadJsonString(string requestBody)
        {
            try
            {
                return JsonSerializer.Deserialize<string>(requestBody)
                       ?? requestBody.Trim();
            }
            catch (JsonException)
            {
                return requestBody.Trim().Trim('"');
            }
        }

        private static async Task WriteErrorAsync(
            HttpContext context,
            int statusCode,
            string message)
        {
            context.Response.StatusCode = statusCode;

            await context.Response.WriteAsJsonAsync(
                new
                {
                    success = false,
                    message,
                    statusCode
                },
                cancellationToken: context.RequestAborted);
        }
    }
}
