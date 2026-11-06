---
id: "S-08"
title: "Encryption at rest — sensitive DB columns, files, backups"
severity: "🔴 BLOCKER (sensitive data unencrypted in the DB)"
applies_to: [backend]
triggers:
  - "Any new DB column storing {{SENSITIVE_DATA_TYPE}}"
  - "Any entity with a potentially sensitive field ({{SENSITIVE_FIELD_EXAMPLES}})"
  - "Any data export (DB backup, dump) without encryption"
version: "1.0"
---

## Risk
An unencrypted {{DATA_STORE}} dump containing `{{SENSITIVE_FIELD}}` → sensitive data immediately readable.
An unencrypted {{STORAGE}} backup = {{COMPLIANCE_STANDARD}} violation → compliance risk.

## Rules

- Sensitive columns ({{SENSITIVE_FIELD_EXAMPLES}}) → transparent encryption converter (EF Core `ValueConverter`).
- Algorithm: AES-256-GCM, random IV (12 bytes) **per value** — never ECB, never a fixed IV.
- Encryption key → secret manager ({{SECRET_STORE}}, annual rotation) — never in the application configuration.
- Backups → encrypted (`gpg --encrypt`, encrypted volume, or storage service with SSE).
- Verification: `SELECT {{SENSITIVE_FIELD}} FROM {{TABLE}}` → opaque result (never readable).

## Anti-pattern
```csharp
// ❌ BLOCKER — sensitive data in the DB in clear text
public class {{Entity}}
{
    [Column("{{SENSITIVE_FIELD}}")]
    public string SensitiveField { get; set; } = null!; // readable in a dump
}

// ❌ BLOCKER — AES-ECB (same plaintext → same ciphertext)
var ecb = Aes.Create();
ecb.Mode = CipherMode.ECB; // never ECB

// ❌ BLOCKER — hardcoded key
private static readonly byte[] Key = "hardcoded-key!".ToUtf8Bytes();
```

## Compliant pattern
```csharp
// ✅ EF Core ValueConverter — transparent AES-256-GCM
public sealed class AesGcmValueConverter(string base64Key) : ValueConverter<string, string>
{
    private readonly byte[] _key = Convert.FromBase64String(base64Key);
    // key from {{SECRET_STORE}} — never in the application configuration

    public AesGcmValueConverter(string base64Key)
        : base(Encrypt, Decrypt) { }

    private string Encrypt(string? plaintext)
    {
        if (plaintext is null) return null!;
        using var aesGcm = new AesGcm(_key, 16);
        Span<byte> iv = new byte[12];                       // random IV per value
        RandomNumberGenerator.Fill(iv);
        Span<byte> tag = new byte[16];
        var pt = Encoding.UTF8.GetBytes(plaintext);
        Span<byte> ct = new byte[pt.Length];
        aesGcm.Encrypt(iv, ct, tag, pt);
        var combined = new byte[12 + 16 + ct.Length];
        iv.CopyTo(combined.AsSpan(0, 12));
        tag.CopyTo(combined.AsSpan(12, 16));
        ct.CopyTo(combined.AsSpan(28));
        return Convert.ToBase64String(combined);
    }

    private string Decrypt(string? stored)
    {
        if (stored is null) return null!;
        var raw = Convert.FromBase64String(stored);
        var iv = raw.AsSpan(0, 12);
        var tag = raw.AsSpan(12, 16);
        var ct = raw.AsSpan(28);
        using var aesGcm = new AesGcm(_key, 16);
        Span<byte> pt = new byte[ct.Length];
        aesGcm.Decrypt(ct, pt, tag, iv);
        return Encoding.UTF8.GetString(pt);
    }
}

// ✅ Entity with transparent encryption
public class {{Entity}}
{
    [Column("{{SENSITIVE_FIELD}}_encrypted")]
    public string SensitiveField { get; set; } = null!;
}

// ✅ OnModelCreating — apply the converter
builder.Entity<{{Entity}}>()
    .Property(e => e.SensitiveField)
    .HasConversion(new AesGcmValueConverter(Environment.GetEnvironmentVariable("{{ENCRYPTION_KEY_ENV_VAR}}")!));
```

## CI/CD checklist
- [ ] `SELECT {{SENSITIVE_FIELD}} FROM {{TABLE}} LIMIT 1` → opaque Base64 result (integration test)
- [ ] Key `{{ENCRYPTION_KEY_ENV_VAR}}` in {{SECRET_STORE}}, absent from the application configuration
- [ ] AES-GCM — `rg "CipherMode\.ECB" src/` → 0
- [ ] Unique IV per value: two encryptions of the same plaintext → two different ciphertexts (test)
- [ ] Backups: `ls -la backups/` → all files encrypted (no clear dumps)
