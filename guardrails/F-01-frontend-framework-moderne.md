---
id: "F-01"
title: "{{FRONTEND_FRAMEWORK}} — modern components & reactive state management"
severity: "🟡 WARNING (deprecated patterns on new code)"
applies_to: [frontend]
triggers:
  - "Creation of a new {{FRONTEND_FRAMEWORK}} component in {{MODULE_CIBLE}}"
  - "Use of deprecated patterns ({{DEPRECATED_PATTERNS}}) on new code"
  - "State management by direct mutation instead of reactive patterns"
version: "1.0"
---

## Risk
Components using deprecated {{FRONTEND_FRAMEWORK}} patterns in {{MODULE_CIBLE}}: accumulated dependencies, slow change detection → perceptible UI latency on data-heavy screens.

## Rules

- Every new component → patterns recommended by {{FRAMEWORK_VERSION}} of {{FRONTEND_FRAMEWORK}}.
- Local state management → native reactive mechanism (`{{REACTIVE_STATE_MECHANISM}}`).
- Templates → modern syntax (`{{MODERN_TEMPLATE_SYNTAX}}`).
- Components without external state → optimized change-detection strategy (`{{CHANGE_DETECTION_STRATEGY}}`).

## Anti-pattern
```typescript
// ❌ WARNING — deprecated patterns on new code in {{MODULE_CIBLE}}
// {{DEPRECATED_PATTERN_EXAMPLE}}

// State management with Subject/BehaviorSubject when a Signal suffices
import { BehaviorSubject } from 'rxjs';
loading$ = new BehaviorSubject<boolean>(false);

// Deprecated syntax
// *ngIf="condition" instead of @if (condition)
// *ngFor="let item of items" instead of @for (item of items; track item.id)
```

## Compliant pattern
```typescript
// ✅ Component with modern {{FRONTEND_FRAMEWORK}} {{FRAMEWORK_VERSION}} patterns
@Component({
  selector: 'app-{{COMPONENT_NAME}}',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <{{LOADING_COMPONENT}} />
    } @else if (error()) {
      <{{ERROR_COMPONENT}} [message]="error()" />
    } @else {
      @for (item of items(); track item.id) {
        <{{ITEM_COMPONENT}} [item]="item" />
      }
    }
  `
})
export class {{COMPONENT_CLASS_NAME}} {
  loading = signal(false);
  error   = signal<string | null>(null);
  items   = signal<{{ITEM_TYPE}}[]>([]);
  count   = computed(() => this.items().length);
}
```

## CI/CD checklist
- [ ] `rg "{{DEPRECATED_PATTERN_GREP}}" src/{{FRONTEND_SRC_PATH}}/` → 0 on new components
- [ ] Every new component has `standalone: true` and `{{CHANGE_DETECTION_STRATEGY}}`
- [ ] Lint rule: no deprecated patterns in new files (ESLint rule)
