import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteContentService } from '../../core/site/site-content.service';
import {
  BlogItem,
  CourseItem,
  LanguageItem,
  OrizzontiApiService,
} from '../../services/orizzonti-api.service';

const AUTOPLAY_MS = 6000;

const DEFAULT_SLIDES: { src: string; alt: string }[] = [
  { src: '/img/carousel-1.jpg', alt: 'Orizzonti training classroom' },
  { src: '/img/carousel-2.jpg', alt: 'Students learning together' },
  { src: '/img/arabe_bg.png', alt: 'Arabic language learning' },
  { src: '/img/french_bg.png', alt: 'French language learning' },
  { src: '/img/orizontiLanguages.jpg', alt: 'Language courses at Orizzonti' },
];

interface Slide {
  readonly src: string;
  readonly alt: string;
}

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section
      class="hero-carousel"
      aria-label="Orizzonti highlights"
      aria-roledescription="carousel"
      [attr.aria-live]="autoplayActive() ? 'off' : 'polite'"
      (mouseenter)="holdAutoplay()"
      (mouseleave)="releaseAutoplay()"
      (focusin)="holdAutoplay()"
      (focusout)="releaseAutoplay()"
    >
      <img [src]="slides()[activeSlide()].src" [alt]="slides()[activeSlide()].alt" />
      <div class="hero-shade"></div>
      <div class="hero-caption">
        <p class="kicker">Training & Consulting</p>
        <h1>{{ site.heroTitle() }}</h1>
        <p>{{ site.heroSubtitle() }}</p>
        <a routerLink="/courses" class="btn-primary">Explore courses</a>
      </div>
      @if (slides().length > 1) {
        <button type="button" class="carousel-control previous" aria-label="Previous slide" (click)="showPreviousSlide()">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
        </button>
        <button type="button" class="carousel-control next" aria-label="Next slide" (click)="showNextSlide()">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>
        </button>
      }
      @if (slides().length > 1 && !reducedMotion()) {
        <button
          type="button"
          class="carousel-toggle"
          [attr.aria-label]="autoplayEnabled() ? 'Pause slideshow' : 'Play slideshow'"
          (click)="toggleAutoplay()"
        >
          @if (autoplayEnabled()) {
            <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>
          } @else {
            <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>
          }
        </button>
      }
      @if (slides().length > 1) {
        <div class="slide-indicators" aria-label="Choose slide">
          @for (slide of slides(); track $index; let index = $index) {
            <button
              type="button"
              [class.active]="index === activeSlide()"
              [attr.aria-label]="'Show slide ' + (index + 1)"
              [attr.aria-pressed]="index === activeSlide()"
              (click)="activeSlide.set(index)"
            ></button>
          }
        </div>
      }
    </section>

    <section class="section about-section" id="about_block">
      <div class="container">
        <div class="about-grid">
          <div class="about-image-wrap">
            <img class="about-image" src="/img/orizontiLanguages.jpg" alt="Orizzonti language training" loading="lazy" />
          </div>
          <div class="about-content">
            <p class="section-kicker">About Us</p>
            <h2 class="section-title">Orizzonti Training & Consulting</h2>
            @if (site.aboutParagraphs(); as paragraphs) {
              @for (paragraph of paragraphs; track $index) {
                <p>{{ paragraph }}</p>
              }
            } @else {
              <p>
                <strong>Orizzonti Training & Consulting</strong> provides
                Italian language classes and communication skills to students
                who need Italian certification. The center has an Italian
                language certificate approved by CERT.IT SIS in Tunisia. We
                also provide courses in other languages.
              </p>
            }
            <a routerLink="/about" class="discover-link">
              Discover Orizzonti
              <svg viewBox="0 0 24 24" class="arrow-icon" aria-hidden="true"><path fill="currentColor" d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>
            </a>
          </div>
        </div>
      </div>
    </section>

    @if (site.highlights().length) {
      <section class="section highlights-section" aria-label="Orizzonti in numbers">
        <div class="container">
          <div class="highlights-grid">
            @for (item of site.highlights(); track item.label) {
              <div class="highlight-item">
                <p class="highlight-value">{{ item.value }}</p>
                <p class="highlight-label">{{ item.label }}</p>
              </div>
            }
          </div>
        </div>
      </section>
    }

    <section class="section subjects-section">
      <div class="container">
        <div class="section-header">
          <p class="section-kicker">Subjects</p>
          <h2 class="section-title">Explore Top Subjects</h2>
        </div>
        <div class="subjects-grid">
          @for (subject of subjects(); track subject.id; let i = $index) {
            <a [routerLink]="['/languages', subject.id]" class="subject-item">
              <img
                class="subject-image"
                [src]="subject.imageUrl || subjectImages[i % subjectImages.length]"
                [alt]="subject.name"
                loading="lazy"
              />
              <span class="subject-caption">
                <strong>{{ subject.name }}</strong>
                <small>{{ subject.nativeName || subject.code }}</small>
              </span>
            </a>
          }
        </div>
        @if (!subjects().length) {
          <p class="empty-text">
            {{ loading() ? 'Loading subjects...' : 'No subjects available yet.' }}
          </p>
        }
      </div>
    </section>

    <section class="section courses-section" id="courses_block">
      <div class="container">
        <div class="section-header">
          <p class="section-kicker">Courses</p>
          <h2 class="section-title">Our Popular Courses</h2>
        </div>
        <div class="courses-grid">
          @for (course of featuredCourses(); track course.id ?? $index) {
            <article class="course-item">
              <img
                class="course-image"
                [src]="course.imageUrl || '/img/carousel-1.jpg'"
                [alt]="course.name + ' course'"
                loading="lazy"
              />
              <div class="course-details">
                <div class="course-meta">
                  @if (course.level) {
                    <span class="meta-item">
                      <svg viewBox="0 0 24 24" class="meta-icon" aria-hidden="true"><path fill="currentColor" d="M2 12h2v9H2zM6 8h2v13H6zM10 4h2v17h-2zM14 8h2v13h-2zM18 4h2v17h-2zM22 8h2v9h-2z" transform="scale(0.7) translate(3 3)"/></svg>
                      {{ course.level }}
                    </span>
                  }
                  @if (course.price) {
                    <span class="meta-item">
                      <svg viewBox="0 0 24 24" class="meta-icon" aria-hidden="true"><path fill="currentColor" d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"/></svg>
                      {{ course.price }}
                    </span>
                  }
                </div>
                <h3 class="course-title">
                  <a routerLink="/courses">{{ course.name }}</a>
                </h3>
              </div>
            </article>
          }
        </div>
        @if (!featuredCourses().length) {
          <p class="empty-text">
            {{ loading() ? 'Loading courses...' : 'No courses available yet.' }}
          </p>
        }
        <div class="section-action">
          <a routerLink="/courses" class="btn-primary">View courses</a>
        </div>
      </div>
    </section>

    <section class="section news-section">
      <div class="container">
        <div class="section-header">
          <p class="section-kicker">Actuality</p>
          <h2 class="section-title">Latest News</h2>
        </div>
        <div class="news-grid">
          <div class="news-col">
            @if (latestBlog(); as blog) {
              <article class="news-item">
                <img
                  class="news-image"
                  [src]="blog.imageUrl || '/img/blog/blog_bg.jpg'"
                  [alt]="blog.title"
                  loading="lazy"
                />
                <div class="news-caption">
                  <h3>{{ blog.title }}</h3>
                  <a [routerLink]="['/blog', blog.slug || blog.id]" class="btn-primary btn-sm">Read more</a>
                </div>
              </article>
            } @else {
              <p class="empty-text">
                {{ loading() ? 'Loading news...' : 'No news yet.' }}
              </p>
            }
          </div>
        </div>
      </div>
    </section>

    <section class="section location-section">
      <div class="container">
        <div class="section-header">
          <p class="section-kicker">Find Us</p>
          <h2 class="section-title">Our Location</h2>
        </div>
        <iframe
          class="location-map"
          title="Orizzonti location in Tunis"
          src="https://www.google.com/maps?q=6%20Rue%20Lucie%20Faure%2C%20Tunis%201000&output=embed"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>
    </section>
  `,
  styles: `
    :host { display: block; }

    .container {
      max-width: 1140px;
      margin: 0 auto;
      padding: 0 1.5rem;
    }

    .section { padding: 3.5rem 0; }

    /* Hero carousel */
    .hero-carousel {
      min-height: 360px;
      height: min(56vw, 620px);
      position: relative;
      overflow: hidden;
      background: var(--adm-surface-muted, #44425a);
    }
    .hero-carousel > img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .hero-shade {
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, rgba(25,24,39,0.76), rgba(25,24,39,0.08));
    }
    .hero-caption {
      position: absolute;
      top: 50%;
      left: max(8%, calc((100% - 1140px) / 2));
      transform: translateY(-50%);
      max-width: 620px;
      padding: 1rem;
      color: #fff;
    }
    .hero-caption .kicker {
      text-transform: uppercase;
      letter-spacing: 3px;
      font-size: 0.9rem;
      font-weight: 600;
      margin-bottom: 0.75rem;
      color: var(--adm-primary-light, #3b82d6);
    }
    .hero-caption h1 {
      color: #fff;
      font-size: clamp(2rem, 5vw, 3.5rem);
      font-weight: 700;
      margin: 0 0 0.5rem;
    }
    .hero-caption p {
      max-width: 540px;
      font-size: 1.1rem;
      margin: 0 0 1.25rem;
    }
    .carousel-control {
      position: absolute;
      z-index: 2;
      top: 50%;
      width: 44px;
      height: 44px;
      transform: translateY(-50%);
      border: 0;
      border-radius: 50%;
      background: rgba(255,255,255,0.9);
      color: var(--adm-text, #44425a);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 150ms ease;
    }
    .carousel-control:hover { background: rgba(255,255,255,1); }
    .carousel-control svg { width: 24px; height: 24px; }
    .carousel-control.previous { left: 20px; }
    .carousel-control.next { right: 20px; }
    .carousel-toggle {
      position: absolute;
      z-index: 2;
      right: 20px;
      bottom: 12px;
      width: 36px;
      height: 36px;
      border: 0;
      border-radius: 50%;
      background: rgba(255,255,255,0.9);
      color: var(--adm-text, #44425a);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .carousel-toggle svg { width: 18px; height: 18px; }
    .slide-indicators {
      position: absolute;
      z-index: 2;
      bottom: 18px;
      left: 50%;
      display: flex;
      gap: 8px;
      transform: translateX(-50%);
    }
    .slide-indicators button {
      width: 24px;
      height: 6px;
      padding: 0;
      border: 0;
      border-radius: 3px;
      background: rgba(255,255,255,0.55);
      cursor: pointer;
      transition: background 150ms ease;
    }
    .slide-indicators button.active {
      background: var(--adm-primary, #0a5cbd);
    }

    /* Section headers */
    .section-kicker {
      letter-spacing: 4px;
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--adm-primary, #0a5cbd);
      text-transform: uppercase;
      margin: 0 0 0.5rem;
    }
    .section-title {
      font-size: clamp(1.5rem, 3vw, 2.25rem);
      font-weight: 600;
      margin: 0 0 1rem;
      color: var(--adm-text, #1f2937);
    }
    .section-header {
      text-align: center;
      margin-bottom: 2.5rem;
    }

    /* About */
    .about-section { background: var(--adm-surface, #fff); }
    .about-grid {
      display: grid;
      grid-template-columns: 5fr 7fr;
      gap: 2rem;
      align-items: center;
    }
    .about-image {
      width: 100%;
      max-height: 390px;
      object-fit: cover;
      border-radius: var(--adm-radius-card, 6px);
    }
    .about-content p { color: var(--adm-text-muted, #475569); line-height: 1.7; }
    .discover-link {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      color: var(--adm-primary, #0a5cbd);
      font-weight: 600;
      text-decoration: none;
      margin-top: 0.5rem;
    }
    .discover-link:hover { text-decoration: underline; }
    .arrow-icon { width: 16px; height: 16px; }

    /* Highlights */
    .highlights-section {
      background: var(--adm-surface-muted, #f1f4f9);
      padding: 2rem 0;
    }
    .highlights-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 1rem;
      text-align: center;
    }
    .highlight-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--adm-primary, #0a5cbd);
      margin: 0 0 0.25rem;
    }
    .highlight-label { margin: 0; color: var(--adm-text-muted, #475569); font-size: 0.9rem; }

    /* Subjects */
    .subjects-section { background: var(--adm-surface-muted, #f1f4f9); }
    .subjects-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 1.5rem;
    }
    .subject-item {
      display: block;
      position: relative;
      overflow: hidden;
      border-radius: var(--adm-radius-card, 6px);
      text-decoration: none;
      color: inherit;
      background: var(--adm-surface, #fff);
    }
    .subject-image {
      width: 100%;
      aspect-ratio: 4 / 3;
      object-fit: cover;
      transition: transform 280ms ease;
    }
    .subject-item:hover .subject-image { transform: scale(1.04); }
    .subject-item:focus-visible { outline: 2px solid var(--adm-primary, #0a5cbd); outline-offset: 2px; }
    .subject-caption {
      position: absolute;
      inset: auto 0 0;
      display: grid;
      gap: 2px;
      padding: 0.8rem 1rem;
      background: linear-gradient(transparent, rgba(15,23,42,0.92));
      color: #fff;
    }
    .subject-caption small { color: rgba(255,255,255,0.8); }

    /* Courses */
    .courses-section { background: var(--adm-surface, #fff); }
    .courses-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }
    .course-item {
      overflow: hidden;
      border-radius: var(--adm-radius-card, 6px);
      background: var(--adm-surface, #fff);
      box-shadow: 0 4px 12px var(--adm-shadow-color, rgba(15,23,42,0.08));
      transition: box-shadow 200ms ease, transform 200ms ease;
    }
    .course-item:hover { box-shadow: 0 8px 24px var(--adm-shadow-color, rgba(15,23,42,0.15)); transform: translateY(-2px); }
    .course-image {
      width: 100%;
      aspect-ratio: 16 / 10;
      object-fit: cover;
    }
    .course-details {
      padding: 1.25rem;
      background: var(--adm-surface-muted, #f8fafc);
    }
    .course-meta {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.75rem;
      font-size: 0.85rem;
      color: var(--adm-text-muted, #475569);
    }
    .meta-item { display: inline-flex; align-items: center; gap: 0.35rem; }
    .meta-icon { width: 14px; height: 14px; color: var(--adm-primary, #0a5cbd); }
    .course-title { font-size: 1.1rem; margin: 0; }
    .course-title a {
      color: var(--adm-text, #1f2937);
      text-decoration: none;
    }
    .course-title a:hover { color: var(--adm-primary, #0a5cbd); }
    .section-action { text-align: center; margin-top: 1.5rem; }

    /* News */
    .news-section { background: var(--adm-surface-muted, #f1f4f9); }
    .news-grid { display: flex; justify-content: center; }
    .news-col { max-width: 760px; width: 100%; }
    .news-item {
      position: relative;
      overflow: hidden;
      border-radius: var(--adm-radius-card, 6px);
    }
    .news-image {
      width: 100%;
      max-height: 430px;
      object-fit: cover;
    }
    .news-caption {
      position: absolute;
      inset: auto 0 0;
      padding: 2rem;
      background: linear-gradient(transparent, rgba(15,23,42,0.92));
    }
    .news-caption h3 { color: #fff; margin: 0 0 0.75rem; font-size: 1.25rem; }

    /* Buttons */
    .btn-primary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.6rem 1.5rem;
      border: 0;
      border-radius: var(--adm-radius-card, 6px);
      background: var(--adm-primary, #0a5cbd);
      color: var(--adm-text-on-primary, #fff);
      font: inherit;
      font-size: 0.95rem;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      transition: background 150ms ease, transform 100ms ease;
    }
    .btn-primary:hover { background: var(--adm-primary-dark, #084a99); }
    .btn-primary:active { transform: scale(0.98); }
    .btn-primary:focus-visible { outline: 2px solid var(--adm-primary, #0a5cbd); outline-offset: 2px; }
    .btn-sm { padding: 0.4rem 1rem; font-size: 0.85rem; }

    /* Location */
    .location-section { background: var(--adm-surface, #fff); }
    .location-map {
      display: block;
      width: 100%;
      height: 420px;
      border: 0;
      border-radius: var(--adm-radius-card, 6px);
    }

    .empty-text {
      text-align: center;
      color: var(--adm-text-muted, #475569);
      padding: 1.5rem 0;
    }

    /* Responsive */
    @media (max-width: 991px) {
      .about-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 720px) {
      .hero-carousel { height: 480px; }
      .hero-caption { left: 5%; right: 5%; }
      .hero-caption h1 { font-size: 2.5rem; }
      .news-caption { padding: 1rem; }
      .location-map { height: 320px; }
    }

    @media (prefers-reduced-motion: reduce) {
      .subject-image, .course-item, .btn-primary { transition: none; }
    }
  `,
})
export class HomePageComponent implements OnInit, OnDestroy {
  protected readonly site = inject(SiteContentService);
  protected readonly activeSlide = signal(0);
  protected readonly loading = signal(true);
  protected readonly slides = signal<Slide[]>([...DEFAULT_SLIDES]);
  protected readonly autoplayEnabled = signal(true);
  protected readonly subjects = signal<LanguageItem[]>([]);
  protected readonly featuredCourses = signal<CourseItem[]>([]);
  protected readonly latestBlog = signal<BlogItem | null>(null);

  readonly reducedMotion = signal(
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true,
  );

  private held = false;
  private timer: ReturnType<typeof setInterval> | null = null;

  readonly subjectImages = [
    '/img/cat-1.jpg',
    '/img/cat-2.jpg',
    '/img/cat-3.jpg',
    '/img/cat-4.jpg',
    '/img/cat-5.jpg',
  ];

  constructor(private readonly api: OrizzontiApiService) {}

  protected autoplayActive(): boolean {
    return (
      this.autoplayEnabled() &&
      !this.held &&
      !this.reducedMotion() &&
      this.slides().length > 1
    );
  }

  ngOnInit(): void {
    this.api.getSliderMedia().subscribe({
      next: (items) => {
        const slides = items
          .filter((item) => item.isActive !== false && item.imageUrl)
          .map((item) => ({ src: item.imageUrl, alt: item.altText || item.title }));
        if (slides.length) {
          this.slides.set(slides);
          this.activeSlide.set(0);
        }
        this.syncAutoplay();
      },
      error: () => this.syncAutoplay(),
    });
    this.syncAutoplay();

    let pending = 3;
    const done = () => {
      if (--pending === 0) {
        this.loading.set(false);
      }
    };
    this.api.getLanguages().subscribe({
      next: (items) => {
        this.subjects.set(items.filter((l) => l.isActive !== false).slice(0, 8));
        done();
      },
      error: done,
    });
    this.api.getFeaturedCourses().subscribe({
      next: (items) => {
        this.featuredCourses.set(items);
        done();
      },
      error: done,
    });
    this.api.getBlogs().subscribe({
      next: (items) => {
        this.latestBlog.set(items.find((b) => b.isPublished !== false) ?? null);
        done();
      },
      error: done,
    });
  }

  ngOnDestroy(): void {
    this.stopAutoplay();
  }

  protected toggleAutoplay(): void {
    this.autoplayEnabled.update((v) => !v);
    this.syncAutoplay();
  }

  protected holdAutoplay(): void {
    this.held = true;
    this.syncAutoplay();
  }

  protected releaseAutoplay(): void {
    this.held = false;
    this.syncAutoplay();
  }

  protected showPreviousSlide(): void {
    const len = this.slides().length;
    this.activeSlide.update((i) => (i - 1 + len) % len);
  }

  protected showNextSlide(): void {
    const len = this.slides().length;
    this.activeSlide.update((i) => (i + 1) % len);
  }

  private syncAutoplay(): void {
    this.stopAutoplay();
    if (this.autoplayActive()) {
      this.timer = setInterval(() => this.showNextSlide(), AUTOPLAY_MS);
    }
  }

  private stopAutoplay(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
