export const DECISION_BASIS = Object.freeze({
  DETERMINISTIC_RULE: "DETERMINISTIC_RULE",
  TRUST_EVIDENCE: "TRUST_EVIDENCE",
  COMMUNITY_CONTEXT: "COMMUNITY_CONTEXT",
  EXPERT_ASSESSMENT: "EXPERT_ASSESSMENT",
  MODEL_ESTIMATE: "MODEL_ESTIMATE",
  USER_ASSUMPTION: "USER_ASSUMPTION",
});

export const DECISION_CERTAINTY = Object.freeze({
  CONFIRMED: "CONFIRMED",
  SUPPORTED: "SUPPORTED",
  ESTIMATED: "ESTIMATED",
  UNKNOWN: "UNKNOWN",
});

const VALID_BASIS = new Set(Object.values(DECISION_BASIS));
const VALID_CERTAINTY = new Set(Object.values(DECISION_CERTAINTY));
const VALID_DIRECTION = new Set(["BENEFIT", "COST", "BLOCKER", "NEUTRAL"]);

export class DecisionTwinValidationError extends Error {
  constructor(message, code = "INVALID_DECISION_SCENARIO") {
    super(message);
    this.name = "DecisionTwinValidationError";
    this.code = code;
  }
}

function requiredText(value, field, max = 500) {
  const clean = String(value || "").trim();
  if (!clean) throw new DecisionTwinValidationError(`${field} is required.`);
  if (clean.length > max) throw new DecisionTwinValidationError(`${field} exceeds ${max} characters.`);
  return clean;
}

function boundedNumber(value, field, min = 0, max = 5) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    throw new DecisionTwinValidationError(`${field} must be between ${min} and ${max}.`);
  }
  return number;
}

function normalizeConsequence(consequence, optionId, index) {
  if (!VALID_BASIS.has(consequence?.basis)) throw new DecisionTwinValidationError(`Option ${optionId} consequence ${index + 1} has an invalid basis.`);
  if (!VALID_CERTAINTY.has(consequence?.certainty)) throw new DecisionTwinValidationError(`Option ${optionId} consequence ${index + 1} has an invalid certainty.`);
  if (!VALID_DIRECTION.has(consequence?.direction)) throw new DecisionTwinValidationError(`Option ${optionId} consequence ${index + 1} has an invalid direction.`);
  return {
    id: requiredText(consequence.id || `${optionId}:consequence:${index + 1}`, "consequence.id", 160),
    statement: requiredText(consequence.statement, "consequence.statement", 600),
    basis: consequence.basis,
    certainty: consequence.certainty,
    direction: consequence.direction,
    severity: boundedNumber(consequence.severity ?? 0, "consequence.severity"),
    sourceRef: consequence.sourceRef ? requiredText(consequence.sourceRef, "consequence.sourceRef", 240) : null,
  };
}

function scoreOption(option) {
  const factors = option.factors;
  const blockerCost = option.consequences.filter((item) => item.direction === "BLOCKER").reduce((sum, item) => sum + item.severity * 5, 0);
  const cost = option.consequences.filter((item) => item.direction === "COST").reduce((sum, item) => sum + item.severity * 2, 0);
  const benefit = option.consequences.filter((item) => item.direction === "BENEFIT").reduce((sum, item) => sum + item.severity, 0);
  const unknownPenalty = option.consequences.filter((item) => item.certainty === DECISION_CERTAINTY.UNKNOWN).length * 3;
  const actionCost = (factors.risk * 4) + (factors.deadline * 3) + (factors.dependency * 3) + (factors.uncertainty * 2) + blockerCost + cost - benefit;
  return { actionCost, blockerCost, cost, benefit, unknownPenalty, total: actionCost + unknownPenalty };
}

export function evaluateDecisionScenario(rawScenario) {
  if (!rawScenario || typeof rawScenario !== "object") throw new DecisionTwinValidationError("Scenario is required.");
  if (!Array.isArray(rawScenario.options) || rawScenario.options.length < 2) {
    throw new DecisionTwinValidationError("A decision scenario requires at least two options.", "OPTIONS_REQUIRED");
  }

  const scenario = {
    id: requiredText(rawScenario.id, "scenario.id", 160),
    title: requiredText(rawScenario.title, "scenario.title", 240),
    currentState: requiredText(rawScenario.currentState, "scenario.currentState", 800),
    demo: Boolean(rawScenario.demo),
    unknowns: Array.isArray(rawScenario.unknowns) ? rawScenario.unknowns.map((item) => requiredText(item, "scenario.unknown", 400)) : [],
    options: rawScenario.options.map((option, index) => {
      const id = requiredText(option.id || `option-${index + 1}`, "option.id", 160);
      const consequences = Array.isArray(option.consequences)
        ? option.consequences.map((item, consequenceIndex) => normalizeConsequence(item, id, consequenceIndex))
        : [];
      if (!consequences.length) throw new DecisionTwinValidationError(`Option ${id} requires at least one consequence.`);
      const normalized = {
        id,
        label: requiredText(option.label, "option.label", 160),
        summary: requiredText(option.summary, "option.summary", 500),
        nextAction: requiredText(option.nextAction, "option.nextAction", 400),
        factors: {
          risk: boundedNumber(option.factors?.risk ?? 0, "factors.risk"),
          deadline: boundedNumber(option.factors?.deadline ?? 0, "factors.deadline"),
          dependency: boundedNumber(option.factors?.dependency ?? 0, "factors.dependency"),
          importance: boundedNumber(option.factors?.importance ?? 0, "factors.importance"),
          uncertainty: boundedNumber(option.factors?.uncertainty ?? 0, "factors.uncertainty"),
        },
        consequences,
      };
      return { ...normalized, score: scoreOption(normalized) };
    }),
  };

  const ranking = [...scenario.options].sort((left, right) => left.score.total - right.score.total || right.factors.importance - left.factors.importance);
  const tied = ranking.length > 1 && ranking[0].score.total === ranking[1].score.total && ranking[0].factors.importance === ranking[1].factors.importance;
  const hasCriticalUnknown = scenario.unknowns.length > 0 && ranking[0].factors.uncertainty >= 4;

  return {
    ...scenario,
    evaluationMethod: "DETERMINISTIC_WEIGHTED_FACTORS_V1",
    recommendationState: tied || hasCriticalUnknown ? "REVIEW_REQUIRED" : "RECOMMENDED",
    recommendedOptionId: tied || hasCriticalUnknown ? null : ranking[0].id,
    ranking: ranking.map((option, index) => ({ optionId: option.id, rank: index + 1, totalCost: option.score.total })),
    explanation: tied
      ? "Các lựa chọn đang ngang nhau theo các yếu tố xác định. Cần thêm bằng chứng hoặc lựa chọn của người dùng."
      : hasCriticalUnknown
        ? "Thiếu dữ liệu quan trọng. Hệ thống không tự chọn thay người dùng."
        : `Ưu tiên ${ranking[0].label} vì có tổng chi phí rủi ro, thời hạn, phụ thuộc và bất định thấp nhất.`,
    nextAction: tied || hasCriticalUnknown ? "Xác minh dữ liệu còn thiếu trước khi quyết định." : ranking[0].nextAction,
  };
}
