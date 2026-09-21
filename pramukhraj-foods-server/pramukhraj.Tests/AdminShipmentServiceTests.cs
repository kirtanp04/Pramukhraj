using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using pramukhraj.Database;
using pramukhraj.DTOs.Shipment;
using pramukhraj.Entities.Customer;
using pramukhraj.Entities.Order;
using pramukhraj.Entities.Shipment;
using pramukhraj.Services;
using Xunit;

namespace pramukhraj.Tests;

public sealed class AdminShipmentServiceTests
{
    [Fact]
    public async Task GetShipmentsAsync_filters_by_status_and_calculates_summary()
    {
        await using var fixture = await AdminShipmentServiceFixture.CreateAsync();
        var customer = CreateCustomer("Ramesh Patel", "+919876543210");
        fixture.Db.Customers.Add(customer);

        var order1 = CreateOrder(customer.Id, "ORD-20260921-0001", OrderStatus.Confirmed, 500m);
        var order2 = CreateOrder(customer.Id, "ORD-20260921-0002", OrderStatus.Confirmed, 750m);
        var order3 = CreateOrder(customer.Id, "ORD-20260921-0003", OrderStatus.Confirmed, 900m);
        var order4 = CreateOrder(customer.Id, "ORD-20260921-0004", OrderStatus.Confirmed, 400m);
        fixture.Db.Orders.AddRange(order1, order2, order3, order4);

        var shipment1 = CreateShipment(order1.Id, ShipmentStatus.Created, 85m, "AWB1001", "Bluedart");
        var shipment2 = CreateShipment(order2.Id, ShipmentStatus.InTransit, 95m, "AWB1002", "Delhivery");
        var shipment3 = CreateShipment(order3.Id, ShipmentStatus.Delivered, 110m, "AWB1003", "Ekart");
        var shipment4 = CreateShipment(order4.Id, ShipmentStatus.DeliveryFailed, 70m, "AWB1004", "Shadowfax");
        fixture.Db.Shipments.AddRange(shipment1, shipment2, shipment3, shipment4);

        await fixture.Db.SaveChangesAsync();

        // 1. Filter by PendingPickup (includes Created)
        var responsePending = await fixture.Service.GetShipmentsAsync(new AdminShipmentListRequest
        {
            Status = AdminShipmentStatuses.PendingPickup,
            PageNumber = 1,
            PageSize = 10
        });

        Assert.True(responsePending.Success);
        Assert.NotNull(responsePending.Data);
        Assert.Single(responsePending.Data.Items);
        Assert.Equal("AWB1001", responsePending.Data.Items[0].AwbCode);
        Assert.Equal("Bluedart", responsePending.Data.Items[0].CourierName);
        Assert.Equal("ORD-20260921-0001", responsePending.Data.Items[0].Order.OrderNumber);

        // Summary counters across all shipments
        Assert.Equal(4, responsePending.Data.Summary.Total);
        Assert.Equal(1, responsePending.Data.Summary.PendingPickup);
        Assert.Equal(1, responsePending.Data.Summary.InTransit);
        Assert.Equal(1, responsePending.Data.Summary.Delivered);
        Assert.Equal(1, responsePending.Data.Summary.FailedOrRto);
        Assert.Equal(360m, responsePending.Data.Summary.TotalShippingCharges);

        // 2. Filter by InTransit
        var responseTransit = await fixture.Service.GetShipmentsAsync(new AdminShipmentListRequest
        {
            Status = AdminShipmentStatuses.InTransit,
            PageNumber = 1,
            PageSize = 10
        });
        Assert.True(responseTransit.Success);
        Assert.Single(responseTransit.Data!.Items);
        Assert.Equal("AWB1002", responseTransit.Data.Items[0].AwbCode);

        // 3. Filter by Delivered
        var responseDelivered = await fixture.Service.GetShipmentsAsync(new AdminShipmentListRequest
        {
            Status = AdminShipmentStatuses.Delivered,
            PageNumber = 1,
            PageSize = 10
        });
        Assert.True(responseDelivered.Success);
        Assert.Single(responseDelivered.Data!.Items);
        Assert.Equal("AWB1003", responseDelivered.Data.Items[0].AwbCode);

        // 4. Filter by FailedOrRto
        var responseFailed = await fixture.Service.GetShipmentsAsync(new AdminShipmentListRequest
        {
            Status = AdminShipmentStatuses.FailedOrRto,
            PageNumber = 1,
            PageSize = 10
        });
        Assert.True(responseFailed.Success);
        Assert.Single(responseFailed.Data!.Items);
        Assert.Equal("AWB1004", responseFailed.Data.Items[0].AwbCode);
    }

    [Fact]
    public async Task GetShipmentsAsync_searches_by_awb_courier_ordernumber_customer_and_city()
    {
        await using var fixture = await AdminShipmentServiceFixture.CreateAsync();
        var custA = CreateCustomer("Amit Shah", "+919111111111");
        custA.City = "Ahmedabad";
        var custB = CreateCustomer("Suresh Raina", "+919222222222");
        custB.City = "Vadodara";
        fixture.Db.Customers.AddRange(custA, custB);

        var orderA = CreateOrder(custA.Id, "ORD-ALPHA-100", OrderStatus.Confirmed, 1200m);
        var orderB = CreateOrder(custB.Id, "ORD-BETA-200", OrderStatus.Confirmed, 800m);
        fixture.Db.Orders.AddRange(orderA, orderB);

        var shipmentA = CreateShipment(orderA.Id, ShipmentStatus.InTransit, 120m, "AWB-SPEED-999", "Bluedart Express");
        var shipmentB = CreateShipment(orderB.Id, ShipmentStatus.InTransit, 80m, "AWB-CARGO-888", "DTDC Cargo");
        fixture.Db.Shipments.AddRange(shipmentA, shipmentB);
        await fixture.Db.SaveChangesAsync();

        // Search by AWB
        var res1 = await fixture.Service.GetShipmentsAsync(new AdminShipmentListRequest { Search = "SPEED-999" });
        Assert.True(res1.Success);
        Assert.Single(res1.Data!.Items);
        Assert.Equal("AWB-SPEED-999", res1.Data.Items[0].AwbCode);

        // Search by Courier Name
        var res2 = await fixture.Service.GetShipmentsAsync(new AdminShipmentListRequest { Search = "DTDC" });
        Assert.True(res2.Success);
        Assert.Single(res2.Data!.Items);
        Assert.Equal("DTDC Cargo", res2.Data.Items[0].CourierName);

        // Search by Order Number
        var res3 = await fixture.Service.GetShipmentsAsync(new AdminShipmentListRequest { Search = "ALPHA-100" });
        Assert.True(res3.Success);
        Assert.Single(res3.Data!.Items);
        Assert.Equal("ORD-ALPHA-100", res3.Data.Items[0].Order.OrderNumber);

        // Search by Customer Name
        var res4 = await fixture.Service.GetShipmentsAsync(new AdminShipmentListRequest { Search = "Raina" });
        Assert.True(res4.Success);
        Assert.Single(res4.Data!.Items);
        Assert.Equal("Suresh Raina", res4.Data.Items[0].Customer.FullName);

        // Search by Customer City
        var res5 = await fixture.Service.GetShipmentsAsync(new AdminShipmentListRequest { Search = "Ahmedabad" });
        Assert.True(res5.Success);
        Assert.Single(res5.Data!.Items);
        Assert.Equal("Amit Shah", res5.Data.Items[0].Customer.FullName);
    }

    [Fact]
    public async Task GetShipmentDetailAsync_returns_404_when_shipment_not_found()
    {
        await using var fixture = await AdminShipmentServiceFixture.CreateAsync();
        var nonExistentId = Guid.NewGuid();

        var response = await fixture.Service.GetShipmentDetailAsync(nonExistentId);

        Assert.False(response.Success);
        Assert.Equal(404, response.StatusCode);
        Assert.Contains("not found", response.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task GetShipmentDetailAsync_returns_full_shipment_details_with_activities_and_order_items()
    {
        await using var fixture = await AdminShipmentServiceFixture.CreateAsync();
        var customer = CreateCustomer("Pooja Mehta", "+919988776655");
        fixture.Db.Customers.Add(customer);

        var order = CreateOrder(customer.Id, "ORD-SHIP-FULL-001", OrderStatus.Confirmed, 650m);
        order.ShippingAmount = 80m;
        order.TaxAmount = 32.5m;
        order.CouponDiscountAmount = 50m;

        var orderItem = new OrderItem
        {
            Id = Guid.NewGuid(),
            OrderId = order.Id,
            ProductId = Guid.NewGuid(),
            ProductVariantId = Guid.NewGuid(),
            Sku = "SKU-KHK-01",
            ProductName = "Methi Khakhra",
            ProductSlug = "methi-khakhra",
            VariantName = "Standard",
            Quantity = 2,
            UnitPrice = 250m,
            UnitMrp = 300m,
            LineTotal = 500m
        };
        order.Items.Add(orderItem);

        var shippingAddress = new OrderAddress
        {
            Id = Guid.NewGuid(),
            OrderId = order.Id,
            Type = "Shipping",
            RecipientName = "Pooja Mehta",
            MobileNumber = "+919988776655",
            AddressLine1 = "B-402, Shivalik Heights",
            AddressLine2 = "Near Iscon Mall, SG Highway",
            City = "Ahmedabad",
            State = "Gujarat",
            PostalCode = "380015",
            Country = "India"
        };
        order.Addresses.Add(shippingAddress);

        fixture.Db.Orders.Add(order);

        var shipment = CreateShipment(order.Id, ShipmentStatus.InTransit, 80m, "AWB-POOJA-777", "Shiprocket Bluedart");
        shipment.LabelUrl = "https://shiprocket.co/label/777.pdf";
        shipment.ManifestUrl = "https://shiprocket.co/manifest/777.pdf";
        shipment.TrackingUrl = "https://shiprocket.co/track/777";
        shipment.EstimatedDeliveryOn = DateTime.UtcNow.AddDays(2);
        shipment.PickupScheduledOn = DateTime.UtcNow.AddDays(-1);
        shipment.ShippedOn = DateTime.UtcNow.AddHours(-12);

        var activity1 = new ShipmentActivity
        {
            Id = Guid.NewGuid(),
            ShipmentId = shipment.Id,
            Activity = "Shipment picked up from seller warehouse",
            Location = "Surat Hub",
            Status = "Picked Up",
            Date = DateTime.UtcNow.AddHours(-12),
            CreatedOn = DateTime.UtcNow.AddHours(-12)
        };

        var activity2 = new ShipmentActivity
        {
            Id = Guid.NewGuid(),
            ShipmentId = shipment.Id,
            Activity = "In transit to destination facility",
            Location = "Ahmedabad Transit Facility",
            Status = "In Transit",
            Date = DateTime.UtcNow.AddHours(-2),
            CreatedOn = DateTime.UtcNow.AddHours(-2)
        };

        shipment.Activities.Add(activity1);
        shipment.Activities.Add(activity2);
        fixture.Db.Shipments.Add(shipment);

        await fixture.Db.SaveChangesAsync();

        var response = await fixture.Service.GetShipmentDetailAsync(shipment.Id);

        Assert.True(response.Success);
        Assert.NotNull(response.Data);
        Assert.Equal(shipment.Id, response.Data.Id);
        Assert.Equal("AWB-POOJA-777", response.Data.AwbCode);
        Assert.Equal("Shiprocket Bluedart", response.Data.CourierName);
        Assert.Equal("InTransit", response.Data.Status);
        Assert.Equal(80m, response.Data.ProviderShippingCharge);
        Assert.Equal("https://shiprocket.co/label/777.pdf", response.Data.LabelUrl);
        Assert.Equal("https://shiprocket.co/manifest/777.pdf", response.Data.ManifestUrl);
        Assert.Equal("https://shiprocket.co/track/777", response.Data.TrackingUrl);

        // Order & Customer
        Assert.Equal("ORD-SHIP-FULL-001", response.Data.Order.OrderNumber);
        Assert.Single(response.Data.Order.Items);
        Assert.Equal("Methi Khakhra", response.Data.Order.Items[0].ProductName);
        Assert.Equal("Pooja Mehta", response.Data.Customer.FullName);
        Assert.NotNull(response.Data.Order.ShippingAddress);
        Assert.Equal("Ahmedabad", response.Data.Order.ShippingAddress!.City);

        // Activities chronologically ordered descending (latest first)
        Assert.Equal(2, response.Data.Activities.Count);
        Assert.Equal("In transit to destination facility", response.Data.Activities[0].Activity);
        Assert.Equal("Shipment picked up from seller warehouse", response.Data.Activities[1].Activity);
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

    private static Shipment CreateShipment(Guid orderId, ShipmentStatus status, decimal shippingCharge, string awbCode, string courierName) => new()
    {
        Id = Guid.NewGuid(),
        OrderId = orderId,
        ProviderOrderId = Random.Shared.NextInt64(100000, 999999),
        ProviderShipmentId = Random.Shared.NextInt64(100000, 999999),
        CourierCompanyId = 1,
        CourierName = courierName,
        AwbCode = awbCode,
        ProviderShippingCharge = shippingCharge,
        Status = status,
        CreatedOn = DateTime.UtcNow,
        UpdatedOn = DateTime.UtcNow
    };

    private sealed class AdminShipmentServiceFixture : IAsyncDisposable
    {
        private readonly SqliteConnection _connection;
        public AppDbContext Db { get; }
        public AdminShipmentService Service { get; }

        private AdminShipmentServiceFixture(SqliteConnection connection, AppDbContext db, AdminShipmentService service)
        {
            _connection = connection;
            Db = db;
            Service = service;
        }

        public static async Task<AdminShipmentServiceFixture> CreateAsync()
        {
            var connection = new SqliteConnection("Data Source=:memory:");
            await connection.OpenAsync();
            var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options);
            await db.Database.EnsureCreatedAsync();
            await db.Database.ExecuteSqlRawAsync("PRAGMA foreign_keys = OFF;");
            var service = new AdminShipmentService(db, NullLogger<AdminShipmentService>.Instance);
            return new AdminShipmentServiceFixture(connection, db, service);
        }

        public async ValueTask DisposeAsync()
        {
            await Db.DisposeAsync();
            await _connection.DisposeAsync();
        }
    }
}

