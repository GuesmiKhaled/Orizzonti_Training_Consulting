---
id: "A-04"
title: "Distributed tracing — correlationId & cross-service propagation"
severity: "🔴 BLOCKER (log on critical flow without correlationId) — 🟡 WARNING"
applies_to: [backend]
triggers:
  - "Any endpoint initiating a multi-service flow in {{MODULE_CIBLE}}"
  - "Any cross-service call (HTTP, messaging) without correlationId propagation"
  - "Any log on a critical flow without a correlation identifier"
version: "1.0"
---

## Risk
Without correlationId: a P1 incident in production → searching the flow in the logs → impossible to tie together the logs of {{SERVICE_COUNT}} different services → debugging impossible without correlation.
Scope not propagated to messaging consumers → the correlationId disappears between services → traceability lost.

## Rules

- Every incoming endpoint → `correlationId` in the log scope at the start of processing.
- Priority: incoming `{{CORRELATION_HEADER}}` header → otherwise a generated UUIDv4.
- Propagated: outgoing HTTP calls (header `{{CORRELATION_HEADER}}`) + messages (header `{{CORRELATION_HEADER}}`) + W3C `traceparent` (via `Activity`).
- Scope disposed at the end of the request (`using`/`finally`) — otherwise leakage between requests (thread pool).
- Log format: `correlationId` present on every line of the critical flow.

## Anti-pattern
```csharp
// ❌ BLOCKER — critical log without correlationId
_logger.LogInformation("Operation completed for entity {EntityId}", entityId);
// → impossible to tie this log to a specific flow during an incident

// ❌ WARNING — scope pushed but never disposed (leak in the thread pool)
var scope = _logger.BeginScope(new Dictionary<string, object?> { ["correlationId"] = id });
// (no Dispose → scope leaks across pooled threads)
```

## Compliant pattern
```csharp
// ✅ Correlation middleware — intercepts every request
public sealed class CorrelationIdMiddleware(ILogger<CorrelationIdMiddleware> logger, RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        var header = context.Request.Headers["{{CORRELATION_HEADER}}"].FirstOrDefault();
        var correlationId = string.IsNullOrWhiteSpace(header) ? Guid.NewGuid().ToString() : header!;

        context.Response.Headers["{{CORRELATION_HEADER}}"] = correlationId;

        using (logger.BeginScope(new Dictionary<string, object?> { ["correlationId"] = correlationId }))
        {
            await next(context); // scope disposed at the end (mandatory)
        }
    }
}

// ✅ Outgoing HTTP call propagation
var request = new HttpRequestMessage(HttpMethod.Post, url)
{
    Headers = { { "{{CORRELATION_HEADER}}", Activity.Current?.Id ?? correlationId } }
};
await _httpClient.SendAsync(request);

// ✅ Message propagation
var message = new Message(payload) { ApplicationProperties = { ["{{CORRELATION_HEADER}}"] = correlationId } };
await _producer.ProduceAsync(topic, message);

// ✅ Message consumer — restore the scope
public async Task HandleAsync({{MessageType}} msg)
{
    var corrId = msg.ApplicationProperties.TryGetValue("{{CORRELATION_HEADER}}", out var v)
        ? v.ToString() : Guid.NewGuid().ToString();
    using (_logger.BeginScope(new Dictionary<string, object?> { ["correlationId"] = corrId }))
    {
        await _processor.ProcessMessageAsync(msg);
    }
}
```

```
# Log format — correlationId on every line (structured logging / Serilog)
{{LOG_PATTERN}} = {Timestamp:iso8601} [{Level:u3}] {Message:lj} [correlationId:{correlationId}] @l
```

## CI/CD checklist
- [ ] Call to `{{EXAMPLE_ENDPOINT}}` → response with the `{{CORRELATION_HEADER}}` header present
- [ ] Flow logs → every line contains `[<uuid>]` (scope property)
- [ ] Test: call without `{{CORRELATION_HEADER}}` → UUID generated and propagated to every service in the flow
- [ ] `rg "BeginScope" src/` → verify every push has a Dispose in `using`/`finally`
