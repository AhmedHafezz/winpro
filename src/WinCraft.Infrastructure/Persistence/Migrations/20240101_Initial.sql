-- WinCraft ERP — Initial Schema
-- Run this against PostgreSQL 16

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── TENANTS & USERS ──────────────────────────────────────────────────────────
CREATE TABLE "Tenants" (
    "Id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "Name"            VARCHAR(200) NOT NULL,
    "Subdomain"       VARCHAR(100) UNIQUE,
    "LogoUrl"         VARCHAR(500),
    "Plan"            VARCHAR(50)  DEFAULT 'Starter',
    "SubscriptionEnd" TIMESTAMP,
    "Currency"        VARCHAR(10)  DEFAULT 'KWD',
    "DecimalPlaces"   INT          DEFAULT 3,
    "TaxRate"         DECIMAL(5,2) DEFAULT 15.00,
    "TaxLabel"        VARCHAR(50)  DEFAULT 'ضريبة القيمة المضافة',
    "IsActive"        BOOLEAN      DEFAULT TRUE,
    "CreatedAt"       TIMESTAMP    DEFAULT NOW(),
    "UpdatedAt"       TIMESTAMP    DEFAULT NOW(),
    "IsDeleted"       BOOLEAN      DEFAULT FALSE
);

CREATE TABLE "Roles" (
    "Id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "Name"        VARCHAR(100) NOT NULL,
    "NameAr"      VARCHAR(100),
    "Permissions" JSONB DEFAULT '[]',
    "CreatedAt"   TIMESTAMP DEFAULT NOW(),
    "UpdatedAt"   TIMESTAMP DEFAULT NOW(),
    "IsDeleted"   BOOLEAN   DEFAULT FALSE
);

CREATE TABLE "Users" (
    "Id"                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId"             UUID NOT NULL REFERENCES "Tenants"("Id"),
    "FullName"             VARCHAR(200) NOT NULL,
    "Email"                VARCHAR(200) NOT NULL,
    "PasswordHash"         VARCHAR(500) NOT NULL,
    "Phone"                VARCHAR(50),
    "RoleId"               UUID REFERENCES "Roles"("Id"),
    "IsActive"             BOOLEAN   DEFAULT TRUE,
    "LastLoginAt"          TIMESTAMP,
    "RefreshToken"         VARCHAR(500),
    "RefreshTokenExpiry"   TIMESTAMP,
    "CreatedAt"            TIMESTAMP DEFAULT NOW(),
    "UpdatedAt"            TIMESTAMP DEFAULT NOW(),
    "IsDeleted"            BOOLEAN   DEFAULT FALSE,
    UNIQUE("TenantId", "Email")
);

-- ── CRM ──────────────────────────────────────────────────────────────────────
CREATE TABLE "Customers" (
    "Id"        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId"  UUID NOT NULL REFERENCES "Tenants"("Id"),
    "Name"      VARCHAR(300) NOT NULL,
    "Type"      VARCHAR(50)  DEFAULT 'Company',
    "Phone"     VARCHAR(50),
    "Email"     VARCHAR(200),
    "City"      VARCHAR(100),
    "Address"   TEXT,
    "Status"    VARCHAR(50)  DEFAULT 'Active',
    "Notes"     TEXT,
    "CreatedAt" TIMESTAMP DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP DEFAULT NOW(),
    "IsDeleted" BOOLEAN   DEFAULT FALSE
);

CREATE TABLE "Deals" (
    "Id"             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId"       UUID NOT NULL REFERENCES "Tenants"("Id"),
    "CustomerId"     UUID NOT NULL REFERENCES "Customers"("Id"),
    "AssignedUserId" UUID REFERENCES "Users"("Id"),
    "Title"          VARCHAR(300) NOT NULL,
    "Value"          DECIMAL(12,3) DEFAULT 0.000,
    "Stage"          VARCHAR(50)   DEFAULT 'Initial',
    "ProbabilityPct" INT           DEFAULT 30,
    "DueDate"        DATE,
    "Notes"          TEXT,
    "CreatedAt"      TIMESTAMP DEFAULT NOW(),
    "UpdatedAt"      TIMESTAMP DEFAULT NOW(),
    "IsDeleted"      BOOLEAN   DEFAULT FALSE
);

CREATE TABLE "Activities" (
    "Id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId"   UUID NOT NULL REFERENCES "Tenants"("Id"),
    "CustomerId" UUID REFERENCES "Customers"("Id"),
    "DealId"     UUID REFERENCES "Deals"("Id"),
    "Type"       VARCHAR(50),
    "Title"      VARCHAR(300),
    "Date"       DATE,
    "Done"       BOOLEAN DEFAULT FALSE,
    "Notes"      TEXT,
    "UserId"     UUID REFERENCES "Users"("Id"),
    "CreatedAt"  TIMESTAMP DEFAULT NOW(),
    "UpdatedAt"  TIMESTAMP DEFAULT NOW(),
    "IsDeleted"  BOOLEAN   DEFAULT FALSE
);

-- ── PROFILE CATALOG ──────────────────────────────────────────────────────────
CREATE TABLE "ProfileSeries" (
    "Id"                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId"            UUID NOT NULL REFERENCES "Tenants"("Id"),
    "Code"                VARCHAR(50) NOT NULL,
    "Name"                VARCHAR(200),
    "Manufacturer"        VARCHAR(200),
    "SystemType"          VARCHAR(100),
    "NominalWidth"        INT,
    "FrameProfileId"      UUID,
    "SashProfileId"       UUID,
    "MullionProfileId"    UUID,
    "TransomProfileId"    UUID,
    "BeadProfileId"       UUID,
    "CleatProfileId"      UUID,
    "ThresholdProfileId"  UUID,
    "FrameThickness"      INT DEFAULT 142,
    "SashThickness"       INT DEFAULT 82,
    "GlassRebate"         INT DEFAULT 18,
    "LaborRatePerSqm"     DECIMAL(10,3) DEFAULT 0.000,
    "IsActive"            BOOLEAN DEFAULT TRUE,
    "CreatedAt"           TIMESTAMP DEFAULT NOW(),
    "UpdatedAt"           TIMESTAMP DEFAULT NOW(),
    "IsDeleted"           BOOLEAN DEFAULT FALSE
);

CREATE TABLE "Profiles" (
    "Id"               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "SeriesId"         UUID NOT NULL REFERENCES "ProfileSeries"("Id"),
    "Code"             VARCHAR(50) NOT NULL,
    "Description"      VARCHAR(300),
    "DescriptionAr"    VARCHAR(300),
    "Role"             VARCHAR(50),
    "WeightPerMeter"   DECIMAL(8,4),
    "BarLength"        INT DEFAULT 6000,
    "MinCutLength"     INT DEFAULT 100,
    "CutAngleLeft"     INT DEFAULT 45,
    "CutAngleRight"    INT DEFAULT 45,
    "SvgGeometry"      TEXT,
    "Alloy"            VARCHAR(50) DEFAULT '6063-T5',
    "IsActive"         BOOLEAN DEFAULT TRUE,
    "CreatedAt"        TIMESTAMP DEFAULT NOW(),
    "UpdatedAt"        TIMESTAMP DEFAULT NOW(),
    "IsDeleted"        BOOLEAN DEFAULT FALSE
);

ALTER TABLE "ProfileSeries"
    ADD CONSTRAINT fk_ps_frame     FOREIGN KEY ("FrameProfileId")    REFERENCES "Profiles"("Id"),
    ADD CONSTRAINT fk_ps_sash      FOREIGN KEY ("SashProfileId")     REFERENCES "Profiles"("Id"),
    ADD CONSTRAINT fk_ps_mullion   FOREIGN KEY ("MullionProfileId")  REFERENCES "Profiles"("Id"),
    ADD CONSTRAINT fk_ps_transom   FOREIGN KEY ("TransomProfileId")  REFERENCES "Profiles"("Id"),
    ADD CONSTRAINT fk_ps_bead      FOREIGN KEY ("BeadProfileId")     REFERENCES "Profiles"("Id"),
    ADD CONSTRAINT fk_ps_cleat     FOREIGN KEY ("CleatProfileId")    REFERENCES "Profiles"("Id"),
    ADD CONSTRAINT fk_ps_threshold FOREIGN KEY ("ThresholdProfileId") REFERENCES "Profiles"("Id");

CREATE TABLE "ProfileFinishPrices" (
    "Id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "ProfileId"     UUID NOT NULL REFERENCES "Profiles"("Id"),
    "FinishCode"    VARCHAR(50) NOT NULL,
    "PricePerMeter" DECIMAL(10,3) DEFAULT 0.000,
    "CreatedAt"     TIMESTAMP DEFAULT NOW(),
    "UpdatedAt"     TIMESTAMP DEFAULT NOW(),
    "IsDeleted"     BOOLEAN DEFAULT FALSE
);

CREATE TABLE "GlassTypes" (
    "Id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId"        UUID NOT NULL REFERENCES "Tenants"("Id"),
    "Code"            VARCHAR(50) NOT NULL,
    "Name"            VARCHAR(200),
    "Composition"     VARCHAR(200),
    "TotalThickness"  DECIMAL(5,2),
    "UValue"          DECIMAL(5,3),
    "PricePerSqm"     DECIMAL(10,3) DEFAULT 0.000,
    "WeightPerSqm"    DECIMAL(5,2),
    "TintColor"       VARCHAR(50),
    "IsToughened"     BOOLEAN DEFAULT FALSE,
    "IsLowE"          BOOLEAN DEFAULT FALSE,
    "IsActive"        BOOLEAN DEFAULT TRUE,
    "CreatedAt"       TIMESTAMP DEFAULT NOW(),
    "UpdatedAt"       TIMESTAMP DEFAULT NOW(),
    "IsDeleted"       BOOLEAN DEFAULT FALSE
);

CREATE TABLE "Finishes" (
    "Id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "Code"       VARCHAR(50) NOT NULL,
    "Name"       VARCHAR(100),
    "NameAr"     VARCHAR(100),
    "HexColor"   VARCHAR(10),
    "PremiumPct" DECIMAL(5,2) DEFAULT 0.00,
    "CreatedAt"  TIMESTAMP DEFAULT NOW(),
    "UpdatedAt"  TIMESTAMP DEFAULT NOW(),
    "IsDeleted"  BOOLEAN DEFAULT FALSE
);

CREATE TABLE "Fittings" (
    "Id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId"    UUID NOT NULL REFERENCES "Tenants"("Id"),
    "Code"        VARCHAR(50) NOT NULL,
    "Description" VARCHAR(300),
    "Category"    VARCHAR(100),
    "Unit"        VARCHAR(20),
    "UnitPrice"   DECIMAL(10,3) DEFAULT 0.000,
    "StockQty"    INT DEFAULT 0,
    "IsActive"    BOOLEAN DEFAULT TRUE,
    "CreatedAt"   TIMESTAMP DEFAULT NOW(),
    "UpdatedAt"   TIMESTAMP DEFAULT NOW(),
    "IsDeleted"   BOOLEAN DEFAULT FALSE
);

CREATE TABLE "FittingsKits" (
    "Id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "SeriesId"   UUID NOT NULL REFERENCES "ProfileSeries"("Id"),
    "WindowType" VARCHAR(50),
    "Items"      JSONB DEFAULT '[]',
    "CreatedAt"  TIMESTAMP DEFAULT NOW(),
    "UpdatedAt"  TIMESTAMP DEFAULT NOW(),
    "IsDeleted"  BOOLEAN DEFAULT FALSE
);

-- ── TREATMENTS ────────────────────────────────────────────────────────────────
CREATE TABLE "Treatments" (
    "Id"               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "DesignId"         UUID UNIQUE NOT NULL,
    "ProfileFinish"    VARCHAR(200),
    "ProfileColor"     VARCHAR(200),
    "ProfileRalCode"   VARCHAR(20),
    "FittingsFinish"   VARCHAR(200),
    "GlassTypeId"      UUID REFERENCES "GlassTypes"("Id"),
    "UValueCalc"       DECIMAL(5,3),
    "CreatedAt"        TIMESTAMP DEFAULT NOW(),
    "UpdatedAt"        TIMESTAMP DEFAULT NOW(),
    "IsDeleted"        BOOLEAN DEFAULT FALSE
);

-- ── QUOTATIONS ────────────────────────────────────────────────────────────────
CREATE TABLE "Quotations" (
    "Id"             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId"       UUID NOT NULL REFERENCES "Tenants"("Id"),
    "CustomerId"     UUID NOT NULL REFERENCES "Customers"("Id"),
    "Code"           VARCHAR(50) NOT NULL,
    "Date"           DATE,
    "ValidUntil"     DATE,
    "Status"         VARCHAR(50) DEFAULT 'Draft',
    "DiscountPct"    DECIMAL(5,2) DEFAULT 0.00,
    "TaxPct"         DECIMAL(5,2) DEFAULT 15.00,
    "Notes"          TEXT,
    "SmartLinkToken" VARCHAR(100) UNIQUE,
    "OpensCount"     INT DEFAULT 0,
    "RevisionNumber" INT DEFAULT 1,
    "TotalValue"     DECIMAL(12,3) DEFAULT 0.000,
    "AssignedUserId" UUID REFERENCES "Users"("Id"),
    "CreatedAt"      TIMESTAMP DEFAULT NOW(),
    "UpdatedAt"      TIMESTAMP DEFAULT NOW(),
    "IsDeleted"      BOOLEAN DEFAULT FALSE
);

-- ── DESIGNS ──────────────────────────────────────────────────────────────────
CREATE TABLE "Designs" (
    "Id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId"     UUID NOT NULL REFERENCES "Tenants"("Id"),
    "QuotationId"  UUID REFERENCES "Quotations"("Id"),
    "ProjectId"    UUID,
    "Code"         VARCHAR(20) NOT NULL,
    "TemplateId"   VARCHAR(50),
    "Width"        INT NOT NULL,
    "Height"       INT NOT NULL,
    "Qty"          INT DEFAULT 1,
    "SeriesId"     UUID REFERENCES "ProfileSeries"("Id"),
    "GlassTypeId"  UUID REFERENCES "GlassTypes"("Id"),
    "FinishId"     UUID REFERENCES "Finishes"("Id"),
    "WindowType"   VARCHAR(50),
    "Location"     VARCHAR(200),
    "FloorNumber"  INT DEFAULT 1,
    "HasTransom"   BOOLEAN DEFAULT FALSE,
    "Notes"        TEXT,
    "CreatedAt"    TIMESTAMP DEFAULT NOW(),
    "UpdatedAt"    TIMESTAMP DEFAULT NOW(),
    "IsDeleted"    BOOLEAN DEFAULT FALSE
);

ALTER TABLE "Treatments" ADD CONSTRAINT fk_treatment_design FOREIGN KEY ("DesignId") REFERENCES "Designs"("Id");

CREATE TABLE "DesignPanels" (
    "Id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "DesignId"    UUID NOT NULL REFERENCES "Designs"("Id"),
    "PanelIndex"  INT NOT NULL,
    "Type"        VARCHAR(50),
    "WidthRatio"  DECIMAL(5,4),
    "GlassTypeId" UUID REFERENCES "GlassTypes"("Id"),
    "CreatedAt"   TIMESTAMP DEFAULT NOW(),
    "UpdatedAt"   TIMESTAMP DEFAULT NOW(),
    "IsDeleted"   BOOLEAN DEFAULT FALSE
);

-- ── BOM ──────────────────────────────────────────────────────────────────────
CREATE TABLE "BomCalculations" (
    "Id"             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId"       UUID NOT NULL,
    "QuotationId"    UUID REFERENCES "Quotations"("Id"),
    "ProjectId"      UUID,
    "WorkOrderId"    UUID,
    "CalculatedAt"   TIMESTAMP DEFAULT NOW(),
    "TotalBars"      INT DEFAULT 0,
    "TotalLengthM"   DECIMAL(8,3) DEFAULT 0.000,
    "TotalWeightKg"  DECIMAL(8,3) DEFAULT 0.000,
    "UsagePct"       DECIMAL(5,2) DEFAULT 0.00,
    "RecoverablePct" DECIMAL(5,2) DEFAULT 0.00,
    "ScrapPct"       DECIMAL(5,2) DEFAULT 0.00,
    "ProfilesCost"   DECIMAL(12,3) DEFAULT 0.000,
    "GlassCost"      DECIMAL(12,3) DEFAULT 0.000,
    "FittingsCost"   DECIMAL(12,3) DEFAULT 0.000,
    "TotalCost"      DECIMAL(12,3) DEFAULT 0.000,
    "ResultJson"     JSONB,
    "CreatedAt"      TIMESTAMP DEFAULT NOW(),
    "UpdatedAt"      TIMESTAMP DEFAULT NOW(),
    "IsDeleted"      BOOLEAN DEFAULT FALSE
);

-- ── PROJECTS ─────────────────────────────────────────────────────────────────
CREATE TABLE "Projects" (
    "Id"             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId"       UUID NOT NULL REFERENCES "Tenants"("Id"),
    "QuotationId"    UUID REFERENCES "Quotations"("Id"),
    "CustomerId"     UUID REFERENCES "Customers"("Id"),
    "Name"           VARCHAR(300) NOT NULL,
    "Status"         VARCHAR(50) DEFAULT 'Active',
    "AssignedUserId" UUID REFERENCES "Users"("Id"),
    "DueDate"        DATE,
    "RevisionNumber" INT DEFAULT 1,
    "Notes"          TEXT,
    "CreatedAt"      TIMESTAMP DEFAULT NOW(),
    "UpdatedAt"      TIMESTAMP DEFAULT NOW(),
    "IsDeleted"      BOOLEAN DEFAULT FALSE
);

ALTER TABLE "Designs" ADD CONSTRAINT fk_design_project FOREIGN KEY ("ProjectId") REFERENCES "Projects"("Id");
ALTER TABLE "BomCalculations" ADD CONSTRAINT fk_bom_project FOREIGN KEY ("ProjectId") REFERENCES "Projects"("Id");

CREATE TABLE "ProjectDocuments" (
    "Id"        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "ProjectId" UUID NOT NULL REFERENCES "Projects"("Id"),
    "Name"      VARCHAR(300),
    "Type"      VARCHAR(50),
    "Url"       VARCHAR(500),
    "SizeKb"    INT,
    "Status"    VARCHAR(50) DEFAULT 'Pending',
    "CreatedAt" TIMESTAMP DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP DEFAULT NOW(),
    "IsDeleted" BOOLEAN DEFAULT FALSE
);

CREATE TABLE "Payments" (
    "Id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "ProjectId"   UUID NOT NULL REFERENCES "Projects"("Id"),
    "TenantId"    UUID NOT NULL,
    "Description" VARCHAR(300),
    "Amount"      DECIMAL(12,3) DEFAULT 0.000,
    "DueDate"     DATE,
    "Status"      VARCHAR(50) DEFAULT 'Pending',
    "ReceivedAt"  TIMESTAMP,
    "Notes"       TEXT,
    "CreatedAt"   TIMESTAMP DEFAULT NOW(),
    "UpdatedAt"   TIMESTAMP DEFAULT NOW(),
    "IsDeleted"   BOOLEAN DEFAULT FALSE
);

-- ── WORK ORDERS ──────────────────────────────────────────────────────────────
CREATE TABLE "WorkOrders" (
    "Id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId"     UUID NOT NULL REFERENCES "Tenants"("Id"),
    "ProjectId"    UUID REFERENCES "Projects"("Id"),
    "Code"         VARCHAR(50) NOT NULL,
    "Status"       VARCHAR(50) DEFAULT 'Pending',
    "Priority"     VARCHAR(50) DEFAULT 'Normal',
    "StartDate"    DATE,
    "DueDate"      DATE,
    "AssignedTeam" VARCHAR(200),
    "ProgressPct"  INT DEFAULT 0,
    "Notes"        TEXT,
    "CreatedAt"    TIMESTAMP DEFAULT NOW(),
    "UpdatedAt"    TIMESTAMP DEFAULT NOW(),
    "IsDeleted"    BOOLEAN DEFAULT FALSE
);

ALTER TABLE "BomCalculations" ADD CONSTRAINT fk_bom_wo FOREIGN KEY ("WorkOrderId") REFERENCES "WorkOrders"("Id");

CREATE TABLE "WorkOrderItems" (
    "Id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "WorkOrderId" UUID NOT NULL REFERENCES "WorkOrders"("Id"),
    "DesignId"    UUID REFERENCES "Designs"("Id"),
    "Description" VARCHAR(300),
    "Qty"         INT DEFAULT 1,
    "Status"      VARCHAR(50) DEFAULT 'Pending',
    "QrCode"      VARCHAR(200),
    "CreatedAt"   TIMESTAMP DEFAULT NOW(),
    "UpdatedAt"   TIMESTAMP DEFAULT NOW(),
    "IsDeleted"   BOOLEAN DEFAULT FALSE
);

CREATE TABLE "CutJobs" (
    "Id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "WorkOrderId"   UUID NOT NULL REFERENCES "WorkOrders"("Id"),
    "ProfileId"     UUID REFERENCES "Profiles"("Id"),
    "ProfileCode"   VARCHAR(50),
    "BarLengthMm"   INT DEFAULT 6000,
    "KerfMm"        INT DEFAULT 3,
    "CutsJson"      JSONB,
    "BarsJson"      JSONB,
    "EfficiencyPct" DECIMAL(5,2),
    "WasteMm"       INT,
    "CreatedAt"     TIMESTAMP DEFAULT NOW(),
    "UpdatedAt"     TIMESTAMP DEFAULT NOW(),
    "IsDeleted"     BOOLEAN DEFAULT FALSE
);

-- ── INVENTORY ────────────────────────────────────────────────────────────────
CREATE TABLE "InventoryItems" (
    "Id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId"     UUID NOT NULL REFERENCES "Tenants"("Id"),
    "Code"         VARCHAR(50) NOT NULL,
    "Name"         VARCHAR(300),
    "NameAr"       VARCHAR(300),
    "Category"     VARCHAR(100),
    "Unit"         VARCHAR(20),
    "Price"        DECIMAL(10,3) DEFAULT 0.000,
    "MinStock"     DECIMAL(10,3) DEFAULT 0,
    "CurrentStock" DECIMAL(10,3) DEFAULT 0,
    "Location"     VARCHAR(200),
    "SeriesId"     UUID REFERENCES "ProfileSeries"("Id"),
    "IsActive"     BOOLEAN DEFAULT TRUE,
    "CreatedAt"    TIMESTAMP DEFAULT NOW(),
    "UpdatedAt"    TIMESTAMP DEFAULT NOW(),
    "IsDeleted"    BOOLEAN DEFAULT FALSE
);

CREATE TABLE "StockMovements" (
    "Id"        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId"  UUID NOT NULL,
    "ItemId"    UUID NOT NULL REFERENCES "InventoryItems"("Id"),
    "Type"      VARCHAR(50),
    "Qty"       DECIMAL(10,3),
    "Date"      TIMESTAMP DEFAULT NOW(),
    "Reference" VARCHAR(100),
    "Note"      TEXT,
    "UserId"    UUID REFERENCES "Users"("Id"),
    "CreatedAt" TIMESTAMP DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP DEFAULT NOW(),
    "IsDeleted" BOOLEAN DEFAULT FALSE
);

CREATE TABLE "OffCuts" (
    "Id"        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId"  UUID NOT NULL,
    "ItemId"    UUID NOT NULL REFERENCES "InventoryItems"("Id"),
    "Code"      VARCHAR(50),
    "LengthMm"  INT NOT NULL,
    "Qty"       INT DEFAULT 1,
    "JobRef"    VARCHAR(100),
    "Usable"    BOOLEAN DEFAULT TRUE,
    "Date"      TIMESTAMP DEFAULT NOW(),
    "CreatedAt" TIMESTAMP DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP DEFAULT NOW(),
    "IsDeleted" BOOLEAN DEFAULT FALSE
);

-- ── FIELD OPERATIONS ─────────────────────────────────────────────────────────
CREATE TABLE "Surveys" (
    "Id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId"    UUID NOT NULL REFERENCES "Tenants"("Id"),
    "CustomerId"  UUID REFERENCES "Customers"("Id"),
    "AssignedTo"  UUID REFERENCES "Users"("Id"),
    "ProjectName" VARCHAR(300),
    "Address"     TEXT,
    "Latitude"    DECIMAL(10,7),
    "Longitude"   DECIMAL(10,7),
    "Status"      VARCHAR(50) DEFAULT 'Pending',
    "SurveyDate"  DATE,
    "Notes"       TEXT,
    "CreatedAt"   TIMESTAMP DEFAULT NOW(),
    "UpdatedAt"   TIMESTAMP DEFAULT NOW(),
    "IsDeleted"   BOOLEAN DEFAULT FALSE
);

CREATE TABLE "SurveyItems" (
    "Id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "SurveyId"    UUID NOT NULL REFERENCES "Surveys"("Id"),
    "Location"    VARCHAR(200),
    "FloorNumber" INT DEFAULT 1,
    "WidthMm"     INT,
    "HeightMm"    INT,
    "OpeningType" VARCHAR(100),
    "Notes"       TEXT,
    "PhotoUrl"    VARCHAR(500),
    "CreatedAt"   TIMESTAMP DEFAULT NOW(),
    "UpdatedAt"   TIMESTAMP DEFAULT NOW(),
    "IsDeleted"   BOOLEAN DEFAULT FALSE
);

CREATE TABLE "Dispatches" (
    "Id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId"      UUID NOT NULL REFERENCES "Tenants"("Id"),
    "ProjectId"     UUID REFERENCES "Projects"("Id"),
    "ScheduledDate" DATE,
    "Status"        VARCHAR(50) DEFAULT 'Scheduled',
    "DriverName"    VARCHAR(200),
    "Notes"         TEXT,
    "CreatedAt"     TIMESTAMP DEFAULT NOW(),
    "UpdatedAt"     TIMESTAMP DEFAULT NOW(),
    "IsDeleted"     BOOLEAN DEFAULT FALSE
);

CREATE TABLE "InstallationJobs" (
    "Id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId"      UUID NOT NULL REFERENCES "Tenants"("Id"),
    "ProjectId"     UUID REFERENCES "Projects"("Id"),
    "TeamLead"      VARCHAR(200),
    "ScheduledDate" DATE,
    "Status"        VARCHAR(50) DEFAULT 'Scheduled',
    "ChecklistJson" JSONB DEFAULT '[]',
    "Notes"         TEXT,
    "CreatedAt"     TIMESTAMP DEFAULT NOW(),
    "UpdatedAt"     TIMESTAMP DEFAULT NOW(),
    "IsDeleted"     BOOLEAN DEFAULT FALSE
);

-- ── NOTIFICATIONS & AUDIT ────────────────────────────────────────────────────
CREATE TABLE "Notifications" (
    "Id"        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId"  UUID NOT NULL,
    "UserId"    UUID REFERENCES "Users"("Id"),
    "Type"      VARCHAR(100),
    "Title"     VARCHAR(300),
    "Message"   TEXT,
    "Module"    VARCHAR(50),
    "EntityId"  UUID,
    "IsRead"    BOOLEAN DEFAULT FALSE,
    "CreatedAt" TIMESTAMP DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP DEFAULT NOW(),
    "IsDeleted" BOOLEAN DEFAULT FALSE
);

CREATE TABLE "AuditLogs" (
    "Id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId"    UUID NOT NULL,
    "UserId"      UUID REFERENCES "Users"("Id"),
    "Action"      VARCHAR(50),
    "EntityType"  VARCHAR(100),
    "EntityId"    UUID,
    "ChangesJson" JSONB,
    "CreatedAt"   TIMESTAMP DEFAULT NOW(),
    "UpdatedAt"   TIMESTAMP DEFAULT NOW(),
    "IsDeleted"   BOOLEAN DEFAULT FALSE
);

-- ── INDEXES ──────────────────────────────────────────────────────────────────
CREATE INDEX idx_customers_tenant    ON "Customers"("TenantId");
CREATE INDEX idx_quotations_tenant   ON "Quotations"("TenantId");
CREATE INDEX idx_designs_quotation   ON "Designs"("QuotationId");
CREATE INDEX idx_workorders_project  ON "WorkOrders"("ProjectId");
CREATE INDEX idx_stock_item          ON "StockMovements"("ItemId");
CREATE INDEX idx_notifications_user  ON "Notifications"("UserId", "IsRead");
CREATE UNIQUE INDEX idx_quotation_token ON "Quotations"("SmartLinkToken")
    WHERE "SmartLinkToken" IS NOT NULL;
