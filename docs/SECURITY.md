# MOROCCO BUSINESS OS — Security & Threat Model
**Document Version:** 1.0.0  
**Compliance Standards:** Moroccan Law 09-08 (CNDP), OWASP Top 10, Multi-Tenant Defense-in-Depth

---

## 1. Threat Model & Mitigations

### 1.1 Cross-Tenant Data Leakage (Highest Severity Risk)
- **Threat:** Malicious tenant crafts manipulated requests containing another company's UUID (`tenant_id`, `invoice_id`, etc.) to read or manipulate records.
- **Mitigation:**
  1. No client request is ever permitted to specify `tenant_id` for authorization context. `tenant_id` is extracted strictly from the validated, signed server-side JWT / Session.
  2. Prisma Middleware & PostgreSQL Row-Level Security automatically scope every query to `current_tenant_id`.
  3. Automated integration test matrix continuously tests cross-tenant breach attempts across every API route.

### 1.2 Race Conditions & Negative Stock Exploits
- **Threat:** Two concurrent sales or checkout requests issued within milliseconds for the last remaining stock item.
- **Mitigation:**
  1. Distributed Redis Mutex Locks on `lock:product:{tenant_id}:{product_id}` during stock validation and reservation.
  2. Database-level `SELECT ... FOR UPDATE` row locks inside PostgreSQL transactions during stock movement commit.
  3. Database constraint check: `quantity_on_hand >= 0` enforced at the database level when negative stock policy is disabled.

### 1.3 Idempotency & Financial Double-Posting
- **Threat:** Network timeout or user repeatedly clicking "Approve Invoice" or "Make Payment" sends multiple duplicate HTTP requests.
- **Mitigation:**
  1. Mandatory `Idempotency-Key` header on all mutative requests.
  2. Atomic Redis lock `SETNX idempotency:{tenant_id}:{key}` with 24-hour TTL.
  3. Secondary request returns the identical cached response without re-executing accounting or stock transactions.

---

## 2. Authentication & Credential Management

1. **Password Hashing:** Argon2id with memory cost 64MB, iterations 3, parallelism 1.
2. **Multi-Factor Authentication (MFA):** TOTP (RFC 6238) with Google Authenticator / Microsoft Authenticator support. Mandatory for Roles: Super Administrator, Finance Manager, Auditor.
3. **Session Revocation:** Active sessions tracked in Redis under `user:sessions:{user_id}`. Password changes, role adjustments, or admin suspensions trigger immediate token invalidation across all devices.

---

## 3. Data Protection & CNDP Compliance (Morocco Law 09-08)

1. **Encryption at Rest:** AES-256 for persistent database storage and backups.
2. **Encryption in Transit:** TLS 1.3 enforced with strict HSTS headers.
3. **Personally Identifiable Information (PII):** Customer and employee personal contact records, CIN, and banking information (RIB) are masked in application logs and audit events.
4. **Data Retention & Right to be Forgotten:** Tenants can request export and purge of operational archives in accordance with legal Moroccan accounting retention mandates (10 years for books of accounts).
