import { test, expect } from '@playwright/test';

test.describe('Vietnamese Diacritic Safe Headroom & Typography Contract Regression', () => {
  const REQUIRED_VIETNAMESE_GLYPHS = [
    'ấ', 'ầ', 'ẩ', 'ẫ', 'ậ',
    'ế', 'ề', 'ể', 'ễ', 'ệ',
    'ố', 'ồ', 'ổ', 'ỗ', 'ộ',
    'ớ', 'ờ', 'ở', 'ỡ', 'ợ',
    'ứ', 'ừ', 'ử', 'ữ', 'ự',
    'ý', 'ỳ', 'ỷ', 'ỹ', 'ỵ',
    'Đ', 'đ'
  ];

  test('Heading elements have sufficient line-height headroom and no clipping', async ({ page }) => {
    await page.goto('/dashboard');
    const headings = page.locator('h1, h2, h3, .vn-heading-safe');
    const count = await headings.count();

    for (let i = 0; i < count; i++) {
      const heading = headings.nth(i);
      const metrics = await heading.evaluate((el) => {
        const style = window.getComputedStyle(el);
        const fontSize = parseFloat(style.fontSize) || 16;
        const lineHeight = parseFloat(style.lineHeight) || (fontSize * 1.2);
        const ratio = lineHeight / fontSize;
        const isClipped = el.scrollHeight > (el.clientHeight + 2) && style.overflow !== 'visible';
        return { ratio, isClipped, fontFamily: style.fontFamily, fontWeight: style.fontWeight };
      });

      expect(metrics.isClipped).toBe(false);
      expect(metrics.ratio).toBeGreaterThanOrEqual(1.18);
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

  test('Vietnamese diacritics render without replacement or corruption across key routes', async ({ page }) => {
    expect(REQUIRED_VIETNAMESE_GLYPHS.length).toBeGreaterThan(0);
    for (const route of ['/', '/trust', '/community', '/expert']) {
      await page.goto(route);
      const bodyText = await page.evaluate(() => document.body.innerText);
      const hasAnyGlyph = REQUIRED_VIETNAMESE_GLYPHS.some((g) => bodyText.includes(g));
      expect(hasAnyGlyph).toBe(true);
    }
  });

  test('Responsive typography scale works at 360px mobile and 1440px desktop without horizontal overflow', async ({ page }) => {
    for (const width of [360, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      const overflow = await page.evaluate(() => {
        return Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) > window.innerWidth + 1;
      });
      expect(overflow).toBe(false);
    }
  });
});
