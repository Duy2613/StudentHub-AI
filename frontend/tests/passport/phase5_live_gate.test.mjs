import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { TrustCasePassportBinder } from "../../src/lib/intelligence/passport/TrustCasePassportBinder.js";
import {
  verifyPassportIntegrity,
  PASSPORT_EVENT_TYPE,
  PROVENANCE_CLASS,
  appendEvidenceEvent,
} from "../../src/lib/intelligence/passport/evidencePassportModel.js";
import { PostgresCrossSystemRepository } from "../../src/lib/intelligence/crossSystem/PostgresCrossSystemRepository.js";
import { TrustPersistenceService } from "../../src/lib/server/database/TrustPersistenceService.js";
import { TrustGraphService } from "../../src/lib/server/database/TrustGraphService.js";
import { getPostgresPool } from "../../src/lib/server/database/PostgresPool.js";

let pool;
let userA;
let userB;

before(async () => {
  if (!process.env.DATABASE_URL) return;
  pool = getPostgresPool();
  userA = crypto.randomUUID();
  userB = crypto.randomUUID();
  await pool.query(
    "insert into auth.users(id, aud, role, email, created_at, updated_at) values " +
      "($1,'authenticated','authenticated',$2,now(),now())," +
      "($3,'authenticated','authenticated',$4,now(),now())",
    [userA, `phase5-a-${userA}@example.test`, userB, `phase5-b-${userB}@example.test`],
  );
});

after(async () => {
  if (!pool) return;
  try {
    await pool.query("delete from auth.users where id=any($1::uuid[])", [[userA, userB]]);
  } catch {}
  try {
    await pool.end();
  } catch {}
});

test("PHASE 5 LIVE GATE: Evidence Passport hash integrity, tamper detection, and deterministic TrustGraph", async () => {
  if (!process.env.DATABASE_URL) {
    console.log("DATABASE_URL not configured, skipping live gate test");
    return;
  }
  if (!userA || !userB) {
    console.log("Synthetic staging identities were not provisioned, skipping live gate test");
    return;
  }
  const pool = getPostgresPool();

  const caseId = crypto.randomUUID();
  const repo = new PostgresCrossSystemRepository();

  let passportId = null;

  try {
    // 1. Create Trust Case with entities, evidence, and claims in DB
    const pipelineResult = {
      verificationId: caseId,
      state: "BLOCK",
      decision: {
        verdict: "BLOCK",
        confidence: 0.97,
        reasons: ["Phát hiện hành vi mạo danh cơ quan tuyển sinh quốc tế."],
      },
      layers: {
        layer2: {
          id: crypto.randomUUID(),
          classification: "MALICIOUS",
          confidence: 0.95,
          claims: [
            { statement: "Cấp học bổng toàn phần không cần hồ sơ", status: "CONTRADICTED" },
          ],
          entities: [
            { type: "ORGANIZATION", value: "Tổ chức lừa đảo cấp học bổng", role: "IMPERSONATOR", confidence: 0.98 },
          ],
        },
        layer3: {
          sources: [
            { title: "Cảnh báo chính thức Bộ GD&ĐT", url: "https://moet.gov.vn/canh-bao-gia-mao" },
          ],
        },
      },
    };

    const input = {
      type: "url",
      content: "https://fake-scholarship-trap.edu.vn",
    };

    // Persist case
    await TrustPersistenceService.recordTrustExecution({
      pipelineResult,
      input,
      principal: { subjectId: `user:${userA}` },
      requestId: `req_p5_${Date.now()}`,
    });

    // 2. Passport Created
    const existingList = await repo.listPassports(userA);
    const listed = existingList.find((p) => p.subjectType === "TRUST_CASE" && p.subjectId === caseId);
    assert.ok(listed, "Evidence Passport created and bound to Trust Case");
    passportId = listed.id;
    assert.equal(listed.ownerId, userA);

    // Load full passport with events
    const fullPassport = await repo.getPassport(userA, passportId);
    assert.equal(fullPassport.events.length, 1, "Initial creation event exists");

    // 3. Passport Revision Append
    const updatedPassport = appendEvidenceEvent(fullPassport, {
      id: `${passportId}:expert_verified`,
      type: PASSPORT_EVENT_TYPE.EXPERT_REVIEW,
      provenanceClass: PROVENANCE_CLASS.EXPERT,
      summary: "Chuyên gia độc lập đối chiếu và xác nhận trang web lừa đảo.",
      occurredAt: new Date().toISOString(),
      previousStatus: fullPassport.currentStatus,
      newStatus: fullPassport.currentStatus,
      material: false,
      changeReason: "Thẩm định chuyên gia độc lập",
    });

    const savedUpdated = await repo.appendPassportEvent(userA, updatedPassport);
    assert.equal(savedUpdated.revision, fullPassport.revision + 1, "Revision increments monotonically");
    assert.equal(savedUpdated.events.length, 2, "2 events appended");

    // 4. Tamper Detection
    const integrityCheck = verifyPassportIntegrity(savedUpdated);
    assert.equal(integrityCheck.valid, true, "Untampered passport passes integrity check");

    // Simulate tampering with an event's summary
    const tamperedPassport = JSON.parse(JSON.stringify(savedUpdated));
    tamperedPassport.events[0].metadata.hash = "tampered_fake_hash_123456";
    const tamperResult = verifyPassportIntegrity(tamperedPassport);
    assert.equal(tamperResult.valid, false, "Tampered event detected");
    assert.equal(tamperResult.reason, "TAMPER_DETECTED");

    // 5. Cross-User Passport Denied
    const userBList = await repo.listPassports(userB);
    const userBAccess = userBList.find((p) => p.id === passportId);
    assert.equal(userBAccess, undefined, "User B cannot see User A's passport in listing");

    // 6. Deterministic TrustGraph Rebuild & Edge Verification
    const graphA = await TrustGraphService.buildGraphForCase(caseId);
    const graphB = await TrustGraphService.rebuildGraphForCase(caseId);

    assert.ok(graphA.nodes.length >= 3, "Graph contains case, input, entities, and evidence nodes");
    assert.deepEqual(graphA, graphB, "Graph rebuild is byte-for-byte deterministic");

    // 7. Supports / Contradicts Preserved & No Orphan Edges
    const nodeIds = new Set(graphA.nodes.map((n) => n.id));
    for (const edge of graphA.edges) {
      assert.ok(nodeIds.has(edge.from), `Edge source node ${edge.from} must exist in graph`);
      assert.ok(nodeIds.has(edge.to), `Edge target node ${edge.to} must exist in graph`);
    }

    // 8. DB Health check
    const dbCheck = await pool.query("SELECT 1 as live");
    assert.equal(dbCheck.rows[0].live, 1, "Database remains healthy");

  } finally {
    if (passportId) {
      await pool.query(`DELETE FROM public.notifications WHERE subject_id = $1`, [passportId]);
      await pool.query(`DELETE FROM public.evidence_passports WHERE id = $1`, [passportId]);
    }
    await pool.query(`DELETE FROM private.audit_events WHERE target_id = $1`, [caseId]);
    await pool.query(`DELETE FROM public.case_inputs WHERE case_id = $1`, [caseId]);
    await pool.query(`DELETE FROM public.evidence WHERE case_id = $1`, [caseId]);
    await pool.query(`DELETE FROM public.case_entities WHERE case_id = $1`, [caseId]);
    await pool.query(`DELETE FROM public.trust_cases WHERE id = $1`, [caseId]);
    await pool.query(`DELETE FROM public.claims WHERE creator_id = $1`, [userA]);
  }
});
