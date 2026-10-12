# Implementation plan

## Phase 1 — Completed and verified

- Repository audit completed.
- Angular frontend created under `apps/frontend`.
- NestJS backend created under `apps/backend`.
- SQL Server database configured for localhost with database `orizzontdb`.
- Admin login exists and seeds a default `admin` user.
- CRUD modules for blog, course, language, settings, and media are present.
- Frontend and backend compile successfully.

## Phase 2 — Current focus: RBAC and backoffice completion

### Goal

Add the missing role-based administration and request management model while preserving the current admin CRUD implementation.

### Work items

1. Add persisted role and permission metadata.
2. Link admin users to roles.
3. Expose user/profile and role data through auth endpoints.
4. Add a course-request entity and request workflow.
5. Add a dashboard statistics endpoint.
6. Add tests for new entities and the authentication layer.

### Proposed new entities

- `Role`
- `Permission`
- `CourseRequest`

### Proposed endpoints

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

## Phase 3 — Frontend follow-up

- Add a proper admin user management screen.
- Add a course-request listing and status-management screen.
- Add role-based visibility checks in the dashboard UI.
- Add loading and empty states for dashboard widgets.

## Phase 4 — Hardening

- Add DTO validation and permission guards.
- Add unit tests for auth, roles, and course requests.
- Add a clean setup guide and environment documentation.
- Document production deployment restrictions and secrets handling.

## Acceptance criteria

- Backoffice routes and admin APIs are role-aware.
- Course requests are persisted and listable.
- Dashboard stats reflect real data.
- Existing blog/course/language/media management continues to work.
- Existing build and DB startup verification remains green.
