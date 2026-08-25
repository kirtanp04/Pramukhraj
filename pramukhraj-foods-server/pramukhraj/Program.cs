using pramukhraj.Extensions;
using pramukhraj.Middleware;
using pramukhraj.Services;
using Scalar.AspNetCore;
using System.Diagnostics;
using System.Linq;
using System.IO;

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

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

app.UseStaticFiles();


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
            var url = app.Urls.FirstOrDefault() ?? "https://localhost:7136";
            var browse = url.TrimEnd('/') + "/scalar/v1";

            // PID file to remember browser process launched by this app
            var pidFile = Path.Combine(AppContext.BaseDirectory, "scalar_browser.pid");

            // If PID file exists, try to kill previous process launched by this app
            try
            {
                if (File.Exists(pidFile))
                {
                    var txt = File.ReadAllText(pidFile);
                    if (int.TryParse(txt, out var oldPid))
                    {
                        try
                        {
                            var oldProc = Process.GetProcessById(oldPid);
                            if (!oldProc.HasExited)
                            {
                                oldProc.Kill(true);
                                oldProc.WaitForExit(2000);
                            }
                        }
                        catch
                        {
                            // ignore any errors when killing
                        }
                    }

                    try { File.Delete(pidFile); } catch { }
                }
            }
            catch
            {
                // ignore
            }

            // Try to start Microsoft Edge specifically
            try
            {
                var psi = new ProcessStartInfo
                {
                    FileName = "msedge",
                    Arguments = browse,
                    UseShellExecute = false
                };

                var proc = Process.Start(psi);
                if (proc != null)
                {
                    try { File.WriteAllText(pidFile, proc.Id.ToString()); } catch { }
                }
                else
                {
                    // Fallback: use protocol which launches default browser (will not guarantee Edge)
                    Process.Start(new ProcessStartInfo { FileName = browse, UseShellExecute = true });
                }
            }
            catch
            {
                // final fallback: use default shell to open url
                try { Process.Start(new ProcessStartInfo { FileName = browse, UseShellExecute = true }); } catch { }
            }
        }
        catch
        {

        }
    });
}

app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseHttpsRedirection();
app.UseCors("EnterpriseCorsPolicy");

app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

// EncryptionMiddleware must come AFTER routing/authorization but BEFORE endpoint execution
app.UseMiddleware<EncryptionMiddleware>();

// Admin validation middleware - validate admin tokens and user state for /api/admin/*
app.UseMiddleware<pramukhraj.Middleware.AdminValidationMiddleware>();

app.MapControllers();

app.Run();