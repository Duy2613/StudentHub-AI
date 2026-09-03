import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  // The Next.js development server compiles 100+ routes on demand. A single
  // browser worker keeps cross-browser results deterministic on local/CI hosts
  // instead of turning server saturation into false 30-second test failures.
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:3100",
    locale: "vi-VN",
    timezoneId: "Asia/Ho_Chi_Minh",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } },
    { name: "firefox", use: { ...devices["Desktop Firefox"], viewport: { width: 1280, height: 800 } } },
    { name: "webkit", use: { ...devices["Desktop Safari"], viewport: { width: 1280, height: 800 } } },
    { name: "mobile-chromium", testMatch: /(?:navigation|responsive)\.spec\.ts/, use: { ...devices["iPhone 13"], browserName: "chromium" } },
  ],
  webServer: {
    command: process.platform === "win32"
      ? "node ./node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3100"
      : "npm run dev -- --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100/trust",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
