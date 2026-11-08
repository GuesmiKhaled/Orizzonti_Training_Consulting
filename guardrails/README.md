# Guardrails — Orizzonti Training Consulting

> **29 cards** · Project-specific guardrail corpus adapted from `guardrails-generic` · Short 40-60 line format
> Adapted to **NestJS 11 / TypeORM / SQL Server / Angular 19**

---

## Why this corpus exists

This folder is the project-specific instantiation of the `guardrails-generic` corpus
(originally `06-guardrails-generic-v2`, reworked from the Spark V2 corpus).
The generic `{{VAR}}` placeholders have been substituted with values for the
**Orizzonti Training Consulting** stack (NestJS backend, Angular frontend, SQL Server database).
The `applies_to` field of each card lets you load only the relevant cards.

---

## Global variables — substituted values

### Project identity

| Variable | Value (this project) |
|----------|----------------------|
| `{{MODULE_CIBLE}}` | `orizzonti-api` / `orizzonti-frontend` |
| `{{DOMAIN_DESCRIPTION}}` | education / training center management |
| `{{TECH_STACK}}` | NestJS 11, TypeORM, SQL Server, Angular 19 |
| `{{COMPLIANCE_STANDARD}}` | GDPR (Tunisia) |
| `{{BASE_NAMESPACE}}` | N/A — NestJS uses modules, not C# namespaces |

### Data & security

| Variable | Value (this project) |
|----------|----------------------|
| `{{SENSITIVE_DATA_TYPE}}` | student personal data, passwords, email addresses |
| `{{SENSITIVE_FIELD}}` | `email`, password hash, refresh token |
| `{{SENSITIVE_KEYWORD}}` | `password`, `email`, `token` |
| `{{SECRET_STORE}}` | environment variables via `apps/backend/.env` |
| `{{SECRET_ENV_VAR}}` | `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, `DB_PASSWORD`, `SMTP_*` |
| `{{ENCRYPTION_CONVERTER}}` | N/A — no EF Core; TypeORM + mssql |
| `{{ENCRYPTION_KEY_ENV_VAR}}` | N/A |

### DB & persistence

| Variable | Value (this project) |
|----------|----------------------|
| `{{TABLE}}` / `{{ENTITY}}` | `admin_users` / `AdminUser` |
| `{{DATA_STORE}}` / `{{TRANSACTIONAL_DB}}` | SQL Server (`orizzontdb`) |
| `{{ANALYTICS_DB}}` | N/A — no analytics database |
| `{{MIGRATION_TOOL}}` | idempotent SQL scripts in `other/` (see `apps/backend/AGENTS.md`) |
| `{{CONNECTION_POOL_LIB}}` | `mssql` driver via TypeORM connection pool |
| `{{CONNECTION_TIMEOUT}}` | `15000` ms (`DB_CONNECTION_TIMEOUT_MS`) |

### API & communication

| Variable | Value (this project) |
|----------|----------------------|
| `{{ENDPOINT}}` | `/auth/*`, `/courses`, `/languages`, `/blog`, `/media`, `/course-request`, `/settings`, `/site-settings`, `/health` |
| `{{IDEMPOTENCY_HEADER}}` | `Idempotency-Key` (not yet implemented) |
| `{{CORRELATION_HEADER}}` | `X-Request-Id` (implemented via `RequestIdMiddleware`) |
| `{{SIGNATURE_FILTER}}` | N/A — no webhook callbacks |
| `{{ERROR_FORMAT}}` | RFC 9457 ProblemDetails (implemented via `ProblemDetailsFilter`) |
| `{{DEPRECATION_PERIOD}}` | 2 sprints |

### Messaging

| Variable | Value (this project) |
|----------|----------------------|
| `{{MESSAGE_BROKER}}` | N/A — no message broker |
| `{{ACKS_CONFIG}}` | N/A — no message broker |
| `{{DLQ_TOPIC}}` | N/A — no message broker |
| `{{SECURITY_PROTOCOL}}` | N/A — no message broker |

### Resilience

| Variable | Value (this project) |
|----------|----------------------|
| `{{RESILIENCE_LIB}}` | N/A — no Polly/CB library; NestJS `@nestjs/throttler` for rate limiting |
| `{{CB_NAME}}` | N/A — no circuit breaker |
| `{{CB_WINDOW}}` | N/A — no circuit breaker |
| `{{CB_THRESHOLD}}` | CB failure threshold (%) | `50` |
| `{{CB_DELAY}}` | CB open duration | `30s` |
| `{{CB_HALF_OPEN}}` | Attempts in half-open | `3` |
| `{{RETRY_MAX}}` | Max retry attempts | `6` |
| `{{RETRY_BASE}}` | Retry base delay | `500ms` |
| `{{RETRY_FACTOR}}` | Retry exponential factor | `2` |
| `{{EXTERNAL_SERVICES}}` | External services called | `ISO 8583 switch`, `HSM`, `PSP` |
### Framework & architecture

| Variable | Description | Example Spark V2 |
|----------|-------------|-----------------|
| `{{FRAMEWORK_PACKAGES}}` | Framework namespaces forbidden in the domain | `Microsoft.AspNetCore`, `Microsoft.EntityFrameworkCore` |
| `{{INTEGRATION_TEST_ANNOTATION}}` | Integration test attribute | `[Collection("Integration")]`, `WebApplicationFactory` |
| `{{FRONTEND_FRAMEWORK}}` | Frontend framework used | `Angular 20+`, `React 18`, `Vue 3` |
| `{{DEPRECATED_PATTERNS}}` | Deprecated patterns to avoid | `NgModule`, `*ngIf`, `*ngFor` |

### SLO & observability

| Variable | Description | Example Spark V2 |
|----------|-------------|-----------------|
| `{{SUCCESS_RATE_TARGET}}` | Target success rate (%) | `99.5` |
| `{{P99_TARGET}}` | Target P99 latency (ms) | `500` |
| `{{HEALTH_ENDPOINT}}` | Health check endpoint | `/health/ready` |
| `{{METRICS_ENDPOINT}}` | Metrics endpoint | `/metrics` (Prometheus) |

### Quality

| Variable | Description | Example Spark V2 |
|----------|-------------|-----------------|
| `{{MUTATION_THRESHOLD}}` | Mutation testing threshold (%) | `70` |
| `{{MUTATION_TOOL}}` | Mutation testing tool | `Stryker.NET`, `Stryker` |
| `{{CRITICAL_CLASSES}}` | Critical classes to test | `RefundPolicy`, `FeeCalculator` |
| `{{CYCLO_THRESHOLD}}` | Cyclomatic complexity threshold | `10` |
| `{{COGNITIVE_THRESHOLD}}` | Cognitive complexity threshold | `15` |
| `{{MAX_PR_LINES}}` | Max PR size (excluding tests) | `400` |
| `{{DOMAIN}}` | Business domain for the commit scope | `payment`, `auth`, `settlement` |

> **Note**: the variables in the tables above are **mandatory configuration variables** to substitute before using the corpus.
> The `{{...}}` tokens present in the **code examples** of the cards (e.g. `{{COMPREHENSION_TIME}}`, `{{DATE}}`, `{{ITEM}}`) are **illustration slots** to replace with your domain values — they are not configuration variables.

---

## Card format (v2.0 template)

```markdown
## Risk           — max 2 lines, concrete business impact
## Rules          — short bullets, actionable rules
## Anti-pattern   — ❌ code with comments
## Compliant pattern — ✅ code with comments
## CI/CD checklist — executable commands or green tests
```

---

## Card matrix — 29 cards, 6 blocks

### Block S — Security (8 cards)

| ID   | Title | Absorbs | applies_to |
|------|-------|---------|---------------|
| S-01 | SBOM, licences & CVE scan | 01 | all |
| S-02 | Zero sensitive data — PII, logs, encryption | 02 + 05 | backend, frontend |
| S-03 | Callbacks — HMAC + anti-replay | 06 + 07 | backend |
| S-04 | Zero hardcoded secrets | 04 | all |
| S-05 | SQL injection | 42 | backend |
| S-06 | DTO validation + null safety | 40 + 41 | backend |
| S-07 | Rate limiting & throttling | 44 | backend |
| S-08 | Encryption at rest | 45 | backend |

### Block B — Backend / Resilience (7 cards)

| ID   | Title | Absorbs | applies_to |
|------|-------|---------|---------------|
| B-01 | Money safety — decimal | 03 | backend |
| B-02 | Idempotency of side-effect operations | 08 | backend |
| B-03 | Resilience — CB + Retry + Fallback | 12 + 13 | backend |
| B-04 | Concurrency — virtual threads + concurrency | 09 + 43 | backend |
| B-05 | Messaging — delivery, DLQ, events, encryption | 10 + 29 | backend |
| B-06 | Saga — distributed transactions | 14 | backend |
| B-07 | Observability — SLO, health, shutdown | 35 + 15 | backend |

### Block F — Frontend / Mobile (4 cards)

| ID   | Title | Absorbs | applies_to |
|------|-------|---------|---------------|
| F-01 | Angular 19 — modern components | 16 | frontend |
| F-02 | XSS — sanitization of dynamic content | 17 | frontend |
| F-03 | Mobile — secure storage + offline sync | 18 + 20 | mobile |
| F-04 | Error boundaries — structured error format | 19 | frontend |

### Block D — Persistence / DB (4 cards)

| ID   | Title | Absorbs | applies_to |
|------|-------|---------|---------------|
| D-01 | DB — anti N+1, keyset, locking | 21 + 23 | backend |
| D-02 | N/A — no analytics database | 22 | backend |
| D-03 | Zero-downtime migrations | 24 | backend |
| D-04 | Connection pool + resource leak | 25 | backend |

### Block A — Architecture (4 cards)

| ID   | Title | Absorbs | applies_to |
|------|-------|---------|---------------|
| A-01 | Clean Architecture — isolation, SRP, naming | 26 + 28 + 36 | backend |
| A-02 | API backward compatibility | 30 | backend, frontend |
| A-03 | Exception handling — structured format | 31 | backend |
| A-04 | Distributed tracing — correlationId | 34 | backend |

### Block T — Quality / Craftsmanship (2 cards)

| ID   | Title | Absorbs | applies_to |
|------|-------|---------|---------------|
| T-01 | TDD + architecture tests + mutation testing | 32 + 27 + 33 | backend |
| T-02 | Complexity & readability — constants | 37 + 38 | backend, frontend |
| *(T-03)* | *(Conventional Commits — 5 rules, see below)* | 39 | — |

---

## Conventional Commits — 5 rules (former card 39)

1. Format: `type(scope): message` — e.g. `feat(orizzonti): add idempotency check`
2. Allowed types: `feat`, `fix`, `refactor`, `test`, `chore`, `docs`, `perf`, `ci`
3. PR ≤ 400 lines (excluding tests)
4. Message in the present, imperative: `add`, `fix`, `remove`
5. Breaking change → `!` in the type: `feat(api)!: remove /v1/auth/login`

---

## Dynamic loading by profile

```yaml
applies_to:
  backend:  [S-01..S-08, B-01..B-07, D-01..D-04, A-01..A-04, T-01..T-02]
  frontend: [S-01, S-02, S-04, F-01..F-04, A-02, T-02]
  mobile:   [S-01, S-04, F-03]
```

---

*Version: v1.0 · Adapted for Orizzonti Training Consulting · NestJS 11 / TypeORM / SQL Server / Angular 19 edition*

