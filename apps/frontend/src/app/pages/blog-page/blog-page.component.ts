import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  BlogItem,
  OrizzontiApiService,
} from '../../services/orizzonti-api.service';

@Component({
  selector: 'app-blog-page',
  standalone: true,
  imports: [RouterLink, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="page-hero">
      <div class="container">
        <h1>Actuality</h1>
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <a routerLink="/">Home</a>
          <span class="sep" aria-hidden="true">/</span>
          <span aria-current="page">News</span>
        </nav>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-header">
          <p class="section-kicker">Actuality</p>
          <h2 class="section-title">Latest News</h2>
        </div>

        @if (loading()) {
          <p class="state-text">Loading news...</p>
        } @else if (error()) {
          <div class="alert-error" role="alert">
            {{ error() }}
            <button type="button" class="retry-link" (click)="load()">Retry</button>
          </div>
        } @else if (!blogs().length) {
          <div class="state-info">No news available at the moment.</div>
        } @else {
          <div class="news-grid">
            @for (blog of blogs(); track blog.id) {
              <article class="news-card">
                <img
                  class="news-image"
                  [src]="blog.imageUrl || '/img/blog/blog_bg.jpg'"
                  [alt]="blog.title"
                  loading="lazy"
                />
                <div class="news-body">
                  @if (blog.createdAt) {
                    <time class="news-date">{{ blog.createdAt | date: 'mediumDate' }}</time>
                  }
                  <h3 class="news-title">{{ blog.title }}</h3>
                  <p class="news-excerpt">{{ blog.excerpt }}</p>
                  <a [routerLink]="['/blog', blog.slug || blog.id]" class="btn-primary btn-sm">Read more</a>
                </div>
              </article>
            }
          </div>
        }
      </div>
    </section>
  `,
  styles: `
    :host { display: block; }
    .container { max-width: 1140px; margin: 0 auto; padding: 0 1.5rem; }
    .section { padding: 3.5rem 0; background: var(--adm-surface, #fff); }

    .page-hero {
      background: linear-gradient(135deg, var(--adm-primary, #0a5cbd), var(--adm-primary-dark, #084a99));
      padding: 4rem 0;
    }
    .page-hero h1 { color: #fff; font-size: clamp(2rem, 4vw, 2.5rem); margin: 0 0 0.5rem; }
    .breadcrumb { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; }
    .breadcrumb a { color: rgba(255,255,255,0.85); text-decoration: none; }
    .breadcrumb a:hover { color: #fff; text-decoration: underline; }
    .breadcrumb .sep { color: rgba(255,255,255,0.6); }
    .breadcrumb span[aria-current] { color: #fff; }

    .section-header { text-align: center; margin-bottom: 2.5rem; }
    .section-kicker {
      letter-spacing: 4px; font-size: 0.9rem; font-weight: 600;
      color: var(--adm-primary, #0a5cbd); text-transform: uppercase;
      margin: 0 0 0.5rem;
    }
    .section-title {
      font-size: clamp(1.5rem, 3vw, 2.25rem); font-weight: 600;
      margin: 0; color: var(--adm-text, #1f2937);
    }

    .news-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }
    .news-card {
      display: flex; flex-direction: column;
      overflow: hidden;
      border-radius: var(--adm-radius-card, 6px);
      background: var(--adm-surface, #fff);
      box-shadow: 0 4px 12px var(--adm-shadow-color, rgba(15,23,42,0.08));
      transition: transform 200ms ease, box-shadow 200ms ease;
    }
    .news-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px var(--adm-shadow-color, rgba(15,23,42,0.15));
    }
    .news-image {
      width: 100%;
      aspect-ratio: 16 / 10;
      object-fit: cover;
    }
    .news-body { padding: 1.25rem; display: grid; gap: 0.5rem; }
    .news-date { font-size: 0.8rem; color: var(--adm-text-muted, #475569); }
    .news-title { font-size: 1.15rem; margin: 0; color: var(--adm-text, #1f2937); }
    .news-excerpt { font-size: 0.9rem; color: var(--adm-text-muted, #475569); margin: 0; line-height: 1.6; }

    .btn-primary {
      display: inline-flex; align-items: center; justify-content: center;
      padding: 0.6rem 1.5rem; border: 0;
      border-radius: var(--adm-radius-card, 6px);
      background: var(--adm-primary, #0a5cbd);
      color: var(--adm-text-on-primary, #fff);
      font: inherit; font-size: 0.95rem; font-weight: 600;
      text-decoration: none; cursor: pointer;
      transition: background 150ms ease, transform 100ms ease;
      align-self: start;
    }
    .btn-primary:hover { background: var(--adm-primary-dark, #084a99); }
    .btn-primary:active { transform: scale(0.98); }
    .btn-primary:focus-visible { outline: 2px solid var(--adm-primary, #0a5cbd); outline-offset: 2px; }
    .btn-sm { padding: 0.4rem 1rem; font-size: 0.85rem; }

    .state-text, .state-info { text-align: center; padding: 2rem; color: var(--adm-text-muted, #475569); }
    .alert-error {
      padding: 1rem 1.25rem; border-radius: var(--adm-radius-card, 6px);
      background: var(--adm-danger-bg, #fee2e2); color: var(--adm-danger-dark, #b91c1c);
      display: flex; align-items: center; gap: 0.75rem; justify-content: center;
    }
    .retry-link {
      background: transparent; border: 0; color: var(--adm-primary, #0a5cbd);
      font: inherit; font-weight: 600; cursor: pointer; text-decoration: underline;
      padding: 0;
    }
    .retry-link:focus-visible { outline: 2px solid var(--adm-primary, #0a5cbd); outline-offset: 2px; }

    @media (prefers-reduced-motion: reduce) {
      .news-card, .btn-primary { transition: none; }
    }
  `,
})
export class BlogPageComponent implements OnInit {
  private readonly api = inject(OrizzontiApiService);
  protected readonly blogs = signal<BlogItem[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void { this.load(); }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getBlogs().subscribe({
      next: (items) => {
        this.blogs.set(items.filter((b) => b.isPublished !== false));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load news');
        this.loading.set(false);
      },
    });
  }
}
