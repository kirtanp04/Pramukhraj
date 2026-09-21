using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using pramukhraj.Database;
using pramukhraj.DTOs.Payment;
using pramukhraj.Entities.Customer;
using pramukhraj.Entities.Order;
using pramukhraj.Services;
using Xunit;

namespace pramukhraj.Tests;

public sealed class AdminPaymentServiceTests
{
    [Fact]
    public async Task GetPaymentsAsync_filters_by_status_and_calculates_summary()
    {
        await using var fixture = await AdminPaymentServiceFixture.CreateAsync();
        var customer = CreateCustomer("Ramesh Patel", "+919876543210");
        fixture.Db.Customers.Add(customer);

        var order1 = CreateOrder(customer.Id, "ORD-20260921-0001", OrderStatus.Confirmed, 500m);
        var order2 = CreateOrder(customer.Id, "ORD-20260921-0002", OrderStatus.PendingPayment, 250m);
        var order3 = CreateOrder(customer.Id, "ORD-20260921-0003", OrderStatus.PaymentFailed, 300m);
        fixture.Db.Orders.AddRange(order1, order2, order3);

        var payment1 = CreatePayment(order1.Id, 50000, PaymentStatus.Paid, "pay_111", "order_111");
        payment1.PaidOn = DateTime.UtcNow;
        var payment2 = CreatePayment(order2.Id, 25000, PaymentStatus.Pending, null, "order_222");
        var payment3 = CreatePayment(order3.Id, 30000, PaymentStatus.Failed, "pay_333", "order_333");
        fixture.Db.Payments.AddRange(payment1, payment2, payment3);

        await fixture.Db.SaveChangesAsync();

        var response = await fixture.Service.GetPaymentsAsync(new AdminPaymentListRequest
        {
            Status = AdminPaymentStatuses.Paid,
            PageNumber = 1,
            PageSize = 10
        });

        Assert.True(response.Success);
        Assert.NotNull(response.Data);
        Assert.Single(response.Data.Items);
        Assert.Equal(500m, response.Data.Items[0].Amount);
        Assert.Equal("pay_111", response.Data.Items[0].ProviderPaymentId);
        Assert.Equal("ORD-20260921-0001", response.Data.Items[0].OrderNumber);
        Assert.Equal("Ramesh Patel", response.Data.Items[0].Customer.FullName);
        Assert.Equal(3, response.Data.Summary.Total);
        Assert.Equal(1, response.Data.Summary.Paid);
        Assert.Equal(1, response.Data.Summary.Pending);
        Assert.Equal(1, response.Data.Summary.Failed);
        Assert.Equal(500m, response.Data.Summary.TotalPaidAmount);
    }

    [Fact]
    public async Task GetPaymentsAsync_searches_by_provider_payment_id_and_order_number_and_customer()
    {
        await using var fixture = await AdminPaymentServiceFixture.CreateAsync();
        var custA = CreateCustomer("Amit Shah", "+919111111111");
        var custB = CreateCustomer("Suresh Raina", "+919222222222");
        fixture.Db.Customers.AddRange(custA, custB);

        var orderA = CreateOrder(custA.Id, "ORD-ALPHA-100", OrderStatus.Confirmed, 1200m);
        var orderB = CreateOrder(custB.Id, "ORD-BETA-200", OrderStatus.Confirmed, 800m);
        fixture.Db.Orders.AddRange(orderA, orderB);

        var paymentA = CreatePayment(orderA.Id, 120000, PaymentStatus.Paid, "pay_alpha_999", "order_alpha_123");
        var paymentB = CreatePayment(orderB.Id, 80000, PaymentStatus.Paid, "pay_beta_888", "order_beta_456");
        fixture.Db.Payments.AddRange(paymentA, paymentB);
        await fixture.Db.SaveChangesAsync();

        // Search by provider payment ID
        var response1 = await fixture.Service.GetPaymentsAsync(new AdminPaymentListRequest
        {
            Search = "alpha_999",
            PageNumber = 1,
            PageSize = 10
        });
        Assert.True(response1.Success);
        Assert.Single(response1.Data!.Items);
        Assert.Equal("pay_alpha_999", response1.Data.Items[0].ProviderPaymentId);

        // Search by order number
        var response2 = await fixture.Service.GetPaymentsAsync(new AdminPaymentListRequest
        {
            Search = "BETA-200",
            PageNumber = 1,
            PageSize = 10
        });
        Assert.True(response2.Success);
        Assert.Single(response2.Data!.Items);
        Assert.Equal("ORD-BETA-200", response2.Data.Items[0].OrderNumber);

        // Search by customer name
        var response3 = await fixture.Service.GetPaymentsAsync(new AdminPaymentListRequest
        {
            Search = "Raina",
            PageNumber = 1,
            PageSize = 10
        });
        Assert.True(response3.Success);
        Assert.Single(response3.Data!.Items);
        Assert.Equal("Suresh Raina", response3.Data.Items[0].Customer.FullName);
    }

    [Fact]
    public async Task GetPaymentDetailAsync_returns_404_when_payment_does_not_exist()
    {
        await using var fixture = await AdminPaymentServiceFixture.CreateAsync();
        var response = await fixture.Service.GetPaymentDetailAsync(Guid.NewGuid());
        Assert.False(response.Success);
        Assert.Equal(404, response.StatusCode);
    }

    [Fact]
    public async Task GetPaymentDetailAsync_returns_complete_payment_information()
    {
        await using var fixture = await AdminPaymentServiceFixture.CreateAsync();
        var customer = CreateCustomer("Pooja Mehta", "+919333333333");
        fixture.Db.Customers.Add(customer);

        var order = CreateOrder(customer.Id, "ORD-FULL-001", OrderStatus.Confirmed, 650m);
        order.Items.Add(new OrderItem
        {
            Id = Guid.NewGuid(),
            OrderId = order.Id,
            ProductId = Guid.NewGuid(),
            ProductVariantId = Guid.NewGuid(),
            ProductName = "Khakhra Special",
            ProductSlug = "khakhra-special",
            VariantName = "500g Pack",
            Sku = "KHK-500",
            Weight = 500m,
            WeightUnit = "gm",
            Quantity = 2,
            UnitPrice = 325m,
            UnitMrp = 350m,
            TaxPercentage = 5m,
            TaxableAmount = 619.05m,
            DiscountAmount = 50m,
            TaxAmount = 30.95m,
            LineTotal = 650m
        });
        order.Addresses.Add(new OrderAddress
        {
            Id = Guid.NewGuid(),
            OrderId = order.Id,
            Type = "Shipping",
            RecipientName = "Pooja Mehta",
            MobileNumber = "+919333333333",
            AddressLine1 = "101, Lotus Heights",
            City = "Ahmedabad",
            State = "Gujarat",
            PostalCode = "380015",
            Country = "India"
        });
        fixture.Db.Orders.Add(order);

        var payment = CreatePayment(order.Id, 65000, PaymentStatus.Paid, "pay_pooja_123", "order_pooja_789");
        payment.PaidOn = DateTime.UtcNow;
        fixture.Db.Payments.Add(payment);

        fixture.Db.PaymentTransactions.Add(new PaymentTransaction
        {
            Id = Guid.NewGuid(),
            PaymentId = payment.Id,
            Type = "Captured",
            ProviderReference = "pay_pooja_123",
            Status = "Captured",
            SafePayloadJson = "{\"status\":\"captured\"}",
            CreatedOn = DateTime.UtcNow
        });

        await fixture.Db.SaveChangesAsync();

        var response = await fixture.Service.GetPaymentDetailAsync(payment.Id);

        Assert.True(response.Success);
        Assert.NotNull(response.Data);
        Assert.Equal(payment.Id, response.Data.Id);
        Assert.Equal("ORD-FULL-001", response.Data.OrderNumber);
        Assert.Equal("pay_pooja_123", response.Data.ProviderPaymentId);
        Assert.Equal("order_pooja_789", response.Data.ProviderOrderId);
        Assert.Equal(650m, response.Data.Amount);
        Assert.Equal("Paid", response.Data.Status);
        Assert.Equal("Pooja Mehta", response.Data.Customer.FullName);
        Assert.Single(response.Data.Order.Items);
        Assert.Equal("Khakhra Special", response.Data.Order.Items[0].ProductName);
        Assert.NotNull(response.Data.Order.ShippingAddress);
        Assert.Equal("Ahmedabad", response.Data.Order.ShippingAddress!.City);
        Assert.Single(response.Data.Transactions);
        Assert.Equal("Captured", response.Data.Transactions[0].Type);
    }

    private static Customer CreateCustomer(string fullName, string mobile) => new()
    {
        Id = Guid.NewGuid(),
        FullName = fullName,
        MobileNumber = mobile,
        Email = $"{fullName.Replace(" ", "").ToLower()}@example.com",
        City = "Surat",
        State = "Gujarat",
        PostalCode = "395007",
        IsActive = true,
        IsMobileVerified = true,
        IsEmailVerified = true,
        IsProfileCompleted = true,
        CreatedOn = DateTime.UtcNow,
        UpdatedOn = DateTime.UtcNow
    };

    private static Order CreateOrder(Guid customerId, string orderNumber, OrderStatus status, decimal grandTotal) => new()
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
        CreatedOn = DateTime.UtcNow,
        UpdatedOn = DateTime.UtcNow,
        PaymentExpiresOn = DateTime.UtcNow.AddMinutes(30)
    };

    private static Payment CreatePayment(Guid orderId, long amountPaise, PaymentStatus status, string? providerPaymentId, string? providerOrderId) => new()
    {
        Id = Guid.NewGuid(),
        OrderId = orderId,
        IdempotencyKey = Guid.NewGuid().ToString("N"),
        ProviderOrderId = providerOrderId,
        ProviderPaymentId = providerPaymentId,
        Status = status,
        AmountPaise = amountPaise,
        Currency = "INR",
        CreatedOn = DateTime.UtcNow,
        UpdatedOn = DateTime.UtcNow,
        ExpiresOn = DateTime.UtcNow.AddMinutes(30)
    };

    private sealed class AdminPaymentServiceFixture : IAsyncDisposable
    {
        private readonly SqliteConnection _connection;
        public AppDbContext Db { get; }
        public AdminPaymentService Service { get; }

        private AdminPaymentServiceFixture(SqliteConnection connection, AppDbContext db, AdminPaymentService service)
        {
            _connection = connection;
            Db = db;
            Service = service;
        }

        public static async Task<AdminPaymentServiceFixture> CreateAsync()
        {
            var connection = new SqliteConnection("Data Source=:memory:");
            await connection.OpenAsync();
            var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options);
            await db.Database.EnsureCreatedAsync();
            await db.Database.ExecuteSqlRawAsync("PRAGMA foreign_keys = OFF;");
            var service = new AdminPaymentService(db, NullLogger<AdminPaymentService>.Instance);
            return new AdminPaymentServiceFixture(connection, db, service);
        }

        public async ValueTask DisposeAsync()
        {
            await Db.DisposeAsync();
            await _connection.DisposeAsync();
        }
    }
}

