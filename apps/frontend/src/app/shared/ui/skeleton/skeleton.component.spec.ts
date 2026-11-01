import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SkeletonComponent } from './skeleton.component';

describe('SkeletonComponent', () => {
  let fixture: ComponentFixture<SkeletonComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [SkeletonComponent] });
    fixture = TestBed.createComponent(SkeletonComponent);
  });

  it('renders a single text bone by default', () => {
    fixture.detectChanges();
    const bone = fixture.nativeElement.querySelector('.bone');
    expect(bone).toBeTruthy();
    expect(bone.classList.contains('text')).toBe(true);
  });

  it('renders a circle variant', () => {
    fixture.componentRef.setInput('variant', 'circle');
    fixture.componentRef.setInput('width', '40px');
    fixture.componentRef.setInput('height', '40px');
    fixture.detectChanges();
    const bone = fixture.nativeElement.querySelector('.bone');
    expect(bone.classList.contains('circle')).toBe(true);
  });

  it('renders multiple lines when lines > 1', () => {
    fixture.componentRef.setInput('lines', 3);
    fixture.detectChanges();
    const lines = fixture.nativeElement.querySelectorAll('.line');
    expect(lines.length).toBe(3);
  });

  it('shortens the last line', () => {
    fixture.componentRef.setInput('lines', 2);
    fixture.detectChanges();
    const lines = fixture.nativeElement.querySelectorAll('.line');
    expect(lines[0].style.width).toBe('100%');
    expect(lines[1].style.width).toBe('80%');
  });
});
