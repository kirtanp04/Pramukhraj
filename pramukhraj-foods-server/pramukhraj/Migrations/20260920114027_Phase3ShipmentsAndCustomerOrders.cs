using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pramukhraj.Migrations
{
    /// <inheritdoc />
    public partial class Phase3ShipmentsAndCustomerOrders : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Shipments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OrderId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProviderOrderId = table.Column<long>(type: "bigint", nullable: false),
                    ProviderShipmentId = table.Column<long>(type: "bigint", nullable: false),
                    CourierCompanyId = table.Column<int>(type: "integer", nullable: true),
                    CourierName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    AwbCode = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    TrackingUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    LabelUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ManifestUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ProviderShippingCharge = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    EstimatedDeliveryOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    ProviderStatus = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    ProviderStatusCode = table.Column<int>(type: "integer", nullable: true),
                    PickupScheduledOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ShippedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeliveredOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastError = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ConcurrencyStamp = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Shipments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Shipments_Orders_OrderId",
                        column: x => x.OrderId,
                        principalTable: "Orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ShipmentActivities",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ShipmentId = table.Column<Guid>(type: "uuid", nullable: false),
                    Activity = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Location = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShipmentActivities", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ShipmentActivities_Shipments_ShipmentId",
                        column: x => x.ShipmentId,
                        principalTable: "Shipments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ShipmentActivities_ShipmentId_Date",
                table: "ShipmentActivities",
                columns: new[] { "ShipmentId", "Date" });

            migrationBuilder.CreateIndex(
                name: "IX_Shipments_AwbCode",
                table: "Shipments",
                column: "AwbCode");

            migrationBuilder.CreateIndex(
                name: "IX_Shipments_OrderId",
                table: "Shipments",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_Shipments_ProviderOrderId",
                table: "Shipments",
                column: "ProviderOrderId");

            migrationBuilder.CreateIndex(
                name: "IX_Shipments_ProviderShipmentId",
                table: "Shipments",
                column: "ProviderShipmentId");

            migrationBuilder.CreateIndex(
                name: "IX_Shipments_Status",
                table: "Shipments",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ShipmentActivities");

            migrationBuilder.DropTable(
                name: "Shipments");
        }
    }
}
