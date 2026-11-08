---
id: "B-05"
title: "Messaging — guaranteed delivery, DLQ, domain events, in-transit encryption"
severity: "🔴 BLOCKER (side-effect event at-most-once / no DLQ / unencrypted) — 🟡 WARNING"
applies_to: [backend]
triggers:
  - "Any producer/consumer of messages: {{MESSAGE_BROKER}} (Kafka, RabbitMQ, Service Bus, etc.)"
  - "Any synchronous cross-service call that can be replaced by a domain event"
  - "Any topic/queue without encryption on a sensitive flow ({{COMPLIANCE_STANDARD}})"
version: "1.0"
---

## Risk
`{{DELIVERY_GUARANTEE}}=at-most-once` on a side-effect topic: message lost = operation lost without a trace.
Missing encryption on a sensitive topic: {{COMPLIANCE_STANDARD}} violation (unencrypted data in transit).
Synchronous cross-service HTTP call: if the target service is down → the whole operation fails → temporal coupling.

## Rules

**Delivery & DLQ:**
- Side-effect topic → `acks=all` + producer idempotence enabled (or equivalent on {{MESSAGE_BROKER}}).
- Side-effect consumer → **manual** commit **after** the idempotent effect (card B-02).
- Poison message → N failures → Dead Letter Queue `{{DLQ_TOPIC}}` + alert.
- Critical topics: `ReplicationFactor={{REPLICATION_FACTOR}}`, `MinInsyncReplicas={{MIN_ISR}}`.

**Domain events (decoupling):**
- Synchronous HTTP call to notify another service → replace with a domain event on {{MESSAGE_BROKER}}.
- Pattern: service A publishes `{{EVENT_NAME}}` → service B consumes (at-least-once + idempotence).

**In-transit encryption:**
- Sensitive topic → TLS ({{SECURITY_PROTOCOL}}) — never plaintext.
- Credentials → secret manager (card S-04).

## Anti-pattern
```csharp
// ❌ BLOCKER — producer without delivery guarantee
var conf = new ProducerConfig(); // Acks defaults to 1, no idempotence
await _producer.ProduceAsync("{{TOPIC}}", message);

// ❌ BLOCKER — commit before the effect
public async Task HandleAsync({{Event}} evt)
{
    await _consumer.CommitAsync(); // commit BEFORE the effect → double processing on crash
    await _service.ProcessAsync(evt);
}

// ❌ BLOCKER — sensitive topic in plaintext
var conf = new ProducerConfig { SecurityProtocol = SecurityProtocol.Plaintext };
```

## Compliant pattern
```csharp
// ✅ Side-effect producer — guaranteed delivery
var conf = new ProducerConfig
{
    Acks = Acks.All,
    EnableIdempotenceProducer = true,
    SecurityProtocol = SecurityProtocol.SaslSsl, // TLS
    SaslMechanism = SaslMechanism.ScramSha256
};

// ✅ Consumer — manual commit AFTER the effect
public async Task HandleAsync({{Event}} evt)
{
    if (!await _repository.ExistsByAsync(evt.Id)) // idempotence (card B-02)
        await _service.ProcessAsync(evt);
    await _consumer.CommitAsync(); // offset committed AFTER the effect
}
```

## CI/CD checklist
- [ ] `rg "SecurityProtocol" config/ | rg -i "Plaintext"` → 0 on sensitive topics
- [ ] Test: kill the consumer mid-processing → replay → 1 effect (at-least-once + idempotence)
- [ ] Test: poison message → DLQ `{{DLQ_TOPIC}}` + alert < 30 s
- [ ] Test: connection without TLS → rejected
- [ ] Side-effect topics: ReplicationFactor={{REPLICATION_FACTOR}}, MinInsyncReplicas={{MIN_ISR}}
