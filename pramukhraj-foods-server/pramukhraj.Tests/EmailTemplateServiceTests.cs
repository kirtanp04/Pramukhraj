using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using pramukhraj.Database;
using pramukhraj.Entities.EmailTemplates;
using pramukhraj.Services;
using Xunit;

namespace pramukhraj.Tests;

public sealed class EmailTemplateServiceTests
{
    [Fact]
    public async Task RenderActive_encodes_html_variables_and_keeps_plain_text_readable()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        var options = new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options;
        await using var db = new AppDbContext(options);
        await db.Database.EnsureCreatedAsync();
        db.EmailTemplates.Add(new EmailTemplate
        {
            Id = Guid.NewGuid(), Key = EmailTemplateKeys.Welcome, Name = "Welcome",
            Category = EmailTemplateCategory.Account, Subject = "Welcome {{customer_name}}",
            DesignJson = "{\"body\":{},\"counters\":{}}",
            HtmlContent = "<h1>Hello {{customer_name}}</h1>",
            PlainTextContent = "Hello {{customer_name}}", VariablesJson = "[\"customer_name\"]",
            AttachmentsJson = "[]", IsActive = true, CreatedOn = DateTime.UtcNow, UpdatedOn = DateTime.UtcNow
        });
        await db.SaveChangesAsync();
        var service = new EmailTemplateService(db, null!, null!, NullLogger<EmailTemplateService>.Instance);

        var rendered = await service.RenderActiveAsync(EmailTemplateKeys.Welcome,
            new Dictionary<string, string?> { ["customer_name"] = "<Admin>" });

        Assert.NotNull(rendered);
        Assert.Contains("&lt;Admin&gt;", rendered.HtmlContent);
        Assert.Contains("<Admin>", rendered.PlainTextContent);
    }
}
