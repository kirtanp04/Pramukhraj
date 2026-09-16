using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pramukhraj.Migrations
{
    /// <inheritdoc />
    public partial class AddAdminNotifications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AdminNotifications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Severity = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Message = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    EntityType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    EntityId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ActionUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    MetadataJson = table.Column<string>(type: "text", nullable: true),
                    CreatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AdminNotifications", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AdminNotificationRecipients",
                columns: table => new
                {
                    NotificationId = table.Column<Guid>(type: "uuid", nullable: false),
                    AdminId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    AcknowledgedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AdminNotificationRecipients", x => new { x.NotificationId, x.AdminId });
                    table.ForeignKey(
                        name: "FK_AdminNotificationRecipients_AdminNotifications_Notification~",
                        column: x => x.NotificationId,
                        principalTable: "AdminNotifications",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AdminNotificationRecipients_AspNetUsers_AdminId",
                        column: x => x.AdminId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AdminNotificationRecipients_AdminId_AcknowledgedOn_Notifica~",
                table: "AdminNotificationRecipients",
                columns: new[] { "AdminId", "AcknowledgedOn", "NotificationId" });

            migrationBuilder.CreateIndex(
                name: "IX_AdminNotifications_CreatedOn",
                table: "AdminNotifications",
                column: "CreatedOn");

            migrationBuilder.CreateIndex(
                name: "IX_AdminNotifications_Type_CreatedOn",
                table: "AdminNotifications",
                columns: new[] { "Type", "CreatedOn" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AdminNotificationRecipients");

            migrationBuilder.DropTable(
                name: "AdminNotifications");
        }
    }
}
