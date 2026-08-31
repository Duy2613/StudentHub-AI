import {
  appendEvidenceEvent,
  createEvidencePassport,
  PASSPORT_EVENT_TYPE,
  PROVENANCE_CLASS,
} from "../intelligence/passport/evidencePassportModel.js";
import {
  DECISION_BASIS,
  DECISION_CERTAINTY,
  evaluateDecisionScenario,
} from "../intelligence/decision/studentDecisionTwinEngine.js";

const DEMO_OWNER = "demo:competition-visitor";

function buildPassport(flow) {
  let passport = createEvidencePassport({
    id: `passport:${flow.id}`,
    ownerId: DEMO_OWNER,
    title: flow.title,
    subjectType: flow.subjectType,
    subjectId: flow.id,
    initialStatus: "INSUFFICIENT_EVIDENCE",
    createdAt: flow.startedAt,
    demo: true,
  });
  for (const event of flow.passportEvents) {
    passport = appendEvidenceEvent(passport, {
      ...event,
      provenanceClass: PROVENANCE_CLASS.DEMO_FIXTURE,
    });
  }
  return passport;
}

function buildFlow(flow) {
  return Object.freeze({
    ...flow,
    demo: true,
    provenance: PROVENANCE_CLASS.DEMO_FIXTURE,
    dataNotice: "Tình huống và nguồn dưới đây là fixture xác định để trình diễn. Không phải dữ liệu trực tiếp hoặc bằng chứng về một tổ chức thật.",
    passport: buildPassport(flow),
    decision: evaluateDecisionScenario({ ...flow.decision, demo: true }),
  });
}

const sharedVerifyConsequence = (id, statement, sourceRef) => ({
  id,
  statement,
  basis: DECISION_BASIS.TRUST_EVIDENCE,
  certainty: DECISION_CERTAINTY.SUPPORTED,
  direction: "BENEFIT",
  severity: 5,
  sourceRef,
});

export const COMPETITION_SUPERFLOWS = Object.freeze([
  buildFlow({
    id: "fake-scholarship",
    navLabel: "Học bổng giả",
    title: "Yêu cầu đặt cọc để nhận học bổng",
    subjectType: "FRAUD_INCIDENT",
    startedAt: "2026-08-29T01:00:00.000Z",
    currentRisk: "HIGH_RISK",
    claim: "Sinh viên phải chuyển khoản và đăng nhập qua một liên kết lạ để giữ suất học bổng.",
    checked: ["Nội dung yêu cầu thanh toán", "Tên miền đăng nhập", "Sự khớp với thông báo chính thức", "Các báo cáo tương tự"],
    officialEvidence: {
      state: "CONTRADICTS",
      title: "Fixture thông báo học bổng chính thức",
      summary: "Quy trình mẫu không yêu cầu đặt cọc hoặc cung cấp OTP.",
      sourceRef: "demo://official/scholarship-policy/v1",
    },
    community: {
      state: "RELATED_REPORTS",
      independentReports: 6,
      summary: "Sáu quan sát fixture có cùng mẫu thúc ép thanh toán và tên miền gần giống.",
      sourceRef: "demo://community/incidents/scholarship-cluster",
    },
    expert: {
      state: "SCOPED_REVIEW_AVAILABLE",
      scope: "An toàn thông tin và chống lừa đảo sinh viên",
      summary: "Fixture đánh giá chuyên gia chỉ ra mẫu chiếm đoạt thông tin đăng nhập. Đây không phải xác minh chuyên gia thật.",
      sourceRef: "demo://experts/cybersecurity/review-1",
    },
    conflicts: ["Không có nguồn fixture độc lập nào ủng hộ yêu cầu chuyển khoản."],
    unknowns: ["Danh tính thật của người gửi chưa được xác minh."],
    nextAction: "Không chuyển tiền. Mở cổng học bổng chính thức bằng địa chỉ tự nhập và liên hệ phòng công tác sinh viên.",
    passportEvents: [
      { id: "scholarship:trust", type: PASSPORT_EVENT_TYPE.TRUST_RESULT, summary: "Trust phát hiện yêu cầu OTP, thanh toán gấp và tên miền không khớp.", occurredAt: "2026-08-29T01:01:00.000Z", newStatus: "SUSPICIOUS", material: true, changeReason: "Tín hiệu lừa đảo có tác động cao xuất hiện.", references: [{ id: "trust-run-scholarship", label: "Trust run fixture", sourceType: "TRUST_ENGINE" }] },
      { id: "scholarship:community", type: PASSPORT_EVENT_TYPE.COMMUNITY_UPDATE, summary: "Cụm báo cáo tương tự được nối vào case.", occurredAt: "2026-08-29T01:02:00.000Z", references: [{ id: "community-scholarship-cluster", label: "6 quan sát fixture", sourceType: "COMMUNITY" }] },
      { id: "scholarship:official", type: PASSPORT_EVENT_TYPE.RESULT_CHANGED, summary: "Nguồn chính thức fixture phủ nhận yêu cầu đặt cọc.", occurredAt: "2026-08-29T01:03:00.000Z", newStatus: "HIGH_RISK", material: true, changeReason: "Yêu cầu thanh toán mâu thuẫn với quy trình chính thức mẫu.", references: [{ id: "official-scholarship-v1", label: "Thông báo chính thức fixture", sourceType: "OFFICIAL" }] },
    ],
    decision: {
      id: "decision:fake-scholarship",
      title: "Chuyển tiền hay xác minh trước",
      currentState: "Yêu cầu thanh toán gấp qua liên kết chưa xác minh.",
      unknowns: ["Danh tính người gửi"],
      options: [
        {
          id: "pay-now", label: "Chuyển tiền ngay", summary: "Làm theo tin nhắn để giữ suất.", nextAction: "Không thực hiện trong trạng thái hiện tại.",
          factors: { risk: 5, deadline: 2, dependency: 1, importance: 5, uncertainty: 4 },
          consequences: [
            { id: "pay-loss", statement: "Có thể mất tiền và thông tin đăng nhập.", basis: DECISION_BASIS.TRUST_EVIDENCE, certainty: DECISION_CERTAINTY.SUPPORTED, direction: "BLOCKER", severity: 5, sourceRef: "demo://trust/scholarship" },
            { id: "pay-unknown", statement: "Người nhận tiền chưa được xác minh.", basis: DECISION_BASIS.COMMUNITY_CONTEXT, certainty: DECISION_CERTAINTY.UNKNOWN, direction: "COST", severity: 4, sourceRef: "demo://community/scholarship" },
          ],
        },
        {
          id: "verify-first", label: "Xác minh trước", summary: "Dùng cổng chính thức và kênh liên hệ độc lập.", nextAction: "Mở cổng chính thức bằng địa chỉ tự nhập và báo cáo tin nhắn.",
          factors: { risk: 1, deadline: 1, dependency: 1, importance: 5, uncertainty: 1 },
          consequences: [sharedVerifyConsequence("verify-safe", "Giảm nguy cơ thanh toán sai và lộ tài khoản.", "demo://official/scholarship-policy/v1")],
        },
      ],
    },
  }),
  buildFlow({
    id: "fake-internship",
    navLabel: "Thực tập giả",
    title: "Nhà tuyển dụng yêu cầu phí thiết bị",
    subjectType: "FRAUD_INCIDENT",
    startedAt: "2026-08-29T02:00:00.000Z",
    currentRisk: "SUSPICIOUS",
    claim: "Ứng viên phải trả phí giữ chỗ và gửi ảnh giấy tờ qua một biểu mẫu không thuộc tên miền công ty.",
    checked: ["Tên miền nhà tuyển dụng", "Yêu cầu phí", "Kênh nhận hồ sơ", "Trải nghiệm sinh viên"],
    officialEvidence: { state: "MISMATCH", title: "Fixture trang tuyển dụng chính thức", summary: "Trang mẫu chỉ nhận hồ sơ qua cổng nghề nghiệp và không thu phí ứng viên.", sourceRef: "demo://official/careers/hiring-policy" },
    community: { state: "MIXED_WITH_PATTERN", independentReports: 4, summary: "Bốn quan sát fixture mô tả cùng kịch bản phỏng vấn nhanh rồi yêu cầu mua thiết bị.", sourceRef: "demo://community/incidents/recruiter-cluster" },
    expert: { state: "REQUEST_AVAILABLE", scope: "Dịch vụ nghề nghiệp và an toàn tuyển dụng", summary: "Chưa có đánh giá chuyên gia thật. Demo chỉ mô tả phạm vi cần chuyển tiếp.", sourceRef: "demo://experts/career-services/request" },
    conflicts: ["Tên hiển thị của người gửi giống thương hiệu, nhưng tên miền không khớp."],
    unknowns: ["Chưa có phản hồi trực tiếp từ doanh nghiệp trong fixture."],
    nextAction: "Dừng gửi giấy tờ. Tra cứu vị trí trên cổng nghề nghiệp chính thức và gọi số liên hệ công khai của doanh nghiệp.",
    passportEvents: [
      { id: "internship:trust", type: PASSPORT_EVENT_TYPE.TRUST_RESULT, summary: "Trust phát hiện phí ứng viên và tên miền biểu mẫu không khớp.", occurredAt: "2026-08-29T02:01:00.000Z", newStatus: "SUSPICIOUS", material: true, changeReason: "Mẫu tuyển dụng có các tín hiệu rủi ro quan trọng.", references: [{ id: "trust-run-internship", label: "Trust run fixture", sourceType: "TRUST_ENGINE" }] },
      { id: "internship:community", type: PASSPORT_EVENT_TYPE.COMMUNITY_UPDATE, summary: "Bốn báo cáo fixture được gom thành một incident.", occurredAt: "2026-08-29T02:02:00.000Z", references: [{ id: "community-internship-cluster", label: "4 quan sát fixture", sourceType: "COMMUNITY" }] },
      { id: "internship:official", type: PASSPORT_EVENT_TYPE.OFFICIAL_UPDATE, summary: "Chính sách tuyển dụng fixture không thu phí ứng viên.", occurredAt: "2026-08-29T02:03:00.000Z", newStatus: "HIGH_RISK", material: true, changeReason: "Yêu cầu phí mâu thuẫn với quy trình tuyển dụng mẫu.", references: [{ id: "official-careers-policy", label: "Chính sách tuyển dụng fixture", sourceType: "OFFICIAL" }] },
    ],
    decision: {
      id: "decision:fake-internship", title: "Gửi giấy tờ hay xác minh nhà tuyển dụng", currentState: "Biểu mẫu và yêu cầu phí không thuộc kênh tuyển dụng fixture.", unknowns: ["Phản hồi trực tiếp từ doanh nghiệp"],
      options: [
        { id: "send-documents", label: "Tiếp tục gửi hồ sơ", summary: "Gửi giấy tờ và thanh toán phí thiết bị.", nextAction: "Không thực hiện khi danh tính chưa được xác minh.", factors: { risk: 5, deadline: 2, dependency: 2, importance: 5, uncertainty: 4 }, consequences: [{ id: "identity-loss", statement: "Có nguy cơ lộ giấy tờ và mất phí.", basis: DECISION_BASIS.TRUST_EVIDENCE, certainty: DECISION_CERTAINTY.SUPPORTED, direction: "BLOCKER", severity: 5, sourceRef: "demo://trust/internship" }] },
        { id: "verify-recruiter", label: "Xác minh nhà tuyển dụng", summary: "Đối chiếu cổng nghề nghiệp và liên hệ công khai.", nextAction: "Tra cứu tin tuyển dụng trên tên miền chính thức trước khi gửi dữ liệu.", factors: { risk: 1, deadline: 1, dependency: 1, importance: 5, uncertainty: 2 }, consequences: [sharedVerifyConsequence("career-verify", "Giữ an toàn cho giấy tờ và xác nhận cơ hội có thật.", "demo://official/careers/hiring-policy")] },
      ],
    },
  }),
  buildFlow({
    id: "academic-conflict",
    navLabel: "Xung đột học vụ",
    title: "Tin đồn thay đổi điều kiện tiên quyết",
    subjectType: "ACADEMIC_RULE",
    startedAt: "2026-08-29T03:00:00.000Z",
    currentRisk: "DISPUTED",
    claim: "Một bài đăng cộng đồng nói rằng sinh viên K25 không còn cần học phần tiên quyết trước khi đăng ký môn dự án.",
    checked: ["Văn bản quy định", "Phiên bản chương trình", "Cohort K25", "Quan sát đăng ký thực tế"],
    officialEvidence: { state: "SUPPORTS_RULE", title: "Fixture quy chế chương trình K25", summary: "Điều kiện tiên quyết vẫn áp dụng trong phiên bản fixture có hiệu lực.", sourceRef: "demo://official/academic/k25/rule-4.2" },
    community: { state: "REALITY_GAP", independentReports: 8, summary: "Tám quan sát fixture cho biết cổng đăng ký từng cho phép bỏ qua điều kiện trong một khoảng thời gian.", sourceRef: "demo://community/academic/prerequisite-gap" },
    expert: { state: "CLARIFICATION_REQUIRED", scope: "Quản lý đào tạo chương trình K25", summary: "Cần cán bộ đúng phạm vi xác nhận liệu đây là lỗi vận hành hay ngoại lệ chính thức.", sourceRef: "demo://experts/academic-affairs/request" },
    conflicts: ["Quy định fixture vẫn yêu cầu tiên quyết, trong khi quan sát fixture cho thấy cổng từng cho đăng ký."],
    unknowns: ["Chưa có văn bản ngoại lệ theo từng sinh viên.", "Trạng thái đồng bộ mới nhất của cổng đăng ký chưa có trong fixture."],
    nextAction: "Không dựa vào tin đồn. Kiểm tra hồ sơ cá nhân, trích dẫn điều 4.2 và gửi yêu cầu xác nhận nếu cổng hiển thị khác.",
    passportEvents: [
      { id: "academic:community", type: PASSPORT_EVENT_TYPE.COMMUNITY_UPDATE, summary: "Reality Gap được tạo từ tám quan sát fixture.", occurredAt: "2026-08-29T03:01:00.000Z", references: [{ id: "community-prerequisite-gap", label: "8 quan sát fixture", sourceType: "COMMUNITY" }] },
      { id: "academic:rule", type: PASSPORT_EVENT_TYPE.RESULT_CHANGED, summary: "Rule engine fixture giữ điều kiện tiên quyết cho K25.", occurredAt: "2026-08-29T03:02:00.000Z", newStatus: "DISPUTED", material: true, changeReason: "Quy định và hành vi vận hành đang mâu thuẫn.", references: [{ id: "academic-rule-k25-4.2", label: "Quy tắc xác định fixture", sourceType: "DETERMINISTIC_RULE" }] },
      { id: "academic:expert", type: PASSPORT_EVENT_TYPE.EXPERT_REVIEW, summary: "Case được chuyển tới phạm vi quản lý đào tạo để làm rõ ngoại lệ.", occurredAt: "2026-08-29T03:03:00.000Z", references: [{ id: "expert-request-academic", label: "Yêu cầu làm rõ fixture", sourceType: "EXPERT" }] },
    ],
    decision: {
      id: "decision:academic-conflict", title: "Đăng ký ngay hay xác minh điều kiện", currentState: "Quy định fixture và quan sát vận hành đang xung đột.", unknowns: ["Ngoại lệ cá nhân", "Trạng thái đồng bộ cổng đăng ký"],
      options: [
        { id: "assume-rumor", label: "Tin vào bài đăng", summary: "Đăng ký môn dự án mà không kiểm tra tiên quyết.", nextAction: "Không áp dụng khi chưa có ngoại lệ chính thức.", factors: { risk: 4, deadline: 3, dependency: 5, importance: 5, uncertainty: 5 }, consequences: [{ id: "registration-rejected", statement: "Kế hoạch có thể bị hủy vì vi phạm điều kiện tiên quyết.", basis: DECISION_BASIS.DETERMINISTIC_RULE, certainty: DECISION_CERTAINTY.CONFIRMED, direction: "BLOCKER", severity: 5, sourceRef: "demo://official/academic/k25/rule-4.2" }] },
        { id: "verify-rule", label: "Xác minh theo hồ sơ", summary: "Đối chiếu cohort, hồ sơ và quy định có hiệu lực.", nextAction: "Mở điều 4.2, kiểm tra hồ sơ cá nhân và gửi yêu cầu làm rõ nếu cổng hiển thị khác.", factors: { risk: 1, deadline: 2, dependency: 2, importance: 5, uncertainty: 2 }, consequences: [{ id: "academic-grounding", statement: "Quyết định đăng ký dựa trên quy tắc có phiên bản và đúng cohort.", basis: DECISION_BASIS.DETERMINISTIC_RULE, certainty: DECISION_CERTAINTY.CONFIRMED, direction: "BENEFIT", severity: 5, sourceRef: "demo://official/academic/k25/rule-4.2" }] },
      ],
    },
  }),
]);

export function listCompetitionSuperflows() {
  return COMPETITION_SUPERFLOWS.map((flow) => structuredClone(flow));
}

export function getCompetitionSuperflow(id) {
  const flow = COMPETITION_SUPERFLOWS.find((item) => item.id === id);
  return flow ? structuredClone(flow) : null;
}
