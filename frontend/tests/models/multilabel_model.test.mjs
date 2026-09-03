/**
 * StudentHub AI — Multi-Head Multi-Label Neural Trust Engine Test Suite
 * 
 * Verifies multi-label taxonomies, psychological manipulation tactics,
 * attack stages, requested actions, and hard-negative preservation.
 */

import { StudentHubMultiLabelNeuralModel } from "../../src/lib/ai-trust/models/StudentHubMultiLabelNeuralModel.js";

console.log("======================================================================");
console.log("🧪 MULTI-HEAD MULTI-LABEL NEURAL TRUST ENGINE TEST SUITE");
console.log("======================================================================");

const testCases = [
  {
    name: "1. NCKH Lab Project Advance Deposit (User Prompt)",
    text: "chào em anh là Lê Quốc Thịnh , anh ở trong trường hiện tại đang nghiên cứu dự án làm robot tự hành , em có muốn tham gia không nếu có thì đóng cọc giữ chỗ 2 triệu em nhé , vì nhóm anh rất chuyên nghiệp và đã thi đấu quốc tế",
    expectedVerdict: "SCAM",
    expectedScamType: "ACADEMIC_LAB_PROJECT_DEPOSIT_FRAUD",
    expectedTactic: "FLATTERY_PRESTIGE",
    expectedAction: "TRANSFER_MONEY",
    expectedStage: "STAGE_6_PAYMENT_EXTRACTION",
  },
  {
    name: "2. Fake Police Legal Coercion with Secrecy Demand",
    text: "Đây là Đại úy Tuấn - Cơ quan Cảnh sát điều tra Bộ Công an. CMND của anh liên quan đường dây rửa tiền 50 tỷ. Yêu cầu chuyển 20 triệu vào tài khoản tạm giữ tòa án trong 30 phút để chứng minh trong sạch. Tuyệt đối không được ngắt máy hay kể với gia đình.",
    expectedVerdict: "SCAM",
    expectedScamType: "POLICE_LEGAL_IMPERSONATION",
    expectedTactic: "FEAR",
    expectedAction: "SECRECY_ISOLATION",
    expectedStage: "STAGE_6_PAYMENT_EXTRACTION",
  },
  {
    name: "3. Bank Phishing Combosquatting Domain with OTP & Face ID",
    text: "[Vietcombank] Cảnh báo khẩn: Tài khoản của quý khách vừa đăng nhập lạ trên thiết bị khác. Nhấp https://vietcombank-smart-verify99.com để nhập mã OTP và xác thực khuôn mặt ngay trước khi bị khóa vĩnh viễn trong 15 phút.",
    expectedVerdict: "SCAM",
    expectedScamType: "OTP_CREDENTIAL_PHISHING",
    expectedTactic: "URGENCY",
    expectedAction: "OTP",
    expectedStage: "STAGE_5_CREDENTIAL_EXTRACTION",
  },
  {
    name: "4. Fake Online CTV Part-Time Job with Shopee Order Task",
    text: "Tuyển CTV làm việc tại nhà, hoa hồng 20-30% ngày kiếm 500k-2tr. Nhận tiền sau 5 phút làm nhiệm vụ thanh toán đơn hàng Shopee và nạp tiền kích hoạt tài khoản.",
    expectedVerdict: "SCAM",
    expectedScamType: "FAKE_PARTTIME_JOB_TASK",
    expectedTactic: "GREED",
    expectedAction: "TRANSFER_MONEY",
    expectedStage: "STAGE_6_PAYMENT_EXTRACTION",
  },
  {
    name: "5. Hard Negative — Official Bank Warning (Never Demands OTP)",
    text: "[Vietcombank Khuyến Cáo] Ngân hàng Vietcombank không bao giờ yêu cầu khách hàng cung cấp mã OTP hay mật khẩu qua điện thoại/SMS. Quý khách tuyệt đối không chia sẻ mã OTP cho bất kỳ ai.",
    expectedVerdict: "LEGITIMATE",
    expectedScamType: "HARD_NEGATIVE_BANK_WARNING",
    expectedStage: "STAGE_1_CONTACT",
  },
  {
    name: "6. Hard Negative — Academic Assignment on Information Security & 2FA",
    text: "Bài tập môn An toàn thông tin: Sinh viên hãy phân tích cơ chế xác thực hai lớp 2FA và mã OTP SMS so với TOTP Google Authenticator.",
    expectedVerdict: "LEGITIMATE",
    expectedScamType: "HARD_NEGATIVE_ACADEMIC_ASSIGNMENT",
    expectedStage: "STAGE_1_CONTACT",
  },
];

let passed = 0;

for (const tc of testCases) {
  const res = StudentHubMultiLabelNeuralModel.predict(tc.text);
  const verdictMatches = res.verdict === tc.expectedVerdict;
  const scamMatches = !tc.expectedScamType || res.scam_types.includes(tc.expectedScamType);
  const tacticMatches = !tc.expectedTactic || res.psychological_tactics.includes(tc.expectedTactic);
  const actionMatches = !tc.expectedAction || res.requested_actions.includes(tc.expectedAction);
  const stageMatches = !tc.expectedStage || res.attack_stage === tc.expectedStage;

  const isSuccess = verdictMatches && scamMatches && tacticMatches && actionMatches && stageMatches;

  if (isSuccess) {
    passed++;
    console.log(`✅ [PASS] ${tc.name}`);
    console.log(`   Verdict: ${res.verdict} (${(res.confidence * 100).toFixed(1)}%) | Stage: ${res.attack_stage}`);
    console.log(`   Scam Types: ${JSON.stringify(res.scam_types)}`);
    console.log(`   Tactics: ${JSON.stringify(res.psychological_tactics)} | Actions: ${JSON.stringify(res.requested_actions)}`);
    console.log(`   Latency: ${res.latencyMs}ms\n`);
  } else {
    console.error(`❌ [FAIL] ${tc.name}`);
    console.error(`   Expected: Verdict=${tc.expectedVerdict}, Scam=${tc.expectedScamType}, Tactic=${tc.expectedTactic}, Action=${tc.expectedAction}, Stage=${tc.expectedStage}`);
    console.error(`   Actual:   Verdict=${res.verdict}, Scams=${JSON.stringify(res.scam_types)}, Tactics=${JSON.stringify(res.psychological_tactics)}, Actions=${JSON.stringify(res.requested_actions)}, Stage=${res.attack_stage}\n`);
  }
}

console.log("======================================================================");
console.log(`🎯 MULTI-HEAD TEST SUMMARY: ${passed}/${testCases.length} Passed (${((passed / testCases.length) * 100).toFixed(1)}%)`);
console.log("======================================================================");

if (passed !== testCases.length) {
  process.exit(1);
}
