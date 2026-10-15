import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeBadgeComponent } from './change-badge/change-badge.component';
import { FormFieldComponent } from './form-field/form-field.component';
import { PageHeaderComponent } from './page-header/page-header.component';
import { StatCardComponent } from './stat-card/stat-card.component';
import { StatusTagComponent } from './status-tag/status-tag.component';

function create<T>(
  type: new () => T,
  inputs: Record<string, unknown>,
): ComponentFixture<T> {
  const fixture = TestBed.createComponent(type);
  for (const [name, value] of Object.entries(inputs)) {
    fixture.componentRef.setInput(name, value);
  }
  fixture.detectChanges();
  return fixture;
}

const html = (fixture: ComponentFixture<unknown>): HTMLElement =>
  fixture.nativeElement as HTMLElement;

describe('StatusTagComponent', () => {
  it('shows the label and exposes the tone', () => {
    const el = html(create(StatusTagComponent, { label: 'Active', tone: 'success' }));
    const tag = el.querySelector('.tag');
    expect(tag?.textContent).toContain('Active');
    expect(tag?.getAttribute('data-tone')).toBe('success');
  });

  it('defaults to the neutral tone', () => {
    const el = html(create(StatusTagComponent, { label: 'x' }));
    expect(el.querySelector('.tag')?.getAttribute('data-tone')).toBe('neutral');
  });
});

describe('ChangeBadgeComponent', () => {
  const cases = [
    ['new', 'New', 'info'],
    ['modified', 'Modified', 'warning'],
    ['unchanged', 'Unchanged', 'neutral'],
  ] as const;

  for (const [state, label, tone] of cases) {
    it(`renders "${label}" for ${state}`, () => {
      const el = html(create(ChangeBadgeComponent, { state }));
      const tag = el.querySelector('.tag');
      expect(tag?.textContent).toContain(label);
      expect(tag?.getAttribute('data-tone')).toBe(tone);
    });
  }
});

describe('StatCardComponent', () => {
  it('renders label, value and accent', () => {
    const el = html(
      create(StatCardComponent, { label: 'Courses', value: 12, accent: 'danger' }),
    );
    expect(el.querySelector('.label')?.textContent).toBe('Courses');
    expect(el.querySelector('.value')?.textContent).toBe('12');
    expect(el.querySelector('.card')?.getAttribute('data-accent')).toBe('danger');
  });
});

describe('PageHeaderComponent', () => {
  @Component({
    standalone: true,
    imports: [PageHeaderComponent],
    template: `<app-page-header title="Languages" subtitle="Manage them">
      <button actions>Add</button>
    </app-page-header>`,
  })
  class HostComponent {}

  it('renders title, subtitle and projected actions', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const el = html(fixture);
    expect(el.querySelector('h1')?.textContent).toBe('Languages');
    expect(el.querySelector('p')?.textContent).toBe('Manage them');
    expect(el.querySelector('.actions button')?.textContent).toBe('Add');
  });

  it('omits the subtitle when empty', () => {
    const el = html(create(PageHeaderComponent, { title: 'Only title' }));
    expect(el.querySelector('p')).toBeNull();
  });
});

describe('FormFieldComponent', () => {
  @Component({
    standalone: true,
    imports: [FormFieldComponent],
    template: `<app-form-field label="Price" [required]="true">
      <input id="price" />
    </app-form-field>`,
  })
  class HostComponent {}

  it('nests the projected control in the label and marks required', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const label = html(fixture).querySelector('label');
    expect(label?.querySelector('input#price')).not.toBeNull();
    expect(label?.textContent).toContain('Price');
    expect(label?.querySelector('.ui-field__required')).not.toBeNull();
  });

  it('shows the previous value and the changed state', () => {
    const el = html(
      create(FormFieldComponent, {
        label: 'Price',
        changed: true,
        previousValue: '$500.00',
      }),
    );
    expect(el.querySelector('.ui-field--changed')).not.toBeNull();
    expect(el.querySelector('.ui-field__was')?.textContent).toContain('was $500.00');
  });

  it('shows an error as an alert and hides the hint', () => {
    const el = html(
      create(FormFieldComponent, { label: 'x', error: 'Required', hint: 'Help' }),
    );
    expect(el.querySelector('[role="alert"]')?.textContent).toBe('Required');
    expect(el.querySelector('.ui-field__hint')).toBeNull();
    expect(el.querySelector('.ui-field--invalid')).not.toBeNull();
  });

  it('shows the hint when there is no error', () => {
    const el = html(create(FormFieldComponent, { label: 'x', hint: 'Help' }));
    expect(el.querySelector('.ui-field__hint')?.textContent).toBe('Help');
  });
});
