# Project notes

## Database changes
- TypeORM `synchronize` is off (`DB_SYNCHRONIZE` is not `true`), so schema changes are never applied automatically.
- For any entity/schema change, always write an idempotent SQL script in `other/` AND apply it to the project database (SQL Server, credentials in `apps/backend/.env`) yourself. Do not leave it for the user to run.
- Apply it with a throwaway Node script run from `apps/backend` (uses the installed `mssql` + `dotenv`), verify the result, then delete the script. Never print credentials.
- Applies to this project only.

## Verification commands
- Backend: `cd apps/backend && npx jest` and `npx nest build`. The build must be fully green; if it errors, fix the cause rather than suppressing it.
- Frontend unit/component/a11y: `cd apps/frontend && npx ng test --watch=false --browsers=ChromeHeadless` (set `CHROME_BIN`, e.g. to Brave, when Chrome is not installed), then `npx ng build`.
- Browser e2e (API mocked, no DB writes): `cd apps/frontend && E2E_BROWSER_PATH=<chromium-based browser> npm run e2e`.
- The backend refuses to start without a strong `JWT_SECRET`; never add a fallback. A separate `REFRESH_TOKEN_SECRET` is optional but recommended.

## Auth (cookie-based, audit finding #4)
- Access and refresh tokens live in httpOnly `SameSite=None; Secure` cookies, not localStorage. The frontend uses `withCredentials` and a double-submit CSRF token (`x-csrf-token` header) on state-changing requests.
- **HTTPS is required** in production (browsers reject `SameSite=None` cookies on plain HTTP). Terminate TLS in front of the API, or set `COOKIE_SECURE=false` for local HTTP dev only.
- Refresh tokens are tracked in a server-side allowlist (`refresh_tokens` table) and revoked on logout, password change, password reset, account deactivation, and account deletion. The `jti` is rotated on each refresh.
- `CORS_ORIGINS` must list the exact frontend origin(s); `credentials: true` is set server-side.

## Image library and Postman
- `apps/frontend/src/app/shared/image-library/image-library.generated.ts` is generated from `img/` by `npm run images` (runs before start, build and test). Do not edit it by hand; commit it after adding pictures.
- `docs/postman/Orizzonti API.postman_collection.json` lists every controller route (64). When a route is added or changed, update the collection and its examples.

## CHANGELOG rule (agent changes)
- Every change made by an agent must be logged in `CHANGELOG.md` under a new `[Unreleased]` entry before the task is considered complete.
- Entry format: date (ISO 8601), scope (backend/frontend/guardrails/docs), list of files changed, and a one-line summary.
- Example:
  ```
  ## [Unreleased] — YYYY-MM-DD

  ### Commit (agent) — <short description> (YYYY-MM-DD)

  #### Added / Changed / Removed
  - <file>: <what changed>
  ```

## Global rules (adapted from `.codeium/windsurf/memories/global_rules.md`)

- **Priority order (when rules conflict):** 1. Explicit user instructions and security. 2. Ask instead of guessing. 3. Stay in scope. 4. Keep code minimal. 5. Everything else.
- **Core principles:** Act as a senior software engineer and technical reviewer. Prioritize correctness, security, maintainability, readability, and performance. Inspect the existing solution, related files, project configuration, and established patterns before making changes. Preserve the existing architecture and coding conventions unless a change is explicitly requested or justified. Do not invent APIs, dependencies, database fields, business rules, or project requirements. Prefer simple, focused changes over unnecessary abstractions or large refactors.
- **Clarify, don't guess:** If the requirement, business rule, expected behavior, target environment, or affected scope is unclear, stop and ask before writing code. First try to answer by reading the code, configuration, tests, and docs. Ask once, in one message: numbered, specific questions, each with options and a recommended default. Do not continue on an unconfirmed assumption. Always ask before changing a contract, schema, or business rule; choosing between several plausible files or approaches; or touching anything you cannot trace or test.
- **Scope control:** Modify only the files required by the requested task. Before editing, list the files you will touch and why. If another file seems to need a change, do not change it — report it and ask for approval. Never do unrelated refactors, renames, reformatting, reordering imports, moving or deleting files, deleting code or tests, changing dependencies/package versions, config, CI/pipeline files, migrations, or lock files without explicit approval. Do not edit generated, vendor, or build-output files unless that is the task. Never overwrite or revert the user's uncommitted work. Leave working code you would have written differently untouched.
- **Concise code:** Write the smallest correct and readable solution. Reuse existing project code and framework built-ins before writing new code. Do not add speculative features, unused parameters/classes/interfaces, one-caller wrappers, extra layers, boilerplate, defensive code for cases that cannot happen, comments that restate the code, commented-out code, or dead code. Make targeted edits to the lines that must change. Size check: if the change is far larger than the task suggests, stop, look for the simpler approach, or ask. Validation and error handling required at trust boundaries stay.
- **Plan before coding:** For non-trivial tasks, inspect the relevant code and give a concise plan before editing: files to change, purpose of each change, breaking-change and security risks, and tests needed. Wait for approval before implementing.
- **Test before claiming:** Never claim a test passed, failed, or was executed unless the corresponding command was actually run and its result was inspected.
- **Code review mode:** When asked to review (not to implement), do not modify any file unless asked to fix. Report only real findings, ordered by severity: Blocking, Important, Minor. For each: `file:line`, the problem, why it matters, and a short suggested fix. Skip style points a linter or formatter already enforces.

## Project standards (adapted from `.codeium/windsurf/memories/project-standards.md`)

- **Tech stack:** Backend: NestJS 11 (TypeScript), TypeORM, SQL Server (`orizzontdb`). Frontend: Angular 19 (TypeScript). Testing: Jest (backend), Karma/Jasmine (frontend). Styling: SCSS.
- **Backend conventions:** Follow NestJS module/controller/service structure. API endpoints follow RESTful guidelines. Prefer async/await for all I/O. Use class-validator + NestJS ValidationPipe for model validation. TypeORM `synchronize` is off — schema changes via idempotent SQL scripts in `other/`.
- **Frontend conventions:** Use standalone components, directives, and pipes. Follow the Angular Style Guide for file and class naming. Prefer reactive forms over template-driven forms. Use RxJS with `takeUntilDestroyed`/`async` pipe for subscriptions.
- **Code style:** TypeScript: Enforce strict mode, use interfaces over types where possible. SCSS with BEM-like naming for component styles.

## Skills (from `.codeium/windsurf/skills/`)

- `secure-code-review` — Security-focused code reviews of NestJS/TypeORM APIs, Angular/TypeScript, SQL, authentication, authorization, and external service integrations. Use for security audits, PR reviews, and pre-release checks. Default: READ-ONLY review unless the user explicitly authorizes remediation.
- `angular-developer` — Angular code generation and architectural guidance. Trigger when creating components, services, HTTP communication, or for best practices on reactivity, forms, DI, routing, SSR, accessibility, animations, styling, testing, naming, or CLI tooling.
- `angular-frontend` — Build, debug, test, review, and refactor Angular applications using TypeScript, HTML templates, CSS, RxJS, forms, routing, and HTTP APIs. Inspect first, follow existing conventions, reuse existing components/services.
- `tdd-implementation` — Implement features, bug fixes, and refactoring using test-driven development (Red-Green-Refactor) in NestJS/TypeORM and Angular/TypeScript. Use when correctness and regression prevention are important.

## Playbooks (from `guardrails/PLAYBOOK-guardrails-review.md`)
- `!guardrails-review` — Audit a pull request or set of files against the team guardrails. Report only; do not change code unless explicitly requested. Covers security/auth, NestJS controllers/services/modules, REST endpoints/DTOs/validation, TypeORM entities/persistence, SQL Server queries/migrations, messaging/external integrations, Angular components/services/routing/state, and tests/config. Includes backend/frontend/database verification commands, violation report format, and specs.
- `!guardrails-implement` — Implement requested changes while respecting the project guardrails and NestJS 11 / TypeORM / SQL Server / Angular 19 architecture. Covers NestJS backend rules, TypeORM/SQL Server rules, Angular 19 rules, security rules, verification commands, and PR description requirements.
