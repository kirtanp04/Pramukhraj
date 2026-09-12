using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pramukhraj.Migrations
{
    /// <inheritdoc />
    public partial class OptimizeFaqQueries : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Faqs_IsDeleted_IsActive_IsFeatured_DisplayOrder",
                table: "Faqs");

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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Faqs_IsDeleted_IsActive_IsFeatured_Category_DisplayOrder",
                table: "Faqs");

            migrationBuilder.DropIndex(
                name: "IX_Faqs_IsDeleted_UpdatedOn_Id",
                table: "Faqs");

            migrationBuilder.CreateIndex(
                name: "IX_Faqs_IsDeleted_IsActive_IsFeatured_DisplayOrder",
                table: "Faqs",
                columns: new[] { "IsDeleted", "IsActive", "IsFeatured", "DisplayOrder" });
        }
    }
}
