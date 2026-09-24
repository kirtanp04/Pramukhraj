using System.Text;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using pramukhraj.Database;
using pramukhraj.DTOs.Sales;
using pramukhraj.Entities.Customer;
using pramukhraj.Entities.Order;
using pramukhraj.Entities.Product;
using pramukhraj.Entities.Return;
using pramukhraj.Interfaces;
using pramukhraj.Services;
using Xunit;

namespace pramukhraj.Tests;

public sealed class AdminSalesServiceTests
{
    [Fact]
    public async Task GetSalesReportAsync_calculates_summary_metrics_correctly()
    {
        await using var fixture = await AdminSalesServiceFixture.CreateAsync();

        var customerA = CreateCustomer("Customer One", "+919876543210");
        var customerB = CreateCustomer("Customer Two", "+919876543211");
        fixture.Db.Customers.AddRange(customerA, customerB);

        var now = DateTime.UtcNow;

        // Order 1: Confirmed, 2 items, shipping 50, fee 15, item discount 20, coupon discount 30
        var order1 = CreateOrder(customerA.Id, "ORD-001", OrderStatus.Confirmed, 1000m, now.AddDays(-2));
        order1.ItemDiscountAmount = 20m;
        order1.CouponDiscountAmount = 30m;
        order1.ShippingAmount = 50m;
        order1.PaymentServiceTaxAmount = 15m;
        order1.CouponCode = "WELCOME10";

        var item1 = CreateOrderItem(order1.Id, "Product A", "SKU-A", 2, 500m);
        order1.Items.Add(item1);

        // Order 2: Confirmed, by Customer A again (repeat customer test)
        var order2 = CreateOrder(customerA.Id, "ORD-002", OrderStatus.Confirmed, 500m, now.AddDays(-1));
        order2.ShippingAmount = 40m;
        order2.PaymentServiceTaxAmount = 10m;
        var item2 = CreateOrderItem(order2.Id, "Product B", "SKU-B", 1, 500m);
        order2.Items.Add(item2);

        // Order 3: Cancelled order (should be excluded when status is Confirmed)
        var order3 = CreateOrder(customerB.Id, "ORD-003", OrderStatus.Cancelled, 300m, now.AddDays(-1));
        var item3 = CreateOrderItem(order3.Id, "Product C", "SKU-C", 1, 300m);
        order3.Items.Add(item3);

        fixture.Db.Orders.AddRange(order1, order2, order3);
        await fixture.Db.SaveChangesAsync();

        var request = new AdminSalesReportRequest(
            StartDate: now.AddDays(-5),
            EndDate: now,
            Status: "Confirmed",
            Granularity: "day"
        );

        var response = await fixture.Service.GetSalesReportAsync(request);

        Assert.True(response.Success);
        Assert.NotNull(response.Data);

        var summary = response.Data.Summary;
        // Total confirmed orders: 2 (order1 + order2 = 1000 + 500 = 1500)
        Assert.Equal(2, summary.TotalOrders);
        Assert.Equal(1500m, summary.NetRevenue);
        Assert.Equal(750m, summary.AverageOrderValue);
        Assert.Equal(3, summary.TotalItemsSold); // 2 + 1
        Assert.Equal(20m, summary.ItemDiscounts);
        Assert.Equal(30m, summary.CouponDiscounts);
        Assert.Equal(50m, summary.TotalDiscounts);
        Assert.Equal(90m, summary.ShippingFeesCollected);
        Assert.Equal(25m, summary.PaymentProcessingFeesCollected);
        // Repeat customer: 1 customer ordered twice out of 1 distinct customer = 100%
        Assert.Equal(100m, summary.RepeatCustomerRatePercent);

        // Timeline check
        Assert.NotEmpty(response.Data.Timeline);

        // Coupons check
        Assert.Single(response.Data.CouponSales);
        Assert.Equal("WELCOME10", response.Data.CouponSales[0].CouponCode);
        Assert.Equal(30m, response.Data.CouponSales[0].TotalDiscountAmount);
    }

    [Fact]
    public async Task GetSalesReportAsync_filters_all_statuses_when_requested()
    {
        await using var fixture = await AdminSalesServiceFixture.CreateAsync();
        var customer = CreateCustomer("Test User", "+919999999999");
        fixture.Db.Customers.Add(customer);

        var now = DateTime.UtcNow;
        var order1 = CreateOrder(customer.Id, "ORD-101", OrderStatus.Confirmed, 600m, now.AddDays(-2));
        var order2 = CreateOrder(customer.Id, "ORD-102", OrderStatus.Cancelled, 400m, now.AddDays(-1));
        fixture.Db.Orders.AddRange(order1, order2);
        await fixture.Db.SaveChangesAsync();

        var request = new AdminSalesReportRequest(
            StartDate: now.AddDays(-5),
            EndDate: now,
            Status: "all",
            Granularity: "day"
        );

        var response = await fixture.Service.GetSalesReportAsync(request);

        Assert.True(response.Success);
        Assert.NotNull(response.Data);
        Assert.Equal(2, response.Data.Summary.TotalOrders);
        Assert.Equal(1000m, response.Data.Summary.NetRevenue);
    }

    [Fact]
    public async Task ExportSalesReportCsvAsync_generates_valid_csv_stream()
    {
        await using var fixture = await AdminSalesServiceFixture.CreateAsync();
        var customer = CreateCustomer("CSV Customer", "+919888877777");
        fixture.Db.Customers.Add(customer);

        var now = DateTime.UtcNow;
        var order = CreateOrder(customer.Id, "ORD-CSV-1", OrderStatus.Confirmed, 1200m, now.AddDays(-1));
        var item = CreateOrderItem(order.Id, "Spicy Sev", "SKU-SEV", 3, 400m);
        order.Items.Add(item);

        var addr = new OrderAddress
        {
            Id = Guid.NewGuid(),
            OrderId = order.Id,
            Type = "Shipping",
            State = "Gujarat",
            City = "Ahmedabad",
            AddressLine1 = "123 Main St",
            PostalCode = "380001",
            RecipientName = "CSV Customer",
            MobileNumber = "+919888877777"
        };
        order.Addresses.Add(addr);

        fixture.Db.Orders.Add(order);
        await fixture.Db.SaveChangesAsync();

        var request = new AdminSalesReportRequest(
            StartDate: now.AddDays(-7),
            EndDate: now,
            Status: "Confirmed",
            Granularity: "day"
        );

        var (csvBytes, fileName) = await fixture.Service.ExportSalesReportCsvAsync(request);

        Assert.NotEmpty(csvBytes);
        Assert.StartsWith("SalesReport_", fileName);
        Assert.EndsWith(".csv", fileName);

        var csvText = System.Text.Encoding.UTF8.GetString(csvBytes);
        Assert.Contains("SALES REPORT SUMMARY", csvText);
        Assert.Contains("Net Revenue", csvText);
        Assert.Contains("SALES LEDGER OVER TIME", csvText);
        Assert.Contains("SALES BY PRODUCT", csvText);
        Assert.Contains("Spicy Sev", csvText);
        Assert.Contains("SALES BY STATE / REGION", csvText);
        Assert.Contains("Gujarat", csvText);
    }

    [Fact]
    public async Task GetSalesReportAsync_caches_report_and_serves_from_cache_on_repeat()
    {
        await using var fixture = await AdminSalesServiceFixture.CreateAsync();
        var customer = CreateCustomer("Cache Customer", "+919123456780");
        fixture.Db.Customers.Add(customer);

        var now = DateTime.UtcNow;
        var order = CreateOrder(customer.Id, "ORD-CACHE-1", OrderStatus.Confirmed, 750m, now.AddDays(-1));
        var item = CreateOrderItem(order.Id, "Chorafali", "SKU-CHOR", 2, 375m);
        order.Items.Add(item);
        fixture.Db.Orders.Add(order);
        await fixture.Db.SaveChangesAsync();

        var request = new AdminSalesReportRequest(
            StartDate: now.AddDays(-5),
            EndDate: now,
            Status: "Confirmed",
            Granularity: "day",
            Refresh: false
        );

        // First call: Populates cache (Cache miss)
        var firstResponse = await fixture.Service.GetSalesReportAsync(request);
        Assert.True(firstResponse.Success);
        Assert.NotNull(firstResponse.Data);
        Assert.Equal(750m, firstResponse.Data.Summary.NetRevenue);

        // Second call: Should return from cache (Cache hit)
        var secondResponse = await fixture.Service.GetSalesReportAsync(request);
        Assert.True(secondResponse.Success);
        Assert.NotNull(secondResponse.Data);
        Assert.Equal(750m, secondResponse.Data.Summary.NetRevenue);
        Assert.Contains("from cache", secondResponse.Message, StringComparison.OrdinalIgnoreCase);

        // Verify metrics tracking
        var metrics = fixture.Cache.GetMetrics();
        Assert.True(metrics.TotalCacheHits >= 1);
        Assert.True(metrics.TotalCachedEntries >= 1);
    }

    [Fact]
    public async Task GetSalesReportAsync_bypasses_cache_when_refresh_true_and_invalidates_on_demand()
    {
        await using var fixture = await AdminSalesServiceFixture.CreateAsync();
        var customer = CreateCustomer("Bypass Customer", "+919123456789");
        fixture.Db.Customers.Add(customer);

        var now = DateTime.UtcNow;
        var order1 = CreateOrder(customer.Id, "ORD-BYPASS-1", OrderStatus.Confirmed, 500m, now.AddDays(-2));
        fixture.Db.Orders.Add(order1);
        await fixture.Db.SaveChangesAsync();

        var request = new AdminSalesReportRequest(
            StartDate: now.AddDays(-5),
            EndDate: now,
            Status: "Confirmed",
            Granularity: "day",
            Refresh: false
        );

        // Initial request (cached: NetRevenue = 500)
        var firstResponse = await fixture.Service.GetSalesReportAsync(request);
        Assert.Equal(500m, firstResponse.Data!.Summary.NetRevenue);

        // Add another order to the database directly
        var order2 = CreateOrder(customer.Id, "ORD-BYPASS-2", OrderStatus.Confirmed, 300m, now.AddDays(-1));
        fixture.Db.Orders.Add(order2);
        await fixture.Db.SaveChangesAsync();

        // Without refresh: Still returns cached 500
        var cachedResponse = await fixture.Service.GetSalesReportAsync(request);
        Assert.Equal(500m, cachedResponse.Data!.Summary.NetRevenue);

        // With Refresh = true: Bypasses cache and returns 800
        var refreshRequest = request with { Refresh = true };
        var refreshedResponse = await fixture.Service.GetSalesReportAsync(refreshRequest);
        Assert.Equal(800m, refreshedResponse.Data!.Summary.NetRevenue);

        // Add third order, then call InvalidateSalesCache
        var order3 = CreateOrder(customer.Id, "ORD-BYPASS-3", OrderStatus.Confirmed, 200m, now.AddDays(-1));
        fixture.Db.Orders.Add(order3);
        await fixture.Db.SaveChangesAsync();

        fixture.Service.InvalidateSalesCache("New order placed");

        // Next non-refresh call should now fetch 1000 because cache was invalidated
        var afterInvalidationResponse = await fixture.Service.GetSalesReportAsync(request);
        Assert.Equal(1000m, afterInvalidationResponse.Data!.Summary.NetRevenue);
    }

    [Fact]
    public async Task ExportSalesReportExcelAsync_generates_valid_styled_xlsx_with_store_branding_and_worksheets()
    {
        await using var fixture = await AdminSalesServiceFixture.CreateAsync();
        fixture.Db.StoreSettings.Add(new pramukhraj.Entities.Settings.StoreSettings
        {
            Id = 1,
            SettingsJson = "{\"storeName\":\"Fresh Market\"}"
        });
        await fixture.Db.SaveChangesAsync();

        var customer = CreateCustomer("Excel VIP Customer", "+919888877777");
        fixture.Db.Customers.Add(customer);

        var now = DateTime.UtcNow;
        var order = CreateOrder(customer.Id, "ORD-EXCEL-001", OrderStatus.Confirmed, 1500m, now.AddDays(-1));
        order.PaymentServiceTaxAmount = 25m;
        fixture.Db.Orders.Add(order);
        await fixture.Db.SaveChangesAsync();

        var item = CreateOrderItem(order.Id, "Alphonso Mango Pulp", "PULP-500G", 3, 500m);
        fixture.Db.OrderItems.Add(item);
        await fixture.Db.SaveChangesAsync();

        var request = new AdminSalesReportRequest(
            StartDate: now.AddDays(-7),
            EndDate: now,
            Status: "Confirmed",
            Granularity: "day"
        );

        var (excelBytes, fileName) = await fixture.Service.ExportSalesReportExcelAsync(request);

        Assert.NotNull(excelBytes);
        Assert.True(excelBytes.Length > 1000, "Excel output should be a valid non-empty OpenXML archive");
        Assert.StartsWith("SalesReport_FreshMarket_", fileName);
        Assert.EndsWith(".xlsx", fileName);

        // Verify workbook structure using ClosedXML
        using var ms = new MemoryStream(excelBytes);
        using var workbook = new ClosedXML.Excel.XLWorkbook(ms);

        Assert.Equal(5, workbook.Worksheets.Count);
        Assert.True(workbook.Worksheets.Contains("Summary & Ledger"));
        Assert.True(workbook.Worksheets.Contains("Products"));
        Assert.True(workbook.Worksheets.Contains("Categories"));
        Assert.True(workbook.Worksheets.Contains("Regions"));
        Assert.True(workbook.Worksheets.Contains("Coupons"));

        var ws1 = workbook.Worksheet("Summary & Ledger");
        Assert.Equal("FRESH MARKET - EXECUTIVE SALES & REVENUE REPORT", ws1.Cell("A1").GetString());
        Assert.Equal("NET REVENUE", ws1.Cell("A4").GetString());
        Assert.Equal(1500d, ws1.Cell("A5").GetDouble());
        Assert.Equal("PAYMENT GATEWAY FEES", ws1.Cell("E6").GetString());
        Assert.Equal("TOTAL REFUNDS ISSUED", ws1.Cell("A8").GetString());
        Assert.Equal("TOTAL RETURN REQUESTS", ws1.Cell("D8").GetString());
        Assert.Equal("RETURN RATE (%)", ws1.Cell("G8").GetString());
        Assert.Equal("Payment Fees (INR)", ws1.Cell(12, 7).GetString());
    }

    [Fact]
    public async Task ExportSalesReportCsvAsync_generates_valid_csv_with_utf8_bom_and_store_branding()
    {
        await using var fixture = await AdminSalesServiceFixture.CreateAsync();
        var customer = CreateCustomer("CSV Customer", "+919555544444");
        fixture.Db.Customers.Add(customer);

        var now = DateTime.UtcNow;
        var order = CreateOrder(customer.Id, "ORD-CSV-001", OrderStatus.Confirmed, 850m, now.AddDays(-2));
        order.PaymentServiceTaxAmount = 15m;
        fixture.Db.Orders.Add(order);
        await fixture.Db.SaveChangesAsync();

        var request = new AdminSalesReportRequest(
            StartDate: now.AddDays(-7),
            EndDate: now,
            Status: "Confirmed",
            Granularity: "day"
        );

        var (csvBytes, fileName) = await fixture.Service.ExportSalesReportCsvAsync(request);

        Assert.NotNull(csvBytes);
        Assert.True(csvBytes.Length > 3);
        // Verify UTF-8 BOM
        Assert.Equal(0xEF, csvBytes[0]);
        Assert.Equal(0xBB, csvBytes[1]);
        Assert.Equal(0xBF, csvBytes[2]);

        // When no store name is configured, it falls back gracefully to "Store"
        Assert.StartsWith("SalesReport_Store_", fileName);
        Assert.EndsWith(".csv", fileName);

        var csvContent = Encoding.UTF8.GetString(csvBytes);
        Assert.Contains("STORE - EXECUTIVE SALES & REVENUE REPORT", csvContent);
        Assert.Contains("Net Revenue (INR),850.00", csvContent);
        Assert.Contains("Payment Processing Fees Collected (INR),15.00", csvContent);
        Assert.Contains("Payment Fees (INR)", csvContent);
        Assert.Contains("SALES REPORT SUMMARY", csvContent);
        Assert.Contains("SALES LEDGER OVER TIME", csvContent);
        Assert.DoesNotContain("Tax", csvContent);
    }

    [Fact]
    public async Task GetSalesReportAsync_deducts_processed_refunds_and_calculates_returns_metrics()
    {
        await using var fixture = await AdminSalesServiceFixture.CreateAsync();
        var customer = CreateCustomer("Refund Test Customer", "+919111122222");
        fixture.Db.Customers.Add(customer);

        var now = DateTime.UtcNow;
        var order1 = CreateOrder(customer.Id, "ORD-REF-001", OrderStatus.Confirmed, 1000m, now.AddDays(-2));
        var order2 = CreateOrder(customer.Id, "ORD-REF-002", OrderStatus.Confirmed, 500m, now.AddDays(-1));
        fixture.Db.Orders.AddRange(order1, order2);

        // Add a return request
        var returnReq = new ReturnRequest
        {
            Id = Guid.NewGuid(),
            ReturnNumber = "RET-REF-001",
            OrderId = order1.Id,
            CustomerId = customer.Id,
            Status = ReturnStatus.Approved,
            TotalRefundAmount = 300m,
            NetRefundAmount = 300m,
            CreatedOn = now.AddDays(-1)
        };
        fixture.Db.ReturnRequests.Add(returnReq);

        // Add a processed refund of 300 INR (30000 paise)
        var refund = new RefundRecord
        {
            Id = Guid.NewGuid(),
            ReturnRequestId = returnReq.Id,
            OrderId = order1.Id,
            PaymentId = Guid.NewGuid(),
            IdempotencyKey = Guid.NewGuid().ToString("N"),
            ProviderRefundId = "rfnd_test_123",
            AmountPaise = 30000,
            Status = RefundStatus.Processed,
            CreatedOn = now.AddDays(-1),
            SettledOn = now.AddDays(-1)
        };
        fixture.Db.RefundRecords.Add(refund);
        await fixture.Db.SaveChangesAsync();

        var request = new AdminSalesReportRequest(
            StartDate: now.AddDays(-7),
            EndDate: now,
            Status: "Confirmed",
            Granularity: "day"
        );

        var response = await fixture.Service.GetSalesReportAsync(request);

        Assert.True(response.Success);
        Assert.NotNull(response.Data);
        var summary = response.Data.Summary;

        // Total orders = 2, Gross revenue = 1500, Refund = 300, Net revenue = 1200
        Assert.Equal(2, summary.TotalOrders);
        Assert.Equal(300m, summary.TotalRefunds);
        Assert.Equal(1200m, summary.NetRevenue);
        Assert.Equal(1, summary.TotalReturnsCount);
        Assert.Equal(50.0m, summary.ReturnRatePercent); // 1 return / 2 orders = 50%
    }

    private static Customer CreateCustomer(string fullName, string phone) => new()
    {
        Id = Guid.NewGuid(),
        FullName = fullName,
        MobileNumber = phone,
        Email = $"{fullName.ToLowerInvariant().Replace(" ", ".")}@example.com",
        NormalizedEmail = $"{fullName.ToLowerInvariant().Replace(" ", ".")}@example.com",
        IsActive = true,
        CreatedOn = DateTime.UtcNow,
        UpdatedOn = DateTime.UtcNow
    };

    private static Order CreateOrder(Guid customerId, string orderNumber, OrderStatus status, decimal grandTotal, DateTime createdOn) => new()
    {
        Id = Guid.NewGuid(),
        CustomerId = customerId,
        CheckoutSessionId = Guid.NewGuid(),
        OrderNumber = orderNumber,
        IdempotencyKey = Guid.NewGuid().ToString("N"),
        Status = status,
        GrandTotal = grandTotal,
        Subtotal = grandTotal,
        Currency = "INR",
        CreatedOn = createdOn,
        UpdatedOn = createdOn,
        PaymentExpiresOn = createdOn.AddMinutes(30)
    };

    private static OrderItem CreateOrderItem(Guid orderId, string productName, string sku, int quantity, decimal unitPrice) => new()
    {
        Id = Guid.NewGuid(),
        OrderId = orderId,
        ProductId = Guid.NewGuid(),
        ProductVariantId = Guid.NewGuid(),
        ProductName = productName,
        ProductSlug = "test-slug",
        VariantName = "Standard",
        Sku = sku,
        Quantity = quantity,
        UnitPrice = unitPrice,
        LineTotal = unitPrice * quantity
    };

    private sealed class AdminSalesServiceFixture : IAsyncDisposable
    {
        private readonly SqliteConnection _connection;
        private readonly Microsoft.Extensions.Caching.Memory.MemoryCache _memoryCache;
        public AppDbContext Db { get; }
        public ICacheService Cache { get; }
        public AdminSalesService Service { get; }

        private AdminSalesServiceFixture(
            SqliteConnection connection,
            AppDbContext db,
            Microsoft.Extensions.Caching.Memory.MemoryCache memoryCache,
            ICacheService cache,
            AdminSalesService service)
        {
            _connection = connection;
            Db = db;
            _memoryCache = memoryCache;
            Cache = cache;
            Service = service;
        }

        public static async Task<AdminSalesServiceFixture> CreateAsync()
        {
            var connection = new SqliteConnection("Data Source=:memory:");
            await connection.OpenAsync();
            connection.CreateFunction("now", () => DateTime.UtcNow.ToString("o"));
            var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options);
            await db.Database.EnsureCreatedAsync();
            await db.Database.ExecuteSqlRawAsync("PRAGMA foreign_keys = OFF;");

            var cacheOptions = Microsoft.Extensions.Options.Options.Create(new Microsoft.Extensions.Caching.Memory.MemoryCacheOptions { SizeLimit = 10_000 });
            var memoryCache = new Microsoft.Extensions.Caching.Memory.MemoryCache(cacheOptions.Value);
            var cacheService = new MemoryCacheService(memoryCache, cacheOptions, NullLogger<MemoryCacheService>.Instance);

            var service = new AdminSalesService(db, cacheService, NullLogger<AdminSalesService>.Instance);
            return new AdminSalesServiceFixture(connection, db, memoryCache, cacheService, service);
        }

        public async ValueTask DisposeAsync()
        {
            await Db.DisposeAsync();
            await _connection.DisposeAsync();
            _memoryCache.Dispose();
        }
    }
}
