import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertStagingEnvironment,
  EnvironmentSafetyError,
  ENVIRONMENT_ERROR_CODE,
  inspectDatabaseTarget,
  PRODUCTION_SUPABASE_PROJECT_REF,
  STAGING_SUPABASE_PROJECT_REF,
  STAGING_SUPABASE_URL,
} from "../../src/lib/security/environment/stagingEnvironment.js";

const stagingDatabaseUrl = `postgresql://postgres.${STAGING_SUPABASE_PROJECT_REF}@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require`;
const productionDatabaseUrl = `postgresql://postgres.${PRODUCTION_SUPABASE_PROJECT_REF}@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require`;

describe("environment target safety", () => {
  it("accepts only the canonical staging Supabase and database refs", () => {
    const result = assertStagingEnvironment({
      env: {
        NEXT_PUBLIC_SUPABASE_URL: STAGING_SUPABASE_URL,
        DATABASE_URL: stagingDatabaseUrl,
        STUDENTHUB_LIVE_STAGING_TESTS: "1",
      },
      databaseEnvNames: ["DATABASE_URL"],
      requireDatabase: true,
      requireLiveOptIn: true,
      command: "test fixture",
    });

    assert.equal(result.supabaseProjectRef, STAGING_SUPABASE_PROJECT_REF);
    assert.equal(result.databases[0].projectRef, STAGING_SUPABASE_PROJECT_REF);
    assert.equal(result.databases[0].host, "aws-0-ap-northeast-1.pooler.supabase.com");
  });

  it("rejects production before a connection can be created", () => {
    assert.throws(
      () => assertStagingEnvironment({
        env: {
          NEXT_PUBLIC_SUPABASE_URL: `https://${PRODUCTION_SUPABASE_PROJECT_REF}.supabase.co`,
          DATABASE_URL: productionDatabaseUrl,
          STUDENTHUB_LIVE_STAGING_TESTS: "1",
        },
        databaseEnvNames: ["DATABASE_URL"],
        requireDatabase: true,
        requireLiveOptIn: true,
        command: "test fixture",
      }),
      (error) => error instanceof EnvironmentSafetyError
        && error.code === ENVIRONMENT_ERROR_CODE.REFUSING_PRODUCTION_DATABASE_IN_STAGING_TEST,
    );
  });

  it("rejects a production database even when the public Supabase URL says staging", () => {
    assert.throws(
      () => assertStagingEnvironment({
        env: {
          NEXT_PUBLIC_SUPABASE_URL: STAGING_SUPABASE_URL,
          DATABASE_URL: productionDatabaseUrl,
          STUDENTHUB_LIVE_STAGING_TESTS: "1",
        },
        databaseEnvNames: ["DATABASE_URL"],
        requireDatabase: true,
        requireLiveOptIn: true,
        command: "test fixture",
      }),
      (error) => error.code === ENVIRONMENT_ERROR_CODE.REFUSING_PRODUCTION_DATABASE_IN_STAGING_TEST,
    );
  });

  it("fails closed for missing database metadata and missing live opt-in", () => {
    assert.throws(
      () => assertStagingEnvironment({
        env: { NEXT_PUBLIC_SUPABASE_URL: STAGING_SUPABASE_URL },
        databaseEnvNames: ["DATABASE_URL"],
        requireDatabase: true,
        requireLiveOptIn: true,
        command: "test fixture",
      }),
      (error) => error.code === ENVIRONMENT_ERROR_CODE.STAGING_LIVE_OPT_IN_REQUIRED,
    );

    assert.throws(
      () => assertStagingEnvironment({
        env: {
          NEXT_PUBLIC_SUPABASE_URL: STAGING_SUPABASE_URL,
          STUDENTHUB_LIVE_STAGING_TESTS: "1",
        },
        databaseEnvNames: ["DATABASE_URL"],
        requireDatabase: true,
        requireLiveOptIn: true,
        command: "test fixture",
      }),
      (error) => error.code === ENVIRONMENT_ERROR_CODE.STAGING_DATABASE_URL_REQUIRED,
    );
  });

  it("never returns a database password in safe metadata", () => {
    const inspected = inspectDatabaseTarget(
      `postgresql://runner:secret-password@${STAGING_SUPABASE_PROJECT_REF}.db.supabase.co:5432/postgres`,
    );
    assert.equal(inspected.projectRef, STAGING_SUPABASE_PROJECT_REF);
    assert.equal(inspected.host, `${STAGING_SUPABASE_PROJECT_REF}.db.supabase.co`);
    assert.doesNotMatch(JSON.stringify(inspected), /secret-password/);
  });
});
