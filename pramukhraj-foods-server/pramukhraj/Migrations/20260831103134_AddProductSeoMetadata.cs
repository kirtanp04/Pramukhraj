using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pramukhraj.Migrations
{
    /// <inheritdoc />
    public partial class AddProductSeoMetadata : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "MetaDescription",
                table: "Products",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MetaKeywords",
                table: "Products",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MetaTitle",
                table: "Products",
                type: "character varying(255)",
                maxLength: 255,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MetaDescription",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "MetaKeywords",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "MetaTitle",
                table: "Products");
        }
    }
}
