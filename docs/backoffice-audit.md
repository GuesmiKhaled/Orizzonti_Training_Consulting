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

Public routes use the Orizzonti site shell. Login and `/admin` use a separate backoffice shell with a permission-filtered sidebar and section workspace. Public pages still contain static content alongside API-backed admin-managed data.

### Backend API

The NestJS backend currently exposes these routes:

- `POST /auth/login`
- `GET /auth/profile`
- `GET /auth/roles`
- `GET /auth/permissions`
- `GET /auth/users`
- `POST /auth/users`
- `PATCH /auth/users/:id`
- `DELETE /auth/users/:id`
- `POST /auth/roles`
- `PATCH /auth/roles/:id`
- `DELETE /auth/roles/:id`
- `GET /dashboard/stats`
- `GET /course-requests`
- `GET /course-requests/:id`
- `POST /course-requests`
- `PATCH /course-requests/:id`
- `DELETE /course-requests/:id`
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
- `Role`
- `Permission`
- `CourseRequest`

### Authentication and authorization

The backend uses a JWT authentication guard and a permission guard:

- `AdminUser` stores `username` and `password`.
- `AuthService.validateUser()` checks username/password.
- `AuthService.login()` returns a JWT token.
- `AuthService.seedDefaultAdmin()` creates the default `admin` only when the admin table is empty and attaches a role-less legacy `admin` to `super-admin` without changing its password.
- User and role APIs return allow-listed user objects; password hashes are never returned.
- Mail settings responses omit SMTP passwords and indicate only whether a password is configured.

Admin CRUD routes are protected by permission metadata. Public content reads, contact submission, and course-request creation are explicitly public.

### Course requests / inquiries

Course requests are persisted through an ORM entity, validated DTOs, and list/read/create/update/delete API routes. Admin reads and updates require `manage_course_requests`.

## Gaps identified

1. No complete password reset, invitation, or audit-history workflow exists.
2. Contact endpoint rate limiting and SMTP delivery remain separate hardening/integration work; the current mailer is a placeholder.
3. Role UI and protected CRUD exist, but further end-to-end browser testing is still required for real non-super-admin role combinations.

## Verified implementation status

- JWT login/profile and permission guards are implemented.
- User and role CRUD routes use password hashing, DTO validation, safe response shaping, and last-super-admin protections.
- CRUD for blogs, courses, languages, settings, and slider media is protected by the corresponding permission.
- Admin dashboard sections are permission-filtered and separated behind a responsive sidebar.
- Course requests and dashboard statistics are persisted/derived through the local SQL Server-backed API.
- Backend unit tests and production builds have been run; Docker smoke checks verified the frontend and authenticated admin API.

## Recommended next phase

Continue hardening with an invitation/password-reset flow, audit logging, contact rate limiting, real SMTP transport, and browser-level tests using non-super-admin accounts.
