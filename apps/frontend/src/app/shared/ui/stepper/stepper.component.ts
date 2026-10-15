import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

export interface StepperStep {
  readonly label: string;
  /** Number of unsaved changes in this step; shown as an amber badge when > 0. */
  readonly changes?: number;
}

@Component({
  selector: 'app-stepper',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './stepper.component.html',
  styleUrl: './stepper.component.scss',
})
export class StepperComponent {
  readonly steps = input.required<readonly StepperStep[]>();
  /** Zero-based index of the active step. */
  readonly current = input(0);
  readonly clickable = input(true);
  readonly stepSelected = output<number>();
}
