---
id: "S-01"
title: "SBOM, licenses & CVE scan"
severity: "🔴 BLOCKER (strong copyleft / CVE ≥ 9.0) — 🟡 WARNING (unknown / CVE 7-8.9)"
applies_to: [backend, frontend, mobile]
triggers:
  - "Dependency add/update: {{PACKAGE_MANAGER_FILE}} (*.csproj, Directory.Packages.props, package.json, go.mod)"
  - "Trivy/Grype/Dependabot/`dotnet audit` report flagging a CVE on a dependency of {{MODULE_CIBLE}}"
version: "1.0"
---

## Risk
A contaminating AGPL/GPL dependency forces opening all of {{MODULE_CIBLE}}'s proprietary code under the same license.
A dependency with a CVE CVSS ≥ 9.0 is exploitable as soon as merged — no application-level control protects against an RCE in the library.

## Rules

- **Blocked licenses**: AGPL, GPL, LGPL without a written exception, closed proprietary, SSPL.
- **Allowed licenses**: MIT, Apache 2.0, BSD, ISC, MPL 2.0 (module isolation).
- **CVE CVSS ≥ 9.0** → BLOCKER: patch or replace before merge.
- **CVE CVSS 7.0–8.9** → WARNING: patch in the current sprint, TL justification required.
- **CVE < 7.0** → track, follow up in the backlog.
- Never a `LATEST` or `*` version on a critical dependency of {{MODULE_CIBLE}} (centralized versioning in `Directory.Packages.props`).

## Anti-pattern
```xml
<!-- ❌ BLOCKER — contaminating GPL license in {{MODULE_CIBLE}} -->
<PackageReference Include="some-gpl-lib" Version="2.1" /> <!-- GPL license incompatible with the proprietary license -->

<!-- ❌ BLOCKER — known CVE CVSS 9.8 -->
<PackageReference Include="log4j-core" Version="2.14.1" /> <!-- CVE-2021-44228 (Log4Shell) -->
```

## Compliant pattern
```bash
# ✅ Mandatory CI checks on {{MODULE_CIBLE}}
dotnet list package --vulnerable --include-transitive
dotnet audit --fail-on critical
trivy fs --severity HIGH,CRITICAL --exit-code 1 .
grype . --fail-on high

# ✅ License report
license-checker --failOn "GPL;AGPL;LGPL"
```

## CI/CD checklist
- [ ] `dotnet audit` + `trivy fs --severity CRITICAL --exit-code 1` → 0 results in CI on {{MODULE_CIBLE}}
- [ ] Every new dependency audited: license on the allowed list
- [ ] CVE CVSS ≥ 9.0 → PR blocked until patched
- [ ] Dependencies published ≥ 7 days ago (supply-chain protection)
