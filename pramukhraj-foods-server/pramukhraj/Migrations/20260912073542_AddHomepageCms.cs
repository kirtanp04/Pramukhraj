using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pramukhraj.Migrations
{
    /// <inheritdoc />
    public partial class AddHomepageCms : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "HomepageCms",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false),
                    EyebrowBadge = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Headline = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    Subtext = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    HeroImageUrl = table.Column<string>(type: "text", nullable: false),
                    HeroImageAltText = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    ShowShopByCategory = table.Column<bool>(type: "boolean", nullable: false),
                    ShowFeaturedProducts = table.Column<bool>(type: "boolean", nullable: false),
                    ShowTrendingProducts = table.Column<bool>(type: "boolean", nullable: false),
                    ShowBestSellerProducts = table.Column<bool>(type: "boolean", nullable: false),
                    ShowNewArrivalProducts = table.Column<bool>(type: "boolean", nullable: false),
                    ShowCustomerTestimonials = table.Column<bool>(type: "boolean", nullable: false),
                    ShowFaqSection = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HomepageCms", x => x.Id);
                    table.CheckConstraint("CK_HomepageCms_EyebrowBadge_NotEmpty", "LENGTH(TRIM(\"EyebrowBadge\")) > 0");
                    table.CheckConstraint("CK_HomepageCms_Headline_NotEmpty", "LENGTH(TRIM(\"Headline\")) > 0");
                    table.CheckConstraint("CK_HomepageCms_HeroImageAltText_NotEmpty", "LENGTH(TRIM(\"HeroImageAltText\")) > 0");
                    table.CheckConstraint("CK_HomepageCms_SingleRow", "\"Id\" = 1");
                    table.CheckConstraint("CK_HomepageCms_Subtext_NotEmpty", "LENGTH(TRIM(\"Subtext\")) > 0");
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "HomepageCms");
        }
    }
}
