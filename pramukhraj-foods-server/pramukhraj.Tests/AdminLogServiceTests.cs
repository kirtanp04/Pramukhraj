using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Logging.Abstractions;
using pramukhraj.DTOs.Logs;
using pramukhraj.Services;
using System.Text;
using Xunit;

namespace pramukhraj.Tests;

public sealed class AdminLogServiceTests : IDisposable
{
    private sealed class TestWebHostEnvironment(string rootPath) : IWebHostEnvironment
    {
        public string EnvironmentName { get; set; } = "Development";
        public string ApplicationName { get; set; } = "pramukhraj";
        public string WebRootPath { get; set; } = rootPath;
        public IFileProvider WebRootFileProvider { get; set; } = new NullFileProvider();
        public string ContentRootPath { get; set; } = rootPath;
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }

    private readonly string _tempDirectory;
    private readonly string _logsDirectory;
    private readonly AdminLogService _service;

    public AdminLogServiceTests()
    {
        _tempDirectory = Path.Combine(Path.GetTempPath(), "AdminLogServiceTests_" + Guid.NewGuid().ToString("N"));
        _logsDirectory = Path.Combine(_tempDirectory, "Logs");
        Directory.CreateDirectory(_logsDirectory);

        var env = new TestWebHostEnvironment(_tempDirectory);
        _service = new AdminLogService(env, NullLogger<AdminLogService>.Instance);
    }

    public void Dispose()
    {
        try
        {
            if (Directory.Exists(_tempDirectory))
            {
                Directory.Delete(_tempDirectory, true);
            }
        }
        catch
        {
            // Ignore temp cleanup errors
        }
    }

    [Fact]
    public async Task GetLogsChunkAsync_ParsesEntriesAndClassifiesSubModules()
    {
        var date = "20260922";
        var filePath = Path.Combine(_logsDirectory, $"log-{date}.txt");

        var sb = new StringBuilder();
        // 1. General Info
        sb.AppendLine("2026-09-22 10:00:00.100 +05:30 [INF] [pramukhraj.Services.ProductService] Product catalog refreshed.");
        // 2. Payment Success
        sb.AppendLine("2026-09-22 10:01:00.200 +05:30 [INF] [pramukhraj.Services.RazorpayPaymentService] Payment for order ORD-1001 was captured successfully.");
        // 3. Payment Error with Stack trace
        sb.AppendLine("2026-09-22 10:02:00.300 +05:30 [ERR] [pramukhraj.Services.RazorpayPaymentService] Razorpay reconciliation failed for order ORD-1002.");
        sb.AppendLine("System.InvalidOperationException: Network timeout occurred");
        sb.AppendLine("   at pramukhraj.Services.RazorpayPaymentService.ReconcilePendingAsync()");
        // 4. Email Success
        sb.AppendLine("2026-09-22 10:03:00.400 +05:30 [INF] [pramukhraj.Services.SmtpEmailService] Order confirmation email sent successfully to user@example.com.");
        // 5. Shipment Warning
        sb.AppendLine("2026-09-22 10:04:00.500 +05:30 [WRN] [pramukhraj.Services.ShiprocketRateService] Shiprocket courier serviceability timeout for pincode 380001.");

        await File.WriteAllTextAsync(filePath, sb.ToString());

        // Test All Logs
        var allResult = await _service.GetLogsChunkAsync(new AdminLogQueryRequest(SubModule: "all", Date: "2026-09-22", Limit: 10));
        Assert.NotNull(allResult.Data);
        Assert.Equal(5, allResult.Data.Entries.Count);

        // Check reverse order: newest first!
        Assert.Contains("Shiprocket", allResult.Data.Entries[0].Message);
        Assert.Equal("Shipment", allResult.Data.Entries[0].SubModule);
        Assert.Equal("Warning", allResult.Data.Entries[0].Level);

        // Test Payment sub-module filter
        var paymentResult = await _service.GetLogsChunkAsync(new AdminLogQueryRequest(SubModule: "payment", Date: "2026-09-22", Limit: 10));
        Assert.NotNull(paymentResult.Data);
        Assert.Equal(2, paymentResult.Data.Entries.Count);
        Assert.All(paymentResult.Data.Entries, e => Assert.Equal("Payment", e.SubModule));

        // Test Payment error entry with multiline details
        var errorEntry = paymentResult.Data.Entries.First(e => e.Level == "Error");
        Assert.NotNull(errorEntry.Details);
        Assert.Contains("System.InvalidOperationException", errorEntry.Details);

        // Test Payment success entry
        var successEntry = paymentResult.Data.Entries.First(e => e.IsSuccess);
        Assert.Equal("Success", successEntry.Level);
        Assert.Contains("captured successfully", successEntry.Message);

        // Test Email sub-module filter
        var emailResult = await _service.GetLogsChunkAsync(new AdminLogQueryRequest(SubModule: "email", Date: "2026-09-22", Limit: 10));
        Assert.NotNull(emailResult.Data);
        Assert.Single(emailResult.Data.Entries);
        Assert.Equal("Email", emailResult.Data.Entries[0].SubModule);
        Assert.True(emailResult.Data.Entries[0].IsSuccess);

        // Test Shipment sub-module filter
        var shipmentResult = await _service.GetLogsChunkAsync(new AdminLogQueryRequest(SubModule: "shipment", Date: "2026-09-22", Limit: 10));
        Assert.NotNull(shipmentResult.Data);
        Assert.Single(shipmentResult.Data.Entries);
        Assert.Equal("Shipment", shipmentResult.Data.Entries[0].SubModule);
    }

    [Fact]
    public async Task GetLogsChunkAsync_ChunkingAndPagination_ReturnsNextCursor()
    {
        var date = "20260922";
        var filePath = Path.Combine(_logsDirectory, $"log-{date}.txt");

        var sb = new StringBuilder();
        for (var i = 1; i <= 30; i++)
        {
            sb.AppendLine($"2026-09-22 12:{i:D2}:00.000 +05:30 [INF] [pramukhraj.Services.OrderService] Processing order attempt #{i}");
        }
        await File.WriteAllTextAsync(filePath, sb.ToString());

        // First chunk of 10
        var chunk1 = await _service.GetLogsChunkAsync(new AdminLogQueryRequest(SubModule: "all", Date: "2026-09-22", Limit: 10));
        Assert.NotNull(chunk1.Data);
        Assert.Equal(10, chunk1.Data.Entries.Count);
        Assert.Contains("#30", chunk1.Data.Entries[0].Message); // Newest first
        Assert.Contains("#21", chunk1.Data.Entries[^1].Message);
        Assert.True(chunk1.Data.HasMore);
        Assert.NotNull(chunk1.Data.NextCursor);

        // Second chunk of 10 using cursor
        var chunk2 = await _service.GetLogsChunkAsync(new AdminLogQueryRequest(SubModule: "all", Date: "2026-09-22", Cursor: chunk1.Data.NextCursor, Limit: 10));
        Assert.NotNull(chunk2.Data);
        Assert.Equal(10, chunk2.Data.Entries.Count);
        Assert.Contains("#20", chunk2.Data.Entries[0].Message);
        Assert.Contains("#11", chunk2.Data.Entries[^1].Message);
    }

    [Fact]
    public async Task ClearLogsAsync_TruncatesFileAndWritesNotice()
    {
        var date = "20260922";
        var filePath = Path.Combine(_logsDirectory, $"log-{date}.txt");

        var sb = new StringBuilder();
        for (var i = 1; i <= 50; i++)
        {
            sb.AppendLine($"2026-09-22 12:00:{i:D2}.000 +05:30 [INF] Test line {i}");
        }
        await File.WriteAllTextAsync(filePath, sb.ToString());
        var initialSize = new FileInfo(filePath).Length;
        Assert.True(initialSize > 500);

        var clearResult = await _service.ClearLogsAsync(new ClearLogsRequest(Date: "2026-09-22"));
        Assert.True(clearResult.Success);

        var newSize = new FileInfo(filePath).Length;
        Assert.True(newSize < initialSize);

        var content = await File.ReadAllTextAsync(filePath);
        Assert.Contains("Logs cleared by administrator", content);
    }
}

