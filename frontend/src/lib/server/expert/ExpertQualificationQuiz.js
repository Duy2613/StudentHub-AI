import { randomInt } from "node:crypto";

export const QUIZ_VERSION = "expert-qualification.v1";
export const QUIZ_DURATION_SECONDS = 30 * 60;
export const QUIZ_QUESTION_COUNT = 6;
export const QUIZ_PASS_SCORE = 0.8;
export const QUIZ_MAX_ATTEMPTS = 3;

const QUESTION_BANK = Object.freeze([
  Object.freeze({
    questionId: "scope-boundary-01",
    domain: "GENERAL_EPISTEMICS",
    prompt: "Một hồ sơ có nhiều bài viết học thuật nhưng không có thẩm quyền ban hành quy chế. Cách trình bày phù hợp nhất là gì?",
    choices: Object.freeze([
      Object.freeze({ id: "a", label: "Hiển thị như nguồn chính thức vì có nhiều công trình." }),
      Object.freeze({ id: "b", label: "Tách năng lực chuyên môn khỏi thẩm quyền và nêu rõ giới hạn." }),
      Object.freeze({ id: "c", label: "Cho phép hồ sơ thay thế nguồn chính thức trong mọi trường hợp." }),
      Object.freeze({ id: "d", label: "Bỏ qua mọi ý kiến vì hồ sơ không có thẩm quyền hành chính." }),
    ]),
    correctOption: "b",
    points: 1,
  }),
  Object.freeze({
    questionId: "evidence-uncertainty-01",
    domain: "GENERAL_EPISTEMICS",
    prompt: "Khi bằng chứng chính chưa đủ để kết luận, chuyên gia nên làm gì?",
    choices: Object.freeze([
      Object.freeze({ id: "a", label: "Nêu kết luận chắc chắn để giúp người đọc quyết định nhanh." }),
      Object.freeze({ id: "b", label: "Chọn kết luận có nhiều lượt bình chọn nhất." }),
      Object.freeze({ id: "c", label: "Nêu phần đã biết, phần chưa biết và yêu cầu bằng chứng tiếp theo." }),
      Object.freeze({ id: "d", label: "Để AI tự quyết định thay cho đánh giá chuyên môn." }),
    ]),
    correctOption: "c",
    points: 1,
  }),
  Object.freeze({
    questionId: "conflict-disclosure-01",
    domain: "PROFESSIONAL_INTEGRITY",
    prompt: "Một chuyên gia có lợi ích tài chính liên quan trực tiếp đến case đang được đánh giá. Hành động bắt buộc là gì?",
    choices: Object.freeze([
      Object.freeze({ id: "a", label: "Công khai xung đột lợi ích và xin rút hoặc chuyển review." }),
      Object.freeze({ id: "b", label: "Không cần công khai nếu kết luận có vẻ hợp lý." }),
      Object.freeze({ id: "c", label: "Xóa case để không tạo dấu vết xung đột." }),
      Object.freeze({ id: "d", label: "Dùng điểm uy tín để tự miễn trừ review." }),
    ]),
    correctOption: "a",
    points: 1,
  }),
  Object.freeze({
    questionId: "source-provenance-01",
    domain: "EVIDENCE_REVIEW",
    prompt: "Ý kiến chuyên gia trong Trust Engine nên được lưu như loại dữ liệu nào?",
    choices: Object.freeze([
      Object.freeze({ id: "a", label: "Thay thế hoàn toàn dữ liệu nguồn và verdict của hệ thống." }),
      Object.freeze({ id: "b", label: "Một lớp ý kiến có provenance, phạm vi và thời điểm riêng." }),
      Object.freeze({ id: "c", label: "Một điểm số vĩnh viễn gắn với người dùng." }),
      Object.freeze({ id: "d", label: "Một sự kiện client có thể tự ghi vào audit log." }),
    ]),
    correctOption: "b",
    points: 1,
  }),
  Object.freeze({
    questionId: "hard-negative-01",
    domain: "SAFETY_BOUNDARIES",
    prompt: "Nếu hệ thống phát hiện một hard negative về an toàn, vai trò của ý kiến chuyên gia là gì?",
    choices: Object.freeze([
      Object.freeze({ id: "a", label: "Có thể ghi đè hard negative nếu chuyên gia có điểm uy tín cao." }),
      Object.freeze({ id: "b", label: "Có thể xóa cảnh báo nếu cộng đồng không đồng ý." }),
      Object.freeze({ id: "c", label: "Không được tự động ghi đè; chỉ được bổ sung diễn giải hoặc yêu cầu review." }),
      Object.freeze({ id: "d", label: "Luôn bỏ qua hard negative để giảm false positive." }),
    ]),
    correctOption: "c",
    points: 1,
  }),
  Object.freeze({
    questionId: "domain-limit-01",
    domain: "DOMAIN_AUTHORITY",
    prompt: "Một chuyên gia được xác thực trong AI/ML nhưng được yêu cầu đánh giá tư vấn pháp lý. Hệ thống nên xử lý thế nào?",
    choices: Object.freeze([
      Object.freeze({ id: "a", label: "Cho phép vì mọi chuyên gia đều có thể đánh giá mọi domain." }),
      Object.freeze({ id: "b", label: "Cho phép nếu người dùng tự xác nhận chuyên gia phù hợp." }),
      Object.freeze({ id: "c", label: "Tự mở rộng domain vì chuyên gia đã vượt qua quiz." }),
      Object.freeze({ id: "d", label: "Từ chối ngoài phạm vi và yêu cầu chuyên gia đúng domain." }),
    ]),
    correctOption: "d",
    points: 1,
  }),
  Object.freeze({
    questionId: "appeal-trace-01",
    domain: "GOVERNANCE",
    prompt: "Khi người dùng phản đối một đánh giá chuyên gia, cách xử lý có thể kiểm toán là gì?",
    choices: Object.freeze([
      Object.freeze({ id: "a", label: "Sửa trực tiếp bản ghi cũ để phản ánh ý kiến mới." }),
      Object.freeze({ id: "b", label: "Tạo appeal/review event mới và giữ nguyên lịch sử nguyên nhân." }),
      Object.freeze({ id: "c", label: "Xóa cả đánh giá và case khỏi giao diện." }),
      Object.freeze({ id: "d", label: "Đổi người đánh giá mà không ghi lý do." }),
    ]),
    correctOption: "b",
    points: 1,
  }),
]);

function boundedQuestionCount(value) {
  const count = Number.isInteger(value) ? value : QUIZ_QUESTION_COUNT;
  return Math.min(QUESTION_BANK.length, Math.max(1, count));
}

function shuffle(values, sourceRandomInt = randomInt) {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = sourceRandomInt(index + 1);
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function publicQuestion(question) {
  return {
    questionId: question.questionId,
    domain: question.domain,
    prompt: question.prompt,
    choices: question.choices.map(({ id, label }) => ({ id, label })),
    points: question.points,
  };
}

export function drawQuizQuestionIds({ count = QUIZ_QUESTION_COUNT, sourceRandomInt = randomInt } = {}) {
  return shuffle(QUESTION_BANK, sourceRandomInt)
    .slice(0, boundedQuestionCount(count))
    .map((question) => question.questionId);
}

export function getPublicQuizQuestions(questionIds = []) {
  const requested = Array.isArray(questionIds) && questionIds.length
    ? new Set(questionIds.map((value) => String(value)))
    : null;
  return QUESTION_BANK
    .filter((question) => !requested || requested.has(question.questionId))
    .map(publicQuestion);
}

export function getQuizQuestion(questionId) {
  return QUESTION_BANK.find((question) => question.questionId === questionId) || null;
}

export function gradeQuiz({ questionIds = [], answers = {} } = {}) {
  const selectedIds = Array.isArray(questionIds) ? questionIds : [];
  const answerLookup = answers instanceof Map ? answers : new Map(Object.entries(answers || {}));
  const questions = selectedIds.map((questionId) => getQuizQuestion(String(questionId))).filter(Boolean);
  const maxScore = questions.reduce((sum, question) => sum + question.points, 0);
  const results = questions.map((question) => {
    const answer = typeof answerLookup.get(question.questionId) === "string"
      ? answerLookup.get(question.questionId).trim().slice(0, 320)
      : null;
    const correct = answer === question.correctOption;
    return {
      questionId: question.questionId,
      answer,
      correct,
      correctOption: question.correctOption,
      points: correct ? question.points : 0,
      maxPoints: question.points,
    };
  });
  const points = results.reduce((sum, result) => sum + result.points, 0);
  const score = maxScore > 0 ? points / maxScore : 0;
  return {
    quizVersion: QUIZ_VERSION,
    points,
    maxScore,
    score,
    passed: score >= QUIZ_PASS_SCORE,
    results,
  };
}

