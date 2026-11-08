# BLOCK D — PERSISTENCE / DB (D-01 → D-04) — EF Core edition

> Assumptions: **EF Core 10 on .NET 10**, engines **SQL Server, Oracle and PostgreSQL**. Rules are provider-agnostic; where engines differ, use the matrix below.

| Concern | SQL Server | PostgreSQL | Oracle |
|---|---|---|---|
| EF Core provider | `Microsoft.EntityFrameworkCore.SqlServer` | `Npgsql.EntityFrameworkCore.PostgreSQL` | `Oracle.EntityFrameworkCore` (ODP.NET managed) |
| Concurrency token | `[Timestamp] byte[] RowVersion` | `xmin` system column | **No rowversion**: explicit `int Version` column, `IsConcurrencyToken()`, incremented on each update (or `[ConcurrencyCheck]`) |
| Unique-violation detection | error 2627 / 2601 | SQLSTATE `23505` | `ORA-00001` |
| Online index | `WITH (ONLINE = ON)` (Enterprise / Azure SQL) | `CREATE INDEX CONCURRENTLY` (outside a transaction) | `CREATE INDEX ... ONLINE` |
| DDL transactional? | Yes | Yes (except `CONCURRENTLY`) | **No — DDL auto-commits**: a failed migration can leave a half-applied schema; keep each migration small and idempotent |
| Pool settings (connection string) | `Max Pool Size`, `Connect Timeout` | `Maximum Pool Size`, `Timeout` | `Max Pool Size`, `Connection Timeout` |
| Identifier limits | 128 chars | 63 chars | 128 chars (12.2+), 30 before — check your version |
| Keyset `LIMIT` | `OFFSET/FETCH` (EF handles `Take`) | `LIMIT` | `FETCH FIRST n ROWS ONLY` (12c+) |

Write migrations and raw SQL so they run on every engine you deploy to, or keep one migration set **per provider**. Never assume SQL Server syntax in shared code.

---

## D-01 — EF Core: anti N+1, keyset pagination & concurrency
**Severity:** 🔴 BLOCKER (N+1 on hot path / critical update without protection) — 🟡 WARNING
**Applies to:** backend
**Triggers:** any repository/service loading a list with associations in {{MODULE_CIBLE}}; any loop that queries the DB per iteration; any update of a critical value ({{CRITICAL_FIELD_EXAMPLES}}: balance, counter, quota); any explicit lock or raw `UPDLOCK`/`FOR UPDATE`.

### Risk
N+1 on {{TABLE}} with {{ASSOCIATED_TABLES}} → {{N_PLUS_ONE_QUERIES}} queries per call → connection pool saturated → cascading timeouts → P99 SLO breached.
Read-modify-write in two statements on `{{CRITICAL_FIELD}}` → **lost update**: two concurrent writes read the same value → accounting gap that cannot be justified.

### Rules
**Anti N+1:**
- List with associations → one query: `Select` projection (preferred) or `Include` (+ `AsSplitQuery()` for multiple collections to avoid cartesian explosion). Never `FindAsync` in a loop.
- Read-only queries → `AsNoTracking()` (or `UseQueryTrackingBehavior(NoTracking)` by default for read models).
- **No lazy-loading proxies** (`UseLazyLoadingProxies` banned).
- Unbounded `ToListAsync()` → BLOCKER: **keyset pagination** mandatory.
- Keyset: `WHERE (SortField, Id) > (@last, @lastId) ORDER BY SortField, Id LIMIT n` — no deep `Skip()`.
- DTO projection (useful columns only) — never load full entities with heavy columns for a list.

**Concurrent writes:**
- Update of `{{CRITICAL_FIELD}}` → **optimistic by default**: concurrency token (SQL Server `rowversion`, PostgreSQL `xmin`, **Oracle: explicit version column** — see matrix) + handled `DbUpdateConcurrencyException`.
- Decrement of a scarce resource → **atomic statement**: `ExecuteUpdateAsync` with the guard in the `WHERE` (EF Core 7+).
- Pessimistic lock (`UPDLOCK`/`FOR UPDATE`): short transaction + lock timeout, released in ms.
- Never read-modify-write in two steps outside a transaction with proper isolation.

### Anti-pattern
```csharp
// ❌ BLOCKER — N+1
var items = await db.{{ENTITY}}s.ToListAsync(ct);                       // also unbounded
foreach (var item in items)
    item.Assoc = await db.Assocs.FindAsync(item.AssocId);               // +N queries

// ❌ BLOCKER — lost update on {{CRITICAL_FIELD}}
var e = await db.Accounts.FindAsync(id);
e.Balance -= delta;
await db.SaveChangesAsync(ct);                                          // no token, no atomic guard

// ❌ BLOCKER — concurrency exception → silent 500
await db.SaveChangesAsync(ct);                                          // DbUpdateConcurrencyException unhandled

// ❌ WARNING — deep offset pagination
db.Payments.OrderBy(p => p.CreatedAt).Skip(page * size).Take(size);    // O(offset)
```

### Compliant pattern
```csharp
// ✅ One query, projection, no tracking, bounded
var page = await db.{{ENTITY}}s.AsNoTracking()
    .Where(e => e.{{FILTER_FIELD}} == value)
    .OrderBy(e => e.CreatedAt).ThenBy(e => e.Id)
    .Where(e => lastCreatedAt == null
             || e.CreatedAt > lastCreatedAt
             || (e.CreatedAt == lastCreatedAt && e.Id > lastId))        // keyset
    .Select(e => new {{DTO}}(e.Id, e.Reference, e.Amount, e.Assoc.Name)) // join in SQL, 1 query
    .Take(pageSize)
    .ToListAsync(ct);

// ✅ Include with split query for several collections
db.Orders.Include(o => o.Lines).Include(o => o.Payments).AsSplitQuery();

// ✅ Atomic decrement — no lost update, no read first (EF Core 7+)
var rows = await db.Accounts
    .Where(a => a.Id == id && a.{{CRITICAL_FIELD}} >= delta)
    .ExecuteUpdateAsync(s => s.SetProperty(a => a.{{CRITICAL_FIELD}}, a => a.{{CRITICAL_FIELD}} - delta), ct);
if (rows == 0) throw new InsufficientFundsException(id);                // 0 = insufficient; 1 = success

// ✅ Concurrency token + handled exception
public sealed class {{ENTITY}} { [Timestamp] public byte[] RowVersion { get; set; } = default!; }   // SQL Server
// PostgreSQL: map the xmin system column as the concurrency token (see Npgsql docs for your version)
// Oracle: public int Version { get; set; }  + builder.Property(e => e.Version).IsConcurrencyToken();  (increment in SaveChanges override / interceptor)

try { await db.SaveChangesAsync(ct); }
catch (DbUpdateConcurrencyException)
{
    throw new ConflictException("{{CONFLICT_MESSAGE}}");                // → 409 ProblemDetails (A-03), or bounded reload+retry
}
```

### CI/CD checklist
- [ ] Endpoint `{{LIST_ENDPOINT}}` → SQL log / `DbCommandInterceptor` counter in integration test → 1 query (not 1+N)
- [ ] `grep -rn "UseLazyLoadingProxies" src/` → 0
- [ ] `grep -rEn "ToListAsync\(\)" src/ | grep -v "Take("` → reviewed (no unbounded list)
- [ ] Concurrent test (2 tasks update `{{CRITICAL_FIELD}}`) → 1 success, 1 refusal (0 lost update)
- [ ] Pagination test: page {{DEEP_PAGE}} → stable time < {{PAGE_LATENCY}} ms (no `Skip`)

---

## D-02 — {{ANALYTICS_DB}}: analytical queries & column-oriented modelling
**Severity:** 🟡 WARNING (row-oriented query / unfiltered scan)
**Applies to:** backend
**Triggers:** any {{ANALYTICS_DB}} query for reports/analytics in {{MODULE_CIBLE}}; any INSERT to {{ANALYTICS_DB}} from a real-time flow; any join or UPDATE/DELETE on {{ANALYTICS_DB}}.

### Risk
A row-oriented query on {{ANALYTICS_DB}} (UPDATE, DELETE, `SELECT *`) over {{DATA_VOLUME}} → full scan, I/O saturation, impact on critical reports.
Row-by-row INSERT → fragmentation (too many parts) → progressive read degradation.

### Rules
- {{ANALYTICS_DB}} = OLAP, analytical reads only — never transactional reads (use {{TRANSACTIONAL_DB}}).
- `SELECT` → explicit columns (never `SELECT *`), filter on index/partition columns.
- `INSERT` → by **batch** (≥ `{{BATCH_SIZE}}` rows or ≥ `{{BATCH_INTERVAL}}`) — never row by row. In .NET: a `Channel<T>` + `BackgroundService` batcher + the driver's bulk API.
- No frequent `UPDATE`/`DELETE` → design append-only + versioning/partitioning.
- Partitioning by `{{PARTITION_FIELD}}` (e.g. month, region) for large tables.
- EF Core is **not** the tool for analytics writes: use the engine's native client (e.g. `ClickHouse.Client`) or Dapper with explicit SQL.

### Anti-pattern
```sql
-- ❌ WARNING — SELECT * on {{ANALYTICS_DB}}
SELECT * FROM {{ANALYTICS_TABLE}} WHERE {{FILTER_FIELD}} = '{{FILTER_VALUE}}';
-- ❌ WARNING — frequent UPDATE (costly mutation)
UPDATE {{ANALYTICS_TABLE}} SET status = '{{NEW_STATUS}}' WHERE id = :id;
```
```csharp
// ❌ WARNING — INSERT row by row
foreach (var evt in events) await analytics.ExecuteAsync("INSERT INTO {{ANALYTICS_TABLE}} VALUES (...)", evt);
```

### Compliant pattern
```sql
-- ✅ Useful columns + partition filter
SELECT {{GROUP_BY_FIELD}}, SUM({{METRIC_FIELD}}) AS total, COUNT(*) AS count
FROM {{ANALYTICS_TABLE}}
WHERE {{PARTITION_FIELD}} = {{PARTITION_VALUE}} AND {{FILTER_FIELD}} = '{{FILTER_VALUE}}'
GROUP BY {{GROUP_BY_FIELD}} ORDER BY {{GROUP_BY_FIELD}};

-- ✅ Append-only + versioning instead of UPDATE (ClickHouse example)
CREATE TABLE {{ANALYTICS_TABLE}} (id UUID, status String, version UInt32, {{TIMESTAMP_FIELD}} DateTime)
ENGINE = {{ANALYTICS_ENGINE}}(version)           -- e.g. ReplacingMergeTree
PARTITION BY {{PARTITION_EXPRESSION}} ORDER BY ({{SORT_FIELDS}});
```
```csharp
// ✅ Batching background service — flush on size OR time
public sealed class AnalyticsBatcher(Channel<{{EVENT_TYPE}}> channel, IAnalyticsWriter writer) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stop)
    {
        var batch = new List<{{EVENT_TYPE}}>({{BATCH_SIZE}});
        while (!stop.IsCancellationRequested)
        {
            using var window = CancellationTokenSource.CreateLinkedTokenSource(stop);
            window.CancelAfter({{BATCH_INTERVAL_MS}});
            try { while (batch.Count < {{BATCH_SIZE}}) batch.Add(await channel.Reader.ReadAsync(window.Token)); }
            catch (OperationCanceledException) when (!stop.IsCancellationRequested) { /* time window elapsed */ }
            catch (OperationCanceledException) { break; }

            if (batch.Count > 0) { await writer.InsertBatchAsync("{{ANALYTICS_TABLE}}", batch, CancellationToken.None); batch.Clear(); }
        }
        if (batch.Count > 0) await writer.InsertBatchAsync("{{ANALYTICS_TABLE}}", batch, CancellationToken.None); // final flush
    }
}
// Writer: ClickHouseBulkCopy { DestinationTableName = "{{ANALYTICS_TABLE}}", BatchSize = {{BATCH_SIZE}} }.WriteToServerAsync(rows)
```

### CI/CD checklist
- [ ] `grep -rEn "SELECT \*" src/ | grep -i "{{ANALYTICS_DB_KEYWORD}}"` → 0
- [ ] INSERT into {{ANALYTICS_TABLE}} → verify batch size ≥ {{BATCH_SIZE}} rows
- [ ] No `UPDATE`/`DELETE` in scheduled analytical queries
- [ ] Test: report over {{DATA_VOLUME}} → < {{MAX_QUERY_TIME}} s (partition-filtered)

---

## D-03 — Zero-downtime migrations: DB schema & backward compatibility
**Severity:** 🔴 BLOCKER (migration that breaks the production version during rollout)
**Applies to:** backend
**Triggers:** any migration that renames/drops a column, changes a type or adds a `NOT NULL` constraint; any `RenameColumn`, `DropColumn`, `AlterColumn`, raw `ALTER TABLE` in {{MODULE_CIBLE}}; any rolling-update deployment with a schema change.

### Risk
Rolling update: for {{ROLLOUT_DURATION}} the old and new code versions run in parallel on the same schema.
A `RenameColumn` / `DropColumn` breaks the old version instantly → production errors before the rollout ends → incident.
**EF Core trap:** renaming a C# property makes `dotnet ef migrations add` scaffold a `RenameColumn` — a breaking change if you don't edit it.

### Rules
**Expand-contract (always):**
1. **Expand** (migration N): add the new column (nullable or with default), backfill (in batches on big tables); new code writes to **both** columns.
2. **Contract** (migration N+1, next sprint): once the old version is out of production, drop/rename the old column.

**Specific rules:**
- Never `NOT NULL` without `DEFAULT` on an existing column (long table lock on large volumes).
- `AddColumn` → nullable or with default.
- `DropColumn` → only after 100 % of traffic runs the new version.
- Indexes → online: PostgreSQL `CREATE INDEX CONCURRENTLY` (migration with `suppressTransaction: true`); SQL Server `WITH (ONLINE = ON)` / `IsCreatedOnline()` (Enterprise / Azure SQL); Oracle `CREATE INDEX ... ONLINE`.
- Oracle: DDL is non-transactional → one logical change per migration, written to be re-runnable.
- Never edit an already-applied migration; never delete migration files.
- Deployment: run migrations as a **separate pipeline step** (`dotnet ef migrations bundle` or an idempotent script) — **not** `Database.Migrate()` at startup of N replicas (race, and the app needs DDL rights).
- Always review the generated migration code **and** SQL (`dotnet ef migrations script`).

### Anti-pattern
```csharp
// ❌ BLOCKER — scaffolded rename: breaks the old version immediately
migrationBuilder.RenameColumn(name: "{{OLD_COLUMN}}", table: "{{TABLE}}", newName: "{{NEW_COLUMN}}");

// ❌ BLOCKER — NOT NULL without default (long lock)
migrationBuilder.AddColumn<string>("{{NEW_COLUMN}}", "{{TABLE}}", nullable: false);

// ❌ BLOCKER — blocking index (PostgreSQL)
migrationBuilder.CreateIndex("IX_{{TABLE}}_{{COLUMN}}", "{{TABLE}}", "{{COLUMN}}");
```

### Compliant pattern
```csharp
// ✅ Migration N — EXPAND
public partial class Add{{NEW_COLUMN}}To{{TABLE}} : Migration
{
    protected override void Up(MigrationBuilder mb)
    {
        mb.AddColumn<string>("{{NEW_COLUMN}}", "{{TABLE}}", nullable: true);
        mb.Sql("UPDATE {{TABLE}} SET {{NEW_COLUMN}} = {{OLD_COLUMN}} WHERE {{NEW_COLUMN}} IS NULL;"); // batch it on large tables
        // code version N+1 writes both columns
    }
    protected override void Down(MigrationBuilder mb) => mb.DropColumn("{{NEW_COLUMN}}", "{{TABLE}}");
}

// ✅ Migration N+1 — CONTRACT (next sprint, old version out of prod)
mb.DropColumn("{{OLD_COLUMN}}", "{{TABLE}}");

// ✅ NOT NULL with default — no long lock
mb.AddColumn<string>("{{NEW_COLUMN}}", "{{TABLE}}", nullable: false, defaultValue: "{{DEFAULT_VALUE}}");

// ✅ Non-blocking index — PostgreSQL
mb.Sql("CREATE INDEX CONCURRENTLY IX_{{TABLE}}_{{COLUMN}} ON {{TABLE}} ({{COLUMN}});", suppressTransaction: true);
// ✅ SQL Server: modelBuilder.Entity<{{ENTITY}}>().HasIndex(e => e.{{COLUMN}}).IsCreatedOnline();
// ✅ Oracle:     mb.Sql("CREATE INDEX IX_{{TABLE}}_{{COLUMN}} ON {{TABLE}} ({{COLUMN}}) ONLINE");
```
```bash
# ✅ Deployment — migrations out of the app startup
dotnet ef migrations script --idempotent --project src/{{MODULE_CIBLE}}.Infrastructure -o migrate.sql
# or: dotnet ef migrations bundle --self-contained -o efbundle
```
```
migrations/
  {{TIMESTAMP}}_Add{{NEW_COLUMN}}To{{TABLE}}.cs       (expand)
  {{TIMESTAMP_NEXT_SPRINT}}_Drop{{OLD_COLUMN}}From{{TABLE}}.cs   (contract)
```

### CI/CD checklist
- [ ] Every migration tested in staging with the **previous version** of the code (rolling-update simulation)
- [ ] `grep -rEn "RenameColumn|DropColumn|AlterColumn|RenameTable" Migrations/` → mandatory manual review (previous sprint OK?)
- [ ] `grep -rn "nullable: false" Migrations/ | grep -v "defaultValue"` → 0 on `AddColumn`
- [ ] Indexes: `CONCURRENTLY` / `ONLINE` on every table > {{MIN_TABLE_SIZE}} rows
- [ ] `grep -rn "Database.Migrate()\|MigrateAsync()" src/` → 0 in production startup path
- [ ] Rollback tested: previous version starts without error

---

## D-04 — Connection pool & resource leak
**Severity:** 🔴 BLOCKER (undisposed connection/stream) — 🟡 WARNING (mis-sized pool)
**Applies to:** backend
**Triggers:** any code opening a DB connection, file, stream or network resource; any pool configuration in {{MODULE_CIBLE}} ({{CONNECTION_POOL_LIB}}: ADO.NET/Npgsql/SqlClient pool, `AddDbContextPool`); analyzers CA2000 / CA2213 / S2930 (IDisposable not disposed).

### Risk
A connection not disposed in a catch path → silent leak → pool drains progressively → cascading timeouts on every endpoint of {{MODULE_CIBLE}} → P1.
Under-sized pool → connection queue → P99 latency explodes under load.

### Rules
- Every `IDisposable`/`IAsyncDisposable` (`DbConnection`, `DbCommand`, `DbDataReader`, `Stream`, `HttpResponseMessage`, `Channel`) → `using` / `await using`.
- No manual `.Dispose()`/`.Close()` in a separate `finally` (forgotten on exception paths).
- `DbContext`: scoped lifetime (one per request/unit of work); never a singleton; `IDbContextFactory` in background services.
- `HttpClient` → `IHttpClientFactory` only (rule B-03).
- Pool settings: `Maximum Pool Size = {{POOL_SIZE_FORMULA}}` (tuned by benchmark; remember **pods × pool ≤ DB max connections**); `Connection Timeout` / `Timeout` ≤ {{CONNECTION_TIMEOUT}} on an endpoint with a defined SLO; explicit `Command Timeout`.
- Never a network/message call **inside** an open DB transaction (lock held for the duration of the call).
- Leak detection: expose pool metrics (`Npgsql`/`Microsoft.Data.SqlClient` meters via OpenTelemetry) and alert on a monotonic rise of active connections; enable analyzers as errors.
- Transient-fault retry for DB (`EnableRetryOnFailure`) wraps the **whole** transaction via `CreateExecutionStrategy()`.

### Anti-pattern
```csharp
// ❌ BLOCKER — leak if an exception occurs
var conn = new SqlConnection(cs);
await conn.OpenAsync(ct);
var cmd = conn.CreateCommand();
var reader = await cmd.ExecuteReaderAsync(ct);
// exception while reading → conn never disposed → pool leak

// ❌ WARNING — network call inside a transaction
await using var tx = await db.Database.BeginTransactionAsync(ct);
var e = await db.{{ENTITY}}s.FindAsync(id);                      // connection + lock
var r = await _externalClient.CallAsync(e, ct);                  // {{EXTERNAL_TIMEOUT}} → lock held for the whole call
e.Result = r.Value; await db.SaveChangesAsync(ct); await tx.CommitAsync(ct);
```

### Compliant pattern
```csharp
// ✅ await using — disposal guaranteed even on exception
await using var conn = new NpgsqlConnection(_cs);
await conn.OpenAsync(ct);
await using var cmd = new NpgsqlCommand(sql, conn);
await using var reader = await cmd.ExecuteReaderAsync(ct);
while (await reader.ReadAsync(ct)) { /* process */ }

// ✅ Network call OUTSIDE the transaction — short transaction
public async Task<{{RESULT}}> ProcessAsync({{ID}} id, CancellationToken ct)
{
    var e = await _db.{{ENTITY}}s.AsNoTracking().SingleAsync(x => x.Id == id, ct);   // read, no long transaction
    var r = await _externalClient.CallAsync(e, ct);                                  // network, no lock held
    return await PersistResultAsync(id, r, ct);                                      // short transaction
}

private Task<{{RESULT}}> PersistResultAsync({{ID}} id, {{RESPONSE}} r, CancellationToken ct)
{
    var strategy = _db.Database.CreateExecutionStrategy();                           // retry wraps the whole unit
    return strategy.ExecuteAsync(async () =>
    {
        await using var tx = await _db.Database.BeginTransactionAsync(ct);
        var e = await _db.{{ENTITY}}s.SingleAsync(x => x.Id == id, ct);
        e.SetResult(r.Value);
        await _db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        return _mapper.ToResult(e);
    });
}
```
```json
// ✅ Connection string — pool dimensioned (PostgreSQL / SQL Server / Oracle) — values from {{SECRET_STORE}}/env, rule S-04
"Host=...;Database=...;Maximum Pool Size={{MAX_POOL_SIZE}};Minimum Pool Size={{MIN_IDLE}};Timeout={{CONNECTION_TIMEOUT_S}};Command Timeout={{COMMAND_TIMEOUT_S}}"   // PostgreSQL
// SQL Server: "...;Max Pool Size={{MAX_POOL_SIZE}};Min Pool Size={{MIN_IDLE}};Connect Timeout={{CONNECTION_TIMEOUT_S}}"  (+ CommandTimeout in EF options)
// Oracle:     "...;Pooling=true;Max Pool Size={{MAX_POOL_SIZE}};Min Pool Size={{MIN_IDLE}};Connection Timeout={{CONNECTION_TIMEOUT_S}}"
```
```csharp
builder.Services.AddDbContextPool<AppDbContext>(o => o.UseNpgsql(cs, n => n.EnableRetryOnFailure()), poolSize: {{DBCONTEXT_POOL_SIZE}});
// UseSqlServer(cs, n => n.EnableRetryOnFailure())  |  UseOracle(cs)   (check the Oracle provider's retry support for your version)
```

### CI/CD checklist
- [ ] Analyzers CA2000, CA2213, CA2007 (libs), Sonar S2930 → 0 open issue on DB-access classes of {{MODULE_CIBLE}}
- [ ] `grep -rEn "new (Sql|Npgsql)Connection\(" src/ | grep -v "using"` → 0
- [ ] Load test {{LOAD_DURATION}}: pool active-connections metric does not climb indefinitely
- [ ] Staging: pool exhaustion / leak alert → 0
- [ ] Test: DB down → endpoint answers in < {{TIMEOUT_RESPONSE}} ms with structured 503 (A-03)
- [ ] `pods × Maximum Pool Size` ≤ DB `max_connections` (documented)
