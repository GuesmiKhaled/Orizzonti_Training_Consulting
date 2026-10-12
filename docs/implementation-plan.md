# Implementation plan

## Phase 1 — Completed and verified

- Repository audit completed.
- Angular frontend created under `apps/frontend`.
- NestJS backend created under `apps/backend`.
- SQL Server database configured for localhost with database `orizzontdb`.
- Admin login exists and seeds a default `admin` user.
- CRUD modules for blog, course, language, settings, and media are present.
- Frontend and backend compile successfully.

## Phase 2 — Completed: RBAC and backoffice completion

### Goal

Persist role-based administration and course-request management while preserving the current admin CRUD implementation.

### Completed work

1. Persist role and permission metadata; link admin users to roles.
2. Expose profile, role, permission, and protected user-management APIs.
3. Add course-request persistence/workflow and dashboard statistics.
4. Add JWT authentication and permission guards, DTO validation, safe user responses, and last-super-admin protections.
5. Separate the admin workspace from the public shell and add permission-filtered sidebar sections for CMS, Users, and Roles.
6. Add backend tests for password hashing, role assignment, permission checks, and account safety.

### Entities

- `Role`
- `Permission`
- `CourseRequest`

### Endpoints

- `GET /auth/profile`
- `GET /auth/roles`
- `GET /dashboard/stats`
- `GET /course-requests`
- `POST /course-requests`
- `PATCH /course-requests/:id`
- `DELETE /course-requests/:id`

### Risk management

- Keep admin login compatibility intact.
- Do not remove the existing public website flow.
- Preserve existing CRUD endpoints while layering RBAC on top.
- Use TypeORM `synchronize: true` only for this local development setup, not as a production migration strategy.

## Phase 3 — Completed: Frontend backoffice

- Added Users and Roles/Permissions sections with search, pagination, create/edit, activation, assignment, and deletion.
- Added course-request listing/status management and role-aware sidebar sections.
- Added loading, empty, error, and success states for dashboard data.

## Phase 4 — In progress: Hardening and runtime checks

- Add audit logging, password reset/invitation, public contact rate limiting, and real SMTP delivery.
- Add browser-based tests for the permission-filtered admin workspace and mobile navigation.
- Add a clean setup guide and environment documentation.
- Document production deployment restrictions and secrets handling.

## Acceptance criteria

- Backoffice routes and admin APIs are role-aware.
- Course requests are persisted and listable.
- Dashboard stats reflect real data.
- Existing blog/course/language/media management continues to work.
- Existing build and DB startup verification remains green.
