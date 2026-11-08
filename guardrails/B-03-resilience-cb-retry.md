---
id: "B-03"
title: "Resilience — Circuit Breaker + Retry + Fallback"
severity: "🔴 BLOCKER (external call without timeout/CB) — 🟡 WARNING (naive retry)"
applies_to: [backend]
triggers:
  - "Any synchronous call to an external service from {{MODULE_CIBLE}}: {{EXTERNAL_SERVICES}}"
  - "Any retry loop or retry policy in the code"
  - "Any side-effect operation retried without an idempotency key"
version: "1.0"
---

## Risk
Without a timeout: a slow external service = blocked threads → pool exhausted → OOM → cascade on every endpoint of {{MODULE_CIBLE}}.
Without jitter: N instances retrying at the same time = retry storm → prolonged outage.
Side-effect retry without even `{{IDEMPOTENCY_HEADER}}` = guaranteed double effect.

## Rules

**Circuit Breaker ({{RESILIENCE_LIB}} — Polly / `AddStandardResilienceHandler`) — per dependency:**
- Explicit timeout: connect ≤ {{CONNECT_TIMEOUT}}, read ≤ remaining SLO budget.
- Sliding window of {{CB_WINDOW}} calls, {{CB_THRESHOLD}}% threshold, open delay {{CB_DELAY}}, half-open {{CB_HALF_OPEN}} attempts.
- Side-effect fallback → persist intermediate state + reconciliation event — never silent failure.
- Non-critical fallback → degraded value (cache/empty) + warning log.

**Retry — single policy:**
- Base {{RETRY_BASE}}, factor {{RETRY_FACTOR}}, **full jitter**, `MaxRetryAttempts = {{RETRY_MAX}}`, cap {{RETRY_CAP}}.
- Side-effect retry → **same** original idempotency key — never a new key (card B-02).
- No retry if the circuit breaker is open.

## Anti-pattern
```csharp
// ❌ BLOCKER — external call without timeout nor CB
var result = await _externalClient.CallAsync(request); // can wait ∞

// ❌ BLOCKER — naive retry
for (var i = 0; i < 10; i++)
{
    await Task.Delay(1000); // fixed → storm; no idempotency → double effect
    await _externalClient.CallAsync(request);
}
```

## Compliant pattern
```csharp
// ✅ .NET 10: built-in standard resilience handler (Polly under the hood)
builder.Services.AddHttpClient<{{ExternalClient}}>(client =>
        client.Timeout = TimeSpan.FromMilliseconds({{READ_TIMEOUT}}))
    .AddStandardResilienceHandler(); // CB + retry (exponential, jitter) + timeout

// ✅ Explicit Polly v8 pipeline — CB + retry + jitter
var pipeline = new ResiliencePipelineBuilder<{{ServiceResponse}}>()
    .AddTimeout(TimeSpan.FromMilliseconds({{READ_TIMEOUT}}))
    .AddRetry(new RetryOptions
    {
        MaxRetryAttempts = {{RETRY_MAX}},
        Delay = TimeSpan.FromMilliseconds({{RETRY_BASE}}),
        BackoffDelayType = DelayBackoffType.Exponential,
        MaxDelay = TimeSpan.FromMilliseconds({{RETRY_CAP}}),
        UseJitter = true
    })
    .AddCircuitBreaker(new CircuitBreakerOptions
    {
        SamplingDuration = TimeSpan.FromSeconds({{CB_WINDOW}}),
        MinimumThroughput = 20,
        FailureRate = {{CB_THRESHOLD}} / 100m,
        BreakDuration = TimeSpan.FromSeconds({{CB_DELAY}})
    })
    .Build();

// ✅ Fallback — intermediate state + reconciliation
try
{
    return await pipeline.ExecuteAsync(ct => _externalClient.ExecuteAsync(req, ct));
}
catch (Exception) when (CircuitIsOpen || MaxAttemptsReached)
{
    await _repository.UpdateStatusAsync(req.Id, OrderStatus.Pending, ct);
    await _eventPublisher.PublishAsync(new {{RetryEvent}}(req.Id, req.IdempotencyKey), ct);
    return {{ServiceResponse}}.Pending(req.Id); // never silent failure
}
```

```csharp
// ✅ appsettings.json — options bound from configuration
{
  "{{ExternalClient}}": {
    "TimeoutMilliseconds": {{READ_TIMEOUT}},
    "CircuitBreaker": { "SamplingDurationSeconds": {{CB_WINDOW}}, "FailureRate": {{CB_THRESHOLD}} }
  }
}
```

## CI/CD checklist
- [ ] Every `{{EXTERNAL_SERVICES}}` call wrapped in a resilience pipeline (CB + timeout)
- [ ] Test: cut {{EXTERNAL_SERVICE}} for {{CB_DELAY}} → CB opens < 1 s, 0 thread blocked > timeout, PENDING state persisted
- [ ] Test: {{RETRY_MAX}}× retry failure → exactly {{RETRY_MAX}} attempts, then intermediate state
- [ ] Test: post-failure recovery → uncorrelated attempts (jitter), no synchronized spike
- [ ] Test: double call (same key) → 1 effect
