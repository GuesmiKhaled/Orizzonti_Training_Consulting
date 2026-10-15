# Project notes

## Database changes
- TypeORM `synchronize` is off (`DB_SYNCHRONIZE` is not `true`), so schema changes are never applied automatically.
- For any entity/schema change, always write an idempotent SQL script in `other/` AND apply it to the project database (SQL Server, credentials in `apps/backend/.env`) yourself. Do not leave it for the user to run.
- Apply it with a throwaway Node script run from `apps/backend` (uses the installed `mssql` + `dotenv`), verify the result, then delete the script. Never print credentials.
- Applies to this project only.

## Verification commands
- Backend: `cd apps/backend && npx jest` and `npx nest build` (pre-existing type errors in a few `*.spec.ts` files are not from recent work).
- Frontend unit/component/a11y: `cd apps/frontend && npx ng test --watch=false --browsers=ChromeHeadless` (set `CHROME_BIN`, e.g. to Brave, when Chrome is not installed), then `npx ng build`.
- Browser e2e (API mocked, no DB writes): `cd apps/frontend && E2E_BROWSER_PATH=<chromium-based browser> npm run e2e`.
- The backend refuses to start without a strong `JWT_SECRET`; never add a fallback.
