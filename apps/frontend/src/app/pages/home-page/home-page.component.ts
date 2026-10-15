import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
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

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section
      class="hero-carousel"
      aria-label="Orizzonti highlights"
      aria-roledescription="carousel"
      [attr.aria-live]="autoplayActive ? 'off' : 'polite'"
      (mouseenter)="holdAutoplay()"
      (mouseleave)="releaseAutoplay()"
      (focusin)="holdAutoplay()"
      (focusout)="releaseAutoplay()"
    >
      <img [src]="slides[activeSlide].src" [alt]="slides[activeSlide].alt" />
      <div class="hero-shade"></div>
      <div class="hero-caption">
        <p class="text-uppercase mb-3">Training &amp; Consulting</p>
        <h1>{{ site.heroTitle() }}</h1>
        <p>{{ site.heroSubtitle() }}</p>
        <a routerLink="/courses" class="btn btn-primary py-2 px-4"
          >Explore courses</a
        >
      </div>
      <button
        *ngIf="slides.length > 1"
        type="button"
        class="carousel-control previous"
        aria-label="Previous slide"
        (click)="showPreviousSlide()"
      >
        <i class="fa fa-chevron-left" aria-hidden="true"></i>
      </button>
      <button
        *ngIf="slides.length > 1"
        type="button"
        class="carousel-control next"
        aria-label="Next slide"
        (click)="showNextSlide()"
      >
        <i class="fa fa-chevron-right" aria-hidden="true"></i>
      </button>
      <button
        *ngIf="slides.length > 1 && !reducedMotion"
        type="button"
        class="carousel-toggle"
        [attr.aria-label]="autoplayEnabled ? 'Pause slideshow' : 'Play slideshow'"
        (click)="toggleAutoplay()"
      >
        <i
          class="fa"
          [class.fa-pause]="autoplayEnabled"
          [class.fa-play]="!autoplayEnabled"
          aria-hidden="true"
        ></i>
      </button>
      <div
        *ngIf="slides.length > 1"
        class="slide-indicators"
        aria-label="Choose slide"
      >
        <button
          *ngFor="let slide of slides; let index = index"
          type="button"
          [class.active]="index === activeSlide"
          [attr.aria-label]="'Show slide ' + (index + 1)"
          [attr.aria-pressed]="index === activeSlide"
          (click)="activeSlide = index"
        ></button>
      </div>
    </section>

    <section class="container-fluid py-5" id="about_block">
      <div class="container py-4">
        <div class="row align-items-center">
          <div class="col-lg-5 mb-4 mb-lg-0">
            <img
              class="img-fluid about-image"
              src="/img/orizontiLanguages.jpg"
              alt="Orizzonti language training"
            />
          </div>
          <div class="col-lg-7">
            <p class="section-kicker text-primary text-uppercase mb-2">
              About Us
            </p>
            <h2 class="section-title mb-4">
              Orizzonti Training &amp; Consulting
            </h2>
            @if (site.aboutParagraphs(); as paragraphs) {
              @for (paragraph of paragraphs; track $index) {
                <p>{{ paragraph }}</p>
              }
            } @else {
              <p>
                <strong>Orizzonti Training &amp; Consulting</strong> provides
                Italian language classes and communication skills to students
                who need Italian certification. The center has an Italian
                language certificate approved by CERT.IT SIS in Tunisia. We
                also provide courses in other languages.
              </p>
            }
            <a routerLink="/about" class="text-primary font-weight-semi-bold"
              >Discover Orizzonti
              <i class="fa fa-angle-right ml-1" aria-hidden="true"></i
            ></a>
          </div>
        </div>
      </div>
    </section>

    @if (site.highlights().length) {
      <section
        class="container-fluid bg-secondary py-4"
        aria-label="Orizzonti in numbers"
      >
        <div class="container">
          <div class="row text-center">
            @for (item of site.highlights(); track item.label) {
              <div class="col-6 col-md mb-3 mb-md-0">
                <p class="h3 text-primary mb-1">{{ item.value }}</p>
                <p class="mb-0">{{ item.label }}</p>
              </div>
            }
          </div>
        </div>
      </section>
    }

    <section class="container-fluid bg-secondary py-5">
      <div class="container pt-3 pb-2">
        <div class="text-center mb-5">
          <p class="section-kicker text-primary text-uppercase mb-2">
            Subjects
          </p>
          <h2 class="section-title">Explore Top Subjects</h2>
        </div>
        <div class="row">
          <div
            class="col-lg-3 col-md-6 mb-4"
            *ngFor="let subject of subjects; let i = index"
          >
            <a
              [routerLink]="['/languages', subject.id]"
              class="subject-item position-relative d-block overflow-hidden"
            >
              <img
                class="img-fluid subject-image"
                [src]="subject.imageUrl || subjectImages[i % subjectImages.length]"
                [alt]="subject.name"
              />
              <span class="subject-caption"
                ><strong>{{ subject.name }}</strong
                ><small>{{ subject.nativeName || subject.code }}</small></span
              >
            </a>
          </div>
        </div>
        <p *ngIf="!subjects.length" class="text-center text-muted">
          {{ loading ? 'Loading subjects...' : 'No subjects available yet.' }}
        </p>
      </div>
    </section>

    <section class="container-fluid py-5" id="courses_block">
      <div class="container py-3">
        <div class="text-center mb-5">
          <p class="section-kicker text-primary text-uppercase mb-2">Courses</p>
          <h2 class="section-title">Our Popular Courses</h2>
        </div>
        <div class="row">
          <div
            class="col-lg-4 col-md-6 mb-4"
            *ngFor="let course of featuredCourses"
          >
            <article class="course-item overflow-hidden h-100">
              <img
                class="img-fluid course-image"
                [src]="course.imageUrl || '/img/carousel-1.jpg'"
                [alt]="course.name + ' course'"
              />
              <div class="course-details bg-secondary p-4">
                <div class="d-flex justify-content-between mb-3">
                  <small *ngIf="course.level"
                    ><i
                      class="fa fa-signal text-primary mr-2"
                      aria-hidden="true"
                    ></i
                    >{{ course.level }}</small
                  ><small *ngIf="course.price"
                    ><i
                      class="fa fa-tag text-primary mr-2"
                      aria-hidden="true"
                    ></i
                    >{{ course.price }}</small
                  >
                </div>
                <h3 class="h5 mb-0">
                  <a routerLink="/courses">{{ course.name }}</a>
                </h3>
              </div>
            </article>
          </div>
        </div>
        <p *ngIf="!featuredCourses.length" class="text-center text-muted">
          {{ loading ? 'Loading courses...' : 'No courses available yet.' }}
        </p>
        <div class="text-center mt-3">
          <a routerLink="/courses" class="btn btn-primary py-2 px-4"
            >View courses</a
          >
        </div>
      </div>
    </section>

    <section class="container-fluid bg-secondary py-5">
      <div class="container py-3">
        <div class="text-center mb-5">
          <p class="section-kicker text-primary text-uppercase mb-2">
            Actuality
          </p>
          <h2 class="section-title">Latest News</h2>
        </div>
        <div class="row justify-content-center">
          <div class="col-lg-8">
            <article
              *ngIf="latestBlog; else noNews"
              class="news-item position-relative overflow-hidden"
            >
              <img
                class="img-fluid news-image"
                [src]="latestBlog.imageUrl || '/img/blog/blog_bg.jpg'"
                [alt]="latestBlog.title"
              />
              <div class="news-caption">
                <h3 class="h5 text-white">{{ latestBlog.title }}</h3>
                <a
                  [routerLink]="['/blog', latestBlog.slug || latestBlog.id]"
                  class="btn btn-primary btn-sm"
                  >Read more</a
                >
              </div>
            </article>
            <ng-template #noNews>
              <p class="text-center text-muted">
                {{ loading ? 'Loading news...' : 'No news yet.' }}
              </p>
            </ng-template>
          </div>
        </div>
      </div>
    </section>

    <section class="container-fluid py-5">
      <div class="container py-3">
        <div class="text-center mb-4">
          <p class="section-kicker text-primary text-uppercase mb-2">Find Us</p>
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
  styles: [
    `
      .hero-carousel {
        min-height: 360px;
        height: min(56vw, 620px);
        position: relative;
        overflow: hidden;
        background: #44425a;
      }
      .hero-carousel > img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .hero-shade {
        position: absolute;
        inset: 0;
        background: linear-gradient(
          90deg,
          rgba(25, 24, 39, 0.76),
          rgba(25, 24, 39, 0.08)
        );
      }
      .hero-caption {
        position: absolute;
        top: 50%;
        left: max(8%, calc((100% - 1140px) / 2));
        transform: translateY(-50%);
        max-width: 620px;
        padding: 1rem;
        color: white;
      }
      .hero-caption h1 {
        color: white;
        font-size: 3.5rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
      }
      .hero-caption p {
        max-width: 540px;
        font-size: 1.1rem;
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
        background: rgba(255, 255, 255, 0.9);
        color: #44425a;
        cursor: pointer;
      }
      .carousel-control.previous {
        left: 20px;
      }
      .carousel-control.next {
        right: 20px;
      }
      .carousel-toggle {
        position: absolute;
        z-index: 2;
        right: 20px;
        bottom: 12px;
        width: 36px;
        height: 36px;
        border: 0;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.9);
        color: #44425a;
        cursor: pointer;
      }
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
        background: rgba(255, 255, 255, 0.55);
        cursor: pointer;
      }
      .slide-indicators button.active {
        background: #ff6600;
      }
      .section-kicker {
        letter-spacing: 4px;
        font-size: 0.9rem;
        font-weight: 600;
      }
      .section-title {
        font-size: 2.25rem;
        font-weight: 600;
      }
      .about-image {
        width: 100%;
        max-height: 390px;
        object-fit: cover;
      }
      .subject-item,
      .course-item,
      .news-item {
        color: inherit;
        background: white;
      }
      .subject-image {
        width: 100%;
        aspect-ratio: 4 / 3;
        object-fit: cover;
        transition: transform 180ms ease;
      }
      .subject-item:hover .subject-image {
        transform: scale(1.04);
      }
      .subject-caption {
        position: absolute;
        inset: auto 0 0;
        display: grid;
        gap: 2px;
        padding: 0.8rem 1rem;
        background: rgba(68, 66, 90, 0.92);
        color: white;
      }
      .subject-caption small {
        color: #eee;
      }
      .course-item {
        box-shadow: 0 5px 20px rgba(68, 66, 90, 0.1);
      }
      .course-image {
        width: 100%;
        aspect-ratio: 16 / 10;
        object-fit: cover;
      }
      .course-details a {
        color: #44425a;
      }
      .course-details a:hover {
        color: #ff6600;
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
        background: linear-gradient(transparent, rgba(24, 23, 36, 0.92));
      }
      .location-map {
        display: block;
        width: 100%;
        height: 420px;
        border: 0;
      }
      @media (max-width: 720px) {
        .hero-carousel {
          height: 480px;
        }
        .hero-caption {
          left: 5%;
          right: 5%;
        }
        .hero-caption h1 {
          font-size: 2.5rem;
        }
        .hero-caption p {
          font-size: 1rem;
        }
        .section-title {
          font-size: 1.8rem;
        }
        .carousel-control.previous {
          left: 8px;
        }
        .carousel-control.next {
          right: 8px;
        }
        .news-caption {
          padding: 1rem;
        }
        .location-map {
          height: 320px;
        }
      }
    `,
  ],
})
export class HomePageComponent implements OnInit, OnDestroy {
  protected readonly site = inject(SiteContentService);
  activeSlide = 0;
  loading = true;

  /** Replaced by the active slider media from the admin area when there is any. */
  slides: { src: string; alt: string }[] = [...DEFAULT_SLIDES];

  autoplayEnabled = true;
  readonly reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
  private held = false;
  private timer: ReturnType<typeof setInterval> | null = null;

  readonly subjectImages = [
    '/img/cat-1.jpg',
    '/img/cat-2.jpg',
    '/img/cat-3.jpg',
    '/img/cat-4.jpg',
    '/img/cat-5.jpg',
  ];

  subjects: LanguageItem[] = [];
  featuredCourses: CourseItem[] = [];
  latestBlog: BlogItem | null = null;

  constructor(private readonly api: OrizzontiApiService) {}

  get autoplayActive(): boolean {
    return (
      this.autoplayEnabled &&
      !this.held &&
      !this.reducedMotion &&
      this.slides.length > 1
    );
  }

  ngOnInit(): void {
    this.api.getSliderMedia().subscribe({
      next: (items) => {
        const slides = items
          .filter((item) => item.isActive !== false && item.imageUrl)
          .map((item) => ({ src: item.imageUrl, alt: item.altText || item.title }));
        if (slides.length) {
          this.slides = slides;
          this.activeSlide = 0;
        }
        this.syncAutoplay();
      },
      error: () => this.syncAutoplay(),
    });
    this.syncAutoplay();

    let pending = 3;
    const done = () => {
      if (--pending === 0) {
        this.loading = false;
      }
    };
    this.api.getLanguages().subscribe({
      next: (items) => {
        this.subjects = items.filter((l) => l.isActive !== false).slice(0, 8);
        done();
      },
      error: done,
    });
    this.api.getFeaturedCourses().subscribe({
      next: (items) => {
        this.featuredCourses = items;
        done();
      },
      error: done,
    });
    this.api.getBlogs().subscribe({
      next: (items) => {
        this.latestBlog = items.find((b) => b.isPublished !== false) ?? null;
        done();
      },
      error: done,
    });
  }

  ngOnDestroy(): void {
    this.stopAutoplay();
  }

  toggleAutoplay(): void {
    this.autoplayEnabled = !this.autoplayEnabled;
    this.syncAutoplay();
  }

  /** Hover and keyboard focus pause the slideshow. */
  holdAutoplay(): void {
    this.held = true;
    this.syncAutoplay();
  }

  releaseAutoplay(): void {
    this.held = false;
    this.syncAutoplay();
  }

  private syncAutoplay(): void {
    this.stopAutoplay();
    if (this.autoplayActive) {
      this.timer = setInterval(() => this.showNextSlide(), AUTOPLAY_MS);
    }
  }

  private stopAutoplay(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  showPreviousSlide(): void {
    this.activeSlide =
      (this.activeSlide - 1 + this.slides.length) % this.slides.length;
  }

  showNextSlide(): void {
    this.activeSlide = (this.activeSlide + 1) % this.slides.length;
  }
}
