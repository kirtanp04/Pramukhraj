using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using pramukhraj.Configurations;
using pramukhraj.Services;
using System.Text;

namespace pramukhraj.Middleware
{
    public class EncryptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly Crypto _encryptionService;
        private readonly EncryptionSettings _settings;
        private readonly ILogger<EncryptionMiddleware> _logger;

        public EncryptionMiddleware(RequestDelegate next, Crypto encryptionService, IOptions<EncryptionSettings> options, ILogger<EncryptionMiddleware> logger)
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

            _logger.LogInformation("EncryptionMiddleware: Path={Path}, Method={Method}, EncryptionEnabled={Enabled}, ApiPrefix={Prefix}", 
                path, method, _settings.Enabled, _settings.ApiPathPrefix);

            // If encryption is disabled or the request path is not an API path, skip middleware
            //if (!_settings.Enabled)
            //{
            //    _logger.LogInformation("EncryptionMiddleware: Encryption disabled, skipping");
            //    await _next(context);
            //    return;
            //}

            if (!path.StartsWith(_settings.ApiPathPrefix, System.StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogInformation("EncryptionMiddleware: Path does not match API prefix, skipping");
                await _next(context);
                return;
            }

            // 1. DECRYPT INCOMING REQUEST
            if (method == HttpMethods.Post || method == HttpMethods.Put || method == HttpMethods.Patch)
            {
                _logger.LogInformation("EncryptionMiddleware: Processing {Method} request body", method);

                try
                {
                    context.Request.EnableBuffering();

                    using var reader = new StreamReader(context.Request.Body, Encoding.UTF8, leaveOpen: true);
                    var encryptedBody = await reader.ReadToEndAsync();

                    _logger.LogInformation("EncryptionMiddleware: Encrypted body length: {Length}", encryptedBody.Length);

                    if (!string.IsNullOrWhiteSpace(encryptedBody))
                    {
                        try
                        {
                            // Clean the payload
                            encryptedBody = encryptedBody.Trim('"');
                            var decryptedBody = _encryptionService.Decrypt(encryptedBody);

                            _logger.LogInformation("EncryptionMiddleware: Decrypted body successfully, length: {Length}", decryptedBody.Length);

                            // Create the new stream with the decrypted JSON
                            var requestData = Encoding.UTF8.GetBytes(decryptedBody);
                            var decryptedStream = new MemoryStream(requestData);

                            // Replace the body
                            context.Request.Body = decryptedStream;
                            context.Request.Body.Position = 0;

                            // Update Content-Type and Content-Length
                            context.Request.Headers.Remove("Content-Length");
                            context.Request.Headers["Content-Type"] = "application/json; charset=utf-8";
                            context.Request.ContentType = "application/json; charset=utf-8";
                            context.Request.ContentLength = requestData.Length;

                            _logger.LogInformation("EncryptionMiddleware: Body replaced, proceeding to controller");
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "EncryptionMiddleware: Decryption failed");
                            context.Response.StatusCode = StatusCodes.Status400BadRequest;
                            await context.Response.WriteAsJsonAsync(new { error = "Invalid encrypted payload", details = ex.Message });
                            return;
                        }
                    }
                    else
                    {
                        _logger.LogInformation("EncryptionMiddleware: Request body is empty");
                        context.Request.Body.Position = 0;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "EncryptionMiddleware: Unexpected error during request decryption");
                    context.Response.StatusCode = StatusCodes.Status500InternalServerError;
                    await context.Response.WriteAsJsonAsync(new { error = "Encryption middleware error", details = ex.Message });
                    return;
                }
            }

            // 2. INTERCEPT OUTGOING RESPONSE
            var originalBodyStream = context.Response.Body;
            using var responseBody = new MemoryStream();
            context.Response.Body = responseBody;

            // Continue down the pipeline
            await _next(context);

            _logger.LogInformation("EncryptionMiddleware: Response status={StatusCode}", context.Response.StatusCode);

            // 3. ENCRYPT OUTGOING RESPONSE
            context.Response.Body.Seek(0, SeekOrigin.Begin);
            var plainTextResponse = await new StreamReader(context.Response.Body).ReadToEndAsync();

            if (!string.IsNullOrWhiteSpace(plainTextResponse) && context.Response.StatusCode is >= 200 and < 300)
            {
                try
                {
                    var encryptedResponse = _encryptionService.Encrypt(plainTextResponse);
                    var encryptedData = Encoding.UTF8.GetBytes($"\"{encryptedResponse}\"");

                    context.Response.ContentType = "application/json";
                    context.Response.ContentLength = encryptedData.Length;

                    await originalBodyStream.WriteAsync(encryptedData, 0, encryptedData.Length);
                    _logger.LogInformation("EncryptionMiddleware: Response encrypted successfully");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "EncryptionMiddleware: Response encryption failed");
                    await originalBodyStream.WriteAsync(Encoding.UTF8.GetBytes(plainTextResponse));
                }
            }
            else
            {
                // If the response is empty or an error, copy it back as-is
                await responseBody.CopyToAsync(originalBodyStream);
            }
        }
    }
}

