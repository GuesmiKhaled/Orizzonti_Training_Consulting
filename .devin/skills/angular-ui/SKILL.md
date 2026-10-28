---
name: angular-secure-modern-ui
description: "Build, review, and harden Angular applications with a modern, fluid, accessible UI, a secure login flow with two-factor authentication (2FA), continuous dependency vulnerability checks, authorized pentest and stress testing, and ongoing UX improvement, always backed by up-to-date internet research. Use this skill whenever the user works on an Angular project (components, routing, forms, guards, interceptors, styling, auth, build, deploy), mentions login, authentication, 2FA/MFA, security audit, pentest, vulnerabilities, npm audit, load or stress test, performance, accessibility, responsive or modern UI, UX, or design, even if they do not name the skill explicitly."
compatibility: "Requires an Angular workspace (angular.json). Web search / fetch tools strongly recommended. Security tooling (npm, osv-scanner, OWASP ZAP, k6, Playwright, Lighthouse) is used when available."
---

# Angular: Modern UI + Secure Auth + Continuous Security & UX Improvement

## Trigger On

- Any work inside an Angular workspace: new features, refactors, migrations, bug fixes
- Login, registration, password reset, session, token, guard, interceptor work
- Requests mentioning 2FA / MFA / OTP / TOTP / passkeys / WebAuthn
- Requests mentioning pentest, vulnerability, XSS, CSRF, hardening, dependency audit, `npm audit`, CVE
- Requests mentioning stress test, load test, performance, Core Web Vitals
- Requests mentioning UI, UX, design, responsive, fluid, modern, accessibility, dark mode

## Operating Principles

1. **Research before recommending.** Best practices change. Before proposing a design pattern, a security control, or a library, search the web and prefer primary sources:
   - Angular: `angular.dev` (official docs, security guide, update guide, style guide)
   - Security: OWASP Cheat Sheet Series, OWASP ASVS, OWASP Top 10, OWASP WSTG, NIST SP 800-63B
   - Web platform: MDN, `web.dev`, W3C WCAG 2.2, WAI-ARIA Authoring Practices
   - Vulnerabilities: GitHub Advisory Database, OSV.dev, NVD, npm advisories
   Cite the source and date in your answer. If you cannot search, say so and mark advice as "from training knowledge, verify".
2. **Detect first, change second.** Read `package.json`, `angular.json`, `tsconfig`, the router config, `app.config.ts`/`main.ts`, existing auth code, and the backend contract before editing. Match the Angular version in use (standalone vs NgModule, signals vs RxJS, zone vs zoneless, new control flow vs `*ngIf`). Propose a migration separately; do not mix it silently into a feature change.
3. **Never reduce security to add convenience.** If a request conflicts with a control below, explain the risk and offer a safe alternative.
4. **Authorized testing only.** See "Security Testing Scope".
5. **Deliver evidence.** Every claim of "secure", "fast", or "accessible" is backed by a command output, test result, or report, not by assertion.

## Workflow

### Step 1: Baseline (always)

Run and record, then summarize findings by severity:

```bash
node -v && npm -v && npx ng version
npm audit --omit=dev --audit-level=low        # or pnpm audit / yarn npm audit
npm outdated
npx osv-scanner --lockfile=package-lock.json  # cross-check with OSV (if installed)
npx ng build --configuration production        # build must pass
npx ng test --watch=false --browsers=ChromeHeadless  # or the project's runner
npx eslint .                                   # include angular-eslint template rules
```

Also check: secrets in repo (`gitleaks detect` / `trufflehog`), `package-lock.json` committed, no `*` or `latest` version ranges, `ng update` availability.

### Step 2: Dependency vulnerability policy (every session that touches dependencies, and on request)

- Run the audit commands above; for each High/Critical finding determine: direct vs transitive, reachable in production bundle vs dev-only, fix available.
- Fix order: `npm audit fix` (non-breaking) → `ng update` for Angular/CLI/Material → targeted upgrade → `overrides` / `resolutions` with a comment and ticket → replace the package.
- Search the web for the advisory (GHSA / CVE id) to confirm real impact and the patched version before upgrading.
- Never run `npm audit fix --force` without showing the user the breaking changes first.
- Prefer fewer, well-maintained dependencies. Flag packages that are abandoned (no release in 2+ years), single-maintainer with install scripts, or typo-squat lookalikes.
- Recommend CI gates: audit on every PR, Dependabot/Renovate weekly, lockfile integrity check (`npm ci`), and `npm audit signatures` for provenance.

### Step 3: Secure login phase

Treat the Angular app as an untrusted client. The server is the authority; the client only improves UX. See `references/security-testing.md` for the full checklist and test cases.

**Session / token strategy (pick, document, do not mix):**

- Preferred for first-party apps: **server-side session or tokens in `HttpOnly; Secure; SameSite=Lax/Strict` cookies**, plus CSRF protection (double-submit or synchronizer token; Angular's `withXsrfConfiguration` for `HttpClient`).
- If bearer tokens are required (separate API origin, mobile reuse): keep the access token **in memory only** (never `localStorage`/`sessionStorage`), short TTL (5-15 min), refresh token in an `HttpOnly` cookie with **rotation and reuse detection**, silent refresh via interceptor with single-flight (one refresh at a time).
- Use OIDC Authorization Code + PKCE for SSO. Never implicit flow or password grant.

**Login form and flow requirements:**

- Generic error messages ("Invalid credentials") to prevent user enumeration; same response time for unknown user vs wrong password.
- Server-side rate limiting per account **and** per IP, progressive delay / temporary lockout, CAPTCHA or proof-of-work only after repeated failures (accessible alternative required).
- Password policy per NIST 800-63B: min 12 chars (allow up to 64+), allow paste and password managers, no composition rules, no forced periodic rotation, check against breached-password list (HIBP k-anonymity API).
- `autocomplete="username"` / `current-password` / `new-password` / `one-time-code` set correctly.
- Never log credentials or tokens; never put them in URLs.
- Logout invalidates the session server-side and clears client state; handle multi-tab logout (`BroadcastChannel`).
- Route guards (`CanActivateFn`, `CanMatchFn`) are UX only; every API endpoint must enforce authorization server-side.
- Interceptor (`HttpInterceptorFn`) attaches credentials only to your own API origins, handles 401 once, and never retries non-idempotent requests blindly.
- Re-authentication (step-up) for sensitive actions: change password/email, disable 2FA, payments, role changes.

**Angular-side hardening that supports login:**

- Strict CSP (nonce-based, no `unsafe-inline` scripts), `Trusted Types` (`require-trusted-types-for 'script'`), `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, `frame-ancestors 'none'` (clickjacking), HSTS. Verify with `securityheaders.com`, Mozilla Observatory, and Chrome DevTools.
- Never call `bypassSecurityTrust*` on user-influenced data; never use `innerHTML` with unsanitized input; no `eval` / `new Function`.
- Disable source maps in production, no secrets or API keys in `environment.ts` (anything shipped to the browser is public).

### Step 4: Two-factor authentication (add it if it does not exist)

**First, detect.** Search the frontend and backend for: `2fa`, `mfa`, `totp`, `otp`, `authenticator`, `webauthn`, `passkey`, `TwoFactor`, `RecoveryCode`. Report what exists and its quality (see weaknesses below). Only if missing or weak, propose and implement.

**Preferred order of factors (search current OWASP/NIST guidance to confirm):**

1. **Passkeys / WebAuthn (FIDO2)**: phishing-resistant, best UX. Use `@simplewebauthn/browser` + server library.
2. **TOTP (RFC 6238)** authenticator apps: universal fallback. 6 digits, 30 s step, SHA-1 default for app compatibility, accept ±1 step skew, **single use per window** (store last accepted step to prevent replay).
3. **Recovery codes**: 8-10 one-time codes, high entropy, stored hashed server-side, shown once, downloadable/printable.
4. **SMS/email OTP**: last resort only (SIM-swap / phishing risk); short expiry (≤10 min), rate limited, single use, hashed at rest.

**Required behavior:**

- Enrollment: show QR (`otpauth://` URI) + manual secret, require a valid code before enabling, then issue recovery codes. Secret encrypted at rest.
- Login: after password success, return a **short-lived, single-purpose "pre-auth" state** (not a full session). Full session only after the second factor verifies. The 2FA step must be enforced **server-side**; never rely on a client flag.
- Brute-force protection on the code endpoint: strict attempt cap (e.g., 5), lockout/backoff, notify the user.
- "Remember this device" optional, using a signed, rotating, `HttpOnly` cookie bound to the device, max 30 days, revocable.
- Management UI: view/disable factors (requires step-up re-auth), regenerate recovery codes, list and revoke sessions/devices.
- Admin and privileged roles: 2FA **mandatory**.
- Angular UI: stepper or dedicated route, `inputmode="numeric"`, `autocomplete="one-time-code"`, auto-advance OTP input with paste support, clear error and countdown, full keyboard and screen reader support, no layout shift.

**Backend note for this stack:** for ASP.NET Core Identity use the built-in authenticator-app support (`GetAuthenticatorKeyAsync`, `VerifyTwoFactorTokenAsync`, `GenerateNewTwoFactorRecoveryCodesAsync`, `TwoFactorAuthenticatorSignInAsync`). Verify against current Microsoft Learn docs before coding.

### Step 5: Modern, fluid UI

Search `angular.dev`, `web.dev`, MDN, and the Material 3 guidelines for current guidance before choosing patterns. Defaults:

**Architecture**
- Standalone components, `inject()`, signals (`signal`, `computed`, `effect`, `input()`, `output()`, `model()`, `resource`/`httpResource` where stable), `ChangeDetectionStrategy.OnPush`, new control flow (`@if`, `@for` with `track`, `@switch`), `@defer` for below-the-fold and heavy widgets, lazy-loaded routes, typed reactive forms, `NgOptimizedImage`. Verify each feature's stability in the installed Angular version.
- Smart/dumb component split, feature folders, one design-token source of truth.

**Fluid layout**
- Mobile-first. CSS Grid + Flexbox, `gap`, logical properties (`margin-inline`, `padding-block`) for RTL/LTR (relevant for Arabic/French/English sites).
- Fluid type and spacing with `clamp()`: e.g. `font-size: clamp(1rem, 0.9rem + 0.5vw, 1.25rem)`. Use `rem`, not `px`, for text.
- **Container queries** (`@container`) for component-level responsiveness; media queries only for page-level shifts.
- Modern CSS where supported (check caniuse/baseline): `:has()`, `aspect-ratio`, `min()/max()`, `dvh/svh` units, `color-mix()`, `@layer`, native nesting, `scroll-snap`, View Transitions API (Angular router `withViewTransitions()`).
- Touch targets ≥ 44×44 px (WCAG 2.2 target size), visible focus ring, sticky headers that do not hide focused elements.

**Visual system**
- Design tokens as CSS custom properties (color, spacing scale, radius, elevation, motion durations). Light/dark/auto via `prefers-color-scheme` + user override persisted; `color-scheme` meta.
- Angular Material 3 / CDK (or a maintained system such as PrimeNG, Spartan UI) themed with tokens. Do not mix multiple component libraries.
- Typography: 1-2 variable fonts, self-hosted, `font-display: swap`, preload the critical file. Avoid generic template-looking layouts; give the product a deliberate, consistent visual identity.
- Micro-interactions: purposeful, 150-250 ms, honor `prefers-reduced-motion`. Skeleton loaders over spinners, optimistic UI where safe, clear empty/error/offline states.

**Accessibility (non-negotiable)**
- WCAG 2.2 AA: contrast ≥ 4.5:1 text / 3:1 UI, keyboard-only operability, semantic HTML first, ARIA only to fill gaps, live regions for async status, labels tied to inputs, error summaries focused on submit failure, `lang` attribute, skip link.
- Verify with `axe-core` / `@axe-core/playwright`, Lighthouse a11y, and a manual keyboard + screen reader pass (NVDA/VoiceOver).

**Performance (Core Web Vitals targets: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1)**
- Production build budgets in `angular.json`, route-level code splitting, `@defer`, image optimization and `srcset`, preconnect to critical origins, HTTP caching with hashed assets, Brotli/gzip, SSR/SSG/hydration (incremental hydration where it fits), service worker only when an offline strategy is defined.
- Measure with Lighthouse CI, WebPageTest, and Chrome DevTools; compare before/after.

### Step 6: Security testing (pentest, infiltration, stress)

**Scope gate: do this before any active test.**

Active testing (scanning, fuzzing, brute-force simulation, load) is performed **only** against:
- `localhost` / local containers,
- a staging or test environment the user owns or has written authorization to test,
- never production, third-party systems, or shared infrastructure without explicit written approval from the owner. If scope is unclear, **ask first**.

Confirm in the conversation: target URL(s), environment, allowed tools, time window, rate caps, and a rollback/contact plan. Keep a short `SECURITY-TEST-LOG.md` entry (date, target, tools, findings).

**Test plan (use `references/security-testing.md` for commands and cases):**

1. **Static**: `eslint-plugin-security`/Semgrep rulesets for TypeScript+Angular, `gitleaks`, `npm audit`, `osv-scanner`, template review for `innerHTML`, `bypassSecurityTrust*`, `href` / `src` bindings with user data, `postMessage` handlers, open redirects after login (`returnUrl` allow-list).
2. **Dynamic (DAST)**: OWASP ZAP baseline then full scan against staging; authenticated scan using a test account; Nuclei templates for known misconfigurations; `testssl.sh` for TLS; header check.
3. **Manual / logic (OWASP WSTG + ASVS L2)**: authentication bypass, IDOR/BOLA on every API route, privilege escalation (BFLA), session fixation, token replay after logout, CSRF, CORS misconfiguration, 2FA bypass (skip step, reuse code, race conditions, response manipulation), password-reset poisoning, user enumeration (response and timing), file-upload abuse, mass assignment, SSRF through the backend.
4. **Stress / load / resilience** (staging only): `k6` (preferred), Artillery, or JMeter. Scenarios: login burst, 2FA verify burst, typical user journey, spike, soak (30-60 min), and rate-limit validation (expect 429 + `Retry-After`, not 500). Record p50/p95/p99 latency, error rate, CPU/memory, DB connections. Verify graceful degradation and that lockouts do not enable denial of service against legitimate users.
5. **Report**: severity (CVSS or High/Med/Low), proof of concept (minimal, non-destructive), affected file/route, root cause, fix, and a regression test. Fix, then **re-test**.

Do not produce weaponized exploits, malware, credential-stuffing tooling against real services, or instructions for attacking systems the user does not control. Proof-of-concept payloads are limited to what is needed to demonstrate the issue on the authorized target.

### Step 7: Continuous UX improvement

On each feature or review, research and propose 2-5 concrete, prioritized improvements (impact vs effort), citing sources (Nielsen Norman Group, web.dev, Baymard, GOV.UK design system, Material guidelines):

- Reduce steps and cognitive load (progressive disclosure, sensible defaults, inline validation on blur, not on every keystroke, input masks and clear formats).
- Forms: single column, visible labels, helpful error text that says how to fix it, preserve input on error, show/hide password toggle, passkey/biometric option on login.
- Feedback: loading, success, error states within 100 ms perception threshold; toasts for non-critical, inline for critical; undo instead of confirm dialogs where possible.
- Navigation and IA: findability, breadcrumbs, predictable back behavior, deep-linkable state in the URL.
- Content: plain language, localization (fr/ar/en), correct date/number/currency formatting via `Intl`/Angular i18n, RTL support.
- Resilience: offline/slow-network handling, retry with backoff, skeletons, error boundaries (`ErrorHandler`) with friendly fallback and correlation id.
- Measure: add analytics/RUM for Web Vitals and key funnels (privacy-respecting, consent-aware), run usability checks and A/B only with real traffic.

## Deliver

- Working Angular code that builds in production mode and passes lint and tests
- A short findings report: dependency vulnerabilities (before/after), security issues by severity, a11y and performance scores (before/after)
- Auth/2FA implementation with server-side enforcement and tests (unit + e2e: success, wrong code, replay, lockout, recovery code)
- A prioritized UX improvement list with sources
- Updated docs: threat model notes, runbook for token/session handling, how to rerun the audits

## Validate

- `ng build --configuration production` and tests pass; no new lint errors
- `npm audit --omit=dev` shows no unaddressed High/Critical (or each is documented with justification and an owner)
- No tokens/secrets in `localStorage`, source, logs, URLs, or environment files
- CSP and security headers verified live; no `bypassSecurityTrust*` on untrusted data
- 2FA is enforced on the server; direct API calls without the second factor are rejected (tested)
- Rate limiting returns 429 under test load and the app recovers without restart
- Lighthouse: Performance, Accessibility, Best Practices, SEO scores recorded; axe shows no critical violations
- Active tests ran only against authorized, non-production targets, and the log is updated

## References

- [references/security-testing.md](references/security-testing.md) - concrete commands, k6 script, ZAP usage, auth/2FA test matrix, and header baseline
