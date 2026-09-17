using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pramukhraj.Migrations
{
    /// <inheritdoc />
    public partial class Phase1VerifiedCustomerCheckout : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_CustomerAddresses_CustomerId",
                table: "CustomerAddresses");

            migrationBuilder.AddColumn<DateTime>(
                name: "EmailVerifiedOn",
                table: "Customers",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "MobileVerifiedOn",
                table: "Customers",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ConcurrencyStamp",
                table: "CustomerAddresses",
                type: "character varying(64)",
                maxLength: 64,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Country",
                table: "CustomerAddresses",
                type: "character varying(80)",
                maxLength: 80,
                nullable: false,
                defaultValue: "India");

            migrationBuilder.AddColumn<string>(
                name: "Email",
                table: "CustomerAddresses",
                type: "character varying(256)",
                maxLength: 256,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "CheckoutSessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CustomerId = table.Column<Guid>(type: "uuid", nullable: false),
                    CartId = table.Column<Guid>(type: "uuid", nullable: false),
                    CartVersion = table.Column<int>(type: "integer", nullable: false),
                    ShippingAddressId = table.Column<Guid>(type: "uuid", nullable: true),
                    BillingAddressId = table.Column<Guid>(type: "uuid", nullable: true),
                    CouponId = table.Column<Guid>(type: "uuid", nullable: true),
                    CouponCode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Subtotal = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    ItemDiscountAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    CouponDiscountAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    CustomerShippingAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    ProviderShippingCost = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    TaxAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    GrandTotal = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    SelectedCourierId = table.Column<int>(type: "integer", nullable: true),
                    SelectedCourierName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    EstimatedDeliveryOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ShippingQuoteExpiresOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ExpiresOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ConsumedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ConcurrencyStamp = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CheckoutSessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CheckoutSessions_Carts_CartId",
                        column: x => x.CartId,
                        principalTable: "Carts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CheckoutSessions_Coupons_CouponId",
                        column: x => x.CouponId,
                        principalTable: "Coupons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CheckoutSessions_CustomerAddresses_BillingAddressId",
                        column: x => x.BillingAddressId,
                        principalTable: "CustomerAddresses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CheckoutSessions_CustomerAddresses_ShippingAddressId",
                        column: x => x.ShippingAddressId,
                        principalTable: "CustomerAddresses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CheckoutSessions_Customers_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Customers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CustomerEmailVerificationChallenges",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CustomerId = table.Column<Guid>(type: "uuid", nullable: false),
                    NormalizedEmail = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    CodeHash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    FailedAttempts = table.Column<int>(type: "integer", nullable: false),
                    MaxAttempts = table.Column<int>(type: "integer", nullable: false),
                    ExpiresOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    VerifiedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ConsumedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    RequestIpHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CustomerEmailVerificationChallenges", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CustomerEmailVerificationChallenges_Customers_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Customers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CustomerAddresses_DefaultBilling",
                table: "CustomerAddresses",
                column: "CustomerId",
                unique: true,
                filter: "\"IsActive\" AND \"IsDefaultBilling\"");

            migrationBuilder.Sql(
                "CREATE UNIQUE INDEX \"IX_CustomerAddresses_DefaultShippingOnly\" ON \"CustomerAddresses\" (\"CustomerId\") WHERE \"IsActive\" AND \"IsDefaultShipping\";");

            migrationBuilder.CreateIndex(
                name: "IX_CheckoutSessions_BillingAddressId",
                table: "CheckoutSessions",
                column: "BillingAddressId");

            migrationBuilder.CreateIndex(
                name: "IX_CheckoutSessions_CartId_CartVersion",
                table: "CheckoutSessions",
                columns: new[] { "CartId", "CartVersion" });

            migrationBuilder.CreateIndex(
                name: "IX_CheckoutSessions_CouponId",
                table: "CheckoutSessions",
                column: "CouponId");

            migrationBuilder.CreateIndex(
                name: "IX_CheckoutSessions_CustomerId_ExpiresOn",
                table: "CheckoutSessions",
                columns: new[] { "CustomerId", "ExpiresOn" });

            migrationBuilder.CreateIndex(
                name: "IX_CheckoutSessions_ShippingAddressId",
                table: "CheckoutSessions",
                column: "ShippingAddressId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerEmailVerificationChallenges_CustomerId_NormalizedEm~",
                table: "CustomerEmailVerificationChallenges",
                columns: new[] { "CustomerId", "NormalizedEmail", "CreatedOn" });

            migrationBuilder.CreateIndex(
                name: "IX_CustomerEmailVerificationChallenges_ExpiresOn",
                table: "CustomerEmailVerificationChallenges",
                column: "ExpiresOn");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CheckoutSessions");

            migrationBuilder.DropTable(
                name: "CustomerEmailVerificationChallenges");

            migrationBuilder.Sql(
                "DROP INDEX IF EXISTS \"IX_CustomerAddresses_DefaultShippingOnly\";");

            migrationBuilder.DropIndex(
                name: "IX_CustomerAddresses_DefaultBilling",
                table: "CustomerAddresses");

            migrationBuilder.DropColumn(
                name: "EmailVerifiedOn",
                table: "Customers");

            migrationBuilder.DropColumn(
                name: "MobileVerifiedOn",
                table: "Customers");

            migrationBuilder.DropColumn(
                name: "ConcurrencyStamp",
                table: "CustomerAddresses");

            migrationBuilder.DropColumn(
                name: "Country",
                table: "CustomerAddresses");

            migrationBuilder.DropColumn(
                name: "Email",
                table: "CustomerAddresses");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerAddresses_CustomerId",
                table: "CustomerAddresses",
                column: "CustomerId");
        }
    }
}
