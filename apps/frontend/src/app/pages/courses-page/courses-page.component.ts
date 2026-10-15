import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  OrizzontiApiService,
  LanguageItem,
} from '../../services/orizzonti-api.service';

@Component({
  selector: 'app-courses-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="page-header container-fluid bg-secondary py-5">
      <div class="container py-4">
        <h1 class="text-white">Languages</h1>
        <div class="d-inline-flex text-white">
          <a routerLink="/" class="text-white">Home</a
          ><span class="px-2">/</span><span>Languages</span>
        </div>
      </div>
    </section>
    <section class="container-fluid py-5 legacy-page">
      <div class="container py-3">
        <div class="text-center mb-5">
          <p class="text-primary text-uppercase mb-2">Languages</p>
          <h2>Our Language Courses</h2>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading" class="text-center py-5">
          <p>Loading languages...</p>
        </div>

        <!-- Error State -->
        <div *ngIf="error && !loading" class="alert alert-danger" role="alert">
          {{ error }}
        </div>

        <!-- Languages Grid -->
        <div *ngIf="!loading && languages.length > 0" class="row">
          <div
            class="col-lg-4 col-md-6 mb-4"
            *ngFor="let language of languages"
          >
            <a
              [routerLink]="['/languages', language.id]"
              class="language-item overflow-hidden h-100 d-block text-decoration-none"
            >
              <article class="course-item overflow-hidden h-100">
                <div class="course-image bg-secondary d-flex align-items-center justify-content-center">
                  <div class="text-center text-white">
                    <h3 class="mb-2">{{ language.name }}</h3>
                    <p *ngIf="language.nativeName" class="mb-0">
                      {{ language.nativeName }}
                    </p>
                  </div>
                </div>
                <div class="bg-secondary p-4">
                  <h2 class="h5 mb-2">{{ language.name }}</h2>
                  <p class="mt-2 mb-0 text-muted">
                    <i class="fa fa-graduation-cap text-primary mr-2"></i>
                    View exam calendar
                  </p>
                </div>
              </article>
            </a>
          </div>
        </div>

        <!-- No Languages State -->
        <div *ngIf="!loading && languages.length === 0" class="alert alert-info">
          No languages available at the moment.
        </div>

        <div class="text-center mt-3">
          <a routerLink="/contact" class="btn btn-primary py-2 px-4"
            >Contact us about courses</a
          >
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .page-header h1 {
        font-size: 2.5rem;
      }
      .language-item {
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        color: inherit;
      }
      .language-item:hover {
        transform: translateY(-5px);
      }
      .course-item {
        background: white;
        box-shadow: 0 5px 20px rgba(68, 66, 90, 0.1);
      }
      .language-item:hover .course-item {
        box-shadow: 0 10px 30px rgba(68, 66, 90, 0.2);
      }
      .course-image {
        width: 100%;
        aspect-ratio: 16 / 10;
        object-fit: cover;
        min-height: 200px;
      }
    `,
  ],
})
export class CoursesPageComponent implements OnInit {
  languages: LanguageItem[] = [];
  loading = true;
  error: string | null = null;

  constructor(private readonly apiService: OrizzontiApiService) {}

  ngOnInit() {
    this.loadLanguages();
  }

  private loadLanguages() {
    this.loading = true;
    this.error = null;

    this.apiService.getLanguages().subscribe({
      next: (languages) => {
        this.languages = languages.filter((l) => l.isActive !== false);
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load languages';
        this.loading = false;
      },
    });
  }
}
