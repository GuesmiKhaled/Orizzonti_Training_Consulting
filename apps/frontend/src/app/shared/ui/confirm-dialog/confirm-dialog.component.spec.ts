import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmDialogComponent } from './confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
  let fixture: ComponentFixture<ConfirmDialogComponent>;
  let root: HTMLElement;
  let confirmed: number;
  let cancelled: number;

  const setup = (inputs: Record<string, unknown> = {}): void => {
    fixture = TestBed.createComponent(ConfirmDialogComponent);
    fixture.componentRef.setInput('message', 'Delete this?');
    for (const [name, value] of Object.entries(inputs)) {
      fixture.componentRef.setInput(name, value);
    }
    confirmed = 0;
    cancelled = 0;
    fixture.componentInstance.confirmed.subscribe(() => confirmed++);
    fixture.componentInstance.cancelled.subscribe(() => cancelled++);
    root = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  };

  const button = (label: string): HTMLButtonElement | undefined =>
    Array.from(root.querySelectorAll('footer button')).find((b) =>
      b.textContent?.includes(label),
    ) as HTMLButtonElement | undefined;

  it('shows the message and emits confirmed', () => {
    setup({ confirmLabel: 'Delete' });
    expect(root.querySelector('p')?.textContent).toBe('Delete this?');
    button('Delete')?.click();
    expect(confirmed).toBe(1);
    expect(cancelled).toBe(0);
  });

  it('emits cancelled from the cancel button and the close icon', () => {
    setup();
    button('Cancel')?.click();
    root.querySelector<HTMLButtonElement>('.close')?.click();
    expect(cancelled).toBe(2);
    expect(confirmed).toBe(0);
  });

  it('styles the confirm button as destructive when danger is set', () => {
    setup({ danger: true, confirmLabel: 'Delete' });
    expect(button('Delete')?.classList).toContain('btn-danger');
  });

  it('uses the primary style by default', () => {
    setup();
    expect(button('Confirm')?.classList).toContain('btn-primary');
  });
});
