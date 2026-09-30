import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page, type Route } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const trustId = "11111111-1111-4111-8111-111111111111";
const caseId = "22222222-2222-4222-8222-222222222222";
const claimId = "33333333-3333-4333-8333-333333333333";
const revisionId = "44444444-4444-4444-8444-444444444444";
const discussionId = "55555555-5555-4555-8555-555555555555";
const newDiscussionId = "66666666-6666-4666-8666-666666666666";
const reportDir = resolve(process.cwd(), process.env.COMMUNITY_V4_ARTIFACTS || "../artifacts/community-v4.2-review-20260927");

type DiscussionComment = {
  commentId: string;
  author: { name: string; avatarUrl?: string | null };
  text: string;
  createdAt: string;
};

type SocialPost = {
  postId: string;
  author: { name: string; avatarUrl: string | null };
  createdAt: string;
  topic: string;
  title: string;
  content: string;
  sources: Array<{ url: string; publisher: string | null }>;
  media: string[];
  likeCount: number;
  commentCount: number;
  comments: DiscussionComment[];
  isAuthoritative: boolean;
};

function makeFixtures() {
  const discussion: SocialPost = {
    postId: discussionId,
    author: { name: "Duy Ngô", avatarUrl: null },
    createdAt: "2026-09-26T08:45:00.000Z",
    topic: "GENERAL",
    title: "Có ai từng gặp trường hợp đăng ký học phần bị trùng lịch chưa?",
    content: "Có ai từng gặp trường hợp đăng ký học phần bị trùng lịch chưa? Mình muốn nghe cách mọi người kiểm tra trước khi gửi yêu cầu hỗ trợ.",
    sources: [],
    media: [],
    likeCount: 12,
    commentCount: 2,
    comments: [
      { commentId: "d1111111-1111-4111-8111-111111111111", author: { name: "Minh Anh" }, text: "Mình gặp tuần trước, thử đối chiếu thời khóa biểu trước nhé.", createdAt: "2026-09-26T09:00:00.000Z" },
      { commentId: "d2222222-2222-4222-8222-222222222222", author: { name: "Quốc Bảo" }, text: "Phòng đào tạo có hướng dẫn kiểm tra theo mã lớp.", createdAt: "2026-09-26T09:20:00.000Z" },
    ],
    isAuthoritative: false,
  };
  const trustPost = {
    postId: trustId,
    contributionId: trustId,
    title: "Thông báo về lịch đăng ký học phần",
    statement: "Thông báo lịch đăng ký được cập nhật vào sáng thứ Hai. Mình đối chiếu nội dung hiển thị với trang thông tin của trường, nhưng chưa xác nhận được toàn bộ các ngành.",
    createdAt: "2026-09-26T07:10:00.000Z",
    contributionType: "DIRECT_EXPERIENCE",
    caseScope: { caseId, caseRevision: 4 },
    claimId,
    trustFreshness: "STALE",
    trustFreshnessReason: "CASE_REVISION_ADVANCED",
    latestCaseRevision: 5,
    canRequestExpert: true,
    revision: 2,
    sources: [{ url: "https://moet.gov.vn", publisher: "Bộ Giáo dục và Đào tạo" }],
    evidenceRefs: [{ url: "https://moet.gov.vn" }],
    evidenceRevisionIds: [revisionId],
    commentCount: 3,
    reactions: { helpful: 18, addEvidence: 2, challenge: 1, insufficientInformation: 0, reportAbuse: 0 },
    publicationState: "PUBLISHED",
    reviewState: "OPEN",
  };
  const comments = [
    {
      commentId: "a1111111-1111-4111-8111-111111111111",
      parentCommentId: null,
      depth: 0,
      status: "PUBLISHED",
      authorLabel: "Người tham gia 18A4F9C2D1",
      content: "Mình cũng thấy mốc thời gian này, nhưng trang trường chưa có thông báo cho tất cả khoa.",
      createdAt: "2026-09-26T07:40:00.000Z",
      replies: [
        {
          commentId: "a2222222-2222-4222-8222-222222222222",
          parentCommentId: "a1111111-1111-4111-8111-111111111111",
          depth: 1,
          status: "PUBLISHED",
          authorLabel: "Người tham gia 7C3D1B6A50",
          content: "Đúng, trang của khoa mình hiện vẫn ghi bản cũ.",
          createdAt: "2026-09-26T08:05:00.000Z",
          replies: [
            {
              commentId: "a3333333-3333-4333-8333-333333333333",
              parentCommentId: "a2222222-2222-4222-8222-222222222222",
              depth: 2,
              status: "PUBLISHED",
              authorLabel: "Người tham gia F25A31D8B9",
              content: "Mình đã gửi câu hỏi cho phòng đào tạo để xác nhận phạm vi.",
              createdAt: "2026-09-26T08:30:00.000Z",
              replies: [],
            },
          ],
        },
      ],
    },
  ];
  return { discussion, trustPost, comments, discussions: [discussion], publishedBody: null as null | Record<string, unknown>, trustCaseRequestCount: 0 };
}

async function json(route: Route, body: unknown, status = 200) {
  await route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
}

async function hideNextDevIndicator(page: Page) {
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
}

async function installFixtureRealtime(page: Page) {
  await page.addInitScript(() => {
    type FixtureRealtimeWindow = Window & {
      __activeCommunityEventSource?: EventTarget;
      __emitCommunityEvent?: (record: { eventType: string; [key: string]: unknown }) => void;
    };
    class FixtureEventSource extends EventTarget {
      readyState = 0;
      onopen: ((event: Event) => void) | null = null;

      constructor() {
        super();
        const fixtureWindow = window as FixtureRealtimeWindow;
        fixtureWindow.__activeCommunityEventSource = this;
        queueMicrotask(() => {
          this.readyState = 1;
          this.onopen?.(new Event("open"));
        });
      }

      close() { this.readyState = 2; }
    }
    const fixtureWindow = window as FixtureRealtimeWindow;
    Object.defineProperty(window, "EventSource", { configurable: true, value: FixtureEventSource });
    fixtureWindow.__emitCommunityEvent = (record) => {
      fixtureWindow.__activeCommunityEventSource?.dispatchEvent(new MessageEvent(record.eventType, { data: JSON.stringify(record) }));
    };
  });
}

async function assertNoSeriousAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  const violations = results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact || ""));
  const details = violations.map((violation) => ({
    id: violation.id,
    help: violation.help,
    nodes: violation.nodes.map((node) => ({ target: node.target, summary: node.failureSummary })),
  }));
  expect(violations.map((violation) => violation.id), JSON.stringify(details, null, 2)).toEqual([]);
}

async function installFixtureRoutes(page: Page, fixture = makeFixtures()) {
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    if (path === "/api/auth/session") {
      return json(route, { authenticated: true, user: { id: "77777777-7777-4777-8777-777777777777", email: "duy@example.test", fullName: "Duy Ngô", roles: ["STUDENT"], emailVerified: false } });
    }
    if (path === "/api/users/me") {
      return json(route, { success: true, profile: { displayName: "Duy Ngô", avatarUrl: null, institutionalEmailVerified: false } });
    }
    if (path === "/api/expert/qualification") return json(route, { success: true, data: null });
    if (path === "/api/v1/trust/cases") {
      fixture.trustCaseRequestCount += 1;
      return json(route, { success: true, cases: [{ id: caseId, case_revision: 4, created_at: "2026-09-01T00:00:00.000Z", state: "OPEN" }] });
    }
    if (path === `/api/v1/trust/cases/${caseId}`) {
      fixture.trustCaseRequestCount += 1;
      return json(route, { success: true, case: { id: caseId, case_revision: 4, claims: [], evidence: [] } });
    }
    if (path === "/api/intelligence/community/posts" || path === "/api/intelligence/community/search") {
      return json(route, { success: true, total: 1, posts: [fixture.trustPost], sourceState: "DEMO_FIXTURE", isAuthoritative: false });
    }
    if (path === `/api/intelligence/community/experiences/${trustId}`) {
      return json(route, { success: true, experience: fixture.trustPost, sourceState: "DEMO_FIXTURE", isAuthoritative: false });
    }
    if (path === `/api/intelligence/community/posts/${trustId}/comments`) {
      return json(route, { success: true, contractVersion: "community-thread.v1", comments: fixture.comments, maxDepth: 3 });
    }
    if (path === "/api/community/social") {
      if (method === "GET") {
        const postId = url.searchParams.get("postId");
        const posts = postId ? fixture.discussions.filter((post) => post.postId === postId) : fixture.discussions;
        return json(route, { success: true, contractVersion: "community-social.v1", posts, sourceState: "DEMO_FIXTURE", isAuthoritative: false });
      }
      if (method === "POST") {
        fixture.publishedBody = request.postDataJSON() as Record<string, unknown>;
        const body = fixture.publishedBody;
        const content = String(body.content || "");
        const post = {
          ...fixture.discussion,
          postId: newDiscussionId,
          title: content.split(/[.!?\n]/)[0],
          content,
          topic: String(body.topic || "GENERAL"),
          sources: body.sourceUrl ? [{ url: String(body.sourceUrl), publisher: "Nguồn cộng đồng" }] : [],
          likeCount: 0,
          commentCount: 0,
          comments: [],
        };
        fixture.discussions = [post, ...fixture.discussions];
        return json(route, { success: true, post, sourceState: "DEMO_FIXTURE", isAuthoritative: false }, 201);
      }
      if (method === "PATCH") {
        const body = request.postDataJSON() as { postId: string; action: string; text?: string };
        const post = fixture.discussions.find((item) => item.postId === body.postId);
        if (!post) return json(route, { success: false, error: { code: "NOT_FOUND" } }, 404);
        if (body.action === "comment" && body.text) {
          post.comments = [...post.comments, { commentId: "d3333333-3333-4333-8333-333333333333", author: { name: "Duy Ngô" }, text: body.text, createdAt: new Date().toISOString() }];
          post.commentCount = post.comments.length;
        }
        if (body.action === "like") post.likeCount += 1;
        return json(route, { success: true, post, sourceState: "DEMO_FIXTURE", isAuthoritative: false });
      }
    }
    if (path === "/api/expert/review-requests") return json(route, { success: true, data: [] });
    if (path === "/api/realtime/stream") return route.abort();
    return json(route, { success: false, error: { code: "UNMOCKED_FIXTURE_API_ROUTE" } }, 501);
  });
  return fixture;
}

async function openCommunityPage(page: Page, path = "/community") {
  const sessionReady = page.waitForResponse((response) => new URL(response.url()).pathname === "/api/auth/session");
  const profileReady = page.waitForResponse((response) => new URL(response.url()).pathname === "/api/users/me");
  await page.goto(path);
  await Promise.all([sessionReady, profileReady]);
}

test("HUMAN_FIRST_CHECK: a normal question publishes and conversation works without opening Trust", async ({ page }) => {
  await installFixtureRealtime(page);
  const fixture = await installFixtureRoutes(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await openCommunityPage(page);
  await hideNextDevIndicator(page);
  await expect(page.getByRole("heading", { name: "Community." })).toBeVisible();

  const questionTrigger = page.getByRole("region", { name: "Tạo bài viết cộng đồng" }).getByRole("button", { name: "Câu hỏi", exact: false });
  await questionTrigger.click();
  const composer = page.getByRole("dialog", { name: "Bạn muốn chia sẻ điều gì?" });
  await expect(composer).toBeVisible();
  await expect(composer.getByRole("button", { name: "Đóng composer" })).toBeFocused();
  await expect(composer.getByLabel("Trust case")).toHaveCount(0);
  await expect(composer.getByText("Duy Ngô")).toBeVisible();
  await expect(composer.getByText(/email và thông tin tài khoản riêng không được hiển thị/)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(composer).toHaveCount(0);
  await expect(questionTrigger).toBeFocused();
  await questionTrigger.click();
  await composer.getByLabel(/Bài viết/).fill("Có ai từng gặp trường hợp đăng ký học phần bị trùng lịch chưa? Mình muốn nghe kinh nghiệm.");
  await composer.getByRole("button", { name: "Đăng bài" }).click();

  const post = page.locator(`[data-community-discussion="${newDiscussionId}"]`);
  await expect(post).toContainText("Có ai từng gặp trường hợp đăng ký học phần bị trùng lịch chưa?");
  expect(fixture.publishedBody?.topic).toBe("GENERAL");
  expect(fixture.publishedBody?.caseId).toBeUndefined();
  expect(fixture.publishedBody?.caseRevision).toBeUndefined();
  expect(fixture.trustCaseRequestCount).toBe(0);

  await post.getByRole("button", { name: /Bình luận/ }).click();
  await expect(post).toContainText("Chưa có bình luận");
  const newPost = fixture.discussions.find((item) => item.postId === newDiscussionId);
  expect(newPost).toBeTruthy();
  newPost!.comments = [{ commentId: "d4444444-4444-4444-8444-444444444444", author: { name: "Bạn học B" }, text: "Bình luận realtime từ fixture", createdAt: new Date().toISOString() }];
  newPost!.commentCount = 1;
  await page.evaluate((record) => {
    const fixtureWindow = window as typeof window & { __emitCommunityEvent?: (value: unknown) => void };
    fixtureWindow.__emitCommunityEvent?.(record);
  }, { eventId: "community-comment-fixture-1", channel: "community", eventType: "community:comment", data: { postId: newDiscussionId, action: "COMMENT_CREATED" } });
  await expect(post).toContainText("Bình luận realtime từ fixture");
  await post.getByLabel("Viết bình luận công khai").fill("Mình sẽ chia sẻ kinh nghiệm kiểm tra lịch.");
  await post.getByRole("button", { name: "Gửi bình luận" }).click();
  await expect(post).toContainText("Mình sẽ chia sẻ kinh nghiệm kiểm tra lịch.");
  await post.getByRole("link", { name: "Mở chi tiết bài viết" }).click();
  await expect(page).toHaveURL(new RegExp(`/community/discussion/${newDiscussionId}$`));
  await expect(page.locator(`[data-community-discussion="${newDiscussionId}"]`)).toContainText("Mình sẽ chia sẻ kinh nghiệm kiểm tra lịch.");
});

test("SOURCE_MODE_CHECK: only an HTTPS source is published with the existing ACADEMIC mapping", async ({ page }) => {
  const fixture = await installFixtureRoutes(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await openCommunityPage(page);
  await hideNextDevIndicator(page);

  const collapsedComposer = page.getByRole("region", { name: "Tạo bài viết cộng đồng" });
  await collapsedComposer.getByRole("button", { name: "Nguồn", exact: true }).click();
  const composer = page.getByRole("dialog");
  await expect(composer).toContainText("Chia sẻ một nguồn hữu ích.");
  await composer.getByLabel(/Ý nghĩa của nguồn/).fill("Mình tìm thấy lịch học kỳ mới trên trang thông tin của trường.");
  const sourceField = composer.getByLabel(/Liên kết nguồn/);
  await sourceField.fill("http://example.edu/lich-hoc");
  await expect(composer.getByRole("button", { name: "Đăng bài" })).toBeDisabled();
  await sourceField.fill("https://example.edu/lich-hoc");
  await composer.getByRole("button", { name: "Đăng bài" }).click();

  const post = page.locator(`[data-community-discussion="${newDiscussionId}"]`);
  await expect(post).toContainText("Mình tìm thấy lịch học kỳ mới");
  await expect(post).toContainText("example.edu");
  expect(fixture.publishedBody?.topic).toBe("ACADEMIC");
  expect(fixture.publishedBody?.sourceUrl).toBe("https://example.edu/lich-hoc");
  expect(fixture.publishedBody?.caseId).toBeUndefined();
  expect(fixture.trustCaseRequestCount).toBe(0);
});

test("EXPERT_SHEET_CHECK: the same authorized sheet opens from feed and post detail", async ({ page, browserName }) => {
  mkdirSync(reportDir, { recursive: true });
  await installFixtureRoutes(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await openCommunityPage(page);
  await hideNextDevIndicator(page);
  const feedTrigger = page.locator(`[data-community-contribution="${trustId}"] footer button[aria-expanded]`);
  await feedTrigger.click();
  await expect(page.getByRole("dialog", { name: "Yêu cầu đánh giá chuyên môn" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(feedTrigger).toBeFocused();

  await openCommunityPage(page, `/community/${trustId}`);
  await hideNextDevIndicator(page);
  const detailTrigger = page.locator(`[data-community-contribution="${trustId}"] footer button[aria-expanded]`);
  await detailTrigger.click();
  const detailSheet = page.getByRole("dialog", { name: "Yêu cầu đánh giá chuyên môn" });
  await expect(detailSheet).toBeVisible();
  await expect(detailSheet.getByLabel("Domain hoặc lĩnh vực cần xem xét")).toBeVisible();
  if (browserName === "chromium") await page.screenshot({ path: resolve(reportDir, "1440-13-expert-detail-sheet.png") });
  await page.keyboard.press("Escape");
  await expect(detailSheet).toHaveCount(0);
  await expect(detailTrigger).toBeFocused();
});

test("V4.2 screenshot matrix: Community states at 390, 768, and 1440px", async ({ page, browserName }) => {
  test.setTimeout(120_000);
  test.skip(browserName !== "chromium", "Capture one deterministic Chromium evidence set.");
  mkdirSync(reportDir, { recursive: true });
  await installFixtureRoutes(page);

  for (const width of [390, 768, 1440]) {
    const height = width === 390 ? 844 : width === 768 ? 1024 : 1000;
    await page.setViewportSize({ width, height });
    await openCommunityPage(page);
    await hideNextDevIndicator(page);
    const collapsedComposer = page.getByRole("region", { name: "Tạo bài viết cộng đồng" });
    await expect(collapsedComposer).toBeVisible();
    await expect(page.locator(`[data-community-discussion="${discussionId}"]`)).toBeVisible();
    await expect(page.locator(`[data-community-contribution="${trustId}"]`)).toBeVisible();
    await assertNoSeriousAxeViolations(page);
    if (width === 390) {
      await expect(page.getByText("Điều hướng StudentHub")).toBeHidden();
      const mobileNavigation = page.getByRole("navigation", { name: "Điều hướng chính" });
      await page.getByRole("button", { name: "Mở menu", exact: true }).click();
      await expect(mobileNavigation).toBeVisible();
      await assertNoSeriousAxeViolations(page);
      await page.getByRole("button", { name: "Đóng menu" }).click();
      await expect(mobileNavigation).toBeHidden();
    }

    const tag = String(width);
    await page.screenshot({ path: resolve(reportDir, `${tag}-01-home.png`), fullPage: true });
    await collapsedComposer.screenshot({ path: resolve(reportDir, `${tag}-02-composer-collapsed.png`) });

    await collapsedComposer.getByRole("button", { name: "Câu hỏi", exact: false }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await assertNoSeriousAxeViolations(page);
    await page.screenshot({ path: resolve(reportDir, `${tag}-03-general-composer.png`) });
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);

    await collapsedComposer.getByRole("button", { name: "Kiểm chứng", exact: true }).click();
    await expect(page.getByRole("dialog")).toContainText("Trust case");
    await page.screenshot({ path: resolve(reportDir, `${tag}-04-verify-composer.png`) });
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);

    await page.locator(`[data-community-discussion="${discussionId}"]`).screenshot({ path: resolve(reportDir, `${tag}-05-post-normal.png`) });
    await page.locator(`[data-community-contribution="${trustId}"]`).screenshot({ path: resolve(reportDir, `${tag}-06-post-trust.png`) });

    await page.locator(`[data-community-contribution="${trustId}"]`).getByRole("button", { name: "Hiện thông tin Trust và nguồn" }).click();
    if (width >= 1280) {
      const rail = page.getByRole("complementary", { name: "Thông tin bài viết đang chọn" });
      await expect(rail).toBeVisible();
      await expect(rail).toContainText("rev 4");
      await expect(rail).toContainText("Bộ Giáo dục và Đào tạo");
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: resolve(reportDir, `${tag}-07-right-rail-populated.png`), fullPage: true });

    const threadResponse = page.waitForResponse((response) => new URL(response.url()).pathname === `/api/intelligence/community/posts/${trustId}/comments`);
    await page.locator(`[data-community-contribution="${trustId}"]`).getByRole("button", { name: /Bình luận/ }).click();
    expect((await threadResponse).status()).toBe(200);
    await expect(page.getByText("Người tham gia 18A4F9C2D1")).toBeVisible();
    await expect(page.getByText("Người tham gia 7C3D1B6A50")).toBeVisible();
    await expect(page.getByText("Người tham gia F25A31D8B9")).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: resolve(reportDir, `${tag}-08-thread.png`), fullPage: true });

    const expertTrigger = page.locator(`[data-community-contribution="${trustId}"] footer button[aria-expanded]`);
    await expertTrigger.click();
    await expect(page.getByRole("dialog", { name: "Yêu cầu đánh giá chuyên môn" })).toBeVisible();
    await assertNoSeriousAxeViolations(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: resolve(reportDir, `${tag}-09-expert-sheet.png`) });
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Yêu cầu đánh giá chuyên môn" })).toHaveCount(0);
    await expect(expertTrigger).toBeFocused();

    const glossaryTrigger = page.getByRole("button", { name: "Chú giải" });
    await glossaryTrigger.click();
    await expect(page.getByRole("dialog", { name: "Chú giải" })).toBeVisible();
    await page.screenshot({ path: resolve(reportDir, `${tag}-10-glossary.png`) });
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Chú giải" })).toHaveCount(0);
    await expect(glossaryTrigger).toBeFocused();

    await openCommunityPage(page);
    await hideNextDevIndicator(page);
    await expect(page.getByRole("complementary", { name: "Thông tin bài viết đang chọn" })).toHaveCount(0);
    await page.screenshot({ path: resolve(reportDir, `${tag}-11-right-rail-absent.png`), fullPage: true });
    if (width === 390) await page.screenshot({ path: resolve(reportDir, "390-12-mobile-chrome.png") });
  }

  const fileNames = [
    "01-home", "02-composer-collapsed", "03-general-composer", "04-verify-composer",
    "05-post-normal", "06-post-trust", "07-right-rail-populated", "08-thread",
    "09-expert-sheet", "10-glossary", "11-right-rail-absent",
  ];
  writeFileSync(resolve(reportDir, "verification.json"), `${JSON.stringify({
    viewportWidths: [390, 768, 1440],
    screenshotsPerViewport: fileNames,
    mobileChromeScreenshot: "390-12-mobile-chrome.png",
    fixtureMode: "DEMO_FIXTURE",
    connectedToDurableDatabase: false,
    capturedAt: new Date().toISOString(),
  }, null, 2)}\n`);
});
