import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { OrizzontiApiService } from '../../services/orizzonti-api.service';

@Component({
  selector: 'app-contact-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="page-header container-fluid bg-secondary py-5">
      <div class="container py-4">
        <h1 class="text-white">Contact</h1>
        <div class="d-inline-flex text-white">
          <a routerLink="/" class="text-white">Home</a
          ><span class="px-2">/</span><span>Contact</span>
        </div>
      </div>
    </section>
    <section class="container-fluid py-5 legacy-page">
      <div class="container">
        <div class="text-center mb-5">
          <p class="text-primary text-uppercase mb-2">Get In Touch</p>
          <h2>Contact Us</h2>
        </div>
        <div class="row justify-content-center">
          <div class="col-lg-8">
            <div
              class="alert"
              *ngIf="message"
              [class.alert-success]="!isError"
              [class.alert-danger]="isError"
              role="status"
            >
              {{ message }}
            </div>
            <form [formGroup]="form" (ngSubmit)="submit()" class="contact-form">
              <div class="form-group">
                <label for="contactName">Name</label>
                <input
                  id="contactName"
                  formControlName="name"
                  class="form-control"
                  autocomplete="name"
                />
              </div>
              <div class="form-group">
                <label for="contactEmail">Email</label>
                <input
                  id="contactEmail"
                  formControlName="email"
                  type="email"
                  class="form-control"
                  autocomplete="email"
                />
              </div>
              <div class="form-group">
                <label for="contactSubject">Subject</label>
                <input
                  id="contactSubject"
                  formControlName="subject"
                  class="form-control"
                />
              </div>
              <div class="form-group">
                <label for="contactMessage">Message</label>
                <textarea
                  id="contactMessage"
                  formControlName="message"
                  rows="5"
                  class="form-control"
                ></textarea>
              </div>
              <button
                type="submit"
                class="btn btn-primary py-2 px-4"
                [disabled]="form.invalid || isSubmitting"
              >
                {{ isSubmitting ? 'Sending...' : 'Send message' }}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .contact-form {
        display: grid;
        gap: 0.5rem;
      }
    `,
  ],
})
export class ContactPageComponent {
  readonly form: FormGroup;
  isSubmitting = false;
  message = '';
  isError = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly apiService: OrizzontiApiService,
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', Validators.required],
      message: ['', [Validators.required, Validators.minLength(10)]],
    });
  }

  submit() {
    if (this.form.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.message = '';
    this.isError = false;

    this.apiService.submitContact(this.form.value).subscribe({
      next: (response) => {
        this.message = response.message ?? 'Message sent successfully.';
        this.form.reset();
        this.isSubmitting = false;
      },
      error: () => {
        this.isError = true;
        this.message =
          'Unable to send the message right now. Please try again later.';
        this.isSubmitting = false;
      },
    });
  }
}
