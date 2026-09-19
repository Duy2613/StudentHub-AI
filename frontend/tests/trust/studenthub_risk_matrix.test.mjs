import assert from "node:assert/strict";
import test from "node:test";

import { Layer1ScreenService } from "../../src/lib/ai-trust/layer1/Layer1ScreenService.js";
import { QrIntakeService } from "../../src/lib/ai-trust/layer1/qr/QrIntakeService.js";
import { Layer2AReputationService } from "../../src/lib/ai-trust/layer2a/Layer2AReputationService.js";
import { StudentDomainRiskModel } from "../../src/lib/ai-trust/v5/l2c/StudentDomainRiskModel.js";

const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64"
);

const CASES = [
  { id: "T01", kind: "text", expected: "HIGH", content: "Bạn trúng học bổng 100%, chuyển 2 triệu phí giữ chỗ ngay hôm nay" },
  { id: "T02", kind: "text", expected: "BLOCK", content: "Tài khoản sinh viên sắp bị khóa, gửi mật khẩu để xác minh" },
  { id: "T03", kind: "text", expected: "HIGH", content: "Nhận việc online 500k/ngày, đóng cọc 1 triệu trước" },
  { id: "T04", kind: "text", expected: "HIGH", content: "Chuyển tiền xác minh tài khoản, hoàn lại sau 5 phút" },
  { id: "T05", kind: "text", expected: "HIGH", content: "Bạn nợ học phí, chuyển vào STK cá nhân này" },
  { id: "T06", kind: "text", expected: "BLOCK", content: "Công an yêu cầu chuyển tiền để chứng minh trong sạch" },
  { id: "T07", kind: "text", expected: "HIGH", content: "Người thân gặp tai nạn, cần chuyển tiền gấp" },
  { id: "T08", kind: "text", expected: "HIGH", content: "Đầu tư 10 triệu, đảm bảo lời 30%/tuần" },
  { id: "T09", kind: "text", expected: "HIGH", content: "Nạp tiền để mở khóa khoản vay" },
  { id: "T10", kind: "text", expected: "HIGH", content: "Nộp phí nhận quà/trúng thưởng" },
  { id: "T11", kind: "text", expected: "LOW", content: "Thông báo từ trường: lịch học tuần sau cập nhật trên cổng sinh viên chính thức, không yêu cầu thanh toán." },
  { id: "T12", kind: "text", expected: "UNKNOWN", content: "Mình nghe nói có thay đổi, bạn kiểm tra giúp nhé." },
  { id: "U01", kind: "url", expected: "HIGH", content: "https://hcmut3.edu.vn/login" },
  { id: "U02", kind: "url", expected: "MEDIUM", content: "https://203.0.113.10/login" },
  { id: "U03", kind: "url", expected: "MEDIUM", content: "https://example.com/redirect?url=https%3A%2F%2Flogin.example.net%2Fverify%3Fnext%3Dhttps%3A%2F%2Fother.example.org%2Flogin" },
  { id: "U04", kind: "url", expected: "MEDIUM", content: "https://bit.ly/studenthub-check" },
  { id: "U05", kind: "url", expected: "HIGH", content: "http://payment.example.com/checkout" },
  { id: "U06", kind: "url", expected: "HIGH", content: "https://secure-student-login.example.net/verify-account" },
  { id: "U07", kind: "url", expected: "HIGH", content: "https://studenthuh.edu.vn/login" },
  { id: "U08", kind: "url", expected: "LOW", content: "https://hcmute.edu.vn/" },
  { id: "U09", kind: "url", expected: "NOT_APPLICABLE", content: "https://example.com/about" },
  { id: "U10", kind: "url", expected: "UNKNOWN", providerUnavailable: true, content: "https://new-unknown-domain.invalid/reputation-unavailable" },
  { id: "I01", kind: "image", expected: "HIGH", ocr: "HỌC BỔNG 100%. Chuyển cọc 2.000.000 VNĐ để giữ suất trước 22:00 hôm nay. STK cá nhân 123456789." },
  { id: "I02", kind: "image", expected: "HIGH", ocr: "Ảnh chụp chuyển khoản giả: giao dịch thành công 8.000.000 VNĐ." },
  { id: "I03", kind: "image", expected: "HIGH", ocr: "HÓA ĐƠN ĐÃ CHỈNH SỬA SỐ TIỀN. Vui lòng chuyển khoản theo số tiền mới.", exif: { software: "Photoshop" } },
  { id: "I04", kind: "image", expected: "HIGH", ocr: "GIẤY BÁO TRÚNG THƯỞNG 50.000.000 VNĐ. Nộp phí nhận quà vào STK cá nhân 123456789." },
  { id: "I05", kind: "image", expected: "HIGH", ocr: "TUYỂN CTV ONLINE. Lương 500k/ngày. Đóng cọc 800k phí kích hoạt trước." },
  { id: "I06", kind: "image", expected: "HIGH", ocr: "Thầy ơi đang họp, chuyển giúp thầy 8 triệu vào tài khoản này, lát thầy gửi lại." },
  { id: "I07", kind: "image", expected: "BLOCK", ocr: "NGÂN HÀNG: Tài khoản bị khóa. Gửi OTP để xác minh và nhận hoàn tiền ngay." },
  { id: "I08", kind: "image", expected: "HIGH", ocr: "QUÉT QR ĐỂ THANH TOÁN. Chuyển tiền tới tài khoản cá nhân chưa xác minh.", qr: "https://pay.example.com/checkout?recipient=personal&amount=300000" },
  { id: "I09", kind: "image", expected: "UNKNOWN", ocr: "Ảnh chụp một thông báo bình thường, không rõ nguồn và không có metadata." },
  { id: "I10", kind: "image", expected: "LOW", ocr: "THÔNG BÁO CHÍNH THỨC TỪ WEBSITE TRƯỜNG. Xem lịch học tại https://hcmute.edu.vn/." },
  { id: "Q01", kind: "qr", expected: "LOW", content: "https://hcmute.edu.vn/student-services" },
  { id: "Q02", kind: "qr", expected: "HIGH", content: "https://hcmut3.edu.vn/login" },
  { id: "Q03", kind: "qr", expected: "MEDIUM", content: "https://bit.ly/studenthub-check" },
  { id: "Q04", kind: "qr", expected: "HIGH", content: "https://pay.example.com/checkout?recipient=personal&amount=300000&memo=student" },
  { id: "Q05", kind: "qr", expected: "PRIVACY", content: "WIFI:T:WPA;S:Campus-WiFi;P:student-secret;;" },
  { id: "Q06", kind: "qr", expected: "CAUTION", content: "tel:+84901234567" },
  { id: "Q07", kind: "qr", expected: "MEDIUM", content: "studenthub://open/payment" },
  { id: "Q08", kind: "qr", expected: "HIGH", content: "Chuyển tiền tới STK cá nhân 123456789 để nhận học bổng" },
  { id: "Q09", kind: "qr", expected: "UNKNOWN", content: "" },
  { id: "Q10", kind: "qr", expected: "BLOCK", content: "http://127.0.0.1:3000/admin" },
  { id: "E01", kind: "text", expected: "HIGH", content: "Chúc mừng bạn đã được nhận học bổng toàn phần trị giá 50 triệu. Để giữ suất, vui lòng chuyển 1.500.000 VNĐ phí xác nhận trước 22:00 hôm nay." },
  { id: "E02", kind: "text", expected: "HIGH", content: "Tuyển sinh viên làm CTV tại nhà. Thu nhập 500k–1 triệu/ngày. Chỉ cần đóng 800k phí kích hoạt tài khoản." },
  { id: "E03", kind: "text", expected: "HIGH", content: "Phòng công tác sinh viên thông báo tài khoản của bạn có vấn đề. Chuyển 2 triệu vào tài khoản dưới đây để xác minh và mở khóa." },
  { id: "E04", kind: "text", expected: "BLOCK", content: "Bạn liên quan tới vụ án rửa tiền. Để chứng minh vô tội, hãy chuyển toàn bộ tiền sang tài khoản an toàn." },
  { id: "E05", kind: "text", expected: "HIGH", content: "Bạn được hoàn 3.200.000 VNĐ. Vui lòng chuyển 300.000 VNĐ phí xử lý trước." },
  { id: "E06", kind: "text", expected: "HIGH", content: "Khoản vay 20 triệu đã được duyệt. Chuyển 1 triệu phí bảo hiểm để giải ngân." },
  { id: "E07", kind: "text", expected: "HIGH", content: "Đầu tư 5 triệu hôm nay. Cam kết lợi nhuận 25% mỗi tuần. Không có rủi ro." },
  { id: "E08", kind: "text", expected: "HIGH", content: "Người mua đã chuyển tiền. Bạn cần nộp 700.000 để nâng cấp tài khoản người bán trước khi nhận tiền." },
  { id: "E09", kind: "text", expected: "HIGH", content: "Anh đang họp, chuyển giúp anh 8 triệu vào tài khoản này. Lát anh gửi lại." },
  { id: "E10", kind: "text", expected: "BLOCK", content: "Ngân hàng cần mã OTP để hoàn tiền. Gửi OTP vào đây trong vòng 2 phút." },
  { id: "BORROW-300K", kind: "text", expected: "UNKNOWN", content: "Tôi đang có việc gấp cần mượn 300k, trả liền ngày mai, và bạn đưa tôi số điện thoại." },
];

function asInput(item) {
  if (item.kind !== "image") return { type: item.kind, content: item.content };
  return {
    type: "image",
    content: "",
    metadata: {
      bytes: PNG_1X1,
      fileName: `${item.id}.png`,
      mimeType: "image/png",
      fileSize: PNG_1X1.length,
      ocrText: item.ocr || "",
      qrContent: item.qr || "",
      exif: item.exif || {},
    },
  };
}

function matrixPass(item, layer1, domain, qr) {
  const suspicious = layer1.status === "SUSPICIOUS" || layer1.status === "BLOCK";
  const domainHigh = domain.severity === "HIGH" || domain.severity === "CRITICAL";
  switch (item.expected) {
    case "BLOCK":
      return layer1.status === "BLOCK";
    case "HIGH":
      return suspicious || domainHigh || qr?.securityStatus === "SUSPICIOUS";
    case "MEDIUM":
      return suspicious || qr?.securityStatus === "SUSPICIOUS";
    case "LOW":
      return layer1.status === "PASS" && !domainHigh && (!qr || ["SAFE", "PASS"].includes(qr.securityStatus));
    case "NOT_APPLICABLE":
      return layer1.status === "PASS";
    case "PRIVACY":
      return qr?.securityStatus === "PRIVACY";
    case "CAUTION":
      return qr?.securityStatus === "CAUTION";
    case "UNKNOWN":
      return item.providerUnavailable || layer1.status === "UNKNOWN" || domain.classification === "UNKNOWN_STUDENT_RISK" || domain.severity === "INFO";
    default:
      return false;
  }
}

test("StudentHub Trust risk matrix — T/U/I/Q, extended scams, and benign borrowing", async () => {
  const originalLog = console.log;
  console.log = () => {};
  const rows = [];
  try {
    for (const item of CASES) {
      const layer1 = await Layer1ScreenService.screen(asInput(item));
      const domainText = item.kind === "image" ? `${item.ocr || ""} ${item.qr || ""}` : item.content;
      const domain = StudentDomainRiskModel.analyze({ content: domainText, inputType: item.kind });
      const qr = item.kind === "qr" ? QrIntakeService.intake(item.content) : null;
      if (!item.providerUnavailable) {
        assert.equal(matrixPass(item, layer1, domain, qr), true, `${item.id}: expected ${item.expected}, got L1=${layer1.status}, domain=${domain.classification}, QR=${qr?.securityStatus || "n/a"}`);
      }
      rows.push({ id: item.id, expected: item.expected, layer1: layer1.status, domain: domain.classification, severity: domain.severity, qr: qr?.securityStatus || null });
    }

    const outage = await Layer2AReputationService.verify({
      url: "https://new-unknown-domain.invalid/reputation-unavailable",
      requestId: "matrix-u10",
      options: { provider: { check: async () => { throw new Error("simulated provider outage"); } } },
    });
    assert.equal(outage.finding, "UNKNOWN", "U10 provider outage must remain UNKNOWN");
    assert.equal(outage.providerStatus, "UNAVAILABLE");
    assert.equal(outage.securityClassification, "UNKNOWN");

    const failures = rows.filter((row) => {
      const item = CASES.find((candidate) => candidate.id === row.id);
      return item.providerUnavailable ? false : !matrixPass(item, { status: row.layer1 }, { classification: row.domain, severity: row.severity }, row.qr ? { securityStatus: row.qr } : null);
    });
    assert.deepEqual(failures, []);
    originalLog(`RISK_MATRIX ${JSON.stringify({ total: rows.length, passed: rows.length, u10: outage.finding })}`);
  } finally {
    console.log = originalLog;
  }
});
