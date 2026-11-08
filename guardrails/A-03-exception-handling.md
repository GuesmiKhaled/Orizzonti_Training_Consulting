---
id: "A-03"
title: "Exception handling — structured format, zero stack in the response"
severity: "🔴 BLOCKER (stack trace in response / swallowed exception)"
applies_to: [backend]
triggers:
  - "Any endpoint that can return an error in {{MODULE_CIBLE}}"
  - "Any business or technical exception not mapped to a consistent HTTP code"
  - "Any error response without a standardized format"
version: "1.0"
---

## Risk
Stack trace in the HTTP response → leaks class names, namespaces, versions → attack surface.
Without a standardized format → the frontend cannot distinguish a 4xx (definitive) from a 5xx (retryable) → the user double-clicks → duplicate action.

## Rules

- Every endpoint → global exception handling that intercepts **all** exceptions.
- Mandatory format: `{{ERROR_FORMAT}}` (RFC 9457 ProblemDetails) with:
  - `type` / `code`: error type identifier.
  - `title` / `message`: short human-readable message.
  - `status`: HTTP code.
  - `detail`: explanation without internal technical information.
- 4xx → definitive client error, not retryable. Never a stack in the response.
- 5xx → potentially retryable technical error. Stack in the **logs**, never in the response.
- Empty `catch (Exception) { }` → absolute BLOCKER.

## Anti-pattern
```csharp
// ❌ BLOCKER — stack trace in the response (Developer Exception Page left enabled outside Development)
app.MapGet("/{{ENDPOINT}}/{id}", async (int id, Service service) =>
    Results.Ok(await service.Find(id))); // unhandled exception → stack exposed

// ❌ BLOCKER — swallowed exception
try
{
    await _externalService.ProcessAsync(id);
}
catch (Exception)
{
    // nothing — silent inconsistent state
}
```

## Compliant pattern
```csharp
// ✅ Program.cs — RFC 9457 ProblemDetails with custom error fields
builder.Services.AddProblemDetails(o => o.CustomizeProblemDetails = ctx =>
{
    if (ctx.Exception is {{Entity}}NotFoundException notFound)
    {
        var problem = ctx.ProblemDetails;
        problem.Status = StatusCodes.Status404NotFound;
        problem.Title = "{{Entity}} Not Found";
        problem.Detail = $"No {{entity}} found with id: {notFound.Id}"; // no stack
        problem.Extensions["errorCode"] = "{{ENTITY_UPPER}}_NOT_FOUND";
    }
    else if (ctx.Exception is {{BusinessRuleException}} rule)
    {
        var problem = ctx.ProblemDetails;
        problem.Status = StatusCodes.Status422UnprocessableEntity;
        problem.Title = "Business Rule Violated";
        problem.Detail = rule.PublicMessage; // never the raw ex.Message
        problem.Extensions["errorCode"] = rule.ErrorCode; // 4xx → not retryable
    }
    else if (ctx.Exception is {{TechnicalException}} tech)
    {
        _logger.LogError("Technical error on {Path}", ctx.HttpContext.Request.Path, tech); // stack in LOG only
        var problem = ctx.ProblemDetails;
        problem.Status = StatusCodes.Status503ServiceUnavailable;
        problem.Title = "Service Temporarily Unavailable";
        problem.Detail = "Please retry in a few seconds."; // no stack
        problem.Extensions["errorCode"] = "SERVICE_UNAVAILABLE"; // 5xx → retryable
    }
});
```

## CI/CD checklist
- [ ] `curl /{{ENDPOINT}}/nonexistent` → structured JSON response (type, title, status, errorCode) — 0 stack
- [ ] `rg "catch\s*\([^)]*Exception[^)]*\)\s*\{\s*\}" src/` → 0 empty catches
- [ ] Test: 500 → log contains the stack; HTTP response does not contain `stackTrace`
- [ ] Test: 4xx → retryable=false; 5xx → retryable=true (frontend client side)
