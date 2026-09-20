using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
using pramukhraj.Entities.Order;

namespace pramukhraj.Entities.Shipment;

public enum ShipmentStatus
{
    Created = 1,
    CourierAssigned = 2,
    AwbAssigned = 3,
    PickupScheduled = 4,
    PickedUp = 5,
    InTransit = 6,
    OutForDelivery = 7,
    Delivered = 8,
    DeliveryFailed = 9,
    RtoInitiated = 10,
    RtoDelivered = 11,
    Cancelled = 12
}

[Index(nameof(OrderId))]
[Index(nameof(ProviderOrderId))]
[Index(nameof(ProviderShipmentId))]
[Index(nameof(AwbCode))]
[Index(nameof(Status))]
public sealed class Shipment
{
    [Key]
    public Guid Id { get; set; }

    public Guid OrderId { get; set; }

    public long ProviderOrderId { get; set; }

    public long ProviderShipmentId { get; set; }

    public int? CourierCompanyId { get; set; }

    [MaxLength(100)]
    public string? CourierName { get; set; }

    [MaxLength(100)]
    public string? AwbCode { get; set; }

    [MaxLength(500)]
    public string? TrackingUrl { get; set; }

    [MaxLength(500)]
    public string? LabelUrl { get; set; }

    [MaxLength(500)]
    public string? ManifestUrl { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal ProviderShippingCharge { get; set; }

    public DateTime? EstimatedDeliveryOn { get; set; }

    public ShipmentStatus Status { get; set; } = ShipmentStatus.Created;

    [MaxLength(50)]
    public string? ProviderStatus { get; set; }

    public int? ProviderStatusCode { get; set; }

    public DateTime? PickupScheduledOn { get; set; }

    public DateTime? ShippedOn { get; set; }

    public DateTime? DeliveredOn { get; set; }

    [MaxLength(500)]
    public string? LastError { get; set; }

    public DateTime CreatedOn { get; set; }

    public DateTime UpdatedOn { get; set; }

    [MaxLength(64), ConcurrencyCheck]
    public string ConcurrencyStamp { get; set; } = Guid.NewGuid().ToString("N");

    public Order.Order Order { get; set; } = null!;

    public ICollection<ShipmentActivity> Activities { get; set; } = [];
}

[Index(nameof(ShipmentId), nameof(Date))]
public sealed class ShipmentActivity
{
    [Key]
    public Guid Id { get; set; }

    public Guid ShipmentId { get; set; }

    [MaxLength(500)]
    public string Activity { get; set; } = string.Empty;

    [MaxLength(150)]
    public string? Location { get; set; }

    [MaxLength(50)]
    public string? Status { get; set; }

    public DateTime Date { get; set; }

    public DateTime CreatedOn { get; set; }

    public Shipment Shipment { get; set; } = null!;
}

