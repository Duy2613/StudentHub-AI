import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

import { TokenValidator } from "../../src/lib/security/identity/TokenValidator.js";

const testDir = dirname(fileURLToPath(import.meta.url));
const frontendRoot = join(testDir, "..", "..");
const nextBin = join(frontendRoot, "node_modules", "next", "dist", "bin", "next");

async function reservePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => resolve(address.port));
    });
  });
}

async function waitUntilReady(baseUrl, processOutput, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/api/intelligence/social/sources`);
      if (response.status < 500) return;
    } catch {
      // Server has not bound its socket yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Next.js test server did not become ready.\n${processOutput()}`);
}

test("P0 runtime routes enforce auth and never regress to handler 500s", { timeout: 90_000 }, async () => {
  const port = await reservePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const output = [];
  const server = spawn(process.execPath, [nextBin, "dev", "--hostname", "127.0.0.1", "--port", String(port)], {
    cwd: frontendRoot,
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1", STUDENTHUB_PERSISTENCE_ADAPTER: "memory" },
    stdio: ["ignore", "pipe", "pipe"]
  });

  server.stdout.on("data", (chunk) => output.push(chunk.toString()));
  server.stderr.on("data", (chunk) => output.push(chunk.toString()));

  try {
    await waitUntilReady(baseUrl, () => output.join(""));

    const anonymousCases = [
      ["GET", "/api/personalization/briefing", 401],
      ["GET", "/api/personalization/goals", 401],
      ["POST", "/api/personalization/goals", 401],
      ["GET", "/api/personalization/memory", 401],
      ["POST", "/api/personalization/memory", 401],
      ["GET", "/api/intelligence/social/sources", 200],
      ["GET", "/api/intelligence/social/signals", 200],
      ["POST", "/api/intelligence/social/signals", 401],
      ["POST", "/api/intelligence/social/sync", 401],
      ["GET", "/api/intelligence/social/early-warnings", 200],
      ["GET", "/api/academic/command-center", 401],
      ["GET", "/api/student/records?studentId=24110001", 401],
      ["GET", "/api/academic/notifications", 401],
      ["POST", "/api/academic/notifications", 401],
      ["POST", "/api/academic/me/discrepancy-report", 401],
      ["POST", "/api/academic/me/decision-studio", 401],
      ["POST", "/api/academic/me/decision-studio/adopt", 401],
      ["GET", "/api/academic/me/execution", 401],
      ["POST", "/api/academic/me/execution/reconcile", 401],
      ["POST", "/api/academic/me/planner", 401],
      ["GET", "/api/academic/me/roadmap", 401],
      ["POST", "/api/academic/me/simulate", 401],
      ["GET", "/api/academic/tasks/nonexistent", 401],
      ["POST", "/api/academic/tasks/nonexistent", 401],
      ["GET", "/api/personalization/search?q=academic", 401],
      ["GET", "/api/personalization/digital-twin", 401],
      ["POST", "/api/personalization/reset", 401],
      ["GET", "/api/personalization/preferences", 401],
      ["POST", "/api/personalization/preferences", 401],
      ["GET", "/api/personalization/devices", 401],
      ["POST", "/api/personalization/devices", 401],
      ["POST", "/api/personalization/devices/revoke", 401],
      ["GET", "/api/personalization/command-center", 401],
      ["GET", "/api/intelligence/recommendations", 401],
      ["POST", "/api/forum/posts", 401],
      ["PATCH", "/api/forum/posts", 401],
      ["POST", "/api/forum/vote", 401],
      ["POST", "/api/intelligence/community/posts", 401],
      ["POST", "/api/intelligence/community/feedback", 401],
      ["POST", "/api/intelligence/experts/EXP_DR_MINH_AI/claims", 401],
      ["POST", "/api/intelligence/experts/resolve", 401],
      ["POST", "/api/ai/trust/evaluate", 401],
      ["POST", "/api/chat", 401],
      ["POST", "/api/intelligence/fusion/evaluate", 401],
      ["GET", "/api/not-allowlisted", 404],
      ["POST", "/api/not-allowlisted", 404],
      ["POST", "/api/marketplace/items", 401],
      ["POST", "/api/prof-rating/reviews", 401],
      ["POST", "/api/quests/daily", 401],
      ["POST", "/api/safety-map/reports", 401],
      ["GET", "/api/users/profile?email=student.hust@sis.hust.edu.vn", 401],
      ["PUT", "/api/users/profile", 401],
      ["POST", "/api/users/verify-edu", 401]
    ];

    for (const [method, path, expectedStatus] of anonymousCases) {
      const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers: method === "POST" || method === "PUT" ? { "content-type": "application/json" } : undefined,
        body: method === "POST" || method === "PUT" ? "{}" : undefined
      });
      assert.strictEqual(response.status, expectedStatus, `${method} ${path}`);
      assert.notStrictEqual(response.status, 500, `${method} ${path} must not return 500`);
    }

    const token = new TokenValidator().signToken({
      sub: "student:24110001",
      email: "p0.student@studenthub.test",
      roles: ["student"],
      scopes: ["academic:read", "academic:plan"]
    });
    const authHeaders = { Authorization: `Bearer ${token}` };

    const unavailableServerOcr = await fetch(`${baseUrl}/api/ai-trust/ocr`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ imageBase64: "ZmFrZQ==", mimeType: "image/png" })
    });
    assert.strictEqual(unavailableServerOcr.status, 501);
    assert.strictEqual((await unavailableServerOcr.json()).status, "SERVER_OCR_NOT_CONFIGURED");

    const clientOcrHint = await fetch(`${baseUrl}/api/ai-trust/ocr`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        mimeType: "image/png",
        clientHints: { preExtractedText: "Thanh toán vào 0123456789" }
      })
    });
    assert.strictEqual(clientOcrHint.status, 200);
    const clientOcrBody = await clientOcrHint.json();
    assert.strictEqual(clientOcrBody.extractionMode, "CLIENT_OCR_HINT");
    assert.strictEqual(clientOcrBody.confidence, null);

    for (const path of ["/api/academic/command-center", "/api/student/records"]) {
      const response = await fetch(`${baseUrl}${path}`, { headers: authHeaders });
      assert.strictEqual(response.status, 200, `Own-resource request failed: ${path}`);
    }

    for (const path of [
      "/api/academic/command-center?studentId=24110002",
      "/api/student/records?studentId=24110002",
      "/api/personalization/digital-twin?studentId=24110002",
      "/api/personalization/command-center?studentId=24110002",
      "/api/intelligence/recommendations?studentId=24110002"
    ]) {
      const response = await fetch(`${baseUrl}${path}`, { headers: authHeaders });
      assert.strictEqual(response.status, 403, `Cross-student request was not blocked: ${path}`);
    }

    const profileUpdate = await fetch(`${baseUrl}/api/users/profile`, {
      method: "PUT",
      headers: { ...authHeaders, "content-type": "application/json" },
      body: JSON.stringify({
        email: "p0.student@studenthub.test",
        fullName: "P0 Student",
        role: "expert",
        trustScore: 999,
        universityEmailVerified: true,
        expertField: "Self appointed"
      })
    });
    assert.strictEqual(profileUpdate.status, 200);
    const profileBody = await profileUpdate.json();
    assert.strictEqual(profileBody.profile.role, "student");
    assert.strictEqual(profileBody.profile.trustScore, 50);
    assert.strictEqual(profileBody.profile.universityEmailVerified, false);
    assert.strictEqual(profileBody.profile.expertField, undefined);

    const crossProfile = await fetch(`${baseUrl}/api/users/profile?email=other@studenthub.test`, {
      headers: authHeaders
    });
    assert.strictEqual(crossProfile.status, 403);

    const forumPost = await fetch(`${baseUrl}/api/forum/posts`, {
      method: "POST",
      headers: { ...authHeaders, "content-type": "application/json" },
      body: JSON.stringify({
        title: "Cảnh báo kiểm thử quyền tác giả",
        content: "Nội dung kiểm thử đủ dài để xác nhận máy chủ không tin danh tính và điểm uy tín do trình duyệt gửi lên.",
        authorId: "expert:forged",
        authorName: "Forged Expert",
        authorTrustScore: 100
      })
    });
    assert.strictEqual(forumPost.status, 201);
    const forumPostBody = await forumPost.json();
    assert.strictEqual(forumPostBody.post.authorId, "student:24110001");
    assert.strictEqual(forumPostBody.post.authorTrustScore, 50);
    assert.strictEqual(forumPostBody.post.trustScoreSource, "SERVER_UNASSESSED_BASELINE");

    const marketplacePost = await fetch(`${baseUrl}/api/marketplace/items`, {
      method: "POST",
      headers: { ...authHeaders, "content-type": "application/json" },
      body: JSON.stringify({
        title: "Giáo trình kiểm thử authority",
        price: 100000,
        campusLocation: "HCMUTE",
        description: "Mục kiểm thử không cho trình duyệt tự gán vai trò, xác minh hoặc điểm tín nhiệm.",
        sellerName: "Forged Admin",
        sellerRole: "admin",
        sellerTrustScore: 100,
        sellerEduVerified: true
      })
    });
    assert.strictEqual(marketplacePost.status, 201);
    const marketplaceBody = await marketplacePost.json();
    assert.strictEqual(marketplaceBody.item.sellerId, "student:24110001");
    assert.strictEqual(marketplaceBody.item.sellerRole, "student");
    assert.strictEqual(marketplaceBody.item.sellerTrustScore, null);
    assert.strictEqual(marketplaceBody.item.sellerEduVerified, false);
    assert.strictEqual(marketplaceBody.item.verifiedSafetyLevel, "UNASSESSED");

    const safetyPost = await fetch(`${baseUrl}/api/safety-map/reports`, {
      method: "POST",
      headers: { ...authHeaders, "content-type": "application/json" },
      body: JSON.stringify({
        title: "Báo cáo kiểm thử authority",
        address: "HCMUTE",
        description: "Báo cáo thử nghiệm phải chờ kiểm duyệt và không được tự nhận là cảnh báo đã xác minh.",
        severity: "CRITICAL",
        authorName: "Forged Expert",
        authorRole: "expert",
        authorTrustScore: 100
      })
    });
    assert.strictEqual(safetyPost.status, 201);
    const safetyBody = await safetyPost.json();
    assert.strictEqual(safetyBody.report.authorId, "student:24110001");
    assert.strictEqual(safetyBody.report.authorRole, "student");
    assert.strictEqual(safetyBody.report.authorTrustScore, null);
    assert.strictEqual(safetyBody.report.severity, "UNDER_REVIEW");
    assert.strictEqual(safetyBody.report.status, "PENDING_REVIEW");

    const professorReview = await fetch(`${baseUrl}/api/prof-rating/reviews`, {
      method: "POST",
      headers: { ...authHeaders, "content-type": "application/json" },
      body: JSON.stringify({
        professorId: "prof-01",
        rating: 4,
        comment: "Giảng viên giải thích rõ và cung cấp tài liệu có cấu trúc.",
        studentRole: "Administrator"
      })
    });
    assert.strictEqual(professorReview.status, 201);
    const professorReviewBody = await professorReview.json();
    assert.strictEqual(professorReviewBody.review.authorId, "student:24110001");
    assert.strictEqual(professorReviewBody.review.studentRole, "STUDENT");

    const questPost = await fetch(`${baseUrl}/api/quests/daily`, {
      method: "POST",
      headers: { ...authHeaders, "content-type": "application/json" },
      body: JSON.stringify({ questId: "quest-01" })
    });
    assert.strictEqual(questPost.status, 200);
    const questBody = await questPost.json();
    assert.strictEqual(questBody.rewardPoints, 0);
    assert.strictEqual(questBody.submission.actorId, "student:24110001");
    assert.strictEqual(questBody.submission.status, "PENDING_VERIFICATION");

    const unverifiedEduToken = new TokenValidator().signToken({
      sub: "student:24110001",
      email: "24110001@student.hcmute.edu.vn",
      email_verified: false,
      roles: ["student"],
      scopes: ["academic:read"]
    });
    const unverifiedEdu = await fetch(`${baseUrl}/api/users/verify-edu`, {
      method: "POST",
      headers: { Authorization: `Bearer ${unverifiedEduToken}`, "content-type": "application/json" },
      body: JSON.stringify({ email: "24110001@student.hcmute.edu.vn" })
    });
    assert.strictEqual(unverifiedEdu.status, 409);
    assert.strictEqual((await unverifiedEdu.json()).verificationStatus, "MAILBOX_VERIFICATION_REQUIRED");

    const verifiedEduToken = new TokenValidator().signToken({
      sub: "student:24110001",
      email: "24110001@student.hcmute.edu.vn",
      email_verified: true,
      roles: ["student"],
      scopes: ["academic:read"]
    });
    const verifiedEdu = await fetch(`${baseUrl}/api/users/verify-edu`, {
      method: "POST",
      headers: { Authorization: `Bearer ${verifiedEduToken}`, "content-type": "application/json" },
      body: JSON.stringify({ email: "24110001@student.hcmute.edu.vn" })
    });
    assert.strictEqual(verifiedEdu.status, 200);
    const verifiedEduBody = await verifiedEdu.json();
    assert.strictEqual(verifiedEduBody.verificationStatus, "VERIFIED_INSTITUTION_EMAIL");
    assert.strictEqual(verifiedEduBody.trustScoreDelta, undefined);
    assert.strictEqual(verifiedEduBody.newTrustScore, undefined);
  } finally {
    server.kill();
    await Promise.race([
      new Promise((resolve) => server.once("exit", resolve)),
      new Promise((resolve) => setTimeout(resolve, 5_000))
    ]);
  }
});
