using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pramukhraj.Migrations
{
    /// <inheritdoc />
    public partial class AddEmailTemplates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "EmailTemplates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Key = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Category = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Subject = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    DesignJson = table.Column<string>(type: "jsonb", nullable: false),
                    HtmlContent = table.Column<string>(type: "text", nullable: false),
                    PlainTextContent = table.Column<string>(type: "text", nullable: true),
                    VariablesJson = table.Column<string>(type: "jsonb", nullable: false),
                    AttachmentsJson = table.Column<string>(type: "jsonb", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ConcurrencyStamp = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmailTemplates", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EmailTemplates_IsActive_IsDeleted_Category",
                table: "EmailTemplates",
                columns: new[] { "IsActive", "IsDeleted", "Category" });

            migrationBuilder.CreateIndex(
                name: "IX_EmailTemplates_Key",
                table: "EmailTemplates",
                column: "Key",
                unique: true,
                filter: "\"IsDeleted\" = FALSE");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EmailTemplates");
        }
    }
}
