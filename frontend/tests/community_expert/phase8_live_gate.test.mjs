import test, { after } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { CommunityRepository } from "../../src/lib/server/database/CommunityRepository.js";
import { ExpertRepository } from "../../src/lib/server/database/ExpertRepository.js";
import { getPostgresPool } from "../../src/lib/server/database/PostgresPool.js";

after(async () => {
  if (process.env.DATABASE_URL) {
    try {
      await getPostgresPool().end();
    } catch {}
  }
});

test("PHASE 8 LIVE GATE: Community & Expert scoped authority, verification, and Trust case binding", async () => {
  if (!process.env.DATABASE_URL) {
    console.log("DATABASE_URL not configured, skipping live gate test");
    return;
  }
  const pool = getPostgresPool();
  const userRes = await pool.query(`SELECT id FROM auth.users LIMIT 2`);
  if (userRes.rows.length === 0) {
    console.log("No users in auth.users, skipping live gate test");
    return;
  }
  const userA = userRes.rows[0].id;
  const userB = userRes.rows[1]?.id || crypto.randomUUID();

  const caseId = crypto.randomUUID();
  let postId = null;

  try {
    // 1. Create a Trust case and Evidence Passport to attach assessments and follows
    await pool.query(
      `INSERT INTO public.trust_cases (id, owner_id, state, visibility)
       VALUES ($1, $2, 'SUSPICIOUS', 'PUBLIC')`,
      [caseId, userA]
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
    });
    assert.ok(assessment.id, "Assessment successfully submitted");

    // 6. Scoped Authority: Submit assessment in UNVERIFIED domain -> Must FAIL
    await assert.rejects(
      async () => ExpertRepository.submitAssessment({
        expertId: userA,
        caseId,
        domainCode: "ACADEMIC_INTEGRITY", // Not verified
        assessment: { analysis: "Unverified opinion" },
      }),
      /UNVERIFIED_EXPERT_DOMAIN/,
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
    await pool.query(`DELETE FROM public.evidence_passports WHERE subject_id = $1`, [caseId]);
    await pool.query(`DELETE FROM private.reputation_events WHERE user_id = $1`, [userA]);
    await pool.query(`DELETE FROM public.expert_assessments WHERE case_id = $1`, [caseId]);
    await pool.query(`DELETE FROM private.expert_verifications WHERE user_id = $1`, [userA]);
    await pool.query(`DELETE FROM public.expert_profiles WHERE user_id = $1`, [userA]);
    await pool.query(`DELETE FROM public.trust_cases WHERE id = $1`, [caseId]);
  }
});
