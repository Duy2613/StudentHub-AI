import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.STUDENTHUB_STAGING_BASE_URL;
if (!baseURL) throw new Error("STAGING_E2E_BLOCKED_BY_ENV: STUDENTHUB_STAGING_BASE_URL is required");

export default defineConfig({
  testDir: "./tests/staging",
  timeout: 60_000,
  fullyParallel: false,
  forbidOnly: true,
  retries: 1,
  reporter: [["list"], ["html", { outputFolder: "playwright-report-staging", open: "never" }]],
  use: {
    baseURL,
    locale: "vi-VN",
    timezoneId: "Asia/Ho_Chi_Minh",
    storageState: process.env.STUDENTHUB_STAGING_STORAGE_STATE || undefined,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "staging-chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } },
  ],
});
