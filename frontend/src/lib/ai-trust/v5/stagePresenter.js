/**
 * StudentHub AI — Trust V5 Stage Presenter
 * 
 * Normalizes raw/internal V5 stage outputs into the clean, user-facing
 * 9-element schema mandated by Section A & B of the Trust UX pass:
 * 
 * 1. Stage name (Vietnamese standard names)
 * 2. Result
 * 3. Risk score / calibrated probability (Strict calibration rule)
 * 4. Confidence
 * 5. 2–4 important findings
 * 6. Main conclusion
 * 7. Next stage
 * 8. Why the next stage is required
 * 9. User action if immediately necessary
 * 
 * Technical noise (architectural principles, provider implementation notes,
 * "what this does not prove" essays, raw evidence refs, limitations) are
 * isolated into a separate `technicalDetails` object for the optional drawer.
 */

export const USER_FACING_STAGE_NAMES = Object.freeze({
  l1: "Tín hiệu đầu vào",
  l2a: "Kiểm tra nguồn nguy cơ",
  l2b: "Phân tích nội dung",
  l2c: "Phân loại rủi ro",
  l3: "Bằng chứng",
  l4: "Kết luận",
  l5: "Kiểm định cuối",
});

export const STAGE_ROUTE_DECISIONS = Object.freeze({
  CONTINUE: "CONTINUE",
  COMPLETE: "COMPLETE",
  EXPERT_REVIEW: "EXPERT_REVIEW",
});

function readable(value, fallback = "Chưa có thông tin") {
  if (typeof value === "string" && value.trim()) {
    return value.replaceAll("_", " ");
  }
  return fallback;
}

/**
 * Derives route decision from stage operation status and finding
 */
function deriveRouteDecision(stageId, stage) {
  if (!stage) return STAGE_ROUTE_DECISIONS.CONTINUE;
  if (stageId === "l4" || stageId === "l5") {
    if (stage.finding === "REVIEW_REQUIRED" || stage.finding === "RECHECK_REQUIRED") {
      return STAGE_ROUTE_DECISIONS.EXPERT_REVIEW;
    }
    return STAGE_ROUTE_DECISIONS.COMPLETE;
  }
  if (["BLOCKED", "FAILED"].includes(stage.operationStatus) || stage.finding === "LOCAL_BLOCK") {
    return STAGE_ROUTE_DECISIONS.EXPERT_REVIEW;
  }
  return STAGE_ROUTE_DECISIONS.CONTINUE;
}

/**
 * Derives the rationale for why the next stage is required
 */
function deriveNextReason(nextStageId) {
  if (!nextStageId) {
    return "Tất cả các tầng thẩm định đã hoàn tất; phán quyết cuối cùng đã được xác lập.";
  }
  switch (nextStageId) {
    case "l2a":
      return "Cần đối soát danh tiếng URL và nguồn nguy cơ từ các cơ sở dữ liệu đe dọa mạng.";
    case "l2b":
      return "Cần phân tích ngữ nghĩa, phát hiện áp lực tâm lý, giục giã nộp tiền hoặc mạo danh tổ chức.";
    case "l2c":
      return "Cần phân loại mô thức rủi ro đặc thù đời sống sinh viên (học bổng giả, học phí, lừa đảo việc làm).";
    case "l3":
      return "Cần đối chiếu nguồn chứng thực độc lập, kiểm tra độ tươi mới và mâu thuẫn bằng chứng.";
    case "l4":
      return "Cần áp dụng chính sách tất định tổng hợp toàn bộ tín hiệu để đưa ra kết luận bảo vệ.";
    case "l5":
      return "Cần kiểm định đối nghịch cuối cùng nhằm loại trừ sai lệch, đánh giá quá tự tin hoặc thiếu sót.";
    default:
      return "Chuyển tiếp giai đoạn kế tiếp theo quy trình bảo chứng.";
  }
}

/**
 * Extracts 2 to 4 concise top findings from stage data
 */
function extractTopFindings(stage, stageId) {
  if (!stage) return ["Giai đoạn đang chờ khởi chạy."];

  const findings = [];

  // 1. Direct finding code if available
  if (stage.finding && stage.finding !== "NONE") {
    findings.push(`Nhận diện: ${readable(stage.finding)}`);
  }

  // 2. Extracted signals
  if (Array.isArray(stage.signals) && stage.signals.length > 0) {
    stage.signals.slice(0, 3).forEach((sig) => {
      const text = typeof sig === "string" ? readable(sig) : sig.details || readable(sig.code);
      if (text && !findings.includes(text)) {
        findings.push(text);
      }
    });
  }

  // 3. Stage reasons
  if (Array.isArray(stage.reasons) && stage.reasons.length > 0) {
    stage.reasons.slice(0, 2).forEach((reason) => {
      if (reason && !findings.includes(reason)) {
        findings.push(reason);
      }
    });
  }

  // 4. Verification/threat specific details
  if (stageId === "l2a" && Array.isArray(stage.threatTypes) && stage.threatTypes.length > 0) {
    findings.push(`Loại đe dọa: ${stage.threatTypes.join(", ")}`);
  }

  if (stageId === "l3" && stage.sourceAgreement) {
    findings.push(`Đồng thuận nguồn: ${readable(stage.sourceAgreement)}`);
  }

  // Fallback if empty
  if (findings.length === 0) {
    if (stage.summary) findings.push(stage.summary.slice(0, 140));
    else findings.push("Không phát hiện tín hiệu bất thường trong phạm vi kiểm tra.");
  }

  return findings.slice(0, 4);
}

/**
 * Maps raw risk & confidence values adhering strictly to calibration provenance rule:
 * If NOT calibrated: "Điểm rủi ro 84/100" (NOT "84% xác suất").
 * Only show probability percentages when calibration provenance exists.
 */
function deriveRiskAndCalibration(stage) {
  const isCalibrated = stage?.calibrated === true || stage?.calibrationStatus === "CALIBRATED";
  const rawScore = stage?.riskScore ?? stage?.modelScore ?? stage?.calibratedRisk ?? null;

  let riskScore = null;
  let calibratedProbability = null;

  if (rawScore !== null && Number.isFinite(Number(rawScore))) {
    const num = Number(rawScore);
    const normalized100 = num <= 1 ? Math.round(num * 100) : Math.round(num);

    if (isCalibrated) {
      calibratedProbability = normalized100;
      riskScore = normalized100;
    } else {
      riskScore = normalized100;
      calibratedProbability = null;
    }
  } else {
    // Default fallback based on finding/severity if numerical score not emitted
    const highRiskFindings = ["LOCAL_BLOCK", "THREAT_MATCH", "MALICIOUS", "FAKE_SCHOLARSHIP", "TUITION_PAYMENT_SCAM", "CONTRADICTED"];
    if (highRiskFindings.includes(stage?.finding)) {
      riskScore = 85;
    } else if (stage?.finding === "SUSPICIOUS" || stage?.finding === "SEMANTIC_SUSPICIOUS") {
      riskScore = 55;
    } else if (stage?.operationStatus === "COMPLETED") {
      riskScore = 15;
    }
  }

  // Human readable label following calibration rule
  let riskDisplayLabel = "Chưa xác định";
  if (riskScore !== null) {
    if (isCalibrated && calibratedProbability !== null) {
      riskDisplayLabel = `${calibratedProbability}% xác suất`;
    } else {
      riskDisplayLabel = `Điểm rủi ro ${riskScore}/100`;
    }
  }

  return {
    riskScore,
    calibratedProbability,
    calibrated: Boolean(isCalibrated),
    riskDisplayLabel,
  };
}

/**
 * Derives normalized confidence value & label
 */
function deriveConfidence(stage) {
  const rawConfidence = stage?.confidence ?? stage?.decisionConfidence ?? stage?.providerConfidence ?? null;
  if (rawConfidence === null || !Number.isFinite(Number(rawConfidence))) {
    return {
      confidence: null,
      confidenceLabel: "Chưa công bố",
    };
  }
  const val = Number(rawConfidence) > 1 ? Number(rawConfidence) / 100 : Number(rawConfidence);
  const normalized = Math.max(0, Math.min(1, val));
  const confidenceLabel = normalized >= 0.8 ? "Cao" : normalized >= 0.5 ? "Trung bình" : "Thấp";

  return {
    confidence: Number(normalized.toFixed(2)),
    confidenceLabel,
  };
}

/**
 * Presents an individual stage to the user in the clean 9-point contract
 * while isolating engineering noise in technicalDetails.
 * 
 * @param {string} stageId - 'l1', 'l2a', 'l2b', 'l2c', 'l3', 'l4', 'l5'
 * @param {object} rawStage - Internal V5 stage data from pipeline
 * @param {object} [options]
 * @returns {object} Clean Stage View
 */
export function presentStageForUser(stageId, rawStage) {
  const safeStageId = String(stageId || "l1").toLowerCase();
  const stageName = USER_FACING_STAGE_NAMES[safeStageId] || "Tín hiệu kiểm tra";
  const status = rawStage?.operationStatus || "NOT_STARTED";
  const finding = rawStage?.finding || null;

  const { riskScore, calibratedProbability, calibrated, riskDisplayLabel } = deriveRiskAndCalibration(rawStage);
  const { confidence, confidenceLabel } = deriveConfidence(rawStage);

  // Result label
  let resultLabel = "Chờ kiểm tra";
  if (status === "RUNNING") resultLabel = "Đang phân tích…";
  else if (status === "COMPLETED" || status === "PARTIAL") {
    resultLabel = readable(finding, "Hoàn tất kiểm tra");
  } else if (status === "FAILED" || status === "BLOCKED") {
    resultLabel = readable(finding, "Cần rà soát hoặc bị chặn");
  }

  // Next stage ID and reason
  const nextStageId = rawStage?.nextStage ?? (
    safeStageId === "l1" ? "l2a" :
    safeStageId === "l2a" ? "l2b" :
    safeStageId === "l2b" ? "l2c" :
    safeStageId === "l2c" ? "l3" :
    safeStageId === "l3" ? "l4" :
    safeStageId === "l4" ? "l5" : null
  );

  const nextReason = deriveNextReason(nextStageId);
  const routeDecision = deriveRouteDecision(safeStageId, rawStage);

  // Main conclusion / summary
  const summary = rawStage?.summary || (
    status === "NOT_STARTED" ? "Giai đoạn chưa thực thi." :
    status === "RUNNING" ? "Hệ thống đang đối chiếu dữ liệu." :
    "Không ghi nhận dấu hiệu vi phạm trong phạm vi đánh giá của tầng này."
  );

  // Recommended user action
  const recommendedAction = rawStage?.userAction || (
    riskScore && riskScore >= 70
      ? "Cảnh giác cao độ: Không cung cấp thông tin cá nhân, không chuyển khoản học phí hoặc click liên kết này."
      : "Đọc kỹ các phát hiện chính và đối chiếu thêm trước khi đưa ra quyết định."
  );

  const topFindings = extractTopFindings(rawStage, safeStageId);

  // Keep the epistemic boundary visible to ordinary users. These values are
  // already normalized by createStageEnvelope, so the presenter only applies
  // small fallbacks for compatibility responses that predate the V5 contract.
  const checking = readable(rawStage?.checking, "Phạm vi kiểm tra của stage chưa được công bố.");
  const meaning = readable(rawStage?.meaning, "Đây là kết quả trong phạm vi riêng của stage.");
  const notProve = readable(rawStage?.notProve, "Kết quả này không tự chứng minh nội dung hoặc target an toàn.");
  const limitations = Array.isArray(rawStage?.limitations) && rawStage.limitations.length > 0
    ? rawStage.limitations.filter((item) => typeof item === "string" && item.trim()).slice(0, 8)
    : ["Stage chỉ bao phủ phạm vi kiểm tra đã công bố."];
  const evidenceRefs = Array.isArray(rawStage?.evidenceRefs)
    ? rawStage.evidenceRefs.filter((item) => typeof item === "string" && item.trim()).slice(0, 20)
    : [];
  const signalSummaries = Array.isArray(rawStage?.signals)
    ? rawStage.signals.map((item) => {
      if (typeof item === "string") return readable(item);
      return readable(item?.details || item?.code, "Tín hiệu stage chưa có mô tả.");
    }).filter(Boolean).slice(0, 6)
    : [];

  // Technical details isolated for optional drawer
  const technicalDetails = {
    architecturalPrinciples: rawStage?.role || rawStage?.checking || null,
    providerImplementationNotes: rawStage?.providerStatus ? `Provider: ${rawStage.providerStatus}${rawStage.providerId ? ` (${rawStage.providerId})` : ""}` : null,
    whatThisDoesNotProve: rawStage?.notProve || null,
    rawEvidenceRefs: Array.isArray(rawStage?.evidenceRefs) ? rawStage.evidenceRefs : [],
    technicalLimitations: Array.isArray(rawStage?.limitations) ? rawStage.limitations : [],
    internalStageMechanics: rawStage?.checking || null,
    latencyMs: rawStage?.latencyMs ?? null,
    modelUsed: rawStage?.modelId || rawStage?.modelVersion || null,
    requestId: rawStage?.requestId || null,
  };

  return {
    stageId: safeStageId,
    status,
    headline: stageName,
    resultLabel,
    riskScore,
    calibratedProbability,
    calibrated,
    riskDisplayLabel,
    confidence,
    confidenceLabel,
    topFindings,
    checking,
    finding: readable(finding, "Chưa có finding"),
    meaning,
    notProve,
    limitations,
    evidenceRefs,
    signalSummaries: signalSummaries.length > 0 ? signalSummaries : topFindings,
    summary,
    routeDecision,
    nextStageId,
    nextReason,
    recommendedAction,
    updatedAt: rawStage?.completedAt || rawStage?.startedAt || new Date().toISOString(),
    technicalDetails,
  };
}
