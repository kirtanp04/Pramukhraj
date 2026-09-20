using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pramukhraj.Migrations
{
    /// <inheritdoc />
    public partial class AddPaymentServiceTax : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "PaymentServiceTaxAmount",
                table: "Orders",
                type: "numeric(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "PaymentServiceTaxRatePercent",
                table: "Orders",
                type: "numeric(8,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "ProductTaxAmount",
                table: "Orders",
                type: "numeric(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "ProductTaxRatePercent",
                table: "Orders",
                type: "numeric(8,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "PaymentServiceTaxAmount",
                table: "CheckoutSessions",
                type: "numeric(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "ProductTaxAmount",
                table: "CheckoutSessions",
                type: "numeric(18,2)",
                nullable: false,
                defaultValue: 0m);

            // Existing TaxAmount values contain product tax only. Preserve that
            // breakdown when introducing the separate payment-service charge.
            migrationBuilder.Sql("""
                UPDATE "CheckoutSessions"
                SET "ProductTaxAmount" = "TaxAmount";

                UPDATE "Orders"
                SET "ProductTaxAmount" = "TaxAmount";
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PaymentServiceTaxAmount",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "PaymentServiceTaxRatePercent",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "ProductTaxAmount",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "ProductTaxRatePercent",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "PaymentServiceTaxAmount",
                table: "CheckoutSessions");

            migrationBuilder.DropColumn(
                name: "ProductTaxAmount",
                table: "CheckoutSessions");
        }
    }
}
