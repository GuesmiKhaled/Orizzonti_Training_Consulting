---
id: "D-03"
title: "Zero-downtime migrations — DB schema & backward compatibility"
severity: "🔴 BLOCKER (migration breaking the production version during rollout)"
applies_to: [backend]
triggers:
  - "Any migration renaming/dropping a column, changing a type or adding a NOT NULL constraint"
  - "Any ALTER TABLE, DROP COLUMN, RENAME COLUMN in {{MODULE_CIBLE}}"
  - "Any rolling deployment with a DB schema change"
version: "1.0"
---

## Risk
Rolling update: during {{ROLLOUT_DURATION}}, the old and the new code versions run in parallel on the same DB schema.
A `RENAME COLUMN` / `DROP COLUMN` breaks the old version instantly → errors in production before the rollout finishes → incident.

## Rules

**Expand-contract strategy (always):**
1. **Expand** (migration V1): add the new column (nullable), backfill the data, the new code writes both columns.
2. **Contract** (migration V2, next sprint): once the old version is out of prod, drop/rename the old column.

**Specific rules:**
- Never `NOT NULL` without `DEFAULT` on an existing column (table lock on large volume).
- `ADD COLUMN` → nullable or with `DEFAULT`.
- `DROP COLUMN` → only after 100% of traffic runs the new version.
- Index → created online (PostgreSQL: `CONCURRENTLY`, SQL Server: `WITH (ONLINE = ON)`, Oracle: `ONLINE`) — no exclusive table lock.
- Versioning: `YYYYMMDD_description` — never modify an already-applied migration.

## Anti-pattern
```sql
-- ❌ BLOCKER — immediate rename: breaks the old version
ALTER TABLE {{TABLE}} RENAME COLUMN {{OLD_COLUMN}} TO {{NEW_COLUMN}};

-- ❌ BLOCKER — NOT NULL without DEFAULT (long lock)
ALTER TABLE {{TABLE}} ADD COLUMN {{NEW_COLUMN}} {{TYPE}} NOT NULL;

-- ❌ BLOCKER — blocking index
CREATE INDEX idx_{{TABLE}}_{{COLUMN}} ON {{TABLE}}({{COLUMN}});
```

## Compliant pattern
```sql
-- ✅ Expand — V1: new nullable column + backfill
ALTER TABLE {{TABLE}} ADD COLUMN {{NEW_COLUMN}} {{TYPE}};
UPDATE {{TABLE}} SET {{NEW_COLUMN}} = {{OLD_COLUMN}};
-- Code V(n+1) writes both columns

-- ✅ Contract — V2 (next sprint, old version out of prod)
ALTER TABLE {{TABLE}} DROP COLUMN {{OLD_COLUMN}};

-- ✅ NOT NULL with DEFAULT — no lock
ALTER TABLE {{TABLE}} ADD COLUMN {{NEW_COLUMN}} {{TYPE}} NOT NULL DEFAULT {{DEFAULT_VALUE}};

-- ✅ Online index (per engine)
CREATE INDEX CONCURRENTLY idx_{{TABLE}}_{{COLUMN}} ON {{TABLE}}({{COLUMN}});          -- PostgreSQL
CREATE INDEX idx_{{TABLE}}_{{COLUMN}} ON {{TABLE}}({{COLUMN}}) WITH (ONLINE = ON);  -- SQL Server
CREATE INDEX idx_{{TABLE}}_{{COLUMN}} ON {{TABLE}}({{COLUMN}}) ONLINE;              -- Oracle
```

```
# Migration organization — {{MIGRATION_TOOL}} (EF Core migrations, Flyway, Liquibase...)
Migrations/
  20261106_01_add_{{NEW_COLUMN}}_to_{{TABLE}}.cs        (expand)
  20261204_01_drop_{{OLD_COLUMN}}.cs                    (contract)
```

## CI/CD checklist
- [ ] Every migration tested in staging with the **previous** code version (simulated rolling update)
- [ ] `rg "RENAME|DropColumn|DropColumnAsync" Migrations/` → mandatory manual review (previous sprint OK?)
- [ ] `rg "ADD COLUMN.*NOT NULL" migrations/ | rg -v "DEFAULT"` → 0
- [ ] Index → online creation on every table > {{MIN_TABLE_SIZE}} rows
- [ ] Rollback tested: return to the previous version without startup errors
