using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pramukhraj.Migrations
{
    /// <inheritdoc />
    public partial class CompleteCouponManagementFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ReleaseReason",
                table: "CouponUsages",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ReleasedOn",
                table: "CouponUsages",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ReservationExpiresOn",
                table: "CouponUsages",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "CouponUsages",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Reserved");

            migrationBuilder.Sql(
                """
                UPDATE "CouponUsages"
                SET "Status" = 'Redeemed'
                WHERE "RedeemedOn" IS NOT NULL;
                """);

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByAdminId",
                table: "Coupons",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Coupons",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedByAdminId",
                table: "Coupons",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "Version",
                table: "Coupons",
                type: "uuid",
                nullable: false,
                defaultValueSql: "gen_random_uuid()");

            migrationBuilder.CreateIndex(
                name: "IX_Coupons_IsDeleted",
                table: "Coupons",
                column: "IsDeleted");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Coupons_IsDeleted",
                table: "Coupons");

            migrationBuilder.DropColumn(
                name: "ReleaseReason",
                table: "CouponUsages");

            migrationBuilder.DropColumn(
                name: "ReleasedOn",
                table: "CouponUsages");

            migrationBuilder.DropColumn(
                name: "ReservationExpiresOn",
                table: "CouponUsages");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "CouponUsages");

            migrationBuilder.DropColumn(
                name: "CreatedByAdminId",
                table: "Coupons");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Coupons");

            migrationBuilder.DropColumn(
                name: "UpdatedByAdminId",
                table: "Coupons");

            migrationBuilder.DropColumn(
                name: "Version",
                table: "Coupons");
        }
    }
}
