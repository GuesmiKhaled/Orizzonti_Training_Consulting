# Changelog — Feature/migrate-to-angular

All notable changes from the last three commits on this branch are documented here.
Dates follow ISO 8601 (YYYY-MM-DD).

---

## [Unreleased] — 2026-11-07

### Commit (agent) — Guardrails playbooks integrated (2026-11-07)

Integrated `!guardrails-review` and `!guardrails-implement` playbooks into `guardrails/PLAYBOOK-guardrails-review.md`, referenced from `AGENTS.md`.

#### Added

- **`guardrails/PLAYBOOK-guardrails-review.md`** — Contains both playbooks:
  - `!guardrails-review`: PR/file audit procedure with change classification, verification commands (backend/frontend/database), violation report format, specs, and advice.
  - `!guardrails-implement`: Implementation procedure with NestJS backend rules, TypeORM/SQL Server rules, Angular 19 rules, security rules, verification commands, and PR description requirements.
- **`AGENTS.md`** — New "Playbooks" section referencing both playbooks.

---

## [Unreleased] — 2026-11-07

### Commit (agent) — Guardrails integration (2026-11-07)

Integrated the `guardrails-generic` corpus into the project as `guardrails/`, adapted for the NestJS 11 / TypeORM / SQL Server / Angular 19 stack.

#### Added

- **Guardrails corpus** (`guardrails/`)
  - 29 cards in 6 blocks: Security (S), Backend/Resilience (B), Frontend/Mobile (F), Persistence/DB (D), Architecture (A), Quality (T)
  - `README.md` with variable substitutions for this project (stack, secrets, DB, API endpoints, compliance)
  - `00-GUARDRAILS-SYSTEM-PROMPT.md` (v3.0) — 28-rule system prompt with CONTEXT VARIABLES filled in
  - `GUARDRAILS-SYSTEM-PROMPT.md` (v2.1) — 29-rule system prompt with CONTEXT VARIABLES filled in
  - Block files `01-security-S.md` through `06-quality-T.md`
  - Individual card files `A-01`…`A-04`, `B-01`…`B-07`, `D-01`…`D-04`, `F-01`…`F-04`, `S-01`…`S-08`, `T-01`, `T-02`
  - `PLAYBOOK-guardrails-review.md`
- **AGENTS.md** — new "Guardrails (coding & security standards)" section cross-referencing `guardrails/`; cards marked N/A for this project documented (B-05, B-06, D-02, F-03, S-03)

#### Notes

- `guardrails-dotnet-angular/devin/` (Devin-specific scaffolding) was excluded — not applicable to Cline.
- Cards B-05 (messaging), B-06 (saga), D-02 (analytics DB), F-03 (mobile), S-03 (HMAC webhook callbacks) are N/A — no corresponding infrastructure exists in this project.

---

## [Unreleased] — 2026-11-02

### Commit `c755d80` — Feature: OTP checks (2026-11-02)

The OTP (one-time password) two-factor authentication system is now fully wired
end-to-end. Previously the building blocks (`OtpService`, `TrustedDeviceService`,
`NotificationService`) existed but were disconnected from the login flow.

#### Added — Backend

- **OTP login flow** (`auth/auth.service.ts`, `auth/auth.controller.ts`)
  - `AuthService.login()` now checks for a trusted-device cookie. If valid, it
    issues tokens directly (skip OTP). If missing/invalid, it creates an OTP
    challenge via `OtpService.createChallenge()`, sends the code by email using
    `otpEmailTemplate`, and returns `{ challengeRequired, challengeId, email }`
    instead of tokens.
  - New `AuthService.completeOtpVerification()` verifies the code, creates a
    trusted device, and issues tokens.
  - New endpoint `POST /auth/complete-otp-verification` with `CompleteOtpDto`.
  - `TRUSTED_DEVICE_COOKIE` + `TRUSTED_DEVICE_TTL_SECONDS` (30 days) constants
    in `auth.constants.ts`; cookie set on successful OTP verification, cleared
    on logout.
  - `AuthModule` now imports `OtpModule`, `TrustedDeviceModule`, `MailModule`.

- **Transactional email wiring** (`mail/`, `notification/`, `otp/`,
  `language/`, `course-request/`)
  - `MailerService.MailPayload` gained `html?: string`; passed to nodemailer.
  - `NotificationService.sendOne` passes `htmlBody` as `html`.
  - `OtpController.resendOtp` sends the OTP code via `MailerService` using
    `otpEmailTemplate` (HTML + text) instead of `console.log`.
  - `OtpService.resend`/`createChallenge` load the `user` relation and return
    the user's email.
  - `ExamRegistrationService` now uses `NotificationService` outbox + HTML
    templates (`examBookingEmailTemplate`) for register/accept/reject, instead
    of plain-text `MailerService` calls.
  - `CourseRequestService.create` enqueues a course-reservation confirmation
    email inside the transaction using `courseReservationEmailTemplate`.
  - `LanguageModule` imports `NotificationModule` (replaced `MailModule`).
  - `CourseRequestModule` imports `NotificationModule`.

- **Database pool/timeout hardening** (`app.module.ts`)
  - `requestTimeout: 30000` (env-tunable via `DB_REQUEST_TIMEOUT_MS`),
    `connectionTimeout: 15000`, `enableArithAbort: true`.
  - `extra.pool` with `healthCheck: true`, `idleTimeoutMillis: 10000` to
    detect stale WSL2/NAT connections.
  - Registered `TrustedDeviceModule`, `OtpModule`, `NotificationModule` and
    their entities in the root `AppModule`.

- **Schema scripts** (`other/`)
  - `phase8_otp_and_trusted_devices.sql` — `otp_challenges` and
    `trusted_devices` tables; makes `admin_users.email` NOT NULL.
  - `phase8b_email_notifications.sql` — `email_notifications` outbox table.

- **Env docs** (`.env.example`) — documented `DB_REQUEST_TIMEOUT_MS` and
  `TRUSTED_DEVICE_EXPIRATION_DAYS`.

#### Added — Frontend

- **OTP verification step** (`pages/admin-login-page/admin-login-page.component.ts`)
  - Login page now handles the `challengeRequired` response by switching to an
    OTP input step with a masked-email hint, `autocomplete="one-time-code"`,
    and a "Back to login" button.
  - Calls `completeOtpVerification` on submit.

- **API service** (`services/orizzonti-api.service.ts`)
  - `loginAdmin` now returns `LoginResponse` (union of `AuthResponse` or
    `ChallengeRequiredResponse`).
  - New `completeOtpVerification()` method.

- **CSRF proactive fetch** (`core/auth/auth.interceptor.ts`,
  `core/auth/csrf-token.service.ts`)
  - Interceptor proactively fetches a CSRF token before state-changing requests
    when none is cached (fixes 401 on first `POST /media/upload` after login).
  - `CsrfTokenService.ensureToken()` caches the token synchronously via `tap()`
    instead of `firstValueFrom().then()` (microtask ran too late for
    `switchMap`).

- **UI animations** (`shared/ui/glassy-carousel/`, `shared/ui/svg-icon-animations/`)
  - `GlassyCarouselComponent` — glassmorphism carousel with autoplay (pauses on
    hover/focus), loop, touch swipe, arrows + dots + keyboard, active-slide
    emphasis (scale + opacity, neighbors blurred), `@supports` fallback,
    gradient-glow background, `aria-roledescription="carousel"`,
    `aria-live="polite"`, `prefers-reduced-motion` support. Includes unit tests.
  - `SvgIconAnimationsComponent` — 4 SVG icons (Book draw-on stroke, Calendar
    rotate 360°, Mail envelope flap open, Check ring fill + draw-on), `currentColor`,
    `aria-hidden`, `prefers-reduced-motion` support.
  - Both exported from `shared/ui/index.ts` and demoed in `admin/ui-kit`.

- **Admin sidebar** (`admin/layout/admin-sidebar.component.*`)
  - Animated hamburger toggle and fluid sidebar collapse.

- **Design tokens** (`shared/styles/design-tokens.scss`) — added glow vars.

- **Responsive e2e** (`e2e/responsive.spec.ts`) — added breakpoints.

#### Tests
- Backend: `npx jest` — 15 suites, 108 tests, all passing.
- Frontend: `npx ng test` — 338 tests, all passing.
- Frontend: `npx ng build` — green.
- Backend: `npx nest build` — green.

---

### Commit `5775dfa` — remove devin (2026-11-02)

#### Removed
- `.devin/skills/` directory (6 skill files, 1149 lines) — obsolete Devin
  skill scaffolding no longer used by the project.

---

### Commit `c00aa15` — fix UI (2026-10-30)

#### Changed — Frontend
- **Admin sidebar** (`admin/layout/admin-sidebar.component.{html,scss,ts}`)
  — refined responsive collapse behavior and styling.
- **Admin layout** (`admin/layout/admin-layout.component.scss`) — minor
  spacing fix.
- **Course requests page** (`admin/pages/requests/course-requests-page.component.ts`)
  — small cleanup.
- **Login page** (`pages/admin-login-page/admin-login-page.component.ts`)
  — minor fix.
- **Data table** (`shared/ui/data-table/data-table.component.html`) —
  template tweak.
- **Global styles** (`src/styles.css`) — added 2 lines.
- **Responsive e2e** (`e2e/responsive.spec.ts`) — added 2 breakpoints.
- **Karpathy guidelines skill** (`.devin/skills/karpathy-guidelines/SKILL.md`)
  — added (later removed in `5775dfa`).

---

## Database changes applied

The following tables were verified as present in `orizzontdb`:

| Table | Script | Status |
|---|---|---|
| `dbo.otp_challenges` | `other/phase8_otp_and_trusted_devices.sql` | EXISTS |
| `dbo.trusted_devices` | `other/phase8_otp_and_trusted_devices.sql` | EXISTS |
| `dbo.email_notifications` | `other/phase8b_email_notifications.sql` | EXISTS |
| `dbo.mail_settings` | (pre-existing) | EXISTS |

`admin_users.email` is already `NOT NULL` (the `ALTER COLUMN` step in
`phase8_otp_and_trusted_devices.sql` is already applied).

## SMTP configuration

`dbo.mail_settings` is currently configured for Gmail SMTP for testing
(`smtp.gmail.com:587`, STARTTLS). Switch back to a production sender
(e.g. Elastic Email with a valid API key for `info@orizzonti.tn`) before
deploying.

## Deployment note

The running Docker container has old code. Rebuild with
`docker compose up --build` to deploy all the above changes.
