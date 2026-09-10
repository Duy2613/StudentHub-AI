import { test, expect } from '@playwright/test';

const BANNED_NAV_HREFS = [
  '/marketplace',
  '/cases',
  '/quests',
  '/ultra',
  '/scam-check',
  '/forum',
  '/prof-rating',
  '/contract-check',
];

test.describe('F00 Scope Enforcement — Navigation Non-Exposure', () => {
  test('Primary desktop header must not expose banned F00 routes', async ({ page }) => {
    await page.goto('/dashboard');
    const nav = page.locator('header nav');
    await expect(nav).toBeVisible();
    for (const href of BANNED_NAV_HREFS) {
      const link = nav.locator(`a[href="${href}"]`);
      await expect(link).toHaveCount(0);
    }
  });

  test('Mobile navigation rail must not expose banned F00 routes', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    const mobileNav = page.locator('nav[aria-label="Điều hướng di động"]');
    await expect(mobileNav).toBeVisible();
    for (const href of BANNED_NAV_HREFS) {
      const link = mobileNav.locator(`a[href="${href}"]`);
      await expect(link).toHaveCount(0);
    }
  });

  test('Legacy redirects must forward to canonical active hosts', async ({ page }) => {
    await page.goto('/scam-check');
    await expect(page).toHaveURL(/\/trust/);

    await page.goto('/forum');
    await expect(page).toHaveURL(/\/community/);

    await page.goto('/prof-rating');
    await expect(page).toHaveURL(/\/academic/);

    await page.goto('/contract-check');
    await expect(page).toHaveURL(/\/trust\?tab=contract/);
  });
});
