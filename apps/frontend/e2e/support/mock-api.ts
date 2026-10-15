import { Page, Route } from '@playwright/test';

export const API = 'http://localhost:5007';
const ORIGIN = 'http://localhost:4300';

export interface RecordedRequest {
  readonly method: string;
  readonly path: string;
  readonly body: unknown;
}

export interface Level {
  id: number;
  languageId: number;
  cefrLevel: string;
  courseHours: string;
  price: string;
  isActive: boolean;
  examSessions: unknown[];
}

export interface Language {
  id: number;
  name: string;
  code: string;
  nativeName: string;
  imageUrl?: string;
  isActive: boolean;
  levels: Level[];
}

export interface MockState {
  languages: Language[];
  profile: {
    id: number;
    username: string;
    role: string;
    permissions: string[];
    mustChangePassword: boolean;
  };
  /** Per-test answers for read-only paths, taking precedence over the defaults. */
  catalog: Record<string, unknown>;
  /** Every non-GET call the app made, in order. */
  writes: RecordedRequest[];
  /** Requests nobody mocked; tests assert this stays empty. */
  unmocked: string[];
}

export function newState(overrides: Partial<MockState> = {}): MockState {
  return {
    languages: [
      {
        id: 1,
        name: 'English',
        code: 'ENG',
        nativeName: 'English',
        isActive: true,
        levels: [
          {
            id: 5,
            languageId: 1,
            cefrLevel: 'A1',
            courseHours: '120',
            price: '500',
            isActive: true,
            examSessions: [],
          },
        ],
      },
    ],
    profile: {
      id: 1,
      username: 'admin',
      role: 'super-admin',
      permissions: [
        'view_dashboard', 'manage_languages', 'manage_users', 'manage_roles', 'manage_blog', 'manage_courses',
        'manage_media', 'manage_course_requests', 'manage_mail_settings', 'manage_site_settings',
      ],
      mustChangePassword: false,
    },
    catalog: {},
    writes: [],
    unmocked: [],
    ...overrides,
  };
}

/** Read-only answers for the pages that only list data. */
const CATALOG: Record<string, unknown> = {
  '/blogs': [
    { id: 1, title: 'Nursing in Italy', slug: 'nursing-in-italy', excerpt: 'Contracts for nurses.', content: 'Full article text.', isPublished: true, createdAt: '2026-10-01T10:00:00Z' },
  ],
  '/blogs/manage': [
    { id: 1, title: 'Nursing in Italy', slug: 'nursing-in-italy', isPublished: true, createdAt: '2026-10-01T10:00:00Z' },
    { id: 2, title: 'A draft that is still being written', slug: 'draft', isPublished: false, createdAt: '2026-10-02T10:00:00Z' },
  ],
  '/courses': [
    { id: 3, name: 'Italian for beginners', level: 'A1', price: '500', startDate: '2026-11-02', description: 'Start speaking Italian.' },
  ],
  '/courses/featured': [
    { id: 3, name: 'Italian for beginners', level: 'A1', price: '500', description: 'Start speaking Italian.' },
  ],
  '/media': [
    { id: 2, title: 'Classroom', imageUrl: '/img/carousel-1.jpg', altText: 'Our classroom', isActive: true },
    { id: 1, title: 'Students', imageUrl: '/img/carousel-2.jpg', altText: 'Students learning', isActive: true },
  ],
  '/media/manage': [
    { id: 2, title: 'Classroom', imageUrl: '/img/carousel-1.jpg', altText: 'Our classroom', isActive: true },
    { id: 1, title: 'Hidden banner', imageUrl: '/img/carousel-2.jpg', isActive: false },
  ],
  '/course-requests': [
    { id: 1, fullName: 'Sana Ben Ali', email: 'sana.benali@example.com', phone: '+216 20 000 000', courseName: 'Italian for beginners', message: 'I would like to know the schedule and the price of the evening classes.', status: 'new', createdAt: '2026-10-10T10:00:00Z' },
  ],
  '/exam-registrations': [
    { id: 11, fullName: 'Leila Mansour', email: 'leila.mansour@example.com', phone: '+216 21 111 111', status: 'pending', createdAt: '2026-10-12T10:00:00Z', examSessionId: 9, examDate: '2026-12-10T09:00:00Z', cefrLevel: 'A1', languageName: 'English' },
  ],
  '/auth/users': {
    items: [
      { id: 1, username: 'admin', fullName: 'Guesmi Khaled', email: 'info@orizzonti.tn', phone: '+216 24 422 753', role: 'super-admin', roleId: 1, isActive: true },
    ],
    total: 1,
    page: 0,
    size: 10,
  },
  '/auth/roles': [
    { id: 1, name: 'super-admin', description: 'Full access', permissions: [{ id: 1, name: 'manage_users' }] },
    { id: 2, name: 'content-manager', description: 'Writes content', permissions: [{ id: 2, name: 'manage_blog' }] },
  ],
  '/auth/permissions': [
    { id: 1, name: 'manage_users' },
    { id: 2, name: 'manage_blog' },
    { id: 3, name: 'manage_languages' },
  ],
  '/settings/mail': { host: 'smtp.example.com', port: 587, username: 'info@orizzonti.tn', fromAddress: 'info@orizzonti.tn', secure: true, passwordConfigured: true },
};

const CORS = {
  'access-control-allow-origin': ORIGIN,
  'access-control-allow-headers': 'authorization,content-type',
  'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
};

const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({
    status,
    contentType: 'application/json',
    headers: CORS,
    body: JSON.stringify(body),
  });

/** Signs the browser in (token only; the profile comes from the mocked API). */
export async function signIn(page: Page): Promise<void> {
  await page.addInitScript(() => localStorage.setItem('orizzonti-admin-token', 'e2e-token'));
}

/** Answers every API call from `state`; anything unexpected is recorded and fails the test. */
export async function mockApi(page: Page, state: MockState): Promise<void> {
  await page.route(`${API}/**`, async (route) => {
    const request = route.request();
    const method = request.method();
    const path = new URL(request.url()).pathname;
    if (method === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: CORS });
    }
    const body: unknown = request.postData() ? JSON.parse(request.postData() as string) : undefined;
    if (method !== 'GET') {
      state.writes.push({ method, path, body });
    }

    if (method === 'GET' && path in state.catalog) {
      return json(route, state.catalog[path]);
    }
    if (method === 'GET' && path === '/site-settings') {
      return json(route, {});
    }
    if (method === 'GET' && path === '/auth/profile') {
      return json(route, state.profile);
    }
    if (method === 'GET' && path === '/dashboard/stats') {
      return json(route, {
        blogsCount: 0, coursesCount: 0, languagesCount: state.languages.length, sliderCount: 0,
        courseRequestsCount: 0, newCourseRequestsCount: 0, adminUsersCount: 1,
        requestsByCourse: [], latestRequests: [],
      });
    }
    if (method === 'GET' && path in CATALOG) {
      return json(route, CATALOG[path]);
    }
    const levelsOf = /^\/languages\/(\d+)\/levels$/.exec(path)?.[1];
    if (method === 'GET' && levelsOf) {
      return json(route, state.languages.find((l) => l.id === Number(levelsOf))?.levels ?? []);
    }
    if (method === 'GET' && path === '/languages') {
      return json(route, state.languages);
    }
    const languageId = /^\/languages\/(\d+)$/.exec(path)?.[1];
    if (method === 'GET' && languageId) {
      const found = state.languages.find((l) => l.id === Number(languageId));
      return found ? json(route, found) : json(route, { message: 'Not found' }, 404);
    }
    if (method === 'POST' && path === '/languages/wizard') {
      const payload = body as { language: Omit<Language, 'id' | 'levels'>; levels: Omit<Level, 'id'>[] };
      const created: Language = {
        id: 100 + state.languages.length,
        ...payload.language,
        nativeName: payload.language.nativeName ?? '',
        levels: payload.levels.map((level, index) => ({
          ...level,
          id: 200 + index,
          languageId: 100 + state.languages.length,
          examSessions: [],
        })),
      };
      state.languages.push(created);
      return json(route, created, 201);
    }
    const levelPatch = /^\/languages\/(\d+)\/levels\/(\d+)$/.exec(path);
    if (method === 'PATCH' && levelPatch) {
      const language = state.languages.find((l) => l.id === Number(levelPatch[1]));
      const level = language?.levels.find((l) => l.id === Number(levelPatch[2]));
      Object.assign(level ?? {}, body);
      return json(route, level ?? {});
    }
    if (method === 'POST' && path === '/auth/change-password') {
      state.profile.mustChangePassword = false;
      return json(route, { success: true }, 201);
    }

    state.unmocked.push(`${method} ${path}`);
    return json(route, { message: `Unmocked: ${method} ${path}` }, 404);
  });
}
