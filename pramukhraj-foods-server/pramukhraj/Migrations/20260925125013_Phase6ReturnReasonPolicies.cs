using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace pramukhraj.Migrations
{
    /// <inheritdoc />
    public partial class Phase6ReturnReasonPolicies : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ReturnReasonPolicies",
                columns: table => new
                {
                    Reason = table.Column<int>(type: "integer", nullable: false),
                    RefundProductAmount = table.Column<bool>(type: "boolean", nullable: false),
                    RefundShippingAmount = table.Column<bool>(type: "boolean", nullable: false),
                    RefundPaymentFee = table.Column<bool>(type: "boolean", nullable: false),
                    UpdatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReturnReasonPolicies", x => x.Reason);
                });

            migrationBuilder.InsertData(
                table: "ReturnReasonPolicies",
                columns: new[] { "Reason", "RefundPaymentFee", "RefundProductAmount", "RefundShippingAmount", "UpdatedOn" },
                values: new object[,]
                {
                    { 1, true, true, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { 2, true, true, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { 3, true, true, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { 4, false, true, false, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { 5, false, true, false, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { 7, false, true, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { 8, false, true, false, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { 9, true, true, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { 10, false, false, false, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ReturnReasonPolicies");
        }
    }
}
