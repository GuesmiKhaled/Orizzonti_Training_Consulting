---
id: "S-03"
title: "Callback security — HMAC + anti-replay"
severity: "🔴 BLOCKER — side-effect callback without signature or without anti-replay"
applies_to: [backend]
triggers:
  - "Creation of a webhook/callback/notification endpoint in {{MODULE_CIBLE}}"
  - "Any side-effect action endpoint (creation, debit, state change)"
  - "Any external callback received from a third-party system"
version: "1.0"
---

## Risk
Without a verified HMAC: anyone reaching the endpoint can forge callbacks → unauthorized effects.
Without anti-replay: a captured valid request replayed N times = N undesirable effects. Authentication says *who is speaking*, not *when* nor *only once*.

## Rules

**HMAC (callback authentication):**
- Every side-effect callback passes through `{{SIGNATURE_FILTER}}` before the handler.
- Algorithm: `HMAC-SHA256(key, timestamp + "." + body)`.
- Comparison in **constant time** — never plain string comparison (timing attack).
- HMAC key in a secret manager ({{SECRET_STORE}}) — never hardcoded.

**Anti-replay (time-bounded uniqueness):**
- Required headers: `X-Timestamp` (UTC ISO-8601), `X-Nonce` (UUID), `{{IDEMPOTENCY_HEADER}}`.
- `X-Timestamp` verified at ± 5 min against the server clock — never the client clock.
- `X-Nonce` → `nonceStore.TryStore(nonce, TTL=10min)` — if already present → `409 Replay detected`.
- Nonce stored in a distributed cache ({{CACHE_STORE}}) — never in local memory only.

## Anti-pattern
```csharp
// ❌ BLOCKER — callback without signature
app.MapPost("/{{CALLBACK_ENDPOINT}}", async (Event evt) =>
    await _service.ProcessAsync(evt)); // anyone can POST

// ❌ BLOCKER — timing-sensitive comparison
if (received == computed) { ... }
```

## Compliant pattern
```csharp
// ✅ Signature middleware BEFORE the handler
public sealed class SignatureMiddleware(ILogger<SignatureMiddleware> logger,
    IDistributedCache nonceStore, RequestDelegate next)
{
    private readonly byte[] _key = Convert.FromBase64String(Environment.GetEnvironmentVariable("{{ENCRYPTION_KEY_ENV_VAR}}")!);
    // key injected from {{SECRET_STORE}} — never hardcoded

    public async Task InvokeAsync(HttpContext context)
    {
        var timestamp = context.Request.Headers["X-Timestamp"].FirstOrDefault();
        var nonce = context.Request.Headers["X-Nonce"].FirstOrDefault();

        // 1. ± 5-minute time window
        if (!IsFreshUtc(timestamp)) { context.Response.StatusCode = StatusCodes.Status401Unauthorized; return; }

        // 2. Unique nonce (10-minute TTL)
        if (string.IsNullOrEmpty(nonce) || await nonceStore.GetStringAsync(nonce) is not null)
        {
            context.Response.StatusCode = StatusCodes.Status409Conflict; // replay
            return;
        }
        await nonceStore.SetStringAsync(nonce, "1",
            new DistributedCacheOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10) });

        // 3. Constant-time HMAC
        var body = await new StreamReader(context.Request.Body).ReadToEndAsync();
        var expected = ComputeHmacSha256($"{timestamp}.{body}", _key);
        var received = Convert.FromBase64String(context.Request.Headers["X-Signature"].FirstOrDefault() ?? "");
        if (!CryptographicOperations.FixedTimeEquals(received, expected))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return;
        }
        context.Request.Body = new MemoryStream(Encoding.UTF8.GetBytes(body)); // re-readable by the handler
        await next(context);
    }
}
```

## CI/CD checklist
- [ ] Every `POST /{{CALLBACK_ENDPOINT}}` goes through `{{SIGNATURE_FILTER}}`
- [ ] HMAC key in {{SECRET_STORE}} — `rg "hmacKey\s*=" src/` → 0 literal values
- [ ] Test: valid signature→200; wrong→401; expired timestamp→401; replayed nonce→409; double delivery→1 effect
