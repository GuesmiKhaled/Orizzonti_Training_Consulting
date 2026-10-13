# Project notes

## Database changes
- TypeORM `synchronize` is off (`DB_SYNCHRONIZE` is not `true`), so schema changes are never applied automatically.
- For any entity/schema change, always write an idempotent SQL script in `other/` AND apply it to the project database (SQL Server, credentials in `apps/backend/.env`) yourself. Do not leave it for the user to run.
- Apply it with a throwaway Node script run from `apps/backend` (uses the installed `mssql` + `dotenv`), verify the result, then delete the script. Never print credentials.
- Applies to this project only.
