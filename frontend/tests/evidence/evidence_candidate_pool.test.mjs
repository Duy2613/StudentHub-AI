import test from "node:test";
import assert from "node:assert/strict";
import { EvidenceCandidatePool } from "../../src/lib/server/trust/EvidenceCandidatePool.js";

test("candidate pool merges sources without entity hard-gating and strips evaluation-only fields", () => {
  const result = EvidenceCandidatePool.merge({
    staticSources: [{ sourceId: "static-1", claimId: "c1", url: "https://example.edu.vn/a", goldLabel: "HIGH_RISK" }],
    liveSources: [{ sourceId: "live-1", claimId: "c1", url: "https://example.edu.vn/a", retrievalMethod: "REAL_WEB_RETRIEVAL" }],
    officialDiscoverySources: [{ sourceId: "official-1", claimId: "c1", url: "https://moet.gov.vn/notice", expectedVerdict: "SUPPORTED" }],
  });

  assert.equal(result.sources.length, 2);
  assert.equal(result.trace.candidatePool, "SAFE_DEDUP(STATIC ∪ LIVE ∪ OFFICIAL_DISCOVERY ∪ PUBLIC_API_DISCOVERY)");
  assert.equal(result.trace.unknownEntityPolicy, "RETAIN_AND_RANK_SOFTLY");
  assert.equal(result.trace.liveCandidatesDeletedForUnknownEntity, 0);
  assert.equal(Object.hasOwn(result.sources[0], "goldLabel"), false);
  assert.equal(Object.hasOwn(result.sources[1], "expectedVerdict"), false);
  assert.ok(result.sources[0].discoveryMethods.includes("REAL_WEB_RETRIEVAL"));
});
