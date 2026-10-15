import { defineConfig } from '@playwright/test';

const PORT = 4300;

/**
 * Browser end-to-end tests. The API is mocked inside the tests, so no backend
 * or database is needed and nothing is written anywhere.
 *
 * Browser: Playwright's bundled Chromium (`npx playwright install chromium`),
 * or any Chromium-based browser via E2E_BROWSER_PATH (for example Chrome/Brave).
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    timezoneId: 'Africa/Tunis',
    locale: 'en-GB',
    trace: 'retain-on-failure',
    launchOptions: process.env['E2E_BROWSER_PATH']
      ? { executablePath: process.env['E2E_BROWSER_PATH'] }
      : {},
  },
  webServer: {
    command: `npx ng serve --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 240_000,
  },
});
