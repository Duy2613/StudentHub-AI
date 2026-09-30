import { test, expect } from '@playwright/test';

const BANNED_NAV_HREFS = [
  '/dashboard',
  '/learn',
  '/scholarships',
  '/tuition-radar',
  '/safety-map',
  '/sos',
  '/marketplace',
  '/cases',
  '/quests',
  '/ultra',
  '/scam-check',
  '/forum',
  '/prof-rating',
];

test.describe('F00 Scope Enforcement — Navigation Non-Exposure', () => {
  test('Primary desktop header must not expose banned F00 routes', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator('header nav');
    await expect(nav).toBeVisible();
    for (const href of BANNED_NAV_HREFS) {
      const link = nav.locator(`a[href="${href}"]`);
      await expect(link).toHaveCount(0);
    }
  });

  test('Mobile navigation rail must not expose banned F00 routes', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Mở menu điều hướng' }).click();
    const mobileNav = page.getByRole('dialog', { name: 'Menu điều hướng di động' });
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

    const removedDashboard = await page.goto('/dashboard');
    expect(removedDashboard?.status()).toBe(404);

    const removedProfileAlias = await page.goto('/prof-rating');
    expect(removedProfileAlias?.status()).toBe(404);

  });
});
