import { Directive, TemplateRef, inject, input } from '@angular/core';

/**
 * Custom cell for the column with the same key:
 * `<ng-template appCell="status" let-row>...</ng-template>`.
 */
@Directive({ selector: 'ng-template[appCell]', standalone: true })
export class DataTableCellDirective {
  readonly key = input.required<string>({ alias: 'appCell' });
  readonly template = inject<TemplateRef<{ $implicit: unknown }>>(TemplateRef);
}
