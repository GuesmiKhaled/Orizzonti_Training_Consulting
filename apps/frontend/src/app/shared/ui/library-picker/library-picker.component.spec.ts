import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { a11yViolations } from '../../../testing/a11y';
import { IMAGE_LIBRARY } from '../../image-library/image-library.generated';
import { LibraryPickerComponent } from './library-picker.component';

@Component({
  standalone: true,
  imports: [LibraryPickerComponent],
  template: `<app-library-picker [(value)]="chosen" />`,
})
class HostComponent {
  chosen = '';
}

describe('LibraryPickerComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let root: HTMLElement;

  const open = (): void => {
    root.querySelector<HTMLButtonElement>('.actions .btn')?.click();
    fixture.detectChanges();
  };
  const tiles = (): HTMLButtonElement[] =>
    Array.from(root.querySelectorAll<HTMLButtonElement>('.tile'));

  beforeEach(() => {
    fixture = TestBed.createComponent(HostComponent);
    root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    fixture.detectChanges();
  });

  afterEach(() => root.remove());

  it('knows the pictures of the img folder', () => {
    expect(IMAGE_LIBRARY.length).toBeGreaterThan(20);
    expect(IMAGE_LIBRARY.every((i) => i.path.startsWith('/img/'))).toBeTrue();
    expect(IMAGE_LIBRARY.some((i) => i.path === '/img/cat-1.jpg')).toBeTrue();
    expect(IMAGE_LIBRARY.some((i) => i.path.includes('icons/'))).toBeFalse();
  });

  it('starts with no image and offers to choose one', () => {
    expect(root.textContent).toContain('No image chosen');
    expect(root.querySelector('.actions .btn')?.textContent).toContain('Choose image');
    expect(root.querySelector('.remove')).toBeNull();
  });

  it('opens a gallery with a tile per picture, each named by its file', () => {
    open();
    expect(root.querySelector('[role="dialog"]')).not.toBeNull();
    expect(tiles().length).toBe(IMAGE_LIBRARY.length);
    expect(tiles()[0].textContent?.trim()).toBe(IMAGE_LIBRARY[0].name);
  });

  it('chooses a picture, closes the gallery and shows the preview', () => {
    open();
    const target = tiles().find((t) => t.title === '/img/cat-2.jpg') as HTMLButtonElement;
    target.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.chosen).toBe('/img/cat-2.jpg');
    expect(root.querySelector('[role="dialog"]')).toBeNull();
    expect(root.querySelector('.preview img')?.getAttribute('src')).toBe('/img/cat-2.jpg');
    expect(root.querySelector('.actions .btn')?.textContent).toContain('Change image');
  });

  it('marks the current choice as pressed', () => {
    fixture.componentInstance.chosen = '/img/cat-3.jpg';
    fixture.detectChanges();
    open();
    const pressed = tiles().filter((t) => t.getAttribute('aria-pressed') === 'true');
    expect(pressed.map((t) => t.title)).toEqual(['/img/cat-3.jpg']);
  });

  it('filters by file name and by folder', () => {
    open();
    const search = root.querySelector<HTMLInputElement>('input[type="search"]') as HTMLInputElement;
    search.value = 'CAT-1';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(tiles().map((t) => t.title)).toEqual(['/img/cat-1.jpg']);

    search.value = 'no-such-picture';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(tiles().length).toBe(0);
    expect(root.textContent).toContain('No image matches');

    search.value = '';
    search.dispatchEvent(new Event('input'));
    const select = root.querySelector<HTMLSelectElement>('select') as HTMLSelectElement;
    select.value = 'eng';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(tiles().length).toBeGreaterThan(0);
    expect(tiles().every((t) => t.title.startsWith('/img/eng/'))).toBeTrue();
  });

  it('removes the image', () => {
    fixture.componentInstance.chosen = '/img/cat-1.jpg';
    fixture.detectChanges();
    root.querySelector<HTMLButtonElement>('.remove')?.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.chosen).toBe('');
    expect(root.textContent).toContain('No image chosen');
  });

  it('closes on Escape without changing the choice', () => {
    fixture.componentInstance.chosen = '/img/cat-1.jpg';
    fixture.detectChanges();
    open();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(root.querySelector('[role="dialog"]')).toBeNull();
    expect(fixture.componentInstance.chosen).toBe('/img/cat-1.jpg');
  });

  it('has no accessibility violations, closed or open', async () => {
    expect(await a11yViolations(root)).toEqual([]);
    open();
    expect(await a11yViolations(root.querySelector('[role="dialog"]') as HTMLElement)).toEqual([]);
  });
});
