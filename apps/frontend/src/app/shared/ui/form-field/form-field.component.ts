import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Label + projected control + error/hint. The control is nested in the label
 * so it is labelled without ids. Control styling lives in components.scss
 * (`.ui-field`), because projected elements are outside this component's styles.
 */
@Component({
  selector: 'app-form-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label
      class="ui-field"
      [class.ui-field--changed]="changed()"
      [class.ui-field--invalid]="!!error()"
    >
      <span class="ui-field__label">
        {{ label() }}
        @if (required()) {
          <span class="ui-field__required" aria-hidden="true">*</span>
        }
        @if (previousValue() !== null) {
          <span class="ui-field__was">(was {{ previousValue() }})</span>
        }
      </span>
      <ng-content />
    </label>
    @if (error()) {
      <p class="ui-field__error" role="alert">{{ error() }}</p>
    } @else if (hint()) {
      <p class="ui-field__hint">{{ hint() }}</p>
    }
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class FormFieldComponent {
  readonly label = input.required<string>();
  readonly required = input(false);
  readonly hint = input('');
  readonly error = input('');
  readonly changed = input(false);
  readonly previousValue = input<string | null>(null);
}
