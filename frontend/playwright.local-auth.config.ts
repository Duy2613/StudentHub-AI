import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/community-expert-local-auth.spec.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 5 * 60 * 1000,
  expect: { timeout: 30_000 },
  retries: 0,
  reporter: "line",
  use: {
    baseURL: process.env.STUDENTHUB_LOCAL_E2E_BASE_URL || "http://127.0.0.1:3000",
    trace: "off",
    screenshot: "off",
    video: "off",
    actionTimeout: 30_000,
    navigationTimeout: 60_000,
  },
});
