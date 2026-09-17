using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using pramukhraj.Database;

#nullable disable

namespace pramukhraj.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20260917131500_AddCheckoutShippingQuoteSnapshot")]
public sealed class AddCheckoutShippingQuoteSnapshot : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "ShippingQuoteJson",
            table: "CheckoutSessions",
            type: "jsonb",
            nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "ShippingQuoteJson",
            table: "CheckoutSessions");
    }
}
