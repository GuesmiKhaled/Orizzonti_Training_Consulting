/// <reference types="jasmine" />
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Observable, Subject, of, throwError } from 'rxjs';
import { ImagePickerComponent, ImageUploader } from './image-picker.component';
import { validateImageFile } from './validate-image';

describe('validateImageFile', () => {
  it('accepts allowed images within the size limit', () => {
    expect(validateImageFile({ type: 'image/png', size: 1000 })).toBeNull();
  });

  it('rejects unsupported types', () => {
    expect(validateImageFile({ type: 'application/pdf', size: 10 })).toContain(
      'Unsupported file type',
    );
  });

  it('rejects files over the limit', () => {
    expect(
      validateImageFile({ type: 'image/png', size: 3 * 1024 * 1024 }, ['image/png'], 2 * 1024 * 1024),
    ).toBe('Image is larger than 2 MB.');
  });
});

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, ImagePickerComponent],
  template: `<app-image-picker
    [formControl]="control"
    [uploader]="uploader()"
    (fileSelected)="selected.push($event)"
  />`,
})
class HostComponent {
  readonly control = new FormControl<string | null>(null);
  readonly uploader = signal<ImageUploader | null>(null);
  readonly selected: File[] = [];
}

const PIXEL = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
const url = (name: string): string => `${PIXEL}#${name}`;

describe('ImagePickerComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let root: HTMLElement;

  const choose = (file: File): void => {
    const input = root.querySelector<HTMLInputElement>('input[type="file"]');
    const transfer = new DataTransfer();
    transfer.items.add(file);
    if (input) {
      input.files = transfer.files;
      input.dispatchEvent(new Event('change'));
    }
    fixture.detectChanges();
  };

  const png = (size = 10): File =>
    new File([new Uint8Array(size)], 'cover.png', { type: 'image/png' });

  beforeEach(() => {
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    root = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it('shows a preview for the form control value', () => {
    host.control.setValue(url('a'));
    fixture.detectChanges();
    expect(root.querySelector('img.preview')?.getAttribute('src')).toBe(url('a'));
    expect(root.textContent).toContain('Replace image');
  });

  it('uploads the file and writes the returned URL to the control', () => {
    const uploader = jasmine
      .createSpy<ImageUploader>('uploader')
      .and.returnValue(of(url('cover')));
    host.uploader.set(uploader);
    fixture.detectChanges();

    choose(png());

    expect(uploader).toHaveBeenCalledTimes(1);
    expect(host.control.value).toBe(url('cover'));
    expect(host.selected.length).toBe(1);
    expect(root.querySelector('[role="status"]')).toBeNull();
  });

  it('shows progress while uploading', () => {
    const pending = new Subject<string>();
    host.uploader.set(() => pending as Observable<string>);
    fixture.detectChanges();

    choose(png());
    expect(root.querySelector('[role="status"]')?.textContent).toContain('Uploading');

    pending.next(url('x'));
    pending.complete();
    fixture.detectChanges();
    expect(root.querySelector('[role="status"]')).toBeNull();
  });

  it('reports an upload failure and keeps the previous value', () => {
    host.control.setValue(url('old'));
    host.uploader.set(() => throwError(() => new Error('boom')));
    fixture.detectChanges();

    choose(png());

    expect(host.control.value).toBe(url('old'));
    expect(root.querySelector('[role="alert"]')?.textContent).toContain('Upload failed');
  });

  it('rejects invalid files without uploading', () => {
    const uploader = jasmine.createSpy<ImageUploader>('uploader');
    host.uploader.set(uploader);
    fixture.detectChanges();

    choose(new File(['x'], 'doc.pdf', { type: 'application/pdf' }));

    expect(uploader).not.toHaveBeenCalled();
    expect(root.querySelector('[role="alert"]')?.textContent).toContain('Unsupported');
    expect(host.selected.length).toBe(0);
  });

  it('clears the value with Remove', () => {
    host.control.setValue(url('a'));
    fixture.detectChanges();
    root.querySelector<HTMLButtonElement>('.btn-ghost-danger')?.click();
    fixture.detectChanges();
    expect(host.control.value).toBeNull();
    expect(root.querySelector('img.preview')).toBeNull();
  });

  it('handles dropped files', () => {
    const uploader = jasmine
      .createSpy<ImageUploader>('uploader')
      .and.returnValue(of(url('dropped')));
    host.uploader.set(uploader);
    fixture.detectChanges();

    const transfer = new DataTransfer();
    transfer.items.add(png());
    const drop = new DragEvent('drop', { dataTransfer: transfer, bubbles: true, cancelable: true });
    root.querySelector('.zone')?.dispatchEvent(drop);

    expect(host.control.value).toBe(url('dropped'));
  });

  it('disables the picker when the control is disabled', () => {
    host.control.disable();
    fixture.detectChanges();
    expect(root.querySelector<HTMLInputElement>('input[type="file"]')?.disabled).toBeTrue();
    expect(root.querySelector('.btn-ghost-danger')).toBeNull();
  });
});
