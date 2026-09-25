using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pramukhraj.Migrations
{
    /// <inheritdoc />
    public partial class AddRefundBreakdownColumnsToReturnRequest : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "PaymentFeeRefundAmount",
                table: "ReturnRequests",
                type: "numeric(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "ProductRefundAmount",
                table: "ReturnRequests",
                type: "numeric(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "ShippingRefundAmount",
                table: "ReturnRequests",
                type: "numeric(18,2)",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PaymentFeeRefundAmount",
                table: "ReturnRequests");

            migrationBuilder.DropColumn(
                name: "ProductRefundAmount",
                table: "ReturnRequests");

            migrationBuilder.DropColumn(
                name: "ShippingRefundAmount",
                table: "ReturnRequests");
        }
    }
}
