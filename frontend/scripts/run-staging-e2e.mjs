import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

const required = ["STUDENTHUB_STAGING_BASE_URL", "STUDENTHUB_STAGING_CASES_PATH"];
const missing = required.filter((name) => !process.env[name]);
if (process.env.STUDENTHUB_STAGING_CASES_PATH && !existsSync(process.env.STUDENTHUB_STAGING_CASES_PATH)) {
  missing.push("STUDENTHUB_STAGING_CASES_PATH(file not found)");
}

if (missing.length) {
  console.error(`STAGING_E2E_BLOCKED_BY_ENV: missing ${missing.join(", ")}`);
  console.error("Provide a non-secret staging base URL and an external JSON case file. See frontend/tests/staging/README.md.");
  process.exit(2);
}

const forwarded = process.argv.slice(2);
const result = spawnSync(process.platform === "win32" ? "npx.cmd" : "npx", ["playwright", "test", "--config=playwright.staging.config.ts", ...forwarded], {
  cwd: process.cwd(),
  env: process.env,
  stdio: "inherit",
});
process.exit(result.status ?? 1);
