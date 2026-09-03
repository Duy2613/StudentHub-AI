import { StudentDomainRiskModel } from "./StudentDomainRiskModel.js";

export const STUDENT_DOMAIN_EVALUATION_VERSION = "studenthub-domain-evaluation-1.0.0";

export const STUDENT_DOMAIN_FIXTURES = Object.freeze([
  { id: "fixture-fake-scholarship", content: "Bạn được nhận học bổng, đóng phí hồ sơ và chuyển khoản ngay để giữ suất.", expected: "FAKE_SCHOLARSHIP" },
  { id: "fixture-tuition-payment", content: "Phòng tài vụ yêu cầu chuyển học phí vào tài khoản cá nhân mới trong hôm nay.", expected: "TUITION_PAYMENT_SCAM" },
  { id: "fixture-fake-part-time", content: "Việc làm thêm online lương cao, tuyển gấp, nộp phí kích hoạt trước.", expected: "FAKE_PART_TIME_JOB" },
  { id: "fixture-advance-fee", content: "Đóng trước phí giữ chỗ để được duyệt hồ sơ sinh viên.", expected: "ADVANCE_FEE_SCAM" },
  { id: "fixture-university-impersonation", content: "Nhà trường thông báo: đăng nhập link và gửi OTP để xác minh ngay.", expected: "CREDENTIAL_HARVESTING" },
  { id: "fixture-faculty-impersonation", content: "Cô cố vấn học tập nhờ chuyển khoản phí gấp để đăng ký môn.", expected: "FACULTY_IMPERSONATION" },
  { id: "fixture-account-takeover", content: "Tài khoản sinh viên sẽ bị khóa, hãy nhập mật khẩu vào link khôi phục.", expected: "CREDENTIAL_HARVESTING" },
  { id: "fixture-qr-payment", content: "Quét mã QR và chuyển tiền phí tham gia chương trình ngay.", expected: "QR_PAYMENT_SCAM" },
  { id: "fixture-benign-university", content: "Thông báo của trường: lịch nghỉ lễ và phòng học được cập nhật trên cổng chính thức.", expected: "NO_MATERIAL_STUDENT_RISK" },
  { id: "fixture-benign-scholarship", content: "Thông báo học bổng học kỳ mới: xem điều kiện và hạn nộp trên website trường.", expected: "NO_MATERIAL_STUDENT_RISK" },
  { id: "fixture-benign-internship", content: "Khoa chia sẻ cơ hội thực tập, sinh viên đọc mô tả và nộp hồ sơ qua cổng trường.", expected: "NO_MATERIAL_STUDENT_RISK" },
  { id: "fixture-vietnamese-slang", content: "Kèo việc nhẹ lương cao, chốt lẹ nha, cọc trước 200k mới giữ slot.", expected: "ADVANCE_FEE_SCAM" },
  { id: "fixture-mixed-language", content: "Apply scholarship today, pay the processing fee via personal account để giữ suất.", expected: "FAKE_SCHOLARSHIP" },
  { id: "fixture-obfuscated", content: "Chuyen kh0an ngay de tranh khoa acc, gui 0TP qua link xac minh.", expected: "CREDENTIAL_HARVESTING" },
]);

function safeDivide(numerator, denominator) {
  return denominator > 0 ? Number((numerator / denominator).toFixed(4)) : null;
}

function perClassMetrics(labels, predictions, classId) {
  let truePositive = 0;
  let falsePositive = 0;
  let falseNegative = 0;
  for (let index = 0; index < labels.length; index += 1) {
    const actual = labels[index] === classId;
    const predicted = predictions[index] === classId;
    if (actual && predicted) truePositive += 1;
    if (!actual && predicted) falsePositive += 1;
    if (actual && !predicted) falseNegative += 1;
  }
  const precision = safeDivide(truePositive, truePositive + falsePositive);
  const recall = safeDivide(truePositive, truePositive + falseNegative);
  return {
    precision,
    recall,
    f1: precision === null || recall === null ? null : safeDivide(2 * precision * recall, precision + recall),
    falsePositiveRate: safeDivide(falsePositive, labels.filter((label) => label !== classId).length),
    falseNegativeRate: safeDivide(falseNegative, labels.filter((label) => label === classId).length),
    support: labels.filter((label) => label === classId).length,
  };
}

export function runStudentDomainEvaluation({ model = StudentDomainRiskModel, fixtures = STUDENT_DOMAIN_FIXTURES } = {}) {
  const safeFixtures = Array.isArray(fixtures) ? fixtures.slice(0, 200) : [];
  const rows = safeFixtures.map((fixture) => {
    const result = model.analyze({ content: fixture.content, inputType: "text" });
    return { id: fixture.id, expected: fixture.expected, predicted: result.classification, modelScore: result.modelScore };
  });
  const labels = rows.map((row) => row.expected);
  const predictions = rows.map((row) => row.predicted);
  const classIds = Array.from(new Set([...labels, ...predictions]));
  const perClass = Object.fromEntries(classIds.map((classId) => [classId, perClassMetrics(labels, predictions, classId)]));
  const macro = (key) => {
    const values = Object.values(perClass).map((item) => item[key]).filter((item) => item !== null);
    return values.length ? Number((values.reduce((sum, item) => sum + item, 0) / values.length).toFixed(4)) : null;
  };
  const highRiskLabels = new Set(["FAKE_SCHOLARSHIP", "TUITION_PAYMENT_SCAM", "FAKE_PART_TIME_JOB", "ADVANCE_FEE_SCAM", "UNIVERSITY_IMPERSONATION", "FACULTY_IMPERSONATION", "ACCOUNT_TAKEOVER", "CREDENTIAL_HARVESTING", "QR_PAYMENT_SCAM"]);
  const highRiskRows = rows.filter((row) => highRiskLabels.has(row.expected));
  const correct = rows.filter((row) => row.expected === row.predicted).length;
  const abstained = rows.filter((row) => row.predicted === "UNKNOWN_STUDENT_RISK").length;
  const confusionMatrix = Object.fromEntries(classIds.map((actual) => [actual, Object.fromEntries(classIds.map((predicted) => [predicted, rows.filter((row) => row.expected === actual && row.predicted === predicted).length]))]));
  return {
    evaluationVersion: STUDENT_DOMAIN_EVALUATION_VERSION,
    modelVersion: model === StudentDomainRiskModel ? undefined : "injected_test_model",
    fixtureCount: rows.length,
    correct,
    accuracy: safeDivide(correct, rows.length),
    perClass,
    macroPrecision: macro("precision"),
    macroRecall: macro("recall"),
    macroF1: macro("f1"),
    microF1: safeDivide(correct, rows.length),
    coverage: safeDivide(rows.length - abstained, rows.length),
    abstentionRate: safeDivide(abstained, rows.length),
    highRiskFalseNegativeRate: safeDivide(highRiskRows.filter((row) => row.expected !== row.predicted).length, highRiskRows.length),
    confusionMatrix,
    calibrationError: null,
    brierScore: null,
    confidenceSemantics: "MODEL_SCORE_ONLY_UNCALIBRATED",
    rows,
    limitations: ["Synthetic/curated fixtures validate implementation behavior, not production prevalence or model generalization.", "No probability calibration metric is reported because the baseline emits MODEL_SCORE, not probability."],
  };
}
