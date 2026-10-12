# Backoffice audit

## Scope

This document audits the current Orizzonti application as it exists in the repo today, with emphasis on the admin/backoffice layer, data model, authentication, and course-request flow.

## Verified current state

### Public website

The Angular frontend currently includes routes for:

- `/` home
- `/about`
- `/courses`
- `/contact`
- `/blog`
- `/blog/:slug`
- `/login`
- `/admin`

The root app shell still uses a simple nav and a basic admin login route. The public pages are not yet fully wired to a real CMS dataset; they have a mixture of static templates and API-backed sections.

### Backend API

The NestJS backend currently exposes these routes:

- `POST /auth/login`
- `POST /contact`
- `GET /blogs`
- `GET /blogs/:id`
- `POST /blogs`
- `PATCH /blogs/:id`
- `DELETE /blogs/:id`
- `GET /courses`
- `GET /courses/:id`
- `POST /courses`
- `PATCH /courses/:id`
- `DELETE /courses/:id`
- `GET /languages`
- `GET /languages/:id`
- `POST /languages`
- `PATCH /languages/:id`
- `DELETE /languages/:id`
- `GET /settings/mail`
- `PATCH /settings/mail`
- `GET /media`
- `POST /media`
- `PATCH /media/:id`
- `DELETE /media/:id`

This is confirmed by the controller files under `apps/backend/src` and the current app module wiring.

### Persistence layer

TypeORM is configured in `apps/backend/src/app.module.ts` and currently targets SQL Server on localhost with the database `orizzontdb` and the credentials provided by the project owner.

The currently registered entities are:

- `AdminUser`
- `Blog`
- `Course`
- `Language`
- `MailSettings`
- `SliderMedia`

### Authentication and authorization

The current auth implementation is minimal:

- `AdminUser` stores `username` and `password`.
- `AuthService.validateUser()` checks username/password.
- `AuthService.login()` returns a JWT token.
- `AuthService.seedDefaultAdmin()` creates a default `admin` user with password `admin123` on startup.

There is currently no role model, permission model, RBAC guard, or per-resource authorization layer.

### Course requests / inquiries

There is no confirmed ORM entity, DTO, service, or controller for course requests or inquiries in the current repo. The prompt asks for a course-request workflow, but there is no verified implementation yet.

## Gaps identified

1. No RBAC model exists yet.
2. No permission matrix is enforced in code.
3. No course request management module exists.
4. No metadata/statistics endpoint exists yet.
5. The admin dashboard is partially implemented but still reads and writes data without a secure role-aware structure.
6. The backend does not yet expose a standardized admin profile or permission payload.
7. Tests are not yet covering role-aware auth, course requests, or dashboard statistics.

## Verified implementation status

- Auth is present and working at a basic level.
- CRUD for blogs, courses, languages, settings, and slider media is present.
- Admin dashboard UI is present but still needs role and access control.
- Data persistence is working against the local SQL Server instance.
- There is no verified course-request or backoffice statistics feature yet.

## Recommended next phase

Implement a conservative RBAC layer and a course-request management feature, without disrupting the existing content CRUD. This should be layered in a way that preserves current admin capabilities while adding structured roles and access control.
