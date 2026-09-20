using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using pramukhraj.Common;
using pramukhraj.Controllers;
using pramukhraj.Database;
using pramukhraj.DTOs.Order;
using pramukhraj.Entities.Order;
using pramukhraj.Entities.Shipment;
using Xunit;

namespace pramukhraj.Tests;

public sealed class Phase3OrderAndTrackingTests
{
    private static async Task<AppDbContext> CreateInMemoryDbContextAsync()
    {
        var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        var options = new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options;
        var db = new AppDbContext(options);
        await db.Database.EnsureCreatedAsync();
        await db.Database.ExecuteSqlRawAsync("PRAGMA foreign_keys = OFF;");
        return db;
    }

    [Fact]
    public async Task PublicOrderTracking_ReturnsBadRequest_WhenQueryIsEmpty()
    {
        await using var db = await CreateInMemoryDbContextAsync();
        var controller = new PublicOrdersController(db);

        var result = await controller.Track("   ", CancellationToken.None);

        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        var response = Assert.IsType<ApiResponse<PublicOrderTrackingResponse>>(badRequest.Value);
        Assert.False(response.Success);
        Assert.Equal(400, response.StatusCode);
    }

    [Fact]
    public async Task PublicOrderTracking_ReturnsNotFound_WhenOrderDoesNotExist()
    {
        await using var db = await CreateInMemoryDbContextAsync();
        var controller = new PublicOrdersController(db);

        var result = await controller.Track("NON-EXISTENT-ORDER-123", CancellationToken.None);

        var notFound = Assert.IsType<NotFoundObjectResult>(result);
        var response = Assert.IsType<ApiResponse<PublicOrderTrackingResponse>>(notFound.Value);
        Assert.False(response.Success);
        Assert.Equal(404, response.StatusCode);
    }

    [Fact]
    public async Task PublicOrderTracking_ReturnsOrder_WhenMatchedByOrderNumber()
    {
        await using var db = await CreateInMemoryDbContextAsync();
        var orderId = Guid.NewGuid();
        var order = new Order
        {
            Id = orderId,
            CustomerId = Guid.NewGuid(),
            CheckoutSessionId = Guid.NewGuid(),
            OrderNumber = "ORD-20260920-X1Y2Z3",
            IdempotencyKey = Guid.NewGuid().ToString(),
            Status = OrderStatus.Confirmed,
            CreatedOn = DateTime.UtcNow
        };

        var shipment = new Shipment
        {
            Id = Guid.NewGuid(),
            OrderId = orderId,
            ProviderOrderId = 123456,
            ProviderShipmentId = 789012,
            CourierName = "BlueDart Express",
            AwbCode = "BLUEDART12345",
            TrackingUrl = "https://shiprocket.co/tracking/BLUEDART12345",
            Status = ShipmentStatus.InTransit,
            CreatedOn = DateTime.UtcNow,
            UpdatedOn = DateTime.UtcNow
        };

        shipment.Activities.Add(new ShipmentActivity
        {
            Id = Guid.NewGuid(),
            ShipmentId = shipment.Id,
            Activity = "In transit to Anand hub",
            Location = "Vadodara Hub",
            Status = "InTransit",
            Date = DateTime.UtcNow,
            CreatedOn = DateTime.UtcNow
        });

        db.Orders.Add(order);
        db.Shipments.Add(shipment);
        await db.SaveChangesAsync();

        var controller = new PublicOrdersController(db);
        var result = await controller.Track("ORD-20260920-X1Y2Z3", CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<PublicOrderTrackingResponse>>(okResult.Value);
        Assert.True(response.Success);
        Assert.NotNull(response.Data);
        Assert.Equal("ORD-20260920-X1Y2Z3", response.Data.OrderNumber);
        Assert.Equal("Confirmed", response.Data.OrderStatus);
        Assert.Equal("InTransit", response.Data.ShipmentStatus);
        Assert.Equal("BlueDart Express", response.Data.CourierName);
        Assert.Equal("BLUEDART12345", response.Data.AwbCode);
        Assert.Single(response.Data.Activities);
        Assert.Equal("In transit to Anand hub", response.Data.Activities[0].Activity);
    }

    [Fact]
    public async Task PublicOrderTracking_ReturnsOrder_WhenMatchedByAwbCode()
    {
        await using var db = await CreateInMemoryDbContextAsync();
        var orderId = Guid.NewGuid();
        var order = new Order
        {
            Id = orderId,
            CustomerId = Guid.NewGuid(),
            CheckoutSessionId = Guid.NewGuid(),
            OrderNumber = "ORD-20260920-AWBTEST",
            IdempotencyKey = Guid.NewGuid().ToString(),
            Status = OrderStatus.Confirmed,
            CreatedOn = DateTime.UtcNow
        };

        var shipment = new Shipment
        {
            Id = Guid.NewGuid(),
            OrderId = orderId,
            CourierName = "Delhivery",
            AwbCode = "DELHIVERY999888",
            TrackingUrl = "https://shiprocket.co/tracking/DELHIVERY999888",
            Status = ShipmentStatus.OutForDelivery,
            CreatedOn = DateTime.UtcNow,
            UpdatedOn = DateTime.UtcNow
        };

        db.Orders.Add(order);
        db.Shipments.Add(shipment);
        await db.SaveChangesAsync();

        var controller = new PublicOrdersController(db);
        var result = await controller.Track("DELHIVERY999888", CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<PublicOrderTrackingResponse>>(okResult.Value);
        Assert.True(response.Success);
        Assert.NotNull(response.Data);
        Assert.Equal("ORD-20260920-AWBTEST", response.Data.OrderNumber);
        Assert.Equal("OutForDelivery", response.Data.ShipmentStatus);
    }
}
