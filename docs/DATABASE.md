# MOROCCO BUSINESS OS — Database Schema & Data Models
**Document Version:** 1.0.0  
**Target RDBMS:** PostgreSQL 16+  
**ORM:** Prisma 5.x+  
**Standard:** Moroccan Accounting Standard (PCGE) & CGI Tax Compliance

---

## 1. Global Data Conventions & Rules

1. **UUIDv7 for Identifiers:** All primary keys use time-sortable UUIDv7 (`uuid`) to optimize B-Tree index insertion performance.
2. **Numeric Precisions:**
   - **Monetary Amounts (MAD):** `DECIMAL(18, 4)` (Stored with 4 decimal places to prevent rounding drift during multi-line currency conversions and taxes; formatted to 2 decimals on display/invoices).
   - **Quantities:** `DECIMAL(14, 4)` (Allows fractional quantities such as kilograms, meters, liters).
   - **Exchange Rates / Tax Rates:** `DECIMAL(10, 6)`.
   - **Absolute Prohibition:** `FLOAT` and `DOUBLE` types are strictly forbidden for quantities, prices, taxes, and amounts.
3. **Temporal Tracking:**
   - `created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`
   - `updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`
   - All timestamps stored in UTC. Client rendering adapts to Morocco time (`Africa/Casablanca`).
4. **Tenant Isolation:**
   - All operational tables must contain `tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT`.
   - Composite indexes on `(tenant_id, id)` and frequently filtered tenant columns.

---

## 2. Core Entities Schema

### 2.1 Multi-Tenant Core (`tenants`, `companies`, `branches`)

```sql
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(63) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, SUSPENDED, TRIAL, CANCELLED
    plan_tier VARCHAR(32) NOT NULL DEFAULT 'BUSINESS', -- STARTER, BUSINESS, PROFESSIONAL, ENTERPRISE
    max_users INT NOT NULL DEFAULT 5,
    max_branches INT NOT NULL DEFAULT 2,
    max_warehouses INT NOT NULL DEFAULT 2,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    legal_name VARCHAR(255) NOT NULL,
    commercial_name VARCHAR(255),
    legal_form VARCHAR(32) NOT NULL DEFAULT 'SARL', -- SARL, SARL-AU, SA, SAS, AUTO-ENTREPRENEUR, PERSONNE_PHYSIQUE
    -- Moroccan Legal Identifiers
    ice VARCHAR(15) NOT NULL, -- Identifiant Commun de l'Entreprise (15 digits)
    identifiant_fiscal VARCHAR(15) NOT NULL, -- Numéro d'Identification Fiscale (IF)
    registre_commerce VARCHAR(32) NOT NULL, -- RC Number + Court
    taxe_professionnelle VARCHAR(32) NOT NULL, -- Numéro de Taxe Professionnelle (TP)
    cnss_number VARCHAR(32), -- Numéro d'affiliation CNSS
    
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    country VARCHAR(2) NOT NULL DEFAULT 'MA',
    phone VARCHAR(32) NOT NULL,
    email VARCHAR(255) NOT NULL,
    website VARCHAR(255),
    logo_url TEXT,
    base_currency VARCHAR(3) NOT NULL DEFAULT 'MAD',
    default_language VARCHAR(5) NOT NULL DEFAULT 'ar', -- ar, fr
    fiscal_year_start_month SMALLINT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_company_tenant UNIQUE (tenant_id)
);

CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    code VARCHAR(32) NOT NULL,
    name VARCHAR(255) NOT NULL,
    is_main_branch BOOLEAN NOT NULL DEFAULT FALSE,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    phone VARCHAR(32),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_branch_code UNIQUE (tenant_id, code)
);
```

### 2.2 Product Catalog (`categories`, `units`, `products`)

```sql
CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    parent_id UUID REFERENCES product_categories(id),
    name_ar VARCHAR(255) NOT NULL,
    name_fr VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE units_of_measure (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    code VARCHAR(16) NOT NULL, -- UN, KG, M, L, CARTON
    name_ar VARCHAR(64) NOT NULL,
    name_fr VARCHAR(64) NOT NULL,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_uom_tenant_code UNIQUE (tenant_id, code)
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    category_id UUID REFERENCES product_categories(id),
    uom_id UUID NOT NULL REFERENCES units_of_measure(id),
    sku VARCHAR(64) NOT NULL,
    barcode VARCHAR(64),
    name_ar VARCHAR(255) NOT NULL,
    name_fr VARCHAR(255) NOT NULL,
    description_ar TEXT,
    description_fr TEXT,
    product_type VARCHAR(32) NOT NULL DEFAULT 'STOCKABLE', -- STOCKABLE, CONSUMABLE, SERVICE, COMPOSITE, RAW_MATERIAL
    valuation_method VARCHAR(16) NOT NULL DEFAULT 'WAC', -- WAC (PUMP), FIFO
    
    purchase_price DECIMAL(18, 4) NOT NULL DEFAULT 0.0000,
    selling_price DECIMAL(18, 4) NOT NULL DEFAULT 0.0000,
    default_tax_rate DECIMAL(6, 4) NOT NULL DEFAULT 0.2000, -- 20% standard Moroccan TVA
    
    reorder_point DECIMAL(14, 4) NOT NULL DEFAULT 0.0000,
    maximum_stock DECIMAL(14, 4),
    track_lots BOOLEAN NOT NULL DEFAULT FALSE,
    track_serials BOOLEAN NOT NULL DEFAULT FALSE,
    track_expiration BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_product_sku UNIQUE (tenant_id, sku)
);
CREATE INDEX idx_products_barcode ON products(tenant_id, barcode);
```

---

## 3. Inventory Engine (Append-Only Movement Ledger)

```sql
CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    code VARCHAR(32) NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_warehouse_code UNIQUE (tenant_id, code)
);

CREATE TABLE stock_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity_on_hand DECIMAL(14, 4) NOT NULL DEFAULT 0.0000,
    quantity_reserved DECIMAL(14, 4) NOT NULL DEFAULT 0.0000,
    quantity_available DECIMAL(14, 4) GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) STORED,
    current_wac DECIMAL(18, 4) NOT NULL DEFAULT 0.0000, -- Weighted Average Cost
    total_valuation DECIMAL(18, 4) GENERATED ALWAYS AS (quantity_on_hand * current_wac) STORED,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_stock_balance UNIQUE (tenant_id, warehouse_id, product_id)
);

-- APPEND-ONLY STOCK MOVEMENT AUDIT LEDGER (Immutable)
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    movement_number VARCHAR(64) NOT NULL,
    movement_type VARCHAR(32) NOT NULL, 
    -- PURCHASE_RECEIPT, SALES_ISSUE, SALES_RETURN, PURCHASE_RETURN, INTERNAL_TRANSFER, 
    -- INVENTORY_ADJUSTMENT, STOCK_COUNT, SCRAP, OPENING_BALANCE
    source_warehouse_id UUID REFERENCES warehouses(id),
    destination_warehouse_id UUID REFERENCES warehouses(id),
    reference_document_type VARCHAR(64), -- 'DELIVERY_NOTE', 'PURCHASE_RECEIPT', 'ADJUSTMENT'
    reference_document_id UUID,
    status VARCHAR(32) NOT NULL DEFAULT 'COMPLETED', -- COMPLETED, REVERSED
    reversed_movement_id UUID REFERENCES stock_movements(id),
    notes TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_movement_num UNIQUE (tenant_id, movement_number)
);

CREATE TABLE stock_movement_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    movement_id UUID NOT NULL REFERENCES stock_movements(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity DECIMAL(14, 4) NOT NULL,
    unit_cost DECIMAL(18, 4) NOT NULL,
    total_cost DECIMAL(18, 4) NOT NULL,
    batch_number VARCHAR(64),
    serial_number VARCHAR(64),
    expiration_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_movement_lines ON stock_movement_lines(tenant_id, product_id, created_at);
```

---

## 4. Accounting Ledger (Double-Entry PCGE Engine)

```sql
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    account_number VARCHAR(16) NOT NULL, -- e.g. '3421' Clients, '4411' Fournisseurs, '5141' Banque
    account_class SMALLINT NOT NULL, -- 1 to 8 (PCGE standard)
    name_ar VARCHAR(255) NOT NULL,
    name_fr VARCHAR(255) NOT NULL,
    parent_account_id UUID REFERENCES accounts(id),
    is_reconcilable BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_account_number UNIQUE (tenant_id, account_number)
);

CREATE TABLE journals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    code VARCHAR(16) NOT NULL, -- VE (Ventes), AC (Achats), BQ (Banque), CA (Caisse), OD (Opérations Diverses)
    name_ar VARCHAR(128) NOT NULL,
    name_fr VARCHAR(128) NOT NULL,
    journal_type VARCHAR(32) NOT NULL, -- SALES, PURCHASE, CASH, BANK, GENERAL
    default_account_id UUID REFERENCES accounts(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_journal_code UNIQUE (tenant_id, code)
);

CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    journal_id UUID NOT NULL REFERENCES journals(id) ON DELETE RESTRICT,
    entry_number VARCHAR(64) NOT NULL,
    accounting_date DATE NOT NULL,
    source_document_type VARCHAR(64), -- 'SALES_INVOICE', 'SUPPLIER_INVOICE', 'PAYMENT'
    source_document_id UUID,
    description TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'DRAFT', -- DRAFT, POSTED, REVERSED
    posted_at TIMESTAMPTZ,
    posted_by UUID,
    reversed_entry_id UUID REFERENCES journal_entries(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_journal_entry_num UNIQUE (tenant_id, entry_number)
);

CREATE TABLE journal_entry_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE RESTRICT,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    debit DECIMAL(18, 4) NOT NULL DEFAULT 0.0000,
    credit DECIMAL(18, 4) NOT NULL DEFAULT 0.0000,
    description VARCHAR(255),
    partner_type VARCHAR(32), -- 'CUSTOMER', 'SUPPLIER'
    partner_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_debit_credit_positive CHECK (debit >= 0 AND credit >= 0),
    CONSTRAINT chk_debit_or_credit CHECK ((debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0))
);
CREATE INDEX idx_journal_entry_lines_account ON journal_entry_lines(tenant_id, account_id);
```

---

## 5. Sales & Invoicing Module

```sql
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    customer_type VARCHAR(16) NOT NULL DEFAULT 'COMPANY', -- COMPANY, INDIVIDUAL
    legal_name VARCHAR(255) NOT NULL,
    commercial_name VARCHAR(255),
    ice VARCHAR(15), -- Required for Moroccan B2B transactions
    identifiant_fiscal VARCHAR(15),
    registre_commerce VARCHAR(32),
    patente VARCHAR(32),
    email VARCHAR(255),
    phone VARCHAR(32),
    address TEXT,
    city VARCHAR(100),
    credit_limit DECIMAL(18, 4) NOT NULL DEFAULT 0.0000,
    current_balance DECIMAL(18, 4) NOT NULL DEFAULT 0.0000,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sales_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    invoice_number VARCHAR(64) NOT NULL, -- Chronological, uninterrupted sequence
    fiscal_year SMALLINT NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'MAD',
    exchange_rate DECIMAL(10, 6) NOT NULL DEFAULT 1.000000,
    
    subtotal_amount DECIMAL(18, 4) NOT NULL,
    discount_amount DECIMAL(18, 4) NOT NULL DEFAULT 0.0000,
    tax_amount DECIMAL(18, 4) NOT NULL,
    total_amount DECIMAL(18, 4) NOT NULL,
    paid_amount DECIMAL(18, 4) NOT NULL DEFAULT 0.0000,
    balance_due DECIMAL(18, 4) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
    
    status VARCHAR(32) NOT NULL DEFAULT 'DRAFT', -- DRAFT, APPROVED, POSTED, PAID, PARTIALLY_PAID, CANCELLED
    notes TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_sales_invoice_number UNIQUE (tenant_id, invoice_number)
);

CREATE TABLE sales_invoice_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    invoice_id UUID NOT NULL REFERENCES sales_invoices(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    description TEXT NOT NULL,
    quantity DECIMAL(14, 4) NOT NULL,
    unit_price DECIMAL(18, 4) NOT NULL,
    discount_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    tax_rate DECIMAL(6, 4) NOT NULL, -- e.g. 0.2000 for 20%
    subtotal DECIMAL(18, 4) NOT NULL,
    tax_amount DECIMAL(18, 4) NOT NULL,
    total DECIMAL(18, 4) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

## 6. Audit & Immutability Triggers

To strictly uphold Non-Negotiable Principle #3 ("Never delete approved financial and inventory movements"):
```sql
CREATE OR REPLACE FUNCTION forbid_delete_approved_movements()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IN ('COMPLETED', 'POSTED', 'APPROVED') THEN
        RAISE EXCEPTION 'Non-negotiable rule violation: Approved movements or entries cannot be deleted. Use a documented reversal (Reverse Entry) instead.';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_stock_movements_no_delete
BEFORE DELETE ON stock_movements
FOR EACH ROW EXECUTE FUNCTION forbid_delete_approved_movements();

CREATE TRIGGER trg_journal_entries_no_delete
BEFORE DELETE ON journal_entries
FOR EACH ROW EXECUTE FUNCTION forbid_delete_approved_movements();
```
