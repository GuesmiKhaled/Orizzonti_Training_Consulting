---
id: "D-02"
title: "{{ANALYTICS_DB}} — analytical queries & column-oriented modeling"
severity: "🟡 WARNING (row-oriented query / unfiltered scan)"
applies_to: [backend]
triggers:
  - "Any {{ANALYTICS_DB}} query for reports and analytics in {{MODULE_CIBLE}}"
  - "Any INSERT into {{ANALYTICS_DB}} from a real-time flow"
  - "Any join or UPDATE/DELETE on {{ANALYTICS_DB}}"
version: "1.0"
---

## Risk
A row-oriented query on {{ANALYTICS_DB}} (UPDATE, DELETE, `SELECT *`) on {{DATA_VOLUME}} → full scan, I/O saturation, impact on critical reports.
Row-by-row INSERT → fragmentation → progressive read degradation.

## Rules

- {{ANALYTICS_DB}} = OLAP, analytical reads — never transactional reads (use {{TRANSACTIONAL_DB}} for that).
- `SELECT` → always explicit columns (never `SELECT *`), filter on the index/partition columns.
- `INSERT` → batched (≥ `{{BATCH_SIZE}}` rows or ≥ `{{BATCH_INTERVAL}}`) — never row by row.
- No frequent `UPDATE`/`DELETE` → design append-only + versioning/partitioning.
- Partitioning: by `{{PARTITION_FIELD}}` (e.g. month, region) for large tables.

## Anti-pattern
```sql
-- ❌ WARNING — SELECT * on {{ANALYTICS_DB}}
SELECT * FROM {{ANALYTICS_TABLE}} WHERE {{FILTER_FIELD}} = '{{FILTER_VALUE}}';

-- ❌ WARNING — row-by-row INSERT
INSERT INTO {{ANALYTICS_TABLE}} VALUES (...); -- × {{INSERT_VOLUME}} = fragmentation

-- ❌ WARNING — frequent UPDATE (expensive)
UPDATE {{ANALYTICS_TABLE}} SET status = '{{NEW_STATUS}}' WHERE id = :id;
```

## Compliant pattern
```sql
-- ✅ SELECT useful columns + partition filter
SELECT
    {{GROUP_BY_FIELD}},
    SUM({{METRIC_FIELD}}) AS total,
    COUNT(*) AS count
FROM {{ANALYTICS_TABLE}}
WHERE {{PARTITION_FIELD}} = {{PARTITION_VALUE}}  -- partition filter
  AND {{FILTER_FIELD}} = '{{FILTER_VALUE}}'
GROUP BY {{GROUP_BY_FIELD}}
ORDER BY {{GROUP_BY_FIELD}};
```

```csharp
// ✅ Batch INSERT
var batch = new List<{{EventType}}>({{BATCH_SIZE}});
void Enqueue({{EventType}} evt)
{
    batch.Add(evt);
    if (batch.Count >= {{BATCH_SIZE}} || _stopwatch.Elapsed > {{BATCH_INTERVAL_MS}})
    {
        _analyticsClient.InsertBatch("{{ANALYTICS_TABLE}}", batch);
        batch.Clear();
    }
}
```

```sql
-- ✅ Append-only + versioning instead of UPDATE
CREATE TABLE {{ANALYTICS_TABLE}} (
    id UUID,
    status VARCHAR,
    version INT,    -- incremented on every change
    {{TIMESTAMP_FIELD}} TIMESTAMP
) ENGINE = {{ANALYTICS_ENGINE}}(version)   -- e.g. ReplacingMergeTree, or partition + MERGE
PARTITION BY {{PARTITION_EXPRESSION}}
ORDER BY ({{SORT_FIELDS}});
```

## CI/CD checklist
- [ ] `rg "SELECT \\*" src/ | rg -i "{{ANALYTICS_DB_KEYWORD}}"` → 0
- [ ] INSERTs on {{ANALYTICS_TABLE}} → verify batch size ≥ {{BATCH_SIZE}} rows
- [ ] No `UPDATE`/`DELETE` in scheduled analytical queries
- [ ] Test: report on {{DATA_VOLUME}} → < {{MAX_QUERY_TIME}} s (partition-filtered)
