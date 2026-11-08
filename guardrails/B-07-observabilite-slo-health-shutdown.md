---
id: "B-07"
title: "Observability — metrics, SLO, health checks & graceful shutdown"
severity: "🔴 BLOCKER (service without health / stop without drain) — 🟡 WARNING"
applies_to: [backend]
triggers:
  - "Any new service without health checks and metrics in {{MODULE_CIBLE}}"
  - "Any K8s manifest without livenessProbe/readinessProbe"
  - "Any service without a defined SLO"
  - "Any deployment/stop without an explicit drain"
version: "1.0"
---

## Risk
A service without `readinessProbe` → traffic sent to a not-ready pod → 5xx errors in production.
A stop without drain → an in-flight operation is abandoned → inconsistent state without a trace → incident.
Without an SLO → you don't know when the service starts degrading silently.

## Rules

**Health checks & metrics:**
- Every service → `{{HEALTH_ENDPOINT}}` (liveness + readiness) + `{{METRICS_ENDPOINT}}` (Prometheus).
- K8s manifest: `livenessProbe` + `readinessProbe` configured.
- Minimal metrics: `{{OPERATION_TYPE}}.success.rate`, `{{OPERATION_TYPE}}.latency.p99`, rejection rate.

**SLOs to define:**
- {{OPERATION_TYPE}} success rate ≥ {{SUCCESS_RATE_TARGET}}% → alert if below.
- P99 latency ≤ {{P99_TARGET}} ms → alert if exceeded.
- Operations in intermediate state > {{INTERMEDIATE_COUNT}} for > {{INTERMEDIATE_TIMEOUT}} → alert.

**Graceful shutdown (mandatory sequence):**
1. `readiness` → `false` (LB sends no more traffic).
2. Drain in-flight (bounded, e.g. {{DRAIN_TIMEOUT}}).
3. Flush: commit offsets/messages **after** the effect.
4. Clean stop.
- K8s: `lifecycle.preStop` + `terminationGracePeriodSeconds` ≥ drain + flush.
- Any in-flight not guaranteed → intermediate state + reconciliation (never abandoned).

## Anti-pattern
```yaml
# ❌ BLOCKER — no readinessProbe
containers:
  - name: {{MODULE_CIBLE}}
    image: {{MODULE_CIBLE}}:latest
    # No probes → traffic sent even if the service is not ready
```

## Compliant pattern
```yaml
# ✅ K8s probes + graceful shutdown
containers:
  - name: {{MODULE_CIBLE}}
    livenessProbe:
      httpGet: { path: {{HEALTH_LIVENESS_PATH}}, port: {{PORT}} }
      initialDelaySeconds: 30
      periodSeconds: 10
    readinessProbe:
      httpGet: { path: {{HEALTH_READINESS_PATH}}, port: {{PORT}} }
      initialDelaySeconds: 20
      periodSeconds: 5
    lifecycle:
      preStop:
        exec:
          command: ["/bin/sh", "-c", "sleep {{PRESTOP_DELAY}}"]
spec:
  terminationGracePeriodSeconds: {{TERMINATION_GRACE_PERIOD}}
```

```csharp
// ✅ Graceful shutdown — appsettings.json + Program.cs
// appsettings.json: { "Host": { "ShutdownTimeout": "{{DRAIN_TIMEOUT}}" } }
builder.Services.AddHealthChecks();
app.MapHealthChecks("/health/live", new HealthCheckOptions { Predicate = _ => true });
app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = reg => reg.Tags.Contains("ready")
});
```

## CI/CD checklist
- [ ] `kubectl get deploy {{MODULE_CIBLE}} -o yaml | grep -A5 readinessProbe` → present
- [ ] `curl {{HEALTH_ENDPOINT}}` → `{"status":"UP"}` with components
- [ ] Test: `kill -TERM` during an in-flight operation → 0 operation abandoned, consistent state
- [ ] Alert: `{{OPERATION_TYPE}}_success_rate < {{SUCCESS_RATE_TARGET}}` → team notification
- [ ] Alert: `{{OPERATION_TYPE}}_intermediate_count{age>{{INTERMEDIATE_TIMEOUT}}} > {{INTERMEDIATE_COUNT}}`
