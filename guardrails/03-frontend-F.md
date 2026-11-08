# BLOCK F — FRONTEND (F-01 → F-03) — Angular 20+ edition

> Assumptions: Angular **20 or later**. Items marked *vX+* in the table depend on the exact installed version — check `@angular/core` in `package.json`. The Flutter mobile app is out of scope for this corpus.

---

## F-01 — Angular: modern components & reactive state
**Severity:** 🟡 WARNING (deprecated patterns on new code)
**Applies to:** frontend
**Triggers:** creation of a new Angular component in {{MODULE_CIBLE}}; use of legacy patterns (`*ngIf`, `*ngFor`, `@Input()`, NgModules, constructor DI, class-based guards/interceptors) on new code; state handled by direct mutation instead of reactive primitives.

### Risk
Legacy patterns accumulate dependencies (`CommonModule`, zone.js) and slow change detection → perceptible UI latency on data-heavy screens (transaction lists, statements).
Mutating arrays/objects in place under OnPush/zoneless does not refresh the view → stale balances shown to the user (a functional risk in banking UIs).

### Rules
- New components → patterns of the installed Angular version ({{FRAMEWORK_VERSION}}).
- Local/shared state → `signal()`, `computed()`, `linkedSignal()`; immutable updates (`items.update(l => [...l, x])`).
- Templates → built-in control flow (`@if`, `@for` **with `track item.id`**, `@switch`, `@defer`, `@let`). `track $index` only for static lists.
- Components → standalone (default; omit `standalone: true`), `input()` / `input.required()` / `output()` / `model()`, `inject()`, `host: {}` instead of `@HostBinding`.
- Change detection → `OnPush` (explicit up to v21, default from v22); zoneless (`provideZonelessChangeDetection()`, default for new v21+ apps).
- Async data → `resource()` / `httpResource()` / `rxResource()` (stable in v22) or `toSignal(http.get(...))` on older versions. RxJS stays for event streams, debouncing, orchestration.
- Functional guards, resolvers, interceptors (`CanActivateFn`, `ResolveFn`, `HttpInterceptorFn`). Lazy-load every feature route.
- No manual `.subscribe()` without teardown (`takeUntilDestroyed()` / `async` pipe / `toSignal`).
- TypeScript `strict` + `strictTemplates`; no `any`.
- **Banking UI rule:** amounts are display-only strings/minor units (rule B-01); never compute money with `number`.

| Feature | Version |
|---|---|
| Control flow, `@defer`, signal `input()/output()/model()`, standalone by default | all stable in 20 |
| Zoneless stable, `effect` stable, `linkedSignal` | 20 |
| Zoneless default, Vitest default | 21 |
| OnPush default, Signal Forms & resources stable | 22 |

### Anti-pattern
```typescript
// ❌ WARNING — legacy patterns on new code in {{MODULE_CIBLE}}
@Component({ selector: 'app-payments', templateUrl: './payments.component.html' })
export class PaymentsComponent implements OnInit, OnDestroy {
  @Input() accountId!: string;                       // use input.required<string>()
  @Output() selected = new EventEmitter<string>();   // use output<string>()
  loading$ = new BehaviorSubject<boolean>(false);    // a signal suffices
  items: Payment[] = [];
  private destroy$ = new Subject<void>();
  constructor(private api: PaymentsApi) {}           // use inject()
  ngOnInit() { this.api.list().pipe(takeUntil(this.destroy$)).subscribe(r => this.items = r); }  // in-place mutation
  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }
}
```
```html
<!-- ❌ -->
<div *ngIf="loading$ | async">…</div>
<app-row *ngFor="let p of items" [payment]="p"></app-row>
```

### Compliant pattern
```typescript
// ✅ Modern component (Angular 19+; add `changeDetection: ChangeDetectionStrategy.OnPush` before v22)
@Component({
  selector: 'app-{{COMPONENT_NAME}}',
  imports: [{{ITEM_COMPONENT_CLASS}}, {{LOADING_COMPONENT_CLASS}}, {{ERROR_COMPONENT_CLASS}}],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <{{LOADING_COMPONENT}} />
    } @else if (error()) {
      <{{ERROR_COMPONENT}} [message]="error()" />
    } @else {
      @for (item of items(); track item.id) {
        <{{ITEM_COMPONENT}} [item]="item" (selected)="selected.emit($event)" />
      } @empty {
        <p>{{ 'COMMON.EMPTY' | translate }}</p>
      }
    }
  `,
})
export class {{COMPONENT_CLASS_NAME}} {
  private readonly api = inject({{API_SERVICE}});

  readonly accountId = input.required<string>();
  readonly selected  = output<string>();

  protected readonly loading = signal(false);
  protected readonly error   = signal<string | null>(null);
  protected readonly items   = signal<{{ITEM_TYPE}}[]>([]);
  protected readonly count   = computed(() => this.items().length);
}
```
```bash
# ✅ Mechanical migration (commit between each step)
ng generate @angular/core:control-flow
ng generate @angular/core:standalone
ng generate @angular/core:inject
ng generate @angular/core:signal-input-migration
ng generate @angular/core:output-migration
# then review `track` expressions the schematic defaulted to $index
```

### CI/CD checklist
- [ ] `grep -rEn "\*ngIf|\*ngFor|\*ngSwitch|\[ngClass\]|\[ngStyle\]" src/{{FRONTEND_SRC_PATH}}/` → 0 on new components
- [ ] `grep -rEn "@Input\(|@Output\(|EventEmitter|NgModule" src/{{FRONTEND_SRC_PATH}}/` → 0 on new files
- [ ] `@for` without `track` → compile error (Angular enforces); `track $index` reviewed
- [ ] ESLint (`angular-eslint` + `@angular-eslint/prefer-on-push-component-change-detection`, `prefer-inject`, `prefer-signals`) → clean
- [ ] Every new component: `OnPush` (≤ v21) and no direct state mutation
- [ ] `strict` and `strictTemplates` enabled in `tsconfig`

---

## F-02 — XSS: sanitisation of dynamic content
**Severity:** 🔴 BLOCKER (unsanitised HTML injected into the DOM)
**Applies to:** frontend (+ backend for stored rich content)
**Triggers:** any `[innerHTML]` or `nativeElement.innerHTML/outerHTML` in {{MODULE_CIBLE}}; any `bypassSecurityTrustHtml/Script/Style/Url/ResourceUrl`; any display of rich content coming from the API or user input.

### Risk
Injection of unsanitised HTML → XSS: malicious script runs in the user's browser → session-token theft, data exfiltration, fraudulent payments initiated from the victim's session.
Angular sanitises `[innerHTML]` by default — the real danger is **bypassing** that protection, and direct DOM APIs.

### Rules
- Dynamic data → interpolation `{{ value }}` (auto-encoded). Never concatenate HTML.
- `[innerHTML]` → only with Angular's built-in sanitiser or after `DOMPurify` with a tag/attribute whitelist.
- `bypassSecurityTrust*` → BLOCKER except documented, **static**, internal HTML. Never on API/user data.
- No `ElementRef.nativeElement.innerHTML = …`, `Renderer2.setProperty(el, 'innerHTML', …)`, `document.write`, `eval`, `new Function`.
- URLs (`href`, `src`) built from data → validate scheme (`https:`/relative only); never `javascript:`.
- Rich content stored server-side → sanitise **on write** as well (.NET: `Ganss.Xss.HtmlSanitizer`) — defence in depth.
- Platform hardening: strict **CSP** (no `unsafe-inline`/`unsafe-eval`, nonce-based) and **Trusted Types** (`require-trusted-types-for 'script'`).
- Tokens: prefer HttpOnly + Secure + SameSite cookies (BFF) over `localStorage` — limits XSS blast radius.

### Anti-pattern
```typescript
// ❌ BLOCKER — bypass on API data
this.safeHtml = this.sanitizer.bypassSecurityTrustHtml(this.contentFromApi);

// ❌ BLOCKER — direct DOM write
this.el.nativeElement.innerHTML = `<b>${userInput}</b>`;
```
```html
<!-- ❌ BLOCKER if bypassed upstream -->
<div [innerHTML]="safeHtml"></div>
```

### Compliant pattern
```html
<!-- ✅ Interpolation: the framework encodes -->
<p>{{ contentFromApi }}</p>
<!-- ✅ innerHTML with Angular's default sanitiser (scripts/handlers stripped) -->
<div [innerHTML]="richText()"></div>
```
```typescript
// ✅ Rich HTML: DOMPurify with whitelist BEFORE binding; no bypass needed for this tag set
import DOMPurify from 'dompurify';

readonly richText = computed(() =>
  DOMPurify.sanitize(this.rawHtml(), {
    ALLOWED_TAGS: ['b', 'i', 'p', 'br', 'strong', 'em', 'ul', 'li'],
    ALLOWED_ATTR: [],                       // no onerror, href, style…
  }));

// ✅ URL scheme validation
const safeUrl = (u: string) => /^(https:\/\/|\/)/i.test(u) ? u : '#';
```
```csharp
// ✅ Server-side defence in depth (.NET)
var sanitizer = new HtmlSanitizer();                         // Ganss.Xss
sanitizer.AllowedTags.Clear(); foreach (var t in new[]{"b","i","p","br","strong","em"}) sanitizer.AllowedTags.Add(t);
sanitizer.AllowedAttributes.Clear();
var clean = sanitizer.Sanitize(input.Html);
```
```
# ✅ CSP header (ASP.NET Core / reverse proxy)
Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-{{NONCE}}'; object-src 'none'; base-uri 'self'; require-trusted-types-for 'script'
```

### CI/CD checklist
- [ ] `grep -rEn "innerHTML|outerHTML|document\.write|insertAdjacentHTML" src/{{FRONTEND_SRC_PATH}}/` → each occurrence documented and sanitised
- [ ] `grep -rn "bypassSecurityTrust" src/` → 0 on values coming from API/user
- [ ] ESLint `@angular-eslint/template/no-inline-styles` + `no-unsanitized` plugin → clean
- [ ] Test: payload `<img src=x onerror=alert(1)>` in a field → encoded/stripped, not executed
- [ ] CSP header present in staging responses (`curl -I`), no `unsafe-inline`

---

## F-03 — Error boundaries: no blank screen, no exposed stack, structured error format
**Severity:** 🔴 BLOCKER (stack/PII shown to the user) — 🟡 WARNING (unhandled error state)
**Applies to:** frontend
**Triggers:** any component calling the API in {{MODULE_CIBLE}}; any error display to the user; any empty / loading / intermediate state in the UI.

### Risk
Blank screen on {{HTTP_ERROR_CODE}} = user thinks everything is lost → support call + potential double click (double payment).
Stack trace in the UI → technical information leak → attack surface.

### Rules
- Every API-backed component handles **4 states**: loading (skeleton), success, empty, error.
- HTTP errors → parse the structured format (`{{ERROR_FORMAT}}` = RFC 9457 `ProblemDetails`):
  - 4xx → final client error, **not retryable** (except 408/429 with `Retry-After`).
  - 5xx / network (status 0) → technical, retryable with backoff.
- Never display a stack trace, bare HTTP code or technical message to the user — map `errorCode` to an i18n key.
- Intermediate state ("pending") → visible indicator + reassuring message.
- UI retry → bounded (backoff + jitter + max {{MAX_RETRY}} attempts — rule B-03). **Automatic retry only for safe/idempotent requests**; for an effectful POST, a manual "Retry" re-sends the **same** `{{IDEMPOTENCY_HEADER}}` (rule B-02) and the button is disabled while in flight.
- No sensitive data ({{SENSITIVE_DATA_TYPES}}) in an error message or log.
- Global safety net: a custom `ErrorHandler` (`provideBrowserGlobalErrorListeners()` / `ErrorHandler`) + a root error page — an uncaught error never leaves a blank screen.

### Anti-pattern
```typescript
// ❌ BLOCKER — technical message shown to the user
this.api.getData().subscribe({
  error: (err) => { this.errorMsg = err.message; }   // may contain stack/internal data
});
```
```html
<!-- ❌ WARNING — no loading / empty / error handling -->
<div>{{ items() }}</div>
```

### Compliant pattern
```typescript
// ✅ Error mapping from ProblemDetails
export interface UserFacingError { messageKey: string; retryable: boolean; action: 'retry' | 'contact-support'; }

@Injectable({ providedIn: 'root' })
export class ApiErrorMapper {
  categorize(err: HttpErrorResponse): UserFacingError {
    const problem = err.error as { type?: string; errorCode?: string } | null;
    const retryable = err.status === 0 || err.status >= 500 || err.status === 429;   // 4xx otherwise final
    return {
      messageKey: `ERRORS.${problem?.errorCode ?? (retryable ? 'TEMPORARY' : 'UNKNOWN')}`,
      retryable,
      action: retryable ? 'retry' : 'contact-support',
    };
  }
}

// ✅ Functional interceptor — correlation id out (A-04), error mapping in; never logs bodies
export const apiErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const mapper = inject(ApiErrorMapper);
  return next(req).pipe(catchError((e: HttpErrorResponse) => throwError(() => mapper.categorize(e))));
};

// ✅ Bounded retry for SAFE requests only (GET), with backoff + jitter
const retryWithJitter = <T>() => retry<T>({
  count: {{MAX_RETRY}},
  delay: (err, attempt) => (err as UserFacingError).retryable
    ? timer(Math.random() * Math.min(10_000, 500 * 2 ** attempt))        // full jitter
    : throwError(() => err),
});

// ✅ Component — 4 states
@Component({
  imports: [{{LOADING_COMPONENT_CLASS}}, {{ERROR_COMPONENT_CLASS}}, {{EMPTY_STATE_COMPONENT_CLASS}}, {{ITEM_COMPONENT_CLASS}}, {{PENDING_BANNER_CLASS}}, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) { <{{LOADING_COMPONENT}} /> }
    @else if (error(); as e) {
      <{{ERROR_COMPONENT}} [message]="e.messageKey | translate" [showRetry]="e.retryable" (retry)="reload()" />
    }
    @else if (items().length === 0) { <{{EMPTY_STATE_COMPONENT}} [message]="'{{EMPTY_MESSAGE_KEY}}' | translate" /> }
    @else {
      @for (item of items(); track item.id) { <{{ITEM_COMPONENT}} [item]="item" /> }
    }
    @if (hasPending()) { <{{PENDING_BANNER}} [message]="'{{PENDING_MESSAGE_KEY}}' | translate" /> }
  `,
})
export class {{LIST_COMPONENT}} {
  protected readonly loading = signal(false);
  protected readonly error   = signal<UserFacingError | null>(null);
  protected readonly items   = signal<{{ITEM_TYPE}}[]>([]);
  protected readonly hasPending = computed(() => this.items().some(i => i.status === '{{PENDING_STATUS}}'));
}

// ✅ Global safety net
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: unknown): void { /* send sanitised report (no payloads/PII) to monitoring, show generic banner */ }
}
// app.config.ts: { provide: ErrorHandler, useClass: GlobalErrorHandler }, provideHttpClient(withInterceptors([apiErrorInterceptor]))
```

### CI/CD checklist
- [ ] Test: force {{HTTP_ERROR_CODE}} → localised message + Retry button (no blank screen, no stack)
- [ ] Test: empty list → `{{EMPTY_MESSAGE_KEY}}` displayed
- [ ] Test: intermediate state → indicator + reassuring message
- [ ] Test: error response containing a sensitive field → not displayed to the user
- [ ] Test: effectful POST + user double-click → 1 request in flight, same idempotency key on retry
- [ ] `grep -rEn "err(or)?\.(message|stack)" src/{{FRONTEND_SRC_PATH}}/ | grep -v "log\|console"` → 0 in templates/UI state
