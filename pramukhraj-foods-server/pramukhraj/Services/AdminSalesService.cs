using System.Globalization;
using System.Text;
using System.Text.Json;
using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using pramukhraj.Common;
using pramukhraj.Database;
using pramukhraj.DTOs.Sales;
using pramukhraj.Entities.Order;
using pramukhraj.Interfaces;

namespace pramukhraj.Services;

public sealed class AdminSalesService(
    AppDbContext db,
    ICacheService cache,
    ILogger<AdminSalesService> logger) : IAdminSalesService
{
    public async Task<ApiResponse<AdminSalesReportResponse>> GetSalesReportAsync(AdminSalesReportRequest request, CancellationToken cancellationToken = default)
    {
        var (start, end) = ResolveDateWindow(request.StartDate, request.EndDate);
        var duration = end - start;
        var prevEnd = start.AddTicks(-1);
        var prevStart = prevEnd.Subtract(duration).AddTicks(1);

        var isAllStatuses = string.Equals(request.Status, "all", StringComparison.OrdinalIgnoreCase);
        var granularity = (request.Granularity ?? "day").ToLowerInvariant();
        var statusKey = isAllStatuses ? "all" : "confirmed";

        var cacheKey = CacheKey.Sales.Report(start, end, statusKey, granularity);

        if (!request.Refresh)
        {
            var cached = await cache.GetAsync<AdminSalesReportResponse>(cacheKey, cancellationToken);
            if (cached != null)
            {
                logger.LogDebug("Cache HIT for sales report: {CacheKey}", cacheKey);
                return ApiResponse<AdminSalesReportResponse>.Ok(cached, "Sales report retrieved from cache.");
            }
            logger.LogDebug("Cache MISS for sales report: {CacheKey}", cacheKey);
        }
        else
        {
            logger.LogDebug("Cache BYPASS requested for sales report: {CacheKey}", cacheKey);
        }

        // 1. Fetch Orders in Period
        var query = db.Orders.AsNoTracking()
            .Where(o => o.CreatedOn >= start && o.CreatedOn <= end);

        if (!isAllStatuses)
        {
            query = query.Where(o => o.Status == OrderStatus.Confirmed);
        }

        var orders = await query
            .Include(o => o.Items)
            .Include(o => o.Addresses)
            .OrderBy(o => o.CreatedOn)
            .ToListAsync(cancellationToken);

        // 2. Fetch Previous Period Revenue for Growth Comparison
        var prevQuery = db.Orders.AsNoTracking()
            .Where(o => o.CreatedOn >= prevStart && o.CreatedOn <= prevEnd);

        if (!isAllStatuses)
        {
            prevQuery = prevQuery.Where(o => o.Status == OrderStatus.Confirmed);
        }

        var prevRevenue = await prevQuery.SumAsync(o => (decimal?)o.GrandTotal, cancellationToken) ?? 0m;

        // 3. Calculate Summary Financials
        var netRevenue = orders.Sum(o => o.GrandTotal);
        var totalOrders = orders.Count;
        var aov = totalOrders > 0 ? Math.Round(netRevenue / totalOrders, 2) : 0m;
        var totalItemsSold = orders.Sum(o => o.Items.Sum(i => i.Quantity));
        var itemDiscounts = orders.Sum(o => o.ItemDiscountAmount);
        var couponDiscounts = orders.Sum(o => o.CouponDiscountAmount);
        var totalDiscounts = itemDiscounts + couponDiscounts;
        var shippingFees = orders.Sum(o => o.ShippingAmount);
        var paymentProcessingFees = orders.Sum(o => o.PaymentServiceTaxAmount);
        var grossSales = orders.Sum(o => o.Items.Sum(i => i.UnitPrice * i.Quantity));

        // Growth %
        var growthPercent = 0m;
        if (prevRevenue > 0)
        {
            growthPercent = Math.Round(((netRevenue - prevRevenue) / prevRevenue) * 100m, 1);
        }
        else if (netRevenue > 0)
        {
            growthPercent = 100m;
        }

        // Repeat Customer Rate
        var distinctCustomerIds = orders.Select(o => o.CustomerId).Distinct().ToList();
        var repeatCustomerRate = 0m;
        if (distinctCustomerIds.Count > 0)
        {
            var repeatCustomerCount = await db.Orders.AsNoTracking()
                .Where(o => distinctCustomerIds.Contains(o.CustomerId))
                .GroupBy(o => o.CustomerId)
                .Where(g => g.Count() > 1)
                .CountAsync(cancellationToken);
            repeatCustomerRate = Math.Round((decimal)repeatCustomerCount / distinctCustomerIds.Count * 100m, 1);
        }

        var summary = new AdminSalesSummaryDto(
            GrossSales: grossSales,
            NetRevenue: netRevenue,
            TotalOrders: totalOrders,
            AverageOrderValue: aov,
            TotalItemsSold: totalItemsSold,
            ItemDiscounts: itemDiscounts,
            CouponDiscounts: couponDiscounts,
            TotalDiscounts: totalDiscounts,
            ShippingFeesCollected: shippingFees,
            PaymentProcessingFeesCollected: paymentProcessingFees,
            RepeatCustomerRatePercent: repeatCustomerRate,
            PreviousPeriodRevenue: prevRevenue,
            RevenueGrowthPercent: growthPercent
        );

        // 4. Build Timeline Points
        var timeline = BuildTimeline(orders, start, end, granularity);

        // 5. Product Category mapping
        var productIds = orders.SelectMany(o => o.Items).Select(i => i.ProductId).Distinct().ToList();
        var productMeta = await db.Products.AsNoTracking()
            .Where(p => productIds.Contains(p.Id))
            .Select(p => new { p.Id, p.CategoryId, CategoryName = p.Category.Name })
            .ToDictionaryAsync(p => p.Id, p => (p.CategoryId, p.CategoryName), cancellationToken);

        // 6. Product Sales Breakdown
        var productSales = orders
            .SelectMany(o => o.Items.Select(item => new { OrderId = o.Id, Item = item }))
            .GroupBy(x => x.Item.ProductId)
            .Select(g =>
            {
                var productId = g.Key;
                var first = g.First().Item;
                var categoryName = productMeta.TryGetValue(productId, out var meta) ? meta.CategoryName : "General";
                var units = g.Sum(x => x.Item.Quantity);
                var distinctOrders = g.Select(x => x.OrderId).Distinct().Count();
                var gross = g.Sum(x => x.Item.UnitPrice * x.Item.Quantity);
                var net = g.Sum(x => x.Item.LineTotal);
                var pct = netRevenue > 0 ? Math.Round(net / netRevenue * 100m, 2) : 0m;

                return new AdminProductSalesDto(
                    ProductId: productId,
                    ProductName: first.ProductName,
                    CategoryName: categoryName,
                    UnitsSold: units,
                    OrdersCount: distinctOrders,
                    GrossRevenue: gross,
                    NetRevenue: net,
                    PercentageOfTotal: pct
                );
            })
            .OrderByDescending(p => p.NetRevenue)
            .ToList();

        // 7. Category Sales Breakdown
        var categorySales = orders
            .SelectMany(o => o.Items.Select(item => new { OrderId = o.Id, Item = item }))
            .GroupBy(x =>
            {
                if (productMeta.TryGetValue(x.Item.ProductId, out var meta))
                    return (meta.CategoryId, meta.CategoryName);
                return (CategoryId: Guid.Empty, CategoryName: "General");
            })
            .Select(g =>
            {
                var units = g.Sum(x => x.Item.Quantity);
                var distinctOrders = g.Select(x => x.OrderId).Distinct().Count();
                var total = g.Sum(x => x.Item.LineTotal);
                var pct = netRevenue > 0 ? Math.Round(total / netRevenue * 100m, 2) : 0m;

                return new AdminCategorySalesDto(
                    CategoryId: g.Key.CategoryId,
                    CategoryName: g.Key.CategoryName,
                    UnitsSold: units,
                    OrdersCount: distinctOrders,
                    TotalRevenue: total,
                    PercentageOfTotal: pct
                );
            })
            .OrderByDescending(c => c.TotalRevenue)
            .ToList();

        // 8. Coupon Sales Breakdown
        var couponSales = orders
            .Where(o => !string.IsNullOrWhiteSpace(o.CouponCode))
            .GroupBy(o => o.CouponCode!)
            .Select(g => new AdminCouponSalesDto(
                CouponCode: g.Key,
                TimesRedeemed: g.Count(),
                TotalDiscountAmount: g.Sum(o => o.CouponDiscountAmount),
                TotalOrderRevenue: g.Sum(o => o.GrandTotal)
            ))
            .OrderByDescending(c => c.TotalOrderRevenue)
            .ToList();

        // 9. State Sales Breakdown
        var stateSales = orders
            .GroupBy(o =>
            {
                var addr = o.Addresses.FirstOrDefault(a => a.Type == "Shipping") ?? o.Addresses.FirstOrDefault();
                return string.IsNullOrWhiteSpace(addr?.State) ? "Other / Unspecified" : addr.State.Trim();
            })
            .Select(g =>
            {
                var rev = g.Sum(o => o.GrandTotal);
                var pct = netRevenue > 0 ? Math.Round(rev / netRevenue * 100m, 2) : 0m;
                return new AdminStateSalesDto(
                    State: g.Key,
                    OrdersCount: g.Count(),
                    TotalRevenue: rev,
                    PercentageOfTotal: pct
                );
            })
            .OrderByDescending(s => s.TotalRevenue)
            .ToList();

        var response = new AdminSalesReportResponse(
            Summary: summary,
            Timeline: timeline,
            ProductSales: productSales,
            CategorySales: categorySales,
            CouponSales: couponSales,
            StateSales: stateSales,
            WindowStart: start,
            WindowEnd: end,
            StatusFilter: isAllStatuses ? "All" : "Confirmed",
            Granularity: granularity
        );

        // Cache sales report response for 15 minutes
        await cache.SetAsync(cacheKey, response, TimeSpan.FromMinutes(15), size: 1, cancellationToken);
        logger.LogDebug("Cached sales report under key: {CacheKey} (TTL: 15m)", cacheKey);

        return ApiResponse<AdminSalesReportResponse>.Ok(response);
    }

    public void InvalidateSalesCache(string? reason = null)
    {
        cache.RemoveByPrefix(CacheKey.Sales.AllPrefix, reason ?? "Sales reports cache invalidated");
        logger.LogInformation("Sales reports cache invalidated by prefix: {Prefix}. Reason: {Reason}", CacheKey.Sales.AllPrefix, reason ?? "Unspecified");
    }

    public async Task<(byte[] CsvBytes, string FileName)> ExportSalesReportCsvAsync(AdminSalesReportRequest request, CancellationToken cancellationToken = default)
    {
        var reportResponse = await GetSalesReportAsync(request, cancellationToken);
        var data = reportResponse.Data;
        var storeName = await ResolveStoreNameAsync(cancellationToken);
        var sanitizedStoreName = string.Concat(storeName.Split(Path.GetInvalidFileNameChars())).Replace(" ", "");
        if (string.IsNullOrWhiteSpace(sanitizedStoreName)) sanitizedStoreName = "Store";

        var sb = new StringBuilder();

        // Store Header & Meta
        sb.AppendLine("================================================================================");
        sb.AppendLine($"{storeName.ToUpperInvariant()} - EXECUTIVE SALES & REVENUE REPORT");
        sb.AppendLine("================================================================================");
        sb.AppendLine($"Reporting Window Start,{data?.WindowStart:yyyy-MM-dd HH:mm:ss} UTC");
        sb.AppendLine($"Reporting Window End,{data?.WindowEnd:yyyy-MM-dd HH:mm:ss} UTC");
        sb.AppendLine($"Order Status Filter,{data?.StatusFilter ?? "All"}");
        sb.AppendLine($"Generated At,{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC");
        sb.AppendLine();

        // Summary Section
        sb.AppendLine("SALES REPORT SUMMARY");
        sb.AppendLine($"Gross Sales (INR),{data?.Summary.GrossSales:F2}");
        sb.AppendLine($"Net Revenue (INR),{data?.Summary.NetRevenue:F2}");
        sb.AppendLine($"Total Orders,{data?.Summary.TotalOrders}");
        sb.AppendLine($"Total Items Sold,{data?.Summary.TotalItemsSold}");
        sb.AppendLine($"Average Order Value (INR),{data?.Summary.AverageOrderValue:F2}");
        sb.AppendLine($"Total Discounts (INR),{data?.Summary.TotalDiscounts:F2}");
        sb.AppendLine($"Item Discounts (INR),{data?.Summary.ItemDiscounts:F2}");
        sb.AppendLine($"Coupon Discounts (INR),{data?.Summary.CouponDiscounts:F2}");
        sb.AppendLine($"Shipping Fees Collected (INR),{data?.Summary.ShippingFeesCollected:F2}");
        sb.AppendLine($"Payment Processing Fees Collected (INR),{data?.Summary.PaymentProcessingFeesCollected:F2}");
        sb.AppendLine($"Repeat Customer Rate (%),{data?.Summary.RepeatCustomerRatePercent:F1}%");
        sb.AppendLine($"Previous Period Revenue (INR),{data?.Summary.PreviousPeriodRevenue:F2}");
        sb.AppendLine($"Revenue Growth vs Previous Period (%),{data?.Summary.RevenueGrowthPercent:F1}%");
        sb.AppendLine();

        // Timeline / Ledger Section
        sb.AppendLine("SALES LEDGER OVER TIME");
        sb.AppendLine("Period,Orders,Items Sold,Gross Sales (INR),Discounts (INR),Shipping (INR),Payment Fees (INR),Net Revenue (INR),Average Order Value (INR)");
        if (data?.Timeline != null)
        {
            foreach (var point in data.Timeline)
            {
                sb.AppendLine($"\"{EscapeCsv(point.PeriodKey)}\",{point.OrdersCount},{point.ItemsCount},{(point.Revenue + point.Discounts):F2},{point.Discounts:F2},{point.Shipping:F2},{point.PaymentProcessingFees:F2},{point.Revenue:F2},{point.AverageOrderValue:F2}");
            }
        }
        sb.AppendLine();

        // Product Breakdown Section
        sb.AppendLine("SALES BY PRODUCT");
        sb.AppendLine("Product Name,Category,Units Sold,Orders Count,Gross Revenue (INR),Net Revenue (INR),Revenue Share (%)");
        if (data?.ProductSales != null)
        {
            foreach (var p in data.ProductSales)
            {
                sb.AppendLine($"\"{EscapeCsv(p.ProductName)}\",\"{EscapeCsv(p.CategoryName)}\",{p.UnitsSold},{p.OrdersCount},{p.GrossRevenue:F2},{p.NetRevenue:F2},{p.PercentageOfTotal:F2}%");
            }
        }
        sb.AppendLine();

        // Category Breakdown Section
        sb.AppendLine("SALES BY CATEGORY");
        sb.AppendLine("Category Name,Units Sold,Orders Count,Total Revenue (INR),Revenue Share (%)");
        if (data?.CategorySales != null)
        {
            foreach (var c in data.CategorySales)
            {
                sb.AppendLine($"\"{EscapeCsv(c.CategoryName)}\",{c.UnitsSold},{c.OrdersCount},{c.TotalRevenue:F2},{c.PercentageOfTotal:F2}%");
            }
        }
        sb.AppendLine();

        // State Breakdown Section
        sb.AppendLine("SALES BY STATE / REGION");
        sb.AppendLine("State,Orders Count,Total Revenue (INR),Revenue Share (%)");
        if (data?.StateSales != null)
        {
            foreach (var s in data.StateSales)
            {
                sb.AppendLine($"\"{EscapeCsv(s.State)}\",{s.OrdersCount},{s.TotalRevenue:F2},{s.PercentageOfTotal:F2}%");
            }
        }
        sb.AppendLine();

        // Coupon Section
        if (data?.CouponSales != null && data.CouponSales.Count > 0)
        {
            sb.AppendLine("COUPON PERFORMANCE");
            sb.AppendLine("Coupon Code,Times Redeemed,Total Discount Given (INR),Order Revenue Generated (INR)");
            foreach (var cp in data.CouponSales)
            {
                sb.AppendLine($"\"{EscapeCsv(cp.CouponCode)}\",{cp.TimesRedeemed},{cp.TotalDiscountAmount:F2},{cp.TotalOrderRevenue:F2}");
            }
        }

        var bytes = Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(sb.ToString())).ToArray();
        var fileName = $"SalesReport_{sanitizedStoreName}_{data?.WindowStart:yyyyMMdd}_{data?.WindowEnd:yyyyMMdd}.csv";

        return (bytes, fileName);
    }

    public async Task<(byte[] ExcelBytes, string FileName)> ExportSalesReportExcelAsync(AdminSalesReportRequest request, CancellationToken cancellationToken = default)
    {
        var reportResponse = await GetSalesReportAsync(request, cancellationToken);
        var data = reportResponse.Data;
        var storeName = await ResolveStoreNameAsync(cancellationToken);
        var sanitizedStoreName = string.Concat(storeName.Split(Path.GetInvalidFileNameChars())).Replace(" ", "");
        if (string.IsNullOrWhiteSpace(sanitizedStoreName)) sanitizedStoreName = "Store";

        using var workbook = new XLWorkbook();

        var oxblood = XLColor.FromHtml("#800020");
        var deepOxblood = XLColor.FromHtml("#7F1D1D");
        var darkNavy = XLColor.FromHtml("#1E293B");
        var charcoal = XLColor.FromHtml("#0F172A");
        var oceanBlue = XLColor.FromHtml("#0369A1");
        var emerald = XLColor.FromHtml("#047857");
        var teal = XLColor.FromHtml("#0F766E");
        var bronze = XLColor.FromHtml("#7C2D12");

        // ═══════════════════════════════════════════════════════════════════════════
        // SHEET 1: Executive Summary & Ledger
        // ═══════════════════════════════════════════════════════════════════════════
        var ws1 = workbook.Worksheets.Add("Summary & Ledger");
        ws1.ShowGridLines = true;

        // 1. Store Branding Title
        ws1.Cell("A1").Value = $"{storeName.ToUpperInvariant()} - EXECUTIVE SALES & REVENUE REPORT";
        var titleRange = ws1.Range("A1:I1");
        titleRange.Merge();
        titleRange.Style.Font.Bold = true;
        titleRange.Style.Font.FontSize = 15;
        titleRange.Style.Font.FontColor = XLColor.White;
        titleRange.Style.Fill.BackgroundColor = oxblood;
        titleRange.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        titleRange.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        ws1.Row(1).Height = 34;

        // 2. Report Subtitle / Metadata
        ws1.Cell("A2").Value = $"Window: {data?.WindowStart:yyyy-MM-dd HH:mm} to {data?.WindowEnd:yyyy-MM-dd HH:mm} UTC | Status: {data?.StatusFilter ?? "All"} | Generated: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC";
        var subRange = ws1.Range("A2:I2");
        subRange.Merge();
        subRange.Style.Font.Italic = true;
        subRange.Style.Font.FontSize = 9.5;
        subRange.Style.Font.FontColor = XLColor.FromHtml("#475569");
        subRange.Style.Fill.BackgroundColor = XLColor.FromHtml("#F8FAFC");
        subRange.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        subRange.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        ws1.Row(2).Height = 22;

        // 3. Primary KPI Cards Grid (Rows 4-5)
        // Card 1: Net Revenue (Highlighted in deep Oxblood)
        ws1.Range("A4:B4").Merge();
        ws1.Cell("A4").Value = "NET REVENUE";
        ws1.Range("A4:B4").Style.Font.Bold = true;
        ws1.Range("A4:B4").Style.Font.FontSize = 9;
        ws1.Range("A4:B4").Style.Font.FontColor = XLColor.White;
        ws1.Range("A4:B4").Style.Fill.BackgroundColor = deepOxblood;
        ws1.Range("A4:B4").Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

        ws1.Range("A5:B5").Merge();
        ws1.Cell("A5").Value = data?.Summary.NetRevenue ?? 0m;
        ws1.Range("A5:B5").Style.Font.Bold = true;
        ws1.Range("A5:B5").Style.Font.FontSize = 14;
        ws1.Range("A5:B5").Style.Font.FontColor = XLColor.White;
        ws1.Range("A5:B5").Style.Fill.BackgroundColor = XLColor.FromHtml("#991B1B");
        ws1.Range("A5:B5").Style.NumberFormat.Format = "[$₹-en-IN] #,##0.00";
        ws1.Range("A5:B5").Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

        // Card 2: Gross Sales
        ws1.Range("C4:D4").Merge();
        ws1.Cell("C4").Value = "GROSS SALES";
        ws1.Range("C4:D4").Style.Font.Bold = true;
        ws1.Range("C4:D4").Style.Font.FontSize = 9;
        ws1.Range("C4:D4").Style.Font.FontColor = XLColor.White;
        ws1.Range("C4:D4").Style.Fill.BackgroundColor = charcoal;
        ws1.Range("C4:D4").Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

        ws1.Range("C5:D5").Merge();
        ws1.Cell("C5").Value = data?.Summary.GrossSales ?? 0m;
        ws1.Range("C5:D5").Style.Font.Bold = true;
        ws1.Range("C5:D5").Style.Font.FontSize = 13;
        ws1.Range("C5:D5").Style.Font.FontColor = XLColor.White;
        ws1.Range("C5:D5").Style.Fill.BackgroundColor = darkNavy;
        ws1.Range("C5:D5").Style.NumberFormat.Format = "[$₹-en-IN] #,##0.00";
        ws1.Range("C5:D5").Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

        // Card 3: Total Orders
        ws1.Cell("E4").Value = "TOTAL ORDERS";
        ws1.Cell("E4").Style.Font.Bold = true;
        ws1.Cell("E4").Style.Font.FontSize = 9;
        ws1.Cell("E4").Style.Font.FontColor = XLColor.White;
        ws1.Cell("E4").Style.Fill.BackgroundColor = oceanBlue;
        ws1.Cell("E4").Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

        ws1.Cell("E5").Value = data?.Summary.TotalOrders ?? 0;
        ws1.Cell("E5").Style.Font.Bold = true;
        ws1.Cell("E5").Style.Font.FontSize = 13;
        ws1.Cell("E5").Style.Font.FontColor = XLColor.White;
        ws1.Cell("E5").Style.Fill.BackgroundColor = XLColor.FromHtml("#0284C7");
        ws1.Cell("E5").Style.NumberFormat.Format = "#,##0";
        ws1.Cell("E5").Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

        // Card 4: Units Sold
        ws1.Cell("F4").Value = "UNITS SOLD";
        ws1.Cell("F4").Style.Font.Bold = true;
        ws1.Cell("F4").Style.Font.FontSize = 9;
        ws1.Cell("F4").Style.Font.FontColor = XLColor.White;
        ws1.Cell("F4").Style.Fill.BackgroundColor = emerald;
        ws1.Cell("F4").Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

        ws1.Cell("F5").Value = data?.Summary.TotalItemsSold ?? 0;
        ws1.Cell("F5").Style.Font.Bold = true;
        ws1.Cell("F5").Style.Font.FontSize = 13;
        ws1.Cell("F5").Style.Font.FontColor = XLColor.White;
        ws1.Cell("F5").Style.Fill.BackgroundColor = XLColor.FromHtml("#059669");
        ws1.Cell("F5").Style.NumberFormat.Format = "#,##0";
        ws1.Cell("F5").Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

        // Card 5: Average Order Value
        ws1.Range("G4:H4").Merge();
        ws1.Cell("G4").Value = "AVG ORDER VALUE (AOV)";
        ws1.Range("G4:H4").Style.Font.Bold = true;
        ws1.Range("G4:H4").Style.Font.FontSize = 9;
        ws1.Range("G4:H4").Style.Font.FontColor = XLColor.White;
        ws1.Range("G4:H4").Style.Fill.BackgroundColor = teal;
        ws1.Range("G4:H4").Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

        ws1.Range("G5:H5").Merge();
        ws1.Cell("G5").Value = data?.Summary.AverageOrderValue ?? 0m;
        ws1.Range("G5:H5").Style.Font.Bold = true;
        ws1.Range("G5:H5").Style.Font.FontSize = 13;
        ws1.Range("G5:H5").Style.Font.FontColor = XLColor.White;
        ws1.Range("G5:H5").Style.Fill.BackgroundColor = XLColor.FromHtml("#0D9488");
        ws1.Range("G5:H5").Style.NumberFormat.Format = "[$₹-en-IN] #,##0.00";
        ws1.Range("G5:H5").Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

        // Card 6: Revenue Growth
        ws1.Cell("I4").Value = "REVENUE GROWTH";
        ws1.Cell("I4").Style.Font.Bold = true;
        ws1.Cell("I4").Style.Font.FontSize = 9;
        ws1.Cell("I4").Style.Font.FontColor = XLColor.White;
        ws1.Cell("I4").Style.Fill.BackgroundColor = XLColor.FromHtml("#334155");
        ws1.Cell("I4").Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

        var growthPct = (data?.Summary.RevenueGrowthPercent ?? 0m) / 100m;
        ws1.Cell("I5").Value = growthPct;
        ws1.Cell("I5").Style.Font.Bold = true;
        ws1.Cell("I5").Style.Font.FontSize = 13;
        if (growthPct >= 0)
        {
            ws1.Cell("I5").Style.Font.FontColor = XLColor.FromHtml("#15803D");
            ws1.Cell("I5").Style.Fill.BackgroundColor = XLColor.FromHtml("#DCFCE7");
        }
        else
        {
            ws1.Cell("I5").Style.Font.FontColor = XLColor.FromHtml("#B91C1C");
            ws1.Cell("I5").Style.Fill.BackgroundColor = XLColor.FromHtml("#FEE2E2");
        }
        ws1.Cell("I5").Style.NumberFormat.Format = "+0.0%;-0.0%;0.0%";
        ws1.Cell("I5").Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

        // 4. Secondary Metric Row (Rows 6-7)
        // Discounts Given
        ws1.Range("A6:B6").Merge();
        ws1.Cell("A6").Value = "TOTAL DISCOUNTS";
        ws1.Range("A6:B6").Style.Font.Bold = true;
        ws1.Range("A6:B6").Style.Font.FontSize = 8.5;
        ws1.Range("A6:B6").Style.Font.FontColor = XLColor.FromHtml("#991B1B");
        ws1.Range("A6:B6").Style.Fill.BackgroundColor = XLColor.FromHtml("#FEE2E2");
        ws1.Range("A6:B6").Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

        ws1.Range("A7:B7").Merge();
        ws1.Cell("A7").Value = data?.Summary.TotalDiscounts ?? 0m;
        ws1.Range("A7:B7").Style.Font.Bold = true;
        ws1.Range("A7:B7").Style.Font.FontSize = 11;
        ws1.Range("A7:B7").Style.Font.FontColor = XLColor.FromHtml("#991B1B");
        ws1.Range("A7:B7").Style.Fill.BackgroundColor = XLColor.FromHtml("#FEF2F2");
        ws1.Range("A7:B7").Style.NumberFormat.Format = "[$₹-en-IN] #,##0.00";
        ws1.Range("A7:B7").Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

        // Shipping Fees
        ws1.Range("C6:D6").Merge();
        ws1.Cell("C6").Value = "SHIPPING COLLECTED";
        ws1.Range("C6:D6").Style.Font.Bold = true;
        ws1.Range("C6:D6").Style.Font.FontSize = 8.5;
        ws1.Range("C6:D6").Style.Font.FontColor = XLColor.FromHtml("#334155");
        ws1.Range("C6:D6").Style.Fill.BackgroundColor = XLColor.FromHtml("#E2E8F0");
        ws1.Range("C6:D6").Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

        ws1.Range("C7:D7").Merge();
        ws1.Cell("C7").Value = data?.Summary.ShippingFeesCollected ?? 0m;
        ws1.Range("C7:D7").Style.Font.Bold = true;
        ws1.Range("C7:D7").Style.Font.FontSize = 11;
        ws1.Range("C7:D7").Style.Font.FontColor = darkNavy;
        ws1.Range("C7:D7").Style.Fill.BackgroundColor = XLColor.FromHtml("#F8FAFC");
        ws1.Range("C7:D7").Style.NumberFormat.Format = "[$₹-en-IN] #,##0.00";
        ws1.Range("C7:D7").Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

        // Payment Gateway Fees
        ws1.Range("E6:F6").Merge();
        ws1.Cell("E6").Value = "PAYMENT GATEWAY FEES";
        ws1.Range("E6:F6").Style.Font.Bold = true;
        ws1.Range("E6:F6").Style.Font.FontSize = 8.5;
        ws1.Range("E6:F6").Style.Font.FontColor = XLColor.FromHtml("#334155");
        ws1.Range("E6:F6").Style.Fill.BackgroundColor = XLColor.FromHtml("#E2E8F0");
        ws1.Range("E6:F6").Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

        ws1.Range("E7:F7").Merge();
        ws1.Cell("E7").Value = data?.Summary.PaymentProcessingFeesCollected ?? 0m;
        ws1.Range("E7:F7").Style.Font.Bold = true;
        ws1.Range("E7:F7").Style.Font.FontSize = 11;
        ws1.Range("E7:F7").Style.Font.FontColor = darkNavy;
        ws1.Range("E7:F7").Style.Fill.BackgroundColor = XLColor.FromHtml("#F8FAFC");
        ws1.Range("E7:F7").Style.NumberFormat.Format = "[$₹-en-IN] #,##0.00";
        ws1.Range("E7:F7").Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

        // Repeat Customer Rate
        ws1.Range("G6:I6").Merge();
        ws1.Cell("G6").Value = "REPEAT CUSTOMER RATE";
        ws1.Range("G6:I6").Style.Font.Bold = true;
        ws1.Range("G6:I6").Style.Font.FontSize = 8.5;
        ws1.Range("G6:I6").Style.Font.FontColor = XLColor.FromHtml("#1D4ED8");
        ws1.Range("G6:I6").Style.Fill.BackgroundColor = XLColor.FromHtml("#DBEAFE");
        ws1.Range("G6:I6").Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

        ws1.Range("G7:I7").Merge();
        ws1.Cell("G7").Value = (data?.Summary.RepeatCustomerRatePercent ?? 0m) / 100m;
        ws1.Range("G7:I7").Style.Font.Bold = true;
        ws1.Range("G7:I7").Style.Font.FontSize = 11;
        ws1.Range("G7:I7").Style.Font.FontColor = XLColor.FromHtml("#1D4ED8");
        ws1.Range("G7:I7").Style.Fill.BackgroundColor = XLColor.FromHtml("#EFF6FF");
        ws1.Range("G7:I7").Style.NumberFormat.Format = "0.0%";
        ws1.Range("G7:I7").Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

        // Apply borders to KPI cards
        ApplyCardBorders(ws1.Range("A4:B5"));
        ApplyCardBorders(ws1.Range("C4:D5"));
        ApplyCardBorders(ws1.Range("E4:E5"));
        ApplyCardBorders(ws1.Range("F4:F5"));
        ApplyCardBorders(ws1.Range("G4:H5"));
        ApplyCardBorders(ws1.Range("I4:I5"));
        ApplyCardBorders(ws1.Range("A6:B7"));
        ApplyCardBorders(ws1.Range("C6:D7"));
        ApplyCardBorders(ws1.Range("E6:F7"));
        ApplyCardBorders(ws1.Range("G6:I7"));

        // 5. Timeline Ledger Table
        ws1.Cell("A9").Value = "SALES LEDGER OVER TIME";
        ws1.Cell("A9").Style.Font.Bold = true;
        ws1.Cell("A9").Style.Font.FontSize = 11;
        ws1.Cell("A9").Style.Font.FontColor = darkNavy;

        string[] ledgerHeaders = ["Period", "Orders", "Items Sold", "Gross Sales (INR)", "Discounts (INR)", "Shipping (INR)", "Payment Fees (INR)", "Net Revenue (INR)", "Avg Order Value (INR)"];
        for (int i = 0; i < ledgerHeaders.Length; i++)
        {
            var cell = ws1.Cell(10, i + 1);
            cell.Value = ledgerHeaders[i];
            cell.Style.Font.Bold = true;
            cell.Style.Font.FontSize = 9.5;
            cell.Style.Font.FontColor = XLColor.White;
            cell.Style.Fill.BackgroundColor = darkNavy;
            cell.Style.Alignment.Horizontal = i == 0 ? XLAlignmentHorizontalValues.Left : XLAlignmentHorizontalValues.Right;
            cell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        }
        ws1.Row(10).Height = 26;

        int rowIdx = 11;
        if (data?.Timeline != null && data.Timeline.Count > 0)
        {
            foreach (var pt in data.Timeline)
            {
                var row = ws1.Row(rowIdx);
                row.Height = 20;
                var isEven = rowIdx % 2 == 0;
                var rowBg = isEven ? XLColor.White : XLColor.FromHtml("#F8FAFC");

                row.Cell(1).Value = pt.PeriodLabel;
                row.Cell(1).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;

                row.Cell(2).Value = pt.OrdersCount;
                row.Cell(2).Style.NumberFormat.Format = "#,##0";

                row.Cell(3).Value = pt.ItemsCount;
                row.Cell(3).Style.NumberFormat.Format = "#,##0";

                row.Cell(4).Value = pt.Revenue + pt.Discounts;
                row.Cell(4).Style.NumberFormat.Format = "[$₹-en-IN] #,##0.00";

                row.Cell(5).Value = pt.Discounts;
                row.Cell(5).Style.NumberFormat.Format = "[$₹-en-IN] #,##0.00";

                row.Cell(6).Value = pt.Shipping;
                row.Cell(6).Style.NumberFormat.Format = "[$₹-en-IN] #,##0.00";

                row.Cell(7).Value = pt.PaymentProcessingFees;
                row.Cell(7).Style.NumberFormat.Format = "[$₹-en-IN] #,##0.00";

                row.Cell(8).Value = pt.Revenue;
                row.Cell(8).Style.Font.Bold = true;
                row.Cell(8).Style.Font.FontColor = oxblood;
                row.Cell(8).Style.NumberFormat.Format = "[$₹-en-IN] #,##0.00";

                row.Cell(9).Value = pt.AverageOrderValue;
                row.Cell(9).Style.NumberFormat.Format = "[$₹-en-IN] #,##0.00";

                for (int c = 1; c <= 9; c++)
                {
                    row.Cell(c).Style.Fill.BackgroundColor = rowBg;
                    row.Cell(c).Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
                    row.Cell(c).Style.Border.OutsideBorderColor = XLColor.FromHtml("#E2E8F0");
                }

                rowIdx++;
            }

            // Totals Row
            var totalRow = ws1.Row(rowIdx);
            totalRow.Height = 24;
            totalRow.Cell(1).Value = "TOTAL";
            totalRow.Cell(1).Style.Font.Bold = true;

            totalRow.Cell(2).FormulaA1 = $"SUM(B11:B{rowIdx - 1})";
            totalRow.Cell(2).Style.NumberFormat.Format = "#,##0";

            totalRow.Cell(3).FormulaA1 = $"SUM(C11:C{rowIdx - 1})";
            totalRow.Cell(3).Style.NumberFormat.Format = "#,##0";

            totalRow.Cell(4).FormulaA1 = $"SUM(D11:D{rowIdx - 1})";
            totalRow.Cell(4).Style.NumberFormat.Format = "[$₹-en-IN] #,##0.00";

            totalRow.Cell(5).FormulaA1 = $"SUM(E11:E{rowIdx - 1})";
            totalRow.Cell(5).Style.NumberFormat.Format = "[$₹-en-IN] #,##0.00";

            totalRow.Cell(6).FormulaA1 = $"SUM(F11:F{rowIdx - 1})";
            totalRow.Cell(6).Style.NumberFormat.Format = "[$₹-en-IN] #,##0.00";

            totalRow.Cell(7).FormulaA1 = $"SUM(G11:G{rowIdx - 1})";
            totalRow.Cell(7).Style.NumberFormat.Format = "[$₹-en-IN] #,##0.00";

            totalRow.Cell(8).FormulaA1 = $"SUM(H11:H{rowIdx - 1})";
            totalRow.Cell(8).Style.Font.Bold = true;
            totalRow.Cell(8).Style.Font.FontColor = oxblood;
            totalRow.Cell(8).Style.NumberFormat.Format = "[$₹-en-IN] #,##0.00";

            totalRow.Cell(9).FormulaA1 = $"IF(B{rowIdx}>0, H{rowIdx}/B{rowIdx}, 0)";
            totalRow.Cell(9).Style.NumberFormat.Format = "[$₹-en-IN] #,##0.00";

            for (int c = 1; c <= 9; c++)
            {
                totalRow.Cell(c).Style.Font.Bold = true;
                totalRow.Cell(c).Style.Fill.BackgroundColor = XLColor.FromHtml("#F1F5F9");
                totalRow.Cell(c).Style.Border.TopBorder = XLBorderStyleValues.Thin;
                totalRow.Cell(c).Style.Border.TopBorderColor = XLColor.FromHtml("#64748B");
                totalRow.Cell(c).Style.Border.BottomBorder = XLBorderStyleValues.Double;
                totalRow.Cell(c).Style.Border.BottomBorderColor = darkNavy;
            }
        }
        else
        {
            ws1.Cell(rowIdx, 1).Value = "No order records for the selected period.";
            ws1.Range(rowIdx, 1, rowIdx, 9).Merge().Style.Font.Italic = true;
            ws1.Range(rowIdx, 1, rowIdx, 9).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        }

        ws1.Columns().AdjustToContents(11, 40);

        // ═══════════════════════════════════════════════════════════════════════════
        // SHEET 2: Product Breakdown
        // ═══════════════════════════════════════════════════════════════════════════
        var ws2 = workbook.Worksheets.Add("Products");
        ws2.ShowGridLines = true;

        ws2.Cell("A1").Value = $"{storeName.ToUpperInvariant()} - SALES BY PRODUCT";
        var t2 = ws2.Range("A1:G1");
        t2.Merge();
        t2.Style.Font.Bold = true;
        t2.Style.Font.FontSize = 14;
        t2.Style.Font.FontColor = XLColor.White;
        t2.Style.Fill.BackgroundColor = oxblood;
        t2.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        ws2.Row(1).Height = 30;

        string[] prodHeaders = ["Product Name", "Category", "Units Sold", "Orders Count", "Gross Revenue (INR)", "Net Revenue (INR)", "Revenue Share (%)"];
        for (int i = 0; i < prodHeaders.Length; i++)
        {
            var cell = ws2.Cell(3, i + 1);
            cell.Value = prodHeaders[i];
            cell.Style.Font.Bold = true;
            cell.Style.Font.FontSize = 9.5;
            cell.Style.Font.FontColor = XLColor.White;
            cell.Style.Fill.BackgroundColor = oxblood;
            cell.Style.Alignment.Horizontal = (i <= 1) ? XLAlignmentHorizontalValues.Left : XLAlignmentHorizontalValues.Right;
        }
        ws2.Row(3).Height = 24;

        int pRow = 4;
        if (data?.ProductSales != null && data.ProductSales.Count > 0)
        {
            foreach (var p in data.ProductSales)
            {
                var row = ws2.Row(pRow);
                row.Height = 20;
                var bg = pRow % 2 == 0 ? XLColor.White : XLColor.FromHtml("#F8FAFC");

                row.Cell(1).Value = p.ProductName;
                row.Cell(2).Value = p.CategoryName;
                row.Cell(3).Value = p.UnitsSold;
                row.Cell(3).Style.NumberFormat.Format = "#,##0";
                row.Cell(4).Value = p.OrdersCount;
                row.Cell(4).Style.NumberFormat.Format = "#,##0";
                row.Cell(5).Value = p.GrossRevenue;
                row.Cell(5).Style.NumberFormat.Format = "[$₹-en-IN] #,##0.00";
                row.Cell(6).Value = p.NetRevenue;
                row.Cell(6).Style.Font.Bold = true;
                row.Cell(6).Style.Font.FontColor = oxblood;
                row.Cell(6).Style.NumberFormat.Format = "[$₹-en-IN] #,##0.00";
                row.Cell(7).Value = p.PercentageOfTotal / 100m;
                row.Cell(7).Style.NumberFormat.Format = "0.0%";

                for (int c = 1; c <= 7; c++)
                {
                    row.Cell(c).Style.Fill.BackgroundColor = bg;
                    row.Cell(c).Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
                    row.Cell(c).Style.Border.OutsideBorderColor = XLColor.FromHtml("#E2E8F0");
                }
                pRow++;
            }
        }
        ws2.Columns().AdjustToContents(11, 45);

        // ═══════════════════════════════════════════════════════════════════════════
        // SHEET 3: Category Breakdown
        // ═══════════════════════════════════════════════════════════════════════════
        var ws3 = workbook.Worksheets.Add("Categories");
        ws3.ShowGridLines = true;

        ws3.Cell("A1").Value = $"{storeName.ToUpperInvariant()} - SALES BY CATEGORY";
        var t3 = ws3.Range("A1:E1");
        t3.Merge();
        t3.Style.Font.Bold = true;
        t3.Style.Font.FontSize = 14;
        t3.Style.Font.FontColor = XLColor.White;
        t3.Style.Fill.BackgroundColor = darkNavy;
        t3.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        ws3.Row(1).Height = 30;

        string[] catHeaders = ["Category Name", "Units Sold", "Orders Count", "Total Revenue (INR)", "Revenue Share (%)"];
        for (int i = 0; i < catHeaders.Length; i++)
        {
            var cell = ws3.Cell(3, i + 1);
            cell.Value = catHeaders[i];
            cell.Style.Font.Bold = true;
            cell.Style.Font.FontSize = 9.5;
            cell.Style.Font.FontColor = XLColor.White;
            cell.Style.Fill.BackgroundColor = darkNavy;
            cell.Style.Alignment.Horizontal = (i == 0) ? XLAlignmentHorizontalValues.Left : XLAlignmentHorizontalValues.Right;
        }
        ws3.Row(3).Height = 24;

        int cRow = 4;
        if (data?.CategorySales != null && data.CategorySales.Count > 0)
        {
            foreach (var c in data.CategorySales)
            {
                var row = ws3.Row(cRow);
                row.Height = 20;
                var bg = cRow % 2 == 0 ? XLColor.White : XLColor.FromHtml("#F8FAFC");

                row.Cell(1).Value = c.CategoryName;
                row.Cell(2).Value = c.UnitsSold;
                row.Cell(2).Style.NumberFormat.Format = "#,##0";
                row.Cell(3).Value = c.OrdersCount;
                row.Cell(3).Style.NumberFormat.Format = "#,##0";
                row.Cell(4).Value = c.TotalRevenue;
                row.Cell(4).Style.Font.Bold = true;
                row.Cell(4).Style.Font.FontColor = oxblood;
                row.Cell(4).Style.NumberFormat.Format = "[$₹-en-IN] #,##0.00";
                row.Cell(5).Value = c.PercentageOfTotal / 100m;
                row.Cell(5).Style.NumberFormat.Format = "0.0%";

                for (int col = 1; col <= 5; col++)
                {
                    row.Cell(col).Style.Fill.BackgroundColor = bg;
                    row.Cell(col).Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
                    row.Cell(col).Style.Border.OutsideBorderColor = XLColor.FromHtml("#E2E8F0");
                }
                cRow++;
            }
        }
        ws3.Columns().AdjustToContents(12, 45);

        // ═══════════════════════════════════════════════════════════════════════════
        // SHEET 4: Regional Distribution
        // ═══════════════════════════════════════════════════════════════════════════
        var ws4 = workbook.Worksheets.Add("Regions");
        ws4.ShowGridLines = true;

        ws4.Cell("A1").Value = $"{storeName.ToUpperInvariant()} - SALES BY STATE / REGION";
        var t4 = ws4.Range("A1:D1");
        t4.Merge();
        t4.Style.Font.Bold = true;
        t4.Style.Font.FontSize = 14;
        t4.Style.Font.FontColor = XLColor.White;
        t4.Style.Fill.BackgroundColor = teal;
        t4.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        ws4.Row(1).Height = 30;

        string[] regHeaders = ["State / Region", "Orders Count", "Total Revenue (INR)", "Revenue Share (%)"];
        for (int i = 0; i < regHeaders.Length; i++)
        {
            var cell = ws4.Cell(3, i + 1);
            cell.Value = regHeaders[i];
            cell.Style.Font.Bold = true;
            cell.Style.Font.FontSize = 9.5;
            cell.Style.Font.FontColor = XLColor.White;
            cell.Style.Fill.BackgroundColor = teal;
            cell.Style.Alignment.Horizontal = (i == 0) ? XLAlignmentHorizontalValues.Left : XLAlignmentHorizontalValues.Right;
        }
        ws4.Row(3).Height = 24;

        int rRow = 4;
        if (data?.StateSales != null && data.StateSales.Count > 0)
        {
            foreach (var s in data.StateSales)
            {
                var row = ws4.Row(rRow);
                row.Height = 20;
                var bg = rRow % 2 == 0 ? XLColor.White : XLColor.FromHtml("#F8FAFC");

                row.Cell(1).Value = s.State;
                row.Cell(2).Value = s.OrdersCount;
                row.Cell(2).Style.NumberFormat.Format = "#,##0";
                row.Cell(3).Value = s.TotalRevenue;
                row.Cell(3).Style.Font.Bold = true;
                row.Cell(3).Style.Font.FontColor = oxblood;
                row.Cell(3).Style.NumberFormat.Format = "[$₹-en-IN] #,##0.00";
                row.Cell(4).Value = s.PercentageOfTotal / 100m;
                row.Cell(4).Style.NumberFormat.Format = "0.0%";

                for (int col = 1; col <= 4; col++)
                {
                    row.Cell(col).Style.Fill.BackgroundColor = bg;
                    row.Cell(col).Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
                    row.Cell(col).Style.Border.OutsideBorderColor = XLColor.FromHtml("#E2E8F0");
                }
                rRow++;
            }
        }
        ws4.Columns().AdjustToContents(12, 45);

        // ═══════════════════════════════════════════════════════════════════════════
        // SHEET 5: Coupon Performance
        // ═══════════════════════════════════════════════════════════════════════════
        var ws5 = workbook.Worksheets.Add("Coupons");
        ws5.ShowGridLines = true;

        ws5.Cell("A1").Value = $"{storeName.ToUpperInvariant()} - COUPON REDEMPTION PERFORMANCE";
        var t5 = ws5.Range("A1:D1");
        t5.Merge();
        t5.Style.Font.Bold = true;
        t5.Style.Font.FontSize = 14;
        t5.Style.Font.FontColor = XLColor.White;
        t5.Style.Fill.BackgroundColor = bronze;
        t5.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        ws5.Row(1).Height = 30;

        string[] coupHeaders = ["Coupon Code", "Redemptions", "Total Discount Given (INR)", "Order Revenue Generated (INR)"];
        for (int i = 0; i < coupHeaders.Length; i++)
        {
            var cell = ws5.Cell(3, i + 1);
            cell.Value = coupHeaders[i];
            cell.Style.Font.Bold = true;
            cell.Style.Font.FontSize = 9.5;
            cell.Style.Font.FontColor = XLColor.White;
            cell.Style.Fill.BackgroundColor = bronze;
            cell.Style.Alignment.Horizontal = (i == 0) ? XLAlignmentHorizontalValues.Left : XLAlignmentHorizontalValues.Right;
        }
        ws5.Row(3).Height = 24;

        int cpRow = 4;
        if (data?.CouponSales != null && data.CouponSales.Count > 0)
        {
            foreach (var cp in data.CouponSales)
            {
                var row = ws5.Row(cpRow);
                row.Height = 20;
                var bg = cpRow % 2 == 0 ? XLColor.White : XLColor.FromHtml("#F8FAFC");

                row.Cell(1).Value = cp.CouponCode;
                row.Cell(2).Value = cp.TimesRedeemed;
                row.Cell(2).Style.NumberFormat.Format = "#,##0";
                row.Cell(3).Value = cp.TotalDiscountAmount;
                row.Cell(3).Style.Font.FontColor = oxblood;
                row.Cell(3).Style.NumberFormat.Format = "[$₹-en-IN] #,##0.00";
                row.Cell(4).Value = cp.TotalOrderRevenue;
                row.Cell(4).Style.Font.Bold = true;
                row.Cell(4).Style.Font.FontColor = darkNavy;
                row.Cell(4).Style.NumberFormat.Format = "[$₹-en-IN] #,##0.00";

                for (int col = 1; col <= 4; col++)
                {
                    row.Cell(col).Style.Fill.BackgroundColor = bg;
                    row.Cell(col).Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
                    row.Cell(col).Style.Border.OutsideBorderColor = XLColor.FromHtml("#E2E8F0");
                }
                cpRow++;
            }
        }
        ws5.Columns().AdjustToContents(12, 45);

        using var ms = new MemoryStream();
        workbook.SaveAs(ms);
        var excelBytes = ms.ToArray();
        var fileName = $"SalesReport_{sanitizedStoreName}_{data?.WindowStart:yyyyMMdd}_{data?.WindowEnd:yyyyMMdd}.xlsx";

        return (excelBytes, fileName);
    }

    private static void ApplyCardBorders(IXLRange range)
    {
        range.Style.Border.OutsideBorder = XLBorderStyleValues.Medium;
        range.Style.Border.OutsideBorderColor = XLColor.FromHtml("#CBD5E1");
    }

    private static (DateTime Start, DateTime End) ResolveDateWindow(DateTime? requestedStart, DateTime? requestedEnd)
    {
        var end = (requestedEnd ?? DateTime.UtcNow).Date.AddDays(1).AddTicks(-1);
        var start = (requestedStart ?? DateTime.UtcNow.AddDays(-29)).Date;

        if (start > end)
        {
            (start, end) = (end.Date, start.Date.AddDays(1).AddTicks(-1));
        }

        return (start, end);
    }

    private static IReadOnlyList<AdminSalesTimelinePointDto> BuildTimeline(
        List<Order> orders,
        DateTime start,
        DateTime end,
        string granularity)
    {
        var list = new List<AdminSalesTimelinePointDto>();

        if (granularity == "month")
        {
            var cur = new DateTime(start.Year, start.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var endMonth = new DateTime(end.Year, end.Month, 1, 0, 0, 0, DateTimeKind.Utc);

            while (cur <= endMonth)
            {
                var next = cur.AddMonths(1);
                var periodOrders = orders.Where(o => o.CreatedOn >= cur && o.CreatedOn < next).ToList();
                var rev = periodOrders.Sum(o => o.GrandTotal);
                var count = periodOrders.Count;
                var items = periodOrders.Sum(o => o.Items.Sum(i => i.Quantity));
                var disc = periodOrders.Sum(o => o.ItemDiscountAmount + o.CouponDiscountAmount);
                var ship = periodOrders.Sum(o => o.ShippingAmount);
                var fees = periodOrders.Sum(o => o.PaymentServiceTaxAmount);
                var aov = count > 0 ? Math.Round(rev / count, 2) : 0m;

                list.Add(new AdminSalesTimelinePointDto(
                    PeriodKey: cur.ToString("yyyy-MM"),
                    PeriodLabel: cur.ToString("MMM yyyy"),
                    Revenue: rev,
                    OrdersCount: count,
                    ItemsCount: items,
                    Discounts: disc,
                    Shipping: ship,
                    PaymentProcessingFees: fees,
                    AverageOrderValue: aov
                ));

                cur = next;
            }
        }
        else if (granularity == "week")
        {
            var cur = start.Date;
            // Align to Monday
            while (cur.DayOfWeek != DayOfWeek.Monday && cur > start.AddDays(-7))
            {
                cur = cur.AddDays(-1);
            }

            while (cur <= end)
            {
                var next = cur.AddDays(7);
                var periodOrders = orders.Where(o => o.CreatedOn >= cur && o.CreatedOn < next).ToList();
                var rev = periodOrders.Sum(o => o.GrandTotal);
                var count = periodOrders.Count;
                var items = periodOrders.Sum(o => o.Items.Sum(i => i.Quantity));
                var disc = periodOrders.Sum(o => o.ItemDiscountAmount + o.CouponDiscountAmount);
                var ship = periodOrders.Sum(o => o.ShippingAmount);
                var fees = periodOrders.Sum(o => o.PaymentServiceTaxAmount);
                var aov = count > 0 ? Math.Round(rev / count, 2) : 0m;

                list.Add(new AdminSalesTimelinePointDto(
                    PeriodKey: cur.ToString("yyyy-MM-dd"),
                    PeriodLabel: $"Wk of {cur:dd MMM}",
                    Revenue: rev,
                    OrdersCount: count,
                    ItemsCount: items,
                    Discounts: disc,
                    Shipping: ship,
                    PaymentProcessingFees: fees,
                    AverageOrderValue: aov
                ));

                cur = next;
            }
        }
        else
        {
            // Daily granularity (default)
            var cur = start.Date;
            var endDate = end.Date;

            while (cur <= endDate)
            {
                var next = cur.AddDays(1);
                var periodOrders = orders.Where(o => o.CreatedOn >= cur && o.CreatedOn < next).ToList();
                var rev = periodOrders.Sum(o => o.GrandTotal);
                var count = periodOrders.Count;
                var items = periodOrders.Sum(o => o.Items.Sum(i => i.Quantity));
                var disc = periodOrders.Sum(o => o.ItemDiscountAmount + o.CouponDiscountAmount);
                var ship = periodOrders.Sum(o => o.ShippingAmount);
                var fees = periodOrders.Sum(o => o.PaymentServiceTaxAmount);
                var aov = count > 0 ? Math.Round(rev / count, 2) : 0m;

                list.Add(new AdminSalesTimelinePointDto(
                    PeriodKey: cur.ToString("yyyy-MM-dd"),
                    PeriodLabel: cur.ToString("dd MMM"),
                    Revenue: rev,
                    OrdersCount: count,
                    ItemsCount: items,
                    Discounts: disc,
                    Shipping: ship,
                    PaymentProcessingFees: fees,
                    AverageOrderValue: aov
                ));

                cur = next;
            }
        }

        return list;
    }

    private static string EscapeCsv(string? value) =>
        (value ?? string.Empty).Replace("\"", "\"\"");

    private async Task<string> ResolveStoreNameAsync(CancellationToken cancellationToken)
    {
        try
        {
            var entity = await db.StoreSettings.AsNoTracking().SingleOrDefaultAsync(x => x.Id == 1, cancellationToken);
            if (entity != null && !string.IsNullOrWhiteSpace(entity.SettingsJson))
            {
                using var doc = JsonDocument.Parse(entity.SettingsJson);
                if (doc.RootElement.TryGetProperty("storeName", out var prop) && !string.IsNullOrWhiteSpace(prop.GetString()))
                    return prop.GetString()!.Trim();
                if (doc.RootElement.TryGetProperty("StoreName", out var propCap) && !string.IsNullOrWhiteSpace(propCap.GetString()))
                    return propCap.GetString()!.Trim();
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to resolve store name from settings, using default 'Store'");
        }

        return "Store";
    }
}

