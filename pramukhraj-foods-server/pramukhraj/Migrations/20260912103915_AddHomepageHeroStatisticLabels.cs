using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pramukhraj.Migrations
{
    /// <inheritdoc />
    public partial class AddHomepageHeroStatisticLabels : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AverageRatingLabel",
                table: "HomepageCms",
                type: "character varying(60)",
                maxLength: 60,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "HappyCustomersLabel",
                table: "HomepageCms",
                type: "character varying(60)",
                maxLength: 60,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProductCountLabel",
                table: "HomepageCms",
                type: "character varying(60)",
                maxLength: 60,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AverageRatingLabel",
                table: "HomepageCms");

            migrationBuilder.DropColumn(
                name: "HappyCustomersLabel",
                table: "HomepageCms");

            migrationBuilder.DropColumn(
                name: "ProductCountLabel",
                table: "HomepageCms");
        }
    }
}
