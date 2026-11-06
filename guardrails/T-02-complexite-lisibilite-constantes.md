---
id: "T-02"
title: "Complexity & readability — cyclomatic ≤ {{CYCLO_THRESHOLD}}, cognitive ≤ {{COGNITIVE_THRESHOLD}}, zero magic numbers"
severity: "🟡 WARNING (complexity above threshold / magic number in a business rule)"
applies_to: [backend, frontend]
triggers:
  - "Any method exceeding the defined cyclomatic or cognitive complexity"
  - "Any magic number or magic string in the code (except 0 and 1)"
  - "Sonar S3776 (cognitive complexity), CA1502 or S1479 (switch with > N cases)"
version: "1.0"
---

## Risk
Cognitive complexity {{COGNITIVE_DANGER}} in `{{COMPLEX_METHOD}}`: a developer spends {{COMPREHENSION_TIME}} understanding the flow, introduces a bug by modifying the wrong branch → regression.
`if (status == {{MAGIC_NUMBER}})` in the {{DOMAIN_RULE}} rule: what does {{MAGIC_NUMBER}} mean? A silent refactoring changes the meaning → business bug.

## Rules

**Complexity:**
- Cyclomatic ≤ {{CYCLO_THRESHOLD}} per method (CA1502 / Sonar S1541) — beyond that: extract or simplify.
- Cognitive ≤ {{COGNITIVE_THRESHOLD}} per method (Sonar S3776) — nesting weighs more than branching.
- Method > {{MAX_METHOD_LINES}} lines → WARNING: candidate for decomposition.
- Class > {{MAX_CLASS_LINES}} lines → WARNING: SRP probably violated (card A-01).

**Magic numbers & strings:**
- Any numeric literal (except `0` and `1`) in a business rule → named constant.
- Any repeated string (code, status) → constant or enum.
- Business constants → `{{CONSTANTS_CLASS}}` class or `{{STATUS_ENUM}}`, `{{CODE_ENUM}}` enum.

## Anti-pattern
```csharp
// ❌ WARNING Sonar S3776 — cognitive complexity > {{COGNITIVE_THRESHOLD}}
public {{Result}} ProcessOperation({{Entity}} e)
{
    if (e.Status == 2) {                                    // +1: what is 2?
        if (e.Amount > m"{{MAGIC_THRESHOLD}}") {            // +2 magic
            foreach (var item in e.Items) {                 // +3
                if (item.Code == "{{MAGIC_CODE}}") {        // +4 magic string
                    if (!item.IsExpired) {                   // +5
                        // ...
                    }
                }
            }
        }
    }
}

// ❌ WARNING — magic numbers in a business rule
if (responseCode == {{MAGIC_CODE_VALUE}}) { Reject(); }
if (attempts > {{MAGIC_MAX_ATTEMPTS}}) { Block(); }
```

## Compliant pattern
```csharp
// ✅ Named constants + enums
public enum {{StatusEnum}} { {{STATUS_VALUES}} }

public enum {{CodeEnum}}
{
    {{CodeApproved}},
    {{CodeRejected}}
}

public static class {{ConstantsClass}}
{
    public const decimal HighRiskThreshold = {{MAGIC_THRESHOLD}}m;
    public const int MaxAttempts = {{MAGIC_MAX_ATTEMPTS}};
}

// ✅ Decomposed method — cognitive complexity ≤ {{COGNITIVE_THRESHOLD}}
public {{Result}} ProcessOperation({{Entity}} e)
{
    ValidateState(e);
    var item = FindValidItem(e);
    return Process(e, item);
}

private static void ValidateState({{Entity}} e)
{
    if (e.Status != {{StatusEnum}}.{{EXPECTED_STATUS}})
        throw new InvalidStateException(e.Id, e.Status);
}
```

## CI/CD checklist
- [ ] Sonar quality gate: cyclomatic ≤ {{CYCLO_THRESHOLD}} (CA1502/S1541), cognitive ≤ {{COGNITIVE_THRESHOLD}} (S3776) → build blocked if exceeded
- [ ] `rg "==\s*[2-9][0-9]+" src/` → manual review (magic numbers)
- [ ] `rg "\.Equals\(\"[0-9]{2,}\"" src/ | rg -i "code|status"` → replace with the `{{CODE_ENUM}}` enum
- [ ] Method > {{MAX_METHOD_LINES}} lines → justification required in the PR
