import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  BlogItem,
  OrizzontiApiService,
} from '../../services/orizzonti-api.service';

@Component({
  selector: 'app-blog-detail-page',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="page-hero">
      <div class="container">
        <h1>Actuality</h1>
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <a routerLink="/">Home</a>
          <span class="sep" aria-hidden="true">/</span>
          <a routerLink="/blog">News</a>
          <span class="sep" aria-hidden="true">/</span>
          <span aria-current="page">{{ blog()?.title || 'Article' }}</span>
        </nav>
      </div>
    </section>

    <section class="section">
      <div class="container">
        @if (loading()) {
          <p class="state-text">Loading...</p>
        } @else if (notFound()) {
          <p class="state-text">Article not found.</p>
        } @else if (blog()) {
          <article class="article-content">
            <img
              class="article-image"
              [src]="blog()!.imageUrl || '/img/blog/blog_bg.jpg'"
              [alt]="blog()!.title"
              loading="lazy"
            />
            <h2 class="article-title">{{ blog()!.title }}</h2>
            <p class="article-body">{{ blog()!.content }}</p>
            <a routerLink="/contact" class="btn-primary">Contact Orizzonti</a>
          </article>
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
    .breadcrumb { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; flex-wrap: wrap; }
    .breadcrumb a { color: rgba(255,255,255,0.85); text-decoration: none; }
    .breadcrumb a:hover { color: #fff; text-decoration: underline; }
    .breadcrumb .sep { color: rgba(255,255,255,0.6); }
    .breadcrumb span[aria-current] { color: #fff; }

    .article-content { max-width: 900px; margin: 0 auto; }
    .article-image {
      width: 100%; max-height: 460px; object-fit: cover;
      border-radius: var(--adm-radius-card, 6px); margin-bottom: 1.5rem;
    }
    .article-title {
      font-size: clamp(1.5rem, 3vw, 2rem); margin: 0 0 1rem;
      color: var(--adm-text, #1f2937);
    }
    .article-body { white-space: pre-line; line-height: 1.7; color: var(--adm-text-muted, #475569); }

    .btn-primary {
      display: inline-flex; align-items: center; justify-content: center;
      padding: 0.6rem 1.5rem; border: 0;
      border-radius: var(--adm-radius-card, 6px);
      background: var(--adm-primary, #0a5cbd);
      color: var(--adm-text-on-primary, #fff);
      font: inherit; font-size: 0.95rem; font-weight: 600;
      text-decoration: none; cursor: pointer;
      transition: background 150ms ease, transform 100ms ease;
      margin-top: 1rem;
    }
    .btn-primary:hover { background: var(--adm-primary-dark, #084a99); }
    .btn-primary:active { transform: scale(0.98); }
    .btn-primary:focus-visible { outline: 2px solid var(--adm-primary, #0a5cbd); outline-offset: 2px; }

    .state-text { text-align: center; padding: 2rem; color: var(--adm-text-muted, #475569); }

    @media (prefers-reduced-motion: reduce) { .btn-primary { transition: none; } }
  `,
})
export class BlogDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(OrizzontiApiService);
  protected readonly blog = signal<BlogItem | null>(null);
  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);

  ngOnInit(): void {
    const key = this.route.snapshot.paramMap.get('slug');
    this.api.getBlogs().subscribe({
      next: (items) => {
        const found = items.find(
          (b) =>
            b.isPublished !== false &&
            (b.slug === key || String(b.id) === key),
        ) ?? null;
        this.blog.set(found);
        this.notFound.set(!found);
        this.loading.set(false);
      },
      error: () => {
        this.notFound.set(true);
        this.loading.set(false);
      },
    });
  }
}
