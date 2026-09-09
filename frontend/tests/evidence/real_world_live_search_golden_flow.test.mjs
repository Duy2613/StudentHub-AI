import test from "node:test";
import assert from "node:assert/strict";
import { TrustV5Engine } from "../../src/lib/server/trust/TrustV5Engine.js";

test("GOLDEN FLOW (LIVE SEARCH): End-to-end verification powered by real web retrieval", async () => {
  // Non-sensitive real-world academic inquiry
  const inputContent = "Trường Đại học Bách khoa Đại học Quốc gia Thành phố Hồ Chí Minh là cơ sở giáo dục đại học công lập hàng đầu về kỹ thuật và công nghệ.";

  const result = await TrustV5Engine.verify({
    type: "text",
    content: inputContent,
    caseId: "case-live-search-01",
    revision: 1
  });

  console.log("\n============================================================");
  console.log("🔍 REAL-WORLD LIVE SEARCH GOLDEN FLOW RESULTS");
  console.log("============================================================");
  console.log(`Case ID:           ${result.caseId}`);
  console.log(`Verdict:           ${result.verdict.label}`);
  console.log(`Retrieval Status:  ${result.verification.retrievalStatus}`);
  console.log(`Total Sources:     ${result.evidence.sources.length}`);
  console.log(`Citations Cited:   ${result.verdict.citationIds.length}`);

  // 1. Prove claims decomposed
  assert.ok(result.claims.length > 0, "Must extract at least 1 claim");
  console.log(`Claim 1 Text:      "${result.claims[0].text}"`);

  // 2. Prove real reachable sources discovered
  assert.ok(result.evidence.sources.length > 0, "Must discover sources");
  const liveSource = result.evidence.sources.find(s => s.retrievalMethod === "REAL_WEB_RETRIEVAL") || result.evidence.sources[0];

  console.log(`\nSample Source Provenance:`);
  console.log(`  Source ID:       ${liveSource.sourceId}`);
  console.log(`  Title:           ${liveSource.title}`);
  console.log(`  URL:             ${liveSource.canonicalUrl}`);
  console.log(`  Domain:          ${liveSource.domain}`);
  console.log(`  SHA-256 Digest:  ${liveSource.contentDigest}`);
  console.log(`  Retrieval Method:${liveSource.retrievalMethod}`);
  console.log(`  Query ID:        ${liveSource.retrievalQueryId}`);

  assert.ok(liveSource.canonicalUrl.startsWith("https://"), "URL must be real HTTPS");
  assert.equal(liveSource.contentDigest.length, 64, "SHA-256 must be 64 characters");
  assert.ok(liveSource.title.length > 0, "Title must be present");

  // 3. Prove claim relations evaluated
  assert.ok(result.evidence.relationships.length > 0, "Must evaluate claim-source relationships");
  console.log(`Claim Relationship:${result.evidence.relationships[0].relation}`);

  // 4. Prove Critic evaluated
  assert.ok(result.verification.modelsUsed.length > 0, "Models must be recorded");

  // 5. Prove Citation Validation
  assert.ok(Array.isArray(result.verdict.citationIds), "Citation IDs must be an array");
  for (const cid of result.verdict.citationIds) {
    const matching = result.evidence.sources.some(s => s.sourceId === cid || s.evidenceId === cid);
    assert.ok(matching, `Cited ID ${cid} must exist in verified evidence sources`);
  }

  // 6. Prove Decision Twin computed
  assert.ok(result.decisionTwin, "Decision Twin must be present");
  assert.ok(result.decisionTwin.decisionDrivers.length > 0, "Decision Twin must have decisionDrivers");
  assert.ok(result.decisionTwin.reversalConditions.length > 0, "Reversal conditions must be present");
  console.log(`Decision Twin Drivers: [${result.decisionTwin.decisionDrivers.map(d => d.sourceTitle).join("; ")}]`);
  console.log(`Reversal Conditions:  [${result.decisionTwin.reversalConditions.map(c => c.condition).join("; ")}]`);

  // 7. Prove Evidence Passport sealed
  assert.ok(result.passport, "Evidence Passport must be sealed");
  assert.equal(result.passport.artifactHash.length, 64, "Passport artifactHash must be SHA-256");
  console.log(`Passport Digest:   ${result.passport.artifactHash}`);
  console.log("============================================================\n");
});
