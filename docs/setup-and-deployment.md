# Setup and deployment

## Local development

1. Create a local SQL database on `localhost`.
2. Copy the backend environment example and adjust credentials.
3. Install dependencies for frontend and backend.
4. Run backend and frontend independently.

## Required database setup

Create the configured SQL Server database and a user with access to it on localhost. Docker containers reach the host SQL Server through `host.docker.internal`; local backend development uses `localhost`.

Example config:

```env
DB_HOST=localhost
DB_PORT=1433
DB_NAME=orizzontdb
DB_USER=vagrok
DB_PASSWORD=replace-with-your-database-password
```

## Mail configuration

Mail settings must be managed from the admin dashboard and saved to the database, not hard-coded into the Angular bundle.

Suggested fields:

- SMTP host
- port
- user
- password
- from address
- secure flag

## Production notes

- Do not commit real secrets.
- Store production settings in the server environment or secret manager.
- Keep admin routes protected behind authentication.
- Use HTTPS in production.
