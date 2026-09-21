using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using pramukhraj.Database;
using pramukhraj.DTOs.Order;
using pramukhraj.Entities.Customer;
using pramukhraj.Entities.Order;
using pramukhraj.Entities.Shipment;
using pramukhraj.Services;
using Xunit;

namespace pramukhraj.Tests;

public sealed class AdminOrderServiceTests
{
    [Fact]
    public async Task GetOrdersAsync_filters_by_status_and_calculates_summary()
    {
        await using var fixture = await AdminOrderServiceFixture.CreateAsync();
        var customer = CreateCustomer("Ramesh Patel", "+919876543210");
        fixture.Db.Customers.Add(customer);

        var order1 = CreateOrder(customer.Id, "ORD-20260921-0001", OrderStatus.Confirmed, 500m);
        var order2 = CreateOrder(customer.Id, "ORD-20260921-0002", OrderStatus.PendingPayment, 250m);
        var order3 = CreateOrder(customer.Id, "ORD-20260921-0003", OrderStatus.Cancelled, 300m);

        fixture.Db.Orders.AddRange(order1, order2, order3);
        await fixture.Db.SaveChangesAsync();

        var response = await fixture.Service.GetOrdersAsync(new AdminOrderListRequest
        {
            Status = AdminOrderStatuses.Confirmed,
            PageNumber = 1,
            PageSize = 10
        });

        Assert.True(response.Success);
        Assert.NotNull(response.Data);
        Assert.Single(response.Data.Items);
        Assert.Equal("ORD-20260921-0001", response.Data.Items[0].OrderNumber);
        Assert.Equal("Ramesh Patel", response.Data.Items[0].Customer.FullName);
        Assert.Equal(3, response.Data.Summary.Total);
        Assert.Equal(1, response.Data.Summary.Confirmed);
        Assert.Equal(1, response.Data.Summary.PendingPayment);
        Assert.Equal(1, response.Data.Summary.Cancelled);
    }

    [Fact]
    public async Task GetOrdersAsync_searches_by_order_number_and_customer()
    {
        await using var fixture = await AdminOrderServiceFixture.CreateAsync();
        var custA = CreateCustomer("Amit Shah", "+919111111111");
        var custB = CreateCustomer("Suresh Raina", "+919222222222");
        fixture.Db.Customers.AddRange(custA, custB);

        var orderA = CreateOrder(custA.Id, "ORD-ALPHA-100", OrderStatus.Confirmed, 1200m);
        var orderB = CreateOrder(custB.Id, "ORD-BETA-200", OrderStatus.Confirmed, 800m);
        fixture.Db.Orders.AddRange(orderA, orderB);
        await fixture.Db.SaveChangesAsync();

        // Search by order number
        var response1 = await fixture.Service.GetOrdersAsync(new AdminOrderListRequest
        {
            Search = "ALPHA",
            PageNumber = 1,
            PageSize = 10
        });
        Assert.True(response1.Success);
        Assert.Single(response1.Data!.Items);
        Assert.Equal("ORD-ALPHA-100", response1.Data.Items[0].OrderNumber);

        // Search by customer name
        var response2 = await fixture.Service.GetOrdersAsync(new AdminOrderListRequest
        {
            Search = "Raina",
            PageNumber = 1,
            PageSize = 10
        });
        Assert.True(response2.Success);
        Assert.Single(response2.Data!.Items);
        Assert.Equal("ORD-BETA-200", response2.Data.Items[0].OrderNumber);
    }

    [Fact]
    public async Task GetOrderDetailAsync_returns_404_when_order_does_not_exist()
    {
        await using var fixture = await AdminOrderServiceFixture.CreateAsync();
        var response = await fixture.Service.GetOrderDetailAsync(Guid.NewGuid());
        Assert.False(response.Success);
        Assert.Equal(404, response.StatusCode);
    }

    [Fact]
    public async Task GetOrderDetailAsync_returns_complete_order_information()
    {
        await using var fixture = await AdminOrderServiceFixture.CreateAsync();
        var customer = CreateCustomer("Pooja Mehta", "+919333333333");
        fixture.Db.Customers.Add(customer);

        var order = CreateOrder(customer.Id, "ORD-FULL-001", OrderStatus.Confirmed, 650m);
        order.CustomerNote = "Handle with care, gift packaging";
        order.CouponCode = "FESTIVE10";
        order.CouponDiscountAmount = 50m;
        order.ShippingAmount = 60m;

        var address = new OrderAddress
        {
            Id = Guid.NewGuid(),
            OrderId = order.Id,
            Type = "Shipping",
            RecipientName = "Pooja Mehta",
            MobileNumber = "+919333333333",
            AddressLine1 = "12 Sunrise Apts",
            City = "Anand",
            State = "Gujarat",
            PostalCode = "388001",
            Country = "India"
        };

        var item = new OrderItem
        {
            Id = Guid.NewGuid(),
            OrderId = order.Id,
            ProductId = Guid.NewGuid(),
            ProductVariantId = Guid.NewGuid(),
            ProductName = "Bhavnagri Gathiya",
            ProductSlug = "bhavnagri-gathiya",
            VariantName = "500gm Pack",
            Sku = "BG-500",
            Weight = 500,
            WeightUnit = "gm",
            Quantity = 2,
            UnitPrice = 270m,
            UnitMrp = 300m,
            TaxPercentage = 5m,
            LineTotal = 540m
        };

        var payment = new Payment
        {
            Id = Guid.NewGuid(),
            OrderId = order.Id,
            IdempotencyKey = Guid.NewGuid().ToString("N"),
            ProviderOrderId = "order_rzp_123",
            ProviderPaymentId = "pay_rzp_456",
            Status = PaymentStatus.Paid,
            AmountPaise = 65000,
            Currency = "INR",
            CreatedOn = DateTime.UtcNow,
            PaidOn = DateTime.UtcNow
        };

        var paymentTx = new PaymentTransaction
        {
            Id = Guid.NewGuid(),
            PaymentId = payment.Id,
            Type = "payment.captured",
            ProviderReference = "pay_rzp_456",
            Status = "Captured",
            SafePayloadJson = "{\"status\":\"captured\"}",
            CreatedOn = DateTime.UtcNow
        };

        var shipment = new Shipment
        {
            Id = Guid.NewGuid(),
            OrderId = order.Id,
            ProviderOrderId = 987654,
            ProviderShipmentId = 876543,
            CourierName = "Delhivery Surface",
            AwbCode = "DEL123456789",
            Status = ShipmentStatus.InTransit,
            CreatedOn = DateTime.UtcNow,
            UpdatedOn = DateTime.UtcNow
        };

        var activity = new ShipmentActivity
        {
            Id = Guid.NewGuid(),
            ShipmentId = shipment.Id,
            Activity = "In Transit - Hub Scan",
            Location = "Ahmedabad Hub",
            Status = "In Transit",
            Date = DateTime.UtcNow
        };

        var history = new OrderStatusHistory
        {
            Id = Guid.NewGuid(),
            OrderId = order.Id,
            Status = OrderStatus.Confirmed,
            Note = "Order confirmed upon payment verification.",
            CreatedOn = DateTime.UtcNow
        };

        fixture.Db.Orders.Add(order);
        fixture.Db.OrderAddresses.Add(address);
        fixture.Db.OrderItems.Add(item);
        fixture.Db.Payments.Add(payment);
        fixture.Db.PaymentTransactions.Add(paymentTx);
        fixture.Db.Shipments.Add(shipment);
        fixture.Db.ShipmentActivities.Add(activity);
        fixture.Db.OrderStatusHistories.Add(history);
        await fixture.Db.SaveChangesAsync();

        var response = await fixture.Service.GetOrderDetailAsync(order.Id);

        Assert.True(response.Success);
        Assert.NotNull(response.Data);
        var detail = response.Data;
        Assert.Equal("ORD-FULL-001", detail.OrderNumber);
        Assert.Equal("Handle with care, gift packaging", detail.CustomerNote);
        Assert.Equal("FESTIVE10", detail.CouponCode);
        Assert.Equal("Pooja Mehta", detail.Customer.FullName);
        Assert.NotNull(detail.ShippingAddress);
        Assert.Equal("Anand", detail.ShippingAddress.City);
        Assert.Single(detail.Items);
        Assert.Equal("Bhavnagri Gathiya", detail.Items[0].ProductName);
        Assert.Single(detail.Payments);
        Assert.Equal("order_rzp_123", detail.Payments[0].ProviderOrderId);
        Assert.Single(detail.Payments[0].Transactions);
        Assert.Single(detail.Shipments);
        Assert.Equal("DEL123456789", detail.Shipments[0].AwbCode);
        Assert.Single(detail.Shipments[0].Activities);
        Assert.Single(detail.StatusHistory);
    }

    private static Customer CreateCustomer(string name, string mobile) => new()
    {
        Id = Guid.NewGuid(),
        FullName = name,
        MobileNumber = mobile,
        Email = $"{name.ToLower().Replace(" ", ".")}@example.com",
        NormalizedEmail = $"{name.ToLower().Replace(" ", ".")}@example.com",
        IsMobileVerified = true,
        IsEmailVerified = true,
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

    private sealed class AdminOrderServiceFixture : IAsyncDisposable
    {
        private readonly SqliteConnection _connection;
        public AppDbContext Db { get; }
        public AdminOrderService Service { get; }

        private AdminOrderServiceFixture(SqliteConnection connection, AppDbContext db, AdminOrderService service)
        {
            _connection = connection;
            Db = db;
            Service = service;
        }

        public static async Task<AdminOrderServiceFixture> CreateAsync()
        {
            var connection = new SqliteConnection("Data Source=:memory:");
            await connection.OpenAsync();
            var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options);
            await db.Database.EnsureCreatedAsync();
            await db.Database.ExecuteSqlRawAsync("PRAGMA foreign_keys = OFF;");
            var service = new AdminOrderService(db, NullLogger<AdminOrderService>.Instance);
            return new AdminOrderServiceFixture(connection, db, service);
        }

        public async ValueTask DisposeAsync()
        {
            await Db.DisposeAsync();
            await _connection.DisposeAsync();
        }
    }
}
