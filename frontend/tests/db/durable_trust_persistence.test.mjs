import test, { after } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { TrustPersistenceMapper } from "../../src/lib/ai-trust/v5/TrustPersistenceMapper.js";
import { DurableTrustRepository } from "../../src/lib/server/database/DurableTrustRepository.js";
import { getPostgresPool } from "../../src/lib/server/database/PostgresPool.js";

after(async () => {
  await getPostgresPool().end();
});

test("Option B: Anonymous caller is strictly ephemeral (zero DB mapping)", () => {
  const mockPipeline = {
    verificationId: crypto.randomUUID(),
    contractVersion: "trust.v5",
    state: "SUSPICIOUS",
    decision: { verdict: "SUSPICIOUS", confidence: 0.85 },
    layers: {
      layer1: { id: crypto.randomUUID(), status: "FLAG", confidence: 0.8 },
    },
  };

  const input = { type: "text", content: "Lien he zalo 0901234567 de nhan hoc bong" };

  // Case 1: Anonymous principal (null)
  const resultNull = TrustPersistenceMapper.mapPipelineToDurableRecord({
    pipelineResult: mockPipeline,
    input,
    principal: null,
    requestId: "req_anon_1",
  });
  assert.equal(resultNull, null, "Anonymous principal must return null mapping");

  // Case 2: Anonymous principal object without id
  const resultAnon = TrustPersistenceMapper.mapPipelineToDurableRecord({
    pipelineResult: mockPipeline,
    input,
    principal: { type: "ANONYMOUS", role: "GUEST" },
    requestId: "req_anon_2",
  });
  assert.equal(resultAnon, null, "Anonymous principal without id must return null mapping");
});

test("Option B: DurableTrustRepository rejects persistence without ownerId", async () => {
  await assert.rejects(
    async () => {
      await DurableTrustRepository.persistTrustRecord({
        caseRecord: { state: "SUSPICIOUS" },
        input: { type: "text", content: "test" },
      });
    },
    /AUTHENTICATED_OWNER_REQUIRED/,
    "Must throw AUTHENTICATED_OWNER_REQUIRED error when ownerId is missing"
  );
});

test("TrustPersistenceMapper maps authenticated pipeline result to relational DTO", () => {
  const userId = crypto.randomUUID();
  const verificationId = crypto.randomUUID();

  const mockPipeline = {
    verificationId,
    contractVersion: "trust.v5",
    state: "BLOCK",
    decision: {
      verdict: "BLOCK",
      confidence: 0.96,
      riskLevel: "CRITICAL",
      reasons: ["Known phishing portal"],
    },
    layers: {
      layer1: {
        id: crypto.randomUUID(),
        status: "BLOCK",
        confidence: 0.95,
        ruleVersion: "l1-v2",
        reasons: ["Blacklist domain match"],
        signals: ["phishing_signature"],
      },
      layer2A: {
        id: crypto.randomUUID(),
        threatMatch: true,
        threatType: "MALWARE",
        provider: "google-safe-browsing",
        confidence: 0.98,
      },
      layer2: {
        id: crypto.randomUUID(),
        classification: "MALICIOUS_IMPERSONATION",
        riskLevel: "HIGH",
        confidence: 0.92,
        claims: [
          { statement: "Tuyen sinh nhan bang quoc te khong can thi", status: "CONTRADICTED" },
        ],
        entities: [
          { type: "ORGANIZATION", value: "Fake International Uni", role: "IMPERSONATED", confidence: 0.9 },
        ],
      },
      layer3: {
        id: crypto.randomUUID(),
        verified: false,
        source: "tavily-evidence",
        confidence: 0.88,
        sources: [{ title: "Official Warning", url: "https://moet.gov.vn/warning" }],
      },
      layer4: {
        id: crypto.randomUUID(),
        verdict: "BLOCK",
        confidence: 0.97,
        policyVersion: "l4-v2.1",
        rulesTriggered: ["RULE_ZERO_TOLERANCE_PHISHING"],
      },
    },
  };

  const input = {
    type: "url",
    content: "https://phishing-scholarship-uni.xyz/apply?ref=telegram@scammer_bot",
    metadata: { url: "https://phishing-scholarship-uni.xyz/apply" },
  };

  const dto = TrustPersistenceMapper.mapPipelineToDurableRecord({
    pipelineResult: mockPipeline,
    input,
    principal: { id: userId, type: "STUDENT", email: "student@hcmute.edu.vn" },
    requestId: "req_auth_test_1",
  });

  assert.ok(dto, "DTO must be generated for authenticated user");
  assert.equal(dto.caseRecord.ownerId, userId);
  assert.equal(dto.caseRecord.id, verificationId);
  assert.equal(dto.caseRecord.state, "BLOCK");
  assert.equal(dto.caseRecord.visibility, "PRIVATE");

  // Entities extracted
  const entityTypes = dto.entities.map((e) => e.entityType);
  assert.ok(entityTypes.includes("URL"), "Extracted URL");
  assert.ok(entityTypes.includes("DOMAIN"), "Extracted DOMAIN");
  assert.ok(entityTypes.includes("TELEGRAM"), "Extracted TELEGRAM handle");
  assert.ok(entityTypes.includes("ORGANIZATION"), "Extracted ORGANIZATION");

  // Evidence layers mapped
  assert.equal(dto.evidence.length, 5, "5 evidence items for L1, L2A, L2B, L3, L4");
  const sourceTypes = dto.evidence.map((e) => e.sourceType);
  assert.ok(sourceTypes.includes("LOCAL_RULES"));
  assert.ok(sourceTypes.includes("THREAT_INTELLIGENCE"));
  assert.ok(sourceTypes.includes("SEMANTIC_AI"));
  assert.ok(sourceTypes.includes("EXTERNAL_EVIDENCE"));
  assert.ok(sourceTypes.includes("DETERMINISTIC_POLICY"));

  // Claims
  assert.equal(dto.claims.length, 1);
  assert.equal(dto.claims[0].status, "CONTRADICTED");
  assert.ok(dto.claims[0].evidenceRelations.length > 0);

  // Audit
  assert.equal(dto.audit.actorId, userId);
  assert.equal(dto.audit.requestId, "req_auth_test_1");
});

test("Live Database: End-to-end atomic persistence & entity deduplication (Option B)", async () => {
  const pool = getPostgresPool();

  // Find a real existing user in auth.users
  const userRes = await pool.query(`SELECT id FROM auth.users LIMIT 1`);
  if (userRes.rows.length === 0) {
    console.log("No users in auth.users, skipping live DB roundtrip test");
    return;
  }
  const realUserId = userRes.rows[0].id;
  const caseId1 = crypto.randomUUID();
  const caseId2 = crypto.randomUUID();
  const sharedDomain = `test-scam-${Date.now()}.edu.fake`;

  try {
    // 1. Persist Case 1
    const res1 = await DurableTrustRepository.persistTrustRecord({
      caseRecord: { id: caseId1, ownerId: realUserId, state: "SUSPICIOUS", visibility: "PRIVATE" },
      input: { type: "url", content: `https://${sharedDomain}/login` },
      entities: [
        { entityType: "DOMAIN", value: sharedDomain, relationType: "TARGET", confidence: 0.95 },
        { entityType: "PHONE", value: "0912345678", relationType: "MENTIONED", confidence: 0.9 },
      ],
      evidence: [
        {
          sourceType: "THREAT_INTELLIGENCE",
          identifier: "google-safe-browsing",
          observedAt: new Date(),
          extractorVersion: "v1",
          confidence: 0.95,
          provenance: { threatMatch: true },
        },
      ],
      claims: [
        {
          statement: `Portal at ${sharedDomain} is verified by ministry`,
          status: "CONTRADICTED",
        },
      ],
      audit: {
        eventType: "TRUST_CASE_PERSISTED",
        actorId: realUserId,
        requestId: "test_req_case_1",
      },
    });

    assert.equal(res1.persisted, true);
    assert.equal(res1.caseId, caseId1);

    // 2. Persist Case 2 (sharing the same domain entity)
    const res2 = await DurableTrustRepository.persistTrustRecord({
      caseRecord: { id: caseId2, ownerId: realUserId, state: "BLOCK", visibility: "PRIVATE" },
      input: { type: "url", content: `https://${sharedDomain}/checkout` },
      entities: [
        { entityType: "DOMAIN", value: sharedDomain, relationType: "TARGET", confidence: 0.99 },
      ],
      evidence: [
        {
          sourceType: "DETERMINISTIC_POLICY",
          identifier: "l4.policy",
          observedAt: new Date(),
          extractorVersion: "v1",
          confidence: 0.99,
          provenance: { verdict: "BLOCK" },
        },
      ],
      claims: [],
      audit: {
        eventType: "TRUST_CASE_PERSISTED",
        actorId: realUserId,
        requestId: "test_req_case_2",
      },
    });

    assert.equal(res2.persisted, true);

    // 3. Verify deduplication in public.entities
    const entityRows = await pool.query(
      `SELECT id, entity_type, normalized_value FROM public.entities WHERE normalized_value = $1`,
      [sharedDomain]
    );
    assert.equal(entityRows.rows.length, 1, "Domain entity MUST be deduplicated to exactly ONE row in public.entities");

    // 4. Verify case retrieval
    const loadedCase1 = await DurableTrustRepository.getCaseById(caseId1);
    assert.ok(loadedCase1, "Case 1 retrieved");
    assert.equal(loadedCase1.state, "SUSPICIOUS");
    assert.equal(loadedCase1.entities.length, 2);
    assert.equal(loadedCase1.evidence.length, 1);

    const loadedCase2 = await DurableTrustRepository.getCaseById(caseId2);
    assert.ok(loadedCase2, "Case 2 retrieved");
    assert.equal(loadedCase2.state, "BLOCK");
    assert.equal(loadedCase2.entities.length, 1);

    // 5. Verify audit log entry
    const auditRows = await pool.query(
      `SELECT * FROM private.audit_events WHERE target_id = $1`,
      [caseId1]
    );
    assert.ok(auditRows.rows.length > 0, "Audit event recorded for case 1");
    assert.equal(auditRows.rows[0].request_id, "test_req_case_1");

  } finally {
    // Cleanup synthetic test records
    await pool.query(`DELETE FROM public.trust_cases WHERE id IN ($1, $2)`, [caseId1, caseId2]);
    await pool.query(`DELETE FROM public.entities WHERE normalized_value = $1`, [sharedDomain]);
    await pool.query(`DELETE FROM private.audit_events WHERE target_id IN ($1, $2)`, [caseId1, caseId2]);
  }
});
