import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { a11yViolations } from '../../testing/a11y';
import { LanguageDetailPageComponent } from './language-detail-page.component';

const BASE = 'http://localhost:5007';

const LEVELS = [
  {
    id: 5,
    languageId: 1,
    cefrLevel: 'B1',
    examSessions: [
      {
        id: 9,
        examDate: '2026-12-10T09:00:00.000Z',
        registrationStartDate: '2026-11-01T09:00:00.000Z',
        registrationDeadline: '2026-11-30T09:00:00.000Z',
        location: 'Tunis',
        isBookable: true,
        bookingStatus: 'Open',
        placesLeft: 4,
      },
    ],
  },
];

describe('LanguageDetailPageComponent registration dialog', () => {
  let http: HttpTestingController;
  let fixture: ComponentFixture<LanguageDetailPageComponent>;
  let root: HTMLElement;

  const flushPage = (): void => {
    http.expectOne(`${BASE}/languages`).flush([{ id: 1, name: 'English', code: 'ENG' }]);
    http.expectOne(`${BASE}/languages/1/levels`).flush(LEVELS);
    fixture.detectChanges();
  };

  const subscribeButton = (): HTMLButtonElement =>
    Array.from(root.querySelectorAll<HTMLButtonElement>('button')).find((b) =>
      b.textContent?.includes('Subscribe'),
    ) as HTMLButtonElement;

  const dialog = (): HTMLElement | null => root.querySelector('[role="dialog"]');

  const openDialog = async (): Promise<void> => {
    subscribeButton().focus();
    subscribeButton().click();
    fixture.detectChanges();
    await fixture.whenStable();
  };

  const type = (id: string, value: string): void => {
    const input = root.querySelector<HTMLInputElement>(`#${id}`) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
  };

  const send = (): void => {
    root.querySelector<HTMLButtonElement>('button[form="registrationForm"]')?.click();
    fixture.detectChanges();
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { params: of({ id: '1' }) } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(LanguageDetailPageComponent);
    root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    fixture.detectChanges();
    flushPage();
  });

  afterEach(() => {
    root.remove();
    http.verify();
  });

  it('opens a labelled modal dialog and moves focus into it', async () => {
    await openDialog();
    const modal = dialog();
    expect(modal).not.toBeNull();
    expect(modal?.getAttribute('aria-modal')).toBe('true');
    const label = root.querySelector(`#${modal?.getAttribute('aria-labelledby')}`);
    expect(label?.textContent).toContain('Exam registration - B1');
    expect(modal?.contains(document.activeElement)).toBeTrue();
  });

  it('closes on Escape and gives focus back to the Subscribe button', async () => {
    await openDialog();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(dialog()).toBeNull();
    expect(document.activeElement).toBe(subscribeButton());
  });

  it('keeps Tab inside the dialog', async () => {
    await openDialog();
    type('regName', 'Leila M');
    type('regEmail', 'leila@example.com');
    fixture.detectChanges();
    const focusable = Array.from(
      root.querySelectorAll<HTMLElement>(
        '[role="dialog"] button:not([disabled]), [role="dialog"] input, [role="dialog"] textarea',
      ),
    );
    const last = focusable[focusable.length - 1];
    last.focus();
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    last.dispatchEvent(event);
    expect(event.defaultPrevented).toBeTrue();
    expect(dialog()?.contains(document.activeElement)).toBeTrue();
  });

  it('has no accessibility violations inside the open dialog', async () => {
    await openDialog();
    expect(await a11yViolations(dialog() as HTMLElement)).toEqual([]);
  });

  it('does not send an invalid request and announces the email problem', async () => {
    await openDialog();
    type('regName', 'Leila M');
    type('regEmail', 'nope');
    fixture.detectChanges();
    expect(root.querySelector('[role="alert"]')?.textContent).toContain('valid email');
    send();
    http.expectNone((r) => r.method === 'POST');
  });

  it('registers and shows the confirmation with a Close button', async () => {
    await openDialog();
    type('regName', 'Leila M');
    type('regEmail', 'leila@example.com');
    fixture.detectChanges();
    send();

    const req = http.expectOne(`${BASE}/languages/1/levels/5/exams/9/register`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(
      jasmine.objectContaining({ fullName: 'Leila M', email: 'leila@example.com' }),
    );
    req.flush({ id: 1, status: 'pending', message: 'Request received.' });
    http.expectOne(`${BASE}/languages/1/levels`).flush(LEVELS);
    fixture.detectChanges();

    expect(root.querySelector('[role="status"]')?.textContent).toContain('Request received.');
    const close = Array.from(root.querySelectorAll<HTMLButtonElement>('[role="dialog"] button')).find(
      (b) => b.textContent?.trim() === 'Close',
    );
    close?.click();
    fixture.detectChanges();
    expect(dialog()).toBeNull();
  });

  it('shows the server message inline when registration is refused', async () => {
    await openDialog();
    type('regName', 'Leila M');
    type('regEmail', 'leila@example.com');
    fixture.detectChanges();
    send();
    http
      .expectOne(`${BASE}/languages/1/levels/5/exams/9/register`)
      .flush({ message: 'This exam is fully booked.' }, { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();
    expect(root.querySelector('.alert-danger[role="alert"]')?.textContent).toContain('fully booked');
    expect(dialog()).not.toBeNull();
  });
});
