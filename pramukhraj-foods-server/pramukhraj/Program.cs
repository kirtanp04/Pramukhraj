using pramukhraj.Extensions;
using pramukhraj.Middleware;
using pramukhraj.Services;
using Scalar.AspNetCore;
using Serilog;
using System.Diagnostics;
using System.IO;
using System.Linq;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

// 1. Generate OpenAPI document (replaces SwaggerGen)
builder.Services.AddOpenApi();

builder.Services.AddInfrastructure(builder.Configuration);

var encryptionKey = builder.Configuration["Encryption:Key"] ?? builder.Configuration["EncryptionKey"];
if (!string.IsNullOrEmpty(encryptionKey))
{
    builder.Services.AddSingleton(new Crypto(encryptionKey));
}
else
{
    // Register a default Crypto with a dummy key only if encryption is enabled via configuration
    // but avoid throwing here; EncryptionMiddleware will skip if disabled.
    builder.Services.AddSingleton(new Crypto("00000000000000000000000000000000"));
}

builder.Services.AddApplication();

if (builder.Environment.IsProduction())
{
    var productionOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
    if (productionOrigins.Length == 0 || productionOrigins.Any(origin =>
            !Uri.TryCreate(origin, UriKind.Absolute, out var uri)
            || uri.Scheme != Uri.UriSchemeHttps
            || uri.IsLoopback))
    {
        throw new InvalidOperationException(
            "Production Cors:AllowedOrigins must contain only explicit, non-loopback HTTPS origins.");
    }
}

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .WriteTo.Console()
    .WriteTo.File(
        path: "Logs/log-.txt",
        rollingInterval: RollingInterval.Day,
        outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] [{SourceContext}] {Message:lj}{NewLine}{Exception}",
        shared: true)
    .CreateLogger();

builder.Host.UseSerilog();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();

    app.MapScalarApiReference(options =>
    {
        options.Title = "Pramukhraj API";
    });

    app.Lifetime.ApplicationStarted.Register(() =>
    {
        try
        {
            // Pick HTTPS first, otherwise fallback to the first bound URL or default
            var url = app.Urls.FirstOrDefault(u => u.StartsWith("https://"))
                      ?? app.Urls.FirstOrDefault()
                      ?? "https://localhost:7136";

            var targetUrl = $"{url.TrimEnd('/')}/scalar/v1";

            // Launch explicitly in Microsoft Edge using Windows shell resolution
            try
            {
                Process.Start(new ProcessStartInfo
                {
                    FileName = "msedge",
                    Arguments = targetUrl,
                    UseShellExecute = true // Required for Windows App Path resolution without full path
                });
            }
            catch
            {
                // Fallback: Locate full msedge path directly if shell alias fails
                var programFiles = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);
                var programFilesX86 = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86);

                var edgePath = Path.Combine(programFilesX86, @"Microsoft\Edge\Application\msedge.exe");
                if (!File.Exists(edgePath))
                {
                    edgePath = Path.Combine(programFiles, @"Microsoft\Edge\Application\msedge.exe");
                }

                if (File.Exists(edgePath))
                {
                    Process.Start(new ProcessStartInfo
                    {
                        FileName = edgePath,
                        Arguments = targetUrl,
                        UseShellExecute = true
                    });
                }
                else
                {
                    // Final fallback: System default browser
                    Process.Start(new ProcessStartInfo
                    {
                        FileName = targetUrl,
                        UseShellExecute = true
                    });
                }
            }
        }
        catch
        {
            // Suppress background launch errors to prevent application startup failure
        }
    });
}

app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseForwardedHeaders();
if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}
app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();
app.UseCors("EnterpriseCorsPolicy");

app.UseAuthentication();
app.UseRateLimiter();
app.UseAuthorization();

// EncryptionMiddleware must come AFTER routing/authorization but BEFORE endpoint execution
app.UseMiddleware<EncryptionMiddleware>();

// Admin validation middleware - validate admin tokens and user state for /api/admin/*
app.UseMiddleware<pramukhraj.Middleware.AdminValidationMiddleware>();

app.MapControllers();

app.Run();
