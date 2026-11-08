# Orizzonti_Training_Consulting

A website for an education center

## Run with Docker Desktop

Prerequisites: Docker Desktop with Docker Compose enabled, and the configured SQL Server database reachable from the host on port 1433.

1. Configure `apps/backend/.env` (see `apps/backend/.env.example`) with database credentials, a long random `JWT_SECRET` (the API will not start without one) and, for the very first start, a `DEFAULT_ADMIN_PASSWORD` of at least 12 characters. The `admin` account created from it must choose a new password at its first login.
2. Optionally set `BACKEND_HOST_PORT` in the root `.env` file to change the published backend port (default: `5007`). The frontend API URL follows this port automatically; set `API_BASE_URL` explicitly only when the browser-visible backend URL differs.
3. In Docker Desktop, ensure the SQL Server instance accepts TCP connections from Docker Desktop and that `orizzontdb` exists.
4. From the repository root, run `docker compose up --build`.
5. Open the frontend at <http://localhost:8080>. The API is published at <http://localhost:5007>.

To stop the containers, run `docker compose down`. The backend container loads credentials from `apps/backend/.env`; Compose overrides `DB_HOST` to `host.docker.internal` and CORS to the Docker frontend origin. The database is intentionally not containerized: this stack connects to the existing host SQL Server. TypeORM schema synchronization is disabled to avoid automatic schema changes. SMTP settings are read from `apps/backend/.env`.

Docker builds the Angular production bundle and serves it with Nginx, while the NestJS API runs in a separate container. Nginx writes the Compose-provided `API_BASE_URL` into a runtime config file, so changing the API URL does not require an Angular rebuild. The browser must be able to reach that URL from the computer running Docker Desktop.

Project Analysis: Orizzonti Training Consulting
1. Executive Summary
Orizzonti Training Consulting is a full-stack web application for an education/training center (Tunisia-focused: sender info@orizzonti.tn, prices in TND, CEFR language levels A1–C2). It consists of:

Public marketing site (home, about, courses, blog, contact, language detail pages)
Admin back-office portal with role-based access control (users, roles, permissions, blogs, courses, languages, exam sessions/registrations, course requests, media, site & mail settings)
Cookie-based JWT authentication with optional OTP two-factor authentication and trusted-device remembering
The codebase appears to be in good shape: the last release (merge 099e1b2 of the Feature/migrate-to-angular branch) wired the OTP 2FA flow end-to-end, and per the CHANGELOG all backend tests (15 suites / 108 tests), frontend tests (338 tests), and both production builds were green at that point.

2. High-Level Architecture

Browser (localhost:8080)
   │ HTTPS / HTTP (dev)
   ▼
┌─────────────────────────────────────┐
│  Nginx                              │  apps/frontend/Dockerfile
│  serves Angular 19 SPA + runtime    │  (writes API_BASE_URL at runtime)
│  config; copies /img + legacy css   │
└──────────────┬──────────────────────┘
               │ API calls (withCredentials, x-csrf-token)
               ▼
┌─────────────────────────────────────┐
│  NestJS 11 API                      │  apps/backend (port 5007)
│  • TypeORM 0.3 ↔ SQL Server         │
│  • JWT access (15m) + refresh (7d)  │  HttpOnly SameSite=None cookies
│  • OTP 2FA + trusted devices        │  + double-submit CSRF
│  • Throttling, Helmet, nodemailer   │
└──────────────┬──────────────────────┘
               │ TCP 1433 (host.docker.internal)
               ▼
        SQL Server (external, not containerized)
        Database: orizzontdb
Orchestration: compose.yaml at repo root — two services (backend, frontend), one named volume (uploads). The database is intentionally not containerized; the stack connects to an existing host SQL Server.

3. Tech Stack
Layer	Technology	Version
Backend framework	NestJS	^11.0.1
Language	TypeScript	^5.7.3
ORM / DB driver	TypeORM + mssql	^0.3.31 / ^12.7.4
Auth	jsonwebtoken, bcryptjs, passport-local, @nestjs/jwt, @nestjs/passport	—
Mail	nodemailer	10.0.11
Security	helmet, cookie-parser, @nestjs/throttler	—
Frontend	Angular	^19.2.0 (standalone components, Karma + Jasmine)
E2E	Playwright	1.64.0
Image asset pipeline	custom Node script (scripts/generate-image-library.mjs)	—
Container	Docker Compose	backend + Nginx-served frontend
4. Backend — apps/backend/
Entry & configuration
src/main.ts — bootstrap: validates JWT_SECRET at startup (no fallback — server refuses to start without a strong secret), CORS with credentials: true, Helmet (HSTS only when ENFORCE_HTTPS=true), optional HTTPS redirect, cookie-parser, JSON body limit (default 1mb), global ProblemDetailsFilter + ValidationPipe (whitelist/forbidNonWhitelisted/transform), RequestIdMiddleware on all routes.
src/app.module.ts — TypeORM root module with synchronize off (DB_SYNCHRONIZE === 'true' only), tuned mssql pool (healthCheck: true, idleTimeoutMillis: 10s, requestTimeout: 30s, connectionTimeout: 15s, enableArithAbort: true), APP_GUARDs: ThrottlerGuard, JwtAuthGuard, PermissionsGuard, CsrfGuard (global guards).
Modules (15 feature modules)
auth, blog, contact, course, course-request, health, language, mail, media, notification, otp, settings, site-settings, trusted-device, plus common (RequestIdMiddleware, ProblemDetailsFilter).

Auth & security (audit-finding driven)
Cookies: access token (__Host-orizzonti_access, 15 min), refresh token (__Host-orizzonti_refresh, 7 days), CSRF token (non-HttpOnly so Angular can read it for x-csrf-token header), trusted-device cookie (30 days). __Host- prefix used when COOKIE_SECURE !== 'false'; in local HTTP dev falls back to SameSite=Lax plain names.
Flow: POST /auth/login checks trusted-device cookie → if valid, issues tokens directly; otherwise creates an OTP challenge, emails the code, returns { challengeRequired, challengeId, email }. POST /auth/complete-otp-verification verifies code, creates trusted device, issues tokens.
Refresh tokens: server-side allowlist in refresh_tokens table, jti rotated on each refresh, revoked on logout / password change / password reset / deactivation / deletion.
CSRF: double-submit; GET /auth/csrf issues the token; state-changing requests require x-csrf-token header.
Rate limiting: login 3 attempts / 10 min (throttling.ts), global throttle 600/min by default.
JWT_SECRET / REFRESH_TOKEN_SECRET validated at startup (min 32 chars, weak values rejected).
Entities (TypeORM, 15 tables)
AdminUser, Role, Permission, RefreshToken, Blog, Course, Language, LanguageLevel, ExamSession, ExamRegistration, MailSettings, SliderMedia, CourseRequest, SiteSettings, TrustedDevice, OtpChallenge, EmailNotification.

5. Frontend — apps/frontend/
Angular 19, standalone-component architecture:

src/app/pages/ — public pages: about-page, admin-login-page, blog-detail-page, blog-page, change-password-page, contact-page, courses-page, home-page, language-detail-page
src/app/admin/ — admin portal: blogs, courses, languages, layout (sidebar + shell), media, overview, pages, requests, settings, users (+ roles), testing
src/app/core/ — api (CRUD service + entities: access, content, language, site services), auth (guard, interceptor, CSRF token service), http (error interceptor), site, theme, toast
src/app/shared/ — image-library (generated from img/), layout, styles (design tokens), ui (data-table, glassy-carousel, svg-icon-animations, stepper, tabs, stat-card, theme-toggle, tooltip, skeleton, modal-shell, …)
src/app/services/orizzonti-api.service.ts — central API service; fetches CSRF token before state-changing requests when none cached.
Asset pipeline
npm run images runs scripts/generate-image-library.mjs → generates src/app/shared/image-library/image-library.generated.ts from img/. Hooked into prestart, prebuild, pretest. Must not be edited by hand; commit after adding pictures.
angular.json build also copies root img/ → img/, root css/style.css → legacy-css/, and other/ → other/ as assets.
Testing
Unit: Karma + Jasmine (npx ng test --watch=false --browsers=ChromeHeadless)
E2E: Playwright (npm run e2e), API-mocked, no DB writes; includes responsive breakpoints and a11y checks (axe-core).
6. Database
Engine: SQL Server (Azure/AWS/on-prem or local), database orizzontdb, accessed via TCP 1433. Not containerized.
Schema management: TypeORM synchronize is OFF. Per AGENTS.md, every entity/schema change requires: (1) an idempotent SQL script in other/, (2) the engineer applies it to the project database personally with a throwaway Node script (mssql + dotenv), verifies, deletes the script, never prints credentials.
Documented schema: docs/Database/ contains per-table dbo.*.Table.sql scripts, creation scripts for language_levels / exam_sessions, DATABASE_CHANGES_SUMMARY.md, and a full schema db.sql. The mail_settings table is configured for Gmail SMTP (testing) — should be switched to Elastic Email for info@orizzonti.tn before production.
⚠️ Discrepancy: other/ currently contains only legacyCode.rar (~272 KB). The CHANGELOG and AGENTS.md reference SQL migration scripts in other/ (e.g. phase8_otp_and_trusted_devices.sql, phase8b_email_notifications.sql), but those .sql files are not present in other/ — they may be inside the RAR or were never committed.
7. DevOps & Deployment
compose.yaml: backend image built from apps/backend/Dockerfile, frontend from apps/frontend/Dockerfile (Angular prod build + Nginx). backend port 5007 (overridable via BACKEND_HOST_PORT), frontend 8080. CORS origin set to http://localhost:8080 in Compose.
Environment: apps/backend/.env.example is the template; apps/backend/.env exists locally (400 bytes — contains real secrets, not inspected/printed). Required: JWT_SECRET (≥32 random chars). Optional but recommended: REFRESH_TOKEN_SECRET, DEFAULT_ADMIN_PASSWORD (first admin, must change at first login).
Production notes: HTTPS required (SameSite=None cookies rejected over plain HTTP); terminate TLS in front of the API or set COOKIE_SECURE=false for local HTTP dev only. CORS_ORIGINS must list exact frontend origin(s).
Changelog note: "The running Docker container has old code. Rebuild with docker compose up --build."
8. Documentation
File	Purpose
README.md (root)	Docker run instructions
AGENTS.md	Project rules for agents (DB changes, test commands, auth, image library, Postman)
CHANGELOG.md	Last 3 commits on Feature/migrate-to-angular (OTP 2FA, UI fixes, devin removal)
docs/API_ENDPOINTS_REFERENCE.md	Full endpoint reference
docs/api-contracts.md	API contracts
docs/ADMIN_PORTAL_GUIDE.md	Admin portal user guide
docs/audit.md	Security audit findings (referenced in code: #1 Helmet, #2 TLS, #4 cookies, #6 body limit, #8 request ID)
docs/backoffice-*	Backoffice documentation index, implementation roadmap, component examples, implementation summary
docs/role-permission-matrix.md, route-and-feature-mapping.md	RBAC mapping
docs/LANGUAGE_MANAGEMENT_IMPLEMENTATION.md	Language module docs
docs/Database/	Per-table DDL + full schema dump
docs/design/Orizzonti Admin Portal - Wireframes.html	Wireframes (1.2 MB)
docs/postman/Orizzonti API.postman_collection.json	Postman collection — 64 routes; must be updated when routes are added/changed
9. Project Health & Conventions
Git: on master, clean tree. Latest commit 099e1b2 = merge of Feature/migrate-to-angular (PR #7). Recent tags include V1.3.1.
Test status (per CHANGELOG, last commit): Backend npx jest — 15 suites, 108 tests, all passing; Frontend npx ng test — 338 tests passing; npx ng build green; npx nest build green.
Backend README is the generic NestJS starter template — not project-specific (could be improved).
Root-level legacy folders (css/, js/, scss/, lib/, img/, READ-ME.txt) appear to be the previous static-site codebase; only css/style.css and img/ are still consumed by the Angular build.
10. Observations & Recommendations
Missing migration scripts: other/ holds only legacyCode.rar; the SQL scripts referenced by AGENTS.md/CHANGELOG are absent as .sql files. If schema work is needed, create idempotent scripts in other/ per the project rule and apply them to orizzontdb before deploying.
Production SMTP: mail_settings is currently Gmail for testing; switch to Elastic Email (info@orizzonti.tn) before production.
Rebuild before deploy: The running Docker container is stale per the changelog — run docker compose up --build.
Environment file: apps/backend/.env must contain a strong JWT_SECRET (and ideally REFRESH_TOKEN_SECRET) — do not commit it; .env.example is the template to share.
Cookie/HTTPS: For local HTTP dev, set COOKIE_SECURE=false in .env; production requires HTTPS termination since SameSite=None cookies are rejected over plain HTTP.
Postman collection: docs/postman/Orizzonti API.postman_collection.json lists all 64 routes — update it whenever a controller route is added or changed.
Would you like me to dig deeper into any specific area (e.g., a particular module, the auth flow, database schema, or run the test suite/build to verify current state)?


View Changes
I want you to include my guardrails files in this folder path into my project D:\GitRepos\Freelance\All-skills-AI\guardrails-generic

