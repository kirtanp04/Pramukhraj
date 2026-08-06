
using pramukhraj.Extensions;
using pramukhraj.Middleware;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

// Add infrastructure and application services (DbContext, Identity, JWT, AutoMapper, FluentValidation, Serilog, etc.)
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddApplication();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseHttpsRedirection();
app.UseCors("EnterpriseCorsPolicy");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
