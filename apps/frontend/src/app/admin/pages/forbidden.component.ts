import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="panel">
      <h1>Access denied</h1>
      <p>Your role does not include permission to open this section.</p>
    </section>
  `,
  styles: `
    .panel {
      padding: 1.5rem;
      border-radius: var(--adm-radius-card);
      background: #fff;
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
    }
    h1 {
      margin: 0 0 0.5rem;
      font-size: 1.4rem;
    }
    p {
      margin: 0;
      color: #64748b;
    }
  `,
})
export class ForbiddenComponent {}
