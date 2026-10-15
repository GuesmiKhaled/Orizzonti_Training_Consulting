import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FormFieldComponent, LibraryPickerComponent } from '../../../shared/ui';
import { changedFieldNames, previousOf } from './language-wizard.diff';
import { errorOf } from './language-wizard.forms';
import { LanguageWizardStore } from './language-wizard.store';

@Component({
  selector: 'app-language-step',
  standalone: true,
  imports: [ReactiveFormsModule, FormFieldComponent, LibraryPickerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid">
      <app-form-field
        label="Name"
        [required]="true"
        [changed]="changed().has('name')"
        [previousValue]="was('name')"
        [error]="nameError()"
      >
        <input [formControl]="form.controls.name" placeholder="English" />
      </app-form-field>
      <app-form-field
        label="Code"
        [changed]="changed().has('code')"
        [previousValue]="was('code')"
      >
        <input [formControl]="form.controls.code" placeholder="ENG" />
      </app-form-field>
      <app-form-field
        label="Native name"
        [changed]="changed().has('nativeName')"
        [previousValue]="was('nativeName')"
      >
        <input [formControl]="form.controls.nativeName" />
      </app-form-field>
      <label class="check">
        <input type="checkbox" [formControl]="form.controls.isActive" />
        Active (shown on the public site)
      </label>
      <div class="image" [class.changed]="changed().has('imageUrl')">
        <span class="image-label">
          Image
          @if (was('imageUrl') !== null) {
            <span class="was">(was {{ wasImage() }})</span>
          }
        </span>
        <app-library-picker
          [value]="form.controls.imageUrl.value"
          (valueChange)="setImage($event)"
        />
      </div>
    </div>
  `,
  styles: `
    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.75rem;
    }
    .check {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
    }
    .check input {
      width: auto;
    }
    .image {
      display: grid;
      grid-column: 1 / -1;
      gap: 0.4rem;
      padding: 0.5rem;
      border: 1px solid transparent;
      border-radius: 6px;
    }
    .image.changed {
      border-color: var(--adm-warning);
    }
    .image-label {
      color: #374151;
      font-size: 0.8rem;
    }
    .was {
      color: #92400e;
    }
    @media (max-width: 600px) {
      .grid {
        grid-template-columns: minmax(0, 1fr);
      }
    }
  `,
})
export class LanguageStepComponent {
  private readonly store = inject(LanguageWizardStore);

  protected readonly form = this.store.languageForm;
  protected readonly changed = computed(() =>
    changedFieldNames(this.store.languageChange()),
  );

  protected was(field: string): string | null {
    return previousOf(this.store.languageChange(), field);
  }

  protected wasImage(): string {
    const previous = previousOf(this.store.languageChange(), 'imageUrl');
    return previous ? (previous.split('/').pop() ?? previous) : 'none';
  }

  protected setImage(path: string): void {
    this.form.controls.imageUrl.setValue(path);
    this.form.controls.imageUrl.markAsDirty();
  }

  protected nameError(): string {
    this.store.languageChange();
    return errorOf(this.form.controls.name);
  }
}
