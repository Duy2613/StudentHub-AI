import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migration = await readFile(new URL("../../../database/migrations/202609130001_community_max_waves.sql", import.meta.url), "utf8");
const domain = await readFile(new URL("../../src/lib/communityMax/communityMaxDomain.js", import.meta.url), "utf8");
const repository = await readFile(new URL("../../src/lib/server/database/CommunityMaxRepository.js", import.meta.url), "utf8");
const route = await readFile(new URL("../../src/app/api/community/max/route.js", import.meta.url), "utf8");
const contract = await readFile(new URL("../../../docs/contracts/COMMUNITY_MAX_WAVES_CONTRACT.md", import.meta.url), "utf8");

test("Community Max migration covers all three waves with RLS and hard-false training", () => {
  for (const table of [
    "community_source_references",
    "community_source_change_events",
    "community_verification_projections",
    "community_claim_discussions",
    "community_discussion_summaries",
    "community_review_candidates",
    "community_expert_requests",
    "community_campus_contexts",
    "community_risk_clusters",
    "community_risk_cluster_members",
    "community_correction_records",
    "community_data_candidates",
  ]) assert.match(migration, new RegExp(table));
  assert.match(migration, /enable row level security/);
  assert.match(migration, /training_eligible boolean not null default false check \(training_eligible = false\)/);
  assert.match(migration, /community_claim_discussions_no_update/);
  assert.match(migration, /community_source_change_events_no_update/);
});

test("Community Max routes expose wave actions and keep mutation boundaries explicit", () => {
  for (const action of ["PREVIEW_COMPOSER", "PUBLISH_CONTRIBUTION", "DISCUSS", "ATTACH_SOURCES", "REQUEST_VERIFICATION", "REQUEST_REVIEW", "REQUEST_EXPERT", "SUMMARY", "RANK", "UPDATE_SOURCE_STATUS", "CAMPUS_CONTEXT", "RISK_SIGNAL", "CORRECTION", "DATA_CANDIDATE"]) assert.match(route, new RegExp(action));
  assert.match(route, /requiredPermission: "COMMUNITY\.POST"/);
  assert.match(route, /STAGING_EMAIL_FINAL_ASSURANCE_PENDING/);
  assert.match(route, /CANONICAL_TRUST_FLOW_REQUIRED/);
  assert.match(route, /trainingEligible: false/);
});

test("Community Max repository cannot directly mutate Trust or Passport authority", () => {
  assert.doesNotMatch(repository, /INSERT\s+INTO\s+(?:public\.)?(?:trust_|evidence_passport)/i);
  assert.doesNotMatch(repository, /UPDATE\s+(?:public\.)?(?:trust_|evidence_passport)/i);
  assert.doesNotMatch(repository, /DELETE\s+FROM\s+(?:public\.)?(?:trust_|evidence_passport)/i);
  assert.match(repository, /nextAction: "CANONICAL_TRUST_FLOW_REQUIRED"/);
  assert.match(repository, /expertAuthorityMutation: false/);
});

test("Contract records frozen modules and public authority invariants", () => {
  for (const marker of [
    "Auth, Profile, Expert authority, Trust V5",
    "Popularity -> Truth",
    "BELIEVE -> VERIFIED",
    "Moderation -> Trust verdict",
    "Restricted media public leak",
    "User content -> automatic training",
    "STAGING_EMAIL_FINAL_ASSURANCE_PENDING",
  ]) assert.match(contract, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  for (const marker of ["communityAuthorityBoundary", "buildGroundedDiscussionSummary", "buildTransparentCommunityRanking", "trainingEligible: false"]) assert.match(domain, new RegExp(marker));
});
