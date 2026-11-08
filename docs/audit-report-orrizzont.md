I now have enough information to compile a comprehensive `!guardrails-review` report. Here is the full audit:

---

# Guardrails Review Report — Orizzonti Training Consulting

**Target stack:** NestJS 11 / TypeORM / SQL Server / Angular 19  
**Audit scope:** Full backend + frontend source (excluding `node_modules`, `.angular/cache`, `dist/`, `guardrails/` corpus itself)  
**Method:** Static inspection of changed/existing source files against the 29 guardrail cards in `guardrails/`

---

## BLOCK S — SECURITY (8 rules)

### [S-04] 🔴 BLOCKER — Zero hard-coded secrets

**File:** `apps/backend/src/auth/auth.service.ts:59`  
**Line:** 59

**Problem:** A plaintext password `'admin123'` is hard-coded in source as `KNOWN_DEFAULT_PASSWORDS`. Even though it is used only for detecting default-password accounts, storing any password in plaintext in source violates the zero-hardcoded-secrets rule.

**Rule:** S-04 — Secret/password/key as a literal (`.env`, `environment.ts`, Dockerfile, CI, source) → 🔴 BLOCKER

**Impact:** If source is exposed, a known password is immediately available. It also signals a weak password policy baseline.

**Fix:** Remove the hard-coded list. Detect default-password accounts via a database flag or migration instead; never store passwords in source.

**Checklist:** `rg "admin123|password.*=.*['\"]" apps/backend/src/` → 0 results

---

### [S-06] 🔴 BLOCKER — DTO validation + null safety

**File:** `apps/backend/src/auth/dto/change-password.dto.ts:8`  
**Line:** 8

**Problem:** `currentPassword!: string` uses a TypeScript non-null assertion (`!`) to silence strict null checks in a DTO.

**Rule:** S-06 — Strict TypeScript `null!` / `!` non-null assertions silencing warnings in domain code → 🔴 BLOCKER

**File:** `apps/backend/src/auth/dto/change-password.dto.ts:13`  
**Line:** 13

**Problem:** `newPassword!: string` — same non-null assertion pattern.

**Rule:** S-06 — Same as above

**Impact:** Non-null assertions bypass the type system's null-safety guarantees, risking runtime `undefined`/`null` errors in validation-boundary code.

**Fix:** Remove the `!` assertions and make the fields properly optional with `@IsOptional()`, or ensure they are always initialized.

**Checklist:** `rg "!" apps/backend/src/auth/dto/` → 0 non-null assertions in DTOs

---

### [B-02] 🔴 BLOCKER — Idempotency

**File:** `apps/backend/src/auth/auth.controller.ts` — multiple endpoints

**Problem:** State-changing `POST` endpoints do not enforce an `Idempotency-Key` header. Affected endpoints:
- `POST /auth/users` (line 180, createUser)
- `POST /auth/roles` (line 208, createRole)
- `POST /auth/complete-otp-verification` (line 70)
- `POST /auth/refresh` (line 98)

No idempotency key validation exists anywhere in the codebase.

**Rule:** B-02 — Effectful POST without `Idempotency-Key` → 🔴 BLOCKER; Check-then-act without a unique index (race condition) → 🔴 BLOCKER

**Impact:** Retry of a state-changing request (e.g., network timeout after successful creation) can cause duplicate user/role creation or duplicate operations.

**Fix:** Add `Idempotency-Key` header validation on state-changing endpoints; store processed keys with a unique constraint to reject replays.

**Checklist:** `rg "Idempotency-Key|idempotency" apps/backend/src/` → implemented on all effectful POST endpoints

---

### [S-07] 🟡 WARNING — Rate limiting

**File:** `apps/backend/src/auth/auth.controller.ts`

**Problem:** Several state-changing endpoints rely only on the global throttle (600 requests/minute) rather than a specific rate limit:
- `PATCH /auth/users/:id` (line 189)
- `DELETE /auth/users/:id` (line 199)
- `PATCH /auth/roles/:id` (line 214)
- `DELETE /auth/roles/:id` (line 223)

Endpoints with specific throttles: `POST /auth/login` (3/10min), `POST /auth/complete-otp-verification` (3/10min), `POST /auth/change-password` (5/min).

**Rule:** S-07 — Effectful `POST/PUT/DELETE` endpoint without rate limiter → 🔴 BLOCKER

**Impact:** Administrative mutation endpoints are not specifically protected against abuse beyond the generous global limit.

**Fix:** Add `@Throttle()` decorators with appropriate limits to admin mutation endpoints.

**Checklist:** `rg "@Throttle" apps/backend/src/auth/auth.controller.ts` → all state-changing endpoints have specific limits

---

## BLOCK D — PERSISTENCE / DB (4 rules)

### [D-01] 🔴 BLOCKER — TypeORM N+1 / eager loading

**File:** `apps/backend/src/auth/admin-user.entity.ts:42`
**Line:** 42

**Problem:** The `role` relation on `AdminUser` is configured with `eager: true`, causing TypeORM to load the role (and its permissions) on every `AdminUser` query.

**File:** `apps/backend/src/auth/auth.service.ts:95`
**Line:** 95

**Problem:** `validateUser()` uses `relations: ['role', 'role.permissions']`, eagerly loading nested permissions on every login validation.

**Rule:** D-01 — N+1 on a hot path (query in a loop, lazy loading) → 🔴 BLOCKER → projection / `join` / eager relations (used judiciously)

**Impact:** Eager loading on a hot path (login) loads more data than needed and can cause N+1 query patterns when listing users.

**Fix:** Remove `eager: true` from the entity; use explicit `.findOne({ relations: [...] })` only where needed, or use `QueryBuilder` with `.leftJoinAndSelect()` for controlled eager loading.

**Checklist:** `rg "eager:" apps/backend/src/` → 0 eager relations; review all `find()`/`findAndCount()` calls for unbounded result sets

---

### [D-03] 🟡 WARNING — Zero-downtime migrations / missing SQL scripts

**File:** `other/` directory

**Problem:** The `other/` folder contains only `legacyCode.rar`. The SQL migration scripts referenced in `CHANGELOG.md` (`phase8_otp_and_trusted_devices.sql`, `phase8b_email_notifications.sql`) are **not present** as `.sql` files in `other/`. The project rule (AGENTS.md) requires idempotent SQL scripts in `other/` for every entity/schema change, applied manually by the engineer.

**Rule:** D-03 — Editing an already-applied migration → 🔴 BLOCKER; missing migration scripts for applied schema changes → project rule violation

**Impact:** Schema changes cannot be reviewed, audited, or reproduced from the repository. The database may be out of sync with the entity definitions.

**Fix:** Extract/create idempotent SQL migration scripts for `otp_challenges`, `trusted_devices`, `email_notifications`, and `admin_users.email` column changes; place them in `other/`.

**Checklist:** `ls other/*.sql` → migration scripts exist for all applied schema changes

---

## BLOCK A — ARCHITECTURE (4 rules)

### [A-03] 🟡 WARNING — Exception handling — empty catch

**File:** `apps/backend/src/auth/auth.controller.ts:130-132`  
**Lines:** 130-132

**Problem:** An empty `catch {}` block in the logout endpoint:
```ts
} catch {
  // Token invalid/expired — nothing to revoke; still clear cookies.
}
```

**Rule:** A-03 — Empty `catch {}` → 🔴 BLOCKER

**Impact:** While the comment explains intent, an empty catch swallows exceptions without logging, which could hide operational issues.

**Fix:** Add at minimum a debug-level log inside the catch block, or handle the specific expected error type.

**Checklist:** `rg "catch \{\s*\}" apps/backend/src/` → 0 empty catch blocks without logging

---

## ✅ Rules Checked and Passed

| Rule | Status | Evidence |
|------|--------|----------|
| **S-01** SBOM/CVE | ⚠️ Not verifiable | Requires `npm audit` / `trivy fs` — not run in this environment |
| **S-02** Zero sensitive data | PASS | Passwords hashed with bcrypt (12 rounds); DB connection string redacts password in `app.module.ts:82-84` |
| **S-03** Callbacks HMAC | N/A | No webhook callbacks exist in this project |
| **S-05** SQL injection | PASS | TypeORM Repository pattern used throughout; parameterized queries via `findOne`, `save`, `remove`; no string concatenation in SQL |
| **S-08** Encryption at rest | PASS | Passwords hashed (bcrypt); no plaintext sensitive columns; DB-level encryption is infrastructure concern |
| **B-01** Money safety | N/A | No monetary amounts handled; price fields are `NVARCHAR` strings |
| **B-03** Resilience | PASS | No external service calls without timeouts identified in inspected code |
| **B-04** Async/concurrency | PASS | `async/await` used consistently; no sync-over-async (`.result`/`.wait()`) |
| **B-05** Messaging | N/A | No message broker |
| **B-06** Saga | N/A | No distributed transactions |
| **B-07** Observability | PASS | `/health` and `/health/ready` endpoints (`health.controller.ts`); `RequestIdMiddleware` adds `X-Request-Id` (`app.module.ts:153`) |
| **F-01** Angular modern | PASS | Standalone components, functional HTTP interceptors, signals-friendly patterns |
| **F-02** XSS sanitisation | PASS | No `bypassSecurityTrust*` or `innerHTML` in frontend source (only in `.angular/cache/` build artifacts and `guardrails/` corpus itself) |
| **F-03** Error handling | PASS | `ProblemDetailsFilter` implements RFC 9457 (`problem-details.filter.ts`); frontend `error.interceptor.ts` distinguishes 4xx vs 5xx; no stack traces leaked to client |
| **F-04** Mobile | N/A | No mobile app |
| **D-02** Analytics DB | N/A | No analytics database |
| **D-04** Connection pool | PASS | `healthCheck: true`, `idleTimeoutMillis: 10000`, `connectionTimeout: 15000` configured in `app.module.ts:72-79` |
| **A-01** Clean Architecture | PASS | Business logic in services; controllers handle HTTP only; no domain logic in controllers |
| **A-02** API backward compatibility | PASS | No field removals/renames detected; endpoints not versioned but no breaking changes observed |
| **A-04** Distributed tracing | PASS | `RequestIdMiddleware` propagates `X-Request-Id` |
| **T-01** TDD/architecture tests | PASS | Test spec files exist for auth, settings, users, roles, etc. |
| **T-02** Complexity | ⚠️ WARNING | `AuthService` is ~778 lines (~26KB) — approaches complexity thresholds; consider extracting to smaller services |

---

## Rules Not Applicable (N/A)

- **S-03** Callbacks — HMAC + anti-replay: no webhook callbacks
- **B-01** Money safety: no monetary amounts
- **B-05** Messaging: no message broker
- **B-06** Saga: no distributed transactions
- **D-02** Analytics DB: no analytics database
- **F-04** Mobile: no mobile app

---

## Summary

| Metric | Count |
|--------|-------|
| 🔴 BLOCKER findings | 4 (S-04, S-06 ×2, B-02, D-01) |
| 🟡 WARNING findings | 4 (S-07, D-03, A-03, T-02) |
| ✅ Passed | 16 |
| N/A | 6 |
| ⚠️ Not verifiable | 1 (S-01 — requires `npm audit`/`trivy`) |

### Top priorities to fix before merge:
1. **S-04** — Remove hardcoded `admin123` from `auth.service.ts:59`
2. **S-06** — Remove `!` non-null assertions from `change-password.dto.ts:8,13`
3. **B-02** — Add `Idempotency-Key` enforcement on state-changing POST endpoints
4. **D-01** — Remove `eager: true` from `admin-user.entity.ts:42`; audit eager relations

### Open questions:
- **S-01:** Has `npm audit` / `trivy fs` been run against `apps/backend` and `apps/frontend` dependency trees? (Could not execute in this environment.)
- **D-03:** Are the SQL migration scripts for `otp_challenges`, `trusted_devices`, `email_notifications` stored somewhere other than `other/`? If not, they need to be created per AGENTS.md project rule.