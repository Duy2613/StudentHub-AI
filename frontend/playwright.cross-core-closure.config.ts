import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'trust-v4-isolated.spec.ts',
  timeout: 180_000,
  workers: 1,
  reporter: 'line',
  expect: { timeout: 15_000 },
  use: {
    baseURL: 'http://127.0.0.1:3116',
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'], viewport: { width: 1440, height: 1000 } } },
  ],
});
