---
id: "S-05"
title: "SQL injection — zero concatenation in queries"
severity: "🔴 BLOCKER"
applies_to: [backend]
triggers:
  - "Any SQL/EF Core/Dapper query built by concatenation in {{MODULE_CIBLE}}"
  - "Any `LIKE` '%' + input + '%' or `string.Format` in a query"
  - "Any dynamic ORDER BY or GROUP BY built from a user parameter"
version: "1.0"
---

## Risk
Concatenation in a SQL query = possible injection → exfiltration of the {{TABLE}} table, data deletion, privilege escalation in {{MODULE_CIBLE}}.
On a sensitive database ({{DATA_CLASSIFICATION}}), an injection = immediate compliance violation.

## Rules

- Any dynamic value in a query → bound parameter (`@param`, `?`, `$1`).
- Dynamic `ORDER BY`/`GROUP BY` → enum allowlist, never concatenation of the input.
- Dynamic `LIKE` → `LIKE @pattern` with the `%` added on the application side (`@pattern = "%" + input + "%"`).
- No `string.Format`/interpolation `$"..."`/concatenation `+` to build a query.

## Anti-pattern
```csharp
// ❌ BLOCKER — direct injection
var query = $"SELECT * FROM {{TABLE}} WHERE user_id = '{userId}'";
// userId = "' OR '1'='1" → total exfiltration

// ❌ BLOCKER — injectable ORDER BY
var sql = $"SELECT * FROM {{TABLE}} ORDER BY {sortField}";
// sortField = "1; DROP TABLE {{TABLE}}"
```

## Compliant pattern
```csharp
// ✅ EF Core — LINQ is always parameterized
var items = await _db.{{Entity}}s
    .Where(e => e.UserId == userId && e.Status == status)
    .ToListAsync(ct);

// ✅ Raw SQL (Dapper) — bound parameters
var rows = await connection.QueryAsync<{{Dto}}>(
    "SELECT id, reference FROM {{TABLE}} WHERE user_id = @userId",
    new { userId });

// ✅ ORDER BY — whitelist
public enum SortField { CreatedAt, Amount }

public static SortField FromString(string s) =>
    Enum.TryParse<SortField>(s, ignoreCase: true, out var field) ? field : SortField.CreatedAt;
// never the raw input

// ✅ LIKE — % in the application, bound parameter
var results = await _db.{{Entity}}s
    .Where(e => e.Reference.Contains(pattern)) // EF translates to LIKE with a parameter
    .ToListAsync(ct);
// call: Search("%" + userInput.Trim() + "%")
```

## CI/CD checklist
- [ ] `rg "\\$\".*SELECT|string\.Format\(.*SELECT" src/` → 0 concatenation in queries
- [ ] Sonar S2077 (C#) → 0 open issues or "Safe" with a comment
- [ ] Injection test: `userId = "' OR '1'='1"` → 0 rows, never all rows
