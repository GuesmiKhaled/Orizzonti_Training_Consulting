---
id: "F-02"
title: "XSS — sanitization of dynamic content"
severity: "🔴 BLOCKER (unsanitized HTML injected into the DOM)"
applies_to: [frontend]
triggers:
  - "Any `[innerHTML]`, `outerHTML`, `dangerouslySetInnerHTML` in {{MODULE_CIBLE}}"
  - "Any sanitization bypass (`bypassSecurityTrustHtml`, `__dangerouslySetHTML`)"
  - "Any display of rich content coming from the API or a user input"
version: "1.0"
---

## Risk
Injection of unsanitized HTML → XSS: malicious script executed in the user's browser → session token theft, data exfiltration, fraud.

## Rules

- `[innerHTML]` / `dangerouslySetInnerHTML` → sanitize via `{{SANITIZER}}` or never use it for dynamic data.
- Sanitization bypass → BLOCKER except documented static internal HTML content.
- User data → automatic framework interpolation (`{{ value }}` in Angular, JSX text in React) — the framework encodes automatically.
- External rich content → `DOMPurify` library + allowlist of permitted tags.

## Anti-pattern
```typescript
// ❌ BLOCKER — direct XSS
// Angular
template: `<div [innerHTML]="contentFromApi"></div>` // contentFromApi not sanitized

// React
<div dangerouslySetInnerHTML={{ __html: userContent }} /> // userContent not sanitized

// ❌ BLOCKER — bypass without sanitization
const unsafe = this.sanitizer.bypassSecurityTrustHtml(userInput);
```

## Compliant pattern
```typescript
// ✅ Interpolation — the framework sanitizes automatically
// Angular
template: `<p>{{ contentFromApi }}</p>`

// React
<p>{contentFromApi}</p>

// ✅ Rich HTML content — DOMPurify before rendering
import DOMPurify from 'dompurify';

const safeHtml = DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: ['b', 'i', 'p', 'br', 'strong', 'em'],
    ALLOWED_ATTR: []  // no attributes (no onerror, href, etc.)
});

// Angular: bypass only after the purge
const trusted = this.sanitizer.bypassSecurityTrustHtml(safeHtml);

// React: only after DOMPurify
<div dangerouslySetInnerHTML={{ __html: safeHtml }} />
```

## CI/CD checklist
- [ ] `rg "innerHTML|dangerouslySetInnerHTML|outerHTML" src/{{FRONTEND_SRC_PATH}}/` → every occurrence documented and sanitized
- [ ] `rg "bypassSecurityTrustHtml|bypassSecurityTrust" src/` → 0 on API-sourced values
- [ ] Test: `<img src=x onerror=alert(1)>` payload in a field → encoded, not executed in the DOM
