import { expect, test } from '@playwright/test';
import { MockState, mockApi, newState, signIn } from './support/mock-api';

test.describe('first login: forced password change', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = newState();
    state.profile.mustChangePassword = true;
    await signIn(page);
    await mockApi(page, state);
  });

  test.afterEach(() => {
    expect(state.unmocked).toEqual([]);
  });

  test('sends the user to choose a new password before the admin area', async ({ page }) => {
    await page.goto('/admin/languages');
    await expect(page).toHaveURL(/\/change-password$/);
    await expect(page.getByRole('heading', { name: 'Choose a new password' })).toBeVisible();

    await page.getByLabel('Current password').fill('temporary-password-1');
    await page.getByLabel('New password', { exact: true }).fill('short');
    await page.getByLabel('Confirm new password').fill('short');
    await page.getByRole('button', { name: 'Change password' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'at least 12' })).toBeVisible();
    expect(state.writes).toHaveLength(0);

    await page.getByLabel('New password', { exact: true }).fill('a-brand-new-password');
    await page.getByLabel('Confirm new password').fill('a-brand-new-password');
    await page.getByRole('button', { name: 'Change password' }).click();

    await expect(page).toHaveURL(/\/admin\/overview$/);
    expect(state.writes).toEqual([
      {
        method: 'POST',
        path: '/auth/change-password',
        body: { currentPassword: 'temporary-password-1', newPassword: 'a-brand-new-password' },
      },
    ]);
  });
});
