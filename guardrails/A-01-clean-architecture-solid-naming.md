---
id: "A-01"
title: "Clean Architecture — Domain isolation, SRP/DIP & Ubiquitous Language"
severity: "🔴 BLOCKER (business rule in an adapter / framework reference in the domain) — 🟡 WARNING"
applies_to: [backend]
triggers:
  - "Any class mixing business rule and framework in {{MODULE_CIBLE}}"
  - "Any framework using/reference in the Domain project"
  - "Any class doing > 3 distinct things (SRP violated)"
  - "Any cryptic identifier or name outside the {{DOMAIN_GLOSSARY}} business glossary"
version: "1.0"
---

## Risk
Business rule in a controller: the test requires a hosting context (slow, fragile), a framework change breaks the rule.
Cryptic name (`trx`, `amt`): a developer takes {{ONBOARDING_TIME}} to understand the model → misinterpretation → business bug.

## Rules

**Domain isolation:**
- Business rules ({{DOMAIN_RULES_EXAMPLES}}) → `Domain` project with zero framework references (`{{FRAMEWORK_PACKAGES}}`).
- Adapters (controllers, consumers, repositories) → call the rule, never the other way around.
- Rule test → 0 integration attributes (pure xUnit/NUnit, no host).

**SRP / DIP:**
- One class = one responsibility (≤ 3 responsibilities, ≤ 300 lines).
- Depend on abstractions: `I{{GATEWAY_INTERFACE}}` (interface), never `{{GATEWAY_IMPL}}` (concrete).
- A test with > 3 mocks → sign of SRP violated.

**Ubiquitous Language:**
- Mandatory glossary: `{{DOMAIN_TERMS}}`.
- Forbidden: `Manager`, `Helper`, `Util` without a precise qualifier, cryptic abbreviations.
- Casing convention: `camelCase` (locals), `PascalCase` (types/members), `UpperCamelCase` (constants).

## Anti-pattern
```csharp
// ❌ BLOCKER — business rule in the adapter
// Controllers/{{Controller}}.cs
[HttpPost("/{{ENDPOINT}}")]
public IActionResult Handle([FromBody] {{Command}} cmd)
{
    if (cmd.Amount > {{LIMIT}}) // rule in the adapter!
        return BadRequest(new { error = "Refused" });
    return Ok(_service.Process(cmd));
}

// ❌ WARNING — cryptic name + SRP violated
public class {{CRYPTIC_NAME}}Svc
{
    public void Calc{{CRYPTIC_FIELD}}(object usr, object trx) { ... }
}
```

## Compliant pattern
```csharp
// ✅ Rule in the domain
// Domain/{{DomainPackage}}/{{RuleClass}}.cs — 0 framework references
public sealed record {{RuleClass}}(decimal Limit)
{
    public void Validate(decimal amount)
    {
        if (amount > Limit)
            throw new {{RuleException}}(amount, Limit);
    }
}

// ✅ Adapters/Controllers/{{Controller}}.cs
public class {{Controller}}(
    {{RuleClass}} rule,          // dependency on the domain
    I{{GatewayInterface}} gw)    // abstraction
{
    [HttpPost("/{{ENDPOINT}}")]
    public async Task<IActionResult> Handle([FromBody] [FromBody: Validator] {{Command}} cmd)
    {
        rule.Validate(cmd.Amount);  // rule from the domain
        return Ok(await gw.ProcessAsync(cmd));
    }
}
```

## CI/CD checklist
- [ ] Architecture test (NetArchTest/ArchUnitNET): `NoTypes().That().AreInNamespace("..Domain..")` → no dependency on `{{FRAMEWORK_PACKAGES}}`
- [ ] Rule test `{{RuleClass}}Test` → 0 integration attributes, run < 100 ms
- [ ] `rg "using Microsoft\.(AspNetCore|EntityFrameworkCore)" Domain/` → 0
- [ ] `rg "class .*Manager|class .*Helper|class .*Util" src/ | rg -v "//"` → manual review
