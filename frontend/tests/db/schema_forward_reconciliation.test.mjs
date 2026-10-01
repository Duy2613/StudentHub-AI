import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const migrationDir = join(repositoryRoot, "database", "migrations");
const outbox = readFileSync(join(migrationDir, "202610010001_integration_outbox_forward_reconciliation.sql"), "utf8");
const profileChecks = readFileSync(join(migrationDir, "202610010002_profile_presentation_check_reconciliation.sql"), "utf8");
const sequenceGrants = readFileSync(join(migrationDir, "202610010003_expert_v5_event_sequence_permissions.sql"), "utf8");
const rehearsal = readFileSync(join(repositoryRoot, "scripts", "verify-schema-reconciliation.mjs"), "utf8");

describe("tracked forward schema reconciliation", () => {
  it("asserts existing outbox types, defaults, RLS and the precise old status constraint", () => {
    for (const field of ["lease_token", "lease_count", "shadow_count", "shadowed_at"]) assert.ok(outbox.includes(`'${field}'`));
    assert.match(outbox, /OUTBOX_RECONCILIATION_INCOMPATIBLE_FIELD/);
    assert.match(outbox, /OUTBOX_RECONCILIATION_RLS_REQUIRED/);
    assert.match(outbox, /OUTBOX_RECONCILIATION_UNREVIEWED_STATUS_CHECK/);
    assert.match(outbox, /lock_timeout = '5s'/);
    assert.match(outbox, /statement_timeout = '60s'/);
    assert.doesNotMatch(outbox, /\bUPDATE\s+private\.integration_outbox/i);
  });

  it("widens only the two reviewed staging profile checks and leaves row data untouched", () => {
    assert.match(profileChecks, /majorISNULLORchar_lengthmajor<=160/);
    assert.match(profileChecks, /avatar_idISNULLORavatar_id~/);
    assert.match(profileChecks, /char_length\(%I\) <= %s/);
    assert.match(profileChecks, /PROFILE_PRESENTATION_UNREVIEWED_CHECK/);
    assert.doesNotMatch(profileChecks, /\bUPDATE\s+public\.profiles/i);
  });

  it("grants only server-role access to the exact four Expert V5 identity sequences", () => {
    for (const table of ["expert_v5_source_events", "expert_v5_question_events", "expert_mission_events", "expert_room_events"]) assert.ok(sequenceGrants.includes(table));
    assert.match(sequenceGrants, /grant usage, select on sequence %s to service_role/i);
    assert.doesNotMatch(sequenceGrants, /\bgrant\s+.*\s+to\s+(public|anon|authenticated)\b/i);
  });

  it("rehearses fresh plus both observed environment upgrade plans and preserves fixture digests", () => {
    assert.match(rehearsal, /FRESH_DB_MIGRATION_CHAIN/);
    assert.match(rehearsal, /production.*1025|cases: 1025/i);
    assert.match(rehearsal, /outbox: 372/);
    assert.match(rehearsal, /reviews: 573/);
    assert.match(rehearsal, /legacyInstitutionLabelPreserved/);
    assert.match(rehearsal, /assert\.deepEqual\(preserve\(database\), before/);
    assert.match(rehearsal, /INCOMPATIBLE_SCHEMA_REJECTED/);
  });
});
