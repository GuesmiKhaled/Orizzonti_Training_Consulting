import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  BlogItem,
  OrizzontiApiService,
} from '../../services/orizzonti-api.service';

@Component({
  selector: 'app-blog-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="page-header container-fluid bg-secondary py-5">
      <div class="container py-4">
        <h1 class="text-white">Actuality</h1>
        <div class="d-inline-flex text-white">
          <a routerLink="/" class="text-white">Home</a
          ><span class="px-2">/</span><span>News</span>
        </div>
      </div>
    </section>
    <section class="container-fluid py-5 legacy-page">
      <div class="container py-3">
        <div class="text-center mb-5">
          <p class="text-primary text-uppercase mb-2">Actuality</p>
          <h2>Latest News</h2>
        </div>
        <p *ngIf="loading" class="text-center">Loading news...</p>
        <div *ngIf="error && !loading" class="alert alert-danger" role="alert">
          {{ error }}
          <button type="button" class="btn btn-link p-0 ml-2" (click)="load()">
            Retry
          </button>
        </div>
        <div *ngIf="!loading && !error && !blogs.length" class="alert alert-info">
          No news available at the moment.
        </div>
        <div class="row" *ngIf="blogs.length">
          <div class="col-lg-4 col-md-6 mb-4" *ngFor="let blog of blogs">
            <article class="news-card h-100 overflow-hidden">
              <img
                class="img-fluid news-image"
                [src]="blog.imageUrl || '/img/blog/blog_bg.jpg'"
                [alt]="blog.title"
              />
              <div class="p-4">
                <small class="text-muted" *ngIf="blog.createdAt">{{
                  blog.createdAt | date: 'mediumDate'
                }}</small>
                <h3 class="h5 my-2">{{ blog.title }}</h3>
                <p class="text-muted">{{ blog.excerpt }}</p>
                <a
                  [routerLink]="['/blog', blog.slug || blog.id]"
                  class="btn btn-primary btn-sm"
                  >Read more</a
                >
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .page-header h1 {
        font-size: 2.5rem;
      }
      .news-card {
        background: white;
        box-shadow: 0 5px 20px rgba(68, 66, 90, 0.1);
      }
      .news-image {
        width: 100%;
        aspect-ratio: 16 / 10;
        object-fit: cover;
      }
    `,
  ],
})
export class BlogPageComponent implements OnInit {
  blogs: BlogItem[] = [];
  loading = true;
  error: string | null = null;

  constructor(private readonly api: OrizzontiApiService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.api.getBlogs().subscribe({
      next: (items) => {
        this.blogs = items.filter((b) => b.isPublished !== false);
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load news';
        this.loading = false;
      },
    });
  }
}
