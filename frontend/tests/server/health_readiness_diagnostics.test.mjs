import assert from "node:assert/strict";
import test from "node:test";

import { classifyDatabaseFailure } from "../../src/lib/server/health/readiness.js";

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
