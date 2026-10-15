import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../../core/api/api.config';
import { LanguageItem } from '../../services/orizzonti-api.service';
import { ExamsPageComponent } from './exams-page.component';
import { LanguagesDashboardComponent } from './languages-dashboard.component';
import { LevelsPageComponent } from './levels-page.component';

const BASE = 'http://api.test';
const FUTURE = new Date(Date.now() + 30 * 86400000).toISOString();

const LANGUAGES: LanguageItem[] = [
  {
    id: 1,
    name: 'English',
    code: 'ENG',
    isActive: true,
    levels: [
      {
        id: 5,
        cefrLevel: 'A1',
        price: '500',
        courseHours: '120',
        examSessions: [
          {
            id: 9,
            examDate: FUTURE,
            registrationStartDate: '2026-01-01T00:00:00Z',
            registrationDeadline: '2026-02-01T00:00:00Z',
            bookingStatus: 'Open',
            isBookable: true,
            maxParticipants: 10,
            placesLeft: 4,
          },
        ],
      },
    ],
  },
  { id: 2, name: 'French', code: 'FRA', isActive: true, levels: [] },
];

describe('languages admin pages', () => {
  let http: HttpTestingController;
  let root: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    root?.remove();
    http.verify();
  });

  const mount = <T>(type: new () => T): ComponentFixture<T> => {
    const fixture = TestBed.createComponent(type);
    root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    fixture.detectChanges();
    http.expectOne(`${BASE}/languages`).flush(LANGUAGES);
    fixture.detectChanges();
    return fixture;
  };

  const clickText = (selector: string, text: string): void => {
    const target = Array.from(root.querySelectorAll<HTMLButtonElement>(selector)).find((b) =>
      b.textContent?.includes(text),
    );
    target?.click();
  };

  describe('dashboard', () => {
    it('renders one card per language with counts and next exam, plus an add card', () => {
      mount(LanguagesDashboardComponent);
      const cards = root.querySelectorAll('article.card');
      expect(cards.length).toBe(2);
      expect(cards[0].textContent).toContain('English');
      expect(cards[0].querySelector('.levels strong')?.textContent).toBe('1');
      expect(cards[0].querySelector('.exams strong')?.textContent).toBe('1');
      expect(cards[0].querySelector('.next')?.textContent).not.toContain('None');
      expect(cards[1].querySelector('.next')?.textContent).toContain('None scheduled');
      expect(root.querySelector('button.card.add')).not.toBeNull();
    });

    it('opens the create wizard from Add language', () => {
      const fixture = mount(LanguagesDashboardComponent);
      clickText('button', 'Add language');
      fixture.detectChanges();
      expect(root.querySelector('app-language-wizard')).not.toBeNull();
      expect(root.querySelector('app-language-wizard h2')?.textContent).toContain('Add language');
    });

    it('opens the edit wizard on the right step for + Level and + Exam', () => {
      const fixture = mount(LanguagesDashboardComponent);
      clickText('.actions .link', '+ Level');
      fixture.detectChanges();
      http.expectOne(`${BASE}/languages/1`).flush(LANGUAGES[0]);
      fixture.detectChanges();
      expect(root.querySelector('app-levels-step')).not.toBeNull();
      expect(root.querySelectorAll('app-level-card').length).toBe(2);
    });

    it('shows an error with a retry when loading fails', () => {
      const fixture = TestBed.createComponent(LanguagesDashboardComponent);
      root = fixture.nativeElement as HTMLElement;
      fixture.detectChanges();
      http
        .expectOne(`${BASE}/languages`)
        .flush({}, { status: 500, statusText: 'Error' });
      fixture.detectChanges();
      expect(root.querySelector('[role="alert"]')?.textContent).toContain('Retry');
      clickText('.link', 'Retry');
      http.expectOne(`${BASE}/languages`).flush(LANGUAGES);
      fixture.detectChanges();
      expect(root.querySelectorAll('article.card').length).toBe(2);
    });
  });

  describe('levels page', () => {
    it('lists levels with their language and deletes after confirmation', () => {
      const fixture = mount(LevelsPageComponent);
      expect(root.querySelectorAll('tbody tr').length).toBe(1);
      expect(root.querySelector('tbody')?.textContent).toContain('English');

      clickText('tbody .row-actions button', 'Delete');
      fixture.detectChanges();
      expect(root.querySelector('app-confirm-dialog')).not.toBeNull();
      http.expectNone(`${BASE}/languages/1/levels/5`);

      clickText('app-confirm-dialog footer button', 'Delete');
      const del = http.expectOne(`${BASE}/languages/1/levels/5`);
      expect(del.request.method).toBe('DELETE');
      del.flush({ deleted: true, id: 5 });
      http.expectOne(`${BASE}/languages`).flush(LANGUAGES);
    });
  });

  describe('exams page', () => {
    it('shows level, places and status, and deletes under the right level', () => {
      const fixture = mount(ExamsPageComponent);
      const row = root.querySelector('tbody tr');
      expect(row?.textContent).toContain('English');
      expect(row?.textContent).toContain('A1');
      expect(row?.textContent).toContain('4 of 10 left');
      expect(row?.querySelector('app-status-tag')?.textContent).toContain('Open');

      clickText('tbody .row-actions button', 'Delete');
      fixture.detectChanges();
      clickText('app-confirm-dialog footer button', 'Delete');
      const del = http.expectOne(`${BASE}/languages/1/levels/5/exams/9`);
      expect(del.request.method).toBe('DELETE');
      del.flush({ deleted: true, id: 9 });
      http.expectOne(`${BASE}/languages`).flush(LANGUAGES);
    });

    it('opens the wizard on the exams step when editing', () => {
      const fixture = mount(ExamsPageComponent);
      clickText('tbody .row-actions button', 'Edit');
      fixture.detectChanges();
      http.expectOne(`${BASE}/languages/1`).flush(LANGUAGES[0]);
      fixture.detectChanges();
      expect(root.querySelector('app-exams-step')).not.toBeNull();
    });
  });
});
