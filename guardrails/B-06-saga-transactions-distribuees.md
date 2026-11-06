---
id: "B-06"
title: "Saga — distributed transactions without 2PC"
severity: "🔴 BLOCKER (2PC/XA across services)"
applies_to: [backend]
triggers:
  - "Any multi-service flow requiring transactional consistency in {{MODULE_CIBLE}}"
  - "Any single unit of work covering multiple services or multiple databases"
  - "Any business state without an explicit state machine"
version: "1.0"
---

## Risk
2PC/XA = distributed lock: if a participant dies after the PREPARE vote → the whole transaction stays frozen until manual recovery.
In production: a state frozen indefinitely = impacted client without confirmation → P1.

## Rules

- Never 2PC/XA between microservices (never one unit of work spanning multiple databases).
- Any multi-service flow → **choreographed saga** (events) or **orchestrated** (saga orchestrator).
- Each step → explicit state: `{{STATE_INITIAL}}` → `{{STATE_INTERMEDIATE}}` → `{{STATE_FINAL}}` (or `{{STATE_FAILED}}` + compensation).
- Compensation → idempotent (card B-02) and traced (log + event).
- Intermediate state → always reconciled (reconciliation scheduler).

## Anti-pattern
```csharp
// ❌ BLOCKER — one scope spanning multiple services/DBs
public async Task ProcessFlowAsync({{Command}} cmd)
{
    _repositoryA.Add(entity);                 // DB A
    await _repositoryA.SaveChangesAsync();
    await _externalServiceA.CreateAsync(entity);  // HTTP call → DB B
    await _externalServiceB.NotifyAsync(entity);  // HTTP call → DB C
    // If NotifyAsync fails → impossible rollback on B and C
}
```

## Compliant pattern
```csharp
// ✅ Choreographed saga by events

// Step 1 — Service A
public async Task<{{Entity}}?> Step1Async({{Command}} cmd)
{
    var entity = new {{Entity}}(cmd, {{StateInitial}});
    _repositoryA.Add(entity);
    await _repositoryA.SaveChangesAsync(); // scope ends here
    await _messaging.SendAsync("{{EVENT_STEP1}}",
        new {{EventStep1Type}}(entity.Id, cmd.IdempotencyKey));
    return entity;
}

// Step 2 — Service B (at-least-once consumer + idempotence)
public async Task OnStep1Async({{EventStep1Type}} evt)
{
    if (!await _repositoryB.ExistsByAsync(evt.EntityId))
    {
        _repositoryB.Add({{EntityB}}.From(evt));
        await _repositoryB.SaveChangesAsync();
        await _messaging.SendAsync("{{EVENT_STEP2}}", ...);
    }
    await _consumer.CommitAsync(); // commit after the effect
}

// ✅ Compensation — FAILED state, not a rollback
public async Task OnFailedAsync({{EventFailedType}} evt)
{
    var e = await _repositoryB.FindAsync(evt.EntityId);
    if (e is not null)
    {
        e.Status = {{StateFailed}}; // idempotent (card B-02)
        await _repositoryB.SaveChangesAsync();
    }
    await _consumer.CommitAsync();
}
```

## CI/CD checklist
- [ ] `rg "SaveChanges" src/` → no scope spanning multiple services/DBs
- [ ] Every entity has an explicit visible state: `SELECT status, COUNT(*) FROM {{TABLE}} GROUP BY status`
- [ ] Reconciliation scheduler active: alert if intermediate state > {{RECONCILIATION_TIMEOUT}}
- [ ] Compensation test: FAILED event → entity cancelled (idempotent)
