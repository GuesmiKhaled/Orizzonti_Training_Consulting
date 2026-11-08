---
id: "S-04"
title: "Zero hardcoded secrets — code, configuration, Dockerfile, CI"
severity: "🔴 BLOCKER"
applies_to: [backend, frontend, mobile]
triggers:
  - "Literal password/secret/private-key/DSN/API-key in code, JSON/YAML config, Dockerfile, CI"
  - "Connection to {{DATA_STORE}} (DB, cache, queue) with clear-text credentials"
  - "API key, OAuth token or encryption key hardcoded in {{MODULE_CIBLE}}"
version: "1.0"
---

## Risk
A secret committed to git = exposed forever (git history cannot be wiped).
A clear-text DSN exposed via a diagnostics endpoint = access to {{DATA_STORE}} in production.

## Rules

- Every secret → environment variable or secret manager: `${{{SECRET_ENV_VAR}}}`.
- Never a literal value for: `password`, `secret`, `key`, `token`, `dsn`, `apiKey`, `privateKey`.
- `.env` files → out of git (`.gitignore`), provided via {{SECRET_STORE}}.
- Certificates, keystores → mounted volumes, never baked into the image.
- CI/CD: pipeline variables injected, never present in build logs.
- Local development → `dotnet user-secrets`; never a committed `appsettings.Development.json` with credentials.

## Anti-pattern
```json
// ❌ BLOCKER — DSN in clear text in the configuration
{
  "ConnectionStrings": {
    "Default": "Server={{DB_HOST}};Database={{DB_NAME}};User Id=sa;Password=SuperSecret123;"
  }
}
```

```csharp
// ❌ BLOCKER — hardcoded API key
private const string ApiKey = "sk-prod-abcd1234";
```

## Compliant pattern
```json
// ✅ appsettings.json — reference to environment variables
{
  "ConnectionStrings": {
    "Default": "{{DB_URL_ENV_VAR}}"
  }
}
```

```yaml
# ✅ Secret manager (Kubernetes example)
apiVersion: v1
kind: Secret
metadata:
  name: {{MODULE_CIBLE}}-secrets
type: Opaque
stringData:
  {{DB_PASSWORD_ENV_VAR}}: "{{ vault_lookup('path/to/secret') }}"
```

```csharp
// ✅ Program.cs — Key Vault with env-var override (ConnectionStrings__Default)
builder.Configuration.AddAzureKeyVault(new Uri(builder.Configuration["KeyVault:Uri"]!), new DefaultAzureCredential());
```

## CI/CD checklist
- [ ] `git-secrets --scan` or `trufflehog` in the pipeline → 0 secrets detected
- [ ] `rg "password\s*=\s*['\"][^\$]" src/` → 0 literal values
- [ ] Secret `{{MODULE_CIBLE}}-secrets` exists in {{SECRET_STORE}} for every environment
- [ ] No Dockerfile `ARG`/`ENV` containing a secret
