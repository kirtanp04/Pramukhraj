-- SQLBook: Code
-- Active: 1790176044987@@localhost@5433@pramukhraj_db
TRUNCATE TABLE
    "ShipmentActivities",
    "Shipments",
    "PaymentTransactions",
    "Payments",
    "WebhookInboxEvents",
    "OrderStatusHistories",
    "OrderItems",
    "OrderAddresses",
    "InventoryReservations",
    "CouponUsages",
    "Reviews",
    "Orders",
    "CheckoutSessions",
    "CartItems",
    "Carts",
    -- "CustomerRefreshTokens",
    "CustomerEmailVerificationChallenges",
    "CustomerOtpChallenges",
    "CustomerAddresses",
    "OutboxMessages",
    "AdminNotificationStates",
    "AdminNotifications"
CASCADE;