import assert from "node:assert/strict";
import test from "node:test";
import {
  APPROVED_STAGING_PROJECT_REF,
  DISPOSABLE_DB_ACK,
  EXPERT_STAGING_RUN_FLAG,
  EXPERT_STAGING_WRITE_ACK,
  getApprovedExpertStagingDatabaseUrl,
  getDisposableDatabaseUrl,
} from "../helpers/disposableDbGuard.mjs";

const envKeys = [
  EXPERT_STAGING_RUN_FLAG,
  "STUDENTHUB_EXPERT_STAGING_WRITE_ACK",
  "STUDENTHUB_EXPERT_STAGING_DATABASE_URL",
  "STUDENTHUB_DISPOSABLE_DB_ACK",
  "STUDENTHUB_RLS_TEST_DATABASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
];

function withEnvironment(values, run) {
  const previous = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));
  for (const key of envKeys) delete process.env[key];
  Object.assign(process.env, values);
  try {
    run();
  } finally {
    for (const key of envKeys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
}

const stagingUrl = `postgresql://postgres.${APPROVED_STAGING_PROJECT_REF}:synthetic-test-password@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres`;

test("Expert staging guard accepts only the acknowledged allowlisted Supabase identity", () => {
  withEnvironment({
    [EXPERT_STAGING_RUN_FLAG]: "1",
    STUDENTHUB_EXPERT_STAGING_WRITE_ACK: EXPERT_STAGING_WRITE_ACK,
    STUDENTHUB_EXPERT_STAGING_DATABASE_URL: stagingUrl,
    NEXT_PUBLIC_SUPABASE_URL: `https://${APPROVED_STAGING_PROJECT_REF}.supabase.co`,
  }, () => {
    assert.equal(getApprovedExpertStagingDatabaseUrl(), stagingUrl);
  });
});

test("Expert staging guard rejects absent acknowledgement, Main, unknown ref, and API/DB disagreement", () => {
  const shared = {
    [EXPERT_STAGING_RUN_FLAG]: "1",
    STUDENTHUB_EXPERT_STAGING_WRITE_ACK: EXPERT_STAGING_WRITE_ACK,
    STUDENTHUB_EXPERT_STAGING_DATABASE_URL: stagingUrl,
    NEXT_PUBLIC_SUPABASE_URL: `https://${APPROVED_STAGING_PROJECT_REF}.supabase.co`,
  };

  withEnvironment({ ...shared, STUDENTHUB_EXPERT_STAGING_WRITE_ACK: "" }, () => {
    assert.equal(getApprovedExpertStagingDatabaseUrl(), null);
  });
  withEnvironment({
    ...shared,
    STUDENTHUB_EXPERT_STAGING_DATABASE_URL: "postgresql://postgres.main-ref@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres",
  }, () => assert.equal(getApprovedExpertStagingDatabaseUrl(), null));
  withEnvironment({
    ...shared,
    STUDENTHUB_EXPERT_STAGING_DATABASE_URL: "postgresql://tester:password@db.unknownproject.supabase.co:5432/postgres",
  }, () => assert.equal(getApprovedExpertStagingDatabaseUrl(), null));
  withEnvironment({
    ...shared,
    NEXT_PUBLIC_SUPABASE_URL: "https://differentproject.supabase.co",
  }, () => assert.equal(getApprovedExpertStagingDatabaseUrl(), null));
  withEnvironment({
    ...shared,
    [EXPERT_STAGING_RUN_FLAG]: "0",
  }, () => assert.equal(getApprovedExpertStagingDatabaseUrl(), null));
});

test("generic disposable DB guard accepts loopback only and never an implicit remote DATABASE_URL", () => {
  withEnvironment({
    STUDENTHUB_DISPOSABLE_DB_ACK: DISPOSABLE_DB_ACK,
    STUDENTHUB_RLS_TEST_DATABASE_URL: "postgresql://tester:password@127.0.0.1:5432/test_db",
  }, () => assert.equal(getDisposableDatabaseUrl(), process.env.STUDENTHUB_RLS_TEST_DATABASE_URL));

  withEnvironment({
    STUDENTHUB_DISPOSABLE_DB_ACK: DISPOSABLE_DB_ACK,
    STUDENTHUB_RLS_TEST_DATABASE_URL: "postgresql://tester:password@db.kytdomflmjytzyaabogi.supabase.co:5432/postgres",
  }, () => assert.equal(getDisposableDatabaseUrl(), null));

  withEnvironment({}, () => {
    assert.equal(getDisposableDatabaseUrl(), null);
  });
});
