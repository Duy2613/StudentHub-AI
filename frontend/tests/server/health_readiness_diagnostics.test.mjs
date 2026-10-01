import assert from "node:assert/strict";
import test from "node:test";

import { classifyDatabaseFailure, getBackendIdentity } from "../../src/lib/server/health/readiness.js";

test("database readiness exposes only bounded failure categories", () => {
  const authError = new Error("password=must-never-be-returned");
  authError.code = "28P01";
  const connectionError = new Error("private-host-and-connection-data");
  connectionError.code = "ETIMEDOUT";
  const tlsError = new Error("certificate detail must stay private");
  tlsError.code = "ERR_TLS_CERT_ALTNAME_INVALID";

  assert.equal(classifyDatabaseFailure(authError), "DATABASE_AUTH_FAILED");
  assert.equal(classifyDatabaseFailure(connectionError), "DATABASE_CONNECTION_FAILED");
  assert.equal(classifyDatabaseFailure(tlsError), "DATABASE_TLS_FAILED");
  assert.equal(classifyDatabaseFailure(new Error("secret-bearing unknown failure")), "DATABASE_CHECK_FAILED");
});

test("backend identity detects split Auth/SQL targets without exposing credentials", () => {
  const identity = getBackendIdentity({
    NEXT_PUBLIC_SUPABASE_URL: "https://kytdomflmjytzyaabogi.supabase.co",
    DATABASE_URL: "postgresql://postgres.bniwtkjtramqaozrrtrk:private-password@pooler.supabase.com:6543/postgres",
  });
  assert.equal(identity.alignment, "MISMATCH");
  assert.equal(identity.databaseProjectRef, "bniwtkjtramqaozrrtrk");
  assert.doesNotMatch(JSON.stringify(identity), /private-password|pooler\.supabase/);
  assert.equal(getBackendIdentity({ NEXT_PUBLIC_SUPABASE_URL: "https://kytdomflmjytzyaabogi.supabase.co", DATABASE_URL: "postgresql://postgres:private-password@db.kytdomflmjytzyaabogi.supabase.co/postgres" }).alignment, "MATCH");
});
