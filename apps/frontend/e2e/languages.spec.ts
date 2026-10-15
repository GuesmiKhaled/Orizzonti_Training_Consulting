import { expect, test } from '@playwright/test';
import { MockState, mockApi, newState, signIn } from './support/mock-api';

test.describe('languages: add and edit', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = newState();
    await signIn(page);
    await mockApi(page, state);
  });

  test.afterEach(() => {
    expect(state.unmocked, 'every API call the app made should be mocked').toEqual([]);
  });

  test('adds a language with a level and an exam through the wizard', async ({ page }) => {
    await page.goto('/admin/languages');
    await expect(page.getByRole('heading', { name: 'English' })).toBeVisible();

    await page.getByRole('button', { name: 'Add language', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Add language' });
    await expect(dialog).toBeVisible();

    // Step 1: the language. Moving on without a name is refused.
    await dialog.getByRole('button', { name: 'Next' }).click();
    await expect(dialog.getByRole('alert').filter({ hasText: 'Required' })).toBeVisible();
    await dialog.getByRole('textbox', { name: 'Name', exact: true }).fill('Italian');
    await dialog.getByRole('textbox', { name: 'Code', exact: true }).fill('ITA');
    await dialog.getByRole('button', { name: 'Next' }).click();

    // Step 2: one level.
    await dialog.getByRole('button', { name: '+ Add level' }).click();
    await dialog.getByRole('textbox', { name: 'Course hours', exact: true }).fill('120');
    await dialog.getByRole('textbox', { name: 'Price', exact: true }).fill('400');
    await dialog.getByRole('button', { name: 'Next' }).click();

    // Step 3: one exam under that level.
    await dialog.getByRole('button', { name: '+ Add exam' }).click();
    await dialog.getByLabel('Exam date').fill('2026-12-10T09:00');
    await dialog.getByLabel('Registration opens').fill('2026-11-01T09:00');
    await dialog.getByLabel('Registration deadline').fill('2026-11-30T09:00');
    await dialog.getByRole('button', { name: 'Create language' }).click();

    await expect(page.getByRole('status').filter({ hasText: 'Italian created.' })).toBeVisible();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('heading', { name: 'Italian' })).toBeVisible();

    // Everything went to the server in one transactional request.
    expect(state.writes).toHaveLength(1);
    const [write] = state.writes;
    expect(write.method).toBe('POST');
    expect(write.path).toBe('/languages/wizard');
    const body = write.body as {
      language: { name: string; code: string };
      levels: { cefrLevel: string; courseHours: string; price: string; exams: { examDate: string; registrationDeadline: string }[] }[];
    };
    expect(body.language).toMatchObject({ name: 'Italian', code: 'ITA' });
    expect(body.levels).toHaveLength(1);
    expect(body.levels[0]).toMatchObject({ cefrLevel: 'A1', courseHours: '120', price: '400' });
    // Local Tunis time (UTC+1 in winter) is converted to UTC for the API.
    expect(body.levels[0].exams).toEqual([
      expect.objectContaining({
        examDate: '2026-12-10T08:00:00.000Z',
        registrationDeadline: '2026-11-30T08:00:00.000Z',
      }),
    ]);
  });

  test('chooses a picture for the language from the image library', async ({ page }) => {
    await page.goto('/admin/languages');
    await page.getByRole('button', { name: 'Add language', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Add language' });
    await dialog.getByRole('textbox', { name: 'Name', exact: true }).fill('Italian');

    await dialog.getByRole('button', { name: 'Choose image' }).click();
    const gallery = page.getByRole('dialog', { name: 'Choose an image' });
    await gallery.getByRole('searchbox', { name: 'Search' }).fill('italian');
    await gallery.getByRole('button', { name: 'italian.jpg' }).first().click();
    await expect(gallery).toBeHidden();
    await expect(dialog.getByRole('img', { name: 'Selected image' })).toHaveAttribute('src', /^\/img\/.*italian\.jpg$/);

    await dialog.getByRole('button', { name: 'Next' }).click();
    await dialog.getByRole('button', { name: 'Next' }).click();
    await dialog.getByRole('button', { name: 'Create language' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Italian created.' })).toBeVisible();

    const body = state.writes[0].body as { language: { imageUrl: string } };
    expect(body.language.imageUrl).toMatch(/^\/img\/.*italian\.jpg$/);
    // The dashboard card now shows the chosen picture.
    await expect(page.getByRole('article').filter({ hasText: 'Italian' }).locator('img.thumb')).toBeVisible();
  });

  test('refuses an exam whose registration closes after the exam date', async ({ page }) => {
    await page.goto('/admin/languages');
    await page.getByRole('button', { name: 'Add language', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Add language' });
    await dialog.getByRole('textbox', { name: 'Name', exact: true }).fill('French');
    await dialog.getByRole('button', { name: 'Next' }).click();
    await dialog.getByRole('button', { name: '+ Add level' }).click();
    await dialog.getByRole('textbox', { name: 'Course hours', exact: true }).fill('90');
    await dialog.getByRole('textbox', { name: 'Price', exact: true }).fill('300');
    await dialog.getByRole('button', { name: 'Next' }).click();
    await dialog.getByRole('button', { name: '+ Add exam' }).click();
    await dialog.getByLabel('Exam date').fill('2026-12-10T09:00');
    await dialog.getByLabel('Registration opens').fill('2026-11-01T09:00');
    await dialog.getByLabel('Registration deadline').fill('2026-12-20T09:00');
    await dialog.getByRole('button', { name: 'Create language' }).click();

    await expect(dialog.getByRole('alert').filter({ hasText: 'deadline must be before the exam date' })).toBeVisible();
    expect(state.writes).toHaveLength(0);
  });

  test('editing sends only the field that changed', async ({ page }) => {
    await page.goto('/admin/languages');
    await page.getByRole('article').filter({ hasText: 'English' }).getByRole('button', { name: 'Edit' }).click();
    const dialog = page.getByRole('dialog', { name: 'Edit English' });
    await expect(dialog.getByText('No unsaved changes')).toBeVisible();

    await dialog.getByRole('button', { name: /Levels/ }).first().click();
    await dialog.getByRole('button', { name: 'Edit' }).click();
    await dialog.getByRole('textbox', { name: 'Price', exact: true }).fill('550');

    await expect(dialog.getByText('1 unsaved change: A1 price')).toBeVisible();
    await expect(dialog.getByText('was 500')).toBeVisible();
    await dialog.getByRole('button', { name: 'Save 1 change' }).click();

    await expect(page.getByRole('status').filter({ hasText: 'Changes saved.' })).toBeVisible();
    expect(state.writes).toEqual([
      { method: 'PATCH', path: '/languages/1/levels/5', body: { price: '550' } },
    ]);
  });

  test('closing a dirty wizard asks before discarding', async ({ page }) => {
    await page.goto('/admin/languages');
    await page.getByRole('button', { name: 'Add language', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Add language' });
    await dialog.getByRole('textbox', { name: 'Name', exact: true }).fill('Spanish');

    await page.keyboard.press('Escape');
    const confirm = page.getByRole('dialog', { name: 'Discard changes?' });
    await expect(confirm).toBeVisible();
    await confirm.getByRole('button', { name: 'Discard' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(state.writes).toHaveLength(0);
  });
});
