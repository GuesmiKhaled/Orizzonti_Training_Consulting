# Engineering & security audit

## Scope

Full-stack review of the Orizzonti application (NestJS 11 backend + Angular 19
frontend) against the engineering playbook in
`.devin/skills/dotnet_angular_engineering/SKILL.md`. This report focuses on
security, API design, data access, testing, UI/UX, accessibility and
operational hardening. It complements — and does not replace — the
state/scope snapshot in `docs/backoffice-audit.md`.

The codebase is already well-engineered. Most findings below are hardening
recommendations, not critical holes. Each finding cites the file/line where
the issue was observed.

## Verified strengths

- **JWT secret enforcement** (`apps/backend/src/auth/auth.constants.ts:20`):
  no fallback; rejects missing, short, and known-weak secrets. Startup
  aborts if misconfigured (`main.ts:10`).
- **Password hashing**: bcrypt cost 12 (`auth.service.ts:167`); forced
  password change on default/reset passwords; username-in-password and
  same-as-current checks (`auth.service.ts:457`).
- **RBAC**: `PermissionsGuard` + `@RequirePermission` decorator on every
  protected route; super-admin protection prevents lockout
  (`auth.service.ts:318`); role-grant and user-management privilege checks
  (`auth.service.ts:339`, `auth.service.ts:359`).
- **Throttling**: login, password change, public forms, plus a global limit
  (`throttling.ts`).
- **Image uploads** (`media/detect-image-type.ts`, `media-upload.service.ts`):
  validated by **magic bytes** (MIME/name never trusted), 5 MB limit, random
  UUID filenames, `wx` flag to avoid clobbering, served with `nosniff` and
  `dotfiles: deny` (`configure-uploads.ts`).
- **Input validation**: global `ValidationPipe` with `whitelist`,
  `forbidNonWhitelisted`, `transform` (`main.ts:33`).
- **CORS**: explicit origin allowlist from env (`main.ts:13`).
- **Angular**: standalone components, `OnPush`, signals, typed reactive
  forms, HTTP interceptors for auth + error toast, Playwright e2e + axe-core
  a11y spec, 15 backend + 30 frontend spec files.

## Findings

### High

1. **No security headers / helmet.** Only `X-Content-Type-Options` is set,
   and only on `/uploads` (`configure-uploads.ts:10`). Missing HSTS, CSP,
   `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`. The playbook
   (§5) requires "CSP and security headers at the server or edge" and "HTTPS,
   suitable cookie flags, HSTS and security headers." Recommend adding
   `helmet` (or equivalent middleware) in `main.ts`.

2. **Database connection not encrypted.** `app.module.ts:67` sets
   `encrypt: false, trustServerCertificate: true`. Credentials and data
   traverse the network in cleartext. Recommend `encrypt: true` with a
   controlled trust strategy (CA cert or pinned `trustServerCertificate`
   only for local dev). Note: this may depend on the SQL Server cert setup;
   treat as a config/env concern, do not silently flip it.

3. **No global exception filter / RFC 9457 Problem Details.** NestJS
   defaults return inconsistent error shapes; some controllers throw bare
   `NotFoundException` with ad-hoc messages. The playbook (§4) recommends
   standardizing on Problem Details. Add a global `ExceptionFilter` that
   maps `HttpException` subclasses to a consistent RFC 9457 shape.

### Medium

4. **JWT in localStorage.** `core/auth/token-storage.service.ts:8` keeps the
   access token in `localStorage`, which is exfiltratable via XSS. The
   playbook (§5) says "Do not store long-lived sensitive credentials in
   localStorage by default." Options: httpOnly cookie session, or shorter
   access-token lifetime + refresh-token rotation. This is a deliberate SPA
   tradeoff — present options, do not force a change.

5. **No SMTP timeout / retry bounds.** `mail/mailer.service.ts:33` builds a
   transport with no `timeout`. A hung SMTP server can tie up request
   threads; the public contact form depends on it. Add a connection/send
   timeout and bound retries.

6. **No global request body-size limit.** Only the upload interceptor caps
   size (5 MB, `media.controller.ts:53`). JSON bodies rely on Express
   defaults (~100 KB, but not explicitly configured). Set an explicit
   `bodyParser` limit in `main.ts` (e.g. `app.useBodyParser('json', { limit:
   '1mb' })`).

7. **No health/readiness endpoint.** The playbook (§7) calls for
   liveness/readiness checks. Add `GET /health` (liveness) and
   `GET /health/ready` (DB + SMTP reachability) for Docker/orchestration.

### Low / hygiene

8. **No structured logging or correlation IDs.** NestJS `Logger` is used
   throughout; no request IDs for tracing across services. Consider a
   request-id middleware and structured logger (pino/winston).

9. **Startup DB log line** (`app.module.ts:41`) prints host, database, and
   user id. Host/db are non-secret; consider redacting the user id in
   production logs as defense-in-depth.

10. **Skill/stack mismatch.** Two skills in `.devin/skills` target .NET Core,
    but the backend is NestJS. Fixed separately by rewriting
    `add-api-endpoint/SKILL.md` and remapping the backend sections of
    `dotnet_angular_engineering/SKILL.md`.

## Verification

Each finding was confirmed against the cited file/line during exploration.
No application source code was modified for this report. Skill-file fixes
are tracked separately in the plan.

## Follow-up

- Items 1–3 are the highest-value, low-risk hardening to implement next.
- Items 4–7 should be scheduled as a hardening batch.
- Items 8–9 are hygiene; bundle with the next logging pass.

## Status after remediation

The following findings have been addressed in this pass (backend only,
no API contract changes):

- **#1 Security headers** — `helmet` added in `main.ts`; HSTS, CSP,
  `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` now set on
  all routes.
- **#2 DB encryption** — `DB_ENCRYPT` / `DB_TRUST_SERVER_CERTIFICATE` env
  vars added in `app.module.ts`; defaults preserve existing connectivity
  (`encrypt: false`). Set `DB_ENCRYPT=true` to enable TLS to SQL Server.
- **#3 Problem Details filter** — global `ProblemDetailsFilter`
  (`src/common/problem-details.filter.ts`) normalizes errors to RFC 9457
  shape while preserving the `message` field the Angular error
  interceptor depends on (backward compatible).
- **#5 SMTP timeout** — connection/greeting/socket timeouts added to the
  nodemailer transport in `mail/mailer.service.ts`.
- **#6 Body-size limit** — explicit `app.useBodyParser('json', { limit })`
  in `main.ts` (default 1 MB, configurable via `BODY_SIZE_LIMIT`).
- **#7 Health endpoint** — `GET /health` (liveness) and `GET /health/ready`
  (DB ping, 503 on failure) added in `src/health/`.
- **#8 Correlation ID** — `RequestIdMiddleware`
  (`src/common/request-id.middleware.ts`) sets/echoes `X-Request-Id` on
  every request; CORS now exposes it.
- **#9 Startup DB log** — user id redacted in `app.module.ts`.

Still open (deliberate, need design discussion before changing):

- ~~**#4 JWT in localStorage**~~ — **Resolved.** Migrated to httpOnly
  `SameSite=None; Secure` cookies with access + refresh token rotation,
  double-submit CSRF protection, and transparent refresh on 401. See
  "JWT cookie migration" below.

## JWT cookie migration (audit finding #4)

Migrated auth from a localStorage access token to httpOnly cookies with
refresh-token rotation. Approach chosen: **HTTPS + SameSite=None** (the
deployment must terminate HTTPS in front of the API; `COOKIE_SECURE=false`
is available for local HTTP dev only).

### Backend changes
- `auth/auth.constants.ts`: added `ACCESS_TOKEN_COOKIE`, `REFRESH_TOKEN_COOKIE`,
  `CSRF_COOKIE`, `CSRF_HEADER`, access TTL (15m), refresh TTL (7d), separate
  `getRefreshTokenSecret()`, and `cookieOptions()` / `csrfCookieOptions()`.
- `auth/auth.service.ts`: `login()` now issues both tokens via `issueTokens()`;
  added `refresh()` to validate the refresh token and rotate the pair.
- `auth/auth.controller.ts`: login/refresh set httpOnly cookies; added
  `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/csrf`.
- `auth/guards/jwt-auth.guard.ts`: `JwtAuthGuard` reads the access token from
  the cookie (Bearer header fallback for API clients); added `CsrfGuard`
  (double-submit, exempts `@Public()` and safe methods).
- `app.module.ts`: registered `CsrfGuard` globally.
- `main.ts`: added `cookie-parser`, `X-CSRF-Token` to CORS allowed headers.
- Installed `cookie-parser` + `@types/cookie-parser`.

### Frontend changes
- `core/auth/auth.interceptor.ts`: rewritten for `withCredentials`, CSRF
  header on state-changing requests, and transparent refresh-on-401 with
  single retry (redirects to /login on refresh failure).
- `core/auth/csrf-token.service.ts` (new): manages the double-submit token,
  reads the non-HttpOnly cookie, `ensureToken()` / `refreshOnce()`.
- `core/auth/auth.service.ts`: removed localStorage; auth state derived from
  `/auth/profile`; `isAuthenticated()` checks in-memory profile; `logout()`
  calls the backend to clear cookies.
- `core/auth/auth.guards.ts`: `signedInGuard` now calls `ensureProfile()`
  (no readable token to check).
- `services/orizzonti-api.service.ts`: `loginAdmin()` uses
  `withCredentials`; removed `accessToken` from `AuthResponse` and the
  `localStorage.setItem` tap.
- Deleted `core/auth/token-storage.service.ts` (unused).
- Updated specs: `auth.interceptor.spec.ts`, `auth.guards.spec.ts`,
  `admin-login-page.component.spec.ts`,
  `change-password-page.component.spec.ts`.

### Deployment requirements
- **HTTPS required** on both frontend and API (SameSite=None cookies are
  rejected on plain HTTP by browsers). Set up TLS termination (nginx,
  Caddy, or a reverse proxy) or use `mkcert` for local dev.
- Set `REFRESH_TOKEN_SECRET` (separate from `JWT_SECRET`) in
  `apps/backend/.env` for defense-in-depth.
- Keep `COOKIE_SECURE=true` in production; only set `COOKIE_SECURE=false`
  for local HTTP dev.

### Postman
- Updated login test script (no `accessToken` in body) and response examples.
- Added `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/csrf` items.
