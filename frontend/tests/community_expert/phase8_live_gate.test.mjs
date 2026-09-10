import test, { after } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { CommunityRepository } from "../../src/lib/server/database/CommunityRepository.js";
import { ExpertRepository } from "../../src/lib/server/database/ExpertRepository.js";
import { getPostgresPool } from "../../src/lib/server/database/PostgresPool.js";
import { configureDisposableDatabase, disposableLiveGate } from "../helpers/disposableDbGuard.mjs";

const disposableDatabaseUrl = configureDisposableDatabase();
const liveGate = disposableLiveGate();

after(async () => {
  if (disposableDatabaseUrl) await getPostgresPool().end();
});

test("PHASE 8 LIVE GATE: Community & Expert scoped authority, verification, and Trust case binding", liveGate, async () => {
  const pool = getPostgresPool();
  const userA = crypto.randomUUID();
  const userB = crypto.randomUUID();

  const caseId = crypto.randomUUID();
  const runId = crypto.randomUUID();
  const evidenceId = crypto.randomUUID();
  let postId = null;

  try {
    await pool.query(
      `INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
       VALUES ($1, 'authenticated', 'authenticated', $2, now(), now()),
              ($3, 'authenticated', 'authenticated', $4, now(), now())`,
      [userA, `phase8-expert-${userA}@studenthub.test`, userB, `phase8-coordinator-${userB}@studenthub.test`]
    );
    await pool.query(
      `INSERT INTO private.user_roles (user_id, role_id)
       SELECT $1, id FROM private.roles WHERE code = 'ADMIN'`,
      [userB]
    );

    // 1. Create a Trust case and Evidence Passport to attach assessments and follows
    await pool.query(
      `INSERT INTO public.trust_cases (id, owner_id, state, visibility)
       VALUES ($1, $2, 'SUSPICIOUS', 'PUBLIC')`,
      [caseId, userA]
    );
    await pool.query(
      `INSERT INTO public.trust_runs (id, case_id, owner_id, status, pipeline_version, started_at)
       VALUES ($1, $2, $3, 'COMPLETED', 'trust.v5.phase8', now())`,
      [runId, caseId, userA]
    );
    await pool.query(
      `INSERT INTO public.trust_case_revisions (case_id, owner_id, revision, run_id, state, snapshot)
       VALUES ($1, $2, 1, $3, 'SUSPICIOUS', '{"source":"phase8-live-fixture"}'::jsonb)`,
      [caseId, userA, runId]
    );
    await pool.query(
      `INSERT INTO public.evidence (id, case_id, source_type, source_identifier, observed_at, confidence, provenance)
       VALUES ($1, $2, 'OFFICIAL_SOURCE', 'https://cert.example.org/phase8', now(), 0.95, '{"class":"OFFICIAL"}'::jsonb)`,
      [evidenceId, caseId]
    );

    const passportId = crypto.randomUUID();
    await pool.query(
      `INSERT INTO public.evidence_passports (id, owner_id, title, subject_type, subject_id, current_status)
       VALUES ($1, $2, 'Test Passport', 'TRUST_CASE', $3, 'SUPPORTED')`,
      [passportId, userA, caseId]
    );

    // 2. Community: Create post and comment
    const post = await CommunityRepository.createPost({
      authorId: userA,
      title: "Cảnh báo học bổng trao tay đáng ngờ",
      content: "Mọi người cẩn thận với thông tin tuyển sinh cấp tốc yêu cầu chuyển tiền cọc!",
      published: true,
    });
    assert.ok(post.id, "Community post created");
    postId = post.id;
    assert.equal(post.author_id, userA);

    const comment = await CommunityRepository.addComment({
      postId,
      authorId: userB,
      body: "Cảm ơn bạn đã chia sẻ, mình cũng suýt bị lừa!",
    });
    assert.ok(comment.id, "Comment added");
    assert.equal(comment.author_id, userB);

    // Vote on post
    const vote = await CommunityRepository.votePost({
      userId: userB,
      postId,
      value: 1,
    });
    assert.equal(vote.value, 1, "Upvote recorded");

    // Case / Passport follow
    const follow = await CommunityRepository.followPassport({
      ownerId: userB,
      passportId,
    });
    assert.equal(follow.passport_id, passportId);

    // 3. Expert Network: Upsert Expert Profile
    const profile = await ExpertRepository.upsertProfile({
      userId: userA,
      publicTitle: "Giảng viên - Chuyên gia An toàn Thông tin",
      publicBio: "Nghiên cứu viên an ninh mạng giáo dục",
    });
    assert.equal(profile.user_id, userA);

    // 4. Server-Controlled Domain Verification
    // Verify userA in CYBERSECURITY domain
    await ExpertRepository.setDomainVerification({
      userId: userA,
      domainCode: "CYBERSECURITY",
      status: "VERIFIED",
      verifiedBy: userB,
      evidenceRef: "https://cert.example.org/verify/123",
    });

    const verifiedDomains = await ExpertRepository.getVerifiedDomains(userA);
    assert.ok(verifiedDomains.includes("CYBERSECURITY"), "CYBERSECURITY domain verified");

    const assignment = await ExpertRepository.createAssignment({
      assignedBy: userB,
      expertId: userA,
      caseId,
      caseRevision: 1,
      domainCode: "CYBERSECURITY",
      idempotencyKey: `phase8-assignment-${caseId}`,
    });
    assert.ok(assignment.id, "Case revision assigned by an independent coordinator");

    // 5. Scoped Authority: Submit assessment in verified domain
    const assessment = await ExpertRepository.submitAssessment({
      expertId: userA,
      caseId,
      domainCode: "CYBERSECURITY",
      assessment: {
        analysis: "Trang web chứa mã độc chuyển hướng và form thu thập thẻ tín dụng giả mạo.",
        recommendedAction: "BLOCK",
      },
      confidence: 0.96,
      assignmentId: assignment.id,
      caseRevision: 1,
      evidenceRevisionIds: [evidenceId],
      coiDeclared: true,
      idempotencyKey: `phase8-assessment-${caseId}`,
    });
    assert.ok(assessment.id, "Assessment successfully submitted");

    // 6. Scoped Authority: Submit assessment in UNVERIFIED domain -> Must FAIL
    await assert.rejects(
      async () => ExpertRepository.submitAssessment({
        expertId: userA,
        caseId,
        domainCode: "ACADEMIC_INTEGRITY", // Not verified
        assessment: { analysis: "Unverified opinion" },
        assignmentId: assignment.id,
        caseRevision: 1,
        evidenceRevisionIds: [evidenceId],
        coiDeclared: true,
        idempotencyKey: `phase8-unverified-${caseId}`,
      }),
      (error) => error?.code === "UNVERIFIED_EXPERT_DOMAIN",
      "Expert cannot issue assessments in unverified domains"
    );

    // 7. Case-level Assessment Retrieval
    const caseAssessments = await ExpertRepository.getAssessmentsForCase(caseId);
    assert.equal(caseAssessments.length, 1);
    assert.equal(caseAssessments[0].domain_code, "CYBERSECURITY");
    assert.equal(caseAssessments[0].public_title, "Giảng viên - Chuyên gia An toàn Thông tin");

  } finally {
    if (postId) {
      await pool.query(`DELETE FROM public.votes WHERE post_id = $1`, [postId]);
      await pool.query(`DELETE FROM public.comments WHERE post_id = $1`, [postId]);
      await pool.query(`DELETE FROM public.posts WHERE id = $1`, [postId]);
    }
    await pool.query(`DELETE FROM public.case_follows WHERE owner_id = $1`, [userB]);
    // The assessment, assignment, verification, and Trust lineage are
    // intentionally immutable/append-only. Do not cascade-delete them (or
    // their identities) during cleanup; reset the disposable database between
    // full assurance runs when a clean fixture is required.
  }
});
