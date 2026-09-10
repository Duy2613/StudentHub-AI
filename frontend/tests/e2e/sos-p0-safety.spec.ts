import { test, expect } from '@playwright/test';

test.describe('SOS Emergency P0 Safety Guardrails', () => {
  test('Geolocation failure must transition strictly to LOCATION_UNAVAILABLE without fake coordinates', async ({ context, page }) => {
    // Deny geolocation permissions
    await context.clearPermissions();
    await page.goto('/sos');

    // Assert that the safety warning is rendered
    const warning = page.locator('text=VỊ TRÍ KHÔNG KHẢ DỤNG');
    await expect(warning).toBeVisible();

    // Verify zero simulated default coordinates in DOM
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('10.7769');
    expect(bodyText).not.toContain('106.7009');
    expect(bodyText).not.toContain('10.8524');
    expect(bodyText).not.toContain('106.7712');
    expect(bodyText).not.toContain('911'); // Foreign number banned
  });

  test('Canonical Vietnamese hotlines must be present with tel: protocols', async ({ page }) => {
    await page.goto('/sos');
    const policeCall = page.locator('a[href="tel:113"]');
    const ambulanceCall = page.locator('a[href="tel:115"]');

    await expect(policeCall).toBeVisible();
    await expect(ambulanceCall).toBeVisible();
  });
});
