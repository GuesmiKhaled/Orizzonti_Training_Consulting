---
id: "S-02"
title: "Zero sensitive data — PII, business secrets, logs, application-level encryption"
severity: "🔴 absolute BLOCKER — never bypassable"
applies_to: [backend, frontend]
triggers:
  - "Any code processing {{SENSITIVE_DATA_TYPE}} (PAN, IBAN, SSN, passwords, private keys)"
  - "Any `_logger.*` call on a sensitive flow in {{MODULE_CIBLE}}"
  - "Any DB field, DTO or export mentioning confidential data"
  - "Any JSON serialization of a sensitive object in a log"
version: "1.0"
---

## Risk
A {{SENSITIVE_DATA_TYPE}} value in the logs = audit scope widened to the whole logging platform → cost and compliance risk.
A `SELECT {{SENSITIVE_FIELD}} FROM {{TABLE}}` readable in clear text = direct violation of data-protection rules (GDPR, PCI-DSS, HIPAA depending on the domain).

## Rules

**Sensitive data ({{SENSITIVE_DATA_TYPE}}):**
- Never in clear text: code, DB, logs, config, API, queue messages, tests (no real data in fixtures).
- Display allowed: masked or truncated only.
- Storage allowed: token/external reference or encrypted column.

**Logs:**
- Every log on a sensitive flow → goes through a `SanitizedLogContext` (allowlist of permitted fields).
- Fields permitted in logs: `correlationId`, opaque reference identifiers, status codes, masked amounts.
- Never: `_logger.*(sensitiveObject)`, `ToString()` of a sensitive object, JSON serialization of a confidential object.
- `DEBUG`/`Trace` disabled on the sensitive flow in production.

## Anti-pattern
```csharp
// ❌ BLOCKER — sensitive data in a log
_logger.LogInformation("User data: {User}", userObject);         // contains personal data
_logger.LogError("Payment error: {Msg}", paymentMessage);        // contains {{SENSITIVE_DATA_TYPE}}

// ❌ BLOCKER — sensitive data readable in the DB
public class {{Entity}}
{
    [Column("{{SENSITIVE_FIELD}}")]
    public string SensitiveField { get; set; } = null!; // in clear text
}
```

## Compliant pattern
```csharp
// ✅ Log with an allowlist of permitted fields
_logger.LogWarning("Operation failed: {CorrelationId} {OpaqueId} {StatusCode} {ErrorCode}",
    correlationId,
    reference.OpaqueId,   // opaque identifier, not the sensitive data
    response.StatusCode,
    response.PublicErrorCode);

// ✅ DB — transparent encryption via an EF Core ValueConverter
public class {{Entity}}
{
    [Column("{{SENSITIVE_FIELD}}_encrypted")]
    public string SensitiveField { get; set; } = null!; // encrypted at rest
}

// ✅ OnModelCreating — register the converter
builder.Entity<{{Entity}}>()
    .Property(e => e.SensitiveField)
    .HasConversion(new AesGcmValueConverter(Configuration["{{ENCRYPTION_KEY_ENV_VAR}}"]!));
```

## CI/CD checklist
- [ ] `rg "_logger\..*{{SENSITIVE_KEYWORD}}" src/` → 0 results
- [ ] `SELECT {{SENSITIVE_FIELD}} FROM {{TABLE}} LIMIT 1` → opaque/encrypted result (integration test)
- [ ] `LogSanitizationTest`: capture the appender, assert the sensitive value is not in any line
- [ ] No real data in test fixtures
- [ ] `DEBUG`/`Trace` disabled on the production profile (verify the logging config)
