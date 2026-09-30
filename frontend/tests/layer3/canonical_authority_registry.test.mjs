import assert from "node:assert/strict";
import test from "node:test";

import { SourceAuthorityRegistry } from "../../src/lib/ai-trust/layer3/registry/SourceAuthorityRegistry.js";

test("canonical authority discovery resolves explicit official organizations across source classes", () => {
  assert.deepEqual(SourceAuthorityRegistry.resolveCanonicalDomains("React official documentation for hooks"), ["react.dev"]);
  assert.deepEqual(SourceAuthorityRegistry.resolveCanonicalDomains("Đại học Kinh tế Quốc dân thông tin học phí"), ["neu.edu.vn"]);
  assert.deepEqual(SourceAuthorityRegistry.resolveCanonicalDomains("PubMed indexed CRISPR research"), ["pubmed.ncbi.nlm.nih.gov"]);
  assert.deepEqual(SourceAuthorityRegistry.resolveCanonicalDomains("Bộ Công an cảnh báo an toàn"), ["bocongan.gov.vn", "mps.gov.vn"]);
  assert.deepEqual(SourceAuthorityRegistry.resolveCanonicalDomains("WHO and CDC"), ["who.int", "cdc.gov"]);
});

test("authority is assigned to curated organization domains, never to a suffix alone", () => {
  assert.equal(SourceAuthorityRegistry.evaluateAuthority("https://docs.python.org/3/library/asyncio.html").isOfficial, true);
  assert.equal(SourceAuthorityRegistry.evaluateAuthority("https://random-government.example.gov.vn/policy").isOfficial, false);
  assert.equal(SourceAuthorityRegistry.evaluateAuthority("https://neu.edu.vn.attacker.example/admission").isOfficial, false);
  assert.deepEqual(SourceAuthorityRegistry.resolveCanonicalDomains("Find an official source for an unknown organization"), []);
});
