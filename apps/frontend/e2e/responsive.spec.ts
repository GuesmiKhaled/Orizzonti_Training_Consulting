import { Page, expect, test } from '@playwright/test';
import { MockState, mockApi, newState, signIn } from './support/mock-api';

const VIEWPORTS = [
  { name: 'phone', width: 360, height: 740 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
] as const;

const PUBLIC_PAGES = ['/', '/about', '/courses', '/contact', '/blog', '/languages/1', '/login'];

const ADMIN_PAGES = [
  '/admin/overview',
  '/admin/users',
  '/admin/users/roles',
  '/admin/courses',
  '/admin/languages',
  '/admin/languages/levels',
  '/admin/languages/exams',
  '/admin/languages/registrations',
  '/admin/blogs',
  '/admin/blogs/new',
  '/admin/media',
  '/admin/requests',
  '/admin/settings/site',
  '/admin/settings/mail',
];

/** Elements that stick out of the right edge of the screen, outside any horizontally scrolling box. */
async function overflowReport(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const limit = document.documentElement.clientWidth;
    const scrolls = (el: Element | null): boolean => {
      for (let node = el; node && node !== document.body; node = node.parentElement) {
        const overflow = getComputedStyle(node).overflowX;
        if (node !== el && (overflow === 'auto' || overflow === 'scroll' || overflow === 'hidden')) {
          return true;
        }
      }
      return false;
    };
    const offenders: string[] = [];
    if (document.documentElement.scrollWidth > limit + 1) {
      offenders.push(`page scrollWidth ${document.documentElement.scrollWidth} > ${limit}`);
    }
    for (const el of Array.from(document.body.querySelectorAll('*'))) {
      const box = el.getBoundingClientRect();
      if (box.width > 0 && box.right > limit + 1 && !scrolls(el)) {
        const id = el.id ? `#${el.id}` : '';
        const cls = typeof el.className === 'string' && el.className ? `.${el.className.split(' ')[0]}` : '';
        offenders.push(`${el.tagName.toLowerCase()}${id}${cls} right=${Math.round(box.right)}`);
        if (offenders.length >= 6) break;
      }
    }
    return offenders;
  });
}

for (const viewport of VIEWPORTS) {
  test.describe(`${viewport.name} (${viewport.width}px)`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    let state: MockState;

    test.beforeEach(async ({ page }) => {
      state = newState();
      await signIn(page);
      await mockApi(page, state);
    });

    test.afterEach(() => {
      expect(state.unmocked, 'every API call should be mocked').toEqual([]);
    });

    for (const url of [...PUBLIC_PAGES, ...ADMIN_PAGES]) {
      test(`${url} fits the screen`, async ({ page }) => {
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        await expect(page.locator('h1, h2').first()).toBeVisible();
        expect(await overflowReport(page)).toEqual([]);
      });
    }

    test('the admin navigation adapts to the screen', async ({ page }) => {
      await page.goto('/admin/overview');
      const sidebar = page.getByRole('navigation', { name: 'Backoffice sections' });
      const menu = page.getByRole('button', { name: 'Menu' });
      if (viewport.width > 860) {
        // On desktop the sidebar starts expanded and the toggle collapses it to an icon rail.
        await expect(sidebar).toBeInViewport();
        await expect(menu).toBeVisible();
        await menu.click();
        await expect(sidebar).toBeInViewport();
        await menu.click();
        await expect(sidebar).toBeInViewport();
        return;
      }
      await expect(menu).toBeVisible();
      await expect(sidebar).toBeHidden();
      await menu.click();
      await expect(sidebar).toBeVisible();
      await expect(sidebar).toBeInViewport();
      // Groups start collapsed — expand "Users" before clicking its child link.
      await page.getByRole('button', { name: 'Users' }).click();
      await page.getByRole('link', { name: 'Users list' }).click();
      await expect(page).toHaveURL(/\/admin\/users$/);
      await expect(sidebar).toBeHidden();
    });

    test('the language wizard fits and keeps its buttons reachable', async ({ page }) => {
      await page.goto('/admin/languages');
      await page.getByRole('button', { name: 'Add language', exact: true }).click();
      const dialog = page.getByRole('dialog', { name: 'Add language' });
      await expect(dialog).toBeVisible();
      const box = await dialog.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1);
      expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height + 1);
      await expect(dialog.getByRole('button', { name: 'Next' })).toBeInViewport();
      await expect(dialog.getByRole('button', { name: 'Close dialog' })).toBeInViewport();
    });

    test('the image gallery opens inside the screen', async ({ page }) => {
      await page.goto('/admin/languages');
      await page.getByRole('button', { name: 'Add language', exact: true }).click();
      await page.getByRole('button', { name: 'Choose image' }).click();
      const gallery = page.getByRole('dialog', { name: 'Choose an image' });
      await expect(gallery).toBeVisible();
      const box = await gallery.boundingBox();
      expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1);
      expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height + 1);
    });
  });
}

test.describe('public site on a phone', () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test('the home page shows the slider, hero text and a usable menu', async ({ page }) => {
    const state = newState();
    await mockApi(page, state);
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: 'Orizzonti' })).toBeVisible();
    const hero = page.locator('.hero-carousel > img');
    await expect(hero).toBeVisible();
    const size = await hero.boundingBox();
    expect(size!.width).toBeLessThanOrEqual(361);
    expect(await overflowReport(page)).toEqual([]);
    expect(state.unmocked).toEqual([]);
  });
});
