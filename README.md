# Orizzonti_Training_Consulting

A website for an education center

## Run with Docker Desktop

Prerequisites: Docker Desktop with Docker Compose enabled, and the configured SQL Server database reachable from the host on port 1433.

1. Configure `apps/backend/.env` with database credentials and a long random `JWT_SECRET`.
2. Optionally set `BACKEND_HOST_PORT` in the root `.env` file to change the published backend port (default: `5007`). The frontend API URL follows this port automatically; set `API_BASE_URL` explicitly only when the browser-visible backend URL differs.
3. In Docker Desktop, ensure the SQL Server instance accepts TCP connections from Docker Desktop and that `orizzontdb` exists.
4. From the repository root, run `docker compose up --build`.
5. Open the frontend at <http://localhost:8080>. The API is published at <http://localhost:5007>.

To stop the containers, run `docker compose down`. The backend container loads credentials from `apps/backend/.env`; Compose overrides `DB_HOST` to `host.docker.internal` and CORS to the Docker frontend origin. The database is intentionally not containerized: this stack connects to the existing host SQL Server. TypeORM schema synchronization is disabled to avoid automatic schema changes. SMTP settings are read from `apps/backend/.env`.

Docker builds the Angular production bundle and serves it with Nginx, while the NestJS API runs in a separate container. Nginx writes the Compose-provided `API_BASE_URL` into a runtime config file, so changing the API URL does not require an Angular rebuild. The browser must be able to reach that URL from the computer running Docker Desktop.
