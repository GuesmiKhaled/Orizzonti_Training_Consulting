# BLOCK T — QUALITY / CRAFTSMANSHIP (T-01 → T-02) — .NET / Angular edition

---

## T-01 — TDD, architecture tests & mutation testing: test quality is provable
**Severity:** 🔴 BLOCKER (architecture rule without architecture test) — 🟡 WARNING (surviving mutant on a critical rule)
**Applies to:** backend (+ frontend for mutation testing with StrykerJS)
**Triggers:** any PR on a critical rule ({{CRITICAL_RULES}}) with high coverage but weak assertions; any framework reference in the domain not blocked by an architecture test; any circular dependency not detected in CI; mutation score < {{MUTATION_THRESHOLD}} % on a core class ({{CRITICAL_CLASSES}}).

### Risk
100 % coverage proves nothing: a test without assertion passes; the mutant `<` → `<=` on the {{BOUNDARY_RULE}} rule survives → bug in production found by the customer.
Without architecture tests, "Domain without framework" is wishful thinking — a `using` slips through CI and creates irreversible coupling.
Circular dependency ({{CIRCULAR_DEP_EXAMPLE}}) undetected → refactoring impossible.

### Rules
**TDD:**
- Red → Green → Refactor on every business rule ({{DOMAIN_RULES_EXAMPLES}}).
- Rule unit test: 0 `{{INTEGRATION_TEST_ANNOTATION}}`, runtime < 100 ms.
- Assert the **exact value**: `Assert.Equal(expected, result)` on `decimal` (exact, no tolerance).
- Assertion library: xUnit `Assert`, Shouldly or AwesomeAssertions — **check licence** (FluentAssertions ≥ 8 is commercial for most uses; rule S-01).
- Integration tests: `WebApplicationFactory` + Testcontainers (real DB/broker), kept apart from rule tests.

**Architecture tests — 4 mandatory rules in CI (ArchUnitNET; NetArchTest lacks cycle detection):**
```csharp
using static ArchUnitNET.Fluent.ArchRuleDefinition;

public sealed class ArchitectureRulesTests
{
    private static readonly Architecture Arch = new ArchLoader()
        .LoadAssemblies(typeof(Payment).Assembly,                 // Domain
                        typeof(PaymentService).Assembly,          // Application
                        typeof(PaymentRepository).Assembly,       // Infrastructure
                        typeof(PaymentsController).Assembly)      // Api
        .Build();

    private static readonly IObjectProvider<IType> Domain = Types().That().ResideInNamespace("{{BASE_NAMESPACE}}.Domain", useRegularExpressions: false).As("Domain");

    // Rule 1: the domain depends on no framework
    [Fact] public void Domain_has_no_framework_dependency() =>
        Types().That().Are(Domain).Should().NotDependOnAny(
            Types().That().ResideInNamespaceMatching(@"^(Microsoft\.(AspNetCore|EntityFrameworkCore)|Newtonsoft|Confluent|{{FRAMEWORK_PACKAGES}})"))
        .Check(Arch);

    // Rule 2: no cycles between slices
    [Fact] public void No_cycles_between_namespaces() =>
        Slices().Matching("{{BASE_NAMESPACE}}.(*)").Should().BeFreeOfCycles().Check(Arch);

    // Rule 3: layering Api → Application → Infrastructure/Domain (controllers never touch repositories)
    [Fact] public void Controllers_do_not_access_repositories() =>
        Types().That().ResideInNamespace("{{BASE_NAMESPACE}}.Api", true).Should().NotDependOnAny(
            Types().That().ResideInNamespace("{{BASE_NAMESPACE}}.Infrastructure.Persistence", true)).Check(Arch);

    // Rule 4: no business logic in repositories
    [Fact] public void Repositories_hold_no_business_logic() =>
        Classes().That().ResideInNamespace("{{BASE_NAMESPACE}}.Infrastructure.Persistence", true)
            .Should().NotHaveNameContaining("Service").AndShould().NotHaveNameContaining("Rule").Check(Arch);
}
```
- Compile-time complement: project references (A-01) — the strongest guard.

**Mutation testing (Stryker.NET; StrykerJS for Angular) — critical classes:**
- Minimum score {{MUTATION_THRESHOLD}} % (blocking CI threshold), target {{MUTATION_TARGET}} % on `{{CRITICAL_CLASSES}}`.
- Surviving mutant on a money/boundary rule → strengthen the test with the exact boundary value.

### Anti-pattern
```csharp
// ❌ WARNING — test without assertion
[Fact] public async Task TestProcess() { await service.ProcessAsync(command); }   // any bug passes

// ❌ WARNING — coverage without boundary proof
[Fact] public void TestValidation() =>
    Record.Exception(() => rule.Validate(new decimal({{BOUNDARY_VALUE}})));       // exact limit never asserted → mutant < → <= survives
```

### Compliant pattern
```csharp
// ✅ Red-green-refactor with exact value
[Fact] public void Should_calculate_{{RULE_NAME}}_correctly()
{
    var input    = {{INPUT_VALUE}}m;
    var expected = {{EXPECTED_VALUE}}m;
    var result   = calculator.Calculate(input);
    Assert.Equal(expected, result);                    // kills the ±0.01 mutant
}

// ✅ Exact boundary — kills the < → <= mutant
[Fact] public void Should_reject_{{RULE_NAME}}_equal_to_limit()
{
    var limit = {{LIMIT_VALUE}}m;
    Assert.Throws<{{LIMIT_EXCEPTION}}>(() => rule.Validate(limit, limit));
}
// + the value just under the limit must pass; the value just over must fail
```
```json
// ✅ stryker-config.json — blocking threshold in CI
{
  "stryker-config": {
    "solution": "{{SOLUTION}}.sln",
    "mutate": ["**/*.Domain/**/*.cs", "!**/obj/**"],
    "thresholds": { "high": {{MUTATION_TARGET}}, "low": {{MUTATION_THRESHOLD}}, "break": {{MUTATION_THRESHOLD}} }
  }
}
```
```bash
dotnet test --collect:"XPlat Code Coverage"
dotnet stryker                      # fails the build if score < break
# Angular: npx stryker run          (StrykerJS, same thresholds idea) ; unit tests with Vitest/Jest
```

### CI/CD checklist
- [ ] `dotnet test` architecture suite (4 rules) → 0 violation — blocks the build
- [ ] `dotnet stryker` → score ≥ {{MUTATION_THRESHOLD}} % on `*.Domain` — blocks below threshold
- [ ] No surviving mutant on `{{CRITICAL_CLASSES}}` (Stryker report)
- [ ] `No_cycles_between_namespaces` green
- [ ] Rule tests: 0 `{{INTEGRATION_TEST_ANNOTATION}}` usage in domain test project
- [ ] `grep -rEn "Assert\.True\(true\)|Record\.Exception\(" tests/` → manual review; analyzers xUnit2xxx clean

---

## T-02 — Complexity & readability: cyclomatic ≤ {{CYCLO_THRESHOLD}}, cognitive ≤ {{COGNITIVE_THRESHOLD}}, zero magic numbers
**Severity:** 🟡 WARNING (complexity over threshold / magic number in business rule)
**Applies to:** backend, frontend
**Triggers:** any method exceeding the defined cyclomatic or cognitive complexity; any magic number or magic string (except `0` and `1`); Sonar S3776 (cognitive complexity), S1541 (cyclomatic), S109 (magic numbers), S138 (method too long), S104 (file too long); CA1502 (excessive complexity).

### Risk
Cognitive complexity {{COGNITIVE_DANGER}} in `{{COMPLEX_METHOD}}`: a developer spends {{COMPREHENSION_TIME}} understanding the flow, edits the wrong branch → regression.
`if (status == {{MAGIC_NUMBER}})` in the {{DOMAIN_RULE}} rule: what is {{MAGIC_NUMBER}}? A silent refactoring changes the meaning → business bug.

### Rules
**Complexity:**
- Cyclomatic ≤ {{CYCLO_THRESHOLD}} per method (Roslyn **CA1502** via `CodeMetricsConfig.txt`, Sonar S1541) — beyond: extract or simplify.
- Cognitive ≤ {{COGNITIVE_THRESHOLD}} per method (Sonar S3776) — nesting weighs more than branching.
- Method > {{MAX_METHOD_LINES}} lines → WARNING (S138): decomposition candidate.
- Class > {{MAX_CLASS_LINES}} lines → WARNING: SRP probably violated (rule A-01).
- Prefer guard clauses, `switch` expressions, pattern matching, polymorphism/strategy over nested `if`s.

**Magic numbers & strings:**
- Any numeric literal (except `0` and `1`) in a business rule → named `const` / `static readonly`.
- Any repeated string (code, status) → `const` or `enum`.
- Business constants → class `{{CONSTANTS_CLASS}}` or enum `{{STATUS_ENUM}}`, `{{CODE_ENUM}}`. **Naming: PascalCase** (`HighRiskThreshold`), per .NET conventions.
- Use `const` for primitives/strings, `static readonly` for `decimal`-typed values where needed (`decimal` literals can be `const decimal`).
- TypeScript: ESLint `complexity`, `sonarjs/cognitive-complexity`, `no-magic-numbers`; string-literal unions or `enum`-like `as const` objects instead of raw strings.

### Anti-pattern
```csharp
// ❌ WARNING S3776 — cognitive complexity > {{COGNITIVE_THRESHOLD}}
public {{RESULT}} ProcessOperation({{ENTITY}} e)
{
    if (e.Status == 2)                                          // +1 : what is 2?
    {
        if (e.Amount > {{MAGIC_THRESHOLD}}m)                    // +2 magic number
        {
            foreach (var item in e.Items)                       // +3
            {
                if (item.Code == "{{MAGIC_CODE}}")              // +4 magic string
                {
                    if (!item.IsExpired) { /* ... */ }          // +5
                }
            }
        }
    }
}

// ❌ WARNING — magic numbers in business rule
if (responseCode == {{MAGIC_CODE_VALUE}}) { Reject(); }
if (attempts > {{MAGIC_MAX_ATTEMPTS}}) { Block(); }
```

### Compliant pattern
```csharp
// ✅ Named constants + enums
public enum {{STATUS_ENUM}} { {{STATUS_VALUES}} }

public enum {{CODE_ENUM}} { {{CODE_APPROVED}}, {{CODE_REJECTED}} }
public static class {{CODE_ENUM}}Parser
{
    private static readonly IReadOnlyDictionary<string, {{CODE_ENUM}}> ByCode = new Dictionary<string, {{CODE_ENUM}}>
    {
        ["{{CODE_APPROVED_VALUE}}"] = {{CODE_ENUM}}.{{CODE_APPROVED}},
        ["{{CODE_REJECTED_VALUE}}"] = {{CODE_ENUM}}.{{CODE_REJECTED}},
    };
    public static {{CODE_ENUM}} Of(string code) => ByCode.GetValueOrDefault(code, {{CODE_ENUM}}.{{CODE_REJECTED}});   // unknown → safest outcome
}

public static class {{CONSTANTS_CLASS}}
{
    public const decimal HighRiskThreshold = {{MAGIC_THRESHOLD}}m;
    public const int MaxAttempts = {{MAGIC_MAX_ATTEMPTS}};
}

// ✅ Decomposed method — cognitive complexity ≤ {{COGNITIVE_THRESHOLD}}
public {{RESULT}} ProcessOperation({{ENTITY}} e)
{
    ValidateState(e);
    var item = FindValidItem(e);
    return Process(e, item);
}

private static void ValidateState({{ENTITY}} e)
{
    if (e.Status != {{STATUS_ENUM}}.{{EXPECTED_STATUS}}) throw new InvalidStateException(e.Id, e.Status);   // guard clause
}
```
```text
# ✅ CodeMetricsConfig.txt (Roslyn CA1502) — build fails above threshold when severity = error
CA1502: {{CYCLO_THRESHOLD}}
```
```ini
# .editorconfig
dotnet_diagnostic.CA1502.severity = warning
dotnet_diagnostic.S3776.severity  = warning
dotnet_diagnostic.S109.severity   = suggestion   # off by default in Sonar: enable for domain projects
```

### CI/CD checklist
- [ ] Sonar quality gate: cyclomatic ≤ {{CYCLO_THRESHOLD}}, cognitive ≤ {{COGNITIVE_THRESHOLD}} → build blocked if exceeded
- [ ] `grep -rEn "== [2-9][0-9]*\b|== [0-9]{2,}" src/ --include=*.cs` → manual review (magic numbers)
- [ ] `grep -rEn "== \"[0-9]{2}\"" src/ | grep -iE "code|status"` → replace with enum {{CODE_ENUM}}
- [ ] Method > {{MAX_METHOD_LINES}} lines → justification required in the PR
- [ ] Angular: `npx eslint .` with `complexity`, `sonarjs/cognitive-complexity`, `no-magic-numbers` → clean
