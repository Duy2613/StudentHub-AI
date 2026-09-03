import test, { after } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { TrustCasePassportBinder } from "../../src/lib/intelligence/passport/TrustCasePassportBinder.js";
import { PostgresCrossSystemRepository } from "../../src/lib/intelligence/crossSystem/PostgresCrossSystemRepository.js";
import { getPostgresPool } from "../../src/lib/server/database/PostgresPool.js";

after(async () => {
  await getPostgresPool().end();
});

test("TrustCasePassportBinder: Creates durable Passport bound to Trust Case for authenticated owner", async () => {
  const pool = getPostgresPool();
  const userRes = await pool.query(`SELECT id FROM auth.users LIMIT 1`);
  if (userRes.rows.length === 0) {
    console.log("No users in auth.users, skipping live binding test");
    return;
  }
  const realUserId = userRes.rows[0].id;
  const caseId = crypto.randomUUID();

  // First create a trust_case to satisfy foreign key if needed
  await pool.query(
    `INSERT INTO public.trust_cases (id, owner_id, state, visibility) VALUES ($1, $2, 'BLOCK', 'PRIVATE')`,
    [caseId, realUserId]
  );

  let passportId = null;

  try {
    const pipelineResult = {
      verificationId: caseId,
      state: "BLOCK",
      decision: {
        verdict: "BLOCK",
        confidence: 0.98,
        reasons: ["Xác nhận trang giả mạo tuyển sinh quốc tế."],
      },
      layers: {
        layer3: {
          sources: [
            { title: "Cổng thông tin Bộ GD&ĐT", url: "https://moet.gov.vn" },
          ],
        },
      },
    };

    const input = {
      type: "url",
      content: "https://fake-scholarship-admission.com",
    };

    // 1. Initial bind
    const passport = await TrustCasePassportBinder.bindCaseToPassport({
      caseId,
      ownerId: realUserId,
      pipelineResult,
      input,
    });

    assert.ok(passport, "Passport created");
    passportId = passport.id;
    assert.equal(passport.ownerId, realUserId);
    assert.equal(passport.subjectType, "TRUST_CASE");
    assert.equal(passport.subjectId, caseId);
    assert.equal(passport.currentStatus, "DANGEROUS");
    assert.equal(passport.revision, 1);
    assert.equal(passport.events.length, 1);

    // 2. Re-bind with updated status (e.g. status changes to SUPPORTED after resolution)
    const updatedPipeline = {
      verificationId: caseId,
      state: "CLEAR",
      decision: {
        verdict: "CLEAR",
        confidence: 0.95,
        reasons: ["Đơn vị tổ chức đã xác thực danh tính chính thức."],
      },
      layers: {
        layer3: {
          sources: [
            { title: "Thông báo đính chính", url: "https://moet.gov.vn/update" },
          ],
        },
      },
    };

    const updatedPassport = await TrustCasePassportBinder.bindCaseToPassport({
      caseId,
      ownerId: realUserId,
      pipelineResult: updatedPipeline,
      input,
    });

    assert.equal(updatedPassport.currentStatus, "SUPPORTED");
    assert.equal(updatedPassport.revision, 2);
    assert.equal(updatedPassport.events.length, 2);

    // 3. Verify notification row in public.notifications
    const notifRes = await pool.query(
      `SELECT * FROM public.notifications WHERE owner_id = $1 AND subject_id = $2`,
      [realUserId, passportId]
    );
    assert.ok(notifRes.rows.length > 0, "Material change notification created in DB");

  } finally {
    if (passportId) {
      await pool.query(`DELETE FROM public.notifications WHERE subject_id = $1`, [passportId]);
      await pool.query(`DELETE FROM public.evidence_passports WHERE id = $1`, [passportId]);
    }
    await pool.query(`DELETE FROM public.trust_cases WHERE id = $1`, [caseId]);
  }
});
