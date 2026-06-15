// Time-travel BUY E2E — covers PRD §17 acceptance criteria 1–5.
//
// Requires authentication + MOCK data mode. The current Playwright setup has
// no fixture for a pre-created test account (see smoke.spec.ts:8 — same
// constraint applies). Specs are marked .skip until auth tooling lands, but
// the assertions track the PRD verbatim so they're ready to enable.

import { expect, test } from '@playwright/test';

test.describe.skip('time-travel buy', () => {
  test('drag slider to a historical date and execute a BUY', async ({ page }) => {
    // Pre-condition: a logged-in user in MOCK data mode lands on /asset/AAPL.
    await page.goto('/asset/AAPL');

    // The slider mounts above the Quantity input with earliest ≈ today-10y.
    const slider = page.getByLabel(/time-travel slider for AAPL/i);
    await expect(slider).toBeVisible();

    // Drag the slider near the middle of the range (~2020 in the 10y window).
    const box = await slider.boundingBox();
    if (!box) throw new Error('slider has no bounding box');
    await page.mouse.move(box.x + box.width * 0.4, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.up();

    // Type a known date into the date input instead — more deterministic.
    const dateInput = page.getByLabel(/purchase date for AAPL/i);
    await dateInput.fill('2018-01-02');

    // The chip should show a historical price + FX.
    await expect(page.getByText(/Price on 2018-01-02/i)).toBeVisible();
    await expect(page.getByText(/FX on that date/i)).toBeVisible();

    // Quantity = 5, click Preview Buy.
    await page.getByLabel(/quantity/i).fill('5');
    await page.getByRole('button', { name: /preview buy/i }).click();

    // Confirmation modal shows the "Time-traveled" badge + purchase date.
    await expect(page.getByText('Time-traveled')).toBeVisible();
    await expect(page.getByText(/January 2, 2018/)).toBeVisible();

    // Confirm.
    await page.getByRole('button', { name: /confirm buy/i }).click();

    // Navigate to /portfolio.
    await page.goto('/portfolio');

    // Transactions table: row with badge + historical date as primary.
    await expect(page.getByText('Time-traveled').first()).toBeVisible();
    await expect(page.getByText(/January 2, 2018/)).toBeVisible();

    // Holdings table: "First bought" column reads the historical date.
    await expect(page.getByText(/First bought/i)).toBeVisible();
    await expect(page.getByText(/Jan 2, 2018/)).toBeVisible();
  });

  test('subsequent older buy moves firstPurchaseDate earlier', async ({ page }) => {
    // After the BUY above lands on 2018-01-02, buy again with slider set to
    // 2016-01-04 — holdings.firstPurchaseDate should move to the earlier date.
    await page.goto('/asset/AAPL');
    await page.getByLabel(/purchase date for AAPL/i).fill('2016-01-04');
    await page.getByLabel(/quantity/i).fill('1');
    await page.getByRole('button', { name: /preview buy/i }).click();
    await page.getByRole('button', { name: /confirm buy/i }).click();

    await page.goto('/portfolio');
    await expect(page.getByText(/Jan 4, 2016/)).toBeVisible();
  });
});
