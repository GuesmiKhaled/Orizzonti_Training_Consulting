import { expect, test } from '@playwright/test';
import { MockState, mockApi, newState } from './support/mock-api';

test.describe('home page follows the admin content', () => {
  let state: MockState;

  test.beforeEach(async ({ page }) => {
    state = newState();
    state.catalog['/site-settings'] = {
      heroTitle: 'Learn with Orizzonti',
      heroSubtitle: 'Classes in Tunis for every level.',
      contactEmail: 'hello@orizzonti.tn',
    };
    state.catalog['/media'] = [
      { id: 3, title: 'Newest slide', imageUrl: '/img/carousel-2.jpg', altText: 'The newest slide', isActive: true },
      { id: 2, title: 'Older slide', imageUrl: '/img/carousel-1.jpg', altText: 'An older slide', isActive: true },
    ];
    state.languages[0].imageUrl = '/img/eng/english.jpg';
    state.languages.push({
      id: 2,
      name: 'Italian',
      code: 'ITA',
      nativeName: 'Italiano',
      isActive: true,
      levels: [],
    });
    await mockApi(page, state);
    await page.goto('/');
  });

  test.afterEach(() => {
    expect(state.unmocked).toEqual([]);
  });

  test('shows the saved hero text', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: 'Learn with Orizzonti' })).toBeVisible();
    await expect(page.getByText('Classes in Tunis for every level.')).toBeVisible();
  });

  test('shows the slider media, newest first, and lets the visitor move through it', async ({ page }) => {
    const hero = page.locator('.hero-carousel > img');
    await expect(hero).toHaveAttribute('alt', 'The newest slide');
    await expect(page.getByRole('button', { name: /^Show slide/ })).toHaveCount(2);

    await page.getByRole('button', { name: 'Next slide' }).click();
    await expect(hero).toHaveAttribute('alt', 'An older slide');
    await page.getByRole('button', { name: 'Next slide' }).click();
    await expect(hero).toHaveAttribute('alt', 'The newest slide');
  });

  test('advances by itself and can be paused', async ({ page }) => {
    const hero = page.locator('.hero-carousel > img');
    await expect(hero).toHaveAttribute('alt', 'The newest slide');
    await expect(hero).toHaveAttribute('alt', 'An older slide', { timeout: 9000 });

    await page.getByRole('button', { name: 'Pause slideshow' }).click();
    await expect(page.getByRole('button', { name: 'Play slideshow' })).toBeVisible();
    await page.waitForTimeout(7000);
    await expect(hero).toHaveAttribute('alt', 'An older slide');
  });

  test('uses the language picture on the subject card and lists languages in the footer', async ({ page }) => {
    const cards = page.locator('.subject-item');
    await expect(cards.first().locator('img')).toHaveAttribute('src', '/img/eng/english.jpg');
    await expect(cards.nth(1).locator('img')).toHaveAttribute('src', '/img/cat-2.jpg');

    const footer = page.locator('.site-footer');
    await expect(footer.getByRole('link', { name: 'Italiano' })).toHaveAttribute('href', '/languages/2');
    await expect(footer.getByRole('link', { name: 'English' })).toHaveAttribute('href', '/languages/1');
    await expect(footer).toContainText('hello@orizzonti.tn');
  });
});
