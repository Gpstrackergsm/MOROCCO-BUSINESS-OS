# MOROCCO BUSINESS OS — REST API Specification
**Document Version:** 1.0.0  
**Specification:** OpenAPI 3.0 / REST Guidelines  
**Standard Headers:**
- `Authorization: Bearer <JWT_TOKEN>`
- `X-Tenant-ID: <UUID>` (Optional when extracted from token, required for multi-tenant impersonation/auditors)
- `Idempotency-Key: <UUID>` (Mandatory for all `POST`, `PUT`, `DELETE` operations)
- `Accept-Language: ar | fr`

---

## 1. Authentication & Tenant Context

| Method | Endpoint | Description | Scope |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Register new tenant, company, and admin user | Public |
| `POST` | `/api/v1/auth/login` | Authenticate user, issue access + refresh tokens | Public |
| `POST` | `/api/v1/auth/refresh` | Rotate access token | Authenticated |
| `POST` | `/api/v1/auth/logout` | Revoke session from Redis cache | Authenticated |
| `GET` | `/api/v1/auth/me` | Current user profile, permissions, active tenant | Authenticated |

---

## 2. Core Catalog & Products

| Method | Endpoint | Description | Required Permissions |
|---|---|---|---|
| `GET` | `/api/v1/products` | Paginated product list with stock & price filters | `products:view` |
| `POST` | `/api/v1/products` | Create new product | `products:create` |
| `GET` | `/api/v1/products/:id` | Get detailed product specifications | `products:view` |
| `PUT` | `/api/v1/products/:id` | Update product metadata (prices, barcode) | `products:edit` |
| `POST` | `/api/v1/products/import` | Bulk import products via CSV/Excel | `products:create` |
| `GET` | `/api/v1/categories` | Product hierarchy categories | `products:view` |

---

## 3. Inventory & Warehouse Engine

| Method | Endpoint | Description | Required Permissions |
|---|---|---|---|
| `GET` | `/api/v1/inventory/balances` | Query real-time on-hand, reserved, available stock | `inventory:view` |
| `POST` | `/api/v1/inventory/movements` | Post a stock movement (Receipt, Issue, Transfer) | `inventory:create` |
| `POST` | `/api/v1/inventory/movements/:id/reverse` | Post a counter-movement to reverse an approved movement | `inventory:reverse` |
| `POST` | `/api/v1/inventory/adjustments` | Submit physical stock count variance | `inventory:post` |
| `GET` | `/api/v1/warehouses` | List company warehouses and locations | `warehouses:view` |

---

## 4. Sales & Invoicing (Devis, BL, Factures)

| Method | Endpoint | Description | Required Permissions |
|---|---|---|---|
| `GET` | `/api/v1/sales/quotations` | List quotations / devis | `sales:view` |
| `POST` | `/api/v1/sales/quotations` | Create new quotation | `sales:create` |
| `POST` | `/api/v1/sales/orders` | Confirm sales order & trigger stock reservation | `sales:create` |
| `POST` | `/api/v1/sales/delivery-notes` | Create delivery note (BL) and trigger stock issue | `sales:post` |
| `POST` | `/api/v1/invoices` | Generate official fiscal invoice | `invoices:create` |
| `POST` | `/api/v1/invoices/:id/approve` | Finalize & lock invoice, generate journal entry | `invoices:approve` |
| `GET` | `/api/v1/invoices/:id/pdf` | Stream official Moroccan PDF invoice (AR/FR) | `invoices:view` |

---

## 5. Procurement & Supplier Relations

| Method | Endpoint | Description | Required Permissions |
|---|---|---|---|
| `GET` | `/api/v1/suppliers` | List registered suppliers & ICE/IF info | `procurement:view` |
| `POST` | `/api/v1/purchases/orders` | Create Purchase Order (Bon de Commande) | `procurement:create` |
| `POST` | `/api/v1/purchases/receipts` | Post Goods Receipt (Bon de Réception) | `procurement:post` |
| `POST` | `/api/v1/purchases/invoices` | Record supplier invoice and execute 3-Way Match | `procurement:post` |

---

## 6. Accounting & Treasury (PCGE Morocco)

| Method | Endpoint | Description | Required Permissions |
|---|---|---|---|
| `GET` | `/api/v1/accounting/accounts` | Chart of accounts (PCGE) | `accounting:view` |
| `POST` | `/api/v1/accounting/journal-entries` | Post balanced manual journal entry | `accounting:create` |
| `GET` | `/api/v1/accounting/general-ledger` | General ledger report (Grand Livre) | `accounting:view` |
| `GET` | `/api/v1/accounting/trial-balance` | Trial balance report (Balance Générale) | `accounting:view` |
| `POST` | `/api/v1/treasury/payments` | Record customer/supplier payment | `treasury:create` |
| `POST` | `/api/v1/treasury/reconciliations` | Bank account reconciliation | `treasury:approve` |

---

## 7. Standard API Response Structure

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 1420
  },
  "timestamp": "2026-11-12T13:00:00Z"
}
```

Error response:
```json
{
  "success": false,
  "error": {
    "code": "DOUBLE_ENTRY_UNBALANCED",
    "message": "Debit sum (12500.0000 MAD) does not match Credit sum (12000.0000 MAD).",
    "details": [
      { "field": "credits", "message": "Discrepancy of 500.0000 MAD" }
    ]
  },
  "timestamp": "2026-11-12T13:00:00Z"
}
```
