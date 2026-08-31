import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const sql = readFileSync(join(repositoryRoot, "database", "migrations", "202608290001_feature_freeze_cross_system.sql"), "utf8");
const passportRoute = readFileSync(join(repositoryRoot, "frontend", "src", "app", "api", "v1", "passports", "route.js"), "utf8");
const decisionRoute = readFileSync(join(repositoryRoot, "frontend", "src", "app", "api", "v1", "decisions", "route.js"), "utf8");
const repository = readFileSync(join(repositoryRoot, "frontend", "src", "lib", "intelligence", "crossSystem", "PostgresCrossSystemRepository.js"), "utf8");
const passportDetailRoute = readFileSync(join(repositoryRoot, "frontend", "src", "app", "api", "v1", "passports", "[passportId]", "route.js"), "utf8");

describe("Feature-freeze cross-system migration contract", () => {
  it("defines Passport, append-only events, Decision Twin, follow, and material notifications", () => {
    for (const table of ["evidence_passports", "evidence_passport_events", "decision_scenarios", "decision_options", "case_follows", "notifications"]) {
      assert.match(sql, new RegExp(`create table if not exists public\\.${table}\\b`, "i"), table);
      assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, "i"), table);
    }
    assert.match(sql, /unique\(passport_id, revision\)/i);
    assert.match(sql, /material_change_revision/i);
  });

  it("blocks persisted demo data and does not grant event update or delete", () => {
    assert.match(sql, /demo boolean not null default false check \(demo = false\)/i);
    assert.match(sql, /grant select on public\.evidence_passports, public\.evidence_passport_events/i);
    assert.doesNotMatch(sql, /grant[^;]*(?:insert|update|delete)[^;]*public\.evidence_passport_events[^;]*to authenticated/i);
    assert.match(passportRoute, /DEMO_DATA_REJECTED/);
    assert.match(decisionRoute, /Demo scenarios cannot be persisted/);
  });

  it("binds all user-facing records to auth.uid() ownership", () => {
    assert.match(sql, /evidence_passports_own_select[\s\S]*auth\.uid\(\) = owner_id/i);
    assert.match(sql, /evidence_passport_events_own_select[\s\S]*passport\.owner_id = auth\.uid\(\)/i);
    assert.match(sql, /decision_scenarios_own_select[\s\S]*auth\.uid\(\) = owner_id/i);
    assert.match(sql, /case_follows_own[\s\S]*auth\.uid\(\) = owner_id/i);
  });

  it("keeps both live APIs authenticated and server-authorized", () => {
    assert.match(passportRoute, /requiredPermission: "PASSPORT\.READ_OWN"/);
    assert.match(passportRoute, /requiredPermission: "PASSPORT\.WRITE_OWN"/);
    assert.match(decisionRoute, /requiredPermission: "DECISION\.EVALUATE"/);
    assert.doesNotMatch(`${passportRoute}\n${decisionRoute}`, /allowAnonymous:\s*true/);
  });

  it("serializes concurrent Passport appends and rejects stale revisions", () => {
    assert.match(sql, /unique\(passport_id, revision\)/i);
    assert.match(repository, /for update/i);
    assert.match(repository, /passport\.revision !== current\.revision \+ 1/i);
    assert.match(repository, /PASSPORT_REVISION_CONFLICT/);
    assert.match(repository, /where id = \$4 and owner_id = \$5 and revision = \$6/i);
  });

  it("never trusts browser-supplied evidence or decision authority", () => {
    assert.match(sql, /'USER_NOTE'/);
    assert.match(sql, /'USER_SUBMISSION'/);
    assert.match(passportDetailRoute, /SERVER_AUTHORITY_REQUIRED/);
    assert.match(passportDetailRoute, /type: "USER_NOTE"/);
    assert.match(passportDetailRoute, /provenanceClass: "USER_SUBMISSION"/);
    assert.match(passportRoute, /body\.initialStatus && body\.initialStatus !== "INSUFFICIENT_EVIDENCE"/);
    assert.match(passportRoute, /initialStatus: "INSUFFICIENT_EVIDENCE"/);
    assert.match(decisionRoute, /basis: "USER_ASSUMPTION"/);
    assert.match(decisionRoute, /certainty: "UNKNOWN"/);
    assert.match(decisionRoute, /uncertainty: Math\.max\(4/);
  });
});
