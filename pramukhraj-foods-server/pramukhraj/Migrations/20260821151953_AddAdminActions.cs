using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pramukhraj.Migrations
{
    /// <inheritdoc />
    public partial class AddAdminActions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AdminActions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AdminId = table.Column<Guid>(type: "uuid", nullable: true),
                    AdminName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Module = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Action = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    EntityId = table.Column<Guid>(type: "uuid", nullable: true),
                    EntityName = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AdminActions", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AdminActions_Action",
                table: "AdminActions",
                column: "Action");

            migrationBuilder.CreateIndex(
                name: "IX_AdminActions_AdminId",
                table: "AdminActions",
                column: "AdminId");

            migrationBuilder.CreateIndex(
                name: "IX_AdminActions_AdminId_CreatedOn",
                table: "AdminActions",
                columns: new[] { "AdminId", "CreatedOn" });

            migrationBuilder.CreateIndex(
                name: "IX_AdminActions_CreatedOn",
                table: "AdminActions",
                column: "CreatedOn");

            migrationBuilder.CreateIndex(
                name: "IX_AdminActions_EntityId",
                table: "AdminActions",
                column: "EntityId");

            migrationBuilder.CreateIndex(
                name: "IX_AdminActions_Module",
                table: "AdminActions",
                column: "Module");

            migrationBuilder.CreateIndex(
                name: "IX_AdminActions_Module_CreatedOn",
                table: "AdminActions",
                columns: new[] { "Module", "CreatedOn" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AdminActions");
        }
    }
}
