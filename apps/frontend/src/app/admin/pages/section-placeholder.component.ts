import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

/**
 * Temporary landing page for sections that are being rebuilt phase by phase.
 * The classic dashboard keeps the existing functionality in the meantime.
 */
@Component({
  selector: 'app-section-placeholder',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="panel">
      <h1>{{ title }}</h1>
      <p>This section is being rebuilt and is not available in the new portal yet.</p>
      @if (legacySection) {
        <a
          class="btn btn-primary"
          routerLink="/admin/legacy"
          [queryParams]="{ section: legacySection }"
        >
          Open in the classic dashboard
        </a>
      }
    </section>
  `,
  styles: `
    .panel {
      display: grid;
      gap: 0.75rem;
      justify-items: start;
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
      color: #64748b;
    }
    .btn {
      padding: 0.55rem 1.2rem;
      border-radius: var(--adm-radius-pill);
      background: var(--adm-primary);
      color: #fff;
      font-weight: 600;
      text-decoration: none;
    }
  `,
})
export class SectionPlaceholderComponent {
  private readonly data = inject(ActivatedRoute).snapshot.routeConfig?.data;

  protected readonly title: string = this.data?.['breadcrumb'] ?? 'Section';
  protected readonly legacySection: string | undefined =
    this.data?.['legacySection'];
}
