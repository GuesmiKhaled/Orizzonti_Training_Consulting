---
id: "F-04"
title: "Error boundaries — zero white screen, zero exposed stack, structured error format"
severity: "🔴 BLOCKER (stack/PII shown to the user) — 🟡 WARNING (unhandled error state)"
applies_to: [frontend]
triggers:
  - "Any component calling the API in {{MODULE_CIBLE}}"
  - "Any error display to the user"
  - "Any empty / loading / intermediate state in the UI"
version: "1.0"
---

## Risk
White screen on {{HTTP_ERROR_CODE}} = the user thinks everything is lost → support call + potential double-click.
Stack trace in the UI → leak of technical information → attack surface.

## Rules

- Every API component handles **4 states**: loading (skeleton), success, empty, error.
- HTTP error → parse the structured format (`{{ERROR_FORMAT}}`):
  - 4xx → definitive client error, not retryable.
  - 5xx → technical error, retryable with backoff.
- Never show a stack trace, a raw HTTP code, or a technical message to the user.
- Intermediate state → visible indicator + reassuring message.
- UI retry → bounded (backoff + max {{MAX_RETRY}} attempts — card B-03).
- No sensitive data ({{SENSITIVE_DATA_TYPES}}) in error messages.

## Anti-pattern
```typescript
// ❌ BLOCKER — stack/technical message in the UI
this.{{SERVICE}}.getData().subscribe({
  error: (err) => {
    this.errorMsg = err.message; // may contain a stack trace or internal data
  }
});

// ❌ WARNING — empty state = white screen
@Component({ template: `<div>{{ items | async }}</div>` })
// No empty, loading or error handling at all
```

## Compliant pattern
```typescript
// ✅ Error handler with the structured format ({{ERROR_FORMAT}})
@Injectable()
export class ErrorHandler {
    categorize(err: HttpErrorResponse): UserFacingError {
        const problem = err.error as {{ERROR_RESPONSE_TYPE}};
        return {
            messageKey: this.toI18nKey(problem.{{ERROR_TYPE_FIELD}}, err.status),
            retryable:  err.status >= 500, // 4xx = definitive, 5xx = retryable
            action:     err.status >= 500 ? 'retry' : 'contact-support',
        };
    }
}

// ✅ Component — 4 states
@Component({
  template: `
    @if (loading()) { <{{LOADING_COMPONENT}} /> }
    @else if (error()) {
      <{{ERROR_COMPONENT}}
        [message]="error()!.messageKey | translate"
        [showRetry]="error()!.retryable"
        (retry)="reload()" />
    }
    @else if (items().length === 0) {
      <{{EMPTY_STATE_COMPONENT}} [message]="'{{EMPTY_MESSAGE_KEY}}'" />
    }
    @else {
      @for (item of items(); track item.id) { <{{ITEM_COMPONENT}} [item]="item" /> }
    }
    @if (hasPending()) {
      <{{PENDING_BANNER}} [message]="'{{PENDING_MESSAGE_KEY}}'" />
    }
  `
})
export class {{LIST_COMPONENT}} {
  loading    = signal(false);
  error      = signal<UserFacingError | null>(null);
  items      = signal<{{ITEM_TYPE}}[]>([]);
  hasPending = computed(() => this.items().some(i => i.status === '{{PENDING_STATUS}}'));
}
```

## CI/CD checklist
- [ ] Test: force {{HTTP_ERROR_CODE}} → localized message + Retry button (no white screen, no stack)
- [ ] Test: empty list → `{{EMPTY_MESSAGE_KEY}}` displayed (no white screen)
- [ ] Test: intermediate state → indicator + reassuring message
- [ ] Test: error response containing sensitive data → field not shown to the user
- [ ] `rg "err\.message|error\.stack" src/{{FRONTEND_SRC_PATH}}/ | rg -v "log|console"` → 0
