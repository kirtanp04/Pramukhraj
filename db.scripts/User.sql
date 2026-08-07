

-- 1. Insert the Dummy User into AspNetUsers
INSERT INTO "AspNetUsers" (
    "Id", 
    "UserName", 
    "NormalizedUserName", 
    "Email", 
    "NormalizedEmail", 
    "EmailConfirmed", 
    "PasswordHash", 
    "SecurityStamp", 
    "ConcurrencyStamp", 
    "PhoneNumberConfirmed", 
    "TwoFactorEnabled", 
    "LockoutEnabled", 
    "AccessFailedCount",
    "CreatedAt",
    "IsDeleted"
)
VALUES (
    'd127d7e2-951f-49b1-88e5-66eadcd284c9',     -- Fixed UUID for linking
    'sa',                     -- UserName
    'SA',                     -- NormalizedUserName (Must be uppercase)
    'sa@gmail.com',                     -- Email
    'SA@GMAIL.COM',                     -- NormalizedEmail (Must be uppercase)
    true,                                       -- EmailConfirmed
    'AQAAAAIAAYagAAAAEEbz5unZBf2kcFza6O2YBi9qgnxKSVIydV8q6BqFXGz6kMMCXCjl9iJKVXZBFgIwDA==', -- password 123456
    'JPGI7O6J4HY6QBQMQ4U6OGJW5K3IKYHO',                    -- SecurityStamp
    '3ce3e1e0-c69c-48d8-b08a-2cbfc378da28',                    -- ConcurrencyStamp
    false,                                      -- PhoneNumberConfirmed
    false,                                      -- TwoFactorEnabled
    true,                                       -- LockoutEnabled
    0,                                          -- AccessFailedCount
    now(),                                      -- Your custom CreatedAt field
    false                                       -- Your custom IsDeleted field
)
ON CONFLICT ("Id") DO NOTHING;

INSERT INTO "AspNetUserRoles" ("UserId", "RoleId")
VALUES (
    'd127d7e2-951f-49b1-88e5-66eadcd284c9', -- The exact User ID from above
    'super-admin'                           -- The Role ID slug you defined earlier
)
ON CONFLICT ("UserId", "RoleId") DO NOTHING;