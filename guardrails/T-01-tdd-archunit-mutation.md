---
id: "T-01"
title: "TDD, architecture tests & mutation testing — test quality is provable"
severity: "🔴 BLOCKER (architecture rule without an architecture test) — 🟡 WARNING (surviving mutant on a critical rule)"
applies_to: [backend]
triggers:
  - "Any PR on a critical rule ({{CRITICAL_RULES}}) with high coverage but weak assertions"
  - "Any framework reference in the Domain project not blocked by an architecture test"
  - "Any circular dependency not detected in CI"
  - "Mutation score < {{MUTATION_THRESHOLD}}% on a core class ({{CRITICAL_CLASSES}})"
version: "1.0"
---

## Risk
100% coverage proves nothing: a test without assertions passes, the `<` → `<=` mutant on the `{{BOUNDARY_RULE}}` rule survives → the bug reaches production and is found by the client.
Without architecture tests: the "domain without framework" rule is a pious wish — a reference slips silently through CI and creates irreversible coupling.
An undetected circular dependency ({{CIRCULAR_DEP_EXAMPLE}}) → refactoring becomes impossible.

## Rules

**TDD:**
- Red → Green → Refactor on every business rule ({{DOMAIN_RULES_EXAMPLES}}).
- Unit test of a rule: 0 integration attributes, execution < 100 ms.
- Assertion on the exact value: `result.Should().Be({{EXPECTED_VALUE}})` (FluentAssertions).

**Architecture tests (NetArchTest / ArchUnitNET) — 4 mandatory rules in CI:**
```csharp
// Rule 1: the Domain depends on no framework
ArchRuleDefinition
    .NoTypes()
    .That().AreInNamespace("{{BASE_NAMESPACE}}.Domain")
    .Should().NotDependOnAny(
        Assemblies().That().AreInNamespace("Microsoft.AspNetCore", "Microsoft.EntityFrameworkCore"))
    .Check(...);

// Rule 2: no cycles between namespaces
ArchRuleDefinition
    .Classes()
    .That().AreInNamespace("{{BASE_NAMESPACE}}")
    .Should().HaveNoCyclicDependencies()
    .Check(...);

// Rule 3: mandatory layering (Controller → Service → Repository)
ArchRuleDefinition
    .Classes()
    .That().AreInNamespace("..controller..")
    .Should().OnlyHaveAccessToNamespaces("..service..", "..domain..")
    .Check(...);
// the Repository layer is accessible only from the Service layer

// Rule 4: no business logic in repositories
ArchRuleDefinition
    .NoClasses()
    .That().AreInNamespace("..repository..")
    .Should().HaveNameMatching("..(Service|Rule)..")
    .Check(...);
```

**Mutation testing (Stryker.NET) — critical classes:**
- Minimum score: {{MUTATION_THRESHOLD}}% (blocking CI threshold), target {{MUTATION_TARGET}}% on `{{CRITICAL_CLASSES}}`.
- Surviving mutant on a money/boundary rule → strengthen the test with the exact boundary value.

## Anti-pattern
```csharp
// ❌ WARNING — test without assertions
[Fact]
public void Process()
{
    _service.Process(command); // no assertion → any bug passes
}

// ❌ WARNING — coverage without boundary proof
[Fact]
public void Validation()
{
    _ = _rule; // Assert.DoesNotThrow(() => _rule.Validate(m"{{BOUNDARY_VALUE}}"));
    // the exact amount at the limit is never tested → the < → <= mutant survives
}
```

## Compliant pattern
```csharp
// ✅ Red-green-refactor test with an exact-value assertion
[Fact]
public void Should_calculate_{{RULE_NAME}}_correctly()
{
    var input = decimal.Parse("{{INPUT_VALUE}}", CultureInfo.InvariantCulture);
    var expected = decimal.Parse("{{EXPECTED_VALUE}}", CultureInfo.InvariantCulture);
    var result = _calculator.Calculate(input);
    result.Should().Be(expected); // kills the ±0.01 mutant
}

// ✅ Exact boundary — kills the < → <= mutant
[Fact]
public void Should_reject_{{RULE_NAME}}_equal_to_limit()
{
    var limit = decimal.Parse("{{LIMIT_VALUE}}", CultureInfo.InvariantCulture);
    var tested = limit; // exactly the limit
    var act = () => _rule.Validate(tested, limit);
    act.Should().Throw<{{LimitException}}>();
}
```

```xml
<!-- Test project .csproj — Stryker.NET blocking threshold in CI -->
<StrykerConfiguration>
  <break>0</break>
  <low>{{MUTATION_THRESHOLD}}</low>
  <high>{{MUTATION_TARGET}}</high>
</StrykerConfiguration>
<!-- Run: dotnet stryker --project {{BASE_PACKAGE}}.Domain.Tests -->
```

## CI/CD checklist
- [ ] Architecture tests in CI → 0 violations (4 rules) — blocks the build
- [ ] `dotnet stryker` → score ≥ {{MUTATION_THRESHOLD}}% on `Domain.*` — blocked below the threshold
- [ ] No surviving mutant on `{{CRITICAL_CLASSES}}` (Stryker report)
- [ ] Circular dependency test → green
- [ ] Business rule tests: 0 integration attributes on domain tests
- [ ] `rg "DoesNotThrow\(\)|Assert\.True\(true\)" src/test/` → manual review
