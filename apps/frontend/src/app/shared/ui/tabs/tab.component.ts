import {
  ChangeDetectionStrategy,
  Component,
  contentChild,
  input,
  TemplateRef,
} from '@angular/core';

/**
 * A single tab panel. Place inside `<app-tabs>`. The projected content is
 * captured as a template so the parent can show/hide panels without
 * destroying/recreating them (preserves form state).
 */
@Component({
  selector: 'app-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-template><ng-content /></ng-template>`,
})
export class TabComponent {
  readonly label = input.required<string>();
  readonly content = contentChild(TemplateRef);
}
