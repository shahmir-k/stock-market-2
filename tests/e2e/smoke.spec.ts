// Playwright smoke test scaffold. To run:
//   1. npx playwright install chromium
//   2. Set up .env.local with Supabase credentials
//   3. npm run dev
//   4. npx playwright test
//
// This is a representative E2E spec covering PRD §21.3 user journeys; expand
// it once the test environment is set up.

import { expect, test } from '@playwright/test';

test.describe('Setup → Dashboard', () => {
  test('first launch shows setup; clicking Start initializes simulator', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Personal Stock Market Simulator/i })).toBeVisible();
    await expect(page.getByText(/\$5,000 CAD/i)).toBeVisible();

    await page.getByLabel('Optional display name').fill('PlaywrightTester');
    await page.getByRole('button', { name: 'Start Simulation' }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });
});

test.describe('Browse → Buy', () => {
  test('search → view → trade ticket', async ({ page }) => {
    await page.goto('/browse');
    await page.getByPlaceholder('Search symbol or company name…').fill('TD');
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.getByText('TD.TO')).toBeVisible();
    await page.getByRole('link', { name: 'View' }).first().click();

    await expect(page.getByRole('heading', { name: /Trade/i })).toBeVisible();
  });
});

test.describe('Settings reset', () => {
  test('reset confirmation modal appears and resets state', async ({ page }) => {
    await page.goto('/settings');
    await page.getByRole('button', { name: 'Reset Simulation' }).click();
    await expect(page.getByText('Reset Simulation?')).toBeVisible();
    await page.getByRole('button', { name: 'Reset' }).click();
  });
});
