import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e', testMatch: 'trust-v4-isolated.spec.ts', timeout: 240000, workers: 1,
  reporter: 'list', expect: { timeout: 15000 },
  use: { baseURL: 'http://127.0.0.1:3112', browserName: 'chromium', viewport: { width: 1440, height: 1000 }, locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh', serviceWorkers: 'block', trace: 'retain-on-failure' },
});
