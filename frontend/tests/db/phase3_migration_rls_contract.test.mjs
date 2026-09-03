import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { DatabaseUnavailableError, getPostgresPool } from "../../src/lib/server/database/PostgresPool.js";

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const sql = readFileSync(join(repositoryRoot, "database", "migrations", "202608270001_v2_authority_foundation.sql"), "utf8");
const forumRoute = readFileSync(join(repositoryRoot, "frontend", "src", "app", "api", "forum", "posts", "route.js"), "utf8");

describe("PHASE 3 — migration and RLS contract", () => {
  it("defines durable sessions, audit, forum and V2 evidence foundations", () => {
    for (const table of ["server_sessions", "audit_events", "profiles", "institutions", "posts", "comments", "votes", "trust_cases", "case_inputs", "entities", "case_entities", "evidence", "claims", "claim_sources", "expert_profiles", "expert_domains", "expert_verifications", "expert_assessments", "reputation_events"]) {
      assert.match(sql, new RegExp(`create table if not exists (?:public|private)\\.${table}\\b`, "i"), table);
    }
  });
  it("keeps privileged state private and prevents blanket profile privilege updates", () => {
    assert.match(sql, /revoke all on schema private from public, anon, authenticated/i);
    assert.match(sql, /grant usage on schema private to service_role/i);
    assert.match(sql, /grant select, insert on private\.audit_events to service_role/i);
    assert.match(sql, /drop policy if exists "Public profiles are viewable by everyone"/i);
    assert.match(sql, /revoke all on public\.profiles from public, anon, authenticated/i);
    assert.match(sql, /grant insert\(id, institution_id, display_name, avatar_url, bio\)/i);
    assert.match(sql, /grant update\(display_name, avatar_url, bio, institution_id\)/i);
    assert.match(sql, /revoke select on public\.posts, public\.comments from anon, authenticated/i);
    assert.match(sql, /grant select\(id, category, location_tag, title, content, images, links, status, created_at, updated_at\) on public\.posts to anon, authenticated/i);
    assert.match(sql, /grant select\(id, post_id, content, status, created_at, updated_at\) on public\.comments to anon, authenticated/i);
    assert.doesNotMatch(sql, /grant select on public\.posts, public\.comments to anon, authenticated/i);
    assert.doesNotMatch(sql, /grant insert on public\.profiles to authenticated/i);
    assert.doesNotMatch(sql, /grant update on public\.profiles to authenticated/i);
  });
  it("enables RLS and binds own-resource policies to auth.uid()", () => {
    assert.match(sql, /alter table private\.server_sessions enable row level security/i);
    assert.match(sql, /profiles_own_update[\s\S]*auth\.uid\(\) = id/i);
    assert.match(sql, /posts_own_insert[\s\S]*auth\.uid\(\) = author_id/i);
    assert.match(sql, /trust_cases_own[\s\S]*auth\.uid\(\) = owner_id/i);
  });

  it("fails closed when durable PostgreSQL is not configured", () => {
    const previous = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    try {
      assert.throws(() => getPostgresPool(), DatabaseUnavailableError);
    } finally {
      if (previous === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = previous;
    }
  });

  it("permits memory forum persistence only through an explicit non-production adapter", () => {
    assert.match(forumRoute, /process\.env\.NODE_ENV !== "production"/);
    assert.match(forumRoute, /STUDENTHUB_PERSISTENCE_ADAPTER === "memory"/);
    assert.match(forumRoute, /PERSISTENCE_WORKFLOW_NOT_MIGRATED/);
    assert.match(forumRoute, /new PostgresForumRepository\(\)\.create/);
  });
});
