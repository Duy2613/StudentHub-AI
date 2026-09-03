import { expect, test } from "@playwright/test";
import { canonicalTrustResponse, completeTextScan, mockTrustPipeline, trustPayloads } from "./fixtures/trust";

test.describe("Trust flagship flow", () => {
  test("renders verdict, separate metrics, partial providers and related cases", async ({ page }) => {
    await mockTrustPipeline(page);
    await completeTextScan(page);

    await expect(page.getByText("Rủi ro", { exact: true })).toBeVisible();
    await expect(page.getByText("Độ chắc quyết định", { exact: true })).toBeVisible();
    await expect(page.getByText("Bằng chứng", { exact: true })).toBeVisible();
    await expect(page.getByText("Source agreement", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Tình trạng nguồn đối soát" })).toBeVisible();
    await expect(page.getByText("Google Safe Browsing")).toBeVisible();
    await expect(page.getByText("VirusTotal")).toBeVisible();
    await expect(page.getByText("Không đủ dữ liệu để kết luận sạch.")).toBeVisible();
    await expect(page.locator(".related-case-list").getByText("Giả mạo phòng đào tạo", { exact: true })).toBeVisible();
    await expect(page.getByText("91% tương đồng")).toBeVisible();
  });

  test("invalid URL is rejected before any request", async ({ page }) => {
    let requests = 0;
    page.on("request", (request) => { if (request.url().includes("/api/v1/trust")) requests += 1; });
    await page.goto("/trust");
    await page.getByRole("tab", { name: "URL" }).click();
    await page.getByLabel("Đường dẫn cần kiểm tra").fill("javascript:alert(1)");
    await page.getByRole("button", { name: /Phân tích rủi ro/ }).click();
    await expect(page.locator(".error-callout")).toContainText("Chỉ hỗ trợ URL HTTP hoặc HTTPS");
    expect(requests).toBe(0);
  });

  test("invalid and oversized image files fail locally", async ({ page }) => {
    await page.goto("/trust");
    const input = page.locator('input[type="file"]');
    await input.setInputFiles({ name: "payload.svg", mimeType: "image/svg+xml", buffer: Buffer.from("<svg/>") });
    await expect(page.locator(".error-callout")).toContainText("Định dạng này chưa được hỗ trợ");
    await input.setInputFiles({ name: "large.png", mimeType: "image/png", buffer: Buffer.alloc(8 * 1024 * 1024 + 1) });
    await expect(page.locator(".error-callout")).toContainText("Ảnh vượt quá giới hạn 8 MB");
  });

  test("browser OCR remains labeled as a client hint", async ({ page }) => {
    test.setTimeout(20_000);
    await page.goto("/trust");
    const transparentPng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
    await page.locator('input[type="file"]').setInputFiles({ name: "blank.png", mimeType: "image/png", buffer: transparentPng });
    await page.getByRole("button", { name: /Phân tích rủi ro/ }).click();
    await expect(page.getByText("OCR trong trình duyệt")).toBeVisible({ timeout: 12_000 });
    await expect(page.locator(".ocr-readout")).toContainText("CLIENT_OCR_HINT");
    await expect(page.locator(".error-callout")).toContainText("OCR cục bộ không đọc được nội dung");
  });

  test("insufficient evidence is never presented as safe", async ({ page }) => {
    await mockTrustPipeline(page, {
      evidence: { status: "INSUFFICIENT", verificationCompleteness: 0.1, sourceAgreement: "UNKNOWN", providerResults: [] },
      reasoning: { ...trustPayloads.reasoning, status: "INSUFFICIENT_EVIDENCE", riskLevel: "UNKNOWN", confidence: 0.2, userExplanation: { verdictTitle: "Chưa đủ bằng chứng để kết luận", why: "Không có đủ nguồn độc lập.", recommendedActionNote: "Không hành động dựa trên nội dung này." } },
    });
    await page.goto("/trust");
    await page.getByRole("tab", { name: "Văn bản" }).click();
    await page.getByLabel("Nội dung tin nhắn hoặc thông báo").fill("Một tuyên bố chưa có nguồn");
    await page.getByRole("button", { name: /Phân tích rủi ro/ }).click();
    await expect(page.getByRole("heading", { name: "Chưa đủ bằng chứng để kết luận" })).toBeVisible();
    await expect(page.getByText("HẠN CHẾ")).toBeVisible();
    await expect(page.getByText("AN TOÀN", { exact: true })).toHaveCount(0);
  });

  test("429 includes retry guidance and correlation reference", async ({ page }) => {
    await page.route("**/api/v1/trust", (route) => route.fulfill({ status: 429, headers: { "Retry-After": "17", "x-request-id": "trace-rate-17" }, contentType: "application/json", body: JSON.stringify({ error: { message: "rate limited" } }) }));
    await page.goto("/trust");
    await page.getByRole("tab", { name: "Văn bản" }).click();
    await page.getByLabel("Nội dung tin nhắn hoặc thông báo").fill("Kiểm tra giới hạn tốc độ");
    await page.getByRole("button", { name: /Phân tích rủi ro/ }).click();
    await expect(page.locator(".error-callout")).toContainText("17 giây");
    await expect(page.locator(".error-callout")).toContainText("trace-rate-17");
  });

  test("invalid JSON fails closed", async ({ page }) => {
    await page.route("**/api/v1/trust", (route) => route.fulfill({ status: 200, contentType: "text/plain", body: "not-json" }));
    await page.goto("/trust");
    await page.getByRole("tab", { name: "Văn bản" }).click();
    await page.getByLabel("Nội dung tin nhắn hoặc thông báo").fill("Dữ liệu hợp đồng lỗi");
    await page.getByRole("button", { name: /Phân tích rủi ro/ }).click();
    await expect(page.locator(".error-callout")).toContainText("dữ liệu không hợp lệ");
  });

  test("schema mismatch fails closed", async ({ page }) => {
    await page.route("**/api/v1/trust", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
    await page.goto("/trust");
    await page.getByRole("tab", { name: "Văn bản" }).click();
    await page.getByLabel("Nội dung tin nhắn hoặc thông báo").fill("Phản hồi thiếu trường bắt buộc");
    await page.getByRole("button", { name: /Phân tích rủi ro/ }).click();
    await expect(page.locator(".error-callout")).toContainText("không khớp hợp đồng an toàn");
  });

  for (const [status, message] of [[401, "đăng nhập lại"], [403, "không có quyền"], [503, "tạm thời không khả dụng"]] as const) {
    test(`${status} maps to a recoverable user state`, async ({ page }) => {
      await page.route("**/api/v1/trust", (route) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify({ error: { message: "safe upstream message" } }) }));
      await page.goto("/trust");
      await page.getByRole("tab", { name: "Văn bản" }).click();
      await page.getByLabel("Nội dung tin nhắn hoặc thông báo").fill("Kiểm tra trạng thái API");
      await page.getByRole("button", { name: /Phân tích rủi ro/ }).click();
      await expect(page.locator(".error-callout")).toContainText(message);
    });
  }

  test("late Scan A cannot overwrite Scan B", async ({ page }) => {
    await page.route("**/api/v1/trust", async (route) => {
      const body = route.request().postDataJSON() as { content?: string };
      if (body.content?.includes("Scan A")) await new Promise((resolve) => setTimeout(resolve, 700));
      const title = body.content?.includes("Scan B") ? "Kết quả Scan B" : "Kết quả Scan A";
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(canonicalTrustResponse({ reasoning: { ...trustPayloads.reasoning, userExplanation: { ...trustPayloads.reasoning.userExplanation, verdictTitle: title } } })),
      });
    });
    await page.goto("/trust");
    await page.getByRole("tab", { name: "Văn bản" }).click();
    const field = page.getByLabel("Nội dung tin nhắn hoặc thông báo");
    await field.fill("Scan A");
    await page.getByRole("button", { name: /Phân tích rủi ro/ }).click();
    await field.fill("Scan B");
    await page.getByRole("button", { name: /Chạy lại với dữ liệu mới/ }).click();
    await expect(page.getByRole("heading", { name: "Kết quả Scan B" })).toBeVisible();
    await page.waitForTimeout(900);
    await expect(page.getByRole("heading", { name: "Kết quả Scan B" })).toBeVisible();
  });

  test("slow canonical pipeline exposes in-flight state and keeps the result bound to the latest scan", async ({ page }) => {
    await page.route("**/api/v1/trust", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 900));
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(canonicalTrustResponse()) });
    });
    await page.goto("/trust");
    await page.getByRole("tab", { name: "Văn bản" }).click();
    await page.getByLabel("Nội dung tin nhắn hoặc thông báo").fill("Kiểm tra pipeline mạng chậm");
    await page.getByRole("button", { name: /Phân tích rủi ro/ }).click();

    const steps = page.locator(".pipeline-list li");
    await expect(steps.nth(1)).toHaveAttribute("data-status", "running");
    await expect(steps.nth(2)).toHaveAttribute("data-status", "running");
    await expect(page.getByRole("heading", { name: trustPayloads.reasoning.userExplanation.verdictTitle })).toBeVisible();
  });

  test("print action invokes browser print only after a result exists", async ({ page }) => {
    await page.addInitScript(() => {
      window.print = () => window.dispatchEvent(new Event("studenthub-print"));
    });
    await mockTrustPipeline(page);
    await completeTextScan(page);
    const printed = page.evaluate(() => new Promise((resolve) => window.addEventListener("studenthub-print", () => resolve(true), { once: true })));
    await page.getByRole("button", { name: "In báo cáo" }).click();
    await expect(printed).resolves.toBe(true);
  });
});
