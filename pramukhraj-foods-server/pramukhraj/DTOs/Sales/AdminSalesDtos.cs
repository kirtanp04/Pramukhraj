namespace pramukhraj.DTOs.Sales;

public sealed record AdminSalesReportRequest(
    DateTime? StartDate = null,
    DateTime? EndDate = null,
    string? Status = "Confirmed",
    string? Granularity = "day",
    bool Refresh = false,
    string? Format = null
);

public sealed record AdminSalesSummaryDto(
    decimal GrossSales,
    decimal NetRevenue,
    int TotalOrders,
    decimal AverageOrderValue,
    int TotalItemsSold,
    decimal ItemDiscounts,
    decimal CouponDiscounts,
    decimal TotalDiscounts,
    decimal ShippingFeesCollected,
    decimal PaymentProcessingFeesCollected,
    decimal RepeatCustomerRatePercent,
    decimal PreviousPeriodRevenue,
    decimal RevenueGrowthPercent
);

public sealed record AdminSalesTimelinePointDto(
    string PeriodKey,
    string PeriodLabel,
    decimal Revenue,
    int OrdersCount,
    int ItemsCount,
    decimal Discounts,
    decimal Shipping,
    decimal PaymentProcessingFees,
    decimal AverageOrderValue
);

public sealed record AdminProductSalesDto(
    Guid ProductId,
    string ProductName,
    string CategoryName,
    int UnitsSold,
    int OrdersCount,
    decimal GrossRevenue,
    decimal NetRevenue,
    decimal PercentageOfTotal
);

public sealed record AdminCategorySalesDto(
    Guid CategoryId,
    string CategoryName,
    int UnitsSold,
    int OrdersCount,
    decimal TotalRevenue,
    decimal PercentageOfTotal
);

public sealed record AdminCouponSalesDto(
    string CouponCode,
    int TimesRedeemed,
    decimal TotalDiscountAmount,
    decimal TotalOrderRevenue
);

public sealed record AdminStateSalesDto(
    string State,
    int OrdersCount,
    decimal TotalRevenue,
    decimal PercentageOfTotal
);

public sealed record AdminSalesReportResponse(
    AdminSalesSummaryDto Summary,
    IReadOnlyList<AdminSalesTimelinePointDto> Timeline,
    IReadOnlyList<AdminProductSalesDto> ProductSales,
    IReadOnlyList<AdminCategorySalesDto> CategorySales,
    IReadOnlyList<AdminCouponSalesDto> CouponSales,
    IReadOnlyList<AdminStateSalesDto> StateSales,
    DateTime WindowStart,
    DateTime WindowEnd,
    string StatusFilter,
    string Granularity
);

