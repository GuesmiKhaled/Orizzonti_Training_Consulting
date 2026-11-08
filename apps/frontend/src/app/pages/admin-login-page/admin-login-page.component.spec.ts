import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AdminLoginPageComponent } from './admin-login-page.component';

describe('AdminLoginPageComponent (cookie-based auth)', () => {
  let http: HttpTestingController;
  let root: HTMLElement;
  let fixture: ComponentFixture<AdminLoginPageComponent>;
  let navigate: jasmine.Spy;

  const signIn = (): void => {
    const set = (selector: string, value: string) => {
      const input = root.querySelector<HTMLInputElement>(selector) as HTMLInputElement;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    };
    set('input[formControlName="username"]', 'admin');
    set('input[formControlName="password"]', 'a-valid-password');
    fixture.detectChanges();
    root.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
  };

  const respond = (mustChangePassword: boolean): void => {
    const req = http.expectOne((r) => r.url.endsWith('/auth/login'));
    expect(req.request.withCredentials).toBeTrue();
    req.flush({
      user: { id: 1, username: 'admin', permissions: [], mustChangePassword },
    });
  };

  const enterOtpCode = (code: string): void => {
    const inputs = root.querySelectorAll<HTMLInputElement>('.otp-input');
    inputs.forEach((input, i) => {
      if (i < code.length) {
        input.value = code[i];
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    fixture.detectChanges();
  };

  const respondOtp = (success: boolean): void => {
    const req = http.expectOne((r) => r.url.endsWith('/auth/complete-otp-verification'));
    expect(req.request.withCredentials).toBeTrue();
    if (success) {
      req.flush({ user: { id: 1, username: 'admin', permissions: [], mustChangePassword: false } });
    } else {
      req.flush({ statusCode: 401, message: 'Invalid or expired verification code' }, { status: 401, statusText: 'Unauthorized' });
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    navigate = spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);
    fixture = TestBed.createComponent(AdminLoginPageComponent);
    root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    fixture.detectChanges();
  });

  afterEach(() => {
    root.remove();
    http.verify();
  });

  it('goes to the admin area after a normal login', () => {
    signIn();
    respond(false);
    expect(navigate).toHaveBeenCalledWith('/admin');
  });

  it('sends an account with a temporary password to the change-password page', () => {
    signIn();
    respond(true);
    expect(navigate).toHaveBeenCalledWith('/change-password');
  });

  it('does not store the token in local storage', () => {
    signIn();
    respond(false);
    expect(localStorage.getItem('orizzonti-admin-token')).toBeNull();
  });

  // --- OTP flow tests ---

  it('transitions to OTP step when login requires challenge', () => {
    signIn();
    const req = http.expectOne((r) => r.url.endsWith('/auth/login'));
    req.flush({
      challengeRequired: true,
      challengeId: 'ch-123',
      userId: 1,
      email: 'user@example.com',
    });
    fixture.detectChanges();
    expect(root.querySelector('.otp-form')).not.toBeNull();
    expect(root.querySelector('.otp-title')?.textContent).toContain('Verify your identity');
  });

  it('shows masked email hint after OTP step starts', () => {
    signIn();
    const req = http.expectOne((r) => r.url.endsWith('/auth/login'));
    req.flush({
      challengeRequired: true,
      challengeId: 'ch-123',
      userId: 1,
      email: 'user@example.com',
    });
    fixture.detectChanges();
    expect(root.querySelector('.status')?.textContent).toContain('us••@example.com');
  });

  // --- OTP input tests ---

  it('enters six digits into individual inputs and updates form control', () => {
    signIn();
    const loginReq = http.expectOne((r) => r.url.endsWith('/auth/login'));
    loginReq.flush({ challengeRequired: true, challengeId: 'ch-123', userId: 1, email: 'a@b.com' });
    fixture.detectChanges();

    enterOtpCode('123456');
    const otpForm = (fixture.componentInstance as AdminLoginPageComponent).otpForm;
    expect(otpForm.get('code')?.value).toBe('123456');
    expect(otpForm.valid).toBeTrue();
  });

  it('rejects non-numeric characters in OTP inputs', () => {
    signIn();
    const loginReq = http.expectOne((r) => r.url.endsWith('/auth/login'));
    loginReq.flush({ challengeRequired: true, challengeId: 'ch-123', userId: 1, email: 'a@b.com' });
    fixture.detectChanges();

    const inputs = root.querySelectorAll<HTMLInputElement>('.otp-input');
    inputs[0].value = 'a';
    inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    const otpForm = (fixture.componentInstance as AdminLoginPageComponent).otpForm;
    expect(otpForm.get('code')?.value).not.toContain('a');
  });

  it('automatically moves focus to next input after entering a digit', () => {
    signIn();
    const loginReq = http.expectOne((r) => r.url.endsWith('/auth/login'));
    loginReq.flush({ challengeRequired: true, challengeId: 'ch-123', userId: 1, email: 'a@b.com' });
    fixture.detectChanges();

    const inputs = root.querySelectorAll<HTMLInputElement>('.otp-input');
    inputs[0].focus();
    inputs[0].value = '1';
    inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(document.activeElement).toBe(inputs[1]);
  });

  it('moves to previous input on Backspace when current is empty', () => {
    signIn();
    const loginReq = http.expectOne((r) => r.url.endsWith('/auth/login'));
    loginReq.flush({ challengeRequired: true, challengeId: 'ch-123', userId: 1, email: 'a@b.com' });
    fixture.detectChanges();

    enterOtpCode('123456');

    const inputs = root.querySelectorAll<HTMLInputElement>('.otp-input');
    inputs[2].focus();
    inputs[2].value = '';
    inputs[2].dispatchEvent(new Event('input', { bubbles: true }));
    inputs[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
    fixture.detectChanges();

    expect(document.activeElement).toBe(inputs[1]);
  });

  it('navigates with ArrowLeft and ArrowRight', () => {
    signIn();
    const loginReq = http.expectOne((r) => r.url.endsWith('/auth/login'));
    loginReq.flush({ challengeRequired: true, challengeId: 'ch-123', userId: 1, email: 'a@b.com' });
    fixture.detectChanges();

    const inputs = root.querySelectorAll<HTMLInputElement>('.otp-input');
    inputs[2].focus();
    inputs[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    fixture.detectChanges();
    expect(document.activeElement).toBe(inputs[1]);

    inputs[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    expect(document.activeElement).toBe(inputs[2]);
  });

  it('pastes a complete six-digit OTP', () => {
    signIn();
    const loginReq = http.expectOne((r) => r.url.endsWith('/auth/login'));
    loginReq.flush({ challengeRequired: true, challengeId: 'ch-123', userId: 1, email: 'a@b.com' });
    fixture.detectChanges();

    const inputs = root.querySelectorAll<HTMLInputElement>('.otp-input');
    inputs[0].focus();
    const clipboardData = new DataTransfer();
    clipboardData.setData('text', '123456');
    const pasteEvent = new ClipboardEvent('paste', { bubbles: true, clipboardData }) as unknown as ClipboardEvent;
    inputs[0].dispatchEvent(pasteEvent);
    fixture.detectChanges();

    const otpForm = (fixture.componentInstance as AdminLoginPageComponent).otpForm;
    expect(otpForm.get('code')?.value).toBe('123456');
  });

  it('handles pasted text with spaces and non-numeric characters', () => {
    signIn();
    const loginReq = http.expectOne((r) => r.url.endsWith('/auth/login'));
    loginReq.flush({ challengeRequired: true, challengeId: 'ch-123', userId: 1, email: 'a@b.com' });
    fixture.detectChanges();

    const inputs = root.querySelectorAll<HTMLInputElement>('.otp-input');
    inputs[0].focus();
    const clipboardData = new DataTransfer();
    clipboardData.setData('text', '12-34 56');
    const pasteEvent = new ClipboardEvent('paste', { bubbles: true, clipboardData }) as unknown as ClipboardEvent;
    inputs[0].dispatchEvent(pasteEvent);
    fixture.detectChanges();

    const otpForm = (fixture.componentInstance as AdminLoginPageComponent).otpForm;
    expect(otpForm.get('code')?.value).toBe('123456');
  });

  it('edits a digit in the middle without shifting other digits', () => {
    signIn();
    const loginReq = http.expectOne((r) => r.url.endsWith('/auth/login'));
    loginReq.flush({ challengeRequired: true, challengeId: 'ch-123', userId: 1, email: 'a@b.com' });
    fixture.detectChanges();

    enterOtpCode('123456');

    const inputs = root.querySelectorAll<HTMLInputElement>('.otp-input');
    inputs[2].value = '9';
    inputs[2].dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    const otpForm = (fixture.componentInstance as AdminLoginPageComponent).otpForm;
    expect(otpForm.get('code')?.value).toBe('129456');
  });

  it('replaces an existing digit when typing over it', () => {
    signIn();
    const loginReq = http.expectOne((r) => r.url.endsWith('/auth/login'));
    loginReq.flush({ challengeRequired: true, challengeId: 'ch-123', userId: 1, email: 'a@b.com' });
    fixture.detectChanges();

    enterOtpCode('123456');

    const inputs = root.querySelectorAll<HTMLInputElement>('.otp-input');
    inputs[1].focus();
    inputs[1].value = '8';
    inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    const otpForm = (fixture.componentInstance as AdminLoginPageComponent).otpForm;
    expect(otpForm.get('code')?.value).toBe('183456');
  });

  it('maintains the correct Reactive Form value after all interactions', () => {
    signIn();
    const loginReq = http.expectOne((r) => r.url.endsWith('/auth/login'));
    loginReq.flush({ challengeRequired: true, challengeId: 'ch-123', userId: 1, email: 'a@b.com' });
    fixture.detectChanges();

    enterOtpCode('123456');
    const otpForm = (fixture.componentInstance as AdminLoginPageComponent).otpForm;
    expect(otpForm.get('code')?.value).toBe('123456');
    expect(otpForm.valid).toBeTrue();
  });

  // --- Form validation tests ---

  it('disables Verify when OTP is empty', () => {
    signIn();
    const loginReq = http.expectOne((r) => r.url.endsWith('/auth/login'));
    loginReq.flush({ challengeRequired: true, challengeId: 'ch-123', userId: 1, email: 'a@b.com' });
    fixture.detectChanges();

    const otpForm = (fixture.componentInstance as AdminLoginPageComponent).otpForm;
    expect(otpForm.valid).toBeFalse();
    expect(root.querySelector<HTMLButtonElement>('.otp-verify-btn')?.disabled).toBeTrue();
  });

  it('disables Verify when OTP is incomplete', () => {
    signIn();
    const loginReq = http.expectOne((r) => r.url.endsWith('/auth/login'));
    loginReq.flush({ challengeRequired: true, challengeId: 'ch-123', userId: 1, email: 'a@b.com' });
    fixture.detectChanges();

    enterOtpCode('123');
    const otpForm = (fixture.componentInstance as AdminLoginPageComponent).otpForm;
    expect(otpForm.valid).toBeFalse();
  });

  it('disables Verify when OTP has non-numeric characters', () => {
    signIn();
    const loginReq = http.expectOne((r) => r.url.endsWith('/auth/login'));
    loginReq.flush({ challengeRequired: true, challengeId: 'ch-123', userId: 1, email: 'a@b.com' });
    fixture.detectChanges();

    const inputs = root.querySelectorAll<HTMLInputElement>('.otp-input');
    inputs.forEach((input) => {
      input.value = 'a';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    fixture.detectChanges();

    const otpForm = (fixture.componentInstance as AdminLoginPageComponent).otpForm;
    expect(otpForm.valid).toBeFalse();
  });

  it('enables Verify when OTP is a valid six-digit code', () => {
    signIn();
    const loginReq = http.expectOne((r) => r.url.endsWith('/auth/login'));
    loginReq.flush({ challengeRequired: true, challengeId: 'ch-123', userId: 1, email: 'a@b.com' });
    fixture.detectChanges();

    enterOtpCode('123456');
    const otpForm = (fixture.componentInstance as AdminLoginPageComponent).otpForm;
    expect(otpForm.valid).toBeTrue();
    expect(root.querySelector<HTMLButtonElement>('.otp-verify-btn')?.disabled).toBeFalse();
  });

  // --- Authentication behavior tests ---

  it('successfully verifies OTP and navigates', () => {
    signIn();
    const loginReq = http.expectOne((r) => r.url.endsWith('/auth/login'));
    loginReq.flush({ challengeRequired: true, challengeId: 'ch-123', userId: 1, email: 'a@b.com' });
    fixture.detectChanges();

    enterOtpCode('123456');
    const btn = root.querySelector<HTMLButtonElement>('.otp-verify-btn');
    btn?.click();
    respondOtp(true);
    fixture.detectChanges();

    expect(navigate).toHaveBeenCalledWith('/admin');
  });

  it('shows error on invalid OTP response', () => {
    signIn();
    const loginReq = http.expectOne((r) => r.url.endsWith('/auth/login'));
    loginReq.flush({ challengeRequired: true, challengeId: 'ch-123', userId: 1, email: 'a@b.com' });
    fixture.detectChanges();

    enterOtpCode('000000');
    const btn = root.querySelector<HTMLButtonElement>('.otp-verify-btn');
    btn?.click();
    respondOtp(false);
    fixture.detectChanges();

    const component = fixture.componentInstance as AdminLoginPageComponent;
    expect(component.isError).toBeTrue();
    expect(component.message).toBe('Invalid or expired verification code.');
  });

  it('prevents duplicate OTP submissions while verifying', () => {
    signIn();
    const loginReq = http.expectOne((r) => r.url.endsWith('/auth/login'));
    loginReq.flush({ challengeRequired: true, challengeId: 'ch-123', userId: 1, email: 'a@b.com' });
    fixture.detectChanges();

    enterOtpCode('123456');
    const btn = root.querySelector<HTMLButtonElement>('.otp-verify-btn');
    btn?.click();
    expect((fixture.componentInstance as AdminLoginPageComponent).isSubmitting).toBeTrue();

    btn?.click();
    http.expectOne((r) => r.url.endsWith('/auth/complete-otp-verification'));
  });

  it('navigates back to login on cancel', () => {
    signIn();
    const loginReq = http.expectOne((r) => r.url.endsWith('/auth/login'));
    loginReq.flush({ challengeRequired: true, challengeId: 'ch-123', userId: 1, email: 'a@b.com' });
    fixture.detectChanges();

    const cancelBtn = root.querySelector<HTMLButtonElement>('.back-btn');
    cancelBtn?.click();
    fixture.detectChanges();

    expect((fixture.componentInstance as AdminLoginPageComponent).otpStep).toBeFalse();
    expect(root.querySelector('.otp-form')).toBeNull();
  });

  // --- Accessibility tests ---

  it('has accessible labels for each OTP digit', () => {
    signIn();
    const loginReq = http.expectOne((r) => r.url.endsWith('/auth/login'));
    loginReq.flush({ challengeRequired: true, challengeId: 'ch-123', userId: 1, email: 'a@b.com' });
    fixture.detectChanges();

    const inputs = root.querySelectorAll<HTMLInputElement>('.otp-input');
    expect(inputs.length).toBe(6);
    inputs.forEach((input, i) => {
      expect(input.getAttribute('aria-label')).toBe(`Verification code digit ${i + 1}`);
    });
  });

  it('has inputmode numeric for mobile OTP inputs', () => {
    signIn();
    const loginReq = http.expectOne((r) => r.url.endsWith('/auth/login'));
    loginReq.flush({ challengeRequired: true, challengeId: 'ch-123', userId: 1, email: 'a@b.com' });
    fixture.detectChanges();

    const inputs = root.querySelectorAll<HTMLInputElement>('.otp-input');
    inputs.forEach((input) => {
      expect(input.getAttribute('inputmode')).toBe('numeric');
    });
  });

  it('has autocomplete one-time-code for OTP autofill', () => {
    signIn();
    const loginReq = http.expectOne((r) => r.url.endsWith('/auth/login'));
    loginReq.flush({ challengeRequired: true, challengeId: 'ch-123', userId: 1, email: 'a@b.com' });
    fixture.detectChanges();

    const inputs = root.querySelectorAll<HTMLInputElement>('.otp-input');
    inputs.forEach((input) => {
      expect(input.getAttribute('autocomplete')).toBe('one-time-code');
    });
  });

  it('shows error message with role alert on invalid OTP', () => {
    signIn();
    const loginReq = http.expectOne((r) => r.url.endsWith('/auth/login'));
    loginReq.flush({ challengeRequired: true, challengeId: 'ch-123', userId: 1, email: 'a@b.com' });
    fixture.detectChanges();

    enterOtpCode('000000');
    const btn = root.querySelector<HTMLButtonElement>('.otp-verify-btn');
    btn?.click();
    respondOtp(false);
    fixture.detectChanges();

    const alert = root.querySelector('.otp-error');
    expect(alert).not.toBeNull();
    expect(alert?.getAttribute('role')).toBe('alert');
    expect(alert?.textContent).toContain('Invalid verification code');
  });
});

