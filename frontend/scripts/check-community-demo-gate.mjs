import { assertCommunityDemoModeAllowed } from "../src/lib/intelligence/community/communityDemoMode.js";

const productionBuild = process.argv.includes("--production-build");

try {
  const demoRequested = assertCommunityDemoModeAllowed({ productionBuild });
  process.stdout.write(`[DEMO_GATE_CHECK] PASS${demoRequested ? " (non-production demo mode)" : ""}\n`);
} catch (error) {
  process.stderr.write(`${error?.message || "[DEMO_GATE_CHECK] Community demo mode is not allowed."}\n`);
  process.exitCode = 1;
}
