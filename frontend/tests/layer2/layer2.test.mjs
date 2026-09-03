/**
 * Layer 2 — Comprehensive Automated Test Suite
 * 
 * Verifies all Layer 2 Semantic & Contextual Verification specifications:
 * 1. Benign Educational Content Immunity (Never Block)
 * 2. Explicit Phishing & Credential Theft Compounds (Hard Block)
 * 3. Unknown Factual & Institutional Claims (NEEDS_VERIFICATION, not False)
 * 4. Internal Contradictions (Temporal, Numerical & Instruction Conflicts)
 * 5. Cross-Modal Mismatch (Claimed Entity vs Destination URL)
 * 6. Legitimate Brand Mentions (No Impersonation)
 * 7. Academic Cybersecurity Articles with Threat Keywords
 * 8. Satire & Student Humor Guard
 * 9. Vietnamese Hot Scam Contexts (Biometrics & Task Deposit)
 * 10. Model Provider Fallback on Upstream Failure
 */

import { Layer2SemanticService } from "../../src/lib/ai-trust/layer2/Layer2SemanticService.js";
import { LAYER_2_STATUS, SEMANTIC_CLASSIFICATION } from "../../src/lib/ai-trust/layer2/types.js";
import { ISemanticVerificationProvider } from "../../src/lib/ai-trust/layer2/providers/ISemanticVerificationProvider.js";

class FailingModelProvider extends ISemanticVerificationProvider {
  constructor() {
    super("failing_llm_provider");
  }
  async analyzeSemantics() {
    throw new Error("Simulated LLM Gateway Timeout (504)");
  }
}

export const LAYER_2_TEST_CASES = [
  // --- 1. BENIGN EDUCATIONAL CONTENT (MUST PASS) ---
  {
    category: "1. Benign Education — How OTP Authentication Works",
    type: "text",
    content: "Bài giảng môn An toàn mạng: Khái niệm và cơ chế hoạt động của mã Smart OTP và chữ ký số trong xác thực hai yếu tố.",
    expectedStatus: LAYER_2_STATUS.PASS,
    expectedClassification: SEMANTIC_CLASSIFICATION.INFORMATIVE,
  },
  {
    category: "1. Benign Education — Operating Systems Concept",
    type: "text",
    content: "Chương 4: Quản lý tiến trình trong Linux. Tìm hiểu về Semaphore, Mutex Locks và cách tránh Deadlock.",
    expectedStatus: LAYER_2_STATUS.PASS,
    expectedClassification: SEMANTIC_CLASSIFICATION.INFORMATIVE,
  },

  // --- 2. EXPLICIT PHISHING & SOCIAL ENGINEERING (HARD BLOCK) ---
  {
    category: "2. Explicit Phishing — HCMUTE Security Impersonation & OTP Demand",
    type: "text",
    content: "Phòng an ninh HCMUTE thông báo: Tài khoản sinh viên của bạn bị nghi ngờ xâm nhập. Nhập mật khẩu và mã OTP ngay lập tức để xác thực.",
    expectedStatus: LAYER_2_STATUS.BLOCK,
    expectedClassification: SEMANTIC_CLASSIFICATION.MALICIOUS,
  },
  {
    category: "2. Explicit Phishing — Fake Vietcombank Account Lock Alert",
    type: "text",
    content: "Vietcombank CẢNH BÁO: Tài khoản của quý khách bị tạm khóa. Vui lòng nhập mật khẩu VCB Digibank và mã Smart OTP để mở khóa.",
    expectedStatus: LAYER_2_STATUS.BLOCK,
    expectedClassification: SEMANTIC_CLASSIFICATION.MALICIOUS,
  },
  {
    category: "2. Financial Scam — Shopee Task Deposit Demand",
    type: "text",
    content: "Tuyển sinh viên làm CTV online xử lý đơn hàng Shopee. Nạp cọc 200k để kích hoạt nhiệm vụ và nhận hoa hồng 25% ngay sau 5 phút.",
    expectedStatus: LAYER_2_STATUS.BLOCK,
    expectedClassification: SEMANTIC_CLASSIFICATION.MALICIOUS,
  },

  // --- 3. UNKNOWN FACTUAL & INSTITUTIONAL CLAIMS (NEEDS_VERIFICATION) ---
  {
    category: "3. Unknown Factual Claim — HCMUTE Tuition Policy 2026",
    type: "text",
    content: "Trường Đại học Sư phạm Kỹ thuật TP.HCM (HCMUTE) đã chính thức ban hành quy chế điều chỉnh học phí cho năm học 2026.",
    expectedStatus: LAYER_2_STATUS.NEEDS_VERIFICATION,
    expectedClassification: SEMANTIC_CLASSIFICATION.UNVERIFIED,
    mustHaveVerificationTasks: true,
  },
  {
    category: "3. Unknown Factual Claim — VNU Scholarship Announcement",
    type: "text",
    content: "Đại học Quốc gia TP.HCM (VNU-HCM) công bố chương trình trao tặng học bổng tài trợ 50 triệu đồng cho sinh viên xuất sắc.",
    expectedStatus: LAYER_2_STATUS.NEEDS_VERIFICATION,
    expectedClassification: SEMANTIC_CLASSIFICATION.UNVERIFIED,
    mustHaveVerificationTasks: true,
  },

  // --- 4. INTERNAL NARRATIVE CONTRADICTIONS (SUSPICIOUS) ---
  {
    category: "4. Internal Contradiction — Temporal Day-of-Week Conflict",
    type: "text",
    content: "Thông báo hội thảo công nghệ AI: Sự kiện diễn ra vào thứ Hai tuần tới. Các nhóm lưu ý chương trình chính thức bắt đầu vào thứ Sáu.",
    expectedStatus: LAYER_2_STATUS.SUSPICIOUS,
    expectedClassification: SEMANTIC_CLASSIFICATION.DECEPTIVE,
  },

  // --- 5. CROSS-MODAL MISMATCH (BLOCK / SUSPICIOUS) ---
  {
    category: "5. Cross-Modal Mismatch — Claims VCB on Fake Domain with Credential Demand",
    type: "url",
    content: "http://vcb-portal.verify-account.xyz/xac-nhan-otp",
    metadata: {
      ocrText: "Vietcombank: Nhập mật khẩu VCB Digibank và mã Smart OTP để xác nhận giao dịch.",
    },
    layer1Result: {
      status: "BLOCK",
      signals: [{ type: "brand_impersonation", severity: "critical", evidence: { matchedText: "http://vcb-portal.verify-account.xyz" } }],
    },
    expectedStatus: LAYER_2_STATUS.BLOCK,
    expectedClassification: SEMANTIC_CLASSIFICATION.MALICIOUS,
  },

  // --- 6. LEGITIMATE BRAND MENTION (PASS) ---
  {
    category: "6. Benign Brand Mention — Laboratory Praise",
    type: "text",
    content: "Trường Đại học Sư phạm Kỹ thuật TP.HCM (HCMUTE) có hệ thống phòng thí nghiệm và câu lạc bộ sinh viên nghiên cứu rất tốt.",
    expectedStatus: LAYER_2_STATUS.PASS,
    expectedClassification: SEMANTIC_CLASSIFICATION.BENIGN,
  },

  // --- 7. ACADEMIC CYBERSECURITY ARTICLE WITH DANGEROUS KEYWORDS (PASS) ---
  {
    category: "7. Educational Phishing Analysis Lecture (Must NOT Block)",
    type: "text",
    content: "Bài tập môn An toàn thông tin: Sinh viên hãy nghiên cứu các phương thức tấn công Phishing đánh cắp password và mã OTP của người dùng qua email giả mạo.",
    expectedStatus: LAYER_2_STATUS.PASS,
    expectedClassification: SEMANTIC_CLASSIFICATION.INFORMATIVE,
  },

  // --- 8. SATIRE & STUDENT HUMOR (PASS / INFORMATIVE) ---
  {
    category: "8. Student Satire Humor (Must NOT Block)",
    type: "text",
    content: "Tin nóng: Thầy giáo vừa thông báo hủy bỏ thi cử vĩnh viễn và cho cả lớp điểm A hết môn 😂🤣",
    expectedStatus: LAYER_2_STATUS.PASS,
  },

  // --- 9. VIETNAMESE HOT SCAM CONTEXT (BLOCK) ---
  {
    category: "9. Hot Scam — Fake Biometrics Update Demand",
    type: "text",
    content: "Khẩn cấp: Yêu cầu cập nhật sinh trắc học và đồng bộ CCCD ngay trong 15 phút nếu không tài khoản ngân hàng sẽ bị khóa vĩnh viễn.",
    expectedStatus: LAYER_2_STATUS.BLOCK,
    expectedClassification: SEMANTIC_CLASSIFICATION.MALICIOUS,
  },
];

export async function runLayer2TestSuite() {
  console.log("======================================================================");
  console.log("🧠 LAYER 2 — SEMANTIC & CONTEXTUAL VERIFICATION AUTOMATED SUITE");
  console.log("======================================================================\n");

  let passed = 0;
  let failed = 0;
  let totalLatency = 0;

  for (const test of LAYER_2_TEST_CASES) {
    const startTime = performance.now();

    const result = await Layer2SemanticService.verify({
      type: test.type,
      content: test.content,
      metadata: test.metadata || {},
      layer1Result: test.layer1Result || { status: "PASS", signals: [] },
    });

    const latency = result.metrics.executionTimeMs;
    totalLatency += latency;

    const isStatusMatch = result.status === test.expectedStatus;
    const isClassMatch = !test.expectedClassification || result.classification === test.expectedClassification;
    const hasTasksIfRequired = !test.mustHaveVerificationTasks || result.verificationPackage.verificationTasks.length > 0;

    const isPass = isStatusMatch && isClassMatch && hasTasksIfRequired;

    if (isPass) {
      passed++;
      console.log(`✅ [PASS] ${test.category}`);
      console.log(`   Status: ${result.status} | Class: ${result.classification} | Conf: ${result.confidence} | Latency: ${latency}ms`);
      console.log(`   Summary: "${result.semanticSummary}"`);
      if (result.verificationPackage.verificationTasks.length > 0) {
        console.log(`   Tasks for Layer 3: ${result.verificationPackage.verificationTasks.map((t) => t.type).join(", ")}`);
      }
    } else {
      failed++;
      console.error(`❌ [FAIL] ${test.category}`);
      console.error(`   Expected: Status=${test.expectedStatus}, Class=${test.expectedClassification}`);
      console.error(`   Received: Status=${result.status}, Class=${result.classification}`);
    }
  }

  // 10. Model Provider Fallback Test
  console.log("\n--- Model Provider Fallback Resilience Test ---");
  const fallbackRes = await Layer2SemanticService.verify({
    type: "text",
    content: "Phòng an ninh HCMUTE: Nhập mật khẩu và mã OTP ngay.",
    options: { provider: new FailingModelProvider() },
  });

  if (fallbackRes.status === LAYER_2_STATUS.BLOCK && fallbackRes.metrics.providerStatus === "fallback_used") {
    passed++;
    console.log(`✅ [PASS] Model Fallback on Error: Cleanly caught 504 error, fell back to deterministic provider, and maintained BLOCK verdict.`);
  } else {
    failed++;
    console.error(`❌ [FAIL] Model Fallback: Did not handle provider failure correctly.`);
  }

  const total = passed + failed;
  const avgLatency = (totalLatency / LAYER_2_TEST_CASES.length).toFixed(2);
  const accuracy = ((passed / total) * 100).toFixed(1);

  console.log("\n======================================================================");
  console.log("🎯 LAYER 2 FINAL EVALUATION SUMMARY");
  console.log("======================================================================");
  console.log(`Total Test Scenarios Evaluated : ${total}`);
  console.log(`Passed                         : ${passed} / ${total}`);
  console.log(`Failed                         : ${failed}`);
  console.log(`Average Screening Latency      : ${avgLatency} ms`);
  console.log(`Overall Accuracy               : ${accuracy}%`);
  console.log("======================================================================\n");

  return { passed, failed, total, accuracy, avgLatency };
}

// Auto-run if executed directly
if (process.argv[1]?.endsWith("layer2.test.mjs")) {
  runLayer2TestSuite().then(({ failed }) => {
    if (failed > 0) process.exit(1);
    else process.exit(0);
  });
}
