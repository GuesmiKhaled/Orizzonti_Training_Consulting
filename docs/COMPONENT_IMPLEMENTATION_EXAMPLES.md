# Component Implementation Examples

**Date**: October 13, 2026  
**Purpose**: Guide for implementing Phase 2 components  
**Audience**: Frontend developers

---

## Overview

This document provides code examples for implementing the shared components identified in Phase 2. Each example includes TypeScript, HTML, and SCSS.

---

## 1. FormFieldComponent

**Purpose**: Reusable text input component with validation feedback

### TypeScript (`form-field.component.ts`)

```typescript
import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-form-field',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="form-group">
      <label *ngIf="label" class="form-label">
        <span>{{ label }}</span>
        <span class="required" *ngIf="required">*</span>
      </label>
      <input
        [type]="type"
        class="form-input"
        [class.error]="hasError"
        [placeholder]="placeholder"
        [disabled]="disabled"
        [value]="value"
        (input)="onInput($event)"
        (blur)="onBlur()"
      />
      <span class="form-error" *ngIf="hasError && errorMessage">
        {{ errorMessage }}
      </span>
      <span class="form-help" *ngIf="help">{{ help }}</span>
    </div>
  `,
  styleUrls: ['./form-field.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FormFieldComponent),
      multi: true,
    },
  ],
})
export class FormFieldComponent implements ControlValueAccessor {
  @Input() label: string = '';
  @Input() type: string = 'text';
  @Input() placeholder: string = '';
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() help: string = '';
  @Input() control: FormControl | null = null;

  value: string = '';
  touched: boolean = false;

  get hasError(): boolean {
    return this.touched && this.control?.invalid ?? false;
  }

  get errorMessage(): string {
    if (!this.control?.errors) return '';
    if (this.control.errors['required']) return 'This field is required';
    if (this.control.errors['minlength']) {
      return `Minimum ${this.control.errors['minlength'].requiredLength} characters`;
    }
    if (this.control.errors['email']) return 'Invalid email address';
    if (this.control.errors['pattern']) return 'Invalid format';
    return 'Invalid input';
  }

  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.value = input.value;
    this.onChange(this.value);
  }

  onBlur(): void {
    this.touched = true;
    this.onTouched();
  }

  writeValue(value: any): void {
    this.value = value || '';
  }

  onChange: (value: any) => void = () => {};
  onTouched: () => void = () => {};

  registerOnChange(fn: (value: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
```

### HTML (`form-field.component.html`)

```html
<div class="form-group">
  <label *ngIf="label" class="form-label">
    <span>{{ label }}</span>
    <span class="required" *ngIf="required">*</span>
  </label>
  <input
    [type]="type"
    class="form-input"
    [class.error]="hasError"
    [placeholder]="placeholder"
    [disabled]="disabled"
    [value]="value"
    (input)="onInput($event)"
    (blur)="onBlur()"
  />
  <span class="form-error" *ngIf="hasError && errorMessage">
    {{ errorMessage }}
  </span>
  <span class="form-help" *ngIf="help">{{ help }}</span>
</div>
```

### SCSS (`form-field.component.scss`)

```scss
@import '../../styles/design-tokens.scss';

.form-group {
  margin-bottom: $space-6;

  &:last-child {
    margin-bottom: 0;
  }
}

.form-label {
  display: block;
  font-weight: $font-weight-medium;
  color: $color-gray-900;
  margin-bottom: $space-2;
  font-size: $font-size-sm;

  .required {
    color: $color-error;
    margin-left: $space-1;
  }
}

.form-input {
  width: 100%;
  padding: $space-2 $space-3;
  border: 1px solid $input-border-color;
  border-radius: $radius-md;
  background-color: $input-bg-color;
  color: $input-text-color;
  font-size: $font-size-sm;
  transition: border-color $transition-fast, box-shadow $transition-fast;

  &::placeholder {
    color: $input-text-color-placeholder;
  }

  &:focus {
    outline: none;
    border-color: $color-primary;
    box-shadow: 0 0 0 3px rgba($color-primary, 0.1);
  }

  &:disabled {
    background-color: $input-bg-color-disabled;
    color: $color-gray-500;
    cursor: not-allowed;
  }

  &.error {
    border-color: $color-error;

    &:focus {
      box-shadow: 0 0 0 3px rgba($color-error, 0.1);
    }
  }
}

.form-error {
  color: $color-error;
  font-size: $font-size-xs;
  margin-top: $space-1;
  display: block;
}

.form-help {
  color: $color-gray-600;
  font-size: $font-size-xs;
  margin-top: $space-1;
  display: block;
}
```

### Usage Example

```typescript
// In parent component
<app-form-field
  label="Username"
  type="text"
  placeholder="Enter username"
  [required]="true"
  [control]="userForm.get('username')"
  help="3-20 characters"
></app-form-field>
```

---

## 2. FormSelectComponent

**Purpose**: Reusable dropdown component with async option loading

### TypeScript (`form-select.component.ts`)

```typescript
import { Component, Input, forwardRef, OnInit } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Observable } from 'rxjs';

export interface SelectOption {
  value: any;
  label: string;
}

@Component({
  selector: 'app-form-select',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="form-group">
      <label *ngIf="label" class="form-label">
        <span>{{ label }}</span>
        <span class="required" *ngIf="required">*</span>
      </label>
      <select
        class="form-select"
        [class.error]="hasError"
        [disabled]="disabled || loading"
        [value]="value"
        (change)="onChange($event)"
        (blur)="onBlur()"
      >
        <option [value]="null">{{ placeholder }}</option>
        <option *ngFor="let option of options" [value]="option.value">
          {{ option.label }}
        </option>
      </select>
      <span class="form-error" *ngIf="hasError && errorMessage">
        {{ errorMessage }}
      </span>
      <span class="form-help" *ngIf="help">{{ help }}</span>
    </div>
  `,
  styleUrls: ['./form-select.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FormSelectComponent),
      multi: true,
    },
  ],
})
export class FormSelectComponent implements ControlValueAccessor, OnInit {
  @Input() label: string = '';
  @Input() placeholder: string = 'Select an option';
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() help: string = '';
  @Input() control: FormControl | null = null;
  @Input() options: SelectOption[] = [];
  @Input() optionsLoader: (() => Observable<SelectOption[]>) | null = null;

  value: any = null;
  touched: boolean = false;
  loading: boolean = false;

  ngOnInit(): void {
    if (this.optionsLoader) {
      this.loading = true;
      this.optionsLoader().subscribe({
        next: (options) => {
          this.options = options;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
    }
  }

  get hasError(): boolean {
    return this.touched && this.control?.invalid ?? false;
  }

  get errorMessage(): string {
    if (!this.control?.errors) return '';
    if (this.control.errors['required']) return 'Please select an option';
    return 'Invalid selection';
  }

  onChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.value = select.value === 'null' ? null : select.value;
    this.onChangeCallback(this.value);
  }

  onBlur(): void {
    this.touched = true;
    this.onTouchedCallback();
  }

  writeValue(value: any): void {
    this.value = value || null;
  }

  onChangeCallback: (value: any) => void = () => {};
  onTouchedCallback: () => void = () => {};

  registerOnChange(fn: (value: any) => void): void {
    this.onChangeCallback = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedCallback = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
```

### Usage Example

```typescript
// In parent component
<app-form-select
  label="Role"
  placeholder="Select a role"
  [required]="true"
  [control]="userForm.get('roleId')"
  [optionsLoader]="() => apiService.getAdminRoles().pipe(
    map(roles => roles.map(r => ({ value: r.id, label: r.name })))
  )"
></app-form-select>
```

---

## 3. ConfirmDialogComponent

**Purpose**: Reusable confirmation dialog for destructive actions

### TypeScript (`confirm-dialog.component.ts`)

```typescript
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop" *ngIf="isOpen" (click)="onBackdropClick()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>{{ title }}</h2>
        </div>
        <div class="modal-body">
          <p>{{ message }}</p>
          <p *ngIf="details" class="text-sm">{{ details }}</p>
        </div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-ghost"
            (click)="onCancel()"
            [disabled]="isLoading"
          >
            {{ cancelLabel }}
          </button>
          <button
            type="button"
            class="btn btn-danger"
            [class.btn-loading]="isLoading"
            (click)="onConfirm()"
            [disabled]="isLoading"
          >
            {{ confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./confirm-dialog.component.scss'],
})
export class ConfirmDialogComponent {
  @Input() isOpen: boolean = false;
  @Input() title: string = 'Confirm';
  @Input() message: string = 'Are you sure?';
  @Input() details: string = '';
  @Input() confirmLabel: string = 'Delete';
  @Input() cancelLabel: string = 'Cancel';
  @Input() isLoading: boolean = false;

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  onBackdropClick(): void {
    if (!this.isLoading) {
      this.cancelled.emit();
    }
  }
}
```

### Usage Example

```typescript
// In parent component
<app-confirm-dialog
  [isOpen]="showDeleteConfirm"
  title="Delete Blog"
  [message]="'Delete blog: ' + selectedBlog?.title"
  details="This action cannot be undone."
  confirmLabel="Delete"
  cancelLabel="Cancel"
  [isLoading]="isDeleting"
  (confirmed)="confirmDelete()"
  (cancelled)="showDeleteConfirm = false"
></app-confirm-dialog>

// In component class
deleteBlog(id: number): void {
  this.selectedBlog = this.blogs.find(b => b.id === id);
  this.showDeleteConfirm = true;
}

confirmDelete(): void {
  if (!this.selectedBlog?.id) return;
  this.isDeleting = true;
  this.apiService.deleteBlog(this.selectedBlog.id).subscribe({
    next: () => {
      this.blogs = this.blogs.filter(b => b.id !== this.selectedBlog?.id);
      this.showDeleteConfirm = false;
      this.isDeleting = false;
      this.showSuccess('Blog deleted successfully');
    },
    error: () => {
      this.isDeleting = false;
      this.showError('Failed to delete blog');
    },
  });
}
```

---

## 4. StatusMessageComponent

**Purpose**: Reusable success/error notification component

### TypeScript (`status-message.component.ts`)

```typescript
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-status-message',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="alert"
      [class.alert-success]="type === 'success'"
      [class.alert-error]="type === 'error'"
      [class.alert-warning]="type === 'warning'"
      [class.alert-info]="type === 'info'"
      *ngIf="isVisible"
      @fadeInOut
    >
      <div class="alert-content">
        <span class="alert-icon">
          <i
            [class]="getIconClass()"
            aria-hidden="true"
          ></i>
        </span>
        <span class="alert-message">{{ message }}</span>
        <button
          type="button"
          class="alert-close"
          (click)="dismiss()"
          aria-label="Close"
        >
          <i class="fa fa-times" aria-hidden="true"></i>
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./status-message.component.scss'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('200ms ease-in', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
      transition(':leave', [
        animate('200ms ease-out', style({ opacity: 0, transform: 'translateY(-10px)' })),
      ]),
    ]),
  ],
})
export class StatusMessageComponent implements OnInit {
  @Input() message: string = '';
  @Input() type: 'success' | 'error' | 'warning' | 'info' = 'info';
  @Input() duration: number = 5000; // Auto-dismiss after 5 seconds

  isVisible: boolean = false;
  private timeout: any;

  ngOnInit(): void {
    if (this.message) {
      this.show();
    }
  }

  show(): void {
    this.isVisible = true;
    if (this.duration > 0) {
      this.timeout = setTimeout(() => this.dismiss(), this.duration);
    }
  }

  dismiss(): void {
    this.isVisible = false;
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
  }

  getIconClass(): string {
    const icons = {
      success: 'fa fa-check-circle',
      error: 'fa fa-exclamation-circle',
      warning: 'fa fa-exclamation-triangle',
      info: 'fa fa-info-circle',
    };
    return icons[this.type];
  }
}
```

### Usage Example

```typescript
// In parent component
<app-status-message
  [message]="statusMessage"
  [type]="statusType"
  [duration]="5000"
></app-status-message>

// In component class
saveBlog(): void {
  this.isSubmitting = true;
  this.apiService.createBlog(this.blogForm.value).subscribe({
    next: () => {
      this.statusMessage = 'Blog created successfully';
      this.statusType = 'success';
      this.blogForm.reset();
      this.loadBlogs();
    },
    error: (error) => {
      this.statusMessage = error?.error?.message || 'Failed to create blog';
      this.statusType = 'error';
    },
    complete: () => {
      this.isSubmitting = false;
    },
  });
}
```

---

## 5. LoadingStateComponent

**Purpose**: Reusable loading spinner component

### TypeScript (`loading-state.component.ts`)

```typescript
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading-state" *ngIf="isLoading">
      <div class="loading-spinner"></div>
      <p>{{ message }}</p>
    </div>
  `,
  styleUrls: ['./loading-state.component.scss'],
})
export class LoadingStateComponent {
  @Input() isLoading: boolean = false;
  @Input() message: string = 'Loading...';
}
```

### Usage Example

```html
<app-loading-state
  [isLoading]="isLoading"
  message="Loading blogs..."
></app-loading-state>

<div *ngIf="!isLoading">
  <!-- Content here -->
</div>
```

---

## 6. EmptyStateComponent

**Purpose**: Reusable empty data state component

### TypeScript (`empty-state.component.ts`)

```typescript
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="empty-state">
      <svg
        *ngIf="icon === 'document'"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <h3>{{ title }}</h3>
      <p>{{ message }}</p>
      <button *ngIf="actionLabel" class="btn btn-primary" (click)="onAction()">
        {{ actionLabel }}
      </button>
    </div>
  `,
  styleUrls: ['./empty-state.component.scss'],
})
export class EmptyStateComponent {
  @Input() title: string = 'No data';
  @Input() message: string = 'No items to display';
  @Input() icon: string = 'document';
  @Input() actionLabel: string = '';
  @Input() onAction: () => void = () => {};
}
```

### Usage Example

```html
<app-empty-state
  *ngIf="blogs.length === 0 && !isLoading"
  title="No blogs yet"
  message="Create your first blog article to get started"
  icon="document"
  actionLabel="Create Blog"
  [onAction]="() => createNewBlog()"
></app-empty-state>
```

---

## Integration Pattern

### In Feature Module

```typescript
// blogs.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormFieldComponent } from '../../shared/components/form-field/form-field.component';
import { FormTextareaComponent } from '../../shared/components/form-textarea/form-textarea.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { StatusMessageComponent } from '../../shared/components/status-message/status-message.component';
import { LoadingStateComponent } from '../../shared/components/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-blogs',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormFieldComponent,
    FormTextareaComponent,
    ConfirmDialogComponent,
    StatusMessageComponent,
    LoadingStateComponent,
    EmptyStateComponent,
  ],
  template: `
    <div class="page">
      <app-status-message
        [message]="statusMessage"
        [type]="statusType"
      ></app-status-message>

      <app-loading-state
        [isLoading]="isLoading"
        message="Loading blogs..."
      ></app-loading-state>

      <app-empty-state
        *ngIf="blogs.length === 0 && !isLoading"
        title="No blogs yet"
        message="Create your first blog article"
        actionLabel="Create Blog"
        [onAction]="() => createNewBlog()"
      ></app-empty-state>

      <div *ngIf="blogs.length > 0 && !isLoading">
        <!-- Blog list and form here -->
      </div>

      <app-confirm-dialog
        [isOpen]="showDeleteConfirm"
        title="Delete Blog"
        [message]="'Delete: ' + selectedBlog?.title"
        [isLoading]="isDeleting"
        (confirmed)="confirmDelete()"
        (cancelled)="showDeleteConfirm = false"
      ></app-confirm-dialog>
    </div>
  `,
})
export class BlogsComponent implements OnInit {
  // Component implementation
}
```

---

## Best Practices

1. **Always use FormControl** - Pass form control to components for validation
2. **Implement ControlValueAccessor** - Makes components work with reactive forms
3. **Handle loading states** - Show loading spinner during async operations
4. **Provide error messages** - Display helpful, user-friendly error messages
5. **Use animations** - Smooth transitions for better UX
6. **Accessibility** - Include ARIA labels and keyboard navigation
7. **Responsive design** - Test on mobile, tablet, desktop
8. **Reusability** - Design components to be used across multiple modules

---

**Document Version**: 1.0  
**Status**: Ready for Implementation  
**Last Updated**: October 13, 2026
