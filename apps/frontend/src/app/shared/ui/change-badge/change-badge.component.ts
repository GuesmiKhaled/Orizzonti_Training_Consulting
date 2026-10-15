import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { StatusTagComponent } from '../status-tag/status-tag.component';
import { ChangeState, Tone } from '../ui.types';

const LABELS: Record<ChangeState, string> = {
  new: 'New',
  modified: 'Modified',
  unchanged: 'Unchanged',
};

const TONES: Record<ChangeState, Tone> = {
  new: 'info',
  modified: 'warning',
  unchanged: 'neutral',
};

@Component({
  selector: 'app-change-badge',
  standalone: true,
  imports: [StatusTagComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-status-tag [label]="label()" [tone]="tone()" />`,
})
export class ChangeBadgeComponent {
  readonly state = input.required<ChangeState>();

  protected readonly label = computed(() => LABELS[this.state()]);
  protected readonly tone = computed(() => TONES[this.state()]);
}
