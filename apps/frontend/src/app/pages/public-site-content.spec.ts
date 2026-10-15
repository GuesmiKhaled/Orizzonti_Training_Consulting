import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from '../app.component';
import { SITE_DEFAULTS } from '../core/site/site-content.service';
import { SiteSettings } from '../services/orizzonti-api.service';
import { AboutPageComponent } from './about-page/about-page.component';
import { HomePageComponent } from './home-page/home-page.component';

const EMPTY: SiteSettings = {
  contactEmail: null,
  contactPhone: null,
  contactAddress: null,
  facebookUrl: null,
  instagramUrl: null,
  aboutText: null,
  studentsCount: null,
  coursesCount: null,
  yearsOfExperience: null,
  nextSessionDate: null,
};

describe('public pages read the site settings', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  const show = <T>(type: Type<T>, settings: SiteSettings | 'unreachable'): HTMLElement => {
    const fixture: ComponentFixture<T> = TestBed.createComponent(type);
    fixture.detectChanges();
    for (const req of http.match(() => true)) {
      if (!req.request.url.endsWith('/site-settings')) {
        req.flush([]);
      } else if (settings === 'unreachable') {
        req.flush({}, { status: 500, statusText: 'Error' });
      } else {
        req.flush(settings);
      }
    }
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  describe('footer and header', () => {
    it('show the saved contact details and social links', () => {
      const root = show(AppComponent, {
        ...EMPTY,
        contactEmail: 'hello@orizzonti.tn',
        contactPhone: '+216 70 111 222',
        contactAddress: '12 Avenue Habib Bourguiba, Tunis',
        facebookUrl: 'https://facebook.com/orizzonti-new',
        instagramUrl: 'https://instagram.com/orizzonti_new',
      });
      const text = root.textContent ?? '';
      expect(text).toContain('hello@orizzonti.tn');
      expect(text).toContain('+216 70 111 222');
      expect(text).toContain('12 Avenue Habib Bourguiba, Tunis');
      expect(text).not.toContain(SITE_DEFAULTS.address);
      expect(root.querySelector('a[aria-label="Orizzonti on Facebook"]')?.getAttribute('href')).toBe(
        'https://facebook.com/orizzonti-new',
      );
      expect(root.querySelector('a[aria-label="Orizzonti on Instagram"]')?.getAttribute('href')).toBe(
        'https://instagram.com/orizzonti_new',
      );
    });

    it('fall back to the original details when nothing is saved', () => {
      const root = show(AppComponent, EMPTY);
      const text = root.textContent ?? '';
      expect(text).toContain(SITE_DEFAULTS.email);
      expect(text).toContain(SITE_DEFAULTS.headerPhone);
      expect(text).toContain(SITE_DEFAULTS.address);
      expect(root.querySelector('a[aria-label="Orizzonti on Facebook"]')?.getAttribute('href')).toBe(
        SITE_DEFAULTS.facebookUrl,
      );
    });

    it('still render when the settings cannot be loaded', () => {
      const root = show(AppComponent, 'unreachable');
      expect(root.textContent).toContain(SITE_DEFAULTS.email);
    });

    it('neutralise an unsafe saved link (Angular rewrites it to unsafe:)', () => {
      const root = show(AppComponent, { ...EMPTY, facebookUrl: 'javascript:alert(1)' });
      const href = root.querySelector('a[aria-label="Orizzonti on Facebook"]')?.getAttribute('href');
      expect(href?.startsWith('javascript:')).toBeFalse();
      expect(href?.startsWith('unsafe:')).toBeTrue();
    });
  });

  describe('home page', () => {
    it('uses the saved About text as paragraphs and shows the highlights', () => {
      const root = show(HomePageComponent, {
        ...EMPTY,
        aboutText: 'We teach languages.\n\nWe certify students.',
        studentsCount: 2500,
        yearsOfExperience: 12,
        nextSessionDate: '2026-11-01T09:00:00.000Z',
      });
      const about = root.querySelector('.section-title')?.closest('.col-lg-7')?.textContent ?? '';
      expect(about).toContain('We teach languages.');
      expect(about).toContain('We certify students.');
      expect(about).not.toContain('CERT.IT SIS');

      const strip = root.querySelector('[aria-label="Orizzonti in numbers"]');
      expect(strip?.textContent).toContain('2,500');
      expect(strip?.textContent).toContain('Years of experience');
      expect(strip?.textContent).toContain('Next session');
      expect(strip?.textContent).not.toContain('Courses');
    });

    it('keeps the original wording and hides the strip when nothing is saved', () => {
      const root = show(HomePageComponent, EMPTY);
      expect(root.textContent).toContain('CERT.IT SIS');
      expect(root.querySelector('[aria-label="Orizzonti in numbers"]')).toBeNull();
    });
  });

  describe('about page', () => {
    it('uses the saved About text', () => {
      const root = show(AboutPageComponent, { ...EMPTY, aboutText: 'Custom about copy.' });
      expect(root.textContent).toContain('Custom about copy.');
      expect(root.textContent).not.toContain('CERT.IT SIS');
    });

    it('keeps the original wording by default', () => {
      expect(show(AboutPageComponent, EMPTY).textContent).toContain('CERT.IT SIS');
    });
  });
});
