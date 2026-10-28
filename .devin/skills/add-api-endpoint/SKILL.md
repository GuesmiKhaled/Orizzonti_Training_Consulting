---
name: add-api-endpoint
description: Generates a new REST API endpoint in the NestJS backend.
argument-hint: "[entity] [httpMethod]"
allowed-tools:
  - read
  - grep
  - glob
  - exec
  - edit
  - write
---

You are an expert NestJS developer. Your task is to generate a new API
endpoint for the entity specified in the argument, in the
`apps/backend/src` NestJS project (TypeORM + SQL Server, class-validator,
JWT/RBAC guards, @nestjs/throttler).

1.  Locate the existing feature module under `apps/backend/src/<feature>/`
    (for example `blog/`, `course/`, `language/`, `media/`,
    `course-request/`). If no module exists for the entity, create one with
    `npx nest g resource <feature>` from `apps/backend` and adapt the
    generated files to the project conventions below.
2.  Add the route to the existing controller (preferred) or create a new
    controller registered in the feature module. Use the HTTP method given
    in the argument (GET, POST, PUT/PATCH, DELETE) with correct NestJS
    decorator (`@Get`, `@Post`, `@Patch`, `@Delete`).
3.  Implement the endpoint by calling the service layer, never the
    repository directly from the controller. Keep controllers thin.
4.  Authorize the route:
    - Public routes: decorate with `@Public()` (from
      `../auth/decorators/public.decorator`).
    - Protected routes: decorate with
      `@RequirePermission('<permission-name>')` (from
      `../auth/decorators/require-permission.decorator`). Use an existing
      permission name from `auth.service.ts` `defaultPermissions` unless a
      new one is explicitly required.
    - Public form routes that send email or write to the DB must add
      `@Throttle(PUBLIC_FORM_THROTTLE)` (from `../throttling`).
5.  Validate input with a class-validator DTO in `dto/`. Apply
    `@IsString`, `@IsInt`, `@IsOptional`, `@MinLength`, `@MaxLength`,
    `@IsBoolean`, etc. The global `ValidationPipe` already enforces
    `whitelist` + `forbidNonWhitelisted` + `transform`, so DTOs are the
    source of truth for allowed fields.
6.  Use `@Param('id', ParseIntPipe)` for numeric route params; return
    `NotFoundException` from the service when a resource is missing.
7.  Add a co-located `<feature>.controller.spec.ts` or
    `<feature>.service.spec.ts` test (Jest) covering at least the happy
    path, missing resource, and (for protected routes) unauthorized/forbidden
    access. Mock the repository/service with Jest mocks; do not hit the DB.
8.  Update `docs/postman/Orizzonti API.postman_collection.json` with the new
    route and an example request/response, per `AGENTS.md`.
9.  If the change adds or alters a database column, also write an idempotent
    SQL script in `other/` and apply it to the project database per
    `AGENTS.md` (TypeORM `synchronize` is off). Do not leave it for the user.
10. Verify: from `apps/backend` run `npx jest` and `npx nest build`. Fix any
    failures introduced by the change; pre-existing type errors in a few
    `*.spec.ts` files are not from this work and can be ignored.

Conventions to follow (observed in this repo):
- Controllers are `@Controller('<feature-plural>')` and delegate to an
  `@Injectable()` service.
- Public read endpoints often expose `findPublished()` for site visitors
  and a separate `findAllForAdmin()` under `@RequirePermission`.
- Never log passwords, tokens, or full credentials. The DB connection log
  in `app.module.ts` already redacts the password; keep it that way.
- Never add a fallback for `JWT_SECRET`; the app refuses to start without a
  strong one.
