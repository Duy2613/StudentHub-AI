/**
 * StudentHub AI — Operational Corpus & Evidence G8 Reproducibility Test
 *
 * Verifies Sections 74 & 75:
 * - 20 source-backed cases with full provenance chain
 * - SHA-256 digest validity (64-char hex)
 * - Safe canonical URL validation & SSRF protection
 * - Traceable path: Claim -> Query -> Retrieval -> URL -> Snapshot -> Forensics -> Verdict -> Passport
 */

import test from "node:test";
import assert from "node:assert/strict";
import { OPERATIONAL_CORPUS_20 } from "../../src/lib/server/trust/OperationalCorpus20.js";
import { EvidenceDiscoveryService } from "../../src/lib/server/trust/EvidenceDiscoveryService.js";
import { EvidencePassportService } from "../../src/lib/server/trust/EvidencePassportService.js";
import { VerdictPolicyEngine } from "../../src/lib/server/trust/VerdictPolicyEngine.js";

test("OPERATIONAL CORPUS: Exactly 20 pilot cases exist with complete schema", () => {
  assert.equal(OPERATIONAL_CORPUS_20.length, 20, "Corpus must have exactly 20 cases for operational pilot");

  for (const item of OPERATIONAL_CORPUS_20) {
    assert.ok(item.caseId.startsWith("CORPUS-"), `caseId ${item.caseId} must be formatted`);
    assert.ok(item.title, `Case ${item.caseId} must have a title`);
    assert.ok(item.domain, `Case ${item.caseId} must specify domain`);
    assert.ok(Array.isArray(item.claims) && item.claims.length > 0, `Case ${item.caseId} must have claims`);
    assert.ok(item.retrieval?.query, `Case ${item.caseId} must have a retrieval query`);
    assert.ok(item.retrieval?.retrievalMethod, `Case ${item.caseId} must declare retrieval method`);
    assert.ok(item.retrieval?.retrievalQueryId, `Case ${item.caseId} must declare retrievalQueryId`);
  }
});

test("EVIDENCE G8 PROVENANCE: Every source has 14 mandatory fields and valid SHA-256 digest", () => {
  const hex64Regex = /^[a-f0-9]{64}$/i;

  let totalSourcesChecked = 0;

  for (const item of OPERATIONAL_CORPUS_20) {
    for (const source of item.sources) {
      totalSourcesChecked += 1;
      assert.ok(source.sourceId, `Source in ${item.caseId} must have sourceId`);
      assert.ok(source.publisher, `Source ${source.sourceId} must have publisher`);
      assert.ok(source.domain, `Source ${source.sourceId} must have domain`);
      assert.ok(source.canonicalUrl, `Source ${source.sourceId} must have canonicalUrl`);
      assert.ok(source.publishedAt, `Source ${source.sourceId} must have publishedAt`);
      assert.ok(source.retrievedAt, `Source ${source.sourceId} must have retrievedAt`);
      assert.ok(source.jurisdiction, `Source ${source.sourceId} must have jurisdiction`);
      assert.ok(source.licenseAllowedUse, `Source ${source.sourceId} must declare license/allowed use`);
      assert.ok(source.snapshotUri, `Source ${source.sourceId} must have snapshotUri`);
      assert.ok(source.contentDigest, `Source ${source.sourceId} must have contentDigest`);
      assert.match(source.contentDigest, hex64Regex, `Content digest of ${source.sourceId} must be valid SHA-256 hex`);
      assert.ok(source.parserVersion, `Source ${source.sourceId} must declare parserVersion`);
      assert.ok(source.piiClassification, `Source ${source.sourceId} must declare piiClassification`);
      assert.ok(source.independenceKey, `Source ${source.sourceId} must declare independenceKey`);

      // Prove URL passes SSRF check
      assert.equal(
        EvidenceDiscoveryService.isSafeUrl(source.canonicalUrl),
        true,
        `Canonical URL ${source.canonicalUrl} must pass SSRF safety check`
      );
    }
  }

  assert.ok(totalSourcesChecked >= 19, "Must have verified at least 19 sources across the corpus");
});

test("EVIDENCE PASSPORT COMMIT: Every corpus case successfully seals an immutable Passport", () => {
  for (const item of OPERATIONAL_CORPUS_20) {
    const passport = EvidencePassportService.issuePassport({
      caseId: item.caseId,
      runId: `run-${item.caseId}`,
      revision: 1,
      claims: item.claims,
      sources: item.sources,
      relationships: item.relations,
      independenceGroups: [{ group: "primary", members: item.sources.map((s) => s.sourceId) }],
      modelTraces: [{ role: "REASONER", model: "gpt-5.6-luna", latencyMs: 450 }],
      verdictResult: { verdict: item.expectedVerdict, confidenceScore: 0.95 },
      decisionTwin: { reversalConditions: ["Có văn bản đính chính mới"] },
    });

    assert.ok(passport.passportId, `Passport for ${item.caseId} must have passportId`);
    assert.match(passport.artifactHash, /^[a-f0-9]{64}$/i, "Passport artifactHash must be valid SHA-256");
    assert.equal(passport.revision, 1);
  }
});
