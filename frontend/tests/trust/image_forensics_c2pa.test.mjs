import test from "node:test";
import assert from "node:assert/strict";
import { C2paProvenanceAnalyzer, C2PA_STATUS } from "../../src/lib/ai-trust/forensics/deterministic/C2paProvenanceAnalyzer.js";
import { ImageForensicsPolicyV1 } from "../../src/lib/ai-trust/forensics/policy/ImageForensicsPolicyV1.js";

test("C2PA Forensics — Physical JUMBF presence without cryptographic chain MUST be PRESENT_UNVERIFIED, never VALID", () => {
  // Construct buffer with JUMBF and Adobe Photoshop CAI claim generator
  const payload = "image_data_prefix...jumb...c2pa...Adobe Photoshop 2024 Content Credentials...suffix";
  const buffer = Buffer.from(payload, "latin1");

  const analysis = C2paProvenanceAnalyzer.analyze(buffer);

  // Invariant (Hardening Rule 5): VALID requires cryptographic verification.
  // Physical presence alone yields PRESENT_UNVERIFIED.
  assert.equal(analysis.c2paStatus, C2PA_STATUS.PRESENT_UNVERIFIED);
  assert.notEqual(analysis.c2paStatus, C2PA_STATUS.VALID);
  assert.equal(analysis.isVerified, false);
  assert.match(analysis.claimGenerator, /Adobe Photoshop/i);

  const evaluated = ImageForensicsPolicyV1.evaluate({
    c2paResult: analysis,
    artifact: { mediaArtifactId: "art_c2pa", sha256: "hash_c2pa" },
  });

  assert.equal(evaluated.publicDto.provenance.c2paStatus, C2PA_STATUS.PRESENT_UNVERIFIED);
  assert.equal(evaluated.publicDto.provenance.isVerified, false);
});

test("C2PA Forensics — Absence of C2PA manifest returns ABSENT and NEVER implies fake", () => {
  const cleanBuffer = Buffer.from("ordinary_plain_image_without_any_metadata_block_present_here");
  const analysis = C2paProvenanceAnalyzer.analyze(cleanBuffer);

  assert.equal(analysis.c2paStatus, C2PA_STATUS.ABSENT);
  assert.equal(analysis.isVerified, false);

  const evaluated = ImageForensicsPolicyV1.evaluate({
    c2paResult: analysis,
    artifact: { mediaArtifactId: "art_noc2pa", sha256: "hash_noc2pa" },
  });

  assert.equal(evaluated.publicDto.provenance.c2paStatus, C2PA_STATUS.ABSENT);
  // ABSENT never implies fake or triggers high risk
  assert.notEqual(evaluated.publicDto.summary.riskLevel, "HIGH");
  assert.notEqual(evaluated.publicDto.summary.riskLevel, "CRITICAL");
});
