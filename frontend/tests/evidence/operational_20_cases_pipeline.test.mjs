/**
 * StudentHub AI — 20-Case Operational Corpus Pipeline Verification (G8)
 *
 * Implements Sections 74 & 75:
 * Proves the end-to-end operational pipeline readiness across 20 source-backed cases:
 * Claim → Query → Retrieval provider → URL → Snapshot → Parser version → SHA-256 → Evidence relation → Verdict → Passport.
 */

import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, "../../");
const frontendRequire = createRequire(path.join(frontendDir, "package.json"));

try {
  const { loadEnvConfig } = frontendRequire("@next/env");
  loadEnvConfig(frontendDir);
} catch {}

import { TrustV5Engine } from "../../src/lib/server/trust/TrustV5Engine.js";

const OPERATIONAL_CORPUS_20 = [
  {
    id: "OP-01",
    name: "Học bổng toàn phần yêu cầu chuyển cọc giữ chỗ",
    input: "Thông báo cấp học bổng toàn phần 100% học phí Trường Đại học Sư phạm Kỹ thuật TP.HCM năm 2026. Sinh viên trúng tuyển vui lòng chuyển khoản trước 1.500.000 VNĐ phí giữ chỗ vào tài khoản cá nhân.",
    expectedRisk: "HIGH_RISK",
  },
  {
    id: "OP-02",
    name: "Thông báo nộp học phí qua cổng ngân hàng chính thức",
    input: "Trường Đại học Sư phạm Kỹ thuật TP.HCM thông báo thu học phí học kỳ 1 năm học 2025-2026 qua cổng thanh toán trực tuyến chính thức tại portal.hcmute.edu.vn.",
    expectedRisk: "SUPPORTED",
  },
  {
    id: "OP-03",
    name: "Thuê phòng ký túc xá yêu cầu cọc qua ví Momo cá nhân",
    input: "Ban quản lý KTX HCMUTE thông báo còn 5 phòng dịch vụ giá rẻ. Đề nghị sinh viên chuyển tiền cọc 2 triệu đồng qua ví điện tử cá nhân để nhận chìa khóa.",
    expectedRisk: "HIGH_RISK",
  },
  {
    id: "OP-04",
    name: "Dự án NCKH Lab Robot yêu cầu nộp tiền thế chân",
    input: "Chào em anh là sinh viên nghiên cứu Lab Robot tự hành trường mình, nhóm đang thiếu thành viên, em tham gia thì đóng cọc 2 triệu giữ chỗ nhé.",
    expectedRisk: "HIGH_RISK",
  },
  {
    id: "OP-05",
    name: "Quy chế chuẩn đầu ra ngoại ngữ tốt nghiệp K24",
    input: "Quy chế đào tạo chính thức trường ĐH Sư phạm Kỹ thuật TP.HCM yêu cầu sinh viên khóa K24 đạt chuẩn đầu ra tiếng Anh tương đương TOEIC 500 điểm để được xét tốt nghiệp.",
    expectedRisk: "SUPPORTED",
  },
  {
    id: "OP-06",
    name: "Công an gọi điện đe dọa liên quan án ma túy yêu cầu chuyển tiền",
    input: "Cơ quan cảnh sát điều tra thông báo CMND của bạn liên quan đường dây rửa tiền xuyên quốc gia, yêu cầu chuyển 20 triệu vào tài khoản tạm giữ để thẩm tra.",
    expectedRisk: "HIGH_RISK",
  },
  {
    id: "OP-07",
    name: "Giả mạo ngân hàng gửi link yêu cầu nhập mã OTP",
    input: "[Vietcombank Khẩn cấp] Tài khoản vừa đăng nhập thiết bị lạ, truy cập ngay http://vietcombank-smart-verify99.online nhập mã OTP xác thực để tránh khóa thẻ.",
    expectedRisk: "HIGH_RISK",
  },
  {
    id: "OP-08",
    name: "Thông báo lịch đăng ký môn học học kỳ hè 2026",
    input: "Phòng Đào tạo thông báo kế hoạch đăng ký môn học học kỳ hè năm học 2025-2026 dành cho sinh viên có nhu cầu học cải thiện và học vượt.",
    expectedRisk: "SUPPORTED",
  },
  {
    id: "OP-09",
    name: "Việc làm thêm online thanh toán đơn hàng Shopee hoa hồng cao",
    input: "Tuyển CTV xử lý đơn hàng online tại nhà thu nhập 1 triệu/ngày, chỉ cần nạp tiền cọc kích hoạt nhiệm vụ trên ứng dụng.",
    expectedRisk: "HIGH_RISK",
  },
  {
    id: "OP-10",
    name: "Điều kiện làm khóa luận tốt nghiệp ngành CNTT",
    input: "Sinh viên ngành Công nghệ Thông tin cần tích lũy tối thiểu 110 tín chỉ và có điểm trung bình tích lũy từ 2.50 trở lên để đủ điều kiện đăng ký Khóa luận tốt nghiệp.",
    expectedRisk: "SUPPORTED",
  },
  {
    id: "OP-11",
    name: "Bán đề thi cuối kỳ môn Kiến trúc Máy tính kèm đáp án",
    input: "Nhận cung cấp đề thi chính thức kèm đáp án môn Kiến trúc Máy tính học kỳ này, cam kết điểm A, chuyển trước 500k qua thẻ cào.",
    expectedRisk: "HIGH_RISK",
  },
  {
    id: "OP-12",
    name: "Học bổng khuyến khích học tập theo Quyết định nhà trường",
    input: "Nhà trường xét cấp học bổng khuyến khích học tập định kỳ cho sinh viên có kết quả học tập và rèn luyện từ loại Khá trở lên, không thu bất kỳ khoản phí nộp hồ sơ nào.",
    expectedRisk: "SUPPORTED",
  },
  {
    id: "OP-13",
    name: "Cho thuê tài khoản ngân hàng nhận hoa hồng 500k/tháng",
    input: "Cần tìm sinh viên mở và cho thuê lại tài khoản ngân hàng để nhận chuyển khoản tiền game, trả tiền thuê 500k mỗi tài khoản hàng tuần.",
    expectedRisk: "HIGH_RISK",
  },
  {
    id: "OP-14",
    name: "Quy định cảnh báo học vụ theo Quyết định 3116",
    input: "Theo Quyết định số 3116/QĐ-ĐHSPKT, sinh viên có điểm trung bình học kỳ 1 dưới 0.80 hoặc các học kỳ tiếp theo dưới 1.00 sẽ bị cảnh báo kết quả học tập.",
    expectedRisk: "SUPPORTED",
  },
  {
    id: "OP-15",
    name: "Fanpage giả mạo CLB Sinh viên tuyển tình nguyện viên đóng quỹ",
    input: "CLB Tình nguyện HCMUTE mở đợt tuyển thành viên mới tham gia Mùa hè xanh, yêu cầu đóng trước 800k tiền quỹ và đồng phục vào tài khoản cá nhân admin.",
    expectedRisk: "HIGH_RISK",
  },
  {
    id: "OP-16",
    name: "Thông báo cấp giấy chứng nhận sinh viên tạm hoãn nghĩa vụ quân sự",
    input: "Phòng Công tác sinh viên thông báo cấp Giấy xác nhận sinh viên phục vụ việc tạm hoãn gọi nhập ngũ năm 2026, sinh viên đăng ký trực tuyến tại cổng thông tin.",
    expectedRisk: "SUPPORTED",
  },
  {
    id: "OP-17",
    name: "Vay tiền nhanh sinh viên giải ngân trong 10 phút lãi suất cắt cổ",
    input: "Hỗ trợ sinh viên vay tiền đóng học phí không cần thế chấp, giải ngân trong 10 phút qua app, chỉ cần cung cấp hình ảnh CCCD và danh bạ điện thoại.",
    expectedRisk: "HIGH_RISK",
  },
  {
    id: "OP-18",
    name: "Hội thảo Khoa học Sinh viên Nghiên cứu Công nghệ AI 2026",
    input: "Khoa Công nghệ Thông tin tổ chức Hội thảo khoa học sinh viên thường niên, miễn phí tham dự cho toàn thể sinh viên và giảng viên quan tâm.",
    expectedRisk: "SUPPORTED",
  },
  {
    id: "OP-19",
    name: "Email giả danh Phòng Khảo thí thông báo nợ điểm và đòi tiền sửa điểm",
    input: "Cảnh báo khẩn: Bạn đang nợ điểm F môn Toán cao cấp, chuyển 3 triệu đồng vào tài khoản cán bộ khảo thí trước 17h để sửa thành điểm B trên hệ thống.",
    expectedRisk: "HIGH_RISK",
  },
  {
    id: "OP-20",
    name: "Thời gian đăng ký xét tốt nghiệp đợt 1 năm 2026",
    input: "Thông báo nộp hồ sơ xét công nhận tốt nghiệp đợt tháng 3 năm 2026 dành cho sinh viên đã hoàn thành đủ số tín chỉ và chuẩn đầu ra theo chương trình đào tạo.",
    expectedRisk: "SUPPORTED",
  },
];

test("G8 OPERATIONAL CORPUS: 20 Source-Backed Cases Pipeline Readiness", async () => {
  console.log("============================================================");
  console.log("📋 RUNNING 20-CASE OPERATIONAL CORPUS PIPELINE (G8)");
  console.log("============================================================");

  let verifiedCount = 0;

  for (const tc of OPERATIONAL_CORPUS_20) {
    const start = Date.now();
    const result = await TrustV5Engine.verify({
      type: "text",
      content: tc.input,
      caseId: `case-operational-${tc.id.toLowerCase()}`,
      revision: 1,
    });
    const duration = Date.now() - start;

    // 1. Claim contract verification
    assert.ok(result.caseId, `${tc.id}: Must have caseId`);
    assert.ok(result.runId, `${tc.id}: Must have runId`);
    assert.ok(Array.isArray(result.claims) && result.claims.length > 0, `${tc.id}: Must extract claims`);
    for (const claim of result.claims) {
      assert.ok(claim.claimId, `${tc.id}: Claim must have claimId`);
      assert.ok(claim.text, `${tc.id}: Claim must have text`);
      assert.ok(claim.type, `${tc.id}: Claim must have type`);
      assert.ok(claim.materiality, `${tc.id}: Claim must have materiality`);
    }

    // 2. Evidence Source provenance (Section 74)
    assert.ok(Array.isArray(result.evidence.sources) && result.evidence.sources.length > 0, `${tc.id}: Must have evidence sources`);
    for (const src of result.evidence.sources) {
      assert.ok(src.sourceId, `${tc.id}: Source must have sourceId`);
      assert.ok(src.canonicalUrl, `${tc.id}: Source must have canonicalUrl`);
      assert.ok(src.publisher, `${tc.id}: Source must have publisher`);
      assert.ok(src.publishedAt, `${tc.id}: Source must have publishedAt`);
      assert.ok(src.retrievedAt, `${tc.id}: Source must have retrievedAt`);
      assert.ok(src.contentDigest, `${tc.id}: Source must have contentDigest (SHA-256)`);
      assert.ok(src.snapshotUri, `${tc.id}: Source must have snapshotUri`);
      assert.ok(src.parserVersion, `${tc.id}: Source must have parserVersion`);
      assert.ok(src.independenceKey, `${tc.id}: Source must have independenceKey`);
    }

    // 3. Evidence Independence Graph (Section 36)
    assert.ok(Array.isArray(result.evidence.independenceGroups) && result.evidence.independenceGroups.length > 0, `${tc.id}: Must have independence groups`);

    // 4. Claim-Source Relationships (Section 38)
    assert.ok(Array.isArray(result.evidence.relationships) && result.evidence.relationships.length > 0, `${tc.id}: Must have relationships`);

    // 5. Verdict & Decision Twin (Section 48, 50)
    assert.ok(result.verdict && result.verdict.label, `${tc.id}: Must have verdict label`);
    assert.ok(result.decisionTwin, `${tc.id}: Must have Decision Twin`);
    assert.ok(Array.isArray(result.decisionTwin.decisionDrivers), `${tc.id}: Decision Twin must have drivers`);
    assert.ok(Array.isArray(result.decisionTwin.reversalConditions), `${tc.id}: Decision Twin must have reversal conditions`);

    // 6. Next Actions (Section 51)
    assert.ok(Array.isArray(result.nextActions) && result.nextActions.length > 0, `${tc.id}: Must recommend next actions`);

    // 7. Evidence Passport (Section 52)
    assert.ok(result.passport && result.passport.passportId, `${tc.id}: Must issue Evidence Passport`);
    assert.ok(result.passport.artifactHash, `${tc.id}: Passport must have artifact hash`);
    assert.equal(result.passport.revision, 1, `${tc.id}: Passport revision must match`);

    verifiedCount++;
    console.log(`  [${tc.id}] ${tc.name.slice(0, 45).padEnd(47)} -> Verdict: ${result.verdict.label.padEnd(16)} (${duration}ms)`);
  }

  assert.equal(verifiedCount, 20, "All 20 operational cases must verify end-to-end");
  console.log("============================================================");
  console.log(`✅ 20/20 OPERATIONAL CASES PIPELINE VERIFIED SUCCESSFULLY`);
  console.log("============================================================\n");
});
