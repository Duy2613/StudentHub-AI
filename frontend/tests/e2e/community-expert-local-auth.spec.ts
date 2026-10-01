import { expect, test } from "@playwright/test";
import { createRequire } from "node:module";
import { EvidencePassportService } from "../../src/lib/server/trust/EvidencePassportService.js";

const requireFromFrontend = createRequire(new URL("../../package.json", import.meta.url));

const candidateEmail = process.env.STUDENTHUB_LOCAL_CANDIDATE_EMAIL || "";
const candidatePassword = process.env.STUDENTHUB_LOCAL_CANDIDATE_PASSWORD || "";
const reviewerId = process.env.STUDENTHUB_LOCAL_REVIEWER_ID || "";
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
type RealtimeCaptureState = {
  status: number | null;
  contentType: string;
  data: string;
  connected: boolean;
  ended: boolean;
  error: string | null;
  body: string;
  controller?: AbortController;
};
type RealtimeCaptureWindow = Window & {
  __communityRealtimeCaptures?: Record<string, RealtimeCaptureState>;
};

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

async function startRealtimeCapture(
  page: import("@playwright/test").Page,
  captureName: string,
  channels: string,
  cursor: number,
) {
  await page.evaluate(({ name, requestedChannels, afterSequence }) => {
    const target = window as RealtimeCaptureWindow;
    target.__communityRealtimeCaptures ||= {};
    const controller = new AbortController();
    const capture: RealtimeCaptureState = {
      status: null,
      contentType: "",
      data: "",
      connected: false,
      ended: false,
      error: null,
      body: "",
      controller,
    };
    target.__communityRealtimeCaptures[name] = capture;

    void (async () => {
      try {
        const response = await fetch(
          `/api/realtime/stream?channels=${encodeURIComponent(requestedChannels)}&cursor=${afterSequence}`,
          { credentials: "include", headers: { accept: "text/event-stream" }, signal: controller.signal },
        );
        capture.status = response.status;
        capture.contentType = response.headers.get("content-type") || "";
        if (!response.ok) {
          capture.body = (await response.text()).slice(0, 2_000);
          capture.ended = true;
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("REALTIME_STREAM_BODY_UNAVAILABLE");
        const decoder = new TextDecoder();
        while (true) {
          const next = await reader.read();
          if (next.done) break;
          capture.data = `${capture.data}${decoder.decode(next.value, { stream: true })}`.slice(-32_768);
          if (capture.data.includes("event: system:connected")) capture.connected = true;
        }
        capture.ended = true;
      } catch (error) {
        const name = (error as Error)?.name || "UNKNOWN";
        if (name !== "AbortError") capture.error = name;
        capture.ended = true;
      }
    })();
  }, { name: captureName, requestedChannels: channels, afterSequence: cursor });

  await expect.poll(async () => (await getRealtimeCapture(page, captureName))?.connected, {
    timeout: 15_000,
    intervals: [100, 250, 500],
  }).toBe(true);
}

async function getRealtimeCapture(page: import("@playwright/test").Page, captureName: string) {
  return page.evaluate((name) => {
    const capture = (window as RealtimeCaptureWindow).__communityRealtimeCaptures?.[name];
    if (!capture) return null;
    return {
      status: capture.status,
      contentType: capture.contentType,
      data: capture.data,
      connected: capture.connected,
      ended: capture.ended,
      error: capture.error,
      body: capture.body,
    };
  }, captureName);
}

async function stopRealtimeCapture(page: import("@playwright/test").Page, captureName: string) {
  await page.evaluate((name) => {
    (window as RealtimeCaptureWindow).__communityRealtimeCaptures?.[name]?.controller?.abort();
  }, captureName).catch(() => {});
}

function realtimeHandshake(data: string) {
  const frame = data.split("\n\n").find((entry) => entry.startsWith("event: system:connected"));
  const line = frame?.split("\n").find((entry) => entry.startsWith("data: "));
  if (!line) return {};
  try { return asRecord(JSON.parse(line.slice("data: ".length))); } catch { return {}; }
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
  // Login has no long-lived realtime stream. Wait for its client shell to
  // hydrate before filling controlled inputs so a fast warm navigation cannot
  // overwrite pre-hydration values with the initial empty React state.
  await page.waitForLoadState("networkidle");
  // Use labeled controls and real pointer/focus interactions for the auth form.
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
  await expect(emailInput).toHaveValue(email);
  await expect(passwordInput).toHaveValue(password);
  const authRequestPaths = new Set<string>();
  const failedRequestPaths = new Set<string>();
  const pageErrorNames = new Set<string>();
  page.on("request", (request) => {
    try {
      const url = new URL(request.url());
      if (url.pathname.endsWith("/auth/v1/token")) {
        authRequestPaths.add(url.pathname);
      }
    } catch {}
  });
  page.on("requestfailed", (request) => {
    try { failedRequestPaths.add(new URL(request.url()).pathname); } catch {}
  });
  page.on("pageerror", (error) => pageErrorNames.add(error.name || "UnknownPageError"));
  const authResponsePromise = page.waitForResponse(
    (response) => new URL(response.url()).pathname.endsWith("/auth/v1/token"),
    { timeout: 20_000 },
  ).catch(() => null);
  const exchangeResponsePromise = page.waitForResponse(
    (response) => response.url().endsWith("/api/auth/session/exchange"),
    { timeout: 20_000 },
  ).catch(() => null);
  const loginButton = page.getByRole("button", { name: "Đăng nhập", exact: true });
  await expect(loginButton).toBeEnabled();
  await loginButton.click();
  const authResponse = await authResponsePromise;
  if (!authResponse) {
    const exchangeResponse = await exchangeResponsePromise;
    const formState = await page.evaluate(() => {
      const form = document.querySelector("form");
      const email = document.querySelector<HTMLInputElement>('input[type="email"]');
      const password = document.querySelector<HTMLInputElement>('input[type="password"]');
      const button = [...document.querySelectorAll("button")].find((item) => item.textContent?.trim() === "Đăng nhập");
      return {
        path: window.location.pathname,
        formValid: form?.checkValidity() ?? false,
        emailFilled: Boolean(email?.value),
        passwordFilled: Boolean(password?.value),
        buttonDisabled: Boolean(button?.disabled),
        visibleAlertCount: [...document.querySelectorAll('[role="alert"]')].filter((item) => item.getClientRects().length > 0).length,
      };
    });
    throw new Error(`LOCAL_AUTH_TOKEN_RESPONSE_MISSING:${JSON.stringify({
      authRequestPaths: [...authRequestPaths],
      requestFailed: [...failedRequestPaths],
      pageErrorNames: [...pageErrorNames],
      exchangeStatus: exchangeResponse?.status() || null,
      formState,
    })}`);
  }
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
    requireFixture(reviewerId, "reviewer-id");
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
    let requestContributionId = "";
    let communityReviewRequestId = "";
    let communityAssignmentId = "";
    let applicationId = "";
    let practiceId = "";
    let assessmentId = "";
    const realtimeCaptureSessions: Array<{ page: import("@playwright/test").Page; name: string }> = [];

    try {
      await login(candidatePage, candidateEmail, candidatePassword, `/community?caseId=${primaryCaseId}&caseRevision=1`);
      // The public route now mounts CommunitySocialWorkspace. Its composer is
      // intentionally a lightweight social surface; case-bound authority
      // records still enter through the authenticated Promax API below.
      await expect(candidatePage.getByRole("heading", { name: "Community.", exact: true })).toBeVisible();
      const composer = candidatePage.getByRole("region", { name: "Tạo bài viết cộng đồng" });
      await expect(composer).toBeVisible();
      const composerPrompt = composer.getByRole("button", { name: "Bạn muốn chia sẻ hoặc kiểm chứng điều gì?", exact: true });
      await expect(composerPrompt).toBeVisible();
      await composerPrompt.click();
      const composerDialog = candidatePage.getByRole("dialog", { name: "Bạn muốn chia sẻ điều gì?", exact: true });
      await expect(composerDialog).toBeVisible();
      await expect(composerDialog.getByLabel(/Bài viết/)).toBeVisible();

      const contributionStatement = "The local authenticated contributor observed a bounded case context that can be checked against the cited revision.";
      const contributionInput = {
        caseId: primaryCaseId,
        caseRevision: 1,
        contributionType: "CONTEXT",
        statement: contributionStatement,
        evidenceRefs: [primaryEvidenceId],
        evidenceRevisionIds: [primaryEvidenceId],
      };
      const preview = await api(candidatePage, "/api/intelligence/community/posts", {
        method: "POST",
        body: { ...contributionInput, phase: "PREVIEW" },
      });
      assertApi(preview);
      const previewBody = asRecord(preview.body);
      expect(previewBody.state).toBe("PREVIEW_READY");
      const previewData = asRecord(previewBody.preview);
      const publish = await api(candidatePage, "/api/intelligence/community/posts", {
        method: "POST",
        body: {
          ...contributionInput,
          phase: "PUBLISH",
          privacyConfirmed: true,
          previewDigest: previewData.previewDigest,
        },
        headers: { "Idempotency-Key": `local-browser-contribution-${primaryCaseId}` },
      });
      assertApi(publish, 201);

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

      // Read real owner activity and follow the exact saved revision from Profile.
      const ownerProfile = await api(candidatePage, "/api/users/me");
      assertApi(ownerProfile);
      const ownerView = asRecord(asRecord(ownerProfile.body).profile);
      expect(asRecord(ownerView.communityActivity).dataStatus).toBe("AVAILABLE");
      expect(Number(asRecord(ownerView.communityActivity).posts)).toBeGreaterThan(0);
      expect(asRecords(asRecord(ownerView.communityActivity).recentActivity).some((row) => row.type === "TRUST_CONTRIBUTION")).toBe(true);
      const freshSearch = await api(candidatePage, "/api/v1/search?q=authenticated%20contributor%20observed");
      assertApi(freshSearch);
      expect(asRecord(freshSearch.body).status).toBe("COMPLETE");
      expect(asRecords(asRecord(asRecord(freshSearch.body).data).results).some((row) => row.id === candidateContributionId)).toBe(true);
      await candidatePage.goto("/profile", { waitUntil: "domcontentloaded" });
      await expect(candidatePage.getByRole("button", { name: "Chỉnh sửa hồ sơ", exact: true })).toBeVisible();
      await candidatePage.getByRole("button", { name: "Chỉnh sửa hồ sơ", exact: true }).click();
      await candidatePage.getByLabel("FullName (Họ và tên) *", { exact: true }).fill("Local Repair Student");
      await candidatePage.getByLabel("University (Trường đại học)", { exact: true }).fill("Local Assurance University");
      await candidatePage.getByLabel("Major (Ngành học)", { exact: true }).fill("Computer Science");
      await candidatePage.getByLabel("Bio (Giới thiệu bản thân)", { exact: true }).fill("Synthetic owner profile assurance.");
      await candidatePage.getByRole("button", { name: "Lưu thay đổi", exact: true }).click();
      await expect(candidatePage.getByText("Đã cập nhật thành công các trường hồ sơ cá nhân.")).toBeVisible();
      await candidatePage.reload({ waitUntil: "domcontentloaded" });
      await expect(candidatePage.getByRole("heading", { name: "Local Repair Student", exact: true })).toBeVisible();
      const savedProfile = asRecord(asRecord((await api(candidatePage, "/api/users/me")).body).profile);
      expect(asRecord(savedProfile.education).university).toBe("Local Assurance University");
      expect(asRecord(savedProfile.education).major).toBe("Computer Science");
      expect(savedProfile.bio).toBe("Synthetic owner profile assurance.");
      const savedCaseLink = candidatePage.locator(`a[href="/trust?caseId=${primaryCaseId}&caseRevision=1"]`);
      await expect(savedCaseLink).toHaveCount(1);
      await savedCaseLink.click();
      await expect(candidatePage).toHaveURL(new RegExp(`/trust\\?caseId=${primaryCaseId}&caseRevision=1$`));
      await expect(candidatePage.getByText("Nội dung được phép xem", { exact: true })).toBeVisible();
      const ownedCase = await api(candidatePage, `/api/v1/trust/cases/${primaryCaseId}?caseRevision=1`);
      assertApi(ownedCase);
      const crossOwnerCase = await api(reactorPage, `/api/v1/trust/cases/${primaryCaseId}`);
      expect([403, 404]).toContain(crossOwnerCase.status);
      await candidatePage.goto(`/profile/${process.env.STUDENTHUB_LOCAL_REACTOR_ID}`, { waitUntil: "domcontentloaded" });
      await expect(candidatePage.getByRole("heading", { name: "Hồ sơ công khai chưa khả dụng", exact: true })).toBeVisible();
      await candidatePage.goto("/community", { waitUntil: "domcontentloaded" });

      const requestContributionStatement = "A second synthetic Community member adds an independent bounded observation for authorized expert review.";
      const requestContributionInput = {
        caseId: primaryCaseId,
        caseRevision: 1,
        contributionType: "CONTEXT",
        statement: requestContributionStatement,
        evidenceRefs: [primaryEvidenceId],
        evidenceRevisionIds: [primaryEvidenceId],
      };
      const requestContributionPreview = await api(reactorPage, "/api/intelligence/community/posts", {
        method: "POST",
        body: { ...requestContributionInput, phase: "PREVIEW" },
      });
      assertApi(requestContributionPreview);
      const requestPreviewBody = asRecord(requestContributionPreview.body);
      expect(requestPreviewBody.state).toBe("PREVIEW_READY");
      const requestPreviewData = asRecord(requestPreviewBody.preview);
      const requestContributionPublish = await api(reactorPage, "/api/intelligence/community/posts", {
        method: "POST",
        body: {
          ...requestContributionInput,
          phase: "PUBLISH",
          privacyConfirmed: true,
          previewDigest: requestPreviewData.previewDigest,
        },
        headers: { "Idempotency-Key": `local-peer-community-contribution-${primaryCaseId}` },
      });
      assertApi(requestContributionPublish, 201);
      const communityReadback = await api(candidatePage, `/api/intelligence/community/posts?caseId=${encodeURIComponent(primaryCaseId)}&sort=recent`);
      assertApi(communityReadback);
      const requestContribution = asRecords(asRecord(communityReadback.body).posts)
        .find((post) => post.statement === requestContributionStatement);
      expect(requestContribution).toBeDefined();
      if (!requestContribution) throw new Error("LOCAL_PEER_COMMUNITY_CONTRIBUTION_MISSING");
      requestContributionId = String(requestContribution.contributionId || "");
      expect(requestContribution.publicationState).toBe("PUBLISHED");
      expect(requestContribution.authorId).toBeUndefined();
      expect(requestContribution.email).toBeUndefined();
      expect(requestContribution.rawInput).toBeUndefined();

      await candidatePage.goto("/expert/profile", { waitUntil: "domcontentloaded" });
      await expect(candidatePage.getByRole("heading", { name: "Hồ sơ → quiz → review domain", exact: true })).toBeVisible();
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
      await candidatePage.getByLabel("Nguồn tham khảo cho reviewer", { exact: true }).fill(primaryEvidenceId);
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
      await expect(candidatePage.getByText("ACTIVE / QUALIFIED", { exact: true })).toBeVisible({ timeout: 60_000 });
      await expect(candidatePage.getByRole("heading", { level: 1, name: "Local Evidence Reviewer Candidate", exact: true })).toBeVisible();

      const { Pool: RealtimeCursorPool } = requireFromFrontend("pg");
      const cursorPool = new RealtimeCursorPool({ connectionString: process.env.STUDENTHUB_RLS_TEST_DATABASE_URL, ssl: false, max: 1 });
      let realtimeCursor = 0;
      try {
        const cursorResult = await cursorPool.query("select coalesce(max(sequence), 0)::text as cursor from private.realtime_events");
        realtimeCursor = Number(cursorResult.rows[0]?.cursor || 0);
        expect(Number.isSafeInteger(realtimeCursor)).toBe(true);
      } finally {
        await cursorPool.end();
      }

      await startRealtimeCapture(candidatePage, "trust-owner", "trust", realtimeCursor);
      realtimeCaptureSessions.push({ page: candidatePage, name: "trust-owner" });
      await startRealtimeCapture(reviewerPage, "assigned-expert", "expert", realtimeCursor);
      realtimeCaptureSessions.push({ page: reviewerPage, name: "assigned-expert" });
      await startRealtimeCapture(reactorPage, "normal-user", "system,trust,audit,community,expert", realtimeCursor);
      realtimeCaptureSessions.push({ page: reactorPage, name: "normal-user" });

      const communityReviewRequest = await api(candidatePage, "/api/expert/review-requests", {
        method: "POST",
        body: {
          caseId: primaryCaseId,
          caseRevision: 1,
          domainCode: "AI_ML",
          question: "Please independently assess this bounded Community observation against the immutable Trust revision.",
          contextRefs: [primaryEvidenceId],
          communityContributionId: requestContributionId,
          idempotencyKey: `local-community-expert-request-${primaryCaseId}`,
        },
        headers: { "Idempotency-Key": `local-community-expert-request-${primaryCaseId}` },
      });
      assertApi(communityReviewRequest, 201);
      const communityReviewRequestBody = asRecord(communityReviewRequest.body);
      const communityReviewRequestData = asRecord(communityReviewRequestBody.data);
      const communityMatching = asRecord(communityReviewRequestBody.matching);
      communityReviewRequestId = String(communityReviewRequestData.id || "");
      expect(communityReviewRequestData.communityContributionId).toBe(requestContributionId);
      expect(communityReviewRequestData.caseId).toBe(primaryCaseId);
      expect(communityReviewRequestData.caseRevision).toBe(1);
      expect(communityMatching.status).toBe("ASSIGNED");
      expect(communityMatching.assignmentsCount).toBe(1);
      expect(communityReviewRequestBody.assignmentAuthority).toBe("SERVER_CONTROLLED");
      expect(communityReviewRequestBody.expertSelection).toBe("NOT_REQUESTER_CONTROLLED");

      await expect.poll(async () => (await getRealtimeCapture(reviewerPage, "assigned-expert"))?.data || "", {
        timeout: 15_000,
        intervals: [100, 250, 500],
      }).toContain("event: expert:assignment");
      await expect.poll(async () => (await getRealtimeCapture(candidatePage, "trust-owner"))?.data || "", {
        timeout: 15_000,
        intervals: [100, 250, 500],
      }).toContain("event: trust:expert_review");
      const assignedExpertStream = await getRealtimeCapture(reviewerPage, "assigned-expert");
      const trustOwnerStream = await getRealtimeCapture(candidatePage, "trust-owner");
      const normalUserStream = await getRealtimeCapture(reactorPage, "normal-user");
      expect(assignedExpertStream?.status).toBe(200);
      expect(trustOwnerStream?.status).toBe(200);
      const normalHandshake = realtimeHandshake(normalUserStream?.data || "");
      expect(Array.isArray(normalHandshake.channels)).toBe(true);
      const normalHandshakeChannels = normalHandshake.channels as unknown[];
      expect(normalHandshakeChannels).toContain("system");
      expect(normalHandshakeChannels).toContain("community");
      expect(trustOwnerStream?.data).toContain(communityReviewRequestId);
      for (const stream of [assignedExpertStream, trustOwnerStream, normalUserStream]) {
        expect(stream?.data).not.toContain(primaryEvidenceId);
        expect(stream?.data).not.toContain(requestContributionStatement);
      }
      expect(normalUserStream?.data).not.toContain("event: expert:assignment");
      expect(normalUserStream?.data).not.toContain("event: trust:expert_review");
      expect(normalUserStream?.data).not.toContain(communityReviewRequestId);

      const authorizedReviewList = await api(reviewerPage, "/api/expert/blind-reviews");
      assertApi(authorizedReviewList);
      const authorizedReview = asRecords(asRecord(authorizedReviewList.body).reviews)
        .find((review) => review.reviewRequestId === communityReviewRequestId);
      expect(authorizedReview).toBeDefined();
      if (!authorizedReview) throw new Error("AUTHORIZED_EXPERT_CANNOT_DISCOVER_COMMUNITY_REQUEST");
      communityAssignmentId = String(authorizedReview.assignmentId || "");
      expect(assignedExpertStream?.data).toContain(communityAssignmentId);
      const normalUserStreamAfterAssignment = await getRealtimeCapture(reactorPage, "normal-user");
      expect(normalUserStreamAfterAssignment?.data).not.toContain("event: expert:assignment");
      expect(normalUserStreamAfterAssignment?.data).not.toContain(communityAssignmentId);
      expect(authorizedReview.claim).toBe(requestContributionStatement);
      expect(asRecord(authorizedReview.boundedContext).communityContributionId).toBe(requestContributionId);
      expect(JSON.stringify(authorizedReview)).not.toContain(primaryEvidenceId);
      expect(authorizedReview).not.toHaveProperty("trustVerdict");
      expect(authorizedReview).not.toHaveProperty("aiResult");

      const authorizedDossier = await api(reviewerPage, `/api/expert/blind-reviews/${encodeURIComponent(communityAssignmentId)}`);
      assertApi(authorizedDossier);
      expect(asRecord(authorizedDossier.body).dossier).toMatchObject({
        assignmentId: communityAssignmentId,
        reviewRequestId: communityReviewRequestId,
        claim: requestContributionStatement,
      });
      expect(JSON.stringify(authorizedDossier.body)).not.toContain(primaryEvidenceId);

      const normalUserDenied = await api(reactorPage, `/api/expert/blind-reviews/${encodeURIComponent(communityAssignmentId)}`);
      expect(normalUserDenied.status).toBe(403);
      expect(errorCode(normalUserDenied)).toBe("FORBIDDEN_NOT_EXPERT");
      const normalUserReviewList = await api(reactorPage, "/api/expert/blind-reviews");
      expect(normalUserReviewList.status).toBe(403);
      expect(errorCode(normalUserReviewList)).toBe("FORBIDDEN_NOT_EXPERT");
      const unassignedExpertDenied = await api(candidatePage, `/api/expert/blind-reviews/${encodeURIComponent(communityAssignmentId)}`);
      expect(unassignedExpertDenied.status).toBe(403);
      expect(errorCode(unassignedExpertDenied)).toBe("FORBIDDEN_ASSIGNMENT");

      const { Pool: ReadbackPool } = requireFromFrontend("pg");
      const readbackPool = new ReadbackPool({ connectionString: process.env.STUDENTHUB_RLS_TEST_DATABASE_URL, ssl: false, max: 1 });
      try {
        const linkage = await readbackPool.query(
          `select r.requester_id, r.case_id, r.case_revision, r.community_contribution_id, r.status,
                  a.expert_id, a.status as assignment_status, c.publication_state, c.author_id
             from private.expert_review_requests r
             join private.expert_assignments a on a.review_request_id = r.id
             join public.community_contributions c on c.id = r.community_contribution_id
            where r.id = $1 and a.id = $2`,
          [communityReviewRequestId, communityAssignmentId]
        );
        expect(linkage.rowCount).toBe(1);
        expect(linkage.rows[0].requester_id).toBe(process.env.STUDENTHUB_LOCAL_CANDIDATE_ID);
        expect(linkage.rows[0].case_id).toBe(primaryCaseId);
        expect(Number(linkage.rows[0].case_revision)).toBe(1);
        expect(linkage.rows[0].community_contribution_id).toBe(requestContributionId);
        expect(linkage.rows[0].status).toBe("ASSIGNED");
        expect(linkage.rows[0].expert_id).toBe(reviewerId);
        expect(linkage.rows[0].assignment_status).toBe("ASSIGNED");
        expect(linkage.rows[0].publication_state).toBe("PUBLISHED");
        expect(linkage.rows[0].author_id).toBe(process.env.STUDENTHUB_LOCAL_REACTOR_ID);

        await expect.poll(async () => {
          const result = await readbackPool.query(
            `select idempotency_key, channel, event_type, subject_id, classification, payload
               from private.realtime_events
              where idempotency_key = any($1::text[])`,
            [[`community:expert-assignment:${communityAssignmentId}`, `trust:expert-review:${communityReviewRequestId}:assigned`]]
          );
          return result.rows.length;
        }, { timeout: 10_000, intervals: [100, 250, 500] }).toBe(2);
        const realtimeResult = await readbackPool.query(
          `select idempotency_key, channel, event_type, subject_id, classification, payload
             from private.realtime_events
            where idempotency_key = any($1::text[])`,
          [[`community:expert-assignment:${communityAssignmentId}`, `trust:expert-review:${communityReviewRequestId}:assigned`]]
        );
        const realtimeRows = realtimeResult.rows as Array<{ classification: string; channel: string; subject_id: string }>;
        expect(realtimeRows.every((row) => row.classification === "RESTRICTED")).toBe(true);
        expect(realtimeRows.some((row) => row.channel === "expert" && row.subject_id === reviewerId)).toBe(true);
        expect(realtimeRows.some((row) => row.channel === "trust" && row.subject_id === process.env.STUDENTHUB_LOCAL_CANDIDATE_ID)).toBe(true);
        expect(JSON.stringify(realtimeRows)).not.toContain(primaryEvidenceId);
        expect(JSON.stringify(realtimeRows)).not.toContain(requestContributionStatement);
      } finally {
        await readbackPool.end();
      }

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
      await Promise.all(realtimeCaptureSessions.map(({ page, name }) => stopRealtimeCapture(page, name)));
      await candidateContext.close();
      await reviewerContext.close();
      await reactorContext.close();
    }
  });
});
