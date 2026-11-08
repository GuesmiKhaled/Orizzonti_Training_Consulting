---
id: "S-07"
title: "Rate limiting & throttling — protection of side-effect endpoints"
severity: "🔴 BLOCKER (side-effect endpoint without rate limiting)"
applies_to: [backend]
triggers:
  - "Any new side-effect POST/PUT/DELETE endpoint in {{MODULE_CIBLE}}"
  - "Any exposed endpoint without a per-identifier quota (user, API key, IP)"
  - "Any critical endpoint without protection against automated calls"
version: "1.0"
---

## Risk
A side-effect endpoint without rate limiting can be flooded: {{MAX_CALLS}} calls within {{TIME_WINDOW}} = {{RISK_DESCRIPTION}} (saturation, cost, incorrect data).
Without throttling on {{EXTERNAL_RESOURCE}}: resource-exhaustion attack.

## Rules

- Every side-effect POST endpoint → quota per `{{IDENTIFIER_TYPE}}` (user, API key, IP).
- Minimal limits: defined by {{TECH_LEAD}} according to the endpoint's SLO.
- Exceeding → `429 Too Many Requests` + `Retry-After: <seconds>` header + structured error body (card A-03).
- Quota fallback: if the counting store is unavailable → fail-open with an alert (don't block production).
- Metrics: `rate_limit_exceeded_total{endpoint, identifier}` exposed.

## Anti-pattern
```csharp
// ❌ BLOCKER — side-effect endpoint without quota
app.MapPost("/{{ENDPOINT}}", async ({{Command}} cmd) =>
    await service.ExecuteAsync(cmd)); // 0 protection against flooding
```

## Compliant pattern
```csharp
// ✅ Program.cs — per-identifier rate limiter
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("{{ENDPOINT_RATE_LIMITER}}", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partition: context.User?.Identity?.Name
                ?? context.Connection.RemoteIpAddress?.ToString()
                ?? "anonymous",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                Window = TimeSpan.FromSeconds({{PERIOD}}),
                PermitLimit = {{LIMIT}},
                AutoTransition = true
            }));
});
app.UseRateLimiter();

app.MapPost("/{{ENDPOINT}}", Handle)
    .RequireRateLimiting("{{ENDPOINT_RATE_LIMITER}}");
// 429 + Retry-After header added automatically; body in ProblemDetails format (card A-03)
```

## CI/CD checklist
- [ ] Every side-effect `POST` → rate-limited policy
- [ ] Test: {{LIMIT}} + 1 calls within {{PERIOD}} → the last returns `429` with `Retry-After`
- [ ] Metric `rate_limit_exceeded_total` visible in the monitoring system
- [ ] Alert if the 429 rate > {{ALERT_THRESHOLD}}% on {{ENDPOINT}} (sign of an attack or a client bug)
