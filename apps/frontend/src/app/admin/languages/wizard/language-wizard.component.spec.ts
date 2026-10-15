import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../../../core/api/api.config';
import { ToastService } from '../../../core/toast/toast.service';
import { LanguageItem } from '../../../services/orizzonti-api.service';
import { LanguageWizardComponent } from './language-wizard.component';
import { LanguageWizardStore } from './language-wizard.store';

const BASE = 'http://api.test';

const LANGUAGE: LanguageItem = {
  id: 7,
  name: 'English',
  code: 'ENG',
  isActive: true,
  levels: [
    { id: 11, cefrLevel: 'A1', courseHours: '120', price: '$500.00', isActive: true, examSessions: [] },
    { id: 12, cefrLevel: 'A2', courseHours: '120', price: '$500.00', isActive: true, examSessions: [] },
  ],
};

describe('LanguageWizardComponent', () => {
  let fixture: ComponentFixture<LanguageWizardComponent>;
  let http: HttpTestingController;
  let root: HTMLElement;
  let closed: number;
  let saved: number;

  const store = (): LanguageWizardStore =>
    fixture.debugElement.injector.get(LanguageWizardStore);

  const mount = (inputs: Record<string, unknown> = {}): void => {
    fixture = TestBed.createComponent(LanguageWizardComponent);
    for (const [name, value] of Object.entries(inputs)) {
      fixture.componentRef.setInput(name, value);
    }
    closed = 0;
    saved = 0;
    fixture.componentInstance.closed.subscribe(() => closed++);
    fixture.componentInstance.saved.subscribe(() => saved++);
    root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    fixture.detectChanges();
  };

  const loadEdit = (initialStep = 0): void => {
    mount({ languageId: 7, initialStep });
    http.expectOne(`${BASE}/languages/7`).flush(LANGUAGE);
    fixture.detectChanges();
  };

  const button = (label: string): HTMLButtonElement | undefined =>
    Array.from(root.querySelectorAll<HTMLButtonElement>('footer button')).find((b) =>
      b.textContent?.includes(label),
    );

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

  describe('create', () => {
    it('shows the first step and does not advance with an invalid language', () => {
      mount();
      expect(root.querySelector('h2')?.textContent).toBe('Add language');
      expect(root.querySelector('.summary')?.textContent).toContain('Step 1 of 3');

      button('Next')?.click();
      fixture.detectChanges();
      expect(store().step()).toBe(0);
      expect(root.querySelector('app-language-step')).not.toBeNull();
    });

    it('advances through the steps and creates everything in one request', () => {
      mount();
      store().languageForm.controls.name.setValue('French');
      button('Next')?.click();
      fixture.detectChanges();
      expect(root.querySelector('app-levels-step')).not.toBeNull();

      const level = store().addLevel();
      level.form.patchValue({ courseHours: '90', price: '400' });
      button('Next')?.click();
      fixture.detectChanges();
      expect(root.querySelector('app-exams-step')).not.toBeNull();

      button('Create language')?.click();
      const req = http.expectOne(`${BASE}/languages/wizard`);
      expect(req.request.body.language.name).toBe('French');
      expect(req.request.body.levels[0].cefrLevel).toBe('A1');
      req.flush({ id: 9, name: 'French' });

      expect(saved).toBe(1);
      expect(closed).toBe(1);
      expect(TestBed.inject(ToastService).toasts()[0].message).toContain('French created');
    });

    it('does not let the stepper skip ahead past an invalid step', () => {
      mount();
      root.querySelectorAll<HTMLButtonElement>('.step-button')[2].click();
      fixture.detectChanges();
      expect(store().step()).toBe(0);
    });

    it('keeps the wizard open and re-enables saving when the request fails', () => {
      mount();
      store().languageForm.controls.name.setValue('French');
      store().step.set(2);
      fixture.detectChanges();
      button('Create language')?.click();
      http
        .expectOne(`${BASE}/languages/wizard`)
        .flush({ message: 'nope' }, { status: 400, statusText: 'Bad Request' });
      fixture.detectChanges();
      expect(closed).toBe(0);
      expect(button('Create language')?.disabled).toBeFalse();
    });

    it('asks before closing when something was typed', () => {
      mount();
      store().languageForm.controls.name.setValue('French');
      root.querySelector<HTMLButtonElement>('.close')?.click();
      fixture.detectChanges();
      expect(closed).toBe(0);
      expect(root.querySelector('app-confirm-dialog')).not.toBeNull();
    });
  });

  describe('edit', () => {
    it('loads the language, starts clean and disables saving', () => {
      loadEdit();
      expect(root.querySelector('h2')?.textContent).toBe('Edit English');
      expect(root.querySelector('.summary')?.textContent).toContain('No unsaved changes');
      expect(button('Save 0 changes')?.disabled).toBeTrue();
    });

    it('opens on the requested step', () => {
      loadEdit(1);
      expect(root.querySelector('app-levels-step')).not.toBeNull();
    });

    it('collapses unchanged levels and expands modified and new ones', () => {
      loadEdit(1);
      const cards = () => Array.from(root.querySelectorAll('app-level-card'));
      expect(cards().every((c) => c.querySelector('.grid') === null)).toBeTrue();

      store().levels()[1].form.controls.price.setValue('550');
      store().addLevel('B1');
      fixture.detectChanges();

      expect(cards()[0].querySelector('.grid')).toBeNull();
      expect(cards()[1].querySelector('.grid')).not.toBeNull();
      expect(cards()[1].querySelector('.card')?.classList).toContain('modified');
      expect(cards()[1].querySelector('.ui-field__was')?.textContent).toContain('was $500.00');
      expect(cards()[2].textContent).toContain('New');
      expect(cards()[2].textContent).toContain('Remove');
    });

    it('shows the unsaved change summary, per-step badge and save label', () => {
      loadEdit(1);
      store().levels()[1].form.controls.price.setValue('550');
      store().addLevel('B1');
      fixture.detectChanges();

      expect(root.querySelector('.summary')?.textContent).toContain(
        '2 unsaved changes: A2 price, B1 added',
      );
      expect(root.querySelectorAll('.changes').length).toBe(1);
      expect(root.querySelector('.changes')?.textContent?.trim()).toBe('2');
      expect(button('Save 2 changes')).toBeDefined();
    });

    it('resets a modified level from its card', () => {
      loadEdit(1);
      store().levels()[1].form.controls.price.setValue('550');
      fixture.detectChanges();
      const reset = Array.from(root.querySelectorAll<HTMLButtonElement>('app-level-card .link')).find(
        (b) => b.textContent?.includes('Reset'),
      );
      reset?.click();
      fixture.detectChanges();
      expect(store().totalChanges()).toBe(0);
    });

    it('saves only the changed fields with PATCH', () => {
      loadEdit();
      store().languageForm.controls.name.setValue('British English');
      fixture.detectChanges();
      button('Save 1 change')?.click();

      const req = http.expectOne(`${BASE}/languages/7`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ name: 'British English' });
      req.flush({});
      expect(saved).toBe(1);
      expect(closed).toBe(1);
    });

    it('confirms before discarding unsaved changes', () => {
      loadEdit();
      store().languageForm.controls.name.setValue('Other');
      fixture.detectChanges();
      button('Discard')?.click();
      fixture.detectChanges();
      expect(closed).toBe(0);

      const confirm = Array.from(
        root.querySelectorAll<HTMLButtonElement>('app-confirm-dialog footer button'),
      ).find((b) => b.textContent?.includes('Discard'));
      confirm?.click();
      expect(closed).toBe(1);
    });

    it('closes immediately when nothing changed', () => {
      loadEdit();
      button('Discard')?.click();
      expect(closed).toBe(1);
    });

    it('reports a load failure', () => {
      mount({ languageId: 7 });
      http
        .expectOne(`${BASE}/languages/7`)
        .flush({}, { status: 500, statusText: 'Error' });
      fixture.detectChanges();
      expect(root.querySelector('[role="alert"]')?.textContent).toContain('Could not load');
    });
  });
});
