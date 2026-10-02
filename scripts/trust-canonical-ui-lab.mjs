import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, symlinkSync, writeFileSync } from "node:fs";
import { execFileSync, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

// A credential-free mirror separates browser fixtures from production services.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "frontend");
const evidence = path.join(root, "artifacts", "visual", "TRUST_CANONICAL", "2026-10-02");
const lab = path.join(root, "artifacts", "lab", "trust-canonical", "frontend");
const action = process.argv[2] || "build";
const testFilter = process.argv[3];
mkdirSync(evidence, { recursive: true });
mkdirSync(lab, { recursive: true });

if (action === "build") {
  for (const name of ["src", "public", "tests"]) cpSync(path.join(source, name), path.join(lab, name), { recursive: true, preserveTimestamps: true });
  for (const entry of readdirSync(source, { withFileTypes: true })) {
    if (entry.isFile() && /^(package(-lock)?\.json|tsconfig\.json|next-env\.d\.ts|next\.config\.ts|postcss\.config\.mjs|eslint\.config\.mjs|playwright\.trust-v4\.config\.ts)$/.test(entry.name)) cpSync(path.join(source, entry.name), path.join(lab, entry.name), { preserveTimestamps: true });
  }
  const paths = ["frontend/src/components/trust/TrustMasterUltraJourney.jsx", "frontend/src/components/trust/TrustV4Workspace.jsx", "frontend/src/components/trust/TrustVsExpertComparisonMatrix.jsx", "frontend/src/components/trust/TrustCanonicalLayout.module.css", "frontend/src/components/trust/trust-v4.module.css", "frontend/tests/e2e/trust-v4-isolated.spec.ts", "frontend/tests/vnext_trust_contract.test.mjs", "scripts/trust-canonical-ui-lab.mjs"];
  const sourceHashes = Object.fromEntries(paths.map((file) => [file, createHash("sha256").update(readFileSync(path.join(root, file))).digest("hex")]));
  writeFileSync(path.join(evidence, "build-source.json"), JSON.stringify({ capturedAt: new Date().toISOString(), candidateBaseSha: execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim(), uncommittedPatch: true, patchFingerprintSha256: createHash("sha256").update(JSON.stringify(sourceHashes)).digest("hex"), sourceHashes, environment: "credential-free isolated production build; browser API fixtures; no production mutation" }, null, 2));
}
if (!existsSync(path.join(lab, "node_modules"))) symlinkSync(path.join(source, "node_modules"), path.join(lab, "node_modules"), "junction");
const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => /^(PATH|PATHEXT|SYSTEMROOT|WINDIR|COMSPEC|TEMP|TMP|USERPROFILE|APPDATA|LOCALAPPDATA|PROCESSOR_ARCHITECTURE|NUMBER_OF_PROCESSORS)$/i.test(key)));
Object.assign(env, {
  NODE_ENV: "production", NEXT_TELEMETRY_DISABLED: "1", STUDENTHUB_HERMETIC_TEST_MODE: "1",
  STUDENTHUB_NEXT_DIST_DIR: ".next-trust-canonical-lab", NEXT_PUBLIC_COMPETITION_DEMO: "false",
  NEXT_PUBLIC_STUDENTHUB_PROVIDER_MODE: "LIVE", TAVILY_MODE: "OFF", TAVILY_MAX_CALLS_PER_RUN: "0",
  FRIEND_TRUST_MODE: "DISABLED", TRUST_V4_BASE_URL: "http://127.0.0.1:3112", TRUST_V4_ARTIFACTS: evidence,
});
const commands = {
  build: ["node_modules/next/dist/bin/next", "build", "--webpack"],
  type: ["node_modules/typescript/bin/tsc", "--noEmit"],
  lint: ["node_modules/eslint/bin/eslint.js", "src/components/trust/TrustMasterUltraJourney.jsx", "src/components/trust/TrustV4Workspace.jsx", "tests/e2e/trust-v4-isolated.spec.ts"],
};
function run(args, logName) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, args, { cwd: lab, env, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
    let output = "";
    child.stdout.on("data", (chunk) => { output += chunk; process.stdout.write(chunk); });
    child.stderr.on("data", (chunk) => { output += chunk; process.stderr.write(chunk); });
    child.on("error", (error) => { output += error.code || "PROCESS_ERROR"; });
    child.on("close", (code) => { writeFileSync(path.join(evidence, logName), output); resolve(code ?? 1); });
  });
}
if (action === "browser" || action === "browser-all") {
  const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", "3112"], { cwd: lab, env, windowsHide: true, stdio: "ignore" });
  let ready = false;
  try {
    for (let attempt = 0; attempt < 60; attempt++) {
      if (server.exitCode !== null) break;
      try { const response = await fetch(env.TRUST_V4_BASE_URL + "/trust"); if (response.ok) { ready = true; break; } } catch { /* server startup */ }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    if (!ready) throw new Error("ISOLATED_SERVER_START_FAILED");
    for (const browserName of action === "browser-all" ? ["chromium", "firefox", "webkit"] : ["chromium"]) {
      env.TRUST_V4_ARTIFACTS = path.join(evidence, browserName);
      mkdirSync(env.TRUST_V4_ARTIFACTS, { recursive: true });
      const browserArgs = ["node_modules/@playwright/test/cli.js", "test", "--config=playwright.trust-v4.config.ts", `--browser=${browserName}`];
      if (testFilter) browserArgs.push("--grep", testFilter);
      const result = await run(browserArgs, `${browserName}/${testFilter ? "browser-filtered" : "browser"}.log`);
      if (result) { process.exitCode = result; break; }
    }
  } finally { server.kill(); }
} else {
  if (!commands[action]) throw new Error("UNKNOWN_LAB_ACTION");
  process.exitCode = await run(commands[action], `${action}.log`);
}
