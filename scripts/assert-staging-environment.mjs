import {
  assertStagingEnvironment,
  EnvironmentSafetyError,
} from "../frontend/src/lib/security/environment/stagingEnvironment.js";

const requireDatabase = process.argv.includes("--require-database");
const requireLiveOptIn = process.argv.includes("--require-live-opt-in");

try {
  const result = assertStagingEnvironment({
    requireDatabase,
    requireLiveOptIn,
    command: "staging environment guard",
  });
  const databaseSummary = result.databases.length
    ? result.databases.map(({ name, host, port, projectRef }) => `${name}=${host}:${port || "default"}/${projectRef}`).join(", ")
    : "none";
  console.log(`[ENV_GUARD] PASS: supabase=${result.supabaseProjectRef}; databases=${databaseSummary}`);
} catch (error) {
  if (error instanceof EnvironmentSafetyError) {
    console.error(`[ENV_GUARD] BLOCKED: ${error.code}: ${error.message}`);
  } else {
    console.error("[ENV_GUARD] BLOCKED: environment inspection failed closed.");
  }
  process.exit(2);
}
