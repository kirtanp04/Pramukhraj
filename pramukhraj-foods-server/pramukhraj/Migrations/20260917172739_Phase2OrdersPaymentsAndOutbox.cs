using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable
namespace pramukhraj.Migrations;

public partial class Phase2OrdersPaymentsAndOutbox : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(NotificationUp);
        migrationBuilder.Sql(OrderUp);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            DROP TABLE "PaymentTransactions", "WebhookInboxEvents", "OutboxMessages", "InventoryReservations", "OrderAddresses", "OrderItems", "OrderStatusHistories", "Payments", "Orders";
            ALTER TABLE "AdminNotificationStates" DROP CONSTRAINT "PK_AdminNotificationStates";
            DROP INDEX "IX_AdminNotificationStates_NotificationId_AdminId";
            DROP INDEX "IX_AdminNotificationStates_AdminId_ReadOn_DismissedOn_NotificationId";
            ALTER TABLE "AdminNotificationStates" DROP COLUMN "DismissedOn", DROP COLUMN "Id";
            ALTER TABLE "AdminNotificationStates" RENAME COLUMN "ReadOn" TO "AcknowledgedOn";
            ALTER TABLE "AdminNotificationStates" RENAME TO "AdminNotificationRecipients";
            ALTER TABLE "AdminNotificationRecipients" ADD CONSTRAINT "PK_AdminNotificationRecipients" PRIMARY KEY ("NotificationId", "AdminId");
            CREATE INDEX "IX_AdminNotificationRecipients_AdminId_AcknowledgedOn_NotificationId" ON "AdminNotificationRecipients" ("AdminId", "AcknowledgedOn", "NotificationId");
            DROP INDEX "IX_AdminNotifications_SequenceNumber", "IX_AdminNotifications_DeduplicationKey";
            ALTER TABLE "AdminNotifications" DROP COLUMN "SequenceNumber", DROP COLUMN "Audience", DROP COLUMN "TargetAdminId", DROP COLUMN "TargetRole", DROP COLUMN "DeduplicationKey", DROP COLUMN "ExpiresOn";
            DROP SEQUENCE "AdminNotificationSequence";
            """);
    }

    private const string NotificationUp = """
        CREATE SEQUENCE "AdminNotificationSequence" AS bigint START WITH 1;
        ALTER TABLE "AdminNotifications" ADD "SequenceNumber" bigint NOT NULL DEFAULT nextval('"AdminNotificationSequence"'), ADD "Audience" varchar(30) NOT NULL DEFAULT 'ADMIN', ADD "TargetAdminId" varchar(450) NULL, ADD "TargetRole" varchar(100) NULL DEFAULT 'Admin', ADD "DeduplicationKey" varchar(250) NULL, ADD "ExpiresOn" timestamptz NULL;
        UPDATE "AdminNotifications" SET "DeduplicationKey" = lower("Type") || ':' || "Id"::text;
        ALTER TABLE "AdminNotifications" ALTER COLUMN "DeduplicationKey" SET NOT NULL;
        CREATE UNIQUE INDEX "IX_AdminNotifications_SequenceNumber" ON "AdminNotifications" ("SequenceNumber");
        CREATE UNIQUE INDEX "IX_AdminNotifications_DeduplicationKey" ON "AdminNotifications" ("DeduplicationKey");
        ALTER TABLE "AdminNotificationRecipients" RENAME TO "AdminNotificationStates";
        ALTER TABLE "AdminNotificationStates" RENAME COLUMN "AcknowledgedOn" TO "ReadOn";
        ALTER TABLE "AdminNotificationStates" ADD "Id" uuid NOT NULL DEFAULT gen_random_uuid(), ADD "DismissedOn" timestamptz NULL;
        ALTER TABLE "AdminNotificationStates" DROP CONSTRAINT "PK_AdminNotificationRecipients";
        ALTER TABLE "AdminNotificationStates" ADD CONSTRAINT "PK_AdminNotificationStates" PRIMARY KEY ("Id");
        DROP INDEX IF EXISTS "IX_AdminNotificationRecipients_AdminId_AcknowledgedOn_NotificationId";
        CREATE UNIQUE INDEX "IX_AdminNotificationStates_NotificationId_AdminId" ON "AdminNotificationStates" ("NotificationId", "AdminId");
        CREATE INDEX "IX_AdminNotificationStates_AdminId_ReadOn_DismissedOn_NotificationId" ON "AdminNotificationStates" ("AdminId", "ReadOn", "DismissedOn", "NotificationId");
        """;

    private const string OrderUp = """
        CREATE TABLE "Orders" ("Id" uuid PRIMARY KEY, "CustomerId" uuid NOT NULL, "CheckoutSessionId" uuid NOT NULL, "OrderNumber" varchar(40) NOT NULL, "IdempotencyKey" varchar(64) NOT NULL, "Status" varchar(30) NOT NULL, "CustomerNote" varchar(500), "Subtotal" numeric(18,2) NOT NULL, "ItemDiscountAmount" numeric(18,2) NOT NULL, "CouponDiscountAmount" numeric(18,2) NOT NULL, "TaxAmount" numeric(18,2) NOT NULL, "ShippingAmount" numeric(18,2) NOT NULL, "ProviderShippingCost" numeric(18,2) NOT NULL, "GrandTotal" numeric(18,2) NOT NULL, "Currency" varchar(3) NOT NULL, "CouponId" uuid, "CouponCode" varchar(50), "SelectedCourierId" integer, "SelectedCourierName" varchar(200), "EstimatedDeliveryOn" timestamptz, "PaymentExpiresOn" timestamptz NOT NULL, "CreatedOn" timestamptz NOT NULL, "UpdatedOn" timestamptz NOT NULL, "ConcurrencyStamp" varchar(64) NOT NULL, CONSTRAINT "FK_Orders_Customers_CustomerId" FOREIGN KEY ("CustomerId") REFERENCES "Customers" ("Id") ON DELETE RESTRICT, CONSTRAINT "FK_Orders_CheckoutSessions_CheckoutSessionId" FOREIGN KEY ("CheckoutSessionId") REFERENCES "CheckoutSessions" ("Id") ON DELETE RESTRICT);
        CREATE UNIQUE INDEX "IX_Orders_OrderNumber" ON "Orders" ("OrderNumber"); CREATE UNIQUE INDEX "IX_Orders_IdempotencyKey" ON "Orders" ("IdempotencyKey"); CREATE UNIQUE INDEX "IX_Orders_CheckoutSessionId" ON "Orders" ("CheckoutSessionId"); CREATE INDEX "IX_Orders_CustomerId_CreatedOn" ON "Orders" ("CustomerId", "CreatedOn");
        CREATE TABLE "OrderItems" ("Id" uuid PRIMARY KEY, "OrderId" uuid NOT NULL, "ProductId" uuid NOT NULL, "ProductVariantId" uuid NOT NULL, "ProductName" varchar(255) NOT NULL, "ProductSlug" varchar(255) NOT NULL, "VariantName" varchar(255) NOT NULL, "Sku" varchar(100) NOT NULL, "HsnCode" varchar(30), "Weight" numeric(10,3) NOT NULL, "WeightUnit" varchar(20) NOT NULL, "Quantity" integer NOT NULL, "UnitPrice" numeric(18,2) NOT NULL, "UnitMrp" numeric(18,2) NOT NULL, "TaxPercentage" numeric(8,2) NOT NULL, "TaxableAmount" numeric(18,2) NOT NULL, "DiscountAmount" numeric(18,2) NOT NULL, "TaxAmount" numeric(18,2) NOT NULL, "LineTotal" numeric(18,2) NOT NULL, CONSTRAINT "FK_OrderItems_Orders_OrderId" FOREIGN KEY ("OrderId") REFERENCES "Orders" ("Id") ON DELETE RESTRICT); CREATE INDEX "IX_OrderItems_OrderId" ON "OrderItems" ("OrderId");
        CREATE TABLE "OrderAddresses" ("Id" uuid PRIMARY KEY, "OrderId" uuid NOT NULL, "Type" varchar(20) NOT NULL, "RecipientName" varchar(120) NOT NULL, "MobileNumber" varchar(16) NOT NULL, "Email" varchar(256), "AddressLine1" varchar(250) NOT NULL, "AddressLine2" varchar(250), "Landmark" varchar(150), "City" varchar(100) NOT NULL, "State" varchar(100) NOT NULL, "PostalCode" varchar(10) NOT NULL, "Country" varchar(80) NOT NULL, CONSTRAINT "FK_OrderAddresses_Orders_OrderId" FOREIGN KEY ("OrderId") REFERENCES "Orders" ("Id") ON DELETE RESTRICT); CREATE INDEX "IX_OrderAddresses_OrderId" ON "OrderAddresses" ("OrderId");
        CREATE TABLE "OrderStatusHistories" ("Id" uuid PRIMARY KEY, "OrderId" uuid NOT NULL, "Status" varchar(30) NOT NULL, "Note" varchar(500), "CreatedOn" timestamptz NOT NULL, CONSTRAINT "FK_OrderStatusHistories_Orders_OrderId" FOREIGN KEY ("OrderId") REFERENCES "Orders" ("Id") ON DELETE RESTRICT); CREATE INDEX "IX_OrderStatusHistories_OrderId_CreatedOn" ON "OrderStatusHistories" ("OrderId", "CreatedOn");
        CREATE TABLE "Payments" ("Id" uuid PRIMARY KEY, "OrderId" uuid NOT NULL, "IdempotencyKey" varchar(64) NOT NULL, "ProviderOrderId" varchar(100), "ProviderPaymentId" varchar(100), "Status" varchar(30) NOT NULL, "AmountPaise" bigint NOT NULL, "Currency" varchar(3) NOT NULL, "LastError" varchar(1000), "ExpiresOn" timestamptz NOT NULL, "CreatedOn" timestamptz NOT NULL, "UpdatedOn" timestamptz NOT NULL, "PaidOn" timestamptz, "ConcurrencyStamp" varchar(64) NOT NULL, CONSTRAINT "FK_Payments_Orders_OrderId" FOREIGN KEY ("OrderId") REFERENCES "Orders" ("Id") ON DELETE RESTRICT); CREATE UNIQUE INDEX "IX_Payments_IdempotencyKey" ON "Payments" ("IdempotencyKey"); CREATE UNIQUE INDEX "IX_Payments_ProviderOrderId" ON "Payments" ("ProviderOrderId") WHERE "ProviderOrderId" IS NOT NULL; CREATE UNIQUE INDEX "IX_Payments_ProviderPaymentId" ON "Payments" ("ProviderPaymentId") WHERE "ProviderPaymentId" IS NOT NULL; CREATE INDEX "IX_Payments_OrderId" ON "Payments" ("OrderId");
        CREATE TABLE "PaymentTransactions" ("Id" uuid PRIMARY KEY, "PaymentId" uuid NOT NULL, "Type" varchar(50) NOT NULL, "ProviderReference" varchar(100), "Status" varchar(30) NOT NULL, "SafePayloadJson" jsonb, "CreatedOn" timestamptz NOT NULL, CONSTRAINT "FK_PaymentTransactions_Payments_PaymentId" FOREIGN KEY ("PaymentId") REFERENCES "Payments" ("Id") ON DELETE RESTRICT); CREATE INDEX "IX_PaymentTransactions_PaymentId_CreatedOn" ON "PaymentTransactions" ("PaymentId", "CreatedOn");
        CREATE TABLE "InventoryReservations" ("Id" uuid PRIMARY KEY, "OrderId" uuid NOT NULL, "ProductVariantId" uuid NOT NULL, "Quantity" integer NOT NULL, "Status" varchar(30) NOT NULL, "ExpiresOn" timestamptz NOT NULL, "CreatedOn" timestamptz NOT NULL, "CompletedOn" timestamptz, "ReleasedOn" timestamptz, CONSTRAINT "FK_InventoryReservations_Orders_OrderId" FOREIGN KEY ("OrderId") REFERENCES "Orders" ("Id") ON DELETE RESTRICT, CONSTRAINT "FK_InventoryReservations_ProductVariants_ProductVariantId" FOREIGN KEY ("ProductVariantId") REFERENCES "ProductVariants" ("Id") ON DELETE RESTRICT); CREATE UNIQUE INDEX "IX_InventoryReservations_OrderId_ProductVariantId" ON "InventoryReservations" ("OrderId", "ProductVariantId"); CREATE INDEX "IX_InventoryReservations_Status_ExpiresOn" ON "InventoryReservations" ("Status", "ExpiresOn"); CREATE INDEX "IX_InventoryReservations_ProductVariantId" ON "InventoryReservations" ("ProductVariantId");
        CREATE TABLE "WebhookInboxEvents" ("Id" uuid PRIMARY KEY, "Provider" varchar(30) NOT NULL, "ProviderEventId" varchar(150) NOT NULL, "EventType" varchar(80) NOT NULL, "PayloadJson" jsonb NOT NULL, "ReceivedOn" timestamptz NOT NULL, "ProcessedOn" timestamptz); CREATE UNIQUE INDEX "IX_WebhookInboxEvents_Provider_ProviderEventId" ON "WebhookInboxEvents" ("Provider", "ProviderEventId");
        CREATE TABLE "OutboxMessages" ("Id" uuid PRIMARY KEY, "Type" varchar(80) NOT NULL, "AggregateId" varchar(100) NOT NULL, "PayloadJson" jsonb NOT NULL, "Status" varchar(30) NOT NULL, "AttemptCount" integer NOT NULL, "NextAttemptOn" timestamptz NOT NULL, "CreatedOn" timestamptz NOT NULL, "ProcessedOn" timestamptz, "LastError" varchar(1000)); CREATE INDEX "IX_OutboxMessages_Status_NextAttemptOn" ON "OutboxMessages" ("Status", "NextAttemptOn");
        """;
}
