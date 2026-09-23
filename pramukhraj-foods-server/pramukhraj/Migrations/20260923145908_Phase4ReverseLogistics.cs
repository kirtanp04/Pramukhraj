using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pramukhraj.Migrations
{
    /// <inheritdoc />
    public partial class Phase4ReverseLogistics : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CourierName",
                table: "ReturnRequests",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeliveredToWarehouseOn",
                table: "ReturnRequests",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PickedUpOn",
                table: "ReturnRequests",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PickupScheduledDate",
                table: "ReturnRequests",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TrackingNumber",
                table: "ReturnRequests",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TrackingUrl",
                table: "ReturnRequests",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsReturnable",
                table: "Products",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsReturnable",
                table: "ProductCategories",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CourierName",
                table: "ReturnRequests");

            migrationBuilder.DropColumn(
                name: "DeliveredToWarehouseOn",
                table: "ReturnRequests");

            migrationBuilder.DropColumn(
                name: "PickedUpOn",
                table: "ReturnRequests");

            migrationBuilder.DropColumn(
                name: "PickupScheduledDate",
                table: "ReturnRequests");

            migrationBuilder.DropColumn(
                name: "TrackingNumber",
                table: "ReturnRequests");

            migrationBuilder.DropColumn(
                name: "TrackingUrl",
                table: "ReturnRequests");

            migrationBuilder.DropColumn(
                name: "IsReturnable",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "IsReturnable",
                table: "ProductCategories");
        }
    }
}
