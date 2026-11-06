---
id: "B-02"
title: "Idempotency of side-effect operations"
severity: "🔴 absolute BLOCKER"
applies_to: [backend]
triggers:
  - "Any POST creating an effect: {{OPERATION_TYPES}} (creation, state change, sending)"
  - "Any message handler processing a side-effect event in {{MODULE_CIBLE}}"
version: "1.0"
---

## Risk
Without idempotency: a network retry, a double-send or a double-delivery of a message = double effect.
The only reliable protection: check whether the operation was **already** executed **before** executing it.

## Rules

- Every side-effect POST endpoint → `{{IDEMPOTENCY_HEADER}}` header mandatory (client-side UUIDv4).
- Before any effect: lookup `{{IDEMPOTENCY_TABLE}} WHERE key = @key AND scope = @scope`.
  - Found → return **exactly** the stored result (no 2nd execution).
  - Absent → execute + persist (key, scope, result, expiry) in the **same transaction**.
- Retry → **same** `{{IDEMPOTENCY_HEADER}}` as the original attempt — never a new key.
- Message consumers → idempotency key = stable identifier of the message.

## Anti-pattern
```csharp
// ❌ BLOCKER — side-effect POST without idempotency key
app.MapPost("/{{ENDPOINT}}", async ({{Command}} cmd) =>
    await service.ExecuteAsync(cmd)); // replayable = double effect

// ❌ BLOCKER — retry with a new key
for (var i = 0; i < 3; i++)
{
    cmd = cmd.WithIdempotencyKey(Guid.NewGuid()); // new key = new effect
    await client.PostAsync(cmd);
}
```

## Compliant pattern
```csharp
// ✅ Endpoint with idempotency key
app.MapPost("/{{ENDPOINT}}", async (
    [FromHeader(Name = "{{IDEMPOTENCY_HEADER}}")] Guid idempotencyKey,
    [FromBody] {{Command}} cmd,
    IdempotencyStore store,
    Service service) =>
{
    if (store.Find(idempotencyKey, "{{SCOPE}}") is { } stored)
        return Results.Ok(stored.Result); // exactly the same stored result

    var result = await service.ExecuteAsync(cmd);
    await store.StoreAsync(idempotencyKey, "{{SCOPE}}", result, TimeSpan.FromHours(24)); // same transaction
    return Results.Created($"/{{ENDPOINT}}/{result.Id}", result); // 201
});

// ✅ Retry — same original key
var originalKey = Guid.NewGuid(); // generated only once
for (var attempt = 0; attempt < 6; attempt++)
{
    try
    {
        await client.PostAsync(url, body, idempotencyKey: originalKey); // SAME key
        break;
    }
    catch (RetryableException) when (attempt < 5)
    {
        await BackoffAsync(attempt);
    }
}
```

## CI/CD checklist
- [ ] Every side-effect `MapPost` → `{{IDEMPOTENCY_HEADER}}` parameter present
- [ ] Test: same key sent twice → identical response, 1 row in the DB
- [ ] Test: consumer replayed (same message) → 1 effect in the DB
- [ ] Unique index on `(key, scope)` in the `{{IDEMPOTENCY_TABLE}}` table
