// Playwright smoke specs against the editorial-rework UI.
// To run:
//   1. npx playwright install chromium
//   2. Set up .env.local with Supabase + Twelve Data keys
//   3. npm run dev (separate terminal)
//   4. npx playwright test
//
// Authenticated journeys (buy, sell, portfolio) are deferred — they need a
// pre-created test account. See docs/test-plan.md J1-J18 for the manual walk.

import { expect, test } from '@playwright/test';

test.describe('Landing page', () => {
  test('E-LANDING-001: hero shows wordmark, headline, and primary CTA', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByText(/Stockletter/)).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /Learn the market/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /Start with \$5,000/i }),
    ).toBeVisible();
  });

  test('E-LANDING-002: "What you can do" scope table is visible', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByText(/Buy & sell fractional shares/i)).toBeVisible();
    await expect(page.getByText(/See diversification & risk warnings/i)).toBeVisible();
  });

  test('E-LANDING-003: "What it isn\'t" excludes crypto/options/margin', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByText(/No crypto, options, margin/i)).toBeVisible();
    await expect(page.getByText(/No real money/i)).toBeVisible();
  });

  test('E-LANDING-004: clicking Sign in routes to /auth/login', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Sign in/i }).first().click();
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});

test.describe('Auth gate (proxy.ts)', () => {
  test('E-AUTH-005: /portfolio while unauthenticated → /auth/login?redirect', async ({
    page,
  }) => {
    await page.goto('/portfolio');
    await expect(page).toHaveURL(/\/auth\/login.*redirect=%2Fportfolio/);
  });

  test('/dashboard unauthenticated → /auth/login?redirect=%2Fdashboard', async ({
    page,
  }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/auth\/login.*redirect=%2Fdashboard/);
  });
});

test.describe('Login page', () => {
  test('E-AUTH-001: shows sign-in / create-account tabs and Field inputs', async ({
    page,
  }) => {
    await page.goto('/auth/login');
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create account' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
  });
});
