using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pramukhraj.Migrations
{
    /// <inheritdoc />
    public partial class Phase5ReplacementTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ReplacementOrderId",
                table: "ReturnRequests",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReplacementOrderNumber",
                table: "ReturnRequests",
                type: "character varying(40)",
                maxLength: 40,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ReturnRequests_ReplacementOrderId",
                table: "ReturnRequests",
                column: "ReplacementOrderId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ReturnRequests_ReplacementOrderId",
                table: "ReturnRequests");

            migrationBuilder.DropColumn(
                name: "ReplacementOrderId",
                table: "ReturnRequests");

            migrationBuilder.DropColumn(
                name: "ReplacementOrderNumber",
                table: "ReturnRequests");
        }
    }
}
