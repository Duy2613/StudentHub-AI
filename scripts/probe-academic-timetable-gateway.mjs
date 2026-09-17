import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const rootDir = resolve(process.cwd());
const frontendDir = join(rootDir, "frontend");
const req = createRequire(join(frontendDir, "package.json"));

try {
  const { loadEnvConfig } = req("@next/env");
  loadEnvConfig(frontendDir);
} catch (e) {}

const pg = req("pg");
const { Pool } = pg;
const caRaw = process.env.DATABASE_SSL_CA;
const ca = caRaw ? caRaw.replace(/^["']|["']$/g, "").replace(/\\n/g, "\n") : undefined;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false, ...(ca ? { ca } : {}) },
});

const extractorModule = await import(
  pathToFileURL(join(frontendDir, "src/lib/server/academic/TimetableVisionExtractor.js")).href
);
const { TimetableVisionExtractor } = extractorModule;

const ONE_PIXEL_PNG_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

async function main() {
  const client = await pool.connect();
  try {
    console.log("=== EXECUTING REAL MULTIMODAL PROBE THROUGH PRODUCTION GATEWAY ===");

    // 1. Check DB row count before
    const countBeforeRes = await client.query("SELECT count(*)::int as count FROM public.user_timetables");
    const rowsBefore = countBeforeRes.rows[0].count;
    console.log(`TIMETABLE_ROWS_BEFORE: ${rowsBefore}`);

    // 2. Run real multimodal extraction probe
    const extractor = new TimetableVisionExtractor();
    const probeStart = Date.now();
    const result = await extractor.extract({
      bytes: Buffer.from(ONE_PIXEL_PNG_BASE64, "base64"),
      mimeType: "image/png",
      requestId: `probe-academic-${Date.now()}`,
    });
    const probeTotalDuration = Date.now() - probeStart;

    // 3. Check DB row count after
    const countAfterRes = await client.query("SELECT count(*)::int as count FROM public.user_timetables");
    const rowsAfter = countAfterRes.rows[0].count;
    console.log(`TIMETABLE_ROWS_AFTER_IMPORT: ${rowsAfter}`);
    console.log(`DB_DELTA: ${rowsAfter - rowsBefore}`);

    console.log("\n--- EXTRACTION RESULT ---");
    console.log(`importState: ${result.importState}`);
    console.log(`provider: ${result.provider}`);
    console.log(`model: ${result.model}`);
    console.log(`durationMs: ${result.durationMs}`);
    console.log(`attemptCount: ${result.attemptCount}`);
    console.log(`fallbackUsed: ${result.fallbackUsed}`);
    console.log(`failureCode: ${result.failureCode || "NONE"}`);
    console.log(`sourcePersisted: ${result.sourcePersisted}`);

    console.log("\n--- ATTEMPTS TELEMETRY ---");
    if (result.attempts && result.attempts.length) {
      result.attempts.forEach((att, idx) => {
        console.log(`ATTEMPT_${idx + 1}_MODEL: ${att.model}`);
        console.log(`ATTEMPT_${idx + 1}_STATUS: ${att.result || att.httpStatus}`);
        console.log(`ATTEMPT_${idx + 1}_DURATION: ${att.durationMs}ms`);
      });
    } else {
      console.log("No attempt telemetry recorded.");
    }

    console.log(`\nEXECUTED_MODEL: ${result.model || "NONE"}`);
    console.log(`STRUCTURED_DRAFT_VALID: ${result.draft ? "YES" : "NO"}`);
    console.log(`MANUAL_FALLBACK: ${result.importState === "MANUAL_FALLBACK" ? "PASS" : "FAIL"}`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("PROBE_ERROR:", err);
  process.exit(1);
});
