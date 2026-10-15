import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { LanguagesService } from '../../core/api/entities/language.services';
import { LanguageItem } from '../../services/orizzonti-api.service';
import { PageHeaderComponent, StatusTagComponent } from '../../shared/ui';
import { LanguageWizardComponent } from './wizard/language-wizard.component';
import { formatDate, summarize } from './language-format';

interface WizardRequest {
  readonly languageId: number | null;
  readonly step: number;
  readonly addLevel: boolean;
}

@Component({
  selector: 'app-languages-dashboard',
  standalone: true,
  imports: [LanguageWizardComponent, PageHeaderComponent, StatusTagComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './languages-dashboard.component.html',
  styleUrl: './languages-dashboard.component.scss',
})
export class LanguagesDashboardComponent implements OnInit {
  private readonly languagesApi = inject(LanguagesService);

  protected readonly languages = signal<readonly LanguageItem[]>([]);
  protected readonly loading = signal(true);
  protected readonly failed = signal(false);
  protected readonly wizard = signal<WizardRequest | null>(null);

  protected readonly cards = computed(() =>
    this.languages().map((language) => summarize(language)),
  );
  protected readonly formatDate = formatDate;

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.failed.set(false);
    this.languagesApi.list().subscribe({
      next: (languages) => {
        this.languages.set(languages);
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      },
    });
  }

  protected open(languageId: number | null, step = 0, addLevel = false): void {
    this.wizard.set({ languageId, step, addLevel });
  }
}
