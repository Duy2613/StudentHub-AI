import { spawnSync } from "node:child_process";

const required = [
  "STUDENTHUB_LABBE_BASE_URL",
  "STUDENTHUB_LABBE_TOKEN",
  "STUDENTHUB_LABBE_SCOPE",
  "STUDENTHUB_LABBE_TEST_DATABASE_URL",
];
const missing = required.filter((name) => !process.env[name]);
const modeError = process.env.STUDENTHUB_LABBE_MODE !== "STAGING"
  ? "STUDENTHUB_LABBE_MODE must be exactly STAGING"
  : null;

if (missing.length || modeError) {
  const reasons = [
    ...(missing.length ? [`missing ${missing.join(", ")}`] : []),
    ...(modeError ? [modeError] : []),
  ];
  console.error(`LABBE_STAGING_BLOCKED_BY_ENV: ${reasons.join("; ")}`);
  console.error("No remote call, database write, migration, deployment, or production action was attempted.");
  process.exit(2);
}

const result = spawnSync(process.execPath, ["--test", "frontend/tests/integrations/labbe_staging_live_gate.test.mjs"], {
  cwd: process.cwd(),
  env: process.env,
  stdio: "inherit",
  windowsHide: true,
});
process.exit(result.status ?? 1);
