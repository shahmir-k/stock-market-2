// Time-travel SELL E2E — covers PRD §17 acceptance criteria 7–9.
//
// Requires authentication + MOCK data mode + an existing AAPL holding bought
// on 2018-01-02 (set up by asset-time-travel.spec.ts). Marked .skip until
// auth tooling lands — see asset-time-travel.spec.ts for the rationale.

import { expect, test } from '@playwright/test';

test.describe.skip('time-travel sell — first-purchase gate', () => {
  test('slider before firstPurchaseDate clamps + disables Preview Sell', async ({ page }) => {
    // Pre-condition: AAPL holding with firstPurchaseDate = 2018-01-02.
    await page.goto('/asset/AAPL');

    // Switch to SELL tab.
    await page.getByRole('button', { name: 'Sell' }).click();

    // Try to set the slider date earlier than firstPurchaseDate.
    await page.getByLabel(/purchase date for AAPL/i).fill('2017-06-01');

    // Slider clamps the value back to firstPurchaseDate (2018-01-02) and
    // the inline reason message renders.
    await expect(
      page.getByText(/You didn't own AAPL before 2018-01-02/i),
    ).toBeVisible();

    // Fill quantity = 1.
    await page.getByLabel(/quantity/i).fill('1');

    // Preview Sell button is disabled because the historical chip lookup
    // fails (no data on that date OR clamp prevents valid preview).
    const previewSell = page.getByRole('button', { name: /preview sell/i });
    await expect(previewSell).toBeDisabled();
  });

  test('moving the slider to a valid sell date allows the preview', async ({ page }) => {
    await page.goto('/asset/AAPL');
    await page.getByRole('button', { name: 'Sell' }).click();

    // Slider date well after firstPurchaseDate.
    await page.getByLabel(/purchase date for AAPL/i).fill('2019-01-02');
    await page.getByLabel(/quantity/i).fill('1');

    // Preview chip renders + Preview Sell button is enabled.
    await expect(page.getByText(/Price on 2019-01-02/i)).toBeVisible();
    await page.getByRole('button', { name: /preview sell/i }).click();

    // Confirmation modal shows "Time-traveled" badge.
    await expect(page.getByText('Time-traveled')).toBeVisible();
    await expect(page.getByText(/January 2, 2019/)).toBeVisible();
  });
});
