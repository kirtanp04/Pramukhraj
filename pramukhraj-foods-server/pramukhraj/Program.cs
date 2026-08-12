using pramukhraj.Extensions;
using pramukhraj.Middleware;
using pramukhraj.Services;
using Scalar.AspNetCore;
using System.Diagnostics;
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

            var psi = new ProcessStartInfo { FileName = browse, UseShellExecute = true };
            Process.Start(psi);
        }
        catch
        {

        }
    });
}

app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseHttpsRedirection();
app.UseCors("EnterpriseCorsPolicy");
app.UseAuthentication();
app.UseAuthorization();

// EncryptionMiddleware must come AFTER routing/authorization but BEFORE endpoint execution
app.UseMiddleware<EncryptionMiddleware>();

// Admin validation middleware - validate admin tokens and user state for /api/admin/*
app.UseMiddleware<pramukhraj.Middleware.AdminValidationMiddleware>();

app.MapControllers();

app.Run();