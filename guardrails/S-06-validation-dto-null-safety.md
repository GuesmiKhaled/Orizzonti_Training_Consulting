---
id: "S-06"
title: "Defense in depth — input DTO validation + null safety"
severity: "🔴 BLOCKER (critical DTO without validation / returning null from a public method)"
applies_to: [backend]
triggers:
  - "Any `[FromBody]` on a side-effect endpoint in {{MODULE_CIBLE}}"
  - "Any DTO/Command passed to a business service without validation constraints"
  - "Any `return null` from a public method"
  - "Any `null!`/`!` suppression used to silence the compiler instead of handling absence"
version: "1.0"
---

## Risk
An unvalidated DTO: a null value reaches the domain → NullReferenceException in the middle of the business rule, inconsistent state.
A `return null` from a public method: the NRE propagates silently several layers later.

## Rules

**Input validation (controller layer):**
- Every `[FromBody]` on a side-effect endpoint → validation mandatory (`[ApiController]` + DataAnnotations → automatic 400).
- Every DTO/Command → DataAnnotations constraints: `[Required]`, `[MinLength]`, `[MaxLength]`, `[Range]`.
- Violation → error handler with the standardized format (card A-03).

**Null safety (domain layer):**
- Public method returning an optional entity → nullable reference + `?? throw` or `Option<T>` — never a silent `null`.
- Empty collection → `[]`/`Empty<T>.Instance`, never `null`.
- Critical parameter → `ArgumentNullException.ThrowIfNull(param)` at the start of the method.
- Nullable reference types enabled (`<Nullable>enable</Nullable>` + `<WarningsAsErrors>nullable</WarningsAsErrors>`).

## Anti-pattern
```csharp
// ❌ BLOCKER — unvalidated DTO: null values reach the domain
app.MapPost("/{{ENDPOINT}}", async ({{Command}} cmd) => ...);

public record {{Command}}(string UserId, decimal Amount); // no constraints

// ❌ BLOCKER — returning null from a public method
public {{Entity}}? FindById(Guid id) =>
    _repository.Find(id); // null → NRE several layers later
```

## Compliant pattern
```csharp
// ✅ [ApiController] + DataAnnotations — automatic 400
[ApiController]
public class {{Controller}}(Service service) : ControllerBase
{
    [HttpPost("/{{ENDPOINT}}")]
    public Task<IActionResult> Handle([FromBody] {{Command}} cmd) =>
        service.ExecuteAsync(cmd); // model state validated automatically
}

// ✅ DTO with constraints
public sealed record {{Command}}
{
    [Required, MinLength(1)] public string UserId { get; init; } = null!;
    [Required, Range(0.01, double.MaxValue)] public decimal Amount { get; init; }
    [Required, MinLength(1)] public string IdempotencyKey { get; init; } = null!;
}

// ✅ Public method — no silent null
public {{Entity}} FindById(Guid id) =>
    _repository.Find(id) ?? throw new NotFoundException(id);

// ✅ Critical parameter
public void Process({{Entity}} entity) =>
    ArgumentNullException.ThrowIfNull(entity);
```

## CI/CD checklist
- [ ] `rg "\[FromBody\]" src/ | rg -v "ApiController|Valid"` → 0 results on side-effect endpoints
- [ ] `rg "return null" src/` → 0 on public service/domain methods
- [ ] Test: POST with `amount=null` → `400 Bad Request` with a structured detail
- [ ] Test: DTO with an invalid value → automatic 400 with all violations listed
