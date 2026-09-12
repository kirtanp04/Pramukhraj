using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pramukhraj.Migrations
{
    /// <inheritdoc />
    public partial class RemoveFaqIsDeleted : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Faqs_Category_IsDeleted_IsActive_DisplayOrder",
                table: "Faqs");

            migrationBuilder.DropIndex(
                name: "IX_Faqs_IsDeleted_IsActive_IsFeatured_Category_DisplayOrder",
                table: "Faqs");

            migrationBuilder.DropIndex(
                name: "IX_Faqs_IsDeleted_UpdatedOn_Id",
                table: "Faqs");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Faqs");

            migrationBuilder.CreateIndex(
                name: "IX_Faqs_Category_IsActive_DisplayOrder",
                table: "Faqs",
                columns: new[] { "Category", "IsActive", "DisplayOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_Faqs_IsActive_IsFeatured_Category_DisplayOrder",
                table: "Faqs",
                columns: new[] { "IsActive", "IsFeatured", "Category", "DisplayOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_Faqs_UpdatedOn_Id",
                table: "Faqs",
                columns: new[] { "UpdatedOn", "Id" },
                descending: new bool[0]);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Faqs_Category_IsActive_DisplayOrder",
                table: "Faqs");

            migrationBuilder.DropIndex(
                name: "IX_Faqs_IsActive_IsFeatured_Category_DisplayOrder",
                table: "Faqs");

            migrationBuilder.DropIndex(
                name: "IX_Faqs_UpdatedOn_Id",
                table: "Faqs");

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Faqs",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_Faqs_Category_IsDeleted_IsActive_DisplayOrder",
                table: "Faqs",
                columns: new[] { "Category", "IsDeleted", "IsActive", "DisplayOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_Faqs_IsDeleted_IsActive_IsFeatured_Category_DisplayOrder",
                table: "Faqs",
                columns: new[] { "IsDeleted", "IsActive", "IsFeatured", "Category", "DisplayOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_Faqs_IsDeleted_UpdatedOn_Id",
                table: "Faqs",
                columns: new[] { "IsDeleted", "UpdatedOn", "Id" },
                descending: new bool[0]);
        }
    }
}
