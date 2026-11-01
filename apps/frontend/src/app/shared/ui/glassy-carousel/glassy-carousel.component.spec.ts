import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  GlassyCarouselComponent,
  GlassySlide,
} from './glassy-carousel.component';

describe('GlassyCarouselComponent', () => {
  let fixture: ComponentFixture<GlassyCarouselComponent>;
  let component: GlassyCarouselComponent;

  const slides: GlassySlide[] = [
    { image: '/img/course-1.jpg', title: 'Slide 1', subtitle: 'Sub 1' },
    { image: '/img/course-2.jpg', title: 'Slide 2', subtitle: 'Sub 2' },
    { image: '/img/course-3.jpg', title: 'Slide 3', subtitle: 'Sub 3' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GlassyCarouselComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(GlassyCarouselComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('slides', slides);
    fixture.componentRef.setInput('autoplay', false);
    fixture.detectChanges();
  });

  it('starts at the first slide', () => {
    expect(component.current()).toBe(0);
  });

  it('next() advances forward', () => {
    component.next();
    expect(component.current()).toBe(1);
  });

  it('next() loops to 0 from the last slide when loop is on', () => {
    component.goTo(2);
    component.next();
    expect(component.current()).toBe(0);
  });

  it('next() does not loop when loop is off', () => {
    fixture.componentRef.setInput('loop', false);
    fixture.detectChanges();
    component.goTo(2);
    component.next();
    expect(component.current()).toBe(2);
  });

  it('prev() goes backward', () => {
    component.goTo(2);
    component.prev();
    expect(component.current()).toBe(1);
  });

  it('prev() loops from 0 to the last slide when loop is on', () => {
    component.prev();
    expect(component.current()).toBe(2);
  });

  it('prev() does not loop when loop is off', () => {
    fixture.componentRef.setInput('loop', false);
    fixture.detectChanges();
    component.prev();
    expect(component.current()).toBe(0);
  });

  it('goTo() sets the current index when in range', () => {
    component.goTo(1);
    expect(component.current()).toBe(1);
  });

  it('goTo() ignores out-of-range indices', () => {
    component.goTo(5);
    expect(component.current()).toBe(0);
    component.goTo(-1);
    expect(component.current()).toBe(0);
  });

  it('isAdjacent() identifies neighbors of the active slide', () => {
    component.goTo(1);
    expect(component.isAdjacent(0)).toBeTrue();
    expect(component.isAdjacent(2)).toBeTrue();
    expect(component.isAdjacent(1)).toBeFalse();
  });

  it('isAdjacent() wraps around when loop is on', () => {
    component.goTo(0);
    expect(component.isAdjacent(2)).toBeTrue();
    component.goTo(2);
    expect(component.isAdjacent(0)).toBeTrue();
  });

  it('renders the correct number of dot buttons', () => {
    const dots = fixture.nativeElement.querySelectorAll('.dot');
    expect(dots.length).toBe(3);
  });

  it('updates the active dot when current changes', () => {
    component.goTo(1);
    fixture.detectChanges();
    const dots = fixture.nativeElement.querySelectorAll('.dot');
    expect(dots[1].classList.contains('active')).toBeTrue();
    expect(dots[0].classList.contains('active')).toBeFalse();
  });
});
