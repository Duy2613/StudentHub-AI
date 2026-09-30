import { expect, test, type Browser, type Route } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE_URL = "http://127.0.0.1:3102";
const ARTIFACTS = path.resolve(process.cwd(), "../artifacts/visual/EXPERT_V4/2026-09-27");
const REPEATS = 5;
const VIEWPORT = { width: 1280, height: 960 };
const ID = {
  expert: "f7338472-6392-4ca0-9d63-63028558713a",
  case: "e7338472-6392-4ca0-9d63-63028558713a",
  assignment: "a7338472-6392-4ca0-9d63-63028558713a",
  request: "b7338472-6392-4ca0-9d63-63028558713a",
  claim: "c7338472-6392-4ca0-9d63-63028558713a",
  evidence: "d7338472-6392-4ca0-9d63-63028558713a",
  contribution: "e8338472-6392-4ca0-9d63-63028558713a",
};

// Values use the existing ExpertPublicDTO and blind-review dossier shapes.
// Their source is this Playwright-only API interception; they are not app data.
const expertProfile = {
  expertId: "expert-v4-performance-fixture",
  canonicalIdentity: "Chuyên gia minh họa",
  name: "Chuyên gia minh họa",
  title: "Hồ sơ giao diện hiệu năng",
  bio: "Dữ liệu tổng hợp trong harness kiểm tra render hồ sơ.",
  institution: "Đơn vị minh họa",
  department: "Phạm vi học thuật",
  affiliationStatus: null,
  status: "UNVERIFIED_EXPERT",
  directoryUrl: null,
  verifiedEmailDomain: null,
  scopes: [{ domain: "PUBLIC_POLICY", subdomain: "Chính sách học vụ", level: "DECLARED", jurisdiction: null, citationCount: null, recencyYear: null, isEstablished: false }],
  credentials: [{ type: "Credential minh họa", field: "Chính sách học vụ", issuer: "Nguồn chưa xác minh", issuedYear: 2024, status: "UNKNOWN" }],
  roles: [],
  publications: [{ title: "Công trình mẫu để đo bố cục", venue: "Nguồn chưa xác minh", year: 2025, domain: "PUBLIC_POLICY", doi: null }],
  reputationState: null,
  earnedStars: [],
  verificationSummary: { status: "UNVERIFIED_EXPERT", identity: "UNVERIFIED", affiliation: "HISTORICAL_OR_UNVERIFIED", verifiedCredentials: 0, groundedPublications: 0, latestResearchYear: 2025, researchFreshness: "AGING", activeConflicts: 0, lastCheckedAt: null, evidenceGrade: "D" },
  authorityBoundaries: { establishedDomains: [], limitedDomains: [], outOfScopeDomains: ["MEDICAL_DIAGNOSIS"], institutionalAuthority: false, warning: "Hồ sơ mẫu chỉ kiểm tra cách hiển thị; thẩm quyền không được suy ra." },
};

const secondExpert = {
  ...expertProfile,
  expertId: "expert-v4-performance-fixture-2",
  name: "Hồ sơ minh họa thứ hai",
  canonicalIdentity: "Hồ sơ minh họa thứ hai",
  scopes: [{ ...expertProfile.scopes[0], domain: "CYBERSECURITY", subdomain: null }],
  credentials: [],
  publications: [],
};

const dossier = {
  assignmentId: ID.assignment,
  reviewRequestId: ID.request,
  caseId: ID.case,
  caseRevision: 3,
  claimId: ID.claim,
  domain: "PUBLIC_POLICY",
  claim: "Điều kiện xét hỗ trợ học tập cần được đối chiếu với quy định công khai.",
  reviewQuestion: "Nguồn quy định công khai nào áp dụng cho điều kiện này?",
  evidenceRevisionIds: [ID.evidence],
  evidence: [{ id: ID.evidence, sourceType: "PUBLIC_DOCUMENT", sourceIdentifier: "https://example.edu.vn/policy/sample", observedAt: "2026-09-01T08:00:00.000Z", confidence: 0.8 }],
  missingEvidenceIds: [],
  boundedContext: { type: "COMMUNITY_CONTRIBUTION", communityContributionId: ID.contribution, snippet: "Nội dung cộng đồng mẫu trong phạm vi dossier.", url: null, mediaArtifactId: null, timestamp: "2026-09-01T08:00:00.000Z" },
  status: "ASSIGNED",
  caseVisibility: "PUBLIC",
  conflictOfInterest: false,
  deadline: "2026-10-01T00:00:00.000Z",
  createdAt: "2026-09-01T08:00:00.000Z",
  assessmentState: "ASSIGNED",
  isLocked: false,
  ownDraft: null,
};

function responseFor(pathname: string, expertMode: boolean, markProfileFixture = false) {
  if (pathname === "/api/auth/session") {
    return { authenticated: expertMode, user: expertMode ? { id: ID.expert, email: "expert-fixture@example.invalid", roles: ["EXPERT"] } : null };
  }
  if (pathname === "/api/users/me") return { success: true, profile: { fullName: "Người dùng fixture" } };
  if (pathname === "/api/expert/qualification") return { success: true, contractVersion: "expert-qualification.v1", data: { state: "ACTIVE", application: { approvedDomains: ["PUBLIC_POLICY"] } } };
  if (pathname === "/api/v1/experts") return { success: true, contractVersion: "experts.v1", data: { total: 2, experts: [expertProfile, secondExpert] } };
  if (pathname === "/api/expert/profile/expert-v4-performance-fixture") {
    return {
      success: true,
      expert: expertProfile,
      ...(markProfileFixture ? { meta: { sourceState: "DEMO_FIXTURE" } } : {}),
    };
  }
  if (pathname === "/api/expert/blind-reviews") return { success: true, contractVersion: "blind-expert-review.v1", pendingCount: 1, reviews: [dossier], meta: { blindMode: true, preSubmissionAiResultLeak: 0 } };
  if (pathname === `/api/expert/blind-reviews/${ID.assignment}`) return { success: true, contractVersion: "blind-expert-review.v1", dossier };
  if (pathname === "/api/realtime/stream") return { status: 204, body: {} };
  return null;
}

async function isolatePage(browser: Browser, expertMode: boolean, markProfileFixture = false) {
  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();
  const writes: string[] = [];
  const unexpectedApiReads: string[] = [];
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.addInitScript(() => {
    Object.assign(window, { __expertV4PerfHarness: true });
    performance.mark("expert-v4:hydration-start");
    if (document.documentElement) document.documentElement.dataset.expertPerfHarness = "true";
    const longTasks: number[] = [];
    Object.assign(window, { __expertV4LongTasks: longTasks });
    if (typeof PerformanceObserver !== "undefined" && PerformanceObserver.supportedEntryTypes?.includes("longtask")) {
      new PerformanceObserver((list) => {
        for (const item of list.getEntries()) longTasks.push(item.duration);
      }).observe({ type: "longtask", buffered: true });
    }
  });
  await page.route("**/*", async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin !== BASE_URL) return route.abort("blockedbyclient");
    if (!url.pathname.startsWith("/api/")) return route.continue();
    if (!["GET", "HEAD"].includes(request.method())) {
      writes.push(`${request.method()} ${url.pathname}`);
      return route.fulfill({ status: 409, contentType: "application/json", body: JSON.stringify({ error: { code: "PERFORMANCE_FIXTURE_WRITES_BLOCKED" } }) });
    }
    const result = responseFor(url.pathname, expertMode, markProfileFixture);
    if (!result) {
      unexpectedApiReads.push(`${request.method()} ${url.pathname}`);
      return route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: { code: "PERFORMANCE_FIXTURE_UNMOCKED" } }) });
    }
    const status = "status" in result && typeof result.status === "number" ? result.status : 200;
    return route.fulfill({ status, contentType: "application/json", body: JSON.stringify("body" in result ? result.body : result) });
  });
  return { context, page, writes, unexpectedApiReads, pageErrors };
}

async function measurePage(browser: Browser, surface: "directory" | "profile" | "queue" | "case") {
  const isolated = await isolatePage(browser, surface === "queue" || surface === "case");
  const { page } = isolated;
  const startedAt = Date.now();
  await page.goto(surface === "profile" ? "/expert/profile/expert-v4-performance-fixture" : "/expert", { waitUntil: "domcontentloaded" });

  if (surface === "directory") {
    await expect(page.getByRole("heading", { name: "Danh bạ chuyên gia" })).toBeVisible();
    await expect(page.getByRole("list", { name: "Hồ sơ chuyên gia công khai" })).toBeVisible();
  } else if (surface === "profile") {
    await expect(page.getByRole("heading", { name: "Chuyên gia minh họa" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Credential công khai" })).toBeVisible();
  } else if (surface === "queue") {
    await expect(page.getByRole("heading", { name: "Hàng đợi đánh giá" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Điều kiện xét hỗ trợ học tập/ })).toBeVisible();
  } else {
    await expect(page.getByRole("heading", { name: "Hàng đợi đánh giá" })).toBeVisible();
    await page.getByRole("button", { name: /Điều kiện xét hỗ trợ học tập/ }).click();
    await expect(page.getByRole("heading", { name: "Hồ sơ và câu hỏi" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Nhận định độc lập" })).toBeVisible();
  }

  const hydrationMetric = surface === "case" ? "queue.hydration-complete" : `${surface}.hydration-complete`;
  await page.waitForFunction((metric) => performance.getEntriesByName(`expert-v4:${metric}`, "mark").length > 0, hydrationMetric).catch(async (error) => {
    const diagnostic = await page.evaluate(() => ({
      harness: document.documentElement.dataset.expertPerfHarness,
      globalHarness: (window as Window & { __expertV4PerfHarness?: boolean }).__expertV4PerfHarness,
      marks: performance.getEntriesByType("mark").map((entry) => entry.name),
      directoryTitle: document.querySelector("#expert-directory-title")?.textContent,
      pageErrors: isolated.pageErrors,
    }));
    throw new Error(`${error.message}; User Timing diagnostic: ${JSON.stringify(diagnostic)}`);
  });
  await page.waitForFunction((metric) => performance.getEntriesByName(`expert-v4:${metric}`, "mark").length > 0, `${surface}.usable`);

  const timing = await page.evaluate((name) => {
    const entries = performance.getEntriesByType("mark");
    const timeOf = (metric: string) => entries.find((entry) => entry.name === `expert-v4:${metric}`)?.startTime ?? null;
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const scripts = performance.getEntriesByType("resource")
      .filter((entry) => entry.name.includes("/_next/static/chunks/") && /\.js(?:\?|$)/.test(entry.name))
      .map((entry) => entry as PerformanceResourceTiming);
    const win = window as Window & { __expertV4LongTasks?: number[] };
    const hydrationStart = timeOf("hydration-start");
    const hydrationComplete = timeOf(`${name === "case" ? "queue" : name}.hydration-complete`);
    const useful = timeOf(`${name}.usable`);
    return {
      htmlResponseEndMs: navigation ? Math.round(navigation.responseEnd) : null,
      domContentLoadedMs: navigation ? Math.round(navigation.domContentLoadedEventEnd) : null,
      firstContentfulPaintMs: Math.round(performance.getEntriesByName("first-contentful-paint")[0]?.startTime || 0),
      hydrationStartMs: hydrationStart,
      hydrationCompleteMs: hydrationComplete,
      bootstrapToSurfaceCommitMs: hydrationStart !== null && hydrationComplete !== null ? Math.round(hydrationComplete - hydrationStart) : null,
      usefulStateMs: useful === null ? null : Math.round(useful),
      jsChunkCount: scripts.length,
      jsEncodedBytes: scripts.reduce((sum, entry) => sum + entry.encodedBodySize, 0),
      jsDecodedBytes: scripts.reduce((sum, entry) => sum + entry.decodedBodySize, 0),
      jsTransferBytes: scripts.reduce((sum, entry) => sum + entry.transferSize, 0),
      longTasksMs: win.__expertV4LongTasks || [],
    };
  }, surface);
  const sample = { surface, timeToExpectedUiMs: Date.now() - startedAt, ...timing, writes: isolated.writes, unexpectedApiReads: isolated.unexpectedApiReads, pageErrors: isolated.pageErrors };
  await isolated.context.close();
  return sample;
}

function median(values: number[]) {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)];
}

function summarize(samples: Array<Record<string, unknown>>, key: string) {
  const values = samples.map((sample) => sample[key]).filter((value): value is number => typeof value === "number");
  return values.length ? { median: median(values), range: [Math.min(...values), Math.max(...values)], samples: values } : { median: null, range: null, samples: [] };
}

test("Expert V4 LAB production render, route JavaScript, and hydration measurements", async ({ browser }) => {
  test.setTimeout(240_000);
  await mkdir(ARTIFACTS, { recursive: true });
  const bySurface: Record<string, Array<Record<string, unknown>>> = {};
  for (const surface of ["directory", "profile", "queue", "case"] as const) {
    bySurface[surface] = [];
    for (let repeat = 0; repeat < REPEATS; repeat += 1) {
      const sample = await measurePage(browser, surface);
      expect(sample.writes, `${surface} must make no API writes`).toEqual([]);
      expect(sample.unexpectedApiReads, `${surface} must use only declared fixture reads`).toEqual([]);
      expect(sample.pageErrors, `${surface} must hydrate without browser errors`).toEqual([]);
      expect(sample.usefulStateMs, `${surface} must emit a direct User Timing useful-state mark`).not.toBeNull();
      expect(sample.bootstrapToSurfaceCommitMs, `${surface} must emit hydration lifecycle marks`).not.toBeNull();
      bySurface[surface].push({ repeat: repeat + 1, ...sample });
    }
  }

  const profileGuard = await isolatePage(browser, false, true);
  await profileGuard.page.goto("/expert/profile/expert-v4-performance-fixture", { waitUntil: "domcontentloaded" });
  await expect(profileGuard.page.getByText("Development fixture profiles are not available in production.")).toBeVisible();
  expect(profileGuard.writes).toEqual([]);
  expect(profileGuard.unexpectedApiReads).toEqual([]);
  expect(profileGuard.pageErrors).toEqual([]);
  await profileGuard.context.close();

  const summary = {
    evidenceType: "LAB_LOCAL_OPTIMIZED_PRODUCTION · Playwright-only route interception · schema-shaped deterministic DTO data · no DB · no API writes · external origins blocked",
    capturedAt: new Date().toISOString(),
    repeats: REPEATS,
    viewport: VIEWPORT,
    hydrationDefinition: "document-start mark to the Expert surface's first React effect commit; bootstrap plus feature hydration proxy, not isolated React CPU time",
    shellDefinition: "navigation responseEnd records completion of the server-rendered HTML response",
    productionFixtureGuard: "PASS: an explicitly DEMO_FIXTURE profile is rejected; the render benchmark uses only test-harness API interception and labels its data in this artifact",
    surfaces: Object.fromEntries(Object.entries(bySurface).map(([surface, samples]) => [surface, {
      samples,
      timeToUi: summarize(samples, "usefulStateMs"),
      bootstrapToSurfaceCommit: summarize(samples, "bootstrapToSurfaceCommitMs"),
      htmlResponseEnd: summarize(samples, "htmlResponseEndMs"),
      firstContentfulPaint: summarize(samples, "firstContentfulPaintMs"),
      jsEncodedBytes: summarize(samples, "jsEncodedBytes"),
      jsDecodedBytes: summarize(samples, "jsDecodedBytes"),
      jsTransferBytes: summarize(samples, "jsTransferBytes"),
      jsChunkCount: summarize(samples, "jsChunkCount"),
      longTasksMs: samples.map((sample) => sample.longTasksMs),
  }])),
  };
  await writeFile(path.join(ARTIFACTS, "expert-v4-performance-lab.json"), JSON.stringify(summary, null, 2));
});
