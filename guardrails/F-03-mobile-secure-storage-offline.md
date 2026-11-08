---
id: "F-03"
title: "Mobile — secure storage & idempotent offline sync"
severity: "🔴 BLOCKER (sensitive data in unencrypted storage / sync without idempotency)"
applies_to: [mobile]
triggers:
  - "Any sensitive data stored client-side in {{MODULE_CIBLE}}: {{SENSITIVE_DATA_TYPES}}"
  - "Any side-effect action initiated offline"
  - "Any data sync toward the server"
version: "1.0"
---

## Risk
`{{SENSITIVE_DATA_TYPES}}` in `{{INSECURE_STORAGE}}` (unencrypted) = readable on a rooted device → session hijack.
Side-effect sync without `{{IDEMPOTENCY_HEADER}}` + unstable network → double delivery → double effect.

## Rules

**Secure storage:**
- Sensitive data → `{{SECURE_STORAGE_LIB}}` (iOS Keychain / Android Keystore) only.
- Never: `{{INSECURE_STORAGE}}`, unencrypted local storage for sensitive data.
- Local database for the outbox → encrypted SQLite (`{{ENCRYPTED_DB_LIB}}`).

**Offline sync & idempotency:**
- Offline side-effect action → **persisted encrypted outbox** with `{{IDEMPOTENCY_HEADER}}` generated at enqueue time.
- Displayed state: "pending" — success is displayed only after **server confirmation**.
- Sync → same `{{IDEMPOTENCY_HEADER}}`, backoff + jitter + limit, server is the source of truth.
- Conflict → the server wins, the client re-syncs and alerts the user.

## Anti-pattern
```dart
// ❌ BLOCKER — sensitive data in unencrypted storage
final prefs = await {{INSECURE_STORAGE}}.getInstance();
await prefs.setString('{{SENSITIVE_KEY}}', sensitiveValue);

// ❌ BLOCKER — sync without idempotency
Future<void> syncPending() async {
  for (final op in pending) {
    await api.post('/{{ENDPOINT}}', op.toJson()); // every replay = potential double effect
  }
}
```

## Compliant pattern
```dart
// ✅ Secure storage
final storage = const {{SECURE_STORAGE_LIB}}();
await storage.write(key: '{{SENSITIVE_KEY}}', value: sensitiveValue);
// → iOS Keychain / Android Keystore AES-256

// ✅ Persisted outbox with {{IDEMPOTENCY_HEADER}}
Future<void> enqueue({{COMMAND}} cmd) async {
    final entry = OutboxEntry(
        id: Uuid().v4(),          // {{IDEMPOTENCY_HEADER}} generated at enqueue time
        payload: cmd.toJson(),
        status: OutboxStatus.queued,
    );
    await outboxDb.insert(entry); // encrypted DB
    uiState = '{{PENDING_MESSAGE}}'; // never "success" before confirmation
}

// ✅ Idempotent sync — same key, backoff, server is the source of truth
Future<void> syncOutbox() async {
    final pending = await outboxDb.fetchQueued();
    for (final entry in pending) {
        try {
            final resp = await apiWithBackoff.post('/{{ENDPOINT}}',
                headers: {'{{IDEMPOTENCY_HEADER}}': entry.id}, // same key
                body: entry.payload,
            );
            if (resp.isSuccess || resp.statusCode == 409) {
                await outboxDb.markSent(entry.id);
            }
        } catch (e) { /* retry handled by backoff */ }
    }
}
```

## CI/CD checklist
- [ ] `rg "{{INSECURE_STORAGE}}" lib/ | rg -i "{{SENSITIVE_GREP_PATTERN}}"` → 0
- [ ] Test: offline action → kill app → restart → 1 send only (same `{{IDEMPOTENCY_HEADER}}`)
- [ ] Test: network cut during sync → replay → 1 idempotent effect
- [ ] Test: data conflict → server wins, UI re-syncs and alerts
