using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pramukhraj.Migrations
{
    /// <inheritdoc />
    public partial class AddReviews : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Reviews",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ReviewType = table.Column<int>(type: "integer", nullable: false),
                    Source = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CustomerId = table.Column<Guid>(type: "uuid", nullable: true),
                    CustomerName = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    CustomerCity = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: true),
                    OrderId = table.Column<Guid>(type: "uuid", nullable: true),
                    OrderItemId = table.Column<Guid>(type: "uuid", nullable: true),
                    Rating = table.Column<int>(type: "integer", nullable: false),
                    Title = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    Comment = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    IsVerifiedPurchase = table.Column<bool>(type: "boolean", nullable: false),
                    IsFeatured = table.Column<bool>(type: "boolean", nullable: false),
                    HasCustomerConsent = table.Column<bool>(type: "boolean", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    ModeratedByAdminId = table.Column<Guid>(type: "uuid", nullable: true),
                    ModeratedByAdminName = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    ModeratedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RejectionReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedByAdminId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Reviews", x => x.Id);
                    table.CheckConstraint("CK_Reviews_FeaturedApproved", "NOT \"IsFeatured\" OR \"Status\" = 2");
                    table.CheckConstraint("CK_Reviews_ProductReview_Product", "\"ReviewType\" <> 1 OR \"ProductId\" IS NOT NULL");
                    table.CheckConstraint("CK_Reviews_Rating", "\"Rating\" BETWEEN 1 AND 5");
                    table.CheckConstraint("CK_Reviews_TestimonialConsent", "\"ReviewType\" <> 2 OR \"HasCustomerConsent\" = TRUE");
                    table.CheckConstraint("CK_Reviews_VerifiedPurchase", "NOT \"IsVerifiedPurchase\"\r\nOR (\r\n    \"CustomerId\" IS NOT NULL\r\n    AND \"ProductId\" IS NOT NULL\r\n    AND \"OrderId\" IS NOT NULL\r\n    AND \"OrderItemId\" IS NOT NULL\r\n)");
                    table.ForeignKey(
                        name: "FK_Reviews_Customers_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Customers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Reviews_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_CustomerId_CreatedOn",
                table: "Reviews",
                columns: new[] { "CustomerId", "CreatedOn" });

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_OrderId",
                table: "Reviews",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_OrderItemId",
                table: "Reviews",
                column: "OrderItemId",
                unique: true,
                filter: "\"OrderItemId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_ProductId_Status_IsActive_CreatedOn",
                table: "Reviews",
                columns: new[] { "ProductId", "Status", "IsActive", "CreatedOn" });

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_ReviewType_Status_IsFeatured_IsActive_CreatedOn",
                table: "Reviews",
                columns: new[] { "ReviewType", "Status", "IsFeatured", "IsActive", "CreatedOn" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Reviews");
        }
    }
}
