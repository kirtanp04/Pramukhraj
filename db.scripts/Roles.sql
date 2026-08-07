-- Insert base roles into the AspNetRoles table for ASP.NET Core Identity
INSERT INTO "AspNetRoles" ("Id", "Name", "NormalizedName", "ConcurrencyStamp")
VALUES 
    ('super-admin', 'Super Admin', 'SUPER ADMIN', gen_random_uuid()::text),
    ('catalog-manager', 'Catalog Manager', 'CATALOG MANAGER', gen_random_uuid()::text),
    ('order-and-support-manager', 'Order & Support Manager', 'ORDER & SUPPORT MANAGER', gen_random_uuid()::text),
    ('content-editor', 'Content Editor', 'CONTENT EDITOR', gen_random_uuid()::text),
    ('finance-and-reports-viewer', 'Finance & Reports Viewer', 'FINANCE & REPORTS VIEWER', gen_random_uuid()::text)
ON CONFLICT ("Id") DO NOTHING;