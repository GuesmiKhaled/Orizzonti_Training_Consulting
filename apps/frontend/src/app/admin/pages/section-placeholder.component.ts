import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

/** Landing page for a section that is planned but not built yet. */
@Component({
  selector: 'app-section-placeholder',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="panel">
      <h1>{{ title }}</h1>
      <p>This section is not available yet.</p>
    </section>
  `,
  styles: `
    .panel {
      display: grid;
      gap: 0.5rem;
      padding: 1.5rem;
      border-radius: var(--adm-radius-card);
      background: #fff;
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
    }
    h1 {
      margin: 0;
      font-size: 1.4rem;
    }
    p {
      margin: 0;
      color: #475569;
    }
  `,
})
export class SectionPlaceholderComponent {
  private readonly data = inject(ActivatedRoute).snapshot.routeConfig?.data;

  protected readonly title: string = this.data?.['breadcrumb'] ?? 'Section';
}
