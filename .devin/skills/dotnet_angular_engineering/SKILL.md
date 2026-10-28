# NestJS + Angular Engineering Playbook

**Skills, rules, testing, UI/UX, animation, security, vulnerabilities,
performance, DevOps, and AI coding-agent instructions**

This is a practical engineering checklist for production applications
built with modern NestJS / Node.js (TypeScript), Angular, and SQL Server
(or another TypeORM-supported database). The original playbook targeted
.NET / ASP.NET Core; the backend sections below have been remapped to
NestJS + TypeORM + class-validator, which is the stack used by this
repository. Adapt rules to the actual project and supported framework
versions; not every architecture pattern is appropriate for every
application.

## 1. Skills checklist

### Architecture and engineering

-   [ ] Clean Architecture or modular architecture where it adds value
-   [ ] SOLID, DRY, KISS, YAGNI
-   [ ] Domain-driven design when domain complexity justifies it
-   [ ] Dependency injection and separation of concerns
-   [ ] Design patterns and appropriate abstractions
-   [ ] Naming, folder structure, code conventions
-   [ ] Configuration and environment separation
-   [ ] API versioning and backward compatibility

### Angular UI development

-   [ ] Standalone components and feature-based structure
-   [ ] Signals, RxJS and reactive state management
-   [ ] Typed reactive forms and validation
-   [ ] Reusable components, directives and pipes
-   [ ] Routing, lazy loading and route guards
-   [ ] HTTP interceptors and error handling
-   [ ] Lifecycle management and memory leak prevention
-   [ ] Change detection and rendering performance

### UI/UX, styling and animation

-   [ ] Responsive and mobile-first layouts
-   [ ] Design tokens, typography, spacing and color
-   [ ] CSS architecture, encapsulation, Grid and Flexbox
-   [ ] CSS transitions/keyframes, Web Animations API or
    Angular-supported animation mechanisms
-   [ ] Loading, empty, success, validation and error states
-   [ ] Micro-interactions and reduced-motion support
-   [ ] Dark mode and theming when required
-   [ ] Visual consistency and responsive QA

### Backend APIs

-   [ ] REST design and correct HTTP semantics
-   [ ] DTOs, mapping and server-side validation
-   [ ] Authentication and authorization
-   [ ] Middleware, filters and exception handling
-   [ ] Async/await and cancellation/AbortSignal propagation
-   [ ] Pagination, filtering, sorting and search
-   [ ] Idempotency, rate limiting and safe retries
-   [ ] OpenAPI / Swagger and API contracts

### Database and data access

-   [ ] SQL schema design and normalization
-   [ ] TypeORM repositories, query builder and query optimization
-   [ ] SQL Server provider specifics (encrypt, trustServerCertificate)
-   [ ] Transactions and concurrency control
-   [ ] Indexes and execution plans
-   [ ] Connection pooling and resource disposal
-   [ ] Migrations/idempotent SQL scripts and backward-compatible changes
-   [ ] Parameterized queries, retention and data lifecycle

### Testing and quality

-   [ ] Unit testing and TDD where practical
-   [ ] Angular component and service tests
-   [ ] API integration tests
-   [ ] End-to-end browser tests
-   [ ] Contract and regression testing
-   [ ] Appropriate use of mocks and test doubles
-   [ ] Critical business-path coverage
-   [ ] Static analysis and maintainability gates

### Security and vulnerabilities

-   [ ] OWASP Top 10 and OWASP API Security Top 10
-   [ ] OWASP ASVS security requirements
-   [ ] Authentication, authorization and least privilege
-   [ ] XSS, CSRF, SSRF, injection and path traversal prevention
-   [ ] CORS, CSP, secure cookies and security headers
-   [ ] Secrets management and sensitive-log masking
-   [ ] Dependency, container and source-code scanning
-   [ ] Threat modeling and security regression tests

### Performance and resilience

-   [ ] Angular bundle budgets and lazy loading
-   [ ] Caching and cache invalidation
-   [ ] Database query profiling
-   [ ] Async I/O and bounded concurrency
-   [ ] Timeouts, retries and circuit breakers
-   [ ] Rate limits and resource limits
-   [ ] Load, stress and soak testing
-   [ ] Memory, CPU and network profiling

### Accessibility and compatibility

-   [ ] Semantic HTML and accessible forms
-   [ ] Keyboard navigation and focus management
-   [ ] WCAG 2.2 AA-oriented evaluation
-   [ ] Screen-reader labels and announcements
-   [ ] Color contrast and zoom support
-   [ ] RTL and localization where required
-   [ ] Cross-browser and responsive testing
-   [ ] Automated and manual accessibility audits

### DevOps and operations

-   [ ] Git workflow and pull-request reviews
-   [ ] CI/CD pipelines and quality gates
-   [ ] Docker and environment configuration
-   [ ] Database deployment and rollback planning
-   [ ] Structured logging, metrics and tracing
-   [ ] Health checks and readiness probes
-   [ ] SAST, DAST, SCA and secret scanning
-   [ ] Incident response, backups and recovery

## 2. Non-negotiable engineering rules

### General

1.  Read relevant code, callers, dependencies and project conventions
    before changing code.
2.  For non-trivial work, plan first: files to change, design, risks,
    tests, acceptance criteria and migration impact.
3.  Prefer the smallest correct change. Avoid unrelated refactors.
4.  Never claim tests or checks passed unless they actually ran and
    passed.
5.  Use descriptive names and explicit types where they improve clarity.
6.  Avoid duplicate logic, deeply nested conditionals, giant methods and
    God classes.
7.  Do not swallow exceptions or return fake success responses.
8.  Do not add dependencies without checking whether existing
    functionality is sufficient.
9.  Do not disable warnings or security checks just to make a pipeline
    pass.
10. Preserve unrelated user changes and never expose secrets in
    generated files.

### NestJS backend

-   Keep controllers thin; isolate business logic in testable
    `@Injectable()` services (providers/modules).
-   Validate untrusted input at system boundaries with class-validator
    DTOs and the global `ValidationPipe` (`whitelist`,
    `forbidNonWhitelisted`, `transform`).
-   Use request/response DTOs; do not expose persistence entities by
    default.
-   Use async I/O for asynchronous database and network operations;
    avoid `.toPromise()` / blocking calls in request paths.
-   Propagate `AbortSignal` / cancellation where supported by downstream
    clients.
-   Centralize exception handling with a global `ExceptionFilter` and
    return consistent RFC 9457 Problem Details responses where
    appropriate.
-   Use structured logs (NestJS `Logger` or pino/winston) and correlation
    IDs; never log OTPs, credentials, full card numbers or sensitive
    tokens.
-   Enforce authorization on every protected operation via
    `@RequirePermission` guards, including resource/object-level checks.
-   Keep secrets outside source control and validate configuration at
    startup (e.g. `assertJwtSecretConfigured`); never add a fallback for
    `JWT_SECRET`.
-   Parameterize SQL via TypeORM repositories/query builder; manage
    transactions and concurrency explicitly; avoid N+1 queries.
-   Set timeouts and retry only transient, safe-to-retry operations.
-   Preserve API contracts unless breaking changes are explicitly
    approved.
-   Apply Clean/Modular Architecture only when it improves
    maintainability, testability or business-rule isolation.

### Angular frontend

-   Follow the repository's Angular and TypeScript versions and
    established conventions.
-   Prefer small cohesive components and feature-based organization.
-   Use signals for suitable state and RxJS for stream composition and
    asynchronous workflows.
-   Use typed reactive forms for complex or business-critical forms.
-   Centralize common HTTP transport concerns where appropriate.
-   Lazy-load suitable feature areas.
-   Treat client-side route guards as UX, not backend authorization.
-   Avoid complex business logic in templates, unsafe HTML and expensive
    repeated computations.
-   Use lifecycle-aware cleanup, `AsyncPipe`, or signal interop
    appropriately.
-   Use design tokens and shared components instead of scattered magic
    values.
-   Implement loading, empty, validation, success, error and disabled
    states.
-   Use semantic HTML, keyboard-operable controls, visible focus and
    meaningful labels.
-   Keep dependencies compatible and update them through controlled,
    tested changes.

## 3. UI, styling and animation rules

### Visual design

-   Define tokens for color, spacing, typography, radii, shadows and
    z-index.
-   Use CSS Grid and Flexbox appropriately.
-   Support mobile, tablet, desktop, browser zoom and long content.
-   Keep spacing, typography and component variants consistent.
-   Avoid arbitrary positioning, excessive `!important`, and global CSS
    leakage.
-   Validate themes if both light and dark modes are supported.

### Interaction states

-   Every control must perform its advertised action.
-   Prevent accidental duplicate submissions.
-   Show field-level validation and useful server errors.
-   Provide suitable loading/progress indicators.
-   Handle empty results, timeouts, offline states and expired sessions.
-   Preserve user input after recoverable errors when safe and useful.

### Animation

-   Animate only when motion clarifies state or improves feedback.
-   Prefer `transform` and `opacity` for smooth transitions.
-   Avoid animating layout-heavy properties unnecessarily.
-   Respect `prefers-reduced-motion`.
-   Manage focus correctly in dialogs and drawers.
-   Do not delay important actions with decorative animation.
-   Test on low-powered devices and touch interfaces.
-   Do not add an animation library for a trivial CSS transition.

### UI acceptance checklist

-   [ ] Desktop, tablet and mobile layouts work.
-   [ ] Keyboard navigation and visible focus work.
-   [ ] Valid, invalid, pristine and disabled form states are covered.
-   [ ] Loading, empty, success and failure states are implemented.
-   [ ] No unintended horizontal overflow or clipped dialogs.
-   [ ] Motion timing and reduced-motion behavior are appropriate.
-   [ ] Accessible names, contrast and semantic markup are present.
-   [ ] No console errors, broken assets or unintended network calls.

## 4. API design and integration

-   Use correct HTTP methods and status codes.
-   Validate input on the server even when Angular validates it.
-   Standardize DTO naming, date formats, numeric precision and
    nullability.
-   Define pagination, filtering and sorting contracts explicitly.
-   Prefer RFC 9457 Problem Details where suitable and standardize the
    schema.
-   Maintain OpenAPI documentation.
-   Use UTC or explicit time zones; avoid ambiguous date strings.
-   Define timeouts and cancellation behavior for external services.
-   Use idempotency for payment and other non-idempotent business
    operations where appropriate.
-   Verify client-provided roles, prices, ownership IDs and permissions
    server-side.
-   Test CORS, authentication, authorization and validation
    independently.
-   Treat compatibility as a requirement when changing DTOs or
    endpoints.

Example error shape (adapt to your API standard):

``` json
{
  "type": "https://api.example.com/problems/validation",
  "title": "Validation failed",
  "status": 400,
  "detail": "One or more fields are invalid.",
  "errors": {
    "email": ["A valid email address is required."]
  }
}
```

## 5. Security and vulnerability prevention

### Angular

-   Use Angular template escaping; avoid bypass-security APIs unless
    rigorously justified.
-   Never use `eval` or construct executable code from untrusted input.
-   Avoid unsafe HTML rendering and unnecessary direct DOM manipulation.
-   Do not store long-lived sensitive credentials in localStorage by
    default.
-   Choose authentication and session architecture deliberately; protect
    cookie-based sessions against CSRF.
-   Do not treat route guards, hidden buttons or client role checks as
    authorization.
-   Configure CSP and security headers at the server or edge.
-   Handle session expiry and logout predictably.

### NestJS API and infrastructure

-   Enforce authentication and resource-level authorization server-side
    (JWT guard + `@RequirePermission`).
-   Prevent SQL injection with TypeORM parameterized queries / query
    builder; never concatenate user input into SQL.
-   Validate and constrain input sizes, uploads, URLs and deserialized
    objects (class-validator + `ValidationPipe`).
-   Protect against SSRF, open redirects, path traversal and unsafe file
    handling (validate upload magic bytes, deny dotfiles, randomize
    names).
-   Configure CORS with explicit trusted origins
    (`process.env.CORS_ORIGINS`).
-   Apply rate limits (`@nestjs/throttler`), request-size limits,
    timeouts and resource quotas.
-   Use an approved secret manager and rotate compromised credentials.
-   Use HTTPS, suitable cookie flags, HSTS and security headers
    (helmet or equivalent).
-   Apply least-privilege identities and restrict network access.
-   Redact sensitive logs and prevent log injection.
-   Use vetted cryptographic libraries (`bcryptjs`, `jsonwebtoken`); never
    invent algorithms.
-   Check object-level, tenant-level and function-level authorization
    (IDOR/BOLA).

### Supply chain and release

-   Scan NuGet/npm dependencies for known vulnerabilities.
-   Run SAST and secrets detection.
-   Run DAST against an authorized test deployment.
-   Scan container images and release artifacts.
-   Lock/pin dependency versions and review transitive dependencies.
-   Generate an SBOM when required and define remediation targets.
-   Block releases for agreed critical findings.
-   Retest fixes and retain verification evidence.

A scanner passing does not prove an application secure. Business-logic
flaws and missing authorization checks require targeted tests and human
review.

## 6. Testing strategy

Use a balanced testing pyramid: many fast focused tests, integration
tests at important boundaries, and end-to-end tests for critical
journeys.

  --------------------------------------------------------------------------
  Area                    NestJS examples           Angular examples
  ----------------------- ------------------------ -------------------------
  Unit tests              Jest (ts-jest),          Vitest or supported
                          NestJS testing module     project runner
                                                  (Karma/Jasmine here)
  Mocking                Jest mocks,             Test doubles and HTTP
                         `@nestjs/testing`        testing utilities

  Integration             NestJS app module        HTTP contract tests
                          with test DB / mocked
                          repositories
  End-to-end              Supertest against        Playwright or Cypress
                          NestJS app               (Playwright here)

  Static quality          ESLint, TypeScript       ESLint, TypeScript checks
                          checks, SonarQube

  Security                SAST, dependency         Dependency/SAST/browser
                          scanning, DAST          security checks

  Performance             k6 or equivalent for    Lighthouse, browser
                          the API                  profiling, k6 for APIs
  --------------------------------------------------------------------------

### Test cases for each meaningful feature

1.  Happy path.
2.  Invalid and missing input.
3.  Boundary values and maximum sizes.
4.  Unauthorized and forbidden access.
5.  Missing or nonexistent resources.
6.  Duplicate requests and concurrency where relevant.
7.  Downstream timeout and failure.
8.  Transaction rollback where relevant.
9.  Frontend loading, empty and error states.
10. Regression tests for previously discovered defects.

For payment/financial systems, add idempotency, transaction integrity,
duplicate processing, reconciliation and audit-trail tests.

Target strong coverage of business-critical behavior; line coverage
alone is not proof of correctness.

## 7. Performance and reliability

### Angular

-   Lazy-load feature routes when beneficial.
-   Configure bundle-size budgets.
-   Track repeated template items with stable identity.
-   Debounce searches where appropriate and cancel stale requests.
-   Avoid duplicate HTTP requests and unmanaged subscriptions.
-   Optimize images and loading behavior.
-   Profile rendering before adding complexity.
-   Measure Core Web Vitals and real-device responsiveness.

### NestJS API

-   Measure database queries and API latency before optimizing.
-   Use TypeORM `select` projections and retrieve only required columns.
-   Avoid N+1 queries and unbounded result sets.
-   Apply pagination, query limits and measured indexes.
-   Use async I/O and dispose resources correctly.
-   Cache only with a deliberate invalidation/consistency strategy.
-   Bound concurrency and set timeouts.
-   Retry only safe operations; do not blindly retry non-idempotent
    payments.
-   Monitor latency percentiles, error rate, throughput, CPU, memory and
    connection pools.

### Operations

-   Structured logs, correlation/trace IDs, metrics and distributed
    tracing.
-   Liveness/readiness checks where appropriate.
-   Alerts for sustained failures and resource exhaustion.
-   Documented recovery, backup and rollback procedures.
-   Redaction of personal, financial and authentication data.

## 8. Accessibility and compatibility

-   Use semantic HTML and accessible labels.
-   Support keyboard operation and visible focus.
-   Evaluate against WCAG 2.2 AA as appropriate to the project and legal
    requirements.
-   Provide screen-reader announcements for important dynamic changes.
-   Check contrast, zoom and reflow.
-   Support RTL/localization when required.
-   Test supported browsers and screen sizes.
-   Combine automated audits with manual keyboard and
    assistive-technology testing.

## 9. CI/CD quality gates

1.  Restore dependencies and validate
    formatting/configuration/lockfiles.
2.  Build NestJS and Angular using production configuration.
3.  Run ESLint, TypeScript checks, Jest tests, and configured SonarQube
    rules.
4.  Run unit, component, integration and required regression tests.
5.  Scan dependencies, secrets, source code and container images.
6.  Deploy artifacts to a controlled test environment.
7.  Run smoke tests, health checks and critical workflow tests before
    production.

Rules: - Fail on compilation errors and failed required tests. - Block
exposed secrets and findings above the agreed severity threshold. -
Prevent new critical vulnerabilities from being introduced. - Configure
quality gates for bugs, vulnerabilities, maintainability and new-code
coverage. - Do not use coverage alone to approve changes. - Pin
toolchain versions and keep local and CI builds consistent. - Require
peer review for high-risk changes. - Document exceptions with owner,
rationale and review/expiry date.

## 10. Suggested repository structure

``` text
project/
├── apps/
│   ├── backend/src/
│   │   ├── auth/            (guards, decorators, entities, service)
│   │   ├── <feature>/       (controller, service, entity, dto, *.spec.ts)
│   │   ├── mail/
│   │   ├── media/
│   │   ├── app.module.ts
│   │   └── main.ts
│   └── frontend/src/app/
│       ├── core/            (api, auth, http, toast)
│       ├── shared/          (ui components, image-library)
│       ├── admin/           (feature areas)
│       ├── pages/
│       ├── app.config.ts
│       └── app.routes.ts
├── docs/
│   ├── api-contracts.md
│   ├── postman/
│   └── audit.md
├── other/                   (idempotent SQL scripts)
├── img/                     (source images for the generated library)
└── README.md
```

This is a reference, not a mandate. Small applications may need a
simpler structure; large modular applications may need separate projects
or bounded contexts.

## 11. AI coding-agent instructions

Use these rules for Windsurf, Devin, or another coding agent:

1.  **Analyze first:** inspect the repository, relevant files, callers,
    architecture, dependencies and similar implementations. Reproduce
    issues and identify root cause.
2.  **Plan:** list intended files, design decisions, risks, tests and
    acceptance criteria before a non-trivial implementation.
3.  **Test:** add/update a failing test where practical, implement the
    smallest correct change, then verify it passes.
4.  **Review:** check authorization, input validation, sensitive
    logging, SQL, resource handling, dependencies, accessibility,
    responsiveness and performance.
5.  **Verify and report:** run available builds/tests/linters/security
    checks. Report files changed, commands run, results and remaining
    risks. Never invent results.

### Copy-ready `AGENTS.md` starter

``` markdown
# Full-Stack Engineering Rules — NestJS + Angular

## Workflow
- Inspect architecture and conventions before changes.
- Plan non-trivial work with a file manifest, risks, tests and acceptance criteria.
- Use TDD where practical and keep changes focused.
- Preserve unrelated user modifications.
- Never claim verification unless it actually ran and passed.

## NestJS
- Keep controllers thin and business logic testable.
- Use DTOs, server-side validation and consistent API errors.
- Use async I/O and propagate cancellation where supported.
- Parameterize SQL; manage transactions and concurrency explicitly.
- Enforce least privilege and resource-level authorization.
- Never log secrets, OTPs, credentials or sensitive payment data.

## Angular
- Follow project versions and conventions.
- Keep components cohesive; use typed reactive forms where suitable.
- Choose signals and RxJS according to the use case.
- Avoid unsafe HTML, duplicate requests and unmanaged subscriptions.
- Implement loading, empty, success, validation and error states.

## UI and accessibility
- Follow design tokens and shared components.
- Test responsive layouts, keyboard navigation and visible focus.
- Respect reduced-motion preferences.
- Avoid unnecessary animations and layout shifts.

## Security
- Review OWASP web and API risks.
- Validate all untrusted inputs on the server.
- Verify authentication and object/function-level authorization.
- Prevent injection, XSS, CSRF, SSRF and unsafe file handling.
- Review CORS, CSP, cookies, headers and secrets.
- Scan dependencies and source code; document approved exceptions.

## Testing and operations
- Test business rules, boundaries, authorization and regression cases.
- Test external-service failures and duplicate requests where relevant.
- Measure before optimizing; use bounded queries/concurrency and timeouts.
- Add appropriate logs, metrics and health checks.

## Completion
- Build and relevant tests pass, or limitations are clearly reported.
- Run available static/security checks.
- Preserve or deliberately update API/database compatibility.
- Report changed files, verification results and residual risks.
```

## 12. Curated internet learning resources

These links focus on official documentation, established standards and
tool references. They are a curated starting library, not literally
every resource on the internet.

### NestJS, Node.js and TypeScript backend

-   [NestJS documentation](https://docs.nestjs.com/)
-   [TypeORM documentation](https://typeorm.io/)
-   [class-validator](https://github.com/typestack/class-validator)
-   [Express security best practices](https://expressjs.com/en/advanced/best-practice-security.html)
-   [Node.js documentation](https://nodejs.org/en/docs)
-   [TypeScript handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
-   [Jest documentation](https://jestjs.io/docs/getting-started)
-   [OWASP Node.js security cheat sheet](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)
-   [Microsoft REST API Guidelines](https://github.com/microsoft/api-guidelines)

#### Supplementary .NET / ASP.NET Core references

(Kept for cross-reference when reading older playbook material; the
backend of this repository is NestJS, not .NET.)

-   [.NET documentation](https://learn.microsoft.com/en-us/dotnet/)
-   [ASP.NET Core
    documentation](https://learn.microsoft.com/en-us/aspnet/core/)
-   [Entity Framework Core](https://learn.microsoft.com/en-us/ef/core/)

### Angular, TypeScript and frontend

-   [Angular official documentation](https://angular.dev/docs)
-   [Angular tutorials](https://angular.dev/tutorials)
-   [Angular security](https://angular.dev/best-practices/security)
-   [Angular accessibility](https://angular.dev/best-practices/a11y)
-   [Angular animations guide](https://angular.dev/guide/animations)
-   [Angular testing](https://angular.dev/guide/testing)
-   [Angular
    performance](https://angular.dev/best-practices/runtime-performance)
-   [TypeScript
    handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
-   [MDN Web Docs](https://developer.mozilla.org/)
-   [web.dev performance](https://web.dev/learn/performance/)
-   [web.dev accessibility](https://web.dev/learn/accessibility/)

### UI, CSS, motion and design

-   [MDN CSS](https://developer.mozilla.org/en-US/docs/Web/CSS)
-   [MDN CSS
    animations](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_animations)
-   [MDN
    prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
-   [Web Content Accessibility Guidelines
    (WCAG)](https://www.w3.org/WAI/standards-guidelines/wcag/)
-   [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
-   [Material Design](https://m3.material.io/)
-   [Material components for Angular](https://material.angular.dev/)

### Security and vulnerabilities

-   [OWASP Top 10](https://owasp.org/www-project-top-ten/)
-   [OWASP API Security Top
    10](https://owasp.org/www-project-api-security/)
-   [OWASP Application Security Verification Standard
    (ASVS)](https://asvs.owasp.org/)
-   [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
-   [OWASP Proactive
    Controls](https://owasp.org/www-project-proactive-controls/)
-   [OWASP
    Dependency-Check](https://owasp.org/www-project-dependency-check/)
-   [OWASP ZAP](https://www.zaproxy.org/)
-   [Microsoft
    SDL](https://www.microsoft.com/en-us/securityengineering/sdl)
-   [Microsoft security code analysis
    guidance](https://learn.microsoft.com/en-us/azure/security/develop/secure-dev-overview)
-   [GitHub code security](https://docs.github.com/en/code-security)
-   [NuGet package vulnerability
    auditing](https://learn.microsoft.com/en-us/nuget/concepts/auditing-packages)
-   [npm audit
    documentation](https://docs.npmjs.com/cli/commands/npm-audit)
-   [CWE weakness catalog](https://cwe.mitre.org/)
-   [NIST Secure Software Development
    Framework](https://csrc.nist.gov/Projects/ssdf)

### Testing and automation

-   [Playwright](https://playwright.dev/docs/intro)
-   [Cypress](https://docs.cypress.io/)
-   [Jest](https://jestjs.io/docs/getting-started)
-   [Vitest](https://vitest.dev/guide/)
-   [Testing Library](https://testing-library.com/docs/)
-   [Supertest](https://github.com/ladjs/supertest)
-   [k6 performance testing](https://grafana.com/docs/k6/latest/)
-   [Lighthouse](https://developer.chrome.com/docs/lighthouse/overview/)
-   [Pact contract testing](https://docs.pact.io/)

### Code quality, architecture and API design

-   [SonarQube documentation](https://docs.sonarsource.com/)
-   [ESLint](https://eslint.org/docs/latest/)
-   [Prettier](https://prettier.io/docs/)
-   [OpenAPI specification](https://spec.openapis.org/oas/latest.html)
-   [Swagger tools](https://swagger.io/tools/)
-   [Martin Fowler --- architecture and refactoring
    articles](https://martinfowler.com/)
-   [Refactoring.Guru design
    patterns](https://refactoring.guru/design-patterns)

### Database and performance

-   [SQL Server
    documentation](https://learn.microsoft.com/en-us/sql/sql-server/)
-   [SQL Server query
    performance](https://learn.microsoft.com/en-us/sql/relational-databases/performance/)
-   [TypeORM query builder](https://typeorm.io/select-query-builder)
-   [OpenTelemetry documentation](https://opentelemetry.io/docs/)
-   [Node.js diagnostics](https://nodejs.org/en/docs/guides/diagnostics/)

### DevOps, containers and delivery

-   [Git documentation](https://git-scm.com/doc)
-   [GitHub Actions](https://docs.github.com/en/actions)
-   [Azure
    Pipelines](https://learn.microsoft.com/en-us/azure/devops/pipelines/)
-   [Docker documentation](https://docs.docker.com/)
-   [Kubernetes documentation](https://kubernetes.io/docs/home/)
-   [Trivy vulnerability scanner](https://trivy.dev/)
-   [Renovate dependency updates](https://docs.renovatebot.com/)
-   [Dependabot](https://docs.github.com/en/code-security/dependabot)

### AI-assisted engineering

-   [GitHub Copilot documentation](https://docs.github.com/en/copilot)
-   [Windsurf documentation](https://docs.windsurf.com/)
-   [Devin](https://devin.ai/)
-   [OpenAI platform documentation](https://platform.openai.com/docs/)

## 13. Suggested implementation order

1.  Foundation: architecture, coding conventions, errors and API
    contracts.
2.  Correctness: unit/integration tests, validation and regression
    testing.
3.  Security: authorization, injection prevention, secrets, dependency
    scanning and sensitive-data logging.
4.  UI quality: responsive styling, accessibility, UI states and
    animation.
5.  Performance: database queries, Angular rendering, caching and load
    tests.
6.  Delivery: CI/CD, quality gates, monitoring and safe deployment.
7.  AI-assisted workflow: repository instructions, plan-first execution,
    TDD and evidence-based reporting.

**Core principle:** make rules verifiable wherever possible. Use
pipeline checks, tests and documented decisions rather than relying on
memory alone.

------------------------------------------------------------------------

*Resource links checked/curated on 22 October 2026. Framework-specific
pages and versions can change; confirm that guidance matches the
versions used by your project.*
