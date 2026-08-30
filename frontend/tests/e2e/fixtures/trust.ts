import type { Page, Route } from "@playwright/test";

export const trustPayloads = {
  screen: {
    status: "SUSPICIOUS",
    riskLevel: "HIGH",
    details: { decisionRationale: "Phát hiện lời thúc giục chuyển tiền và dấu hiệu mạo danh." },
  },
  semantic: {
    status: "REVIEW_REQUIRED",
    summary: "Nội dung sử dụng áp lực thời gian và một tuyên bố chưa được xác minh.",
    claims: [{ text: "Sinh viên phải chuyển tiền ngay để giữ tài khoản", status: "UNVERIFIED" }],
  },
  evidence: {
    status: "PARTIAL",
    verificationCompleteness: 0.62,
    sourceAgreement: "MIXED",
    evidence: [{ title: "Cảnh báo giả mạo học phí", publisher: "StudentHub Safety", url: "https://studenthub.example/safety" }],
    providerResults: [
      { provider: "Google Safe Browsing", status: "clean", latencyMs: 87, signals: [] },
      { provider: "VirusTotal", status: "unavailable", signals: [] },
      { provider: "StudentHub Scam DNA", status: "findings", latencyMs: 12, signals: ["urgent-payment", "account-threat"] },
    ],
    relatedCases: [{ id: "case-2026-014", title: "Giả mạo phòng đào tạo", similarity: 0.91, sharedSignals: ["urgent-payment", "account-threat"] }],
  },
  reasoning: {
    status: "HIGH_RISK",
    riskLevel: "HIGH",
    confidence: 0.88,
    userExplanation: {
      verdictTitle: "Rủi ro cao — chưa thực hiện chuyển tiền",
      why: "Nội dung tạo áp lực khẩn cấp và yêu cầu thanh toán ngoài kênh chính thức.",
      riskSummary: "Bằng chứng hiện có phù hợp với mẫu giả mạo học phí.",
      recommendedActionNote: "Dừng giao dịch và xác minh qua cổng trường chính thức.",
    },
  },
} as const;

type TrustOverride = Partial<Record<keyof typeof trustPayloads, unknown>>;

function endpoint(route: Route) {
  const pathname = new URL(route.request().url()).pathname;
  if (pathname.endsWith("/screen")) return "screen";
  if (pathname.endsWith("/semantic")) return "semantic";
  if (pathname.endsWith("/evidence")) return "evidence";
  return "reasoning";
}

export async function mockTrustPipeline(page: Page, overrides: TrustOverride = {}) {
  await page.route("**/api/ai-trust/**", async (route) => {
    const key = endpoint(route);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(overrides[key] ?? trustPayloads[key]),
    });
  });
}

export async function completeTextScan(page: Page, text = "Chuyển khoản ngay để tránh khóa tài khoản sinh viên") {
  await page.goto("/trust");
  await page.getByRole("tab", { name: "Văn bản" }).click();
  await page.getByLabel("Nội dung tin nhắn hoặc thông báo").fill(text);
  await page.getByRole("button", { name: /Phân tích rủi ro/ }).click();
  await page.getByRole("heading", { name: "Rủi ro cao — chưa thực hiện chuyển tiền" }).waitFor();
}
