using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pramukhraj.Migrations
{
    /// <inheritdoc />
    public partial class OptimizePublicTestimonials : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Reviews_PublicTestimonials",
                table: "Reviews",
                columns: new[] { "Rating", "CreatedOn", "Id" },
                descending: new bool[0],
                filter: "\"ReviewType\" = 2 AND \"Status\" = 2 AND \"IsFeatured\" AND \"IsActive\" AND \"HasCustomerConsent\"");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Reviews_PublicTestimonials",
                table: "Reviews");
        }
    }
}
