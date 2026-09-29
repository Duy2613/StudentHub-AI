import { expect, test, type Browser, type Page, type Route } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const VIEWPORTS = [360, 390, 768, 1024, 1280, 1440, 1920];
const ARTIFACTS = path.resolve(process.cwd(), process.env.EXPERT_V4_ARTIFACTS || "../artifacts/visual/EXPERT_V4/2026-09-27");
const CASE_ID = "e7338472-6392-4ca0-9d63-63028558713a";
const ASSIGNMENT_ID = "a7338472-6392-4ca0-9d63-63028558713a";
const REQUEST_ID = "b7338472-6392-4ca0-9d63-63028558713a";
const CLAIM_ID = "c7338472-6392-4ca0-9d63-63028558713a";
const EVIDENCE_ID = "d7338472-6392-4ca0-9d63-63028558713a";
const CONTRIBUTION_ID = "e8338472-6392-4ca0-9d63-63028558713a";
const REVIEWER_ID = "f7338472-6392-4ca0-9d63-63028558713a";

const expertProfile = {
  expertId: "fixture-expert",
  name: "Chuyên gia minh họa",
  title: "Hồ sơ giao diện mẫu",
  bio: "Dữ liệu tổng hợp chỉ dùng để kiểm tra cách hiển thị hồ sơ công khai.",
  institution: "Đơn vị minh họa",
  department: "Phạm vi học thuật",
  scopes: [{ domain: "PUBLIC_POLICY", subdomain: "Chính sách học vụ", level: "DECLARED" }],
  authorityBoundaries: {
    warning: "Hồ sơ chỉ mô tả phạm vi được khai báo; không tạo thẩm quyền ngoài contract.",
    outOfScopeDomains: ["MEDICAL_DIAGNOSIS"],
  },
  credentials: [{ type: "Credential minh họa", issuer: "Nguồn chưa xác minh", status: "UNKNOWN" }],
  publications: [{ title: "Công trình mẫu để kiểm tra bố cục", venue: "Chưa xác minh", year: 2025 }],
};

const caseSummary = {
  assignmentId: ASSIGNMENT_ID,
  reviewRequestId: REQUEST_ID,
  caseId: CASE_ID,
  caseRevision: 3,
  claimId: CLAIM_ID,
  domain: "PUBLIC_POLICY",
  claim: "Điều kiện xét hỗ trợ học tập cần được đối chiếu với quy định công khai.",
  reviewQuestion: "Nguồn quy định công khai nào áp dụng cho điều kiện này?",
  evidenceRevisionIds: [EVIDENCE_ID],
  evidence: [{
    id: EVIDENCE_ID,
    sourceType: "PUBLIC_DOCUMENT",
    sourceIdentifier: "https://example.edu.vn/policy/sample",
    observedAt: "2026-09-01T08:00:00.000Z",
    confidence: 0.8,
  }],
  missingEvidenceIds: [],
  boundedContext: {
    type: "COMMUNITY_CONTRIBUTION",
    communityContributionId: CONTRIBUTION_ID,
    snippet: "Nội dung cộng đồng mẫu để kiểm tra ngữ cảnh giới hạn.",
    url: null,
    mediaArtifactId: null,
    timestamp: "2026-09-01T08:00:00.000Z",
  },
  status: "ASSIGNED",
  caseVisibility: "PUBLIC",
  conflictOfInterest: false,
  deadline: "2026-10-01T00:00:00.000Z",
  createdAt: "2026-09-01T08:00:00.000Z",
};

const blindDossier = { ...caseSummary, assessmentState: "ASSIGNED", isLocked: false, ownDraft: null };

type VisualMode = {
  auth: "anonymous" | "student" | "expert";
  queue?: "one" | "empty";
  scope?: "matching" | "outside" | "private" | "conflict-unknown";
  review?: "open" | "completed";
};

function responseFor(pathname: string, mode: VisualMode) {
  if (pathname === "/api/auth/session") {
    if (mode.auth === "anonymous") return { authenticated: false, user: null };
    return {
      authenticated: true,
      user: {
        id: REVIEWER_ID,
        email: mode.auth === "expert" ? "expert-fixture@example.invalid" : "student-fixture@example.invalid",
        roles: [mode.auth === "expert" ? "EXPERT" : "STUDENT"],
      },
    };
  }
  if (pathname === "/api/users/me") return { success: true, profile: { fullName: "Người dùng kiểm tra giao diện" } };
  if (pathname === "/api/expert/qualification") {
    return {
      success: true,
      contractVersion: "expert-qualification.v1",
      data: {
        state: "ACTIVE",
        application: { approvedDomains: mode.scope === "outside" ? ["CYBERSECURITY"] : ["PUBLIC_POLICY"] },
      },
    };
  }
  if (pathname === "/api/v1/experts") {
    return {
      success: true,
      contractVersion: "experts.v1",
      data: {
        total: 2,
        experts: [
          expertProfile,
          { ...expertProfile, expertId: "fixture-expert-2", name: "Hồ sơ minh họa thứ hai", scopes: [{ domain: "CYBERSECURITY", level: "DECLARED" }] },
        ],
      },
    };
  }
  if (pathname.startsWith("/api/expert/profile/")) {
    const missing = pathname.endsWith("/missing-expert");
    const expert = missing
      ? { expertId: "missing-expert", name: "Hồ sơ thiếu dữ liệu", scopes: [], credentials: [], publications: [] }
      : expertProfile;
    return { success: true, expert, meta: { sourceState: "ISOLATED_VISUAL_FIXTURE" } };
  }
  if (pathname === "/api/expert/blind-reviews") {
    const hasAssignment = mode.auth === "expert" && mode.queue !== "empty" && mode.scope !== "private";
    return {
      success: true,
      contractVersion: "blind-expert-review.v1",
      pendingCount: hasAssignment ? 1 : 0,
      reviews: hasAssignment ? [caseSummary] : [],
      meta: { blindMode: true, preSubmissionAiResultLeak: 0 },
    };
  }
  if (pathname === "/api/expert/blind-reviews/" + ASSIGNMENT_ID) {
    if (mode.scope === "private") {
      return { status: 404, body: { success: false, error: { code: "EXPERT_CASE_NOT_PUBLIC", message: "Case is not publicly reviewable." } } };
    }
    if (mode.review === "completed") {
      return {
        success: true,
        contractVersion: "blind-expert-review.v1",
        dossier: {
          ...blindDossier,
          assessmentState: "LOCKED",
          isLocked: true,
          ownAssessment: {
            vote: "SUPPORT",
            confidence: 0.8,
            reasoning: "Fixture assessment text shown only to check the locked review layout.",
            evidence: [EVIDENCE_ID],
          },
          revealGate: "WAITING_FOR_L5",
          revealMessage: "The independent Trust pipeline has not completed.",
        },
        meta: { sourceState: "DEMO_FIXTURE" },
      };
    }
    const dossier = mode.scope === "conflict-unknown" ? { ...blindDossier, conflictOfInterest: null } : blindDossier;
    return { success: true, contractVersion: "blind-expert-review.v1", dossier, meta: { sourceState: "DEMO_FIXTURE" } };
  }
  if (pathname === "/api/expert/review-requests") {
    return {
      success: true,
      contractVersion: "expert-review-request.v1",
      data: [{
        id: REQUEST_ID,
        caseId: CASE_ID,
        caseRevision: 3,
        claimId: CLAIM_ID,
        communityContributionId: CONTRIBUTION_ID,
        domainCode: "PUBLIC_POLICY",
        status: "COMPLETED",
      }],
    };
  }
  if (pathname === "/api/intelligence/community/posts") {
    return {
      sourceState: "DEMO_FIXTURE",
      posts: [{
        contributionId: CONTRIBUTION_ID,
        statement: "Thông tin học vụ này cần được đối chiếu với tài liệu công khai.",
        contributionType: "NEEDS_VERIFICATION",
        createdAt: "2026-09-01T08:00:00.000Z",
        caseScope: { caseId: CASE_ID, caseRevision: 3 },
        claimId: CLAIM_ID,
        evidenceRevisionIds: [EVIDENCE_ID],
        evidenceRefs: [EVIDENCE_ID],
        sources: [],
        canRequestExpert: true,
        trustFreshness: "CURRENT",
        reactions: { helpful: 1 },
        commentCount: 0,
        revision: 1,
      }],
    };
  }
  if (pathname === "/api/community/social") return { posts: [] };
  if (pathname === "/api/realtime/stream") return { status: 204, body: {} };
  if (pathname.startsWith("/api/")) return { status: 404, body: { success: false, error: { code: "ISOLATED_VISUAL_FIXTURE_ROUTE_NOT_MOCKED" } } };
  return null;
}

async function createIsolatedPage(browser: Browser, mode: VisualMode) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 960 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  const allowedOrigin = new URL(process.env.TRUST_V4_BASE_URL || "http://127.0.0.1:3101").origin;
  const writes: string[] = [];
  const unexpectedApiGets: string[] = [];
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.route("**/*", async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin !== allowedOrigin) return route.abort("blockedbyclient");
    if (!url.pathname.startsWith("/api/")) return route.continue();
    if (request.method() !== "GET" && request.method() !== "HEAD") {
      writes.push(request.method() + " " + url.pathname);
      return route.fulfill({
        status: 409,
        contentType: "application/json",
        body: JSON.stringify({ success: false, error: { code: "VISUAL_TEST_WRITES_BLOCKED" } }),
      });
    }
    const result = responseFor(url.pathname, mode);
    if (!result) {
      unexpectedApiGets.push(request.method() + " " + url.pathname);
      return route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ success: false, error: { code: "UNMOCKED_READ_BLOCKED" } }),
      });
    }
    if ("status" in result) {
      return route.fulfill({
        status: result.status,
        contentType: "application/json",
        body: JSON.stringify(result.body || {}),
      });
    }
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(result) });
  });
  return { context, page, writes, unexpectedApiGets, pageErrors };
}

async function markFixture(page: Page, label: string) {
  await page.evaluate((value) => {
    document.querySelector("[data-qa-fixture]")?.remove();
    const badge = document.createElement("div");
    badge.setAttribute("aria-hidden", "true");
    badge.dataset.qaFixture = "true";
    badge.textContent = "DEVELOPMENT FIXTURE · " + value + " · API STUBS · NO DATABASE WRITES";
    Object.assign(badge.style, {
      position: "fixed",
      top: "7px",
      right: "7px",
      zIndex: "2147483647",
      maxWidth: "calc(100vw - 14px)",
      padding: "5px 8px",
      borderRadius: "5px",
      color: "#fff",
      background: "#7c2d12",
      font: "600 10px/1.3 system-ui, sans-serif",
      boxShadow: "0 2px 10px #0005",
      pointerEvents: "none",
      textAlign: "right",
    });
    document.body.appendChild(badge);
  }, label);
}

async function captureMatrix(page: Page, name: string, manifest: string[], refresh = false) {
  for (const width of VIEWPORTS) {
    await page.setViewportSize({ width, height: 1000 });
    await page.waitForTimeout(120);
    const filename = name + "-" + width + ".png";
    if (refresh || !existsSync(path.join(ARTIFACTS, filename))) {
      await page.screenshot({ path: path.join(ARTIFACTS, filename), fullPage: true, animations: "disabled" });
    }
    manifest.push(filename);
  }
}

async function focusByKeyboard(page: Page, target: ReturnType<Page["getByRole"]>, maxTabs = 120) {
  const traversed = new Set<string>();
  for (let index = 0; index < maxTabs; index += 1) {
    if (await target.evaluate((element) => element === document.activeElement)) return;
    await page.keyboard.press("Tab");
    traversed.add(await page.evaluate(() => {
      const element = document.activeElement as HTMLElement | null;
      return element?.getAttribute("aria-label") || element?.textContent?.trim().replace(/\s+/g, " ").slice(0, 60) || element?.tagName || "no active element";
    }));
  }
  const targetName = await target.evaluate((element) => element.getAttribute("aria-label") || element.textContent?.trim().replace(/\s+/g, " ").slice(0, 60) || element.tagName);
  throw new Error(`Keyboard traversal could not reach "${targetName}" after ${maxTabs} Tab presses. Focus sequence: ${JSON.stringify([...traversed].slice(0, 24))}`);
}

async function hasVisibleFocus(target: ReturnType<Page["getByRole"]>) {
  return target.evaluate((element) => {
    const indicator = [element, element.parentElement, element.closest("label")].filter(Boolean).some((candidate) => {
      const style = window.getComputedStyle(candidate!);
      const outline = Number.parseFloat(style.outlineWidth) > 0 && style.outlineStyle !== "none";
      return outline || style.boxShadow !== "none";
    });
    return element === document.activeElement && element.matches(":focus-visible") && element.getClientRects().length > 0 && indicator;
  });
}

async function readAccessibilityTree(page: Page) {
  if (page.context().browser()?.browserType().name() === "chromium") {
    const cdp = await page.context().newCDPSession(page);
    const { nodes } = await cdp.send("Accessibility.getFullAXTree");
    await cdp.detach();
    return nodes.filter((node: { ignored?: boolean }) => !node.ignored).map((node: { role?: { value?: string }; name?: { value?: string }; properties?: Array<{ name?: string; value?: { value?: unknown } }> }) => ({
      role: node.role?.value || "",
      name: String(node.name?.value || ""),
      properties: Object.fromEntries((node.properties || []).map((property) => [property.name || "", property.value?.value])),
    }));
  }
  const snapshot = await page.locator("body").ariaSnapshot();
  return snapshot.split(/\r?\n/).flatMap((line) => {
    const match = line.match(/^\s*-\s+([a-z][a-z0-9-]*)(?:\s+"([^"]*)")?/i);
    return match ? [{ role: match[1].toLowerCase(), name: match[2] || "", properties: { snapshot: line.trim() } }] : [];
  });
}

async function captureNewEvidence(page: Page, filename: string) {
  const target = path.join(ARTIFACTS, filename);
  if (!existsSync(target)) await page.screenshot({ path: target, fullPage: true, animations: "disabled" });
}

async function checkA11y(page: Page, selector: string, view: string) {
  const result = await new AxeBuilder({ page })
    .include(selector)
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  return result.violations.map((item) => ({
    view,
    id: item.id,
    impact: item.impact,
    description: item.help,
    nodes: item.nodes.length,
    targets: item.nodes.slice(0, 4).map((node) => node.target),
  }));
}

test("Expert V4 isolated responsive, accessibility, and privacy visual audit", async ({ browser }) => {
  await mkdir(ARTIFACTS, { recursive: true });
  const manifest: string[] = [];
  const violations: Array<Record<string, unknown>> = [];
  const writeAttempts = new Set<string>();
  const unexpectedApiGets = new Set<string>();
  const pageErrors = new Set<string>();

  const directory = await createIsolatedPage(browser, { auth: "anonymous" });
  await directory.page.goto("/expert");
  await expect(directory.page.getByRole("heading", { name: "Danh bạ chuyên gia" })).toBeVisible();
  const cards = directory.page.getByRole("list", { name: "Hồ sơ chuyên gia công khai" });
  const profileCards = cards.locator(":scope > li");
  await expect(profileCards).toHaveCount(2);
  await markFixture(directory.page, "EXPERT DIRECTORY");
  const search = directory.page.getByRole("searchbox", { name: "Tìm hồ sơ chuyên gia" });
  await search.fill("chính sách");
  await expect(profileCards).toHaveCount(1);
  await search.fill("");
  const domainSelect = directory.page.getByRole("combobox", { name: "Lọc theo domain" });
  await domainSelect.selectOption("CYBERSECURITY");
  await expect(profileCards).toHaveCount(1);
  await domainSelect.selectOption("ALL");
  violations.push(...await checkA11y(directory.page, "[data-pillar='expert']", "directory"));
  await captureMatrix(directory.page, "directory", manifest);
  for (const value of directory.writes) writeAttempts.add(value);
  for (const value of directory.unexpectedApiGets) unexpectedApiGets.add(value);
  for (const value of directory.pageErrors) pageErrors.add(value);
  await directory.context.close();

  const profile = await createIsolatedPage(browser, { auth: "anonymous" });
  await profile.page.goto("/expert/profile/fixture-expert");
  await expect(profile.page.getByRole("heading", { name: "Chuyên gia minh họa" })).toBeVisible();
  await markFixture(profile.page, "PUBLIC PROFILE");
  await expect(profile.page.getByText(/DEVELOPMENT FIXTURE/)).toBeVisible();
  violations.push(...await checkA11y(profile.page, ".unified-workspace", "profile"));
  await captureMatrix(profile.page, "profile", manifest);
  for (const value of profile.writes) writeAttempts.add(value);
  for (const value of profile.unexpectedApiGets) unexpectedApiGets.add(value);
  for (const value of profile.pageErrors) pageErrors.add(value);
  await profile.context.close();

  const missing = await createIsolatedPage(browser, { auth: "anonymous" });
  await missing.page.goto("/expert/profile/missing-expert");
  await expect(missing.page.getByRole("heading", { name: "Hồ sơ thiếu dữ liệu" })).toBeVisible();
  await expect(missing.page.getByText(/Chưa có domain công khai/)).toBeVisible();
  await markFixture(missing.page, "PROFILE WITH UNKNOWN FIELDS");
  await captureMatrix(missing.page, "profile-missing", manifest);
  for (const value of missing.writes) writeAttempts.add(value);
  for (const value of missing.unexpectedApiGets) unexpectedApiGets.add(value);
  for (const value of missing.pageErrors) pageErrors.add(value);
  await missing.context.close();

  const expert = await createIsolatedPage(browser, { auth: "expert", queue: "one", scope: "matching", review: "open" });
  await expert.page.goto("/expert");
  await expect(expert.page.getByRole("heading", { name: "Hàng đợi đánh giá" })).toBeVisible();
  await expect(expert.page.getByRole("region", { name: "Blind Parallel Expert Review Desk" })).toHaveCount(0);
  const assignment = expert.page.getByRole("button", { name: /Điều kiện xét hỗ trợ học tập/ });
  await expect(assignment).toBeVisible();
  await markFixture(expert.page, "ASSIGNMENT / DOSSIER / ASSESSMENT");
  violations.push(...await checkA11y(expert.page, "section[aria-labelledby='expert-adjudication-title']", "queue"));
  await captureMatrix(expert.page, "queue", manifest, true);

  for (const width of VIEWPORTS) {
    await expert.page.setViewportSize({ width, height: 1000 });
    await assignment.click();
    await expect(expert.page.getByRole("heading", { name: "Hồ sơ và câu hỏi" })).toBeVisible();
    if (width <= 768) await expect(expert.page.getByRole("button", { name: "Quay lại queue" })).toBeFocused();
    const caseName = "case-detail-" + width + ".png";
    const evidenceName = "evidence-" + width + ".png";
    await expert.page.screenshot({ path: path.join(ARTIFACTS, caseName), fullPage: true, animations: "disabled" });
    manifest.push(caseName);
    await expert.page.screenshot({ path: path.join(ARTIFACTS, evidenceName), fullPage: true, animations: "disabled" });
    manifest.push(evidenceName);
    await expect(expert.page.getByRole("heading", { name: "Nhận định độc lập" })).toBeVisible();
    const submit = expert.page.getByRole("button", { name: /Nộp assessment khóa/ });
    if (width === VIEWPORTS[0]) {
      await expect(submit).toBeDisabled();
      await expert.page.getByLabel("Kết luận trong phạm vi được giao").fill("Kết luận nằm trong phạm vi đã giao.");
      await expert.page.getByLabel("Lập luận").fill("Đây là phần lập luận kiểm thử giao diện, không phải đánh giá có hiệu lực.");
      await expert.page.getByLabel(/Tôi đã rà soát assignment/).check();
    } else {
      await expect(expert.page.getByLabel("Kết luận trong phạm vi được giao")).toHaveValue("Kết luận nằm trong phạm vi đã giao.");
    }
    await expect(submit).toBeEnabled();
    const assessmentName = "assessment-" + width + ".png";
    await expert.page.screenshot({ path: path.join(ARTIFACTS, assessmentName), fullPage: true, animations: "disabled" });
    manifest.push(assessmentName);
    if (width <= 768) {
      await expert.page.getByRole("button", { name: "Quay lại queue" }).click();
      await expect(assignment).toBeFocused();
      if (width === 360) await expect(expert.page.getByLabel("Kết luận trong phạm vi được giao")).toHaveValue("Kết luận nằm trong phạm vi đã giao.");
    }
  }
  violations.push(...await checkA11y(expert.page, "section[aria-labelledby='expert-adjudication-title']", "assessment"));
  await expert.page.setViewportSize({ width: 390, height: 844 });
  await expect(expert.page.getByRole("button", { name: "Quay lại queue" })).toBeVisible();
  await expert.page.getByRole("button", { name: "Quay lại queue" }).click();
  await assignment.click();
  await expect(expert.page.getByRole("heading", { name: "Hồ sơ và câu hỏi" })).toBeVisible();
  await expert.page.emulateMedia({ reducedMotion: "reduce" });
  await expert.page.addStyleTag({
    content: "[data-pillar='expert'] :where(p,h1,h2,h3,h4,span,li,label,button){line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}",
  });
  const textSpacingOverflow = await expert.page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(textSpacingOverflow, "390 px text-spacing reflow has no horizontal page overflow").toBe(false);
  await writeFile(path.join(ARTIFACTS, "expert-v4-a11y-and-responsive.json"), JSON.stringify({ violations, textSpacing390HasHorizontalOverflow: textSpacingOverflow }, null, 2));
  await expert.page.screenshot({ path: path.join(ARTIFACTS, "assessment-text-spacing-390.png"), fullPage: true, animations: "disabled" });
  manifest.push("assessment-text-spacing-390.png");
  for (const value of expert.writes) writeAttempts.add(value);
  for (const value of expert.unexpectedApiGets) unexpectedApiGets.add(value);
  for (const value of expert.pageErrors) pageErrors.add(value);
  await expert.context.close();

  const outside = await createIsolatedPage(browser, { auth: "expert", queue: "one", scope: "outside", review: "open" });
  await outside.page.goto("/expert");
  await outside.page.getByRole("button", { name: /Điều kiện xét hỗ trợ học tập/ }).click();
  await expect(outside.page.getByRole("alert").filter({ hasText: /không khớp danh sách domain/ })).toBeVisible();
  await markFixture(outside.page, "OUTSIDE ASSIGNED DOMAIN");
  await captureMatrix(outside.page, "outside-scope", manifest, true);
  for (const value of outside.writes) writeAttempts.add(value);
  for (const value of outside.unexpectedApiGets) unexpectedApiGets.add(value);
  for (const value of outside.pageErrors) pageErrors.add(value);
  await outside.context.close();

  const completed = await createIsolatedPage(browser, { auth: "expert", queue: "one", scope: "matching", review: "completed" });
  await completed.page.goto("/expert");
  await completed.page.getByRole("button", { name: /Điều kiện xét hỗ trợ học tập/ }).click();
  await expect(completed.page.getByText("Assessment đã nộp")).toBeVisible();
  await markFixture(completed.page, "LOCKED ASSESSMENT · WAITING FOR L5");
  await captureMatrix(completed.page, "completed-review-fixture", manifest, true);
  for (const value of completed.writes) writeAttempts.add(value);
  for (const value of completed.unexpectedApiGets) unexpectedApiGets.add(value);
  for (const value of completed.pageErrors) pageErrors.add(value);
  await completed.context.close();

  const privateCase = await createIsolatedPage(browser, { auth: "expert", queue: "empty", scope: "private", review: "open" });
  await privateCase.page.goto("/expert");
  await expect(privateCase.page.getByText("Chưa có assignment đang mở.")).toBeVisible();
  await expect(privateCase.page.getByText(caseSummary.claim)).toHaveCount(0);
  for (const value of privateCase.writes) writeAttempts.add(value);
  for (const value of privateCase.unexpectedApiGets) unexpectedApiGets.add(value);
  for (const value of privateCase.pageErrors) pageErrors.add(value);
  await privateCase.context.close();

  const unknownConflict = await createIsolatedPage(browser, { auth: "expert", queue: "one", scope: "conflict-unknown", review: "open" });
  await unknownConflict.page.goto("/expert");
  await unknownConflict.page.getByRole("button", { name: /Điều kiện xét hỗ trợ học tập/ }).click();
  await expect(unknownConflict.page.getByRole("alert").filter({ hasText: /chưa được xác nhận/ })).toBeVisible();
  await expect(unknownConflict.page.getByRole("button", { name: /Nộp assessment khóa/ })).toBeDisabled();
  for (const value of unknownConflict.writes) writeAttempts.add(value);
  for (const value of unknownConflict.unexpectedApiGets) unexpectedApiGets.add(value);
  for (const value of unknownConflict.pageErrors) pageErrors.add(value);
  await unknownConflict.context.close();

  const summary = {
    evidenceType: "Local deterministic visual fixtures; API requests mocked; non-GET requests blocked",
    capturedAt: new Date().toISOString(),
    viewports: VIEWPORTS,
    screenshotCount: manifest.length,
    screenshots: manifest,
    accessibilityViolations: violations,
    writeAttempts: [...writeAttempts],
    unexpectedApiGets: [...unexpectedApiGets],
    uncaughtPageErrors: [...pageErrors],
  };
  await writeFile(path.join(ARTIFACTS, "manifest.json"), JSON.stringify(summary, null, 2));
  await writeFile(path.join(ARTIFACTS, "expert-v4-a11y-and-responsive.json"), JSON.stringify({
    violations,
    textSpacing390HasHorizontalOverflow: textSpacingOverflow,
    queueBackButtonFocusRestoredAfterMobileNavigation: true,
    reducedMotionEmulated: true,
  }, null, 2));
  expect([...writeAttempts], "the isolated visual run must not make API writes").toEqual([]);
  expect([...unexpectedApiGets], "every same-origin API read must have an explicit local stub").toEqual([]);
  expect([...pageErrors], "no uncaught browser exception").toEqual([]);
  expect(violations.filter((item) => ["critical", "serious"].includes(String(item.impact))), "no serious or critical accessibility violations in inspected feature scopes").toEqual([]);
});

test("Community Expert request status roundtrip and side/bottom sheet", async ({ browser }) => {
  test.setTimeout(120_000);
  const student = await createIsolatedPage(browser, { auth: "student" });
  await student.page.goto("/community", { waitUntil: "domcontentloaded" });
  const contribution = student.page.locator("[data-community-contribution='" + CONTRIBUTION_ID + "']");
  await expect(contribution).toBeVisible();
  await expect(contribution.getByText("Thông tin học vụ này cần được đối chiếu với tài liệu công khai.")).toBeVisible();
  const requestButton = contribution.getByRole("button", { name: /Yêu cầu chuyên gia/ });
  await expect(requestButton).toBeVisible();
  await captureNewEvidence(student.page, "community-fixture-loaded.png");

  await requestButton.click();
  const sheet = student.page.getByRole("dialog", { name: "Yêu cầu đánh giá chuyên môn" });
  await expect(sheet).toBeVisible();
  const previousRequests = sheet.locator("details");
  await expect(previousRequests.locator("summary")).toContainText("Yêu cầu trước đó (1)");
  await markFixture(student.page, "COMMUNITY EXPERT REQUEST STATUS");
  const violations = await checkA11y(student.page, "[role='dialog']", "request-sheet");
  const manifest: string[] = ["community-fixture-loaded.png"];
  await captureMatrix(student.page, "request-sheet", manifest);

  await student.page.getByRole("button", { name: "Đóng yêu cầu chuyên gia" }).click();
  await expect(contribution.getByRole("button", { name: /Đã hoàn tất/ })).toBeVisible();
  await expect(student.page.getByLabel("Thông tin bài viết đang chọn").getByText("Đã hoàn tất · mở Trust để xem phần được phép chia sẻ")).toBeVisible();
  await markFixture(student.page, "COMMUNITY · SERVER STATUS PROJECTION");
  await captureMatrix(student.page, "community-expert-result", manifest);
  violations.push(...await checkA11y(student.page, "section[aria-labelledby='community-title']", "community-expert-result"));
  const summary = {
    evidenceType: "Local deterministic request-status DTO fixture; API writes blocked",
    capturedAt: new Date().toISOString(),
    viewports: VIEWPORTS,
    screenshotCount: manifest.length,
    screenshots: manifest,
    accessibilityViolations: violations,
    writeAttempts: student.writes,
    unexpectedApiGets: student.unexpectedApiGets,
    uncaughtPageErrors: student.pageErrors,
  };
  await writeFile(path.join(ARTIFACTS, "community-expert-roundtrip.json"), JSON.stringify(summary, null, 2));
  expect(student.writes).toEqual([]);
  expect(student.unexpectedApiGets).toEqual([]);
  expect(student.pageErrors).toEqual([]);
  expect(violations.filter((item) => ["critical", "serious"].includes(String(item.impact)))).toEqual([]);
  await student.context.close();
});

test("Expert V4 keyboard-only walkthrough and semantic accessibility tree audit", async ({ browser, browserName }) => {
  test.setTimeout(180_000);
  await mkdir(ARTIFACTS, { recursive: true });
  const keyboard: Record<string, string> = {};
  const semantics: Record<string, unknown> = {};
  const axeFindings: Array<Record<string, unknown>> = [];
  const allWrites = new Set<string>();
  const allUnexpectedReads = new Set<string>();
  const allPageErrors = new Set<string>();
  const importantNames = [
    "Danh bạ chuyên gia", "Hồ sơ chuyên gia công khai", "Chuyên gia minh họa", "Credential công khai",
    "Hàng đợi đánh giá", "Hồ sơ và câu hỏi", "Kết quả Trust hiện tại", "Mở nguồn",
    "Nhận định độc lập", "Kết luận trong phạm vi được giao", "Lập luận", "Yêu cầu đánh giá chuyên môn",
  ];

  const directory = await createIsolatedPage(browser, { auth: "anonymous" });
  await directory.page.goto("/expert");
  await expect(directory.page.getByRole("heading", { name: "Danh bạ chuyên gia" })).toBeVisible();
  const cards = directory.page.getByRole("list", { name: "Hồ sơ chuyên gia công khai" });
  const cardLinks = cards.getByRole("link", { name: "Mở hồ sơ công khai" });
  const search = directory.page.getByRole("searchbox", { name: "Tìm hồ sơ chuyên gia" });
  await focusByKeyboard(directory.page, search);
  expect(await hasVisibleFocus(search), "Directory search must show a visible keyboard focus indicator").toBe(true);
  await directory.page.keyboard.type("chính sách");
  await expect(cards.locator(":scope > li")).toHaveCount(1);
  keyboard.directory_search = "PASS";
  const filter = directory.page.getByRole("combobox", { name: "Lọc theo domain" });
  await focusByKeyboard(directory.page, filter);
  await directory.page.keyboard.press("End");
  await directory.page.keyboard.press("Enter");
  await expect(filter).toHaveValue("PUBLIC_POLICY");
  await expect(cards.locator(":scope > li")).toHaveCount(1);
  keyboard.directory_filter = "PASS";
  await focusByKeyboard(directory.page, filter);
  await directory.page.keyboard.press("Home");
  await directory.page.keyboard.press("Enter");
  await expect(filter).toHaveValue("ALL");
  await directory.page.keyboard.press("Shift+Tab");
  await expect(search).toBeFocused();
  await directory.page.keyboard.press("Control+A");
  await directory.page.keyboard.press("Backspace");
  await expect(search).toHaveValue("");
  await expect(cards.locator(":scope > li")).toHaveCount(2);
  await directory.page.keyboard.press("Tab");
  await expect(filter).toBeFocused();
  await directory.page.keyboard.press("Tab");
  if (await cardLinks.first().evaluate((element) => element === document.activeElement)) {
    keyboard.directory_tab_to_profile_link = "PASS";
  } else if (browserName === "webkit") {
    keyboard.directory_tab_to_profile_link = "NOT_VERIFIED_WEBKIT_DEFAULT_TAB_SEQUENCE_SKIPS_LINKS";
    await cardLinks.first().focus();
  } else {
    const afterCardTab = await directory.page.evaluate(() => {
      const element = document.activeElement as HTMLElement | null;
      return { tag: element?.tagName, text: element?.innerText?.trim().replace(/\s+/g, " "), href: (element as HTMLAnchorElement | null)?.href || null };
    });
    expect(await cardLinks.first().evaluate((element) => element === document.activeElement), JSON.stringify(afterCardTab)).toBe(true);
    keyboard.directory_tab_to_profile_link = "PASS";
  }
  expect(await hasVisibleFocus(cardLinks.first()), "Public profile link must show keyboard focus").toBe(true);
  await directory.page.keyboard.press("Enter");
  await expect(directory.page).toHaveURL(/\/expert\/profile\/fixture-expert$/);
  await expect(directory.page.getByRole("heading", { name: "Chuyên gia minh họa" })).toBeVisible();
  keyboard.directory_to_profile_deep_link = "PASS";
  await expect(directory.page.getByRole("heading", { name: "Credential công khai" })).toBeVisible();
  await expect(directory.page.getByText("Trạng thái: UNKNOWN")).toBeVisible();
  const profileTree = await readAccessibilityTree(directory.page);
  expect(profileTree.some((node) => node.role === "main"), "Profile accessibility tree has a main landmark").toBe(true);
  expect(profileTree.some((node) => node.role === "heading" && node.name === "Credential công khai"), "Credential section is a named heading").toBe(true);
  semantics.profile = profileTree.filter((node) => ["main", "navigation", "heading", "list", "listitem"].includes(node.role) || importantNames.some((name) => node.name.includes(name)));
  const profileAxe = await new AxeBuilder({ page: directory.page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  axeFindings.push(...profileAxe.violations.map((item) => ({ surface: "profile-and-app-shell", id: item.id, impact: item.impact, nodes: item.nodes.length, targets: item.nodes.slice(0, 4).map((node) => node.target) })));
  for (const value of directory.writes) allWrites.add(value);
  for (const value of directory.unexpectedApiGets) allUnexpectedReads.add(value);
  for (const value of directory.pageErrors) allPageErrors.add(value);
  await directory.context.close();

  const adjudication = await createIsolatedPage(browser, { auth: "expert", queue: "one", scope: "matching", review: "open" });
  await adjudication.page.goto("/expert");
  await expect(adjudication.page.getByRole("heading", { name: "Hàng đợi đánh giá" })).toBeVisible();
  await expect(adjudication.page.getByRole("region", { name: "Blind Parallel Expert Review Desk" })).toHaveCount(0);
  const assignment = adjudication.page.getByRole("button", { name: /Điều kiện xét hỗ trợ học tập/ });
  await focusByKeyboard(adjudication.page, assignment);
  expect(await hasVisibleFocus(assignment), "Queue assignment must show keyboard focus").toBe(true);
  await adjudication.page.keyboard.press("Enter");
  await expect(adjudication.page.getByRole("heading", { name: "Hồ sơ và câu hỏi" })).toBeVisible();
  keyboard.queue_case_selection = "PASS";
  const source = adjudication.page.getByRole("link", { name: /Mở nguồn/ });
  if (browserName === "webkit") {
    keyboard.evidence_link_tab_navigation = "NOT_VERIFIED_WEBKIT_DEFAULT_TAB_SEQUENCE_SKIPS_LINKS";
    await source.focus();
  } else {
    await focusByKeyboard(adjudication.page, source);
    keyboard.evidence_link_tab_navigation = "PASS";
  }
  expect(await hasVisibleFocus(source), "Evidence source link must show keyboard focus").toBe(true);
  keyboard.evidence_link_focus = "PASS";
  const submit = adjudication.page.getByRole("button", { name: /Nộp assessment khóa/ });
  await expect(submit).toBeDisabled();
  keyboard.empty_assessment_submit_disabled = "PASS";
  const conclusion = adjudication.page.getByLabel("Kết luận trong phạm vi được giao");
  await focusByKeyboard(adjudication.page, conclusion);
  await adjudication.page.keyboard.type("Kết luận mẫu trong phạm vi assessment.");
  const reasoning = adjudication.page.getByLabel("Lập luận");
  await focusByKeyboard(adjudication.page, reasoning);
  await adjudication.page.keyboard.type("Lập luận fixture được nhập hoàn toàn bằng bàn phím.");
  const assignmentAck = adjudication.page.getByLabel(/Tôi đã rà soát assignment/);
  await focusByKeyboard(adjudication.page, assignmentAck);
  await adjudication.page.keyboard.press("Space");
  await expect(assignmentAck).toBeChecked();
  await expect(submit).toBeEnabled();
  keyboard.assessment_editor_and_validation = "PASS";
  const queueTree = await readAccessibilityTree(adjudication.page);
  expect(queueTree.some((node) => node.role === "main"), "Expert workspace accessibility tree has a main landmark").toBe(true);
  for (const name of ["Hàng đợi đánh giá", "Hồ sơ và câu hỏi", "Kết quả Trust hiện tại", "Nhận định độc lập"]) {
    expect(queueTree.some((node) => node.role === "heading" && node.name === name), `Expected accessible heading: ${name}`).toBe(true);
  }
  expect(queueTree.some((node) => node.role === "link" && node.name.includes("Mở nguồn")), "Evidence source is an accessible link").toBe(true);
  expect(queueTree.some((node) => ["textbox", "searchbox"].includes(node.role) && node.name === "Kết luận trong phạm vi được giao"), "Assessment conclusion has an accessible form name").toBe(true);
  semantics.assessment = queueTree.filter((node) => ["main", "navigation", "heading", "button", "link", "textbox", "checkbox", "status", "alert"].includes(node.role) || importantNames.some((name) => node.name.includes(name)));
  const adjudicationAxe = await new AxeBuilder({ page: adjudication.page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  axeFindings.push(...adjudicationAxe.violations.map((item) => ({ surface: "queue-case-assessment-and-app-shell", id: item.id, impact: item.impact, nodes: item.nodes.length, targets: item.nodes.slice(0, 4).map((node) => node.target) })));
  for (const value of adjudication.writes) allWrites.add(value);
  for (const value of adjudication.unexpectedApiGets) allUnexpectedReads.add(value);
  for (const value of adjudication.pageErrors) allPageErrors.add(value);
  await adjudication.context.close();

  const outside = await createIsolatedPage(browser, { auth: "expert", queue: "one", scope: "outside", review: "open" });
  await outside.page.goto("/expert");
  const outsideAssignment = outside.page.getByRole("button", { name: /Điều kiện xét hỗ trợ học tập/ });
  await focusByKeyboard(outside.page, outsideAssignment);
  await outside.page.keyboard.press("Enter");
  await expect(outside.page.getByRole("alert").filter({ hasText: /không khớp danh sách domain/ })).toBeVisible();
  await expect(outside.page.getByRole("button", { name: /Nộp assessment khóa/ })).toBeDisabled();
  keyboard.outside_scope_blocked = "PASS";
  for (const value of outside.writes) allWrites.add(value);
  for (const value of outside.unexpectedApiGets) allUnexpectedReads.add(value);
  for (const value of outside.pageErrors) allPageErrors.add(value);
  await outside.context.close();

  const unknownConflict = await createIsolatedPage(browser, { auth: "expert", queue: "one", scope: "conflict-unknown", review: "open" });
  await unknownConflict.page.goto("/expert");
  const conflictAssignment = unknownConflict.page.getByRole("button", { name: /Điều kiện xét hỗ trợ học tập/ });
  await focusByKeyboard(unknownConflict.page, conflictAssignment);
  await unknownConflict.page.keyboard.press("Enter");
  await expect(unknownConflict.page.getByRole("alert").filter({ hasText: /chưa được xác nhận/ })).toBeVisible();
  await expect(unknownConflict.page.getByRole("button", { name: /Nộp assessment khóa/ })).toBeDisabled();
  keyboard.conflict_unknown_submission_blocked = "PASS";
  for (const value of unknownConflict.writes) allWrites.add(value);
  for (const value of unknownConflict.unexpectedApiGets) allUnexpectedReads.add(value);
  for (const value of unknownConflict.pageErrors) allPageErrors.add(value);
  await unknownConflict.context.close();

  const student = await createIsolatedPage(browser, { auth: "student" });
  await student.page.setViewportSize({ width: 390, height: 844 });
  await student.page.goto("/community");
  const contribution = student.page.locator("[data-community-contribution='" + CONTRIBUTION_ID + "']");
  const requestButton = contribution.getByRole("button", { name: /Yêu cầu chuyên gia/ });
  await focusByKeyboard(student.page, requestButton);
  expect(await hasVisibleFocus(requestButton), "Community request entry must show keyboard focus").toBe(true);
  await student.page.keyboard.press("Enter");
  const dialog = student.page.getByRole("dialog", { name: "Yêu cầu đánh giá chuyên môn" });
  await expect(dialog).toBeVisible();
  expect(await dialog.getAttribute("aria-modal")).toBe("true");
  const dialogTree = await readAccessibilityTree(student.page);
  expect(dialogTree.some((node) => node.role === "dialog" && node.name === "Yêu cầu đánh giá chuyên môn"), "Request sheet exposes a named modal dialog").toBe(true);
  const close = dialog.getByRole("button", { name: "Đóng yêu cầu chuyên gia" });
  const previousRequests = dialog.locator("summary");
  await expect(previousRequests).toBeVisible();
  await focusByKeyboard(student.page, previousRequests);
  await student.page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await student.page.keyboard.press("Shift+Tab");
  await expect(previousRequests).toBeFocused();
  keyboard.mobile_request_sheet_tab_wrap = "PASS";
  await student.page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(contribution.locator("footer > button")).toBeFocused();
  keyboard.request_sheet_escape_and_focus_restore = "PASS";
  const requestAxe = await new AxeBuilder({ page: student.page }).include("main").withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  axeFindings.push(...requestAxe.violations.map((item) => ({ surface: "community-app-shell", id: item.id, impact: item.impact, nodes: item.nodes.length, targets: item.nodes.slice(0, 4).map((node) => node.target) })));
  for (const value of student.writes) allWrites.add(value);
  for (const value of student.unexpectedApiGets) allUnexpectedReads.add(value);
  for (const value of student.pageErrors) allPageErrors.add(value);
  await student.context.close();

  const severeAxeFindings = axeFindings.filter((item) => ["critical", "serious"].includes(String(item.impact)));
  expect(severeAxeFindings, "Full app-shell automated scans have no serious or critical violations").toEqual([]);
  expect([...allWrites], "keyboard walkthrough performs no writes").toEqual([]);
  expect([...allUnexpectedReads], "keyboard walkthrough reads are isolated").toEqual([]);
  expect([...allPageErrors], "keyboard walkthrough has no uncaught browser errors").toEqual([]);

  await writeFile(path.join(ARTIFACTS, "expert-v4-accessibility-audit.json"), JSON.stringify({
    evidenceType: "Keyboard-only Playwright key events plus Chromium CDP Accessibility.getFullAXTree; full-page Axe scans on Profile, Queue/Case/Assessment, and Community shell; local fixture APIs and writes blocked",
    capturedAt: new Date().toISOString(),
    keyboard,
    semantics,
    requestDialogSemantics: dialogTree.filter((node) => ["dialog", "heading", "combobox", "textbox", "button", "status", "alert"].includes(node.role)),
    axeFindings,
    writes: [...allWrites],
    unexpectedApiReads: [...allUnexpectedReads],
    uncaughtPageErrors: [...allPageErrors],
    scopeLimit: "This is automated Chromium accessibility-tree evidence, not exhaustive screen-reader certification.",
  }, null, 2));
});

test("Expert V4 200 percent zoom-equivalent reflow and WCAG text-spacing stress", async ({ browser }) => {
  test.setTimeout(180_000);
  await mkdir(ARTIFACTS, { recursive: true });
  const results: Array<Record<string, unknown>> = [];
  const stressText = async (page: Page) => {
    await page.addStyleTag({ content: `:where(p,h1,h2,h3,h4,span,li,label,button,summary,a){line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important} p{margin-block-end:2em!important}` });
  };
  const verifyReflow = async (page: Page, surface: string, required: Array<ReturnType<Page["getByRole"]>>) => {
    await page.setViewportSize({ width: 640, height: 900 });
    await stressText(page);
    for (const locator of required) await expect(locator).toBeVisible();
    const layout = await page.evaluate(() => {
      const roots = [...document.querySelectorAll("[data-pillar='expert'], [role='dialog']")];
      const controls = roots.flatMap((root) => [...root.querySelectorAll("a[href],button,input,select,textarea")])
        .filter((element) => (element as HTMLElement).getClientRects().length > 0) as HTMLElement[];
      const outside = controls.filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.left < -1 || rect.right > window.innerWidth + 1;
      }).map((element) => ({ tag: element.tagName, text: element.innerText || element.getAttribute("aria-label") || "", left: Math.round(element.getBoundingClientRect().left), right: Math.round(element.getBoundingClientRect().right) }));
      const clippedText = roots.flatMap((root) => [...root.querySelectorAll("h1,h2,h3,p,li,label,button,summary")])
        .filter((element) => {
          const node = element as HTMLElement;
          const style = getComputedStyle(node);
          return node.getClientRects().length > 0 && ["hidden", "clip"].includes(style.overflowX) && node.scrollWidth > node.clientWidth + 2;
        }).map((element) => (element as HTMLElement).innerText?.slice(0, 100) || "");
      return { cssViewportWidth: window.innerWidth, documentClientWidth: document.documentElement.clientWidth, documentScrollWidth: document.documentElement.scrollWidth, horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1, controlsOutsideViewport: outside, clippedText };
    });
    expect(layout.horizontalOverflow, `${surface}: no horizontal overflow at 200% zoom-equivalent width`).toBe(false);
    expect(layout.controlsOutsideViewport, `${surface}: all visible controls remain inside the viewport`).toEqual([]);
    expect(layout.clippedText, `${surface}: text is not clipped under text-spacing stress`).toEqual([]);
    results.push({ surface, ...layout });
  };

  const directory = await createIsolatedPage(browser, { auth: "anonymous" });
  await directory.page.goto("/expert");
  await expect(directory.page.getByRole("heading", { name: "Danh bạ chuyên gia" })).toBeVisible();
  await verifyReflow(directory.page, "directory", [directory.page.getByRole("searchbox", { name: "Tìm hồ sơ chuyên gia" }), directory.page.getByRole("combobox", { name: "Lọc theo domain" }), directory.page.getByRole("link", { name: "Mở hồ sơ công khai" }).first()]);
  await markFixture(directory.page, "200% ZOOM EQUIVALENT · DIRECTORY");
  await captureNewEvidence(directory.page, "zoom-200-directory-640.png");
  await directory.context.close();

  const profile = await createIsolatedPage(browser, { auth: "anonymous" });
  await profile.page.goto("/expert/profile/fixture-expert");
  await expect(profile.page.getByRole("heading", { name: "Chuyên gia minh họa" })).toBeVisible();
  await verifyReflow(profile.page, "profile", [profile.page.getByRole("heading", { name: "Credential công khai" }), profile.page.getByRole("heading", { name: "Đánh giá đã công bố" }), profile.page.getByRole("heading", { name: "Ngoài phạm vi đã khai báo" })]);
  await markFixture(profile.page, "200% ZOOM EQUIVALENT · PROFILE");
  await captureNewEvidence(profile.page, "zoom-200-profile-640.png");
  await profile.context.close();

  const expert = await createIsolatedPage(browser, { auth: "expert", queue: "one", scope: "matching", review: "open" });
  await expert.page.goto("/expert");
  await expect(expert.page.getByRole("heading", { name: "Hàng đợi đánh giá" })).toBeVisible();
  await verifyReflow(expert.page, "queue", [expert.page.getByRole("heading", { name: "Hàng đợi đánh giá" }), expert.page.getByRole("button", { name: /Điều kiện xét hỗ trợ học tập/ })]);
  await markFixture(expert.page, "200% ZOOM EQUIVALENT · QUEUE");
  await captureNewEvidence(expert.page, "zoom-200-queue-640.png");
  await expert.page.getByRole("button", { name: /Điều kiện xét hỗ trợ học tập/ }).click();
  await expect(expert.page.getByRole("heading", { name: "Hồ sơ và câu hỏi" })).toBeVisible();
  await verifyReflow(expert.page, "case-detail", [expert.page.getByRole("heading", { name: "Hồ sơ và câu hỏi" }), expert.page.getByRole("link", { name: /Mở nguồn/ })]);
  await captureNewEvidence(expert.page, "zoom-200-case-640.png");
  await expect(expert.page.getByRole("heading", { name: "Nhận định độc lập" })).toBeVisible();
  await verifyReflow(expert.page, "assessment", [expert.page.getByLabel("Kết luận trong phạm vi được giao"), expert.page.getByLabel("Lập luận"), expert.page.getByRole("button", { name: /Nộp assessment khóa/ })]);
  await captureNewEvidence(expert.page, "zoom-200-assessment-640.png");
  for (const value of expert.writes) expect(value).toBe("");
  await expert.context.close();

  const student = await createIsolatedPage(browser, { auth: "student" });
  await student.page.goto("/community");
  const contribution = student.page.locator("[data-community-contribution='" + CONTRIBUTION_ID + "']");
  await contribution.getByRole("button", { name: /Yêu cầu chuyên gia/ }).click();
  const sheet = student.page.getByRole("dialog", { name: "Yêu cầu đánh giá chuyên môn" });
  await expect(sheet).toBeVisible();
  await verifyReflow(student.page, "request-sheet", [sheet.getByRole("heading", { name: "Yêu cầu đánh giá chuyên môn" }), sheet.getByLabel("Domain hoặc lĩnh vực cần xem xét"), sheet.getByLabel("Câu hỏi cho người đánh giá"), sheet.getByRole("button", { name: "Gửi yêu cầu" })]);
  await markFixture(student.page, "200% ZOOM EQUIVALENT · REQUEST SHEET");
  await captureNewEvidence(student.page, "zoom-200-request-sheet-640.png");
  expect(student.writes).toEqual([]);
  expect(student.unexpectedApiGets).toEqual([]);
  await student.context.close();

  await writeFile(path.join(ARTIFACTS, "expert-v4-zoom-reflow.json"), JSON.stringify({
    evidenceType: "Chromium CSS viewport equivalent to 200% browser zoom from a 1280 CSS-pixel baseline; WCAG text-spacing stress applied to Expert and request-sheet UI",
    capturedAt: new Date().toISOString(),
    textSpacing: { lineHeight: "1.5", paragraphSpacing: "2em", letterSpacing: "0.12em", wordSpacing: "0.16em" },
    surfaces: results,
    writesBlocked: true,
    note: "This tests reflow at a 640 CSS-pixel viewport (the equivalent of 200% zoom on a 1280 CSS-pixel viewport), not browser chrome magnification on a physical monitor.",
  }, null, 2));
});
