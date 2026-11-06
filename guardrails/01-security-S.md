# BLOCK S — SECURITY (S-01 → S-08) — .NET / Angular edition

---

## S-01 — SBOM, licences & CVE scan
**Severity:** 🔴 BLOCKER (strong copyleft / CVE ≥ 9.0) — 🟡 WARNING (unknown licence / CVE 7–8.9)
**Applies to:** backend, frontend
**Triggers:** dependency added/updated in `*.csproj`, `Directory.Packages.props`, `package.json`; Trivy/Grype/Dependabot/`dotnet list package --vulnerable` report on a dependency of {{MODULE_CIBLE}}.

### Risk
An AGPL/GPL dependency can force the whole proprietary code of {{MODULE_CIBLE}} to be opened under the same licence.
A dependency with CVSS ≥ 9.0 is exploitable as soon as it is merged — no application control protects against an RCE inside a library.

### Rules
- **Blocked licences:** AGPL, GPL, LGPL without written exception, closed proprietary, SSPL.
- **Allowed licences:** MIT, Apache 2.0, BSD, ISC, MPL 2.0 (module isolation).
- **CVE CVSS ≥ 9.0** → BLOCKER: patch or replace before merge.
- **CVE CVSS 7.0–8.9** → WARNING: patch in the current sprint, tech-lead justification required.
- **CVE < 7.0** → trace, backlog follow-up.
- NuGet: **Central Package Management** (`Directory.Packages.props`) + lock files (`packages.lock.json`, `RestoreLockedMode` in CI). Never floating versions (`*`, `1.*`) on critical dependencies.
- npm: `npm ci` only (never `npm install`) in CI; lock file committed.
- Supply chain: only versions published ≥ 7 days ago (Renovate `minimumReleaseAge: "7 days"`).

### Anti-pattern
```xml
<!-- ❌ BLOCKER — floating version + known CVE -->
<PackageReference Include="Newtonsoft.Json" Version="*" />
<PackageReference Include="System.Text.Encodings.Web" Version="4.5.0" /> <!-- CVE-2021-26701, CVSS 9.8 -->
```

### Compliant pattern
```xml
<!-- ✅ Directory.Build.props — make vulnerabilities fail the build -->
<Project>
  <PropertyGroup>
    <NuGetAudit>true</NuGetAudit>
    <NuGetAuditMode>all</NuGetAuditMode>          <!-- direct + transitive -->
    <NuGetAuditLevel>high</NuGetAuditLevel>
    <WarningsAsErrors>$(WarningsAsErrors);NU1903;NU1904</WarningsAsErrors> <!-- high, critical -->
    <RestorePackagesWithLockFile>true</RestorePackagesWithLockFile>
    <ManagePackageVersionsCentrally>true</ManagePackageVersionsCentrally>
  </PropertyGroup>
</Project>
```
```bash
# ✅ Mandatory CI checks on {{MODULE_CIBLE}}
dotnet restore --locked-mode
dotnet list package --vulnerable --include-transitive
trivy fs --severity HIGH,CRITICAL --exit-code 1 .
nuget-license -i {{SOLUTION}}.sln -a allowed-licenses.json      # dotnet tool install -g nuget-license
# Angular
npm ci && npm audit --audit-level=high
npx license-checker --production --failOn "GPL;AGPL;LGPL;SSPL"
```

### CI/CD checklist
- [ ] `trivy fs --severity CRITICAL --exit-code 1` → 0 result on {{MODULE_CIBLE}}
- [ ] `dotnet list package --vulnerable --include-transitive` → no High/Critical
- [ ] Every new dependency audited: licence in the allowed list
- [ ] CVE CVSS ≥ 9.0 → PR blocked until patched
- [ ] Dependencies published ≥ 7 days ago

---

## S-02 — Zero sensitive data: PII, secrets, logs, application encryption
**Severity:** 🔴 BLOCKER absolute — never bypassable
**Applies to:** backend, frontend
**Triggers:** any code handling {{SENSITIVE_DATA_TYPE}} (PAN, IBAN, SSN, password, private key); any `ILogger` call on a sensitive flow in {{MODULE_CIBLE}}; any DB field, DTO or export holding confidential data; JSON serialisation of a sensitive object in a log.

### Risk
{{SENSITIVE_DATA_TYPE}} in logs = audit scope widened to the whole logging platform → cost and compliance risk.
A readable `SELECT {{SENSITIVE_FIELD}} FROM {{TABLE}}` = direct violation of data-protection rules (GDPR, PCI-DSS…).
**C#-specific trap:** a `record` auto-generates a `ToString()` printing **every property** — logging a record containing a PAN leaks it.

### Rules
**Sensitive data ({{SENSITIVE_DATA_TYPE}}):**
- Never in clear: code, DB, logs, config, API, message queues, tests (no real data in fixtures).
- Allowed display: masked or truncated only. Allowed storage: external token/reference or encrypted column.

**Logs:**
- Any log on a sensitive flow goes through a `SanitizedLogContext` (whitelist of fields).
- Allowed fields: `correlationId`, opaque reference ids, status codes, masked amounts.
- Never: logging a sensitive object, `.ToString()` of a sensitive object, `{@Object}` destructuring of a sensitive type.
- Sensitive types: override `PrintMembers` (records) and mark properties `[NotLogged]` (Destructurama.Attributed) or `[LogMasked]`.
- `Debug`/`Trace` levels disabled on sensitive flows in production.
- Angular: no `console.log` of API payloads in production builds; no sensitive data in `localStorage`/URLs.

### Anti-pattern
```csharp
// ❌ BLOCKER — sensitive data in a log
_logger.LogInformation("Payment request: {@Request}", paymentRequest);   // contains PAN
_logger.LogError("Payment error: {Message}", paymentMessage.ToString()); // record ToString leaks everything

// ❌ BLOCKER — readable in DB
public string CardNumber { get; set; } = default!; // clear text column
```

### Compliant pattern
```csharp
// ✅ Whitelisted log context
public sealed record SanitizedLogContext(
    string CorrelationId, string OpaqueReference, int StatusCode, string PublicErrorCode);

_logger.LogWarning("Operation failed {@Context}",
    new SanitizedLogContext(correlationId, payment.OpaqueId, (int)response.StatusCode, response.PublicErrorCode));

// ✅ Sensitive type: hidden from ToString and from Serilog destructuring
public sealed record CardData(string HolderName, [property: NotLogged] string Pan)
{
    private bool PrintMembers(StringBuilder sb) { sb.Append("CardData { *** }"); return true; }
}

// ✅ Serilog: global safety net
Log.Logger = new LoggerConfiguration()
    .Destructure.UsingAttributes()
    .Destructure.ByTransforming<CardData>(_ => "***")
    .MinimumLevel.Override("Microsoft.EntityFrameworkCore.Database.Command", LogEventLevel.Warning) // no SQL parameter values
    .CreateLogger();

// ✅ DB — transparent encryption via converter (see S-08)
builder.Property(p => p.CardNumber).HasConversion(_encryptedStringConverter).HasColumnName("card_number_encrypted");
```
EF Core: **never** enable `EnableSensitiveDataLogging()` outside local development.

### CI/CD checklist
- [ ] `grep -rEn "Log(Information|Debug|Warning|Error|Critical)\(.*{{SENSITIVE_KEYWORD}}" src/` → 0
- [ ] `grep -rn "EnableSensitiveDataLogging" src/` → only inside `#if DEBUG` / Development
- [ ] `SELECT {{SENSITIVE_FIELD}} FROM {{TABLE}} LIMIT 1` → opaque/encrypted (integration test)
- [ ] `LogSanitizationTest`: capture sink (Serilog `InMemorySink`), assert `DoesNotContain(sensitiveValue)` on every event
- [ ] No real data in test fixtures
- [ ] `Debug`/`Trace` disabled in the production logging profile
- [ ] Angular: `grep -rn "console\.\(log\|debug\)" src/` → 0 in production build (ESLint `no-console`)

---

## S-03 — Callback security: HMAC + anti-replay
**Severity:** 🔴 BLOCKER — effectful callback without signature or anti-replay
**Applies to:** backend
**Triggers:** new webhook/callback/notification endpoint in {{MODULE_CIBLE}}; any effectful action endpoint (create, debit, state change); any external callback from a third-party system.

### Risk
Without verified HMAC: anyone reaching the endpoint can forge callbacks → unauthorised effect.
Without anti-replay: a captured valid request replayed N times = N unwanted effects. Authentication says *who is talking*, not *when* nor *only once*.

### Rules
**HMAC (callback authentication):**
- Every effectful callback passes through `{{SIGNATURE_FILTER}}` before the handler.
- Algorithm: `HMAC-SHA256(key, timestamp + "." + body)` over the **raw** body bytes (before JSON parsing).
- **Constant-time** comparison: `CryptographicOperations.FixedTimeEquals` — never `==`/`string.Equals`.
- HMAC key in {{SECRET_STORE}} — never hard-coded (rule S-04).

**Anti-replay:**
- Required headers: `X-Timestamp` (UTC ISO-8601), `X-Nonce` (GUID), `{{IDEMPOTENCY_HEADER}}`.
- `X-Timestamp` checked at ± 5 min against the **server** clock.
- `X-Nonce` stored with an **atomic** "set if not exists" and TTL 10 min — already present → `409 Replay detected`.
- Nonce stored in a distributed cache ({{CACHE_STORE}}, e.g. Redis `SET NX`) — never in process memory alone; **not** `IDistributedCache.Get` then `Set` (race).
- Order: verify signature **first**, store the nonce **after** (otherwise unauthenticated callers can burn legitimate nonces).

### Anti-pattern
```csharp
// ❌ BLOCKER — callback without signature
app.MapPost("/{{CALLBACK_ENDPOINT}}", (Event evt, IService svc) => svc.ProcessAsync(evt)); // anyone can POST

// ❌ BLOCKER — timing-sensitive comparison
if (received == computed) { ... }
```

### Compliant pattern
```csharp
// ✅ Middleware executed BEFORE the handler
public sealed class SignatureMiddleware(RequestDelegate next, ISecretProvider secrets, INonceStore nonces, TimeProvider clock)
{
    private static readonly TimeSpan Window = TimeSpan.FromMinutes(5);

    public async Task InvokeAsync(HttpContext ctx)
    {
        ctx.Request.EnableBuffering();
        using var ms = new MemoryStream();
        await ctx.Request.Body.CopyToAsync(ms, ctx.RequestAborted);
        ctx.Request.Body.Position = 0;
        var body = ms.ToArray();

        var timestamp = ctx.Request.Headers["X-Timestamp"].ToString();
        var nonce     = ctx.Request.Headers["X-Nonce"].ToString();
        var received  = ctx.Request.Headers["X-Signature"].ToString();

        // 1. Time window ± 5 min (server clock)
        if (!DateTimeOffset.TryParse(timestamp, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out var ts)
            || (clock.GetUtcNow() - ts).Duration() > Window)
        { ctx.Response.StatusCode = 401; return; }

        // 2. HMAC in constant time
        var key      = await secrets.GetHmacKeyAsync(ctx.RequestAborted);
        var payload  = Encoding.UTF8.GetBytes(timestamp + ".").Concat(body).ToArray();
        var expected = HMACSHA256.HashData(key, payload);
        byte[] receivedBytes;
        try { receivedBytes = Convert.FromHexString(received); } catch (FormatException) { ctx.Response.StatusCode = 401; return; }
        if (!CryptographicOperations.FixedTimeEquals(receivedBytes, expected))
        { ctx.Response.StatusCode = 401; return; }

        // 3. Unique nonce (TTL 10 min) — atomic
        if (!await nonces.TryStoreAsync(nonce, TimeSpan.FromMinutes(10), ctx.RequestAborted))
        { ctx.Response.StatusCode = 409; await ctx.Response.WriteAsync("Replay detected"); return; }

        await next(ctx);
    }
}

// ✅ Atomic nonce store (StackExchange.Redis)
public async Task<bool> TryStoreAsync(string nonce, TimeSpan ttl, CancellationToken ct)
    => await _db.StringSetAsync($"nonce:{nonce}", "1", ttl, When.NotExists);   // true = first time seen

// Registration: apply only on callback routes
app.UseWhen(c => c.Request.Path.StartsWithSegments("/{{CALLBACK_ENDPOINT}}"), b => b.UseMiddleware<SignatureMiddleware>());
```

### CI/CD checklist
- [ ] Every `POST /{{CALLBACK_ENDPOINT}}` goes through `{{SIGNATURE_FILTER}}`
- [ ] HMAC key in {{SECRET_STORE}} — `grep -rEn "hmacSecret\s*=\s*\"" src/` → 0 literals
- [ ] `grep -rn "Signature.*==\|Signature.*\.Equals(" src/` → 0 (only `FixedTimeEquals`)
- [ ] Tests: valid→200; forged→401; expired timestamp→401; replayed nonce→409; double delivery→1 single effect

---

## S-04 — Zero hard-coded secrets: code, config, Dockerfile, CI, Angular
**Severity:** 🔴 BLOCKER
**Applies to:** backend, frontend
**Triggers:** literal password/secret/private-key/connection-string/API-key in C#, `appsettings*.json`, YAML, Dockerfile, CI, `environment.ts`; connection to {{DATA_STORE}} (DB, cache, queue) with clear credentials; API key, OAuth token or encryption key hard-coded in {{MODULE_CIBLE}}.

### Risk
A secret committed to git is exposed forever (git history is not erasable).
A clear connection string exposed by a diagnostics endpoint = access to {{DATA_STORE}} in production.
**Angular:** everything in `environment.ts` / the bundle is public — a "secret" there is not a secret.

### Rules
- Every secret → environment variable or secret manager: `{{SECRET_STORE}}` (Azure Key Vault, Vault, K8s Secret).
- No literal value for: `Password`, `Secret`, `Key`, `Token`, `ConnectionString`, `ApiKey`, `PrivateKey`.
- Local development → `dotnet user-secrets`; never a committed `appsettings.Development.json` with credentials.
- `.env` files outside git (`.gitignore`), provided via {{SECRET_STORE}}.
- Certificates / keystores → mounted volumes, never baked into the image.
- CI/CD: pipeline variables injected, never printed in build logs; no `ARG`/`ENV` holding a secret in the Dockerfile.
- Angular: public client IDs only; anything secret stays server-side (BFF pattern); tokens in memory or HttpOnly cookies, not in source.

### Anti-pattern
```json
// ❌ BLOCKER — appsettings.json committed
{ "ConnectionStrings": { "Default": "Server=db;Database={{DB_NAME}};User Id=sa;Password=SuperSecret123;" } }
```
```csharp
// ❌ BLOCKER
private const string ApiKey = "sk-prod-abcd1234";
```
```typescript
// ❌ BLOCKER — environment.ts is shipped to every browser
export const environment = { paymentProviderSecret: 'sk_live_xxx' };
```

### Compliant pattern
```csharp
// ✅ Program.cs — secrets from Key Vault; env vars override (ConnectionStrings__Default)
builder.Configuration.AddAzureKeyVault(new Uri(builder.Configuration["KeyVault:Uri"]!), new DefaultAzureCredential());
var cs = builder.Configuration.GetConnectionString("Default")
         ?? throw new InvalidOperationException("ConnectionStrings:Default is not configured");
```
```yaml
# ✅ Kubernetes — injected, not committed
env:
  - name: ConnectionStrings__Default
    valueFrom: { secretKeyRef: { name: {{MODULE_CIBLE}}-secrets, key: {{DB_PASSWORD_ENV_VAR}} } }
```

### CI/CD checklist
- [ ] `gitleaks detect` or `trufflehog` in the pipeline → 0 secret
- [ ] `grep -rEi "(password|pwd|secret|apikey)\s*[=:]\s*\"[^\"$]" --include=*.cs --include=*.json src/` → 0 literal
- [ ] Secret `{{MODULE_CIBLE}}-secrets` exists in {{SECRET_STORE}} for every environment
- [ ] No `ARG`/`ENV` containing a secret in the Dockerfile
- [ ] Angular: `grep -rEi "secret|private" src/environments/` → 0

---

## S-05 — SQL injection: zero concatenation in queries
**Severity:** 🔴 BLOCKER
**Applies to:** backend
**Triggers:** any SQL/LINQ/raw query built by concatenation in {{MODULE_CIBLE}}; `FromSqlRaw`/`ExecuteSqlRaw` with interpolation; `LIKE '%' + input + '%'`; dynamic `ORDER BY`/`GROUP BY` from a user parameter; Dapper queries with `$""`.

### Risk
Concatenation in SQL = possible injection → extraction of table `{{TABLE}}`, data deletion, privilege escalation. On a sensitive DB ({{DATA_CLASSIFICATION}}) this is an immediate compliance breach.
**EF Core trap:** `FromSqlRaw($"...{x}")` is injectable; `FromSql($"...{x}")` / `FromSqlInterpolated` parametrise.

### Rules
- Every dynamic value → bound parameter (LINQ, `FromSql`/`FromSqlInterpolated`, `SqlParameter`, Dapper anonymous object).
- `FromSqlRaw` / `ExecuteSqlRaw` → only with constant SQL text and explicit parameters. Analyzer **EF1002** = error.
- Dynamic `ORDER BY`/`GROUP BY` → whitelist enum/switch, never the raw input.
- Dynamic `LIKE` → parameter with `%` added in application code, wildcards in the input escaped.
- No `string.Format` / `+` / `$""` to build SQL (Dapper included).

### Anti-pattern
```csharp
// ❌ BLOCKER — direct injection
var rows = await db.Payments
    .FromSqlRaw($"SELECT * FROM Payments WHERE UserId = '{userId}'")  // userId = "' OR '1'='1"
    .ToListAsync(ct);

// ❌ BLOCKER — injectable ORDER BY
var sql = $"SELECT * FROM Payments ORDER BY {sortField}";   // sortField = "1; DROP TABLE Payments"
```

### Compliant pattern
```csharp
// ✅ LINQ — parameterised automatically
var rows = await db.Payments.Where(p => p.UserId == userId && p.Status == status).ToListAsync(ct);

// ✅ Raw SQL if needed — interpolation becomes parameters
var rows = await db.Payments.FromSql($"SELECT Id, Amount FROM Payments WHERE UserId = {userId}").ToListAsync(ct);

// ✅ ORDER BY — whitelist
public enum PaymentSort { CreatedAt, Amount }
IQueryable<Payment> Sort(IQueryable<Payment> q, PaymentSort s) => s switch
{
    PaymentSort.Amount => q.OrderBy(p => p.Amount),
    _                  => q.OrderBy(p => p.CreatedAt),   // default, never the raw input
};

// ✅ LIKE — wildcard added in code, user wildcards escaped
static string EscapeLike(string s) => s.Replace("\\", "\\\\").Replace("%", "\\%").Replace("_", "\\_");
q.Where(p => EF.Functions.Like(p.Reference, $"%{EscapeLike(input.Trim())}%", "\\"));

// ✅ Dapper
await conn.QueryAsync<Payment>("SELECT Id, Amount FROM Payments WHERE UserId = @UserId", new { UserId = userId });
```

### CI/CD checklist
- [ ] `.editorconfig`: `dotnet_diagnostic.EF1002.severity = error`; `CA2100` (review SQL for injection) = error
- [ ] `grep -rEn "(FromSqlRaw|ExecuteSqlRaw|Query(Async)?<?.*>?)\(\$\"" src/` → 0
- [ ] Sonar S3649 (SQL injection) → 0 open issue or "Safe" with comment
- [ ] Injection test: `userId = "' OR '1'='1"` → empty result, never all rows

---

## S-06 — Defence in depth: DTO validation + null safety
**Severity:** 🔴 BLOCKER (critical DTO unvalidated / `null` returned from a non-nullable contract)
**Applies to:** backend
**Triggers:** any effectful request body in {{MODULE_CIBLE}}; any DTO/command passed to a business service without validation; any `return null`; any `!` (null-forgiving) in domain code.

### Risk
An unvalidated DTO lets a `null` or out-of-range value reach the domain → `NullReferenceException` in the middle of a business rule, inconsistent state.
Without nullable reference types enabled, `null` flows silently across layers.

### Rules
**Input validation (API layer):**
- Controllers: `[ApiController]` (automatic 400 on invalid model). Minimal APIs: endpoint filter / built-in validation (.NET 10 `AddValidation()`) / FluentValidation.
- Every DTO/command has constraints (`[Required]`, `[StringLength]`, `[Range]`, FluentValidation rules); `required` members + `init` for mandatory fields.
- Violation → structured error format (rule A-03, 400 ProblemDetails with `errors`).

**Null safety (domain):**
- `<Nullable>enable</Nullable>` + `<TreatWarningsAsErrors>` for nullable warnings (CS8600–CS8604, CS8618, CS8625) in every project.
- "Not found" → explicit `T?` return **documented in the signature** (or a `Result<T>` / `TryGet…` pattern) and handled by the caller; never `null` under a non-nullable signature, never `null!`.
- Empty collection → `[]` / `Array.Empty<T>()`, never `null`.
- Critical parameter → `ArgumentNullException.ThrowIfNull(param)` / `ArgumentException.ThrowIfNullOrWhiteSpace(param)` at the start of public methods.

### Anti-pattern
```csharp
// ❌ BLOCKER — no validation: null/negative reaches the domain
app.MapPost("/{{ENDPOINT}}", (CreatePaymentCommand cmd, IService svc) => svc.HandleAsync(cmd));
public sealed record CreatePaymentCommand(string UserId, decimal Amount);

// ❌ BLOCKER — null under a non-nullable contract / null-forgiving to silence the compiler
public Payment FindById(Guid id) => _repo.Find(id)!;
```

### Compliant pattern
```csharp
// ✅ DTO with constraints (note [property:] on positional records)
public sealed record CreatePaymentCommand(
    [property: Required, StringLength(64, MinimumLength = 1)] string UserId,
    [property: Range(typeof(decimal), "0.01", "1000000000")] decimal Amount,
    [property: Required, StringLength(3, MinimumLength = 3)] string Currency);

// ✅ Controller — [ApiController] returns 400 ProblemDetails automatically
[ApiController, Route("{{ENDPOINT}}")]
public sealed class PaymentsController(IPaymentService svc) : ControllerBase
{
    [HttpPost] public async Task<ActionResult<PaymentResponse>> Create(CreatePaymentCommand cmd, CancellationToken ct) => ...
}

// ✅ Domain invariant, independent of the API layer (defence in depth)
public sealed class Payment
{
    public Payment(string userId, decimal amount)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(userId);
        if (amount <= 0m) throw new ArgumentOutOfRangeException(nameof(amount), "amount must be > 0");
        UserId = userId; Amount = amount;
    }
    public string UserId { get; }
    public decimal Amount { get; }
}

// ✅ Explicit nullability, handled by the caller
public Task<Payment?> FindByIdAsync(Guid id, CancellationToken ct) => _db.Payments.FirstOrDefaultAsync(p => p.Id == id, ct);

var payment = await repo.FindByIdAsync(id, ct) ?? throw new NotFoundException(nameof(Payment), id);
```

### CI/CD checklist
- [ ] `<Nullable>enable</Nullable>` in every `.csproj` (or `Directory.Build.props`); nullable warnings = errors
- [ ] `grep -rn "null!" src/` and `grep -rn "default!" src/` → justified (EF entities only) or 0
- [ ] Every effectful endpoint validates its body (test: `amount = null/0/-1` → `400` with structured detail)
- [ ] `grep -rn "return null" src/` → 0 in domain/services
- [ ] Test: DTO/domain object with invalid value → exception in constructor

---

## S-07 — Rate limiting & throttling
**Severity:** 🔴 BLOCKER (effectful endpoint without rate limiting)
**Applies to:** backend
**Triggers:** new POST/PUT/DELETE endpoint with effect in {{MODULE_CIBLE}}; endpoint exposed without quota per identifier (user, API key, IP); critical endpoint without protection against automated calls.

### Risk
An effectful endpoint without rate limiting can be flooded: {{MAX_CALLS}} calls in {{TIME_WINDOW}} = {{RISK_DESCRIPTION}} (saturation, cost, wrong data).
No throttling on {{EXTERNAL_RESOURCE}}: resource-exhaustion attack.

### Rules
- Every effectful POST → quota per `{{IDENTIFIER_TYPE}}` (user, API key, IP).
- Minimum limits: defined by {{TECH_LEAD}} according to the endpoint SLO.
- Overflow → `429 Too Many Requests` + `Retry-After: <seconds>` + structured error body (rule A-03).
- Quota-store fallback: if the counting store is unavailable → fail-open **with alert** (do not block production).
- Metric: `rate_limit_exceeded_total{endpoint, identifier}` exposed.
- **Blind spots:** the built-in ASP.NET Core limiter is **per instance** (N pods = N× the limit) → enforce at the gateway/Redis for a global limit; behind a proxy configure `ForwardedHeaders` or every client shares one IP partition.

### Anti-pattern
```csharp
// ❌ BLOCKER — effectful endpoint without quota
app.MapPost("/{{ENDPOINT}}", (CreateCommand cmd, IService svc) => svc.ExecuteAsync(cmd)); // zero flood protection
```

### Compliant pattern
```csharp
// ✅ Program.cs
builder.Services.AddRateLimiter(o =>
{
    o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    o.AddPolicy("{{ENDPOINT_RATE_LIMITER}}", ctx => RateLimitPartition.GetFixedWindowLimiter(
        partitionKey: ctx.User.FindFirstValue("sub") ?? ctx.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
        factory: _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = {{LIMIT}}, Window = TimeSpan.FromSeconds({{PERIOD_SECONDS}}), QueueLimit = 0
        }));

    // ✅ Structured 429 + Retry-After
    o.OnRejected = async (ctx, ct) =>
    {
        var http = ctx.HttpContext;
        var retryAfter = ctx.Lease.TryGetMetadata(MetadataName.RetryAfter, out var ra) ? (int)ra.TotalSeconds : {{PERIOD_SECONDS}};
        http.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        http.Response.Headers.RetryAfter = retryAfter.ToString(CultureInfo.InvariantCulture);
        await http.Response.WriteAsJsonAsync(new ProblemDetails
        {
            Status = 429, Title = "Too Many Requests",
            Detail = $"Rate limit exceeded for {{ENDPOINT}}. Retry after {retryAfter}s.",
            Extensions = { ["errorCode"] = "RATE_LIMIT_EXCEEDED" }
        }, ct);
    };
});
app.UseRateLimiter();

app.MapPost("/{{ENDPOINT}}", Handler).RequireRateLimiting("{{ENDPOINT_RATE_LIMITER}}");
// Controllers: [EnableRateLimiting("{{ENDPOINT_RATE_LIMITER}}")]
```

### CI/CD checklist
- [ ] Every effectful `POST` → `RequireRateLimiting` / `[EnableRateLimiting]`
- [ ] Test: {{LIMIT}} + 1 calls in {{PERIOD}} → the last returns `429` with `Retry-After`
- [ ] Metric `rate_limit_exceeded_total` visible in monitoring
- [ ] Alert if 429 rate > {{ALERT_THRESHOLD}} % on {{ENDPOINT}} (sign of attack or client bug)

---

## S-08 — Encryption at rest: sensitive DB columns, files, backups
**Severity:** 🔴 BLOCKER (sensitive data unencrypted in DB)
**Applies to:** backend
**Triggers:** new DB column storing {{SENSITIVE_DATA_TYPE}}; entity with potentially sensitive field ({{SENSITIVE_FIELD_EXAMPLES}}); data export (DB backup, dump) without encryption.

### Risk
An unencrypted {{DATA_STORE}} dump containing `{{SENSITIVE_FIELD}}` → sensitive data immediately readable.
A {{STORAGE}} backup without encryption = violation of {{COMPLIANCE_STANDARD}}.

### Rules
- Sensitive columns (`{{SENSITIVE_FIELD_EXAMPLES}}`) → transparent encryption through an EF Core `ValueConverter`.
- Algorithm: **AES-256-GCM** (`System.Security.Cryptography.AesGcm`), random **12-byte nonce per value**, 16-byte tag — never ECB, never fixed/reused nonce, never CBC without MAC.
- Key → {{SECRET_STORE}} (annual rotation) — never in application config. Store a **key version byte** in the ciphertext to allow rotation.
- Backup → encrypted (TDE, encrypted volume, SSE storage, or `gpg --encrypt`).
- Verification: `SELECT {{SENSITIVE_FIELD}} FROM {{TABLE}}` → opaque.
- **Blind spots:** an encrypted column cannot be filtered/indexed → use a **blind index** (HMAC-SHA256 of the normalised value, stored in a separate column) for equality lookups. Also consider DB-native options (SQL Server Always Encrypted, column encryption) for the highest PCI scope.

### Anti-pattern
```csharp
// ❌ BLOCKER — clear text in DB
public string CardNumber { get; set; } = default!;

// ❌ BLOCKER — ECB (same plaintext → same ciphertext)
using var aes = Aes.Create(); aes.Mode = CipherMode.ECB;

// ❌ BLOCKER — hard-coded key
private static readonly byte[] Key = Encoding.UTF8.GetBytes("hardcoded-key!");
```

### Compliant pattern
```csharp
// ✅ AES-256-GCM encryptor — layout: keyVersion(1) | nonce(12) | tag(16) | ciphertext
public sealed class AesGcmEncryptor(IKeyProvider keys) : IFieldEncryptor
{
    private const int NonceSize = 12, TagSize = 16;

    public string Encrypt(string plaintext)
    {
        var (version, key) = keys.Current;                       // 32 bytes from {{SECRET_STORE}}
        var pt = Encoding.UTF8.GetBytes(plaintext);
        var nonce = RandomNumberGenerator.GetBytes(NonceSize);   // fresh per value
        var ct = new byte[pt.Length]; var tag = new byte[TagSize];
        using var aes = new AesGcm(key, TagSize);
        aes.Encrypt(nonce, pt, ct, tag);

        var output = new byte[1 + NonceSize + TagSize + ct.Length];
        output[0] = version;
        nonce.CopyTo(output, 1); tag.CopyTo(output, 1 + NonceSize); ct.CopyTo(output, 1 + NonceSize + TagSize);
        return Convert.ToBase64String(output);
    }

    public string Decrypt(string stored)
    {
        var raw = Convert.FromBase64String(stored);
        var key = keys.Get(raw[0]);
        var nonce = raw.AsSpan(1, NonceSize); var tag = raw.AsSpan(1 + NonceSize, TagSize);
        var ct = raw.AsSpan(1 + NonceSize + TagSize);
        var pt = new byte[ct.Length];
        using var aes = new AesGcm(key, TagSize);
        aes.Decrypt(nonce, ct, tag, pt);                         // throws CryptographicException if tampered
        return Encoding.UTF8.GetString(pt);
    }
}

// ✅ EF Core converter — transparent in the domain
public sealed class EncryptedStringConverter(IFieldEncryptor enc)
    : ValueConverter<string, string>(v => enc.Encrypt(v), v => enc.Decrypt(v));

// ✅ Mapping
modelBuilder.Entity<Card>().Property(c => c.Number)
    .HasConversion(new EncryptedStringConverter(_encryptor))
    .HasColumnName("{{SENSITIVE_FIELD}}_encrypted");
```

### CI/CD checklist
- [ ] `SELECT {{SENSITIVE_FIELD}} FROM {{TABLE}} LIMIT 1` → opaque Base64 (integration test)
- [ ] Key `{{ENCRYPTION_KEY_ENV_VAR}}` in {{SECRET_STORE}}, absent from application config
- [ ] `grep -rEn "CipherMode\.(ECB|CBC)|AesManaged|DES|RC2" src/` → 0
- [ ] Unique nonce per value: two encryptions of the same plaintext → two different ciphertexts (test)
- [ ] Backup: `ls -la backups/` → every file encrypted (no clear dump)
