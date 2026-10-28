import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { API_BASE_URL } from '../../core/api/api.config';
import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../core/toast/toast.service';
import { ChangePasswordPageComponent } from './change-password-page.component';

const BASE = 'http://api.test';

describe('ChangePasswordPageComponent', () => {
  let http: HttpTestingController;
  let root: HTMLElement;
  let fixture: ComponentFixture<ChangePasswordPageComponent>;
  let navigate: jasmine.Spy;

  const field = (id: string): HTMLInputElement =>
    root.querySelector<HTMLInputElement>(`#${id}`) as HTMLInputElement;

  const type = (id: string, value: string): void => {
    const input = field(id);
    input.value = value;
    input.dispatchEvent(new Event('input'));
  };

  const submit = (): void => {
    root.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
    fixture.detectChanges();
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    navigate = spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);
    fixture = TestBed.createComponent(ChangePasswordPageComponent);
    root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    fixture.detectChanges();
  });

  afterEach(() => {
    root.remove();
    http.verify();
  });

  it('labels every field and hints the minimum length', () => {
    for (const id of ['current-password', 'new-password', 'confirm-password']) {
      expect(root.querySelector(`label[for="${id}"]`)).withContext(id).not.toBeNull();
    }
    expect(root.textContent).toContain('At least 12 characters');
    expect(field('new-password').getAttribute('autocomplete')).toBe('new-password');
  });

  it('blocks an empty or short submission and announces why', () => {
    type('new-password', 'short');
    submit();
    http.expectNone(() => true);
    const alerts = Array.from(root.querySelectorAll('[role="alert"]')).map((a) => a.textContent);
    expect(alerts.some((a) => a?.includes('Required'))).toBeTrue();
    expect(alerts.some((a) => a?.includes('at least 12'))).toBeTrue();
    expect(field('new-password').getAttribute('aria-invalid')).toBe('true');
  });

  it('requires the confirmation to match', () => {
    type('current-password', 'temporary-password-1');
    type('new-password', 'a-brand-new-password');
    type('confirm-password', 'a-different-password');
    submit();
    http.expectNone(() => true);
    expect(root.textContent).toContain('do not match');
  });

  it('requires a password different from the current one', () => {
    type('current-password', 'same-password-123');
    type('new-password', 'same-password-123');
    type('confirm-password', 'same-password-123');
    submit();
    http.expectNone(() => true);
    expect(root.textContent).toContain('must be different');
  });

  it('changes the password, drops the cached profile and goes to the admin area', () => {
    type('current-password', 'temporary-password-1');
    type('new-password', 'a-brand-new-password');
    type('confirm-password', 'a-brand-new-password');
    submit();

    const req = http.expectOne(`${BASE}/auth/change-password`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      currentPassword: 'temporary-password-1',
      newPassword: 'a-brand-new-password',
    });
    req.flush({ success: true });

    expect(navigate).toHaveBeenCalledWith('/admin');
    expect(TestBed.inject(ToastService).toasts()[0].message).toContain('Password changed');
    expect(TestBed.inject(AuthService).profile()).toBeNull();
  });

  it('shows the server message inline instead of a toast', () => {
    type('current-password', 'wrong-password-123');
    type('new-password', 'a-brand-new-password');
    type('confirm-password', 'a-brand-new-password');
    submit();
    http
      .expectOne(`${BASE}/auth/change-password`)
      .flush({ message: 'Current password is incorrect' }, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();

    expect(root.querySelector('.status[role="alert"]')?.textContent).toContain(
      'Current password is incorrect',
    );
    expect(TestBed.inject(ToastService).toasts().length).toBe(0);
    expect(navigate).not.toHaveBeenCalled();
    expect(root.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBeFalse();
  });
});
