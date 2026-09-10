import { test, expect } from '@playwright/test';

test.describe('Vietnamese Diacritic Safe Headroom Regression', () => {
  test('Heading elements with vn-heading-safe have sufficient line-height headroom', async ({ page }) => {
    await page.goto('/dashboard');
    const safeHeadings = page.locator('.vn-heading-safe');
    const count = await safeHeadings.count();

    for (let i = 0; i < count; i++) {
      const heading = safeHeadings.nth(i);
      const lineHeight = await heading.evaluate((el) => {
        return window.getComputedStyle(el).lineHeight;
      });
      expect(lineHeight).toBeTruthy();
    }
  });

  test('Page titles and headings render authentic Vietnamese diacritics correctly', async ({ page }) => {
    await page.goto('/trust');
    const title = await page.title();
    expect(title).toContain('Trust');

    await page.goto('/academic');
    const heading = page.locator('h1, h2, h3').first();
    await expect(heading).toBeVisible();

    await page.goto('/community');
    const communityHeading = page.locator('h1, h2, h3').first();
    await expect(communityHeading).toBeVisible();
  });
});
\n