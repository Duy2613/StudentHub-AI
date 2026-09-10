import { expect, test } from "@playwright/test";
import { createRequire } from "node:module";
import { EvidencePassportService } from "../../src/lib/server/trust/EvidencePassportService.js";

const requireFromFrontend = createRequire(new URL("../../package.json", import.meta.url));

const candidateEmail = process.env.STUDENTHUB_LOCAL_CANDIDATE_EMAIL || "";
const candidatePassword = process.env.STUDENTHUB_LOCAL_CANDIDATE_PASSWORD || "";
const reviewerEmail = process.env.STUDENTHUB_LOCAL_REVIEWER_EMAIL || "";
const reviewerPassword = process.env.STUDENTHUB_LOCAL_REVIEWER_PASSWORD || "";
const reactorEmail = process.env.STUDENTHUB_LOCAL_REACTOR_EMAIL || "";
const reactorPassword = process.env.STUDENTHUB_LOCAL_REACTOR_PASSWORD || "";
const primaryCaseId = process.env.STUDENTHUB_LOCAL_PRIMARY_CASE_ID || "";
const primaryEvidenceId = process.env.STUDENTHUB_LOCAL_PRIMARY_EVIDENCE_ID || "";
const mainCloudHosts = new Set((process.env.STUDENTHUB_MAIN_CLOUD_HOSTS || "")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean));

const correctAnswers: Record<string, string> = {
  "scope-boundary-01": "b",
  "evidence-uncertainty-01": "c",
  "conflict-disclosure-01": "a",
  "source-provenance-01": "b",
  "hard-negative-01": "c",
  "domain-limit-01": "d",
  "appeal-trace-01": "b",
};

function requireFixture(value: string, name: string) {
  if (!value) throw new Error(`LOCAL_E2E_FIXTURE_MISSING:${name}`);
  return value;
}

function isCloudHost(hostname: string) {
  const host = hostname.toLowerCase();
  return mainCloudHosts.has(host)
    || host.endsWith(".supabase.co")
    || host.endsWith(".supabase.com");
}

async function installBrowserNetworkGuard(context: import("@playwright/test").BrowserContext) {
  const violations: string[] = [];
  await context.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (isCloudHost(url.hostname)) {
      violations.push(url.hostname.toLowerCase());
      await route.abort("blockedbyclient");
      return;
    }
    await route.continue();
  });
  return violations;
}

type ApiRecord = Record<string, unknown>;
type ApiResult = { status: number; body: unknown };

function asRecord(value: unknown): ApiRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as ApiRecord : {};
}

function asRecords(value: unknown): ApiRecord[] {
  return Array.isArray(value) ? value.map(asRecord) : [];
}

async function api(page: import("@playwright/test").Page, path: string, options: { method?: string; body?: unknown; headers?: Record<string, string> } = {}): Promise<ApiResult> {
  return page.evaluate(async ({ path: requestPath, method, body, headers }) => {
    const response = await fetch(requestPath, {
      method,
      credentials: "include",
      headers: {
        accept: "application/json",
        ...(body === undefined ? {} : { "content-type": "application/json" }),
        ...(headers || {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const responseBody = await response.json().catch(() => null);
    return { status: response.status, body: responseBody };
  }, { path, method: options.method || "GET", body: options.body, headers: options.headers || {} });
}

function errorCode(result: ApiResult) {
  const body = asRecord(result.body);
  const error = asRecord(body.error);
  return error.code || body.code || null;
}

function assertApi(result: ApiResult, expectedStatus = 200) {
  const body = asRecord(result.body);
  expect(result.status, `unexpected API status (${errorCode(result) || "no-code"})`).toBe(expectedStatus);
  expect(body.success, `API did not return success (${errorCode(result) || "no-code"})`).toBe(true);
}

async function login(page: import("@playwright/test").Page, email: string, password: string, next: string) {
  await page.goto(`/login?next=${encodeURIComponent(next)}`, { waitUntil: "domcontentloaded" });
  // The production auth fields intentionally start readOnly until a real
  // pointer/focus interaction enables them. Use the same interaction path a
  // human user takes before asserting editability and filling the values.
  const emailInput = page.getByLabel("Email", { exact: true });
  const passwordInput = page.getByLabel("Mật khẩu", { exact: true });
  await expect.poll(async () => {
    if (await emailInput.isEditable()) return true;
    await emailInput.click();
    return emailInput.isEditable();
  }, { timeout: 30_000, intervals: [100, 250, 500] }).toBe(true);
  await emailInput.fill(email);
  await expect.poll(async () => {
    if (await passwordInput.isEditable()) return true;
    await passwordInput.click();
    return passwordInput.isEditable();
  }, { timeout: 30_000, intervals: [100, 250, 500] }).toBe(true);
  await passwordInput.fill(password);
  const authRequestHosts = new Set<string>();
  page.on("request", (request) => {
    if (!request.url().includes("/auth/v1/token")) return;
    try { authRequestHosts.add(new URL(request.url()).hostname.toLowerCase()); } catch {}
  });
  const authResponsePromise = page.waitForResponse(
    (response) => response.url().includes("/auth/v1/token"),
    { timeout: 20_000 },
  ).catch(() => null);
  const exchangeResponsePromise = page.waitForResponse(
    (response) => response.url().endsWith("/api/auth/session/exchange"),
    { timeout: 20_000 },
  ).catch(() => null);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  const authResponse = await authResponsePromise;
  if (!authResponse) throw new Error(`LOCAL_AUTH_TOKEN_RESPONSE_MISSING:${[...authRequestHosts].join(",") || "NO_TOKEN_REQUEST"}`);
  const authBody = await authResponse.json().catch(() => ({}));
  if (!authResponse.ok()) {
    throw new Error(`LOCAL_AUTH_TOKEN_FAILED_${authResponse.status()}:${authBody.error_code || authBody.code || authBody.msg || "UNKNOWN"}`);
  }
  const exchangeResponse = await exchangeResponsePromise;
  if (!exchangeResponse) throw new Error("LOCAL_SESSION_EXCHANGE_RESPONSE_MISSING");
  const exchangeBody = await exchangeResponse.json().catch(() => ({}));
  if (!exchangeResponse.ok()) {
    throw new Error(`LOCAL_SESSION_EXCHANGE_FAILED_${exchangeResponse.status()}:${exchangeBody.error?.code || exchangeBody.code || "UNKNOWN"}`);
  }
  const targetPath = new URL(next, page.url()).pathname;
  await page.waitForURL((url) => url.pathname === targetPath, { timeout: 60_000 });
  await page.waitForLoadState("domcontentloaded");
}

async function qualification(page: import("@playwright/test").Page) {
  const result = await api(page, "/api/expert/qualification");
  assertApi(result);
  return asRecord(asRecord(result.body).data);
}

function assessmentBody({ assignmentId = null, domainCode = "AI_ML", caseRevision = 1, coiDeclared = true, idempotencyKey }: { assignmentId?: string | null; domainCode?: string; caseRevision?: number; coiDeclared?: boolean; idempotencyKey: string }) {
  return {
    caseId: primaryCaseId,
    domainCode,
    assessment: { analysis: "The bounded local record supports a scoped AI/ML assessment.", recommendation: "REQUEST_SOURCE_CHECK" },
    confidence: 0.92,
    assignmentId,
    caseRevision,
    evidenceRevisionIds: [primaryEvidenceId],
    conclusionWithinScope: "Only the supplied immutable case revision is assessed.",
    reasoning: "The conclusion is limited to the cited local evidence revision and does not replace an official source.",
    uncertainty: "Independent official confirmation remains outside this assessment.",
    missingEvidence: ["An official source snapshot for the next revision."],
    coiDeclared,
    idempotencyKey,
  };
}

test.describe("authenticated Community → Expert → Trust local reality", () => {
  test("persists the local authority lifecycle with real Auth and no Main Supabase traffic", async ({ browser }) => {
    requireFixture(candidateEmail, "candidate-email");
    requireFixture(candidatePassword, "candidate-password");
    requireFixture(reviewerEmail, "reviewer-email");
    requireFixture(reviewerPassword, "reviewer-password");
    requireFixture(reactorEmail, "reactor-email");
    requireFixture(reactorPassword, "reactor-password");
    requireFixture(primaryCaseId, "primary-case-id");
    requireFixture(primaryEvidenceId, "primary-evidence-id");

    const candidateContext = await browser.newContext();
    const reviewerContext = await browser.newContext();
    const reactorContext = await browser.newContext();
    const candidateNetworkViolations = await installBrowserNetworkGuard(candidateContext);
    const reviewerNetworkViolations = await installBrowserNetworkGuard(reviewerContext);
    const reactorNetworkViolations = await installBrowserNetworkGuard(reactorContext);
    const candidatePage = await candidateContext.newPage();
    const reviewerPage = await reviewerContext.newPage();
    const reactorPage = await reactorContext.newPage();
    let candidateContributionId = "";
    let applicationId = "";
    let practiceId = "";
    let assessmentId = "";

    try {
      await login(candidatePage, candidateEmail, candidatePassword, `/community?caseId=${primaryCaseId}&caseRevision=1`);
      await expect(candidatePage.getByRole("heading", { name: "Thêm trải nghiệm có thể đối soát" })).toBeVisible();
      const contributionForm = candidatePage.locator("section.community-contribution");
      const labeledInput = (labelText: string) => contributionForm.locator("label").filter({ hasText: labelText }).locator("input").first();
      await expect(contributionForm.locator("select")).toBeVisible();
      await contributionForm.locator("select").selectOption("CONTEXT");
      await contributionForm.locator("textarea").fill("The local authenticated contributor observed a bounded case context that can be checked against the cited revision.");
      await labeledInput("Case ID").fill(primaryCaseId);
      await labeledInput("Case revision").fill("1");
      await labeledInput("Evidence refs").fill(primaryEvidenceId);
      await candidatePage.getByRole("button", { name: "Gửi observation", exact: true }).click();
      await expect(candidatePage.getByText("Đã nhận · chưa phải phán quyết", { exact: true })).toBeVisible();

      const posts = await api(candidatePage, `/api/intelligence/community/posts?caseId=${encodeURIComponent(primaryCaseId)}&sort=recent`);
      assertApi(posts);
      const browserContribution = asRecords(asRecord(posts.body).posts).find((post) => String(post.statement || "").includes("authenticated contributor observed"));
      expect(browserContribution).toBeDefined();
      if (!browserContribution) throw new Error("LOCAL_BROWSER_CONTRIBUTION_MISSING");
      candidateContributionId = String(browserContribution.contributionId || "");

      const selfReaction = await api(candidatePage, "/api/forum/vote", {
        method: "POST",
        body: { postId: candidateContributionId, type: "helpful", caseRevision: 1, idempotencyKey: `local-self-reaction-${candidateContributionId}` },
      });
      expect(selfReaction.status).toBe(403);
      expect(errorCode(selfReaction)).toBe("SELF_REACTION_FORBIDDEN");

      await login(reactorPage, reactorEmail, reactorPassword, `/community?caseId=${primaryCaseId}&caseRevision=1`);
      const independentReaction = await api(reactorPage, "/api/forum/vote", {
        method: "POST",
        body: { postId: candidateContributionId, type: "helpful", caseRevision: 1, idempotencyKey: `local-independent-reaction-${candidateContributionId}` },
      });
      assertApi(independentReaction);
      expect(asRecord(independentReaction.body).trustMutation).toBe(false);

      await candidatePage.goto("/expert", { waitUntil: "domcontentloaded" });
      await expect(candidatePage.getByText("100/100 điểm · 5/5 sao", { exact: true })).toBeVisible({ timeout: 60_000 });
      await expect(candidatePage.getByText("HUMAN_QUALIFICATION_REQUIRED", { exact: true })).toBeVisible();
      const beforeApplication = await qualification(candidatePage);
      expect(beforeApplication.state).toBe("NOT_APPLIED");

      const selfReview = await api(candidatePage, "/api/expert/qualification/review", {
        method: "POST",
        body: { applicationId: "00000000-0000-4000-8000-000000000000", decision: "APPROVE_QUIZ", approvedDomains: ["AI_ML"], reason: "A candidate cannot act as their own reviewer." },
      });
      expect(selfReview.status).toBe(403);

      await candidatePage.getByLabel("Tên hiển thị", { exact: true }).fill("Local Evidence Reviewer Candidate");
      await candidatePage.getByLabel("Tổ chức / trường", { exact: true }).fill("StudentHub Local Test Lab");
      await candidatePage.getByLabel("Tiểu sử chuyên môn", { exact: true }).fill("Synthetic local qualification profile for authenticated assurance only.");
      await candidatePage.getByLabel("Bằng cấp / chứng chỉ", { exact: true }).fill("Local evidence methods certificate");
      await candidatePage.getByRole("button", { name: "Gửi hồ sơ để kiểm tra danh tính", exact: true }).click();
      await expect(candidatePage.getByText("Hồ sơ đã được ghi nhận.", { exact: true })).toBeVisible({ timeout: 60_000 });
      const applied = await qualification(candidatePage);
      expect(applied.state).toBe("IDENTITY_REVIEW");
      applicationId = String(asRecord(applied.application).applicationId || "");

      await login(reviewerPage, reviewerEmail, reviewerPassword, "/expert");
      const approveQuiz = await api(reviewerPage, "/api/expert/qualification/review", {
        method: "POST",
        body: { applicationId, decision: "APPROVE_QUIZ", approvedDomains: ["AI_ML"], reason: "Automated reviewer fixture verified the local application boundary." },
      });
      assertApi(approveQuiz);

      await candidatePage.reload({ waitUntil: "domcontentloaded" });
      await expect(candidatePage.getByRole("button", { name: "Bắt đầu quiz", exact: true })).toBeVisible({ timeout: 60_000 });
      await candidatePage.getByRole("button", { name: "Bắt đầu quiz", exact: true }).click();
      await expect(candidatePage.getByRole("radiogroup", { name: "Các lựa chọn trả lời" })).toBeVisible();
      const quizState = await qualification(candidatePage);
      const questions = asRecords(asRecord(quizState.latestAttempt).questions);
      expect(questions).toHaveLength(6);
      for (let index = 0; index < questions.length; index += 1) {
        const questionId = String(questions[index].questionId || "");
        const answer = correctAnswers[questionId];
        expect(answer, `no answer map for ${questionId}`).toBeTruthy();
        const option = candidatePage.locator('[role="radio"]').filter({ hasText: new RegExp(`^${answer.toUpperCase()}`) });
        await option.click();
        await expect(option).toHaveAttribute("aria-checked", "true");
        if (index < questions.length - 1) await candidatePage.getByRole("button", { name: "Câu tiếp", exact: true }).click();
      }
      await candidatePage.getByRole("button", { name: "Nộp quiz", exact: true }).click();
      await expect(candidatePage.getByText(/Quiz đạt/)).toBeVisible({ timeout: 60_000 });
      const afterQuiz = await qualification(candidatePage);
      expect(afterQuiz.state).toBe("DOMAIN_REVIEW");
      expect(asRecord(afterQuiz.latestAttempt).status).toBe("PASSED");

      await candidatePage.getByLabel("Kết luận trong phạm vi", { exact: true }).fill("The practice conclusion stays within the AI/ML evidence scope and does not claim official authority.");
      await candidatePage.getByLabel("Điều chưa chắc chắn", { exact: true }).fill("The next official source revision is not yet available in this local fixture.");
      await candidatePage.getByLabel("Bước tiếp theo", { exact: true }).fill("Request an independent source snapshot before widening the conclusion.");
      await candidatePage.getByLabel("Evidence revision IDs", { exact: true }).fill(primaryEvidenceId);
      const practiceSubmitResponsePromise = candidatePage.waitForResponse(
        (response) => response.url().endsWith("/api/expert/qualification/practice"),
        { timeout: 20_000 },
      );
      await candidatePage.getByRole("button", { name: "Gửi practice để reviewer chấm", exact: true }).click();
      const practiceSubmitResponse = await practiceSubmitResponsePromise;
      const practiceSubmitBody = await practiceSubmitResponse.json().catch(() => ({}));
      if (!practiceSubmitResponse.ok()) {
        throw new Error(`LOCAL_PRACTICE_SUBMIT_FAILED_${practiceSubmitResponse.status()}:${practiceSubmitBody.error?.code || practiceSubmitBody.error?.userMessage || "UNKNOWN"}`);
      }
      await expect(candidatePage.getByText("Lịch sử practice theo domain", { exact: true })).toBeVisible({ timeout: 60_000 });
      const afterPracticeSubmission = await qualification(candidatePage);
      practiceId = String(asRecords(afterPracticeSubmission.practiceReviews).at(-1)?.practiceId || "");
      expect(practiceId).toBeTruthy();

      const practiceReview = await api(reviewerPage, "/api/expert/qualification/practice/review", {
        method: "POST",
        body: { practiceId, decision: "PASS", reason: "The response is bounded, cites evidence, and records uncertainty for supervised review." },
        headers: { "Idempotency-Key": `local-practice-review-${practiceId}` },
      });
      assertApi(practiceReview, 201);
      const activation = await api(reviewerPage, "/api/expert/qualification/review", {
        method: "POST",
        body: { applicationId, decision: "ACTIVATE", approvedDomains: ["AI_ML"], reason: "Automated reviewer fixture records the supervised human-activation backend transition." },
      });
      assertApi(activation);

      await candidatePage.reload({ waitUntil: "domcontentloaded" });
      await expect(candidatePage.getByText("Hồ sơ đã hoạt động theo domain được duyệt.", { exact: true })).toBeVisible({ timeout: 60_000 });
      await expect(candidatePage.getByText("ACTIVE", { exact: true })).toBeVisible();

      const wrongDomainAssignment = await api(reviewerPage, "/api/expert/assignments", {
        method: "POST",
        body: { expertId: process.env.STUDENTHUB_LOCAL_CANDIDATE_ID, caseId: primaryCaseId, caseRevision: 1, domainCode: "CYBERSECURITY" },
        headers: { "Idempotency-Key": `local-wrong-domain-assignment-${primaryCaseId}` },
      });
      expect(wrongDomainAssignment.status).toBe(403);
      expect(errorCode(wrongDomainAssignment)).toBe("DOMAIN_NOT_VERIFIED");

      const assignment = await api(reviewerPage, "/api/expert/assignments", {
        method: "POST",
        body: { expertId: process.env.STUDENTHUB_LOCAL_CANDIDATE_ID, caseId: primaryCaseId, caseRevision: 1, domainCode: "AI_ML", expiresAt: new Date(Date.now() + 60 * 60_000).toISOString() },
        headers: { "Idempotency-Key": `local-valid-assignment-${primaryCaseId}` },
      });
      assertApi(assignment, 201);
      const assignmentId = String(asRecord(asRecord(assignment.body).data).id || "");
      expect(assignmentId).toBeTruthy();

      const noAssignment = await api(candidatePage, "/api/expert/assessments", {
        method: "POST",
        body: assessmentBody({ idempotencyKey: `local-no-assignment-${primaryCaseId}` }),
      });
      expect(noAssignment.status).toBe(403);
      expect(errorCode(noAssignment)).toBe("ASSIGNMENT_REQUIRED");

      const wrongDomainAssessment = await api(candidatePage, "/api/expert/assessments", {
        method: "POST",
        body: assessmentBody({ assignmentId, domainCode: "CYBERSECURITY", idempotencyKey: `local-wrong-domain-assessment-${primaryCaseId}` }),
      });
      expect(wrongDomainAssessment.status).toBe(403);
      expect(errorCode(wrongDomainAssessment)).toBe("UNVERIFIED_EXPERT_DOMAIN");

      const coiAssessment = await api(candidatePage, "/api/expert/assessments", {
        method: "POST",
        body: assessmentBody({ assignmentId, coiDeclared: false, idempotencyKey: `local-coi-assessment-${primaryCaseId}` }),
      });
      expect([400, 403]).toContain(coiAssessment.status);
      expect(["COI_DECLARATION_REQUIRED", "CONFLICT_OF_INTEREST"]).toContain(errorCode(coiAssessment));

      const staleAssessment = await api(candidatePage, "/api/expert/assessments", {
        method: "POST",
        body: assessmentBody({ assignmentId, caseRevision: 2, idempotencyKey: `local-stale-assessment-${primaryCaseId}` }),
      });
      expect(staleAssessment.status).toBe(409);
      expect(errorCode(staleAssessment)).toBe("STALE_CASE_REVISION");

      const expiringAssignment = await api(reviewerPage, "/api/expert/assignments", {
        method: "POST",
        body: { expertId: process.env.STUDENTHUB_LOCAL_CANDIDATE_ID, caseId: primaryCaseId, caseRevision: 1, domainCode: "AI_ML", expiresAt: new Date(Date.now() + 60 * 60_000).toISOString() },
        headers: { "Idempotency-Key": `local-expiring-assignment-${primaryCaseId}` },
      });
      assertApi(expiringAssignment, 201);
      const expiringAssignmentId = String(asRecord(asRecord(expiringAssignment.body).data).id || "");
      const { Pool } = requireFromFrontend("pg");
      const localPool = new Pool({ connectionString: process.env.STUDENTHUB_RLS_TEST_DATABASE_URL, ssl: false });
      try {
        const expiredUpdate = await localPool.query("update private.expert_assignments set expires_at = now() - interval '1 minute' where id = $1 returning id", [expiringAssignmentId]);
        expect(expiredUpdate.rowCount).toBe(1);
      } finally {
        await localPool.end();
      }
      const expiredAssessment = await api(candidatePage, "/api/expert/assessments", {
        method: "POST",
        body: assessmentBody({ assignmentId: expiringAssignmentId, idempotencyKey: `local-expired-assignment-${primaryCaseId}` }),
      });
      expect(expiredAssessment.status).toBe(409);
      expect(errorCode(expiredAssessment)).toBe("ASSIGNMENT_EXPIRED");

      const validAssessment = await api(candidatePage, "/api/expert/assessments", {
        method: "POST",
        body: assessmentBody({ assignmentId, idempotencyKey: `local-valid-assessment-${primaryCaseId}` }),
      });
      assertApi(validAssessment, 201);
      const validAssessmentData = asRecord(asRecord(validAssessment.body).data);
      expect(validAssessmentData.assessment_state || validAssessmentData.assessmentState).toBe("SUBMITTED");
      expect(validAssessmentData.authority_snapshot_version || validAssessmentData.authoritySnapshotVersion).toBe(1);
      expect(validAssessmentData.coi_state || validAssessmentData.coiState).toBe("DECLARED_NO_CONFLICT");
      assessmentId = String(validAssessmentData.id || "");

      const assessments = await api(candidatePage, `/api/expert/assessments?caseId=${encodeURIComponent(primaryCaseId)}`);
      assertApi(assessments);
      const assessmentRows = asRecords(asRecord(assessments.body).data);
      expect(assessmentRows.some((row) => row.id === assessmentId && row.domain_code === "AI_ML")).toBe(true);
      expect(asRecord(assessmentRows.find((row) => row.id === assessmentId)?.authority_snapshot).assignmentId).toBe(assignmentId);

      const communitySignals = await api(candidatePage, `/api/v1/trust/cases/${encodeURIComponent(primaryCaseId)}/community-signals?caseRevision=1`);
      assertApi(communitySignals);
      const signals = asRecords(asRecord(communitySignals.body).signals);
      expect(signals.length).toBeGreaterThan(0);
      expect(signals.every((signal) => signal.authority === "NON_AUTHORITATIVE" && signal.trustVerdictMutation === false)).toBe(true);

      const browserTrust = await api(candidatePage, "/api/v1/trust", {
        method: "POST",
        body: { version: "v5", type: "text", content: "Local authenticated Trust bridge input with bounded uncertainty and no external dependency." },
        headers: { "Idempotency-Key": `local-browser-trust-${primaryCaseId}` },
      });
      assertApi(browserTrust);
      const browserTrustBody = asRecord(browserTrust.body);
      expect(asRecord(browserTrustBody.persistence).persisted).toBe(true);
      expect(browserTrustBody.caseId).toBeTruthy();

      const createdPassport = await api(candidatePage, "/api/v1/passports", {
        method: "POST",
        body: { title: "Local authenticated Expert evidence passport", subjectType: "EXPERT_TRUST_E2E", subjectId: `${primaryCaseId}-expert-e2e` },
      });
      assertApi(createdPassport, 201);
      const passportList = await api(candidatePage, "/api/v1/passports");
      assertApi(passportList);
      const createdPassportId = asRecord(asRecord(createdPassport.body).passport).id;
      expect(asRecords(asRecord(passportList.body).passports).some((passport) => passport.id === createdPassportId)).toBe(true);

      const lineage = [{
        id: assessmentId,
        expert_id: process.env.STUDENTHUB_LOCAL_CANDIDATE_ID,
        domain_code: "AI_ML",
        verification_id: validAssessmentData.verification_id,
        verification_revision: validAssessmentData.verification_revision,
        verification_status: "VERIFIED",
        verification_qualification_state: "DOMAIN_VERIFIED",
        assignment_id: assignmentId,
        assignment_revision: validAssessmentData.assignment_revision,
        case_id: primaryCaseId,
        case_revision: 1,
        evidence_revision_ids: [primaryEvidenceId],
        authority_snapshot_version: 1,
        authority_snapshot_digest: validAssessmentData.authority_snapshot_digest,
        coi_state: "DECLARED_NO_CONFLICT",
        coi_declaration_ref: validAssessmentData.coi_declaration_ref,
        submitted_at: validAssessmentData.submitted_at,
      }];
      const replayInput = {
        caseId: primaryCaseId,
        runId: String(browserTrustBody.runId || "local-browser-trust-run"),
        revision: 1,
        claims: [{ claimId: "claim-local", text: "Bounded local claim", normalizedText: "bounded local claim", type: "CONTEXT" }],
        sources: [{ sourceId: primaryEvidenceId, evidenceId: primaryEvidenceId, publisher: "StudentHub Local", domain: "studenthub.local.test", canonicalUrl: "http://127.0.0.1/local-evidence", contentDigest: "local-digest" }],
        verdictResult: { state: "SUSPICIOUS", scope: "LOCAL" },
        decisionTwin: { policy: "trust-v5-local" },
        expertAssessments: lineage,
        issuedAt: "2026-09-10T00:00:00.000Z",
      };
      type PassportReplay = { artifactHash: string; expertAssessmentLineage: Array<{ assessmentId?: string | null }> };
      const issuePassport = EvidencePassportService.issuePassport as unknown as (input: typeof replayInput) => PassportReplay;
      const firstReplay = issuePassport(replayInput);
      const secondReplay = issuePassport({ ...replayInput, issuedAt: "2026-09-10T01:00:00.000Z" });
      expect(firstReplay.artifactHash).toBe(secondReplay.artifactHash);
      expect(firstReplay.expertAssessmentLineage[0].assessmentId).toBe(assessmentId);

      expect(candidateNetworkViolations).toEqual([]);
      expect(reviewerNetworkViolations).toEqual([]);
      expect(reactorNetworkViolations).toEqual([]);
    } finally {
      await candidateContext.close();
      await reviewerContext.close();
      await reactorContext.close();
    }
  });
});
