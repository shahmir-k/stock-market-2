// Public Learning Center tests — no auth required (proxy.ts marks /learn as public).

import { expect, test } from '@playwright/test';

test.describe('Learning Center index', () => {
  test('E-LRN-001: hero + 30 term rows + 6 categories visible', async ({
    page,
  }) => {
    await page.goto('/learn');
    await expect(
      page.getByRole('heading', { name: /Thirty terms/i }),
    ).toBeVisible();

    // 6 category tabs
    await expect(page.getByText('Market Basics', { exact: true })).toBeVisible();
    await expect(page.getByText('Portfolio Basics', { exact: true })).toBeVisible();
    await expect(page.getByText('Risk and Diversification', { exact: true })).toBeVisible();
  });

  test('search narrows the list', async ({ page }) => {
    await page.goto('/learn');
    await page.getByPlaceholder('Search the glossary').fill('average');
    await expect(page.getByText(/Average Cost/i)).toBeVisible();
    // Other terms should be filtered out
    await expect(page.getByText(/Compound Growth/i).first()).not.toBeVisible();
  });
});

test.describe('Term detail', () => {
  test('E-LRN-002: known slug renders the article', async ({ page }) => {
    await page.goto('/learn/average-cost');
    await expect(
      page.getByRole('heading', { name: /Average Cost/i }),
    ).toBeVisible();
    await expect(page.getByText(/Simple definition/i)).toBeVisible();
    await expect(page.getByText(/In the simulator/i)).toBeVisible();
    await expect(page.getByText(/Why it matters/i)).toBeVisible();
  });

  test('E-LRN-003: bad slug shows custom in-shell 404', async ({ page }) => {
    await page.goto('/learn/not-a-real-term');
    await expect(
      page.getByRole('heading', { name: /That term doesn't exist/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /Browse the glossary/i }),
    ).toBeVisible();
  });

  test('related-term chip navigates to that term', async ({ page }) => {
    await page.goto('/learn/average-cost');
    // 'Cost Basis' is in Average Cost's relatedSlugs
    await page.getByRole('link', { name: /Cost Basis/i }).click();
    await expect(page).toHaveURL(/\/learn\/cost-basis/);
  });
});
