import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalShellComponent } from './modal-shell.component';

@Component({
  standalone: true,
  imports: [ModalShellComponent],
  template: `
    <button id="opener" (click)="open.set(true)">Open</button>
    @if (open()) {
      <app-modal-shell title="Edit" (closed)="close()">
        <input id="first" />
        <input id="second" />
        <ng-container modal-footer>
          <button id="save">Save</button>
        </ng-container>
      </app-modal-shell>
    }
  `,
})
class HostComponent {
  readonly open = signal(false);
  closedCount = 0;

  close(): void {
    this.closedCount++;
    this.open.set(false);
  }
}

const press = (target: EventTarget, key: string, shiftKey = false): KeyboardEvent => {
  const event = new KeyboardEvent('keydown', {
    key,
    shiftKey,
    bubbles: true,
    cancelable: true,
  });
  target.dispatchEvent(event);
  return event;
};

describe('ModalShellComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let root: HTMLElement;

  const openModal = async (): Promise<void> => {
    const opener = root.querySelector<HTMLButtonElement>('#opener');
    opener?.focus();
    opener?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(() => {
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    fixture.detectChanges();
  });

  afterEach(() => root.remove());

  it('exposes dialog semantics labelled by its title', async () => {
    await openModal();
    const dialog = root.querySelector('[role="dialog"]');
    const titleId = root.querySelector('h2')?.id ?? '';
    expect(dialog?.getAttribute('aria-modal')).toBe('true');
    expect(dialog?.getAttribute('aria-labelledby')).toBe(titleId);
    expect(root.querySelector('h2')?.textContent).toBe('Edit');
  });

  it('moves focus into the dialog, to the first control', async () => {
    await openModal();
    expect(document.activeElement?.id).toBe('first');
  });

  it('closes on Escape and restores focus to the opener', async () => {
    await openModal();
    press(document, 'Escape');
    fixture.detectChanges();
    expect(host.closedCount).toBe(1);
    expect(root.querySelector('app-modal-shell')).toBeNull();
    expect(document.activeElement?.id).toBe('opener');
  });

  it('closes from the close button and the backdrop but not from the dialog body', async () => {
    await openModal();
    root.querySelector<HTMLElement>('#first')?.click();
    expect(host.closedCount).toBe(0);
    root.querySelector<HTMLElement>('.backdrop')?.click();
    expect(host.closedCount).toBe(1);

    await openModal();
    root.querySelector<HTMLButtonElement>('.close')?.click();
    expect(host.closedCount).toBe(2);
  });

  it('keeps focus inside the dialog when tabbing forwards and backwards', async () => {
    await openModal();
    const close = root.querySelector<HTMLElement>('.close');
    const save = root.querySelector<HTMLElement>('#save');
    const dialog = root.querySelector<HTMLElement>('[role="dialog"]');

    save?.focus();
    expect(press(dialog as HTMLElement, 'Tab').defaultPrevented).toBeTrue();
    expect(document.activeElement).toBe(close);

    expect(press(dialog as HTMLElement, 'Tab', true).defaultPrevented).toBeTrue();
    expect(document.activeElement).toBe(save);
  });
});

describe('ModalShellComponent stacking', () => {
  @Component({
    standalone: true,
    imports: [ModalShellComponent],
    template: `
      <app-modal-shell title="Outer" (closed)="outer = outer + 1">
        <app-modal-shell title="Inner" (closed)="inner = inner + 1" />
      </app-modal-shell>
    `,
  })
  class StackHostComponent {
    outer = 0;
    inner = 0;
  }

  it('lets only the topmost modal react to Escape', () => {
    const fixture = TestBed.createComponent(StackHostComponent);
    fixture.detectChanges();
    press(document, 'Escape');
    expect(fixture.componentInstance.inner).toBe(1);
    expect(fixture.componentInstance.outer).toBe(0);
  });
});
