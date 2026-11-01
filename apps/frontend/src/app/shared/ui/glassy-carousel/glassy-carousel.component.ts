import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  effect,
  input,
  signal,
} from '@angular/core';

export interface GlassySlide {
  readonly image: string;
  readonly title: string;
  readonly subtitle: string;
}

const DEFAULT_AUTOPLAY_INTERVAL_MS = 5000;

@Component({
  selector: 'app-glassy-carousel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="carousel"
      aria-roledescription="carousel"
      [attr.aria-label]="ariaLabel()"
    >
      <div
        class="track"
        (touchstart)="onPanStart($event)"
        (touchmove)="onPanMove($event)"
        (touchend)="onPanEnd($event)"
        (mouseenter)="pauseAutoplay()"
        (mouseleave)="resumeAutoplay()"
        (focusin)="pauseAutoplay()"
        (focusout)="resumeAutoplay()"
      >
        @for (slide of slides(); track $index) {
          <article
            class="slide"
            [class.active]="$index === current()"
            [class.adjacent]="isAdjacent($index)"
            [attr.data-index]="$index"
            [attr.aria-hidden]="$index !== current()"
          >
            <img
              [src]="slide.image"
              [alt]="slide.title"
              loading="lazy"
              draggable="false"
            />
            <div class="glass">
              <h3>{{ slide.title }}</h3>
              <p>{{ slide.subtitle }}</p>
            </div>
          </article>
        }
      </div>

      <button
        type="button"
        class="nav prev"
        (click)="prev()"
        aria-label="Previous slide"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            d="M15 18l-6-6 6-6"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
      <button
        type="button"
        class="nav next"
        (click)="next()"
        aria-label="Next slide"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            d="M9 18l6-6-6-6"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>

      <div class="dots" role="tablist">
        @for (slide of slides(); track $index) {
          <button
            type="button"
            class="dot"
            [class.active]="$index === current()"
            [attr.aria-label]="'Go to slide ' + ($index + 1)"
            [attr.aria-selected]="$index === current()"
            (click)="goTo($index)"
          ></button>
        }
      </div>

      <div class="sr-only" aria-live="polite">
        Slide {{ current() + 1 }} of {{ slides().length }}:
        {{ slides()[current()].title }}
      </div>
    </section>
  `,
  styles: `
    :host {
      --slide-scale: 1;
      --slide-opacity: 1;
      --slide-blur: 0px;
      --slide-gap: 1rem;
      --slide-radius: 24px;
      --glass-bg: rgba(255, 255, 255, 0.12);
      --glass-border: rgba(255, 255, 255, 0.2);
      --glass-blur: 16px;
      --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
      display: block;
      position: relative;
      overflow: hidden;
      border-radius: var(--slide-radius);
      background:
        radial-gradient(
          ellipse at 30% 20%,
          var(--adm-bg-glow-a, rgba(215, 239, 228, 0.6)),
          transparent 60%
        ),
        radial-gradient(
          ellipse at 70% 80%,
          var(--adm-bg-glow-b, rgba(230, 238, 246, 0.6)),
          transparent 60%
        ),
        var(--adm-bg, #eef2ef);
      padding: 2rem 0;
    }

    .carousel {
      position: relative;
      max-width: 900px;
      margin: 0 auto;
    }

    .track {
      display: flex;
      align-items: center;
      gap: var(--slide-gap);
      padding: 0 3.5rem;
      overflow: hidden;
      scroll-snap-type: x mandatory;
    }

    .slide {
      flex: 0 0 80%;
      max-width: 80%;
      position: relative;
      border-radius: var(--slide-radius);
      overflow: hidden;
      transform: scale(var(--slide-scale));
      opacity: var(--slide-opacity);
      filter: blur(var(--slide-blur));
      transition:
        transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94),
        opacity 0.5s ease,
        filter 0.5s ease;
      scroll-snap-align: center;
    }

    .slide.active {
      --slide-scale: 1;
      --slide-opacity: 1;
      --slide-blur: 0px;
    }

    .slide.adjacent {
      --slide-scale: 0.85;
      --slide-opacity: 0.5;
      --slide-blur: 4px;
    }

    .slide:not(.active):not(.adjacent) {
      --slide-scale: 0.75;
      --slide-opacity: 0.25;
      --slide-blur: 8px;
    }

    .slide img {
      width: 100%;
      height: 320px;
      object-fit: cover;
      display: block;
    }

    .glass {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 1.5rem 2rem;
      background: var(--glass-bg);
      border-top: 1px solid var(--glass-border);
      backdrop-filter: blur(var(--glass-blur));
      -webkit-backdrop-filter: blur(var(--glass-blur));
      box-shadow: var(--glass-shadow);
    }

    @supports not (
      (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))
    ) {
      .glass {
        background: rgba(15, 45, 41, 0.85);
      }
    }

    .glass h3 {
      margin: 0 0 0.25rem;
      color: #fff;
      font-size: 1.25rem;
      font-weight: 700;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
    }

    .glass p {
      margin: 0;
      color: rgba(255, 255, 255, 0.85);
      font-size: 0.9rem;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
    }

    .nav {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      z-index: 2;
      width: 44px;
      height: 44px;
      border: none;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      color: #fff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition:
        background 0.2s ease,
        transform 0.2s ease;
    }

    .nav:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateY(-50%) scale(1.1);
    }

    .nav:focus-visible {
      outline: 2px solid var(--adm-primary, #0d5c55);
      outline-offset: 2px;
    }

    .nav.prev {
      left: 0.5rem;
    }

    .nav.next {
      right: 0.5rem;
    }

    .nav svg {
      width: 24px;
      height: 24px;
    }

    .dots {
      display: flex;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 1rem;
    }

    .dot {
      width: 10px;
      height: 10px;
      border: none;
      border-radius: 50%;
      background: rgba(15, 45, 41, 0.25);
      cursor: pointer;
      transition:
        background 0.2s ease,
        transform 0.2s ease;
    }

    .dot.active {
      background: var(--adm-primary, #0d5c55);
      transform: scale(1.3);
    }

    .dot:focus-visible {
      outline: 2px solid var(--adm-primary, #0d5c55);
      outline-offset: 2px;
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    @media (max-width: 768px) {
      .slide {
        flex: 0 0 90%;
        max-width: 90%;
      }

      .slide img {
        height: 240px;
      }

      .track {
        padding: 0 3rem;
      }
    }

    @media (max-width: 360px) {
      .slide {
        flex: 0 0 95%;
        max-width: 95%;
      }

      .slide img {
        height: 200px;
      }

      .glass {
        padding: 1rem 1.25rem;
      }

      .glass h3 {
        font-size: 1rem;
      }

      .glass p {
        font-size: 0.8rem;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .slide {
        transition: opacity 0.2s ease;
        transform: none !important;
        filter: none !important;
      }

      .nav:hover {
        transform: translateY(-50%);
      }

      .dot {
        transition: none;
      }
    }
  `,
})
export class GlassyCarouselComponent {
  readonly slides = input.required<readonly GlassySlide[]>();
  readonly autoplay = input<boolean>(true);
  readonly autoplayInterval = input<number>(DEFAULT_AUTOPLAY_INTERVAL_MS);
  readonly loop = input<boolean>(true);
  readonly ariaLabel = input<string>('Featured content carousel');

  readonly current = signal(0);
  private readonly isPaused = signal(false);
  private autoplayTimer?: ReturnType<typeof setInterval>;
  private panStartX = 0;
  private panDeltaX = 0;

  readonly count = computed(() => this.slides().length);

  constructor() {
    effect(() => {
      // Reset autoplay when inputs change.
      this.setupAutoplay();
    });
  }

  private setupAutoplay(): void {
    this.clearAutoplay();
    if (this.autoplay() && !this.reducedMotion() && this.count() > 1) {
      this.autoplayTimer = setInterval(() => {
        if (!this.isPaused()) {
          this.next();
        }
      }, this.autoplayInterval());
    }
  }

  private clearAutoplay(): void {
    if (this.autoplayTimer) {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = undefined;
    }
  }

  private reducedMotion(): boolean {
    return (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }

  next(): void {
    const idx = this.current();
    if (idx < this.count() - 1) {
      this.current.set(idx + 1);
    } else if (this.loop()) {
      this.current.set(0);
    }
  }

  prev(): void {
    const idx = this.current();
    if (idx > 0) {
      this.current.set(idx - 1);
    } else if (this.loop()) {
      this.current.set(this.count() - 1);
    }
  }

  goTo(index: number): void {
    if (index >= 0 && index < this.count()) {
      this.current.set(index);
    }
  }

  isAdjacent(index: number): boolean {
    const c = this.current();
    return (
      index === c - 1 ||
      index === c + 1 ||
      (this.loop() && c === 0 && index === this.count() - 1) ||
      (this.loop() && c === this.count() - 1 && index === 0)
    );
  }

  pauseAutoplay(): void {
    this.isPaused.set(true);
  }

  resumeAutoplay(): void {
    this.isPaused.set(false);
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.prev();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.next();
    }
  }

  onPanStart(event: TouchEvent): void {
    this.panStartX = event.touches[0]?.clientX ?? 0;
    this.pauseAutoplay();
  }

  onPanMove(event: TouchEvent): void {
    this.panDeltaX = (event.touches[0]?.clientX ?? 0) - this.panStartX;
  }

  onPanEnd(event: TouchEvent): void {
    const endX = event.changedTouches[0]?.clientX ?? 0;
    this.panDeltaX = endX - this.panStartX;
    const threshold = 50;
    if (this.panDeltaX < -threshold) {
      this.next();
    } else if (this.panDeltaX > threshold) {
      this.prev();
    }
    this.panDeltaX = 0;
    this.resumeAutoplay();
  }
}
