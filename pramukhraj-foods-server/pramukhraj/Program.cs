using pramukhraj.Extensions;
using pramukhraj.Middleware;
using Scalar.AspNetCore;
using System.Diagnostics;
using System.Linq;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

// 1. Generate OpenAPI document (replaces SwaggerGen)
builder.Services.AddOpenApi();

builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddApplication();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

app.UseStaticFiles();

// Scalar UI - only in Development
if (app.Environment.IsDevelopment())
{
    // Maps the raw openapi.json document (usually at /openapi/v1.json)
    app.MapOpenApi();

    // Maps the Scalar UI (by default at /scalar/v1)
    app.MapScalarApiReference(options =>
    {
        options.Title = "Pramukhraj API";
        // Optional: Scalar has built-in themes! 
        // options.Theme = ScalarTheme.DeepSpace; 
    });

    // Open default browser to Scalar UI when the app starts
    app.Lifetime.ApplicationStarted.Register(() =>
    {
        try
        {
            var url = app.Urls.FirstOrDefault() ?? "https://localhost:7136";

            // FIX: Changed from "/swagger" to "/scalar/v1"
            var browse = url.TrimEnd('/') + "/scalar/v1";

            var psi = new ProcessStartInfo { FileName = browse, UseShellExecute = true };
            Process.Start(psi);
        }
        catch
        {
            // ignore failures to launch browser
        }
    });
}

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseHttpsRedirection();
app.UseCors("EnterpriseCorsPolicy");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();