import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DashboardService } from '../../core/api/entities/site.services';
import { DashboardStats } from '../../services/orizzonti-api.service';
import {
  PageHeaderComponent,
  StatCardComponent,
  StatusTagComponent,
  Tone,
} from '../../shared/ui';

const STATUS_TONES: Readonly<Record<string, Tone>> = {
  new: 'success',
  reviewed: 'info',
  accepted: 'success',
  rejected: 'danger',
};

@Component({
  selector: 'app-overview-page',
  standalone: true,
  imports: [PageHeaderComponent, StatCardComponent, StatusTagComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './overview-page.component.html',
  styleUrls: ['../pages/page-common.scss', './overview-page.component.scss'],
})
export class OverviewPageComponent implements OnInit {
  private readonly dashboard = inject(DashboardService);

  protected readonly stats = signal<DashboardStats | null>(null);
  protected readonly loading = signal(true);
  protected readonly failed = signal(false);

  protected readonly bars = computed(() => {
    const rows = this.stats()?.requestsByCourse ?? [];
    const max = Math.max(1, ...rows.map((row) => row.count));
    return rows.map((row) => ({ ...row, percent: Math.round((row.count / max) * 100) }));
  });

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.failed.set(false);
    this.dashboard.stats().subscribe({
      next: (stats) => {
        this.stats.set(stats);
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      },
    });
  }

  protected tone(status: string): Tone {
    return STATUS_TONES[status] ?? 'neutral';
  }
}
