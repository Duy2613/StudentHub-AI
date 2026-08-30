import { readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { spawnSync } from "node:child_process";

const root = join(process.cwd(), "frontend", "tests");

function collect(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const target = join(dir, entry.name);
    if (entry.isDirectory()) return collect(target);
    return entry.isFile() && entry.name.endsWith(".test.mjs") ? [target] : [];
  });
}

const tests = collect(root).sort();
if (!tests.length) {
  console.error("[QUALITY_GATE] No test files discovered.");
  process.exit(1);
}

let passed = 0;
for (const test of tests) {
  const label = relative(process.cwd(), test);
  const result = spawnSync(process.execPath, [test], { stdio: "inherit", env: process.env });
  if (result.status !== 0) {
    console.error(`\n[QUALITY_GATE] FAILED: ${label}`);
    process.exit(result.status || 1);
  }
  passed += 1;
}

console.log(`\n[QUALITY_GATE] PASS: ${passed}/${tests.length} discovered test files`);
