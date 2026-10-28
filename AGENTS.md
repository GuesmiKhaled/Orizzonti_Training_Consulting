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
