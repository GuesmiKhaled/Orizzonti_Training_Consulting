# Playbook: !guardrails-review

## Overview

Audit a pull request or a set of files against the team guardrails.

Report only; do not change code, configuration, tests, analyzers, architecture or thresholds unless explicitly requested.

**Target stack:** NestJS 11 / TypeORM / SQL Server / Angular 19.

## Procedure

1. Identify changed files using the PR diff, Git diff or provided paths. Ask for the PR link or paths if none were given.
2. Classify the change:
   - Security and authentication
   - NestJS controllers, services, providers and modules
   - REST endpoints, DTOs and validation
   - TypeORM entities, repositories and persistence
   - SQL Server queries, transactions and migrations
   - Messaging and external integrations
   - Angular components, services, routing and state management
   - Tests and application configuration
3. Read the matching guardrail files under `docs/guardrails/`, following the references in `AGENTS.md`.
4. Inspect the implementation and its surrounding dependencies, callers, interfaces and tests.
5. Run applicable checklist commands where supported by the environment.

### Backend verification

```bash
npm ci
npm run lint
npm run build
npm test -- --runInBand
```

For integration tests:

```bash
npm run test:e2e
```

Use the actual scripts defined in `package.json`.

### Frontend verification

```bash
cd frontend
npm ci
npm run lint
npm run build
npm test -- --watch=false
```

Adapt commands to the actual Angular workspace configuration.

### Database verification

- Inspect TypeORM entity definitions and relationships.
- Review migration scripts and rollback behavior.
- Check SQL Server data types, precision, nullability and constraints.
- Verify parameterized queries.
- Inspect transaction boundaries and isolation requirements.
- Check indexes and potential N+1 queries.
- Never execute destructive operations against production.

6. Report each violation using this format:

```text
[ID] 🔴 BLOCKER | 🟡 WARNING

File:
Line:

Problem:
Rule:
Impact:
Fix:
Checklist:
```

7. Separate verified facts from interpretations and assumptions.
8. If information is missing (database configuration, transaction isolation, external broker, authentication mechanism), list it as an open question. Do not guess.
9. Finish with a summary:
   - Blocker and warning counts.
   - Rules checked and passed.
   - Rules not applicable.
   - Rules that could not be verified and why.
   - Open questions.

## Specifications

- Never modify code, analyzers, architecture tests or quality thresholds during a review.
- Never include real secrets, credentials, tokens or sensitive values in reports.
- Every finding must cite file path and line.
- Do not assume TypeORM behavior without inspecting its configuration and actual implementation.
- Do not treat successful compilation as proof of business correctness.
- Do not report speculative vulnerabilities as confirmed findings.

## Advice

- Review one PR at a time; large diffs can lead to shallow reviews.
- Treat 🔴 BLOCKER findings as merge blockers.
- Confirm findings with relevant tests or reproducible evidence.
- Distinguish SQL Server-specific issues from generic TypeORM issues.

---

# Playbook: !guardrails-implement

## Overview

Implement requested changes while respecting the project guardrails and existing NestJS 11 / TypeORM / SQL Server / Angular 19 architecture.

## Procedure

1. Before writing code, read the applicable guardrail files under `docs/guardrails/` using the references in `AGENTS.md`.
2. Inspect the repository:
   - `package.json` and lockfile.
   - NestJS modules, controllers, services and providers.
   - TypeORM configuration and entity definitions.
   - SQL Server migrations and database schema.
   - Angular workspace configuration and components.
   - Existing unit and integration tests.
3. For non-trivial changes, provide an implementation plan:
   - Requirements.
   - Files to create or modify.
   - Dependencies and impacted modules.
   - Database/API compatibility implications.
   - Tests required.
4. Write failing tests first for business rules, using exact values and exact boundaries.

### NestJS backend rules

- Follow existing module and dependency injection conventions.
- Keep controllers focused on HTTP handling.
- Keep business logic in appropriate providers/services.
- Use DTOs and `class-validator` / `class-transformer` where configured.
- Apply validation at API boundaries.
- Use guards, interceptors, pipes and exception filters according to their responsibilities.
- Avoid circular dependencies and unnecessary module coupling.
- Use asynchronous operations appropriately.
- Avoid leaking internal exceptions or sensitive information.
- Preserve API contracts and backward compatibility.

### TypeORM and SQL Server rules

- Follow existing entity and repository conventions.
- Avoid unnecessary eager relations and N+1 queries.
- Use parameterized queries; never concatenate untrusted input into SQL.
- Inspect generated SQL when query behavior is important.
- Use migrations for schema changes; do not rely on automatic schema synchronization in production.
- Verify SQL Server data types, precision, nullability and constraints.
- Handle transactions with the appropriate TypeORM transaction manager or QueryRunner.
- Ensure every transactional database operation uses the transaction-scoped manager.
- Consider concurrency, isolation and deadlock behavior.
- Verify indexes and query performance.
- Do not assume SQL Server supports syntax from another database engine.

### Angular 19 rules

- Follow the existing standalone/component architecture.
- Use strict TypeScript typing.
- Follow existing Angular dependency injection conventions.
- Use RxJS operators and subscription lifecycle management appropriately.
- Avoid memory leaks.
- Use reactive forms or the project's established form strategy.
- Keep API communication in services.
- Apply appropriate route guards and HTTP interceptors.
- Handle loading, error and success states.
- Avoid exposing secrets or sensitive data in browser storage and logs.
- Preserve frontend/backend API compatibility.

### Security rules

- Never hardcode credentials, tokens or secrets.
- Validate and sanitize untrusted input appropriately.
- Enforce authentication and authorization server-side.
- Protect sensitive information in logs and API responses.
- Use secure password hashing and approved cryptographic implementations.
- Avoid insecure random number generation for security-sensitive values.
- Protect against SQL injection, XSS, CSRF and broken access control where applicable.
- Never bypass security controls to make tests pass.

5. Implement the changes following existing project conventions.
6. Run verification commands:

**Backend**

```bash
npm run lint
npm run build
npm test -- --runInBand
npm run test:e2e
```

**Frontend**

```bash
npm run lint
npm run build
npm test -- --watch=false
```

7. Run the relevant guardrail checklist commands.
8. Fix applicable violations without disabling analyzers, weakening tests or lowering thresholds.
9. Review the complete Git diff for unintended changes.
10. In the PR description, list:
    - Guardrails applied.
    - Tests added and executed.
    - Commands executed and results.
    - Database migrations or schema changes.
    - Any guardrails that could not be satisfied and why.

## Specifications

- Do not silence ESLint or TypeScript errors to bypass quality requirements.
- Do not skip tests or architecture checks.
- Do not lower mutation testing thresholds.
- Do not modify unrelated files.
- Do not introduce breaking API changes without explicit authorization.
- Do not use TypeORM `synchronize: true` as a production migration strategy.
- Do not execute destructive SQL operations against production.
- Do not assume environment configuration or database settings.
- Do not claim tests passed if they were not executed.
- Do not touch unrelated projects or applications.