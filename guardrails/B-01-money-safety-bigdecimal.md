---
id: "B-01"
title: "Money safety — decimal, comparison & rounding"
severity: "🔴 absolute BLOCKER"
applies_to: [backend]
triggers:
  - "Any amount calculation in {{MODULE_CIBLE}}: fee, total, balance, refund"
  - "float/double/int/long fields carrying a financial amount"
  - "Any amount flowing through float/double (implicit conversion)"
version: "1.0"
---

## Risk
`float` and `double` are binary approximations: `0.1 + 0.2 ≠ 0.3` in IEEE 754 floating point.
On a volume of {{TRANSACTION_VOLUME}} × {{UNIT_AMOUNT}} → cumulative accounting drift, unexplainable at audit.

## Rules

- Every financial amount in {{MODULE_CIBLE}} → `decimal` (C#) mandatory.
- `float`/`double`/`int`/`long` on an amount → immediate BLOCKER.
- Rounding → explicit mode always specified.
  - General rule: `MidpointRounding.AwayFromZero` (HALF_UP); tax calculations: `MidpointRounding.ToEven` (HALF_EVEN).
- Comparison → `decimal` operators are exact; never let an amount pass through `float`/`double`.
- Parsing → `decimal.Parse("10.50", CultureInfo.InvariantCulture)` — never a `float`/`double` intermediate.
- DTO/Command → `decimal` with `[Range(0.01, ...)]` (card S-06).

## Anti-pattern
```csharp
// ❌ BLOCKER — float on an amount
double total = 0.1 + 0.2; // = 0.30000000000000004

// ❌ BLOCKER — double round-trip
decimal amount = (decimal)rawDouble; // binary noise baked in

// ❌ BLOCKER — implicit precision loss
decimal fee = amount * feeRate; // feeRate is double → conversion loses precision

// ❌ BLOCKER — implicit rounding
decimal fee = amount * rate; // no explicit scale/rounding
```

## Compliant pattern
```csharp
// ✅ decimal from string (exact)
var amount = decimal.Parse("{{AMOUNT_VALUE}}", CultureInfo.InvariantCulture);

// ✅ Calculation with explicit rounding
var fee = Math.Round(amount * feeRate, 2, MidpointRounding.AwayFromZero);

// ✅ Comparison on decimal (exact)
if (refund > originalAmount)
    throw new BusinessException("{{REFUND_EXCEEDS_ORIGINAL_MESSAGE}}");

// ✅ DTO with constraint
public sealed record {{Command}}(
    [property: Required, property: Range(0.01, double.MaxValue)] decimal Amount,
    [property: Required] string Currency
);
```

## CI/CD checklist
- [ ] `rg "(float|double)" src/ | rg -i "amount|fee|balance|total"` → 0
- [ ] `rg "\(\s*(decimal|float|double)\s*\)\s*\w*[Aa]mount" src/` → 0 (no double↔decimal round-trip)
- [ ] `rg "Math\.Round\([^,)]*\)" src/` → 0 (every rounding has an explicit mode)
- [ ] Mutation test: boundary comparison `> 0` → mutant `>= 0` killed by the exact-boundary test
