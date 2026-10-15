import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StepperComponent, StepperStep } from './stepper.component';

const STEPS: readonly StepperStep[] = [
  { label: 'Language' },
  { label: 'Levels', changes: 2 },
  { label: 'Exams' },
];

describe('StepperComponent', () => {
  let fixture: ComponentFixture<StepperComponent>;
  let root: HTMLElement;
  let selected: number[];

  const setup = (current: number, clickable = true): void => {
    fixture = TestBed.createComponent(StepperComponent);
    fixture.componentRef.setInput('steps', STEPS);
    fixture.componentRef.setInput('current', current);
    fixture.componentRef.setInput('clickable', clickable);
    selected = [];
    fixture.componentInstance.stepSelected.subscribe((i) => selected.push(i));
    root = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  };

  const states = (): (string | null)[] =>
    Array.from(root.querySelectorAll('.step')).map((el) =>
      el.getAttribute('data-state'),
    );

  it('marks earlier steps done, the current step active and later ones upcoming', () => {
    setup(1);
    expect(states()).toEqual(['done', 'active', 'upcoming']);
  });

  it('numbers the circles and joins steps with lines', () => {
    setup(0);
    const circles = Array.from(root.querySelectorAll('.circle')).map((c) =>
      c.textContent?.trim(),
    );
    expect(circles).toEqual(['1', '2', '3']);
    expect(root.querySelectorAll('.line').length).toBe(2);
  });

  it('shows the change badge only on steps with changes', () => {
    setup(1);
    const badges = root.querySelectorAll('.changes');
    expect(badges.length).toBe(1);
    expect(badges[0].textContent?.trim()).toBe('2');
  });

  it('flags the active step for assistive technology', () => {
    setup(2);
    const buttons = root.querySelectorAll('.step-button');
    expect(buttons[2].getAttribute('aria-current')).toBe('step');
    expect(buttons[0].hasAttribute('aria-current')).toBeFalse();
  });

  it('emits the clicked step index', () => {
    setup(0);
    root.querySelectorAll<HTMLButtonElement>('.step-button')[2].click();
    expect(selected).toEqual([2]);
  });

  it('disables navigation when not clickable', () => {
    setup(0, false);
    const buttons = root.querySelectorAll<HTMLButtonElement>('.step-button');
    expect(Array.from(buttons).every((b) => b.disabled)).toBeTrue();
  });
});
