import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

const baseURL = "http://127.0.0.1:3114";
const distDir = process.env.STUDENTHUB_NEXT_DIST_DIR || ".next-v4-three-core-e2e";
const auditRunId = process.env.STUDENTHUB_E2E_RUN_ID || new Date().toISOString().replace(/[^0-9TZ]/g, "");
const auditArtifactRoot = path.resolve(process.cwd(), "../artifacts/visual", `full-system-audit-${auditRunId}`);
const outputDir = process.env.PLAYWRIGHT_OUTPUT_DIR || `./test-results/v4-three-core-e2e-${auditRunId}`;
const jsonReport = process.env.PLAYWRIGHT_JSON_REPORT || `${outputDir}/results.json`;

// Screenshot suites require explicit artifact paths. Give each audit run its own
// directory so browser reruns cannot overwrite prior review evidence.
process.env.OMNI_V4_ARTIFACTS ||= path.join(auditArtifactRoot, "ai-omni");
process.env.TRUST_V4_ARTIFACTS ||= path.join(auditArtifactRoot, "trust");
process.env.EXPERT_V4_ARTIFACTS ||= path.join(auditArtifactRoot, "expert");
process.env.COMMUNITY_V4_ARTIFACTS ||= path.join(auditArtifactRoot, "community");

process.env.TRUST_V4_BASE_URL ||= baseURL;

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: [
    "trust-v4-isolated.spec.ts",
    "community-v4-2.spec.ts",
    "expert-v4-isolated-visual.spec.ts",
    "ai-omni-v4-isolated.spec.ts",
    "full-web-v4-release-smoke.spec.ts",
  ],
  timeout: 480_000,
  expect: { timeout: 15_000 },
  workers: 1,
  fullyParallel: false,
  reporter: [["list"], ["json", { outputFile: jsonReport }]],
  outputDir,
  use: {
    baseURL,
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    locale: "vi-VN",
    timezoneId: "Asia/Ho_Chi_Minh",
    serviceWorkers: "block",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"], browserName: "chromium", viewport: { width: 1440, height: 1000 } } },
    { name: "firefox", use: { ...devices["Desktop Firefox"], browserName: "firefox", viewport: { width: 1440, height: 1000 } } },
    { name: "webkit", use: { ...devices["Desktop Safari"], browserName: "webkit", viewport: { width: 1440, height: 1000 } } },
  ],
  webServer: {
    command: "node ./node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3114",
    url: `${baseURL}/trust`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      NODE_ENV: "production",
      NEXT_TELEMETRY_DISABLED: "1",
      STUDENTHUB_HERMETIC_TEST_MODE: "1",
      STUDENTHUB_NEXT_DIST_DIR: distDir,
      TRUST_V4_BASE_URL: baseURL,
    },
  },
});
