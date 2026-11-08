---
id: "D-04"
title: "Connection pool & resource leak"
severity: "🔴 BLOCKER (un-closed connection/stream) — 🟡 WARNING (mis-sized pool)"
applies_to: [backend]
triggers:
  - "Any code opening a DB connection, file, stream or network resource"
  - "Any connection pool configuration ({{CONNECTION_POOL_LIB}}) in {{MODULE_CIBLE}}"
  - "Roslyn CA2000/CA2201 / Sonar (resource should be closed)"
version: "1.0"
---

## Risk
A connection not closed in a catch block → silent leak → the pool empties gradually → cascading timeouts on every endpoint of {{MODULE_CIBLE}} → P1.
Under-sized pool → connection queue → p99 latency explodes under load.

## Rules

- Every `IDisposable`/`IAsyncDisposable` resource (`SqlConnection`, `DbDataReader`, `Stream`, `HttpClient`) → `using` / `await using`.
- Never a manual `.Dispose()` in a separate `finally` (forgotten on the exception path).
- `{{CONNECTION_POOL_LIB}}`: enable leak detection/pool diagnostics in dev.
- Sizing: `Max Pool Size = {{POOL_SIZE_FORMULA}}` (tuned by benchmark).
- `Connect Timeout ≤ {{CONNECTION_TIMEOUT}}` on SLO endpoints.
- Never a network/messaging call **inside** an open DB transaction (lock held for the whole call).

## Anti-pattern
```csharp
// ❌ BLOCKER CA2000 — reader not closed if an exception is thrown
using var conn = new SqlConnection(connectionString);
conn.Open();
using var cmd = new SqlCommand(sql, conn);
var reader = cmd.ExecuteReader(); // if Read() throws → reader never closed → leak

// ❌ WARNING — network call inside a transaction
using var tx = _db.Database.BeginTransaction();
var e = await _repo.FindAsync(id);              // connection + lock held
var r = await _externalClient.CallAsync(e);     // network call while the lock is held
e.Result = r.Value;
await _db.SaveChangesAsync();
```

## Compliant pattern
```csharp
// ✅ using — disposal guaranteed
await using var conn = new SqlConnection(connectionString);
await conn.OpenAsync();
await using var cmd = new SqlCommand(sql, conn);
await using var reader = await cmd.ExecuteReaderAsync();
while (await reader.ReadAsync()) { /* processing */ }
// conn, cmd, reader disposed automatically even on exception

// ✅ Network call OUTSIDE the transaction — short scope
public async Task<{{Result}}> ProcessAsync({{Id}} id)
{
    var e = await _repo.FindAsync(id);            // short read
    var r = await _externalClient.CallAsync(e);   // network call outside the transaction
    return await PersistResultAsync(id, r);        // short transaction
}

public async Task<{{Result}}> PersistResultAsync({{Id}} id, {{Response}} r)
{
    var e = await _repo.FindAsync(id);
    e.Result = r.Value;
    return await _db.SaveChangesAsync(); // < {{TRANSACTION_TIMEOUT}}
}
```

```csharp
// ✅ Sized pool — connection string (SQL Server example)
// Server={{DB_HOST}};Database={{DB_NAME}};Max Pool Size={{MAX_POOL_SIZE}};
// Min Pool Size={{MIN_IDLE}};Connect Timeout={{CONNECTION_TIMEOUT}}
```

## CI/CD checklist
- [ ] Roslyn CA2000/CA2201 → 0 open issues on the data-access classes of {{MODULE_CIBLE}}
- [ ] `rg "new SqlCommand|new StreamReader|new FileStream" src/ | rg -v "using"` → 0
- [ ] Load test {{LOAD_DURATION}}: `ActiveConnections` does not grow indefinitely
- [ ] Pool diagnostics enabled in staging → 0 leak alerts
- [ ] `Connect Timeout={{CONNECTION_TIMEOUT}}` → test: DB down → endpoint responds in < {{TIMEOUT_RESPONSE}} ms
