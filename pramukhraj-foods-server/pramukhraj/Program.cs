
using pramukhraj.Extensions;
using pramukhraj.Middleware;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

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
