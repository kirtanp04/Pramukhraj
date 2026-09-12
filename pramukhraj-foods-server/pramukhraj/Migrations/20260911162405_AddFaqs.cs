using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pramukhraj.Migrations
{
    /// <inheritdoc />
    public partial class AddFaqs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Faqs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Category = table.Column<int>(type: "integer", nullable: false),
                    Question = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    NormalizedQuestion = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Answer = table.Column<string>(type: "character varying(5000)", maxLength: 5000, nullable: false),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    IsFeatured = table.Column<bool>(type: "boolean", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Faqs", x => x.Id);
                    table.CheckConstraint("CK_Faqs_Answer_NotEmpty", "LENGTH(TRIM(\"Answer\")) > 0");
                    table.CheckConstraint("CK_Faqs_DisplayOrder", "\"DisplayOrder\" >= 0");
                    table.CheckConstraint("CK_Faqs_Question_NotEmpty", "LENGTH(TRIM(\"Question\")) > 0");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Faqs_Category_IsDeleted_IsActive_DisplayOrder",
                table: "Faqs",
                columns: new[] { "Category", "IsDeleted", "IsActive", "DisplayOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_Faqs_Category_NormalizedQuestion",
                table: "Faqs",
                columns: new[] { "Category", "NormalizedQuestion" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Faqs_IsDeleted_IsActive_IsFeatured_DisplayOrder",
                table: "Faqs",
                columns: new[] { "IsDeleted", "IsActive", "IsFeatured", "DisplayOrder" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Faqs");
        }
    }
}
