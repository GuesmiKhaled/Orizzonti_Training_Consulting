import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  BlogItem,
  OrizzontiApiService,
} from '../../services/orizzonti-api.service';

@Component({
  selector: 'app-blog-detail-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="page-header container-fluid bg-secondary py-5">
      <div class="container py-4">
        <h1 class="text-white">Actuality</h1>
        <div class="d-inline-flex text-white">
          <a routerLink="/" class="text-white">Home</a
          ><span class="px-2">/</span
          ><a routerLink="/blog" class="text-white">News</a
          ><span class="px-2">/</span><span>{{ blog?.title || 'Article' }}</span>
        </div>
      </div>
    </section>
    <section class="container-fluid py-5 legacy-page">
      <p *ngIf="loading" class="text-center">Loading...</p>
      <p *ngIf="notFound" class="text-center">Article not found.</p>
      <article *ngIf="blog" class="container article-content">
        <img
          class="img-fluid mb-4"
          [src]="blog.imageUrl || '/img/blog/blog_bg.jpg'"
          [alt]="blog.title"
        />
        <h2>{{ blog.title }}</h2>
        <p class="article-body">{{ blog.content }}</p>
        <a routerLink="/contact" class="btn btn-primary py-2 px-4"
          >Contact Orizzonti</a
        >
      </article>
    </section>
  `,
  styles: [
    `
      .page-header h1 {
        font-size: 2.5rem;
      }
      .article-content {
        max-width: 900px;
      }
      .article-content img {
        width: 100%;
        max-height: 460px;
        object-fit: cover;
      }
      .article-content h2 {
        margin-bottom: 1rem;
      }
      .article-body {
        white-space: pre-line;
      }
    `,
  ],
})
export class BlogDetailPageComponent implements OnInit {
  blog: BlogItem | null = null;
  loading = true;
  notFound = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly api: OrizzontiApiService,
  ) {}

  ngOnInit(): void {
    const key = this.route.snapshot.paramMap.get('slug');
    this.api.getBlogs().subscribe({
      next: (items) => {
        this.blog =
          items.find(
            (b) =>
              b.isPublished !== false &&
              (b.slug === key || String(b.id) === key),
          ) ?? null;
        this.notFound = !this.blog;
        this.loading = false;
      },
      error: () => {
        this.notFound = true;
        this.loading = false;
      },
    });
  }
}
