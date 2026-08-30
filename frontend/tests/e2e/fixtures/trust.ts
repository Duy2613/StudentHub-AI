import type { Page } from "@playwright/test";

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
    evidence: [{ title: "Cảnh báo giả mạo học phí", publisher: "StudentHub Safety" }],
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
  layer2A: {
    layer: "2A",
    provider: "Layer 2A fixture",
    providerStatus: "SUCCESS",
    finding: "NO_KNOWN_THREAT",
    provenance: { noMatchIsSafetyProof: false },
  },
} as const;

type TrustOverride = Partial<Record<keyof typeof trustPayloads, unknown>>;

export function canonicalTrustResponse(overrides: TrustOverride = {}) {
  const layer1 = overrides.screen ?? trustPayloads.screen;
  const layer2 = overrides.semantic ?? trustPayloads.semantic;
  const layer3 = overrides.evidence ?? trustPayloads.evidence;
  const layer4 = overrides.reasoning ?? trustPayloads.reasoning;
  const layer2A = overrides.layer2A ?? trustPayloads.layer2A;
  return {
    success: true,
    contractVersion: "trust.v1",
    requestId: "e2e-trust-fixture",
    depth: "full",
    demo: false,
    data: { input: { type: "text" }, layer1, layer2A, layer2, layer3, layer4 },
  };
}

export async function mockTrustPipeline(page: Page, overrides: TrustOverride = {}) {
  await page.route("**/api/v1/trust", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(canonicalTrustResponse(overrides)),
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
