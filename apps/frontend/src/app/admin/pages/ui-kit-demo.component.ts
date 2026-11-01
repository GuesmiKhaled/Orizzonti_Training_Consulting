import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  ChangeBadgeComponent,
  ConfirmDialogComponent,
  DataTableComponent,
  FormFieldComponent,
  GlassyCarouselComponent,
  GlassySlide,
  ImagePickerComponent,
  ModalShellComponent,
  PageHeaderComponent,
  RowAction,
  RowActionEvent,
  StatCardComponent,
  StatusTagComponent,
  StepperComponent,
  StepperStep,
  SvgIconAnimationsComponent,
  TableColumn,
} from '../../shared/ui';

interface DemoUser {
  readonly id: number;
  readonly name: string;
  readonly role: string;
  readonly active: boolean;
}

/** Living reference for the shared UI kit; reachable at /admin/ui-kit. */
@Component({
  selector: 'app-ui-kit-demo',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ChangeBadgeComponent,
    ConfirmDialogComponent,
    DataTableComponent,
    FormFieldComponent,
    GlassyCarouselComponent,
    ImagePickerComponent,
    ModalShellComponent,
    PageHeaderComponent,
    StatCardComponent,
    StatusTagComponent,
    StepperComponent,
    SvgIconAnimationsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ui-kit-demo.component.html',
  styleUrl: './ui-kit-demo.component.scss',
})
export class UiKitDemoComponent {
  protected readonly steps: readonly StepperStep[] = [
    { label: 'Language' },
    { label: 'Levels', changes: 2 },
    { label: 'Exams' },
  ];
  protected readonly step = signal(1);
  protected readonly modalOpen = signal(false);
  protected readonly pendingDelete = signal<DemoUser | null>(null);
  protected readonly image = new FormControl<string | null>(null);

  protected readonly carouselSlides: readonly GlassySlide[] = [
    {
      image: '/img/course-1.jpg',
      title: 'English for Beginners',
      subtitle: 'Start your language journey with expert instructors.',
    },
    {
      image: '/img/course-2.jpg',
      title: 'French Intermediate',
      subtitle: 'Build fluency with immersive conversation practice.',
    },
    {
      image: '/img/course-3.jpg',
      title: 'Arabic Advanced',
      subtitle: 'Master classical and modern Arabic literature.',
    },
    {
      image: '/img/course-4.jpg',
      title: 'German Intensive',
      subtitle: 'Prepare for certification with our intensive program.',
    },
  ];

  protected readonly users = signal<readonly DemoUser[]>([
    { id: 1, name: 'Guesmi Khaled', role: 'Super admin', active: true },
    { id: 2, name: 'Ben Ali Amel', role: 'Editor', active: true },
    { id: 3, name: 'Trabelsi Sami', role: 'Editor', active: false },
    { id: 4, name: 'Haddad Nour', role: 'Secretary', active: true },
  ]);
  protected readonly columns: readonly TableColumn<DemoUser>[] = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'role', header: 'Role', sortable: true },
    {
      key: 'status',
      header: 'Status',
      value: (u) => (u.active ? 'Active' : 'Inactive'),
      tag: (u) => ({
        label: u.active ? 'Active' : 'Inactive',
        tone: u.active ? 'success' : 'neutral',
      }),
    },
  ];
  protected readonly rowId = (user: DemoUser): number => user.id;
  protected readonly actions: readonly RowAction[] = [
    { id: 'edit', label: 'Edit' },
    { id: 'delete', label: 'Delete', tone: 'danger' },
  ];

  protected onAction(event: RowActionEvent<DemoUser>): void {
    if (event.action === 'delete') {
      this.pendingDelete.set(event.row);
    }
  }

  protected confirmDelete(): void {
    const target = this.pendingDelete();
    if (target) {
      this.users.update((users) => users.filter((u) => u.id !== target.id));
    }
    this.pendingDelete.set(null);
  }
}
