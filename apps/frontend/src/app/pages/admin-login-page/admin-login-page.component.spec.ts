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
});
