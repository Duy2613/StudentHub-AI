/**
 * Layer 1 — Comprehensive Full Multi-Modal Evaluation Suite
 * 
 * Deeply tests EVERY modality:
 * 1. 123+ Individual URL Threat & Legitimate Vectors
 * 2. OCR Image Screenshot Phishing & Benign Lecture Slides
 * 3. QR Code Phishing Targets & Legitimate Destination Verification
 * 4. Binary Polyglot Attacks (Windows MZ, Linux ELF, Zip/APK Containers)
 * 5. Text Social Engineering, Task Scams, Malicious Shell Payloads
 * 6. Adversarial Evasions (Zero-width, Spaced letters, Leet-speak)
 * 7. False-Positive Educational & AI Style Guards
 */

import { Layer1ScreenService } from "../../src/lib/ai-trust/layer1/Layer1ScreenService.js";
import { LAYER_1_STATUS, LAYER_1_REASONS } from "../../src/lib/ai-trust/layer1/types.js";
import { URL_BENCHMARK_CASES } from "./url_benchmark.test.mjs";

// =========================================================================
// 1. OCR IMAGE EXTRACTION & SCREENSHOT DETECTION SUITE
// =========================================================================
export const OCR_TEST_CASES = [
  {
    category: "OCR - Fake Vietcombank Account Lock Alert",
    type: "image",
    content: "",
    metadata: {
      fileName: "alert_vcb_sms.png",
      bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
      ocrText: "Vietcombank CẢNH BÁO: Tài khoản của quý khách bị tạm khóa. Vui lòng nhập mật khẩu VCB Digibank và mã Smart OTP tại https://vcb-unlock.xyz để xác thực.",
      fileSize: 45000,
    },
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: LAYER_1_REASONS.OCR_PHISHING_PATTERN,
  },
  {
    category: "OCR - Shopee Task Scam Recruitment Flyer",
    type: "image",
    content: "",
    metadata: {
      fileName: "tuyen_ctv_shopee.jpg",
      bytes: [0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46],
      ocrText: "Tuyển dụng CTV Shopee xử lý đơn hàng tại nhà. Thu nhập 500k-1tr/ngày. Nạp cọc 200k để kích hoạt tài khoản nhiệm vụ và nhận hoa hồng 25% ngay.",
      fileSize: 85000,
    },
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: LAYER_1_REASONS.TASK_DEPOSIT_SCAM,
  },
  {
    category: "OCR - Fake University Scholarship Grant Demand",
    type: "image",
    content: "",
    metadata: {
      fileName: "hoc_bong_spkt.png",
      bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
      ocrText: "Chúc mừng sinh viên nhận học bổng tài trợ 10 triệu đồng. Vui lòng nhập mật khẩu cổng thông tin sinh viên và mã OTP xác thực để nhận tiền.",
      fileSize: 62000,
    },
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: LAYER_1_REASONS.OCR_PHISHING_PATTERN,
  },
  {
    category: "OCR - Benign Lecture Slide (Operating Systems)",
    type: "image",
    content: "",
    metadata: {
      fileName: "os_lecture_slide.png",
      bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
      ocrText: "Chương 4: Quản lý tiến trình và đồng bộ hóa. Khái niệm Semaphore, Mutex Locks và bài toán Dining Philosophers trong hệ điều hành Linux.",
      fileSize: 120000,
    },
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: null,
  },
  {
    category: "OCR - Benign Lecture Slide with Security Keywords",
    type: "image",
    content: "",
    metadata: {
      fileName: "cryptography_lecture.png",
      bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
      ocrText: "Môn An toàn Mạng: Phân tích cơ chế mật mã hóa công khai RSA, chữ ký số điện tử và chu trình tạo khóa phiên Diffie-Hellman.",
      fileSize: 150000,
    },
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: null,
  },
];

// =========================================================================
// 2. QR CODE DECODED PAYLOAD SUITE
// =========================================================================
export const QR_TEST_CASES = [
  {
    category: "QR Code - Phishing Destination (HCMUTE Fake OTP Portal)",
    type: "image",
    content: "",
    metadata: {
      fileName: "qr_scholarship.png",
      bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
      qrContent: "http://hcmute-login.verify-portal.xyz/student-otp",
      fileSize: 28000,
    },
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: LAYER_1_REASONS.QR_MALICIOUS_URL,
  },
  {
    category: "QR Code - Phishing Destination (VCB Fake Biometrics Sync)",
    type: "image",
    content: "",
    metadata: {
      fileName: "qr_vcb_biometrics.png",
      bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
      qrContent: "http://vietcombank-login.verify-portal.xyz/cap-nhat-sinh-trac-hoc",
      fileSize: 32000,
    },
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: LAYER_1_REASONS.QR_MALICIOUS_URL,
  },
  {
    category: "QR Code - Malicious Executable Download (Trojan APK)",
    type: "image",
    content: "",
    metadata: {
      fileName: "qr_app_update.png",
      bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
      qrContent: "https://sv-app-download.site/sinhvien_portal.apk",
      fileSize: 25000,
    },
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: LAYER_1_REASONS.QR_MALICIOUS_URL,
  },
  {
    category: "QR Code - Whitelisted Authentic University Portal",
    type: "image",
    content: "",
    metadata: {
      fileName: "qr_authentic_hcmute.png",
      bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
      qrContent: "https://hcmute.edu.vn/tin-tuc/thong-bao",
      fileSize: 22000,
    },
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: null,
  },
];

// =========================================================================
// 3. BINARY MAGIC BYTES & POLYGLOT EXECUTABLE SUITE
// =========================================================================
export const BINARY_TEST_CASES = [
  {
    category: "Binary - Legitimate PNG Image Header",
    type: "file",
    content: "",
    metadata: {
      fileName: "user_avatar.png",
      bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
      mimeType: "image/png",
      fileSize: 25600,
    },
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: null,
  },
  {
    category: "Binary - Legitimate JPEG Image Header",
    type: "file",
    content: "",
    metadata: {
      fileName: "campus_photo.jpg",
      bytes: [0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46],
      mimeType: "image/jpeg",
      fileSize: 512000,
    },
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: null,
  },
  {
    category: "Binary - Legitimate WebP Image Header",
    type: "file",
    content: "",
    metadata: {
      fileName: "banner.webp",
      bytes: [0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50],
      mimeType: "image/webp",
      fileSize: 84000,
    },
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: null,
  },
  {
    category: "Binary - Legitimate PDF Document Header",
    type: "file",
    content: "",
    metadata: {
      fileName: "giao_trinh.pdf",
      bytes: [0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x37],
      mimeType: "application/pdf",
      fileSize: 1048576,
    },
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: null,
  },
  {
    category: "Binary Polyglot - Disguised Windows PE EXE in JPG (4D 5A)",
    type: "file",
    content: "",
    metadata: {
      fileName: "danh_sach_hoc_bong.jpg",
      bytes: [0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00],
      mimeType: "image/jpeg",
      fileSize: 620000,
    },
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: LAYER_1_REASONS.EXECUTABLE_POLYGLOT,
  },
  {
    category: "Binary Polyglot - Disguised Linux Native ELF in PNG (7F 45 4C 46)",
    type: "file",
    content: "",
    metadata: {
      fileName: "icon_theme.png",
      bytes: [0x7F, 0x45, 0x4C, 0x46, 0x02, 0x01, 0x01, 0x00],
      mimeType: "image/png",
      fileSize: 310000,
    },
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: LAYER_1_REASONS.EXECUTABLE_POLYGLOT,
  },
  {
    category: "Binary Polyglot - Disguised ZIP/APK Archive in PDF (50 4B 03 04)",
    type: "file",
    content: "",
    metadata: {
      fileName: "de_cuong_chi_tiet.pdf",
      bytes: [0x50, 0x4B, 0x03, 0x04, 0x14, 0x00, 0x08, 0x00],
      mimeType: "application/pdf",
      fileSize: 850000,
    },
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: LAYER_1_REASONS.MAGIC_BYTE_MISMATCH,
  },
];

// =========================================================================
// 4. TEXT SOCIAL ENGINEERING & MALWARE PAYLOAD SUITE
// =========================================================================
export const TEXT_TEST_CASES = [
  {
    category: "Text - Credential & OTP Harvesting Trap",
    type: "text",
    content: "Vui lòng nhập mật khẩu Gmail và mã OTP gửi về điện thoại để nhận học bổng 5 triệu đồng.",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: LAYER_1_REASONS.CREDENTIAL_REQUEST,
  },
  {
    category: "Text - Shopee Part-Time Task Deposit Scam",
    type: "text",
    content: "Tuyển sinh viên làm CTV online đánh giá đơn hàng Shopee. Nạp cọc kích hoạt nhiệm vụ 200k và nhận hoa hồng 25% ngay sau 5 phút.",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: LAYER_1_REASONS.TASK_DEPOSIT_SCAM,
  },
  {
    category: "Text - Obfuscated PowerShell Remote Download Shell",
    type: "text",
    content: "Mở PowerShell và chạy lệnh sau để tải cập nhật: powershell.exe -NoP -NonI -W Hidden -Enc SUVYIChOZXctT2JqZWN0",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: LAYER_1_REASONS.MALICIOUS_SHELL_PAYLOAD,
  },
  {
    category: "Text - Spaced Letter Evasion (N h ậ p  m ậ t  k h ẩ u)",
    type: "text",
    content: "N h ậ p  m ậ t  k h ẩ u  v à  m ã  O T P  đ ể  k í c h  h o ạ t",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: LAYER_1_REASONS.CREDENTIAL_REQUEST,
  },
  {
    category: "Text - Zero-Width Space Injection Evasion",
    type: "text",
    content: "nhập\u200Bmật\u200Bkhẩu và mã\u200BOTP để nhận học bổng",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: LAYER_1_REASONS.CREDENTIAL_REQUEST,
  },
  {
    category: "Text - Leet-Speak Evasion (p@ssw0rd and 0TP)",
    type: "text",
    content: "enter y0ur p@ssw0rd and 0TP t0 receive rew@rd",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: LAYER_1_REASONS.CREDENTIAL_REQUEST,
  },
  {
    category: "Text False-Positive Guard - Educational Password Discussion",
    type: "text",
    content: "The lecture explains how password authentication and hashing work in modern distributed systems.",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: null,
  },
  {
    category: "Text False-Positive Guard - Educational Smart OTP Assignment",
    type: "text",
    content: "Bài tập môn An toàn thông tin: sinh viên thảo luận về cơ chế Smart OTP và chữ ký số trong ngân hàng số.",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: null,
  },
  {
    category: "Text False-Positive Guard - AI Language Model Style",
    type: "text",
    content: "As an AI language model, in conclusion, it is important to recognize that structured programming facilitates code maintenance.",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: null,
  },
];

export async function runFullMultiModalEvaluation() {
  console.log("======================================================================");
  console.log("🚀 LAYER 1 FULL MULTI-MODAL EVALUATION & TESTING SUITE");
  console.log("   (Testing URL, OCR Image, QR Code, Binary Polyglot & Text Scams)");
  console.log("======================================================================\n");

  const suites = [
    { title: "🌐 1. URL THREAT & WHITELIST BATTERY", cases: URL_BENCHMARK_CASES },
    { title: "🖼️ 2. OCR IMAGE & SCREENSHOT THREAT BATTERY", cases: OCR_TEST_CASES },
    { title: "📷 3. QR CODE SCANNING & DESTINATION BATTERY", cases: QR_TEST_CASES },
    { title: "📦 4. BINARY MAGIC BYTES & POLYGLOT TROJAN BATTERY", cases: BINARY_TEST_CASES },
    { title: "📝 5. TEXT PHISHING, EVASION & SOCIAL ENGINEERING BATTERY", cases: TEXT_TEST_CASES },
  ];

  let totalPassed = 0;
  let totalFailed = 0;
  let overallLatency = 0;

  for (const suite of suites) {
    console.log(`\n----------------------------------------------------------------------`);
    console.log(`▶ ${suite.title} (${suite.cases.length} Vectors)`);
    console.log(`----------------------------------------------------------------------`);

    let suitePassed = 0;
    let suiteFailed = 0;

    for (const test of suite.cases) {
      const result = await Layer1ScreenService.screen({
        type: test.type || (test.url ? "url" : "text"),
        content: test.content !== undefined ? test.content : (test.url || test.input || ""),
        metadata: test.metadata || {},
      });

      overallLatency += result.metrics.executionTimeMs;

      const isStatusMatch = result.status === test.expectedStatus;
      const isReasonMatch =
        test.expectedReason === null ||
        result.reasons.includes(test.expectedReason) ||
        (result.status === LAYER_1_STATUS.BLOCK &&
          (result.reasons.includes(LAYER_1_REASONS.PHISHING_PATTERN) ||
            result.reasons.includes(LAYER_1_REASONS.BRAND_IMPERSONATION_SUBDOMAIN) ||
            result.reasons.includes(LAYER_1_REASONS.BRAND_IMPERSONATION) ||
            result.reasons.includes(LAYER_1_REASONS.OCR_PHISHING_PATTERN) ||
            result.reasons.includes(LAYER_1_REASONS.QR_MALICIOUS_URL) ||
            result.reasons.includes(LAYER_1_REASONS.EXECUTABLE_POLYGLOT) ||
            result.reasons.includes(LAYER_1_REASONS.MAGIC_BYTE_MISMATCH)));

      const isPass = isStatusMatch && isReasonMatch;

      if (isPass) {
        suitePassed++;
        totalPassed++;
        console.log(`✅ [PASS] ${test.category || test.title}`);
        console.log(`   Status: ${result.status} | Conf: ${result.confidence} | Latency: ${result.metrics.executionTimeMs}ms | Reasons: [${result.reasons.join(", ")}]`);
      } else {
        suiteFailed++;
        totalFailed++;
        console.error(`❌ [FAIL] ${test.category || test.title}`);
        console.error(`   Expected: Status=${test.expectedStatus}, Reason=${test.expectedReason}`);
        console.error(`   Received: Status=${result.status}, Reasons=[${result.reasons.join(", ")}]`);
      }
    }

    const rate = ((suitePassed / suite.cases.length) * 100).toFixed(1);
    console.log(`\n📊 Suite Result: ${suitePassed}/${suite.cases.length} Passed (${rate}%)`);
  }

  const grandTotal = totalPassed + totalFailed;
  const avgLatency = (overallLatency / grandTotal).toFixed(2);
  const accuracy = ((totalPassed / grandTotal) * 100).toFixed(1);

  console.log("\n======================================================================");
  console.log("🏆 GRAND TOTAL MULTI-MODAL EVALUATION SUMMARY");
  console.log("======================================================================");
  console.log(`Total Multi-Modal Test Vectors Screened : ${grandTotal}`);
  console.log(`Successful Deterministic Tests (PASSED) : ${totalPassed} / ${grandTotal}`);
  console.log(`Failed Tests                            : ${totalFailed}`);
  console.log(`Average Screening Latency               : ${avgLatency} ms`);
  console.log(`Overall System Accuracy                 : ${accuracy}%`);
  console.log("======================================================================\n");

  return { totalPassed, totalFailed, grandTotal, accuracy, avgLatency };
}

// Auto-run if executed directly
if (process.argv[1]?.endsWith("full_multimodal_evaluation.test.mjs")) {
  runFullMultiModalEvaluation().then(({ totalFailed }) => {
    if (totalFailed > 0) process.exit(1);
    else process.exit(0);
  });
}
