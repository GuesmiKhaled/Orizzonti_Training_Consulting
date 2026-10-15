import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import {
  BlogItem,
  CourseItem,
  MediaItem,
} from '../services/orizzonti-api.service';
import { BlogEditorPageComponent } from './blogs/blog-editor-page.component';
import { BlogsPageComponent } from './blogs/blogs-page.component';
import { CourseFormModalComponent } from './courses/course-form-modal.component';
import { CoursesPageComponent } from './courses/courses-page.component';
import { MediaFormModalComponent } from './media/media-form-modal.component';
import { MediaPageComponent } from './media/media-page.component';
import {
  clickButton,
  configureHttpTesting,
  expectCall,
  mount,
  rootOf,
  typeInto,
} from './testing/admin-test-utils';

const PIXEL = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';

const BLOGS: BlogItem[] = [
  { id: 1, title: 'Nursing in Italy', slug: 'nursing', isPublished: true, createdAt: '2026-10-01T10:00:00Z' },
  { id: 2, title: 'Draft post', slug: 'draft', isPublished: false, createdAt: '2026-10-02T10:00:00Z' },
];

const COURSES: CourseItem[] = [
  { id: 3, name: 'Italian', level: 'B1', price: '500', startDate: '2026-11-02' },
];

const MEDIA: MediaItem[] = [
  { id: 4, title: 'Hero', imageUrl: PIXEL, altText: 'Classroom', isActive: true },
  { id: 5, title: 'Old banner', imageUrl: PIXEL, isActive: false },
];

const routeFor = (id: string | null) => ({
  provide: ActivatedRoute,
  useValue: { snapshot: { paramMap: convertToParamMap(id ? { id } : {}) } },
});

describe('BlogsPageComponent', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    http = configureHttpTesting([provideRouter([])]);
  });

  afterEach(() => http.verify());

  const open = () => {
    const fixture = mount(BlogsPageComponent);
    expectCall(http, 'GET', '/blogs').flush(BLOGS);
    fixture.detectChanges();
    return fixture;
  };

  it('lists posts with their publication status', () => {
    const rows = rootOf(open()).querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
    expect(rows[0].querySelector('app-status-tag')?.textContent).toContain('Published');
    expect(rows[1].querySelector('app-status-tag')?.textContent).toContain('Draft');
  });

  it('offers a link to create a post', () => {
    const link = rootOf(open()).querySelector('a.btn');
    expect(link?.getAttribute('href')).toBe('/new');
    expect(link?.textContent).toContain('New post');
  });

  it('opens the editor for a post', () => {
    const fixture = open();
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    clickButton(rootOf(fixture), 'tbody tr:nth-child(2) .row-actions button', 'Edit');
    expect(navigate).toHaveBeenCalledWith(['/admin/blogs', 2]);
  });

  it('deletes only after confirmation and reloads', () => {
    const fixture = open();
    const root = rootOf(fixture);
    clickButton(root, 'tbody tr:first-child .row-actions button', 'Delete');
    fixture.detectChanges();
    http.expectNone((r) => r.method === 'DELETE');
    clickButton(root, 'app-confirm-dialog footer button', 'Delete');
    const deletion = expectCall(http, 'DELETE', '/blogs/1');
    expect(deletion.request.method).toBe('DELETE');
    deletion.flush({ deleted: true, id: 1 });
    expectCall(http, 'GET', '/blogs').flush([BLOGS[1]]);
    fixture.detectChanges();
    expect(root.querySelectorAll('tbody tr').length).toBe(1);
  });
});

describe('BlogEditorPageComponent', () => {
  let http: HttpTestingController;

  afterEach(() => http.verify());

  const setup = (id: string | null) => {
    http = configureHttpTesting([provideRouter([]), routeFor(id)]);
    const navigate = spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);
    const fixture = mount(BlogEditorPageComponent);
    return { fixture, root: rootOf(fixture), navigate };
  };

  const fillValid = (root: HTMLElement) => {
    typeInto(root, 'input[formControlName="title"]', 'Nursing in Italy');
    typeInto(root, 'textarea[formControlName="excerpt"]', 'Contracts for nurses in Italy.');
    typeInto(root, 'textarea[formControlName="content"]', 'Full article text goes here for readers.');
  };

  it('creates a published post without optional fields', () => {
    const { root, navigate } = setup(null);
    expect(root.querySelector('h1')?.textContent).toBe('New post');
    fillValid(root);
    clickButton(root, 'button[type="submit"]', 'Create post');

    const req = expectCall(http, 'POST', '/blogs');
    expect(req.request.body).toEqual({
      title: 'Nursing in Italy',
      excerpt: 'Contracts for nurses in Italy.',
      content: 'Full article text goes here for readers.',
      isPublished: true,
    });
    req.flush({ id: 9 });
    expect(navigate).toHaveBeenCalledWith('/admin/blogs');
  });

  it('can save a draft', () => {
    const { root } = setup(null);
    fillValid(root);
    const toggle = root.querySelector<HTMLInputElement>('input[formControlName="isPublished"]');
    toggle?.click();
    clickButton(root, 'button[type="submit"]', 'Create post');
    const req = expectCall(http, 'POST', '/blogs');
    expect(req.request.body.isPublished).toBeFalse();
    req.flush({ id: 9 });
  });

  it('validates lengths before sending', () => {
    const { fixture, root } = setup(null);
    typeInto(root, 'input[formControlName="title"]', 'Hi');
    typeInto(root, 'textarea[formControlName="excerpt"]', 'short');
    clickButton(root, 'button[type="submit"]', 'Create post');
    fixture.detectChanges();
    http.expectNone((r) => r.method === 'POST');
    expect(root.textContent).toContain('At least 3 characters');
    expect(root.textContent).toContain('At least 10 characters');
    expect(root.textContent).toContain('Required');
  });

  it('loads a post and saves changes, clearing a removed cover with null', () => {
    const { fixture, root, navigate } = setup('7');
    expectCall(http, 'GET', '/blogs/7').flush({
      id: 7,
      title: 'Old title',
      slug: 'old-title',
      excerpt: 'An excerpt long enough.',
      content: 'Content that is long enough to pass.',
      imageUrl: PIXEL,
      isPublished: true,
    });
    fixture.detectChanges();
    expect(root.querySelector('h1')?.textContent).toBe('Edit post');
    expect(root.querySelector<HTMLInputElement>('input[formControlName="title"]')?.value).toBe('Old title');
    expect(root.querySelector('img.preview')).not.toBeNull();

    typeInto(root, 'input[formControlName="title"]', 'New title');
    clickButton(root, 'app-image-picker .btn-ghost-danger', 'Remove');
    clickButton(root, 'button[type="submit"]', 'Save post');

    const req = expectCall(http, 'PATCH', '/blogs/7');
    expect(req.request.body).toEqual(
      jasmine.objectContaining({ title: 'New title', slug: 'old-title', imageUrl: null }),
    );
    req.flush({});
    expect(navigate).toHaveBeenCalledWith('/admin/blogs');
  });

  it('reports a post that cannot be loaded', () => {
    const { fixture, root } = setup('7');
    expectCall(http, 'GET', '/blogs/7').flush({}, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();
    expect(root.querySelector('[role="alert"]')?.textContent).toContain('Could not load');
  });
});

describe('courses admin', () => {
  let http: HttpTestingController;
  let saved: number;

  beforeEach(() => {
    http = configureHttpTesting();
    saved = 0;
  });

  afterEach(() => http.verify());

  const modal = (course: CourseItem | null) => {
    const fixture = mount(CourseFormModalComponent, { course });
    fixture.componentInstance.saved.subscribe(() => saved++);
    return { fixture, root: rootOf(fixture) };
  };

  it('creates a course with level and start date, omitting blanks', () => {
    const { root } = modal(null);
    typeInto(root, 'input[formControlName="name"]', 'Italian B1');
    typeInto(root, 'input[formControlName="level"]', 'B1');
    typeInto(root, 'input[type="date"]', '2026-11-02');
    clickButton(root, 'footer button', 'Create course');

    const req = expectCall(http, 'POST', '/courses');
    expect(req.request.body).toEqual(
      jasmine.objectContaining({ name: 'Italian B1', level: 'B1', startDate: '2026-11-02' }),
    );
    expect(req.request.body.description).toBeUndefined();
    expect(req.request.body.slug).toBeUndefined();
    req.flush({ id: 1 });
    expect(saved).toBe(1);
  });

  it('requires a name', () => {
    const { fixture, root } = modal(null);
    clickButton(root, 'footer button', 'Create course');
    fixture.detectChanges();
    http.expectNone((r) => r.method === 'POST');
    expect(root.querySelector('[role="alert"]')?.textContent).toContain('Required');
  });

  it('prefills an existing course and clears a removed image with null', () => {
    const { root } = modal({ ...COURSES[0], imageUrl: PIXEL });
    expect(root.querySelector<HTMLInputElement>('input[formControlName="level"]')?.value).toBe('B1');
    expect(root.querySelector<HTMLInputElement>('input[type="date"]')?.value).toBe('2026-11-02');

    clickButton(root, 'app-image-picker .btn-ghost-danger', 'Remove');
    clickButton(root, 'footer button', 'Save course');
    const req = expectCall(http, 'PATCH', '/courses/3');
    expect(req.request.body.imageUrl).toBeNull();
    expect(req.request.body.level).toBe('B1');
    req.flush({});
  });

  it('lists courses and deletes after confirmation', () => {
    const fixture = mount(CoursesPageComponent);
    const root = rootOf(fixture);
    expectCall(http, 'GET', '/courses').flush(COURSES);
    fixture.detectChanges();
    expect(root.querySelector('tbody')?.textContent).toContain('Italian');
    expect(root.querySelector('tbody')?.textContent).toContain('2026-11-02');

    clickButton(root, 'tbody .row-actions button', 'Delete');
    fixture.detectChanges();
    clickButton(root, 'app-confirm-dialog footer button', 'Delete');
    const deletion = expectCall(http, 'DELETE', '/courses/3');
    expect(deletion.request.method).toBe('DELETE');
    deletion.flush({ deleted: true, id: 3 });
    expectCall(http, 'GET', '/courses').flush([]);
  });
});

describe('slider media admin', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    http = configureHttpTesting();
  });

  afterEach(() => http.verify());

  it('shows image cards with their visibility', () => {
    const fixture = mount(MediaPageComponent);
    expectCall(http, 'GET', '/media').flush(MEDIA);
    fixture.detectChanges();
    const cards = rootOf(fixture).querySelectorAll('article.card');
    expect(cards.length).toBe(2);
    expect(cards[0].querySelector('img')?.getAttribute('alt')).toBe('Classroom');
    expect(cards[1].querySelector('img')?.getAttribute('alt')).toBe('Old banner');
    expect(cards[1].querySelector('app-status-tag')?.textContent).toContain('Hidden');
  });

  it('shows an empty state', () => {
    const fixture = mount(MediaPageComponent);
    expectCall(http, 'GET', '/media').flush([]);
    fixture.detectChanges();
    expect(rootOf(fixture).textContent).toContain('No slider images yet');
  });

  it('will not save without an image', () => {
    const fixture = mount(MediaFormModalComponent, { item: null });
    const root = rootOf(fixture);
    typeInto(root, 'input[formControlName="title"]', 'Hero');
    clickButton(root, 'footer button', 'Add image');
    fixture.detectChanges();
    http.expectNone((r) => r.method === 'POST');
    expect(root.textContent).toContain('Choose an image');
  });

  it('uploads the chosen file and then saves the returned URL', () => {
    const fixture = mount(MediaFormModalComponent, { item: null });
    const root = rootOf(fixture);
    typeInto(root, 'input[formControlName="title"]', 'Hero');

    const transfer = new DataTransfer();
    transfer.items.add(new File([new Uint8Array(8)], 'a.png', { type: 'image/png' }));
    const input = root.querySelector<HTMLInputElement>('input[type="file"]');
    if (input) {
      input.files = transfer.files;
      input.dispatchEvent(new Event('change'));
    }
    const upload = expectCall(http, 'POST', '/media/upload');
    expect(upload.request.body instanceof FormData).toBeTrue();
    expect((upload.request.body as FormData).get('file')).toBeTruthy();
    upload.flush({ url: `${PIXEL}#uploaded` });
    fixture.detectChanges();

    clickButton(root, 'footer button', 'Add image');
    const create = expectCall(http, 'POST', '/media');
    expect(create.request.body).toEqual({
      title: 'Hero',
      imageUrl: `${PIXEL}#uploaded`,
      altText: '',
      isActive: true,
    });
    create.flush({ id: 1 });
  });

  it('edits an existing image with PATCH', () => {
    const fixture = mount(MediaFormModalComponent, { item: MEDIA[0] });
    const root = rootOf(fixture);
    typeInto(root, 'input[formControlName="title"]', 'Hero 2');
    clickButton(root, 'footer button', 'Save image');
    const req = expectCall(http, 'PATCH', '/media/4');
    expect(req.request.body.title).toBe('Hero 2');
    expect(req.request.body.imageUrl).toBe(PIXEL);
    req.flush({});
  });
});
