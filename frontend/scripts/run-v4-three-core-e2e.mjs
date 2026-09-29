import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, symlinkSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const sourceProjectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = resolve(sourceProjectRoot, "..");

const allowedEnvironment = /^(PATH|PATHEXT|SYSTEMROOT|WINDIR|COMSPEC|TEMP|TMP|USERPROFILE|APPDATA|LOCALAPPDATA|PROCESSOR_ARCHITECTURE|NUMBER_OF_PROCESSORS)$/i;
const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => allowedEnvironment.test(key)));
const runId = `${new Date().toISOString().replace(/[:.]/g, "-")}-${process.pid}`;
const runRoot = resolve(repositoryRoot, "artifacts/lab/full-web-v4", runId);
const projectRoot = join(runRoot, "frontend");
const distDir = ".next-v4-three-core-e2e";
const outputDir = join(runRoot, "playwright-results");
const playwrightArgs = process.argv.slice(2);

mkdirSync(runRoot, { recursive: true });
cpSync(sourceProjectRoot, projectRoot, {
  recursive: true,
  filter(source) {
    if (source === sourceProjectRoot) return true;
    const relativePath = relative(sourceProjectRoot, source);
    const segments = relativePath.split(sep);
    const name = basename(source);
    return !segments.some((segment) => segment === "node_modules" || segment === "public" || segment === "test-results" || segment === "playwright-report" || segment === "coverage" || segment === "artifacts" || segment.startsWith(".next"))
      && !name.startsWith(".env");
  },
});

const sourceNodeModules = join(sourceProjectRoot, "node_modules");
const sourcePublic = join(sourceProjectRoot, "public");
if (!existsSync(sourceNodeModules) || !existsSync(sourcePublic)) {
  throw new Error("Full-web E2E needs the existing frontend node_modules and public directory.");
}
symlinkSync(sourceNodeModules, join(projectRoot, "node_modules"), "junction");
symlinkSync(sourcePublic, join(projectRoot, "public"), "junction");
const sourceDemoGate = join(repositoryRoot, "scripts", "check-community-demo-gate.mjs");
const isolatedDemoGate = join(runRoot, "scripts", "check-community-demo-gate.mjs");
mkdirSync(dirname(isolatedDemoGate), { recursive: true });
cpSync(sourceDemoGate, isolatedDemoGate);

Object.assign(env, {
  NODE_ENV: "production",
  NEXT_TELEMETRY_DISABLED: "1",
  NEXT_PUBLIC_COMPETITION_DEMO: "false",
  STUDENTHUB_HERMETIC_TEST_MODE: "1",
  STUDENTHUB_NEXT_DIST_DIR: distDir,
  TRUST_V4_BASE_URL: "http://127.0.0.1:3114",
  TRUST_V4_ARTIFACTS: join(runRoot, "trust"),
  COMMUNITY_V4_ARTIFACTS: join(runRoot, "community"),
  EXPERT_V4_ARTIFACTS: join(runRoot, "expert"),
  OMNI_V4_ARTIFACTS: join(runRoot, "omni"),
  FULL_WEB_V4_ARTIFACTS: join(runRoot, "release-smoke"),
  PLAYWRIGHT_OUTPUT_DIR: outputDir,
  PLAYWRIGHT_JSON_REPORT: join(runRoot, "playwright-results.json"),
});

const manifestPath = join(runRoot, "run-manifest.json");
const manifest = {
  runId,
  classification: "LOCAL_ISOLATED copied frontend without env files; parent environment scrubbed; deterministic browser fixtures; no live database/provider assurance",
  distDir,
  playwrightArgs,
  isolatedWorkspace: projectRoot,
  browserBaseURL: env.TRUST_V4_BASE_URL,
  startedAt: new Date().toISOString(),
  status: "RUNNING",
};
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

function run(label, args) {
  process.stdout.write(`\n[V4 THREE-CORE E2E] ${label}\n`);
  const result = spawnSync(process.execPath, args, { cwd: projectRoot, env, stdio: "inherit", windowsHide: true });
  if (result.error) process.stderr.write(`${result.error.message}\n`);
  return result.status ?? 1;
}

const steps = [
  ["production demo fail-closed gate", ["../scripts/check-community-demo-gate.mjs", "--production-build"]],
  ["isolated production webpack build", ["./node_modules/next/dist/bin/next", "build", "--webpack"]],
  ["Chromium / Firefox / WebKit three-core regression", ["./node_modules/@playwright/test/cli.js", "test", "--config=playwright.v4-three-core.config.ts", ...playwrightArgs]],
];

let exitCode = 0;
for (const [label, args] of steps) {
  exitCode = run(label, args);
  if (exitCode !== 0) break;
}

manifest.status = exitCode === 0 ? "PASS" : "FAIL";
manifest.finishedAt = new Date().toISOString();
manifest.exitCode = exitCode;
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
process.exit(exitCode);
