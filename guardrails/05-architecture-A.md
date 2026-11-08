# BLOCK A — ARCHITECTURE (A-01 → A-04) — .NET / Angular edition

---

## A-01 — Clean Architecture: domain isolation, SRP/DIP & Ubiquitous Language
**Severity:** 🔴 BLOCKER (business rule in an adapter / framework reference in the domain) — 🟡 WARNING
**Applies to:** backend
**Triggers:** any class mixing business rule and framework in {{MODULE_CIBLE}}; any framework `using`/project reference in the Domain project; any class doing > 3 distinct things (SRP violated); any cryptic identifier or one outside the glossary {{DOMAIN_GLOSSARY}}.

### Risk
Business rule in a controller: the test needs an integration context (slow, fragile), a framework change breaks the rule.
Cryptic name (`trx`, `amt`): a developer needs {{ONBOARDING_TIME}} to understand the model → misinterpretation → business bug.

### Rules
**Domain isolation (solution layout):**
```
src/
  {{MODULE_CIBLE}}.Domain          → no package/project references (pure C#)
  {{MODULE_CIBLE}}.Application     → references Domain only (use cases, ports = interfaces)
  {{MODULE_CIBLE}}.Infrastructure  → references Application (+Domain); EF Core, Kafka, HTTP clients
  {{MODULE_CIBLE}}.Api             → references Application (+Infrastructure only for DI composition root)
```
- Business rule ({{DOMAIN_RULES_EXAMPLES}}) → `Domain` project with **no** reference to `{{FRAMEWORK_PACKAGES}}` (ASP.NET Core, EF Core, `Microsoft.Extensions.*` except abstractions you explicitly allow, serializers).
- Adapters (Controller, Minimal API handler, Consumer, Repository) call the rule — never the reverse.
- Compile-time isolation (project references) **plus** architecture tests (rule T-01).
- Rule test → 0 `{{INTEGRATION_TEST_ANNOTATION}}` (e.g. `WebApplicationFactory`, Testcontainers): pure xUnit.

**SRP / DIP:**
- One class = one responsibility (≤ 3 responsibilities, ≤ 300 lines).
- Depend on abstractions: `{{GATEWAY_INTERFACE}}` (interface), never `{{GATEWAY_IMPL}}` (concrete); composition only in `Program.cs` / DI extension methods.
- Test needing > 3 mocks → SRP violated.
- No service locator (`IServiceProvider.GetService` in business code); no static state.
- Mediator/mapper libraries: check current licence per rule S-01 (some popular ones moved to commercial licences) — plain handlers + manual mapping are acceptable.

**Ubiquitous Language:**
- Mandatory glossary: `{{DOMAIN_TERMS}}`.
- Forbidden: `Manager`, `Helper`, `Util` without a precise suffix; abbreviated identifiers.
- Casing (Microsoft conventions): `PascalCase` for types, methods, properties **and constants**; `camelCase` for locals/parameters; `_camelCase` for private fields; `I` prefix for interfaces; `Async` suffix on async methods. (Unlike Java, constants are **not** `UPPER_SNAKE_CASE`.) Enforce via `.editorconfig` naming rules.

### Anti-pattern
```csharp
// ❌ BLOCKER — business rule in the adapter
app.MapPost("/{{ENDPOINT}}", (CreateCommand cmd, IService service) =>
{
    if (cmd.Amount > {{LIMIT}}m)                       // rule in the adapter!
        throw new BusinessException("Refused");
    return service.ProcessAsync(cmd);
});

// ❌ WARNING — cryptic name + SRP violated
public class {{CRYPTIC_NAME}}Svc { public void Calc{{CRYPTIC_FIELD}}(object usr, object trx) { ... } }
```
```xml
<!-- ❌ BLOCKER — Domain.csproj referencing the framework -->
<ItemGroup>
  <PackageReference Include="Microsoft.EntityFrameworkCore" Version="..." />
  <FrameworkReference Include="Microsoft.AspNetCore.App" />
</ItemGroup>
```

### Compliant pattern
```csharp
// ✅ Rule in the domain — Domain project, zero framework reference
public sealed record {{RULE_CLASS}}(decimal Limit)
{
    public void Validate(decimal amount)
    {
        if (amount > Limit) throw new {{RULE_EXCEPTION}}(amount, Limit);
    }
}

// ✅ Application — port (abstraction)
public interface {{GATEWAY_INTERFACE}} { Task<{{RESPONSE}}> ProcessAsync({{COMMAND}} cmd, CancellationToken ct); }

// ✅ Api — thin adapter: validate shape, call the rule, delegate
[ApiController, Route("{{ENDPOINT}}")]
public sealed class {{CONTROLLER}}({{RULE_CLASS}} rule, {{GATEWAY_INTERFACE}} gateway) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<{{RESPONSE}}>> Handle({{COMMAND}} cmd, CancellationToken ct)
    {
        rule.Validate(cmd.Amount);                    // rule from the domain
        return await gateway.ProcessAsync(cmd, ct);   // abstraction
    }
}
```
```ini
# ✅ .editorconfig — naming rules (excerpt)
dotnet_naming_rule.private_fields_underscore.symbols  = private_fields
dotnet_naming_rule.private_fields_underscore.style    = underscore_camel
dotnet_naming_rule.private_fields_underscore.severity = warning
dotnet_naming_rule.interfaces_start_with_i.symbols    = interfaces
dotnet_naming_rule.interfaces_start_with_i.style      = begins_with_i
dotnet_naming_rule.interfaces_start_with_i.severity   = warning
dotnet_naming_rule.async_suffix.symbols               = async_methods
dotnet_naming_rule.async_suffix.style                 = ends_with_async
```

### CI/CD checklist
- [ ] Architecture test (T-01): `Domain` namespace → no dependency on `{{FRAMEWORK_PACKAGES}}`
- [ ] Rule test `{{RULE_CLASS}}Tests` → 0 `{{INTEGRATION_TEST_ANNOTATION}}`, runtime < 100 ms
- [ ] `grep -E "PackageReference|FrameworkReference" src/*.Domain/*.csproj` → none
- [ ] `grep -rEn "class \w*(Manager|Helper|Util)\b" src/ | grep -v "//"` → manual review
- [ ] `dotnet build -warnaserror` with `.editorconfig` naming rules enabled

---

## A-02 — API backward compatibility: zero breaking change without versioning
**Severity:** 🔴 BLOCKER (breaking change on a production API)
**Applies to:** backend, frontend, Flutter consumers (contract only)
**Triggers:** any API contract change in {{MODULE_CIBLE}}: removal/rename/type change; any new endpoint or new version of an existing endpoint; any deprecation of a field or endpoint used in production.

### Risk
A field removed or renamed in a production API → deserialisation error at deployment → customer incident (Flutter apps in the field can stay on old versions for months — you cannot force an update).
A type change (`string` → `int`) on a field → silent data loss on the consumer side.

### Rules
**Breaking changes forbidden without versioning:**
- Remove a field → BLOCKER: deprecate first, remove after {{DEPRECATION_PERIOD}}.
- Rename a field → BLOCKER: add the new name, keep the old one (deprecated).
- Change a field type → BLOCKER: new field + client migration.
- Make an optional field `required` → BLOCKER.

**Non-breaking (allowed):** add an optional field; add an endpoint; add an enum value **if consumers tolerate unknown values**.

**Versioning:**
- Unavoidable breaking change → path versioning (`/v1/{{ENDPOINT}}` → `/v2/{{ENDPOINT}}`) with **Asp.Versioning**.
- `Sunset` header (RFC 8594) + `Deprecation` on deprecated v1 endpoints: `Sunset: {{SUNSET_DATE}}`.
- Maintain at most {{MAX_PARALLEL_VERSIONS}} simultaneous versions.
- **Tolerant reader** on consumers: Angular ignores unknown fields and handles unknown enum values (fallback), amounts as strings (B-01).
- `System.Text.Json` + enums: an unknown enum string throws by default → expose enums as strings with a fallback member, or document the tolerance rule.

### Anti-pattern
```csharp
// ❌ BLOCKER — field renamed in place
public sealed record {{RESPONSE_TYPE}}(Guid Id, decimal TotalAmount /* was "amount" — breaks every client */, string Status);
```

### Compliant pattern
```csharp
// ✅ Deprecated field kept + new field added (both populated)
public sealed record {{RESPONSE_TYPE}}(
    Guid Id,
    [property: Obsolete("Use {{NEW_FIELD}}; removal {{SUNSET_DATE}}")] {{FIELD_TYPE}} {{OLD_FIELD}},
    {{FIELD_TYPE}} {{NEW_FIELD}},
    string Status);

// ✅ Versioning with Asp.Versioning + sunset policy
builder.Services.AddApiVersioning(o =>
{
    o.DefaultApiVersion = new ApiVersion(2, 0);
    o.AssumeDefaultVersionWhenUnspecified = false;
    o.ReportApiVersions = true;                                  // api-supported-versions / api-deprecated-versions headers
    o.ApiVersionReader = new UrlSegmentApiVersionReader();
    o.Policies.Sunset(1.0).Effective(DateTimeOffset.Parse("{{SUNSET_DATE}}")).Link("{{MIGRATION_GUIDE_URL}}");  // emits Sunset + Link
}).AddMvc();

[ApiController, ApiVersion("1.0", Deprecated = true), Route("v{version:apiVersion}/{{ENDPOINT}}")]
public sealed class {{CONTROLLER_V1}} : ControllerBase { /* legacy contract, frozen */ }

[ApiController, ApiVersion("2.0"), Route("v{version:apiVersion}/{{ENDPOINT}}")]
public sealed class {{CONTROLLER_V2}} : ControllerBase { /* new implementation */ }
```
```typescript
// ✅ Angular — tolerant reader for enums
const KNOWN = new Set(['PENDING', 'COMPLETED', 'FAILED']);
export const toStatus = (s: string): PaymentStatus => (KNOWN.has(s) ? (s as PaymentStatus) : 'UNKNOWN');
```

### CI/CD checklist
- [ ] OpenAPI diff in CI: `oasdiff breaking previous.yaml current.yaml --fail-on ERR` → 0 breaking change
- [ ] Consumer-driven contract tests (Pact.Net or equivalent) pass before merge
- [ ] `grep -rn "\[Obsolete" src/` → each has a removal date in the message
- [ ] New endpoint → OpenAPI spec updated + reviewed by a consumer (Angular / Flutter team)
- [ ] `Sunset` header present on every deprecated v1 endpoint (`curl -I`)
- [ ] No field removed without a {{DEPRECATION_PERIOD}} deprecation period

---

## A-03 — Exception handling: structured format, zero stack in the response
**Severity:** 🔴 BLOCKER (stack trace in response / swallowed exception)
**Applies to:** backend
**Triggers:** any endpoint that can return an error in {{MODULE_CIBLE}}; any business or technical exception not mapped to a coherent HTTP code; any error response without standardised format.

### Risk
Stack trace in the HTTP response → leak of class names, namespaces, versions → attack surface.
Without a standard format → the front end cannot tell a 4xx (final) from a 5xx (retryable) → the user clicks again → double action.

### Rules
- One **global** exception handler intercepting all exceptions: `IExceptionHandler` (.NET 8+) + `AddProblemDetails()` + `UseExceptionHandler()`.
- Mandatory format: `{{ERROR_FORMAT}}` = RFC 9457 `ProblemDetails` with:
  - `type` / `errorCode`: error type identifier; `title`: short human message; `status`: HTTP code; `detail`: explanation **without internal information**; `traceId`/`correlationId` for support.
- 4xx → final client error, not retryable. Never a stack in the response.
- 5xx → technical, potentially retryable. Stack goes to **logs**, not to the response. Add `Retry-After` on 503/429.
- Never expose `ex.Message` raw — use a dedicated `PublicMessage`.
- Developer exception page only in `Development` (never configured for production).
- Empty `catch {}` / `catch (Exception) { }` → absolute BLOCKER. Catch the narrowest type, log with context, rethrow or translate (`throw;`, never `throw ex;`).
- Validation errors → `ValidationProblemDetails` (400), field names only, no internal types.

### Anti-pattern
```csharp
// ❌ BLOCKER — stack trace exposed (developer page / unconfigured)
if (!app.Environment.IsProduction()) app.UseDeveloperExceptionPage();   // staging often = prod-like data!
app.MapGet("/{{ENDPOINT}}/{id}", (Guid id, IService s) => s.FindAsync(id));   // exception → default 500

// ❌ BLOCKER — swallowed exception
try { await _{{EXTERNAL_SERVICE}}.ProcessAsync(id, ct); }
catch (Exception) { /* nothing — silent inconsistent state */ }

// ❌ BLOCKER — raw message leak
return Results.Problem(detail: ex.ToString());
```

### Compliant pattern
```csharp
// ✅ Program.cs
builder.Services.AddProblemDetails(o => o.CustomizeProblemDetails = ctx =>
{
    ctx.ProblemDetails.Extensions["traceId"] = Activity.Current?.TraceId.ToString() ?? ctx.HttpContext.TraceIdentifier;
});
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
app.UseExceptionHandler();
app.UseStatusCodePages();

// ✅ Global handler — {{ERROR_FORMAT}}
public sealed class GlobalExceptionHandler(IProblemDetailsService problems, ILogger<GlobalExceptionHandler> log) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext ctx, Exception ex, CancellationToken ct)
    {
        if (ex is OperationCanceledException && ctx.RequestAborted.IsCancellationRequested) return true;   // client left, not an error

        var (status, title, detail, code) = ex switch
        {
            {{ENTITY}}NotFoundException nf     => (404, "{{ENTITY}} Not Found", $"No {{ENTITY}} found with id: {nf.Id}", "{{ENTITY_UPPER}}_NOT_FOUND"),
            {{BUSINESS_RULE_EXCEPTION}} br     => (422, "Business Rule Violated", br.PublicMessage, br.ErrorCode),          // never ex.Message
            ConflictException                  => (409, "Conflict", "The resource was modified concurrently. Please reload.", "CONFLICT"),
            {{TECHNICAL_EXCEPTION}}            => (503, "Service Temporarily Unavailable", "Please retry in a few seconds.", "SERVICE_UNAVAILABLE"),
            _                                  => (500, "Internal Server Error", "An unexpected error occurred.", "INTERNAL_ERROR"),
        };

        if (status >= 500) log.LogError(ex, "Technical error on {Path}", ctx.Request.Path);   // stack → LOG only
        else               log.LogInformation("Client error {Code} on {Path}", code, ctx.Request.Path);

        ctx.Response.StatusCode = status;
        if (status == 503) ctx.Response.Headers.RetryAfter = "5";
        return await problems.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = ctx, Exception = null,                       // never attach the exception → no stack serialised
            ProblemDetails = { Status = status, Title = title, Detail = detail, Type = $"{{ERROR_TYPE_BASE_URL}}/{code.ToLowerInvariant()}",
                               Extensions = { ["errorCode"] = code } }
        });
    }
}
```

### CI/CD checklist
- [ ] `curl /{{ENDPOINT}}/nonexistent` → structured JSON (type, title, status, errorCode) — 0 stack
- [ ] `grep -rEn "catch\s*(\(\s*Exception[^)]*\))?\s*\{\s*\}" src/` → 0 empty catch (also Sonar S108/S2486)
- [ ] `grep -rn "UseDeveloperExceptionPage" src/` → only inside an `IsDevelopment()` branch
- [ ] `grep -rn "throw ex;" src/` → 0 (use `throw;`)
- [ ] Test: 500 → log contains the stack; HTTP response does not contain `stackTrace`/`at ` frames
- [ ] Test: 4xx → `retryable=false`; 5xx → `retryable=true` (front-end side, F-03)

---

## A-04 — Distributed tracing: correlationId & inter-service propagation
**Severity:** 🔴 BLOCKER (log on a critical flow without correlationId) — 🟡 WARNING
**Applies to:** backend (+ Angular interceptor)
**Triggers:** any endpoint starting a multi-service flow in {{MODULE_CIBLE}}; any inter-service call (HTTP, messaging) without correlationId propagation; any log on a critical flow without a correlation identifier.

### Risk
Without correlationId: a P1 incident in prod → finding the flow in logs → impossible to link the logs of {{SERVICE_COUNT}} different services.
Context not propagated to message handlers → the correlationId vanishes between services → traceability lost.

### Rules
- Every inbound request → `correlationId` in the **logging scope** at the start of processing.
- Priority: inbound `{{CORRELATION_HEADER}}` header → else W3C `traceparent` trace id (OpenTelemetry `Activity`) → else generated GUID.
- Propagated: outbound HTTP calls (`{{CORRELATION_HEADER}}` header; `traceparent` is automatic with OpenTelemetry) + messages (header `{{CORRELATION_HEADER}}`).
- Scope disposed at end of request (`using`) — no leakage between requests; no `static`/`ThreadStatic` storage (use `AsyncLocal`/scopes).
- Log format: `correlationId` present on every line of the critical flow (structured JSON preferred).
- Angular: an interceptor generates one id per user action and sends the header; the id is shown in the error UI for support (not the stack).

### Anti-pattern
```csharp
// ❌ BLOCKER — critical log without correlationId
_logger.LogInformation("Operation completed for entity {EntityId}", entityId);

// ❌ WARNING — scope pushed and never disposed (Serilog LogContext leak across requests)
LogContext.PushProperty("correlationId", id);   // return value (IDisposable) ignored
```

### Compliant pattern
```csharp
// ✅ Middleware — intercepts all requests
public sealed class CorrelationIdMiddleware(RequestDelegate next, ILogger<CorrelationIdMiddleware> log, ICorrelationContext context)
{
    private const string Header = "{{CORRELATION_HEADER}}";

    public async Task InvokeAsync(HttpContext ctx)
    {
        var id = ctx.Request.Headers[Header].FirstOrDefault();
        if (string.IsNullOrWhiteSpace(id) || id.Length > 64)                               // reject oversized/hostile values
            id = Activity.Current?.TraceId.ToString() ?? Guid.NewGuid().ToString("N");

        context.Set(id);                                                                    // AsyncLocal-backed
        ctx.Response.Headers[Header] = id;

        using (log.BeginScope(new Dictionary<string, object> { ["correlationId"] = id }))   // disposed even on exception
        using (LogContext.PushProperty("correlationId", id))                                // Serilog
        {
            await next(ctx);
        }
    }
}

// ✅ Outgoing HTTP — propagation in a DelegatingHandler (applies to every typed client)
public sealed class CorrelationIdHandler(ICorrelationContext context) : DelegatingHandler
{
    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage req, CancellationToken ct)
    {
        if (context.Current is { } id) req.Headers.TryAddWithoutValidation("{{CORRELATION_HEADER}}", id);
        return base.SendAsync(req, ct);
    }
}
services.AddHttpClient<I{{EXTERNAL_CLIENT}}, {{EXTERNAL_CLIENT}}>().AddHttpMessageHandler<CorrelationIdHandler>();

// ✅ Producing a message — header
var message = new Message<string, string> { Key = k, Value = v,
    Headers = new Headers { { "{{CORRELATION_HEADER}}", Encoding.UTF8.GetBytes(context.Current ?? Guid.NewGuid().ToString("N")) } } };

// ✅ Consuming a message — restore the scope
var corrId = cr.Message.Headers.TryGetLastBytes("{{CORRELATION_HEADER}}", out var b) ? Encoding.UTF8.GetString(b) : Guid.NewGuid().ToString("N");
context.Set(corrId);
using (log.BeginScope(new Dictionary<string, object> { ["correlationId"] = corrId }))
{
    await handler.HandleAsync(cr, ct);
}
consumer.Commit(cr);
```
```csharp
// ✅ OpenTelemetry — traces + W3C context propagation (traceparent) for HTTP and messaging
builder.Services.AddOpenTelemetry().WithTracing(t => t.AddAspNetCoreInstrumentation().AddHttpClientInstrumentation().AddEntityFrameworkCoreInstrumentation().AddOtlpExporter());
```
```typescript
// ✅ Angular — one correlation id per outgoing request/user action
export const correlationInterceptor: HttpInterceptorFn = (req, next) =>
  next(req.clone({ setHeaders: { '{{CORRELATION_HEADER}}': crypto.randomUUID() } }));
```
```
# ✅ Log template (Serilog) — correlationId on every line
{{LOG_PATTERN}} = "{Timestamp:o} [{correlationId}] {Level:u3} {SourceContext} - {Message:lj}{NewLine}{Exception}"
```

### CI/CD checklist
- [ ] Call to `{{EXAMPLE_ENDPOINT}}` → response with `{{CORRELATION_HEADER}}` header present
- [ ] Flow logs → every line contains the id (`[<guid>]`) in scope/JSON field
- [ ] Test: call without `{{CORRELATION_HEADER}}` → id generated and propagated to every service in the flow
- [ ] `grep -rn "PushProperty" src/ | grep -v "using"` → 0 (every push is disposed)
- [ ] Test: message consumed → logs carry the producer's correlationId
