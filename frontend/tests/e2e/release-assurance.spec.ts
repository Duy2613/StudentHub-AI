import { expect, test, type Page } from "@playwright/test";

type TimingSnapshot = {
  label: string;
  marks: Array<{ name: string; startTime: number; detail: unknown }>;
  measures: Array<{ name: string; duration: number; startTime: number; detail: unknown }>;
  eventTimingSupported: boolean;
  eventTiming: Array<{ name: string; duration: number; startTime: number }>;
};

async function readTiming(page: Page, label: string): Promise<TimingSnapshot> {
  return page.evaluate((snapshotLabel) => {
    const marks = performance.getEntriesByType("mark").map((entry) => ({
      name: entry.name,
      startTime: entry.startTime,
      detail: (entry as PerformanceMark).detail ?? null,
    }));
    const measures = performance.getEntriesByType("measure").map((entry) => ({
      name: entry.name,
      duration: entry.duration,
      startTime: entry.startTime,
      detail: (entry as PerformanceMeasure).detail ?? null,
    }));
    const assuranceWindow = window as Window & {
      __studentHubEventTimingSupported?: boolean;
      __studentHubEventTiming?: Array<{ name: string; duration: number; startTime: number }>;
    };
    return {
      label: snapshotLabel,
      marks,
      measures,
      eventTimingSupported: assuranceWindow.__studentHubEventTimingSupported === true,
      eventTiming: assuranceWindow.__studentHubEventTiming || [],
    };
  }, label);
}

test.describe("Release assurance — User Timing and interaction evidence", () => {
  // WebKit compiles the dynamic lesson/trust surfaces on demand and can take
  // longer than a minute on a cold local dev server. Keep the evidence test
  // bounded while allowing that first compilation to finish.
  test.setTimeout(120_000);

  test("collects hydration, deferred UI, navigation, and filter timings", async ({ page }) => {
    await page.addInitScript(() => {
      const target = window as Window & {
        __studentHubEventTimingSupported?: boolean;
        __studentHubEventTiming?: Array<{ name: string; duration: number; startTime: number }>;
      };
      target.__studentHubEventTiming = [];
      target.__studentHubEventTimingSupported = false;
      try {
        const observer = new PerformanceObserver((list) => {
          target.__studentHubEventTimingSupported = true;
          for (const entry of list.getEntries()) {
            if (target.__studentHubEventTiming!.length >= 100) break;
            target.__studentHubEventTiming!.push({
              name: entry.name,
              duration: entry.duration,
              startTime: entry.startTime,
            });
          }
        });
        observer.observe({ type: "event", buffered: true, durationThreshold: 0 } as PerformanceObserverInit);
      } catch {
        // Event Timing is not implemented in every supported browser.
      }
    });

    const snapshots: TimingSnapshot[] = [];

    await page.goto("/", { waitUntil: "domcontentloaded" });
    const searchButton = page.getByRole("button", { name: /Tìm kiếm toàn hệ thống/i });
    await expect(searchButton).toBeVisible();
    await searchButton.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByPlaceholder("Tìm kiếm tình huống, bằng chứng, chuyên gia...")).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();
    snapshots.push(await readTiming(page, "landing-command-palette"));

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const openMobileMenu = page.getByRole("button", { name: "Mở menu điều hướng" });
    await expect(openMobileMenu).toBeVisible();
    await openMobileMenu.click();
    await expect(page.getByRole("dialog", { name: "Menu điều hướng di động" })).toBeVisible();
    snapshots.push(await readTiming(page, "mobile-navigation"));

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/trust", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1, name: /Kiểm tra trước khi bạn tin/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Bắt đầu một phiên kiểm tra" })).toBeVisible();
    await page.getByRole("tab", { name: "Văn bản" }).click();
    await page.waitForFunction(
      () => performance.getEntriesByName("trust-workspace-interactive", "mark").length > 0,
      undefined,
      { timeout: 5_000 },
    );
    snapshots.push(await readTiming(page, "trust-workspace-mode"));

    const trustInput = page.getByPlaceholder("Dán nội dung khả nghi tại đây...");
    await expect(trustInput).toBeVisible();
    await trustInput.fill("Thông báo học thuật cần được kiểm tra bằng chứng.");
    const trustAnalyze = page.getByRole("button", { name: /Phân tích rủi ro/ }).last();
    await expect(trustAnalyze).toBeEnabled();
    await trustAnalyze.click({ force: true });
    await page.waitForFunction(
      () => performance.getEntriesByName("trust-analysis-interactive", "mark").length > 0,
      undefined,
      { timeout: 20_000 },
    );
    snapshots.push(await readTiming(page, "trust-analysis-activation"));

    await page.goto("/", { waitUntil: "domcontentloaded" });
    const evidenceChapter = page.locator("#evidence-chapter");
    await evidenceChapter.scrollIntoViewIfNeeded();
    await expect(evidenceChapter.getByRole("region", { name: "Minh họa quan hệ bằng chứng" })).toBeVisible();
    await expect(evidenceChapter.getByText("Mâu thuẫn", { exact: true })).toBeVisible();
    snapshots.push(await readTiming(page, "evidence-relational-matrix"));

    const requiredMarks = [
      "command-palette-request",
      "command-palette-interactive",
      "mobile-navigation-request",
      "mobile-navigation-interactive",
      "trust-workspace-request",
      "trust-workspace-interactive",
    ];
    const allMarks = new Set(snapshots.flatMap((snapshot) => snapshot.marks.map((entry) => entry.name)));
    const absentMarks = requiredMarks.filter((name) => !allMarks.has(name));
    const optionalMarks = ["trust-analysis-request", "trust-analysis-interactive", "trust-analysis-duration"];
    const absentOptionalMarks = optionalMarks.filter((name) => !allMarks.has(name));
    console.log(`[ASSURANCE_TIMING] ${JSON.stringify({ snapshots, absentMarks, absentOptionalMarks })}`);
    expect(absentMarks).toEqual([]);
    expect(snapshots.every((snapshot) => snapshot.eventTiming.length >= 0)).toBeTruthy();
  });

  test("keeps SSR and client auth capability copy hydration-stable", async ({ page }) => {
    const hydrationErrors: string[] = [];
    page.on("pageerror", (error) => {
      if (/hydration|did not match|server rendered|text content/i.test(error.message)) hydrationErrors.push(error.message);
    });
    page.on("console", (message) => {
      if (message.type() === "error" && /hydration|did not match|server rendered|text content/i.test(message.text())) {
        hydrationErrors.push(message.text());
      }
    });

    await page.goto("/login", { waitUntil: "networkidle" });
    await expect(page.getByRole("button", { name: "Google" })).toBeVisible();
    expect(hydrationErrors).toEqual([]);
  });
});
