---
name: engineering-lessons
description: "Living knowledge base of verified security, performance, correctness, and best-practice lessons learned while working on code. Consult it before implementing or reviewing code in any stack (.NET, ASP.NET Core, EF Core, SQL, Angular, Docker, payments and banking middleware, CI pipelines) so known pitfalls are not repeated, and use it whenever a new verified issue class, speed-up, or best practice is discovered and needs to be recorded. Use this skill whenever the user says 'remember this', 'add this to the rules/skills', 'lesson learned', or when you find a reusable security, performance, or code-quality insight."
---

# Engineering Lessons

A curated, verified, deduplicated catalog. Quality over quantity: a short accurate catalog is more useful than a long noisy one.

## Trigger On

- Starting work in a domain listed below: read that domain's reference file first.
- Finishing a task in which you found a verified, reusable lesson (see the capture rules in the global rules, section 7).
- The user asks to record, remember, or promote something into rules or skills.

## Workflow: Read

1. Identify the domain(s) of the task.
2. Read the matching file(s) in `references/`. Apply relevant entries; do not recite them to the user unless asked.
3. If an entry conflicts with the project's actual version or conventions, follow the project and note the discrepancy.

## Workflow: Capture

1. **Verify.** Reproduce, test, or benchmark it, or confirm it against an authoritative source. Record the evidence.
2. **Search for duplicates** in this skill, other skills, and the rules. Update an existing entry rather than adding a new one.
3. **Sanitize.** Remove secrets, real customer or payment data, internal hostnames/IPs, and proprietary logic. Use placeholders.
4. **Choose the destination** using the table below.
5. **Write the entry** in the template format, in the right domain file (create the file if missing and add it to the index).
6. **Report it** in the final response (title, destination). If the lesson belongs in the global rules, propose the text and wait for approval.

### Destination guide

| Lesson type | Goes to |
|---|---|
| One-line, universal, costly if violated | Global rules (needs approval) |
| Procedure with steps/code for a specific stack | The stack's skill, or this skill's domain file |
| Long pattern/anti-pattern or benchmark detail | `references/<domain>.md` here |
| Specific to one repository | That repo's project rule file |
| Unverified, one-off, or sensitive | Do not save |

### Entry template

```
### <Short title>  [Security | Performance | Correctness | Best practice]
- Applies to: <stack / version>
- Problem or opportunity: <1-2 sentences>
- Avoid: <minimal bad example>
- Prefer: <minimal good example>
- Why / impact: <risk removed or measured gain>
- Verified by: <test, benchmark, or source link> (<YYYY-MM-DD>)
```

## Workflow: Maintain

- Review the catalog when a framework or major dependency version changes; mark outdated entries with `Superseded:` and the date, or remove them.
- Merge near-duplicates. Keep each domain file under about 300 lines; split it when it grows beyond that, and keep a table of contents at the top.
- Never keep an entry whose evidence is missing.

## Domain Index

Create each file on first use.

- `references/security.md` — input validation, authN/authZ, secrets, logging hygiene, crypto, headers, dependency risk
- `references/performance.md` — queries, indexing, caching, async, payload size, bundle size, load behavior
- `references/dotnet.md` — C#, ASP.NET Core, Entity Framework Core, DI, HttpClient, configuration
- `references/sql.md` — SQL Server / Oracle queries, transactions, indexing, migrations
- `references/angular.md` — signals, change detection, routing, forms, bundle, accessibility
- `references/devops.md` — Docker, Bitbucket/Azure DevOps pipelines, deployment, observability
- `references/payments.md` — idempotency, retries, reconciliation, amounts and currency handling, audit logging (no real data)

## Deliver

- A verified, deduplicated, sanitized entry in the correct file
- A mention of it in the final response

## Validate

- Evidence is recorded and reproducible
- No duplicate or contradictory entry exists
- No secrets or real data are present
- The index lists every reference file
