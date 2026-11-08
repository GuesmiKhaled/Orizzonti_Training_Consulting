---
id: "D-01"
title: "Database — anti N+1, keyset pagination & concurrent locking"
severity: "🔴 BLOCKER (N+1 on hot path / critical update without locking) — 🟡 WARNING"
applies_to: [backend]
triggers:
  - "Any repository/service loading a list with associations in {{MODULE_CIBLE}}"
  - "Any loop making a DB call per iteration"
  - "Any update of a critical value ({{CRITICAL_FIELD_EXAMPLES}}: balance, counter, quota)"
  - "Any explicit lock (ROW_LOCK_TIMEOUT, UPDLOCK, SELECT FOR UPDATE)"
version: "1.0"
---

## Risk
N+1 on {{TABLE}} with {{ASSOCIATED_TABLES}} → {{N_PLUS_ONE_QUERIES}} queries per call → connection pool saturated → cascading timeouts → SLO p99 breached.
`read-modify-write` as two queries on `{{CRITICAL_FIELD}}` → lost update: two concurrent writes read the same value → unexplainable accounting drift.

## Rules

**Anti N+1:**
- List with associations → projection or `AsSplitQuery` (one query) — never a `FindAsync` loop.
- Unbounded `ToListAsync()` → BLOCKER: keyset pagination mandatory.
- Keyset: `WHERE {{SORT_FIELD}} > @lastValue ORDER BY {{SORT_FIELD}}` + `Take(n)` (no deep OFFSET).
- DTO projection (useful columns only) — never materialize full entities with heavy fields.

**Concurrent locking:**
- Update of `{{CRITICAL_FIELD}}` → **optimistic by default** (concurrency token: `rowversion` on SQL Server, explicit `version` column on Oracle, `xmin` on PostgreSQL) + handle `DbUpdateConcurrencyException`.
- Decrement of a scarce resource → atomic statement: `UPDATE {{TABLE}} SET {{FIELD}} = {{FIELD}} - @delta WHERE id = @id AND {{FIELD}} >= @delta`.
- Pessimistic locking → timeout + short transaction (lock released in a few ms).
- Never a two-step `read-modify-write` outside a transaction.

## Anti-pattern
```csharp
// ❌ BLOCKER — N+1
var items = await _repo.Items.ToListAsync();
foreach (var item in items)
{
    var assoc = await _repo.Associated.FindAsync(item.AssocId); // +N queries
}

// ❌ BLOCKER — lost update on {{CRITICAL_FIELD}}
var e = await _repo.FindAsync(id);
e.{{CRITICAL_FIELD}} -= delta;
await _repo.SaveChangesAsync(); // no token → lost update possible

// ❌ BLOCKER — concurrency token without exception handling
await _repo.SaveChangesAsync(); // DbUpdateConcurrencyException → silent 500
```

## Compliant pattern
```csharp
// ✅ One query for associations — projection
public async Task<List<{{Dto}}>> FindWithAssociationsAsync({{FilterType}} value, CancellationToken ct) =>
    await _db.{{Entity}}s
        .Where(e => e.{{FilterField}} == value)
        .Select(e => new {{Dto}}(e.Id, e.Assoc!.Name)) // projection, no N+1
        .ToListAsync(ct);

// ✅ Keyset pagination — deep pages stay fast
public async Task<List<{{Dto}}>> FindPageAsync({{SortType}} lastValue, int n, CancellationToken ct) =>
    await _db.{{Entity}}s
        .Where(e => e.{{SortField}} > lastValue)
        .OrderBy(e => e.{{SortField}})
        .Take(n)
        .Select(e => new {{Dto}}(e.Id, e.{{SortField}}))
        .ToListAsync(ct);

// ✅ Atomic decrement — no lost update
var affected = await _db.{{Entity}}s
    .Where(e => e.Id == id && e.{{CRITICAL_FIELD}} >= delta)
    .ExecuteUpdateAsync(e => e.SetProperty(x => x.{{CRITICAL_FIELD}} => x.{{CRITICAL_FIELD}} - delta));
// 0 = insufficient; 1 = success

// ✅ Concurrency token + handling DbUpdateConcurrencyException
// Entity: [ConcurrencyCheck] public Guid Version { get; set; }
// (SQL Server: rowversion; PostgreSQL: xmin; Oracle: explicit version column)
try
{
    await _db.SaveChangesAsync();
}
catch (DbUpdateConcurrencyException)
{
    throw new ConflictException("{{CONFLICT_MESSAGE}}"); // 409
}
```

## CI/CD checklist
- [ ] `{{LIST_ENDPOINT}}` endpoint → SQL log → 1 query (not 1+N)
- [ ] Unbounded `ToListAsync()` without `Take` → forbidden by an architecture rule
- [ ] Concurrency test (2 tasks updating `{{CRITICAL_FIELD}}`) → 1 success, 1 refused (0 lost updates)
- [ ] Pagination test: page {{DEEP_PAGE}} → stable time < {{PAGE_LATENCY}} ms (no OFFSET)
