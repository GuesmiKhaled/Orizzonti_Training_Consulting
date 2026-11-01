import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Type } from '@angular/core';
import { ComponentFixture, TestBed, discardPeriodicTasks, fakeAsync, tick } from '@angular/core/testing';
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

  const show = <T>(
    type: Type<T>,
    settings: SiteSettings | 'unreachable',
    data: Record<string, unknown> = {},
  ): HTMLElement => {
    return render(type, settings, data).nativeElement as HTMLElement;
  };

  const render = <T>(
    type: Type<T>,
    settings: SiteSettings | 'unreachable',
    data: Record<string, unknown> = {},
  ): ComponentFixture<T> => {
    const fixture: ComponentFixture<T> = TestBed.createComponent(type);
    fixture.detectChanges();
    for (const req of http.match(() => true)) {
      const path = new URL(req.request.url).pathname;
      if (path !== '/site-settings') {
        req.flush(data[path] ?? []);
      } else if (settings === 'unreachable') {
        req.flush({}, { status: 500, statusText: 'Error' });
      } else {
        req.flush(settings);
      }
    }
    fixture.detectChanges();
    return fixture;
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
      const about = root.querySelector('.section-title')?.closest('.about-content')?.textContent ?? '';
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

  describe('footer languages', () => {
    const LANGUAGES = [
      { id: 1, name: 'Italian', nativeName: 'Italiano', isActive: true },
      { id: 7, name: 'German', nativeName: 'Deutsch', isActive: true },
      { id: 9, name: 'Hidden', isActive: false },
    ];

    it('lists the active languages from the database with links to their pages', () => {
      const root = show(AppComponent, EMPTY, { '/languages': LANGUAGES });
      const links = Array.from(root.querySelectorAll<HTMLAnchorElement>('.site-footer a')).filter((a) =>
        a.getAttribute('href')?.startsWith('/languages/'),
      );
      expect(links.map((a) => a.textContent?.trim())).toEqual(['Italiano', 'Deutsch']);
      expect(links.map((a) => a.getAttribute('href'))).toEqual(['/languages/1', '/languages/7']);
    });

    it('keeps the original four links when there are no languages yet', () => {
      const text = show(AppComponent, EMPTY).querySelector('.site-footer')?.textContent ?? '';
      for (const label of ['Italiano', 'English', 'Français']) {
        expect(text).toContain(label);
      }
    });
  });

  describe('home hero', () => {
    const SLIDES = [
      { id: 3, title: 'Newest', imageUrl: '/uploads/new.jpg', altText: 'New classroom', isActive: true },
      { id: 2, title: 'Older', imageUrl: '/uploads/old.jpg', isActive: true },
      { id: 1, title: 'Hidden', imageUrl: '/uploads/hidden.jpg', isActive: false },
    ];
    const heroImage = (root: HTMLElement) =>
      root.querySelector<HTMLImageElement>('.hero-carousel > img') as HTMLImageElement;

    it('shows the saved hero title and subtitle', () => {
      const root = show(HomePageComponent, { ...EMPTY, heroTitle: 'Learn with us', heroSubtitle: 'Classes in Tunis.' });
      expect(root.querySelector('.hero-caption h1')?.textContent).toBe('Learn with us');
      expect(root.querySelector('.hero-caption p:nth-of-type(2)')?.textContent).toBe('Classes in Tunis.');
    });

    it('keeps the original hero text by default', () => {
      const root = show(HomePageComponent, EMPTY);
      expect(root.querySelector('.hero-caption h1')?.textContent).toBe('Orizzonti');
      expect(root.querySelector('.hero-caption')?.textContent).toContain('Italian language classes');
    });

    it('uses the slider media from the admin area, newest first, skipping hidden images', () => {
      const fixture = render(HomePageComponent, EMPTY, { '/media': SLIDES });
      const root = fixture.nativeElement as HTMLElement;
      expect(heroImage(root).getAttribute('src')).toBe('/uploads/new.jpg');
      expect(heroImage(root).getAttribute('alt')).toBe('New classroom');
      expect(root.querySelectorAll('.slide-indicators button').length).toBe(2);

      root.querySelector<HTMLButtonElement>('.carousel-control.next')?.click();
      fixture.detectChanges();
      expect(heroImage(root).getAttribute('src')).toBe('/uploads/old.jpg');
      expect(heroImage(root).getAttribute('alt')).toBe('Older');
    });

    it('falls back to the built-in slides when none are published', () => {
      const root = show(HomePageComponent, EMPTY, { '/media': [] });
      expect(heroImage(root).getAttribute('src')).toBe('/img/carousel-1.jpg');
      expect(root.querySelectorAll('.slide-indicators button').length).toBe(5);
    });

    it('hides the arrows, dots and pause button when there is only one slide', () => {
      const root = show(HomePageComponent, EMPTY, { '/media': [SLIDES[0]] });
      expect(root.querySelector('.carousel-control')).toBeNull();
      expect(root.querySelector('.slide-indicators')).toBeNull();
      expect(root.querySelector('.carousel-toggle')).toBeNull();
    });

    it('shows the picture chosen for a language on its subject card', () => {
      const root = show(HomePageComponent, EMPTY, {
        '/languages': [
          { id: 1, name: 'Italian', imageUrl: '/img/italien/italian.jpg', isActive: true },
          { id: 2, name: 'French', isActive: true },
        ],
      });
      const images = Array.from(root.querySelectorAll<HTMLImageElement>('.subject-image'));
      expect(images.map((i) => i.getAttribute('src'))).toEqual(['/img/italien/italian.jpg', '/img/cat-2.jpg']);
    });

    describe('automatic advance', () => {
      const setup = (reducedMotion = false) => {
        spyOn(window, 'matchMedia').and.returnValue({ matches: reducedMotion } as MediaQueryList);
        const fixture = render(HomePageComponent, EMPTY, { '/media': SLIDES });
        const root = fixture.nativeElement as HTMLElement;
        return { fixture, root, src: () => heroImage(root).getAttribute('src') };
      };

      it('moves to the next slide every 6 seconds and wraps around', fakeAsync(() => {
        const { fixture, src } = setup();
        expect(src()).toBe('/uploads/new.jpg');
        tick(5900);
        fixture.detectChanges();
        expect(src()).toBe('/uploads/new.jpg');
        tick(200);
        fixture.detectChanges();
        expect(src()).toBe('/uploads/old.jpg');
        tick(6000);
        fixture.detectChanges();
        expect(src()).toBe('/uploads/new.jpg');
        fixture.destroy();
        discardPeriodicTasks();
      }));

      it('pauses while the pointer or keyboard focus is on the slider', fakeAsync(() => {
        const { fixture, root, src } = setup();
        const hero = root.querySelector('.hero-carousel') as HTMLElement;
        hero.dispatchEvent(new Event('mouseenter'));
        tick(20000);
        fixture.detectChanges();
        expect(src()).toBe('/uploads/new.jpg');
        hero.dispatchEvent(new Event('mouseleave'));
        tick(6000);
        fixture.detectChanges();
        expect(src()).toBe('/uploads/old.jpg');
        fixture.destroy();
        discardPeriodicTasks();
      }));

      it('can be paused and resumed with the visible button, announcing the state', fakeAsync(() => {
        const { fixture, root, src } = setup();
        const toggle = () => root.querySelector<HTMLButtonElement>('.carousel-toggle') as HTMLButtonElement;
        expect(toggle().getAttribute('aria-label')).toBe('Pause slideshow');
        expect(root.querySelector('.hero-carousel')?.getAttribute('aria-live')).toBe('off');

        toggle().click();
        fixture.detectChanges();
        expect(toggle().getAttribute('aria-label')).toBe('Play slideshow');
        expect(root.querySelector('.hero-carousel')?.getAttribute('aria-live')).toBe('polite');
        tick(30000);
        expect(src()).toBe('/uploads/new.jpg');

        toggle().click();
        tick(6000);
        fixture.detectChanges();
        expect(src()).toBe('/uploads/old.jpg');
        fixture.destroy();
        discardPeriodicTasks();
      }));

      it('stays still for visitors who prefer reduced motion', fakeAsync(() => {
        const { fixture, root, src } = setup(true);
        tick(30000);
        fixture.detectChanges();
        expect(src()).toBe('/uploads/new.jpg');
        expect(root.querySelector('.carousel-toggle')).toBeNull();
        expect(root.querySelector('.carousel-control.next')).not.toBeNull();
        fixture.destroy();
      }));

      it('stops its timer when the page is left', fakeAsync(() => {
        const { fixture } = setup();
        fixture.destroy();
        // fakeAsync would fail the test if a periodic timer were left behind
        expect(() => tick(60000)).not.toThrow();
      }));
    });
  });
});
