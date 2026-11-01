import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AppComponent } from './app.component';

@Component({ standalone: true, template: '<p>Admin workspace</p>' })
class AdminRouteStubComponent {}

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: '', component: AdminRouteStubComponent },
          { path: 'admin', component: AdminRouteStubComponent },
        ]),
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('uses the Orizzonti application title', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('Orizzonti Training & Consulting');
  });

  it('renders the legacy-branded navigation', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.brand-logo')?.getAttribute('alt')).toContain(
      'Orizzonti Training & Consulting',
    );
    expect(compiled.textContent).toContain('Courses');
    expect(compiled.textContent).toContain('Contact');
  });

  it('keeps the public template separate from the admin route', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/admin');
    fixture.detectChanges();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('app-site-footer'),
    ).toBeNull();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('app-site-header'),
    ).toBeNull();

    await router.navigateByUrl('/');
    fixture.detectChanges();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('app-site-footer'),
    ).not.toBeNull();
  });
});
