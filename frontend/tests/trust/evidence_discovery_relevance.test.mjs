import assert from "node:assert/strict";
import test from "node:test";

import { EvidenceDiscoveryService } from "../../src/lib/server/trust/EvidenceDiscoveryService.js";

test("static evidence discovery matches the specific claim topic and resolved institution", async () => {
  const result = await EvidenceDiscoveryService.discoverEvidenceForClaims({
    claims: [{
      claimId: "claim-hcmute-tuition-2026",
      text: "HCMUTE điều chỉnh học phí năm học 2026.",
      normalizedText: "HCMUTE điều chỉnh học phí năm học 2026.",
      entities: [{ name: "HCMUTE", domain: "hcmute.edu.vn", entityId: "hcmute" }],
    }],
    runId: "static-relevance-regression",
    mode: "STATIC",
  });

  const titles = result.sources.map((source) => source.title);
  assert.ok(titles.some((title) => /học phí/i.test(title)), "the matching tuition source should be retained");
  assert.ok(!titles.some((title) => /học bổng|bách khoa|vietcombank|ngày hội việc làm/i.test(title)),
    "unrelated institutions and topics must not be presented as claim evidence");
});

test("static evidence discovery reports insufficient evidence when the corpus has no relevant source", async () => {
  const result = await EvidenceDiscoveryService.discoverEvidenceForClaims({
    claims: [{
      claimId: "claim-lab-deposit",
      text: "Quantum neutrino decay in a lunar reactor on 2048-04-19.",
      normalizedText: "Quantum neutrino decay in a lunar reactor on 2048-04-19.",
      entities: [],
    }],
    runId: "static-no-match-regression",
    mode: "STATIC",
  });

  assert.equal(result.sources.length, 0);
  assert.equal(result.retrievalProviderStatus, "INSUFFICIENT_EVIDENCE");
});
