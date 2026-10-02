import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  APPROVED_PRODUCTION_CA_SHA256,
  EXPECTED_PRODUCTION_PROJECT_REF,
  GovernanceTransportError,
  normalizeApprovedOperatorDatabaseUrl,
  prepareProductionDatabaseUrl,
  projectRefFromDatabaseUrl,
  projectRefFromSupabaseUrl,
  strictNodePgConnectionString,
  verifyProductionCaFile,
} from "../../../scripts/governance-bootstrap-transport.mjs";

const temporaryDirectories = [];
const productionRef = EXPECTED_PRODUCTION_PROJECT_REF;
const stagingRef = "bniwtkjtramqaozrrtrk";
const bootstrapScript = fileURLToPath(new URL("../../../scripts/bootstrap-governance-reviewer.mjs", import.meta.url));

afterEach(() => {
  while (temporaryDirectories.length) {
    rmSync(temporaryDirectories.pop(), { recursive: true, force: true });
  }
});

function tempDirectory() {
  const directory = mkdtempSync(path.join(tmpdir(), "studenthub-governance-transport-"));
  temporaryDirectories.push(directory);
  return directory;
}

describe("governance bootstrap production transport", () => {
  it("extracts production identity from direct and session-pooler database hosts", () => {
    assert.equal(
      projectRefFromDatabaseUrl(`postgresql://postgres:credential@db.${productionRef}.supabase.co:5432/postgres`),
      productionRef,
    );
    assert.equal(
      projectRefFromDatabaseUrl(`postgresql://postgres.${productionRef}:credential@aws-0-region.pooler.supabase.com:5432/postgres`),
      productionRef,
    );
    assert.equal(projectRefFromSupabaseUrl(`https://${productionRef}.supabase.co`), productionRef);
  });

  it("normalizes the approved transaction-pooler port to the backup workflow's session port", () => {
    const source = `postgresql://postgres.${productionRef}:credential@aws-0-region.pooler.supabase.com:6543/postgres`;
    const normalized = normalizeApprovedOperatorDatabaseUrl(source);
    assert.equal(new URL(normalized).port, "5432");
    assert.equal(projectRefFromDatabaseUrl(normalized), productionRef);
  });

  it("preserves explicit strict TLS options for node-postgres instead of URL overrides", () => {
    const source = `postgresql://postgres:credential@db.${productionRef}.supabase.co:5432/postgres?sslmode=verify-full&sslrootcert=C%3A%2Foperator%2Fprod-ca-2021.crt`;
    const normalized = new URL(strictNodePgConnectionString(source));
    assert.equal(normalized.searchParams.has("sslmode"), false);
    assert.equal(normalized.searchParams.has("sslrootcert"), false);
    assert.equal(normalized.searchParams.has("ssl"), false);
    assert.equal(projectRefFromDatabaseUrl(normalized.toString()), productionRef);
  });

  it("rejects staging and any noncanonical database or Auth project", () => {
    assert.throws(
      () => projectRefFromDatabaseUrl(`postgresql://postgres:credential@db.${stagingRef}.supabase.co:5432/postgres`),
      (error) => error instanceof GovernanceTransportError && error.code === "STAGING_DATABASE_REF_FORBIDDEN",
    );
    assert.throws(
      () => projectRefFromSupabaseUrl(`https://${stagingRef}.supabase.co`),
      (error) => error instanceof GovernanceTransportError && error.code === "STAGING_AUTH_REF_FORBIDDEN",
    );
    assert.throws(
      () => projectRefFromDatabaseUrl("postgresql://postgres:credential@localhost:5432/postgres"),
      (error) => error instanceof GovernanceTransportError && error.code === "DATABASE_PROJECT_REF_MISMATCH",
    );
  });

  it("rejects TLS downgrade settings before attempting a connection", () => {
    for (const sslmode of ["disable", "no-verify", "prefer", "allow"]) {
      assert.throws(
        () => prepareProductionDatabaseUrl(
          `postgresql://postgres:credential@db.${productionRef}.supabase.co:5432/postgres?sslmode=${sslmode}`,
          "unused-ca-path",
        ),
        (error) => error instanceof GovernanceTransportError && error.code === "DATABASE_SSLMODE_NOT_STRICT",
      );
    }
    assert.throws(
      () => prepareProductionDatabaseUrl(
        `postgresql://postgres:credential@db.${productionRef}.supabase.co:5432/postgres`,
        "",
      ),
      (error) => error instanceof GovernanceTransportError && error.code === "PRODUCTION_CA_PATH_REQUIRED",
    );
  });

  it("rejects a CA file that is not the exact verified production root certificate", () => {
    const caPath = path.join(tempDirectory(), "prod-ca-2021.crt");
    writeFileSync(caPath, "not-a-certificate", "utf8");
    assert.throws(
      () => verifyProductionCaFile(caPath),
      (error) => error instanceof GovernanceTransportError && error.code === "PRODUCTION_CA_CERTIFICATE_INVALID",
    );
    assert.match(APPROVED_PRODUCTION_CA_SHA256, /^[A-F0-9]{64}$/);
  });

  it("keeps hermetic processes from loading DATABASE_URL through the local env loader", () => {
    const directory = tempDirectory();
    const fakeFrontend = path.join(directory, "frontend");
    const envModule = path.join(fakeFrontend, "node_modules", "@next", "env");
    mkdirSync(envModule, { recursive: true });
    writeFileSync(path.join(fakeFrontend, "package.json"), JSON.stringify({ type: "commonjs" }));
    writeFileSync(path.join(envModule, "index.js"), [
      "exports.loadEnvConfig = () => {",
      "  process.env.__POOL_ENV_LOADER_USED = 'YES';",
      "  process.env.DATABASE_URL = 'postgresql://fixture.invalid/postgres';",
      "};",
    ].join("\n"));

    const poolPath = fileURLToPath(new URL("../../src/lib/server/database/PostgresPool.js", import.meta.url));
    const moduleUrl = pathToFileURL(poolPath).href;
    const probe = [
      `import { getPostgresPool } from ${JSON.stringify(moduleUrl)};`,
      "let result;",
      "try { const pool = getPostgresPool(); await pool.end(); result = 'POOL_CREATED'; }",
      "catch (error) { result = String(error.code || 'POOL_ERROR'); }",
      "console.log('RESULT=' + result);",
      "console.log('DATABASE_URL_PRESENT=' + (process.env.DATABASE_URL ? 'YES' : 'NO'));",
      "console.log('ENV_LOADER_CALLED=' + (process.env.__POOL_ENV_LOADER_USED || 'NO'));",
    ].join("\n");
    const childEnv = {
      PATH: process.env.PATH || "",
      SystemRoot: process.env.SystemRoot || "",
      DATABASE_URL: "",
      STUDENTHUB_HERMETIC_TEST_MODE: "1",
    };
    const run = spawnSync(process.execPath, ["--input-type=module", "-e", probe], {
      cwd: directory,
      env: childEnv,
      encoding: "utf8",
      timeout: 10_000,
    });

    assert.equal(run.status, 0, run.stderr);
    assert.match(run.stdout, /RESULT=DATABASE_UNAVAILABLE/);
    assert.match(run.stdout, /DATABASE_URL_PRESENT=NO/);
    assert.match(run.stdout, /ENV_LOADER_CALLED=NO/);
    assert.doesNotMatch(`${run.stdout}\n${run.stderr}`, /fixture\.invalid/);
  });

  it("preserves canonical .env.local loading for ordinary standalone pool callers", () => {
    const directory = tempDirectory();
    const frontendDirectory = path.join(directory, "frontend");
    mkdirSync(frontendDirectory, { recursive: true });
    writeFileSync(path.join(frontendDirectory, ".env.local"), "DATABASE_URL=postgresql://fixture:sentinel@localhost:5432/postgres\n", "utf8");

    const poolPath = fileURLToPath(new URL("../../src/lib/server/database/PostgresPool.js", import.meta.url));
    const moduleUrl = pathToFileURL(poolPath).href;
    const probe = [
      `import { getPostgresPool } from ${JSON.stringify(moduleUrl)};`,
      "let pool;",
      "try { pool = getPostgresPool(); console.log('RESULT=POOL_CREATED'); }",
      "catch (error) { console.log('RESULT=' + String(error.code || 'POOL_ERROR')); }",
      "console.log('DATABASE_URL_PRESENT=' + (process.env.DATABASE_URL ? 'YES' : 'NO'));",
      "console.log('DATABASE_URL_HOST=' + (process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).hostname : 'NONE'));",
      "if (pool) await pool.end();",
    ].join("\n");
    const childEnv = {
      PATH: process.env.PATH || "",
      SystemRoot: process.env.SystemRoot || "",
      DATABASE_URL: "",
      STUDENTHUB_HERMETIC_TEST_MODE: "",
    };
    const run = spawnSync(process.execPath, ["--input-type=module", "-e", probe], {
      cwd: directory,
      env: childEnv,
      encoding: "utf8",
      timeout: 10_000,
    });

    assert.equal(run.status, 0, run.stderr);
    assert.match(run.stdout, /RESULT=POOL_CREATED/);
    assert.match(run.stdout, /DATABASE_URL_PRESENT=YES/);
    assert.match(run.stdout, /DATABASE_URL_HOST=localhost/);
    assert.doesNotMatch(`${run.stdout}\n${run.stderr}`, /sentinel/);
  });

  it("does not load or print unrelated process secrets in transport preflight mode", () => {
    const directory = tempDirectory();
    const sentinel = "sentinel-secret-that-must-not-be-printed";
    const env = {
      PATH: process.env.PATH || "",
      SystemRoot: process.env.SystemRoot || "",
      DATABASE_URL: "",
      DATABASE_SSL_CA: sentinel,
      SUPABASE_SERVICE_ROLE_KEY: sentinel,
      GEMINI_API_KEY: sentinel,
      GOVERNANCE_BOOTSTRAP_OWNER_USER_ID: "",
      GOVERNANCE_BOOTSTRAP_REVIEWER_USER_ID: "",
    };
    const result = spawnSync(process.execPath, [bootstrapScript, "--transport-preflight-only"], {
      cwd: directory,
      env,
      encoding: "utf8",
      timeout: 10_000,
    });

    assert.equal(result.status, 1);
    assert.match(result.stderr, /"DATABASE_URL_PRESENT": "NO"/);
    assert.match(result.stderr, /"POSTGRES_CONNECTION": "FAIL"/);
    assert.doesNotMatch(`${result.stdout}\n${result.stderr}`, new RegExp(sentinel));

    const source = readFileSync(bootstrapScript, "utf8");
    assert.doesNotMatch(source, /canonicalEnv\.js|health\/readiness\.js/);
    assert.match(source, /getPostgresPool\(\{ loadEnv: false \}\)/);
  });
});
