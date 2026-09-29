import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "expert-v4-isolated-visual.spec.ts",
  timeout: 480_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3101",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    browserName: "chromium",
    viewport: { width: 1280, height: 960 },
    locale: "vi-VN",
    timezoneId: "Asia/Ho_Chi_Minh",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "node ./node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3101",
    url: "http://127.0.0.1:3101/trust",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_STUDENTHUB_PROVIDER_MODE: "LIVE",
      NEXT_PUBLIC_COMPETITION_DEMO: "false",
    },
  },
});
