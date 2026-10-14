import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-about-page',
  standalone: true,
  template: `
    <section class="page-header container-fluid bg-secondary py-5">
      <div class="container py-4">
        <h1 class="text-white">About Us</h1>
        <div class="d-inline-flex text-white">
          <a routerLink="/" class="text-white">Home</a
          ><span class="px-2">/</span><span>About</span>
        </div>
      </div>
    </section>
    <section class="container-fluid py-5 legacy-page">
      <div class="container py-3">
        <div class="row align-items-center">
          <div class="col-lg-5 mb-4 mb-lg-0">
            <img
              class="img-fluid"
              src="/img/orizontiLanguages.jpg"
              alt="Orizzonti language courses"
            />
          </div>
          <div class="col-lg-7">
            <p class="text-primary text-uppercase font-weight-semi-bold mb-2">
              About Us
            </p>
            <h2>Orizzonti Training &amp; Consulting</h2>
            <p>
              <strong>Orizzonti Training &amp; Consulting</strong> provides
              Italian language classes and communication skills to students who
              need certification in Italian. Our center has an approved
              certificate in the Italian language by CERT.IT SIS in Tunisia. We
              also provide courses in other languages.
            </p>
            <a routerLink="/courses" class="btn btn-primary py-2 px-4"
              >Explore subjects</a
            >
          </div>
        </div>
      </div>
    </section>
  `,
  imports: [RouterLink],
  styles: [
    `
      .page-header h1 {
        font-size: 2.5rem;
      }
      .legacy-page img {
        max-height: 420px;
        width: 100%;
        object-fit: cover;
      }
    `,
  ],
})
export class AboutPageComponent {}
