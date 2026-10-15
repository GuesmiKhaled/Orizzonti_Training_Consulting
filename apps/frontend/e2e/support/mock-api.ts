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
      permissions: ['view_dashboard', 'manage_languages'],
      mustChangePassword: false,
    },
    writes: [],
    unmocked: [],
    ...overrides,
  };
}

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
