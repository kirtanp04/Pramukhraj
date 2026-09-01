using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pramukhraj.Migrations
{
    /// <inheritdoc />
    public partial class AddCouponTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Coupons",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    DiscountType = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    ApplicationScope = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    DiscountValue = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    MinimumOrderAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    MaximumDiscountAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    TotalUsageLimit = table.Column<int>(type: "integer", nullable: true),
                    PerCustomerUsageLimit = table.Column<int>(type: "integer", nullable: true),
                    IsFirstOrderOnly = table.Column<bool>(type: "boolean", nullable: false),
                    CanCombineWithOtherDiscounts = table.Column<bool>(type: "boolean", nullable: false),
                    StartOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Coupons", x => x.Id);
                    table.CheckConstraint("CK_Coupons_CodeUppercase", "\"Code\" = UPPER(\"Code\")");
                    table.CheckConstraint("CK_Coupons_DateRange", "\"StartOn\" < \"EndOn\"");
                    table.CheckConstraint("CK_Coupons_DiscountValue", "(\r\n    \"DiscountType\" = 'FreeShipping'\r\n    AND \"DiscountValue\" = 0\r\n)\r\nOR\r\n(\r\n    \"DiscountType\" = 'FlatAmount'\r\n    AND \"DiscountValue\" > 0\r\n)\r\nOR\r\n(\r\n    \"DiscountType\" = 'Percentage'\r\n    AND \"DiscountValue\" > 0\r\n    AND \"DiscountValue\" <= 100\r\n)");
                    table.CheckConstraint("CK_Coupons_MaximumDiscountAmount", "\"MaximumDiscountAmount\" IS NULL\r\nOR \"MaximumDiscountAmount\" > 0");
                    table.CheckConstraint("CK_Coupons_MinimumOrderAmount", "\"MinimumOrderAmount\" >= 0");
                    table.CheckConstraint("CK_Coupons_PerCustomerUsageLimit", "\"PerCustomerUsageLimit\" IS NULL\r\nOR \"PerCustomerUsageLimit\" > 0");
                    table.CheckConstraint("CK_Coupons_TotalUsageLimit", "\"TotalUsageLimit\" IS NULL\r\nOR \"TotalUsageLimit\" > 0");
                });

            migrationBuilder.CreateTable(
                name: "CouponScopes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CouponId = table.Column<Guid>(type: "uuid", nullable: false),
                    ScopeType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: true),
                    CategoryId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CouponScopes", x => x.Id);
                    table.CheckConstraint("CK_CouponScopes_Target", "(\r\n    \"ScopeType\" = 'Product'\r\n    AND \"ProductId\" IS NOT NULL\r\n    AND \"CategoryId\" IS NULL\r\n)\r\nOR\r\n(\r\n    \"ScopeType\" = 'Category'\r\n    AND \"CategoryId\" IS NOT NULL\r\n    AND \"ProductId\" IS NULL\r\n)");
                    table.ForeignKey(
                        name: "FK_CouponScopes_Coupons_CouponId",
                        column: x => x.CouponId,
                        principalTable: "Coupons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CouponScopes_ProductCategories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "ProductCategories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CouponScopes_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CouponUsages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CouponId = table.Column<Guid>(type: "uuid", nullable: false),
                    CustomerId = table.Column<Guid>(type: "uuid", nullable: true),
                    OrderId = table.Column<Guid>(type: "uuid", nullable: true),
                    CouponCode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    OrderSubtotal = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    DiscountAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    RedeemedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CouponUsages", x => x.Id);
                    table.CheckConstraint("CK_CouponUsages_DiscountAmount", "\"DiscountAmount\" >= 0\r\nAND \"DiscountAmount\" <= \"OrderSubtotal\"");
                    table.CheckConstraint("CK_CouponUsages_OrderSubtotal", "\"OrderSubtotal\" >= 0");
                    table.ForeignKey(
                        name: "FK_CouponUsages_Coupons_CouponId",
                        column: x => x.CouponId,
                        principalTable: "Coupons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Coupons_Code",
                table: "Coupons",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Coupons_IsActive_StartOn_EndOn",
                table: "Coupons",
                columns: new[] { "IsActive", "StartOn", "EndOn" });

            migrationBuilder.CreateIndex(
                name: "IX_CouponScopes_CategoryId",
                table: "CouponScopes",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_CouponScopes_CouponId_CategoryId",
                table: "CouponScopes",
                columns: new[] { "CouponId", "CategoryId" },
                unique: true,
                filter: "\"CategoryId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_CouponScopes_CouponId_ProductId",
                table: "CouponScopes",
                columns: new[] { "CouponId", "ProductId" },
                unique: true,
                filter: "\"ProductId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_CouponScopes_ProductId",
                table: "CouponScopes",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_CouponUsages_CouponId_CustomerId",
                table: "CouponUsages",
                columns: new[] { "CouponId", "CustomerId" });

            migrationBuilder.CreateIndex(
                name: "IX_CouponUsages_CouponId_OrderId",
                table: "CouponUsages",
                columns: new[] { "CouponId", "OrderId" },
                unique: true,
                filter: "\"OrderId\" IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CouponScopes");

            migrationBuilder.DropTable(
                name: "CouponUsages");

            migrationBuilder.DropTable(
                name: "Coupons");
        }
    }
}
