---
id: "A-02"
title: "API backward compatibility — zero breaking change without versioning"
severity: "🔴 BLOCKER (breaking change on a production API)"
applies_to: [backend, frontend]
triggers:
  - "Any API contract change in {{MODULE_CIBLE}}: field removal/renaming/type change"
  - "Any new endpoint or new version of an existing endpoint"
  - "Any deprecation of a field or endpoint used in production"
version: "1.0"
---

## Risk
A field removed or renamed in an API used in production → deserialization errors as soon as deployed → client incident.
A type change (`string` → `int`) on a field → silent data loss on the consumer side.

## Rules

**Breaking changes forbidden without versioning:**
- Remove a field → BLOCKER: deprecate first, remove after {{DEPRECATION_PERIOD}}.
- Rename a field → BLOCKER: add the new name, keep the old one (deprecated).
- Change a field's type → BLOCKER: new field + client-side migration.
- Make an optional field `required` → BLOCKER.

**Non-breaking evolutions (allowed):**
- Add a new optional field.
- Add a new endpoint.
- Add a new enum value (if the client ignores unknown values).

**Versioning:**
- Unavoidable breaking change → path versioning: `/v1/{{ENDPOINT}}` → `/v2/{{ENDPOINT}}`.
- `Sunset` header on deprecated v1 endpoints (RFC 8594): `Sunset: {{SUNSET_DATE}}`.
- At most {{MAX_PARALLEL_VERSIONS}} versions in parallel.

## Anti-pattern
```csharp
// ❌ BLOCKER — field renamed in place
public record {{ResponseType}}(
    Guid Id,
    decimal TotalAmount,  // was "amount" — breaks every existing client
    string Status
);
```

## Compliant pattern
```csharp
// ✅ Deprecated field kept + new field added
public record {{ResponseType}}(
    Guid Id,
    [Obsolete("Renamed to {{NEW_FIELD}}. Remove after {{SUNSET_DATE}}.")] {{FieldType}} OldField,  // kept for old clients
    {{FieldType}} NewField,  // new name — in parallel
    string Status
);

// ✅ Path versioning — route groups
var v2 = app.MapGroup("/v2/{{ENDPOINT}}");
v2.Post("/", HandleV2); // new implementation

// ✅ Sunset header on v1
app.MapGet("/v1/{{ENDPOINT}}/{id}", (Guid id, HttpContext ctx, I{{GatewayInterfaceV1}} serviceV1) =>
{
    ctx.Response.Headers["Sunset"] = "{{SUNSET_DATE}}";
    ctx.Response.Headers["Deprecation"] = "true";
    return Results.Ok(serviceV1.Find(id));
});
```

## CI/CD checklist
- [ ] Consumer-driven contract tests (Pact or equivalent) → contracts pass before merge
- [ ] `rg "\[Obsolete\]" src/ | rg -v "// .*removed"` → every `[Obsolete]` has a removal date
- [ ] New endpoint → OpenAPI spec updated + consumer review
- [ ] `Sunset` header present on every deprecated v1 endpoint
- [ ] No field removed without a {{DEPRECATION_PERIOD}} deprecation window
