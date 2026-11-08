# BLOCK B — BACKEND / RESILIENCE (B-01 → B-07) — .NET edition

---

## B-01 — Money safety: `decimal`, comparison & rounding
**Severity:** 🔴 BLOCKER absolute
**Applies to:** backend (+ frontend for amount transport)
**Triggers:** any amount computation in {{MODULE_CIBLE}} (fee, total, balance, refund); `float`/`double`/`int` fields carrying a financial amount; conversions from `double` to `decimal`; any `Math.Round` call.

### Risk
`float` and `double` are binary approximations: `0.1 + 0.2 ≠ 0.3` in IEEE 754. On {{TRANSACTION_VOLUME}} × {{UNIT_AMOUNT}} → cumulated accounting gap that cannot be justified at audit.
**.NET differences vs Java `BigDecimal`:** `decimal` compares by value (`10.50m == 10.5m` is `true`, so the Java `.equals()` trap does not exist) — but the **default `Math.Round` is banker's rounding (HALF_EVEN)**, and `(decimal)10.1` goes through a `double` and can silently lose exactness.

### Rules
- Every financial amount in {{MODULE_CIBLE}} → `decimal`, ideally wrapped in a `Money(decimal Amount, string Currency)` value object.
- `float`/`double` on an amount → immediate BLOCKER. Integer minor units (`long` cents) are allowed **only** if it is the documented design for the whole bounded context.
- Rounding → **always** explicit `MidpointRounding`:
  - General rule: `MidpointRounding.AwayFromZero` (= HALF_UP). Fiscal calculations: `MidpointRounding.ToEven` (= HALF_EVEN), when the regulation requires it.
- Scale per currency (ISO 4217): **TND/KWD/BHD = 3 decimals**, EUR/USD = 2, JPY = 0 — never hard-code `2`.
- Creation: literal `10.50m`, or `decimal.Parse(s, NumberStyles.Number, CultureInfo.InvariantCulture)` — never `(decimal)doubleValue`, `new decimal(double)`, `Convert.ToDecimal(double)`.
- Comparison: `==`, `CompareTo` or `<`/`>` are fine on `decimal`. Never compare amounts of **different currencies**.
- DTO: `decimal` + validation (`[Range(typeof(decimal), "0.01", "...")]`, rule S-06).
- JSON/DB: SQL `decimal(18,3)` explicit precision (EF Core `HasPrecision`) — never rely on the default.
- **Angular/TypeScript:** JS `number` is a `double`. Amounts travel as **strings** (`"10.500"`) or integer minor units; no arithmetic on amounts in the browser (display only; use `decimal.js`/`big.js` if a client-side computation is unavoidable).

### Anti-pattern
```csharp
// ❌ BLOCKER — double on an amount
double total = 0.1 + 0.2;                    // 0.30000000000000004

// ❌ BLOCKER — double → decimal conversion
decimal amount = (decimal)10.1;              // goes through a double
decimal amount2 = Convert.ToDecimal(10.1d);

// ❌ BLOCKER — implicit rounding mode (banker's rounding by default!)
decimal fee = Math.Round(amount * rate, 2);  // 0.125 → 0.12, not 0.13

// ❌ BLOCKER — hard-coded scale
decimal fee2 = Math.Round(amount * rate, 2, MidpointRounding.AwayFromZero); // wrong for TND (3 decimals)
```

### Compliant pattern
```csharp
// ✅ Money value object — currency-aware, explicit rounding
public readonly record struct Money(decimal Amount, string Currency)
{
    public static Money Of(string amount, string currency) =>
        new(decimal.Parse(amount, NumberStyles.Number, CultureInfo.InvariantCulture), currency);

    public Money Multiply(decimal rate, int scale, MidpointRounding mode = MidpointRounding.AwayFromZero) =>
        this with { Amount = Math.Round(Amount * rate, scale, mode) };

    public Money Add(Money other) =>
        other.Currency == Currency ? this with { Amount = Amount + other.Amount }
                                   : throw new CurrencyMismatchException(Currency, other.Currency);
}

// ✅ Calculation with explicit scale (from the currency table) and mode
var fee = amount.Multiply(feeRate, CurrencyCatalog.MinorUnits(amount.Currency));

// ✅ Comparison
if (refund.Amount > original.Amount) throw new BusinessRuleException("{{REFUND_EXCEEDS_ORIGINAL_MESSAGE}}");

// ✅ EF Core precision
builder.Property(p => p.Amount).HasPrecision(18, 3);

// ✅ DTO
public sealed record {{COMMAND}}(
    [property: Range(typeof(decimal), "0.01", "1000000000")] decimal Amount,
    [property: Required, StringLength(3, MinimumLength = 3)] string Currency);
```
```typescript
// ✅ Angular — amounts as strings in the API contract, never computed in the browser
export interface PaymentDto { amount: string; currency: string; }   // "10.500" TND
```

### CI/CD checklist
- [ ] `grep -rEn "\b(double|float)\b" src/ | grep -iE "amount|fee|balance|total|price"` → 0
- [ ] `grep -rEn "\(decimal\)[0-9.]+[^m]|Convert\.ToDecimal\(.*[0-9]d\)|new decimal\(.*d\)" src/` → 0
- [ ] `grep -rn "Math.Round(" src/ | grep -v "MidpointRounding"` → 0
- [ ] Analyzer: ban `Math.Round(decimal,int)` overload via `BannedApiAnalyzers` (`BannedSymbols.txt`)
- [ ] Mutation test (Stryker.NET): comparison `>` → mutant `>=` killed by an exact-boundary test
- [ ] Test with TND (3 decimals), EUR (2), JPY (0)

---

## B-02 — Idempotency of effectful operations
**Severity:** 🔴 BLOCKER absolute
**Applies to:** backend
**Triggers:** any effectful POST ({{OPERATION_TYPES}}: creation, state change, sending); any message handler processing an effectful event in {{MODULE_CIBLE}}.

### Risk
Without idempotency: a network retry, a double submit or a message double-delivery = double effect.
The only reliable protection: check whether the operation was **already** executed **before** executing it — and make that check **race-free** (a unique index, not an `if`).

### Rules
- Every effectful POST endpoint → header `{{IDEMPOTENCY_HEADER}}` mandatory (client UUID v4).
- Before any effect: lookup `{{IDEMPOTENCY_TABLE}} WHERE Key = @key AND Scope = @scope`.
  - Found → return **exactly** the stored result (no 2nd execution). Same key + **different request hash** → `422`.
  - Absent → execute + persist (key, scope, request hash, result, expiry) in the **same transaction**.
- **Unique index on `(Key, Scope)`** is the real guard: two concurrent identical requests must not both execute.
- Retry → **same** `{{IDEMPOTENCY_HEADER}}` as the original attempt — never a new key.
- Message consumer → idempotency key = stable message id (outbox id / event id).
- Blind spot: if the effect includes an **external network call**, a single DB transaction is not enough (and forbidden by D-04) → use an `InProgress` status row + recovery job.

### Anti-pattern
```csharp
// ❌ BLOCKER — effectful POST without key: replayable = double effect
app.MapPost("/{{ENDPOINT}}", (CreateCommand cmd, IService svc) => svc.ExecuteAsync(cmd));

// ❌ BLOCKER — retry with a new key
for (var i = 0; i < 3; i++)
    await client.PostAsync(cmd with { IdempotencyKey = Guid.NewGuid() }); // new key = new effect

// ❌ BLOCKER — check-then-act race (two requests both pass the check)
if (!await db.Idempotency.AnyAsync(x => x.Key == key)) { await ExecuteAsync(); db.Idempotency.Add(...); }
```

### Compliant pattern
```csharp
// ✅ Entity with unique index
public sealed class IdempotencyRecord
{
    public required Guid Key { get; init; }
    public required string Scope { get; init; }
    public required string RequestHash { get; init; }
    public string? ResultJson { get; set; }
    public int StatusCode { get; set; }
    public DateTimeOffset ExpiresAt { get; init; }
}
modelBuilder.Entity<IdempotencyRecord>().HasIndex(x => new { x.Key, x.Scope }).IsUnique();

// ✅ Service — same transaction for key + effect + result
public async Task<IResult> ExecuteOnceAsync(Guid key, string scope, string requestHash,
                                            Func<CancellationToken, Task<(int Status, object Body)>> effect, CancellationToken ct)
{
    await using var tx = await _db.Database.BeginTransactionAsync(ct);
    var record = new IdempotencyRecord { Key = key, Scope = scope, RequestHash = requestHash,
                                         ExpiresAt = _clock.GetUtcNow().AddHours(24) };
    try
    {
        _db.IdempotencyRecords.Add(record);
        await _db.SaveChangesAsync(ct);                       // concurrent duplicate fails (or waits) here
        var (status, body) = await effect(ct);                // DB-local effect only (see D-04)
        record.StatusCode = status; record.ResultJson = JsonSerializer.Serialize(body);
        await _db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        return Results.Json(body, statusCode: status);
    }
    catch (DbUpdateException ex) when (ex.IsUniqueViolation())  // helper per provider: SQL Server 2627/2601 · PostgreSQL 23505 · Oracle ORA-00001
    {
        var stored = await _readOnlyDb.IdempotencyRecords.AsNoTracking()
                         .SingleAsync(x => x.Key == key && x.Scope == scope, ct);
        return stored.RequestHash == requestHash
            ? Results.Text(stored.ResultJson!, "application/json", statusCode: stored.StatusCode)   // identical replay
            : Results.Problem(statusCode: 422, title: "Idempotency key reused with a different request");
    }
}

// ✅ Endpoint — header mandatory
app.MapPost("/{{ENDPOINT}}", async ([FromHeader(Name = "{{IDEMPOTENCY_HEADER}}")] Guid key, {{COMMAND}} cmd, IIdempotentExecutor exec, CancellationToken ct)
    => await exec.ExecuteOnceAsync(key, "{{SCOPE}}", Hash(cmd), c => handler.HandleAsync(cmd, c), ct));

// ✅ Client retry — SAME key, generated once
var originalKey = Guid.NewGuid();
using var req = new HttpRequestMessage(HttpMethod.Post, url) { Content = JsonContent.Create(cmd) };
req.Headers.Add("{{IDEMPOTENCY_HEADER}}", originalKey.ToString());   // the resilience pipeline (B-03) re-sends this same message
```

### CI/CD checklist
- [ ] Every effectful `MapPost`/`[HttpPost]` → `{{IDEMPOTENCY_HEADER}}` parameter present
- [ ] Test: same key sent twice → identical response, exactly 1 DB row
- [ ] Test: 2 **concurrent** requests with the same key → 1 effect
- [ ] Test: replayed consumer message → 1 effect
- [ ] Unique index on `(Key, Scope)` in `{{IDEMPOTENCY_TABLE}}` (migration reviewed)

---

## B-03 — Resilience: Timeout + Circuit Breaker + Retry + Fallback
**Severity:** 🔴 BLOCKER (external call without timeout/CB) — 🟡 WARNING (naïve retry)
**Applies to:** backend
**Triggers:** any synchronous call to an external service from {{MODULE_CIBLE}}: {{EXTERNAL_SERVICES}}; any retry loop or retry policy; any effectful operation retried without idempotency key.

### Risk
No timeout: a slow external service = blocked requests → thread/connection starvation → cascade on every endpoint of {{MODULE_CIBLE}}.
No jitter: N instances retrying simultaneously = retry storm → prolonged outage.
Effectful retry without the same `{{IDEMPOTENCY_HEADER}}` = guaranteed double effect.
`new HttpClient()` per call = socket exhaustion.

### Rules
**Pipeline (Polly v8 via `Microsoft.Extensions.Http.Resilience`) — per dependency:**
- Order (outer → inner): total timeout → retry → circuit breaker → per-attempt timeout.
- Explicit timeouts: connect ≤ {{CONNECT_TIMEOUT}}, per-attempt ≤ remaining SLO budget.
- Circuit breaker: sampling window {{CB_WINDOW}}, failure ratio {{CB_THRESHOLD}}, break duration {{CB_DELAY}}, min throughput set.
- Effectful fallback → persist an intermediate state + reconciliation event — never a silent failure.
- Non-critical fallback → degraded value (cache/empty) + alert log.

**Retry — single policy:**
- Base {{RETRY_BASE}}, exponential factor, **jitter on**, `MaxRetryAttempts = {{RETRY_MAX}}`, capped delay.
- Effectful retry → **same** idempotency key (rule B-02). Unsafe HTTP methods: retry **disabled** unless the call carries the key.
- No retry when the circuit is open (`BrokenCircuitException` is not retried by default — keep it that way).
- `IHttpClientFactory` / typed clients only.

### Anti-pattern
```csharp
// ❌ BLOCKER — new HttpClient, no timeout/CB
var result = await new HttpClient().PostAsJsonAsync("{{EXTERNAL_URL}}", request);   // can wait 100 s (default), socket leak

// ❌ BLOCKER — naïve retry
for (var i = 0; i < 10; i++)
{
    await Task.Delay(1000);                // fixed → storm
    await client.PostAsJsonAsync(url, request);  // no idempotency → double effect
}
```

### Compliant pattern
```csharp
// ✅ Program.cs — typed client + explicit resilience pipeline
builder.Services.AddHttpClient<I{{EXTERNAL_CLIENT}}, {{EXTERNAL_CLIENT}}>(c =>
    {
        c.BaseAddress = new Uri(builder.Configuration["{{EXTERNAL_BASE_URL_KEY}}"]!);
    })
    .AddStandardResilienceHandler(o =>
    {
        o.TotalRequestTimeout.Timeout = TimeSpan.FromSeconds({{TOTAL_TIMEOUT_S}});
        o.AttemptTimeout.Timeout      = TimeSpan.FromSeconds({{READ_TIMEOUT_S}});

        o.Retry.MaxRetryAttempts = {{RETRY_MAX}};
        o.Retry.Delay            = TimeSpan.FromMilliseconds({{RETRY_BASE_MS}});
        o.Retry.BackoffType      = DelayBackoffType.Exponential;
        o.Retry.UseJitter        = true;                      // full jitter
        o.Retry.DisableForUnsafeHttpMethods();                // POST/PUT/DELETE not retried by default…
        // …enable it only on a dedicated client whose calls ALWAYS carry the idempotency key

        o.CircuitBreaker.SamplingDuration   = TimeSpan.FromSeconds({{CB_WINDOW_S}});
        o.CircuitBreaker.FailureRatio       = {{CB_THRESHOLD_RATIO}};   // e.g. 0.5
        o.CircuitBreaker.MinimumThroughput  = {{CB_MIN_THROUGHPUT}};
        o.CircuitBreaker.BreakDuration      = TimeSpan.FromSeconds({{CB_DELAY_S}});
    });

// ✅ Fallback in the application service — intermediate state + reconciliation
public async Task<{{SERVICE_RESPONSE}}> CallAsync({{REQUEST}} req, CancellationToken ct)
{
    try
    {
        return await _client.ExecuteAsync(req, ct);                // idempotency key already set on the message
    }
    catch (Exception ex) when (ex is BrokenCircuitException or TimeoutRejectedException or HttpRequestException)
    {
        await _repository.UpdateStatusAsync(req.Id, Status.Pending, ct);
        await _outbox.EnqueueAsync(new {{RETRY_EVENT}}(req.Id, req.IdempotencyKey), ct);   // reconciliation (B-06)
        return {{SERVICE_RESPONSE}}.Pending(req.Id);
    }
}
```

### CI/CD checklist
- [ ] No `new HttpClient(` in `src/` (`grep -rn "new HttpClient(" src/` → 0); analyzer CA2000 / banned API
- [ ] Every client of {{EXTERNAL_SERVICES}} registered with a resilience handler
- [ ] Test: {{EXTERNAL_SERVICE}} cut for {{CB_DELAY}} → circuit opens < 1 s, 0 request blocked beyond the timeout, `PENDING` state persisted
- [ ] Test: failure × {{RETRY_MAX}} → exactly {{RETRY_MAX}} attempts, then intermediate state
- [ ] Test: recovery → decorrelated attempts (jitter), no synchronised spike
- [ ] Test: double call (same key) → 1 effect

---

## B-04 — Async & concurrency safety (replaces Java "Threads / Virtual Threads")
**Severity:** 🔴 BLOCKER (cancellation swallowed / sync-over-async / `async void`) — 🟡 WARNING
**Applies to:** backend
**Triggers:** blocking I/O, `lock`, `Task.Run`, `Thread.Sleep`, `.Result`/`.Wait()`; any `catch` around `OperationCanceledException`; any shared mutable state between requests/threads; `async void`.

### Risk
`OperationCanceledException` swallowed by a generic `catch` → work continues after shutdown / request abort → duplicate processing on restart.
`.Result` / `.Wait()` on a request path → thread-pool starvation under load (the .NET equivalent of pinning).
`async void` → unhandled exceptions crash the process, cannot be awaited.
A `lock` cannot contain an `await` → devs add blocking waits inside it.

### Rules
- Every async method accepts and **forwards** a `CancellationToken` (analyzer CA2016).
- `OperationCanceledException`: never swallowed by `catch (Exception)`. In background services catch it **only** `when (stoppingToken.IsCancellationRequested)` and return cleanly; otherwise rethrow.
- Async all the way: no `.Result`, `.Wait()`, `.GetAwaiter().GetResult()` outside `Main`/tests.
- No `async void` except UI/event handlers. No fire-and-forget `Task.Run` in request paths — use a queue/`Channel<T>` + `BackgroundService`.
- `Thread.Sleep` → `await Task.Delay(delay, ct)`.
- Mutual exclusion around async/I-O code → `SemaphoreSlim(1,1).WaitAsync(ct)` with `try/finally Release()`; `lock` only for short, non-I/O, non-await sections.
- Shared mutable state → `Interlocked`, `ConcurrentDictionary`, `ImmutableInterlocked`, or confine to one owner (`Channel<T>`).
- If `Monitor.Wait` is ever used → always inside a `while (!condition)` loop (spurious wake-ups).
- `ThreadStatic`/`AsyncLocal` → document the lifecycle; never rely on them across `Task.Run` without checking flow.
- Libraries: `ConfigureAwait(false)` (ASP.NET Core apps themselves don't need it).

### Anti-pattern
```csharp
// ❌ BLOCKER — cancellation swallowed
try { await Task.Delay(retryDelay, ct); }
catch (Exception e) { _logger.LogWarning("Interrupted"); }   // keeps processing after shutdown

// ❌ BLOCKER — sync-over-async
var payment = _client.GetPaymentAsync(id).Result;

// ❌ BLOCKER — async void
public async void OnMessage(Msg m) { await Process(m); }      // exception = process crash

// ❌ WARNING — lock around I/O, plus await impossible inside
lock (_gate) { _db.SaveChanges(); }
```

### Compliant pattern
```csharp
// ✅ Cancellation honoured — graceful shutdown respected
protected override async Task ExecuteAsync(CancellationToken stoppingToken)
{
    while (!stoppingToken.IsCancellationRequested)
    {
        try
        {
            await ProcessBatchAsync(stoppingToken);
            await Task.Delay(_interval, stoppingToken);
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            _logger.LogInformation("Stopping {{MODULE_CIBLE}} processing");
            return;                                           // clean exit
        }
    }
}

// ✅ Async mutual exclusion
private readonly SemaphoreSlim _gate = new(1, 1);
await _gate.WaitAsync(ct);
try { await _store.SaveAsync(item, ct); }
finally { _gate.Release(); }

// ✅ Atomic counter / concurrent map
private long _counter;  Interlocked.Increment(ref _counter);
private readonly ConcurrentDictionary<Guid, State> _states = new();

// ✅ Work hand-off instead of fire-and-forget
private readonly Channel<WorkItem> _queue = Channel.CreateBounded<WorkItem>(new BoundedChannelOptions({{QUEUE_CAPACITY}}) { FullMode = BoundedChannelFullMode.Wait });
```
```xml
<!-- ✅ Analyzers: Microsoft.VisualStudio.Threading.Analyzers + built-in CA rules -->
<!-- .editorconfig: dotnet_diagnostic.CA2016.severity = error ; dotnet_diagnostic.VSTHRD002.severity = error ; VSTHRD100 (async void) = error ; CA2007 (libraries) -->
```

### CI/CD checklist
- [ ] `grep -rEn "\.Result\b|\.Wait\(\)|GetAwaiter\(\)\.GetResult\(\)" src/` → 0 (outside Program/tests)
- [ ] `grep -rn "async void" src/` → 0 (event handlers documented)
- [ ] `grep -rn "catch (Exception" src/` → review: `OperationCanceledException` handled before / excluded
- [ ] Analyzers CA2016, VSTHRD002, VSTHRD100, S3168 (Sonar `async void`), S2930/CA2000 → clean
- [ ] `grep -rn "Thread.Sleep" src/` → 0
- [ ] Test: cancel token mid-processing → worker stops cleanly, state consistent

---

## B-05 — Messaging: guaranteed delivery, DLQ, outbox, domain events, encryption in transit
**Severity:** 🔴 BLOCKER (at-most-once effectful event / no DLQ / plaintext) — 🟡 WARNING
**Applies to:** backend
**Triggers:** any producer/consumer on {{MESSAGE_BROKER}} (Kafka, RabbitMQ, Azure Service Bus…); any synchronous inter-service call replaceable by a domain event; any topic/queue carrying sensitive flow ({{COMPLIANCE_STANDARD}}) without encryption.

### Risk
`{{DELIVERY_GUARANTEE}} = at-most-once` on an effectful topic: lost message = lost operation, no trace.
Dual write (DB commit + publish) without outbox: crash between the two = state saved but event lost, or the reverse.
Plaintext on a sensitive topic: violation of {{COMPLIANCE_STANDARD}}.
Synchronous HTTP between services: target down → whole transaction fails → temporal coupling.

### Rules
**Delivery & DLQ:**
- Effectful topic → `Acks.All` + `EnableIdempotence = true` (Kafka; equivalent on other brokers).
- Effectful consumer → **manual** commit/ack **after** the idempotent effect (rule B-02). `EnableAutoCommit = false`.
- Poison message → after N failures → Dead Letter `{{DLQ_TOPIC}}` + alert.
- Critical topics: `replication.factor = {{REPLICATION_FACTOR}}`, `min.insync.replicas = {{MIN_ISR}}`.
- **Transactional outbox**: the event is written to an `Outbox` table in the **same** `SaveChanges` as the state change; a publisher relays it. (Library option: MassTransit EF outbox / Wolverine / CAP — **check each library's current licence per rule S-01**.)

**Domain events:** a synchronous HTTP notification to another service → replace with a domain event (at-least-once + idempotent consumer).

**Encryption in transit:** sensitive topic → `SecurityProtocol.SaslSsl` (or `Ssl`) — never `Plaintext`. Credentials from {{SECRET_STORE}} (rule S-04).

### Anti-pattern
```csharp
// ❌ BLOCKER — default producer, no delivery guarantee
using var p = new ProducerBuilder<string, string>(new ProducerConfig { BootstrapServers = servers }).Build();
p.Produce("{{TOPIC}}", new Message<string, string> { Key = k, Value = v });  // fire and forget

// ❌ BLOCKER — auto-commit: offset committed before the effect
new ConsumerConfig { EnableAutoCommit = true, ... };

// ❌ BLOCKER — dual write
await _db.SaveChangesAsync(ct);
await _producer.ProduceAsync("{{TOPIC}}", msg, ct);     // crash here = event lost

// ❌ BLOCKER
new ProducerConfig { SecurityProtocol = SecurityProtocol.Plaintext };
```

### Compliant pattern
```csharp
// ✅ Producer for effectful topics
var producerConfig = new ProducerConfig
{
    BootstrapServers = _opts.Servers,
    Acks = Acks.All,
    EnableIdempotence = true,
    SecurityProtocol = SecurityProtocol.SaslSsl,
    SaslMechanism = SaslMechanism.Plain,
    SaslUsername = _opts.User, SaslPassword = _opts.Password      // from {{SECRET_STORE}}
};

// ✅ Outbox — same transaction as the state change
_db.Payments.Add(payment);
_db.Outbox.Add(OutboxMessage.From(new {{EVENT_NAME}}(payment.Id, cmd.IdempotencyKey), correlationId));
await _db.SaveChangesAsync(ct);                                   // atomic

// ✅ Consumer — manual commit AFTER the idempotent effect, DLQ for poison
protected override Task ExecuteAsync(CancellationToken stop) => Task.Run(async () =>
{
    using var consumer = new ConsumerBuilder<string, string>(_consumerConfig /* EnableAutoCommit = false */).Build();
    consumer.Subscribe("{{TOPIC}}");
    try
    {
        while (!stop.IsCancellationRequested)
        {
            var cr = consumer.Consume(stop);
            try
            {
                await using var scope = _sp.CreateAsyncScope();
                await scope.ServiceProvider.GetRequiredService<I{{EVENT}}Handler>().HandleAsync(cr, stop); // idempotent (B-02)
                consumer.Commit(cr);                                                                       // AFTER the effect
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                if (await _retryTracker.ExceededAsync(cr, {{MAX_DELIVERY}}))
                {
                    await _dlq.PublishAsync("{{DLQ_TOPIC}}", cr, ex, stop);     // + alert < 30 s
                    consumer.Commit(cr);
                }
                else { consumer.Seek(cr.TopicPartitionOffset); }                // redeliver
            }
        }
    }
    catch (OperationCanceledException) { /* shutdown */ }
    finally { consumer.Close(); }                                              // final offsets + clean leave
}, stop);
```

### CI/CD checklist
- [ ] `grep -rEn "SecurityProtocol\.Plaintext|PLAINTEXT" src/ config/` → 0 on sensitive topics
- [ ] `grep -rn "EnableAutoCommit\s*=\s*true" src/` → 0 on effectful consumers
- [ ] Test: kill consumer mid-processing → replay → 1 single effect (at-least-once + idempotency)
- [ ] Test: poison message → `{{DLQ_TOPIC}}` + alert < 30 s
- [ ] Test: crash between `SaveChanges` and publish → event still published (outbox)
- [ ] Test: connection without TLS → rejected
- [ ] Effectful topics: replication.factor = {{REPLICATION_FACTOR}}, min.insync.replicas = {{MIN_ISR}}

---

## B-06 — Saga: distributed transactions without 2PC
**Severity:** 🔴 BLOCKER (2PC / distributed transaction between services)
**Applies to:** backend
**Triggers:** any multi-service flow needing transactional consistency in {{MODULE_CIBLE}}; any `TransactionScope` / MSDTC / `SaveChanges` spanning several services or databases; any business state without an explicit state machine.

### Risk
2PC/XA = distributed lock: if a participant fails after PREPARE → the whole transaction stays frozen until manual recovery.
In production, an indefinitely frozen state = client impacted without confirmation → P1.

### Rules
- No `TransactionScope` promoted to a distributed transaction, no MSDTC, no `SaveChanges` touching several services' databases.
- Every multi-service flow → **choreographed saga** (events) or **orchestrated saga** (orchestrator / state machine).
- Each step → explicit state: `{{STATE_INITIAL}}` → `{{STATE_INTERMEDIATE}}` → `{{STATE_FINAL}}` (or `{{STATE_FAILED}}` + compensation), modelled as an `enum` + guarded transitions in the domain.
- Compensation → idempotent (rule B-02) and traced (log + event).
- Every intermediate state → reconciled by a scheduler (`BackgroundService`, Quartz.NET, Hangfire).
- Events published through the outbox (rule B-05).

### Anti-pattern
```csharp
// ❌ BLOCKER — one "transaction" over several services
using var scope = new TransactionScope(TransactionScopeAsyncFlowOption.Enabled);
await _repository.SaveAsync(entity, ct);            // DB A
await _serviceA.CreateAsync(entity, ct);            // HTTP → DB B
await _serviceB.NotifyAsync(entity, ct);            // HTTP → DB C
scope.Complete();                                   // if NotifyAsync fails, A/B cannot be rolled back reliably
```

### Compliant pattern
```csharp
// ✅ Domain state machine — explicit, guarded transitions
public enum {{ENTITY}}Status { {{STATE_INITIAL}}, {{STATE_INTERMEDIATE}}, {{STATE_FINAL}}, {{STATE_FAILED}} }

public sealed class {{ENTITY}}
{
    public {{ENTITY}}Status Status { get; private set; } = {{ENTITY}}Status.{{STATE_INITIAL}};
    public void MarkIntermediate() => Status = Status == {{ENTITY}}Status.{{STATE_INITIAL}}
        ? {{ENTITY}}Status.{{STATE_INTERMEDIATE}} : throw new InvalidStateException(Id, Status);
    public void Fail() { if (Status != {{ENTITY}}Status.{{STATE_FINAL}}) Status = {{ENTITY}}Status.{{STATE_FAILED}}; }  // idempotent
}

// ✅ Step 1 — Service A: local transaction + outbox event
public async Task<{{ENTITY}}> Step1Async({{COMMAND}} cmd, CancellationToken ct)
{
    var entity = new {{ENTITY}}(cmd);
    _db.Add(entity);
    _db.Outbox.Add(OutboxMessage.From(new {{EVENT_STEP1_TYPE}}(entity.Id, cmd.IdempotencyKey)));
    await _db.SaveChangesAsync(ct);
    return entity;
}

// ✅ Step 2 — Service B: at-least-once consumer + idempotency
public async Task HandleAsync({{EVENT_STEP1_TYPE}} evt, CancellationToken ct)
{
    if (await _db.{{ENTITY_B}}s.AnyAsync(x => x.SourceId == evt.EntityId, ct)) return;    // unique index backs this (B-02)
    _db.Add({{ENTITY_B}}.From(evt));
    _db.Outbox.Add(OutboxMessage.From(new {{EVENT_STEP2_TYPE}}(evt.EntityId)));
    await _db.SaveChangesAsync(ct);
}

// ✅ Compensation — FAILED state, not a rollback
public async Task OnFailedAsync({{EVENT_FAILED_TYPE}} evt, CancellationToken ct)
{
    var e = await _db.{{ENTITY_B}}s.SingleOrDefaultAsync(x => x.SourceId == evt.EntityId, ct);
    e?.Fail(); await _db.SaveChangesAsync(ct);
}

// ✅ Reconciliation job
var stuck = await _db.{{ENTITY}}s
    .Where(x => x.Status == {{ENTITY}}Status.{{STATE_INTERMEDIATE}} && x.UpdatedAt < now - {{RECONCILIATION_TIMEOUT}})
    .Take(100).ToListAsync(ct);
```
(Orchestrated alternative: a state-machine library — check licence per rule S-01 — or a hand-written orchestrator persisted in its own table.)

### CI/CD checklist
- [ ] `grep -rEn "TransactionScope|MSDTC|EnlistDistributed" src/` → none spanning services/DBs
- [ ] Every entity has a visible state: `SELECT status, COUNT(*) FROM {{TABLE}} GROUP BY status`
- [ ] Reconciliation scheduler active: alert if intermediate state > {{RECONCILIATION_TIMEOUT}}
- [ ] Compensation test: FAILED event → entity cancelled (idempotent, run twice = same result)

---

## B-07 — Observability: metrics, SLO, health checks & graceful shutdown
**Severity:** 🔴 BLOCKER (service without health / shutdown without drain) — 🟡 WARNING
**Applies to:** backend
**Triggers:** new service without health checks and metrics in {{MODULE_CIBLE}}; K8s manifest without liveness/readiness probes; service without SLO; deployment/shutdown without explicit drain.

### Risk
No `readinessProbe` → traffic sent to a pod not ready → 5xx in production.
Shutdown without drain → in-flight operation abandoned → inconsistent state without trace.
No SLO → no way to know when the service starts degrading silently.

### Rules
**Health checks & metrics:**
- Every service → `/health/live` (process only) + `/health/ready` (dependencies: DB, broker, cache) via `AddHealthChecks()`; metrics via **OpenTelemetry** (OTLP or Prometheus scrape).
- K8s: `livenessProbe` + `readinessProbe` (+ `startupProbe` for slow starts) configured.
- Minimum metrics: `{{OPERATION_TYPE}}.success.rate`, `{{OPERATION_TYPE}}.latency.p99`, rejection rate.
- Liveness must **not** check dependencies (otherwise a DB outage restarts every pod).

**SLO to define:**
- {{OPERATION_TYPE}} success rate ≥ {{SUCCESS_RATE_TARGET}} % → alert if lower.
- P99 latency ≤ {{P99_TARGET}} ms → alert if exceeded.
- Operations in intermediate state > {{INTERMEDIATE_COUNT}} for > {{INTERMEDIATE_TIMEOUT}} → alert.

**Graceful shutdown (mandatory sequence):**
1. `readiness` → `false` (load balancer stops sending traffic).
2. Drain in-flight work (bounded, e.g. {{DRAIN_TIMEOUT}}).
3. Flush: commit offsets / messages **after** the effect (B-05).
4. Clean stop.
- K8s: `lifecycle.preStop` + `terminationGracePeriodSeconds` ≥ preStop + drain + flush; `HostOptions.ShutdownTimeout` aligned.
- Container: exec-form `ENTRYPOINT ["dotnet", "App.dll"]` so the app is PID 1 and receives SIGTERM.
- Any in-flight operation that cannot be guaranteed → intermediate state + reconciliation (never abandoned).

### Anti-pattern
```yaml
# ❌ BLOCKER — no probes
containers:
  - name: {{MODULE_CIBLE}}
    image: {{MODULE_CIBLE}}:latest        # also ❌ floating tag
```
```csharp
// ❌ BLOCKER — default 30 s shutdown, in-flight consumer not drained, no readiness flip
```

### Compliant pattern
```csharp
// ✅ Program.cs
builder.Services.AddHealthChecks()
    .AddCheck("self", () => HealthCheckResult.Healthy(), tags: ["live"])
    .AddDbContextCheck<AppDbContext>(tags: ["ready"])
    .AddCheck<ShutdownHealthCheck>("shutdown", tags: ["ready"]);

app.MapHealthChecks("/health/live",  new() { Predicate = r => r.Tags.Contains("live") });
app.MapHealthChecks("/health/ready", new() { Predicate = r => r.Tags.Contains("ready") });

builder.Services.Configure<HostOptions>(o => o.ShutdownTimeout = TimeSpan.FromSeconds({{DRAIN_TIMEOUT_S}}));

// ✅ Readiness flips to Unhealthy as soon as shutdown starts
public sealed class ShutdownHealthCheck : IHealthCheck
{
    private volatile bool _stopping;
    public ShutdownHealthCheck(IHostApplicationLifetime life) => life.ApplicationStopping.Register(() => _stopping = true);
    public Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext c, CancellationToken ct = default)
        => Task.FromResult(_stopping ? HealthCheckResult.Unhealthy("shutting down") : HealthCheckResult.Healthy());
}

// ✅ Business metrics (System.Diagnostics.Metrics → OpenTelemetry)
static readonly Meter Meter = new("{{MODULE_CIBLE}}");
static readonly Counter<long> Succeeded = Meter.CreateCounter<long>("{{OPERATION_TYPE}}.success");
static readonly Counter<long> Failed    = Meter.CreateCounter<long>("{{OPERATION_TYPE}}.failure");
static readonly Histogram<double> Latency = Meter.CreateHistogram<double>("{{OPERATION_TYPE}}.latency", unit: "ms");

builder.Services.AddOpenTelemetry()
    .WithMetrics(m => m.AddAspNetCoreInstrumentation().AddHttpClientInstrumentation().AddMeter("{{MODULE_CIBLE}}").AddOtlpExporter());
```
```yaml
# ✅ Kubernetes probes + graceful shutdown
spec:
  terminationGracePeriodSeconds: {{TERMINATION_GRACE_PERIOD}}     # ≥ preStop + drain + flush
  containers:
    - name: {{MODULE_CIBLE}}
      startupProbe:   { httpGet: { path: /health/live,  port: {{PORT}} }, failureThreshold: 30, periodSeconds: 2 }
      livenessProbe:  { httpGet: { path: /health/live,  port: {{PORT}} }, periodSeconds: 10 }
      readinessProbe: { httpGet: { path: /health/ready, port: {{PORT}} }, periodSeconds: 5 }
      lifecycle:
        preStop: { exec: { command: ["/bin/sh", "-c", "sleep {{PRESTOP_DELAY}}"] } }   # let endpoints deregister
```

### CI/CD checklist
- [ ] `kubectl get deploy {{MODULE_CIBLE}} -o yaml | grep -A5 readinessProbe` → present
- [ ] `curl {{HEALTH_ENDPOINT}}` → `Healthy` with components (DB, broker)
- [ ] Test: `kill -TERM` during an in-flight operation → 0 abandoned operation, consistent state
- [ ] Alert: `{{OPERATION_TYPE}}_success_rate < {{SUCCESS_RATE_TARGET}}` → team notified
- [ ] Alert: `{{OPERATION_TYPE}}_intermediate_count{age>{{INTERMEDIATE_TIMEOUT}}} > {{INTERMEDIATE_COUNT}}`
- [ ] `terminationGracePeriodSeconds` ≥ preStop + `HostOptions.ShutdownTimeout`
