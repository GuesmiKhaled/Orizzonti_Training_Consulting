---
id: "B-04"
title: "Concurrency — virtual threads, cancellation & thread-safety"
severity: "🔴 BLOCKER (swallowed cancellation / sync-over-async) — 🟡 WARNING"
applies_to: [backend]
triggers:
  - "Blocking I/O code, `lock`, `Thread.Sleep`, shared state in {{MODULE_CIBLE}}"
  - "Any try/catch around `OperationCanceledException`"
  - "Any `.Result` / `.Wait()` on async code"
  - "Any variable shared between threads without explicit synchronization"
  - "Roslyn CA2007 / CA2012 / Sonar S5693"
version: "1.0"
---

## Risk
Swallowed cancellation (`TaskCanceledException` dropped) → zombie task at graceful shutdown → double processing on restart.
`.Result`/`.Wait()` on async code → thread pool starvation → latency collapse on {{MODULE_CIBLE}}.
`lock` around blocking I/O on .NET virtual threads → carrier pinning → virtual thread benefit cancelled (card B-07).
Unprotected shared state → silent data race.

## Rules

**Virtual threads & async (.NET 10):**
- `.Result` / `.Wait()` / `Task.WaitAll` on the request path → BLOCKER: `await` end-to-end.
- `lock` around blocking I/O (DB, network) with virtual threads → prefer `SemaphoreSlim` or cancellation-based APIs on hot paths.
- Fixed-size thread pool for I/O → use `async/await` (the thread pool sizes itself).

**Cancellation (Roslyn CA2007/CA2012):**
- `OperationCanceledException` → **always** check `ct.IsCancellationRequested` and rethrow or return cleanly — never swallow.
- `Task.Delay` / `Thread.Sleep` without a `CancellationToken` on critical paths → pass the token.
- Mutable shared state → `Interlocked`, `ConcurrentDictionary<T,K>`, `volatile`, or `lock` with a short scope.

## Anti-pattern
```csharp
// ❌ BLOCKER CA2007 — swallowed cancellation, zombie task
try
{
    await Task.Delay(retryDelay);
}
catch (TaskCanceledException)
{
    _logger.LogWarning("Interrupted"); // cancellation lost → task never stops cleanly
}

// ❌ BLOCKER — sync-over-async (thread pool starvation, possible deadlock)
var items = _repository.GetItemsAsync(id).Result;

// ❌ WARNING — blocking the thread on a critical path
Thread.Sleep(1000); // blocks a thread; use Task.Delay with a token
```

## Compliant pattern
```csharp
// ✅ Cancellation — never swallowed
try
{
    await Task.Delay(retryDelay, ct);
}
catch (OperationCanceledException) when (ct.IsCancellationRequested)
{
    _logger.LogWarning("Processing cancelled in {{MODULE_CIBLE}}, stopping cleanly");
    throw; // rethrow (or return) → graceful shutdown respected
}

// ✅ await end-to-end — no .Result / .Wait()
var items = await _repository.GetItemsAsync(id, ct);

// ✅ CancellationToken on delays
await Task.Delay(TimeSpan.FromMilliseconds(500), ct);

// ✅ Shared state — atomic
private int _counter;
Interlocked.Increment(ref _counter); // atomic, no lock needed
```

## CI/CD checklist
- [ ] `rg "catch\s*\(\s*TaskCanceledException" src/ | rg -v "IsCancellationRequested"` → 0
- [ ] `rg "\.Result|\.Wait\(\)" src/ | rg -v "test"` → 0
- [ ] Roslyn CA2007/CA2012 → 0 open issues
- [ ] Test: cancelled task → scheduler stops cleanly (graceful shutdown honored)
