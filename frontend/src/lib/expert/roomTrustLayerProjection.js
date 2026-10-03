const LAYER_DEFINITIONS = Object.freeze([
  Object.freeze({ id: "L1", name: "Deterministic Screen", description: "Sàng lọc đầu vào và các tín hiệu tất định.", stageIds: ["l1"], resultIds: ["layer1"] }),
  Object.freeze({ id: "L2", name: "Threat & Semantic Intelligence", description: "Phân tích rủi ro, ngữ nghĩa và các mệnh đề cần kiểm chứng.", stageIds: ["l2a", "l2b", "l2c"], resultIds: ["layer2A", "layer2B", "layer2C"] }),
  Object.freeze({ id: "L3", name: "Evidence Retrieval", description: "Truy xuất nguồn, bằng chứng và provenance.", stageIds: ["l3"], resultIds: ["layer3"] }),
  Object.freeze({ id: "L4", name: "Synthesis & Reasoning", description: "Tổng hợp bằng chứng và ghi nhận kết luận cùng bất định.", stageIds: ["l4", "l5"], resultIds: ["layer4"] }),
]);

const STATUS_LABELS = Object.freeze({
  COMPLETE: "HOÀN TẤT", PARTIAL: "MỘT PHẦN", RUNNING: "ĐANG CHẠY", WAITING: "ĐANG CHỜ",
  FAILED: "THẤT BẠI", SKIPPED: "ĐÃ BỎ QUA", NOT_REPORTED: "CHƯA CÓ BÁO CÁO",
});

function asRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function boundedText(value, maxLength = 700) {
  return typeof value === "string" ? value.replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, maxLength) : "";
}

function normalizedStageStatus(stage) {
  const value = boundedText(stage?.operationStatus || stage?.status, 40).toUpperCase();
  if (["COMPLETED", "COMPLETE", "SUCCESS", "DONE"].includes(value)) return "COMPLETE";
  if (["PARTIAL", "DEGRADED"].includes(value)) return "PARTIAL";
  if (["RUNNING", "IN_PROGRESS", "PROCESSING"].includes(value)) return "RUNNING";
  if (["QUEUED", "NOT_STARTED", "WAITING"].includes(value)) return "WAITING";
  if (["FAILED", "ERROR", "BLOCKED"].includes(value)) return "FAILED";
  if (value === "SKIPPED") return "SKIPPED";
  return "NOT_REPORTED";
}

function aggregateStatus(stages) {
  if (!stages.length) return "NOT_REPORTED";
  const statuses = stages.map(normalizedStageStatus);
  if (statuses.includes("RUNNING")) return "RUNNING";
  if (statuses.includes("FAILED")) return statuses.some((status) => ["COMPLETE", "PARTIAL"].includes(status)) ? "PARTIAL" : "FAILED";
  if (statuses.includes("PARTIAL")) return "PARTIAL";
  if (statuses.every((status) => status === "SKIPPED")) return "SKIPPED";
  if (statuses.every((status) => ["COMPLETE", "SKIPPED"].includes(status))) return "COMPLETE";
  if (statuses.some((status) => status === "COMPLETE")) return "PARTIAL";
  if (statuses.includes("WAITING")) return "WAITING";
  return "NOT_REPORTED";
}

function stageSummary(stage, result) {
  return boundedText(stage?.summary || stage?.explanation || stage?.reason || result?.summary || result?.explanation || result?.reason);
}

function stageFinding(stage, result) {
  return boundedText(stage?.finding || stage?.verdict || result?.finding || result?.verdict || result?.status, 120);
}

function subStage(stageId, stage, result) {
  const status = normalizedStageStatus(stage || result);
  return { id: stageId.toUpperCase(), status, statusLabel: STATUS_LABELS[status], finding: stageFinding(stage, result) || null, summary: stageSummary(stage, result) || null };
}

/** Projects only bounded, public Trust stage fields needed by the shared Room UI. */
export function projectRoomTrustLayers(pipelineInput) {
  const pipeline = asRecord(pipelineInput);
  const stages = asRecord(pipeline.stages);
  const results = asRecord(pipeline.layerResults);
  const fourLayerModel = pipeline.pipelineModel === "FOUR_LAYER" || Boolean(stages.l2);

  return LAYER_DEFINITIONS.map((definition) => {
    const stageIds = definition.id === "L2" && fourLayerModel ? ["l2"] : definition.stageIds;
    const resultIds = definition.id === "L2" && fourLayerModel ? ["layer2"] : definition.resultIds;
    const layerStages = stageIds.map((id) => asRecord(stages[id])).filter((stage) => Object.keys(stage).length > 0);
    const layerResults = resultIds.map((id) => asRecord(results[id])).filter((result) => Object.keys(result).length > 0);
    const statusSources = layerStages.length ? layerStages : layerResults;
    const primaryStage = layerStages[0] || {};
    const primaryResult = layerResults[0] || {};
    const subStages = stageIds.map((id, index) => {
      const stage = asRecord(stages[id]);
      const result = asRecord(results[resultIds[index]]);
      return Object.keys(stage).length || Object.keys(result).length ? subStage(id, stage, result) : null;
    }).filter(Boolean);
    const status = aggregateStatus(statusSources);

    return {
      id: definition.id,
      name: definition.name,
      description: definition.description,
      status,
      statusLabel: STATUS_LABELS[status],
      finding: stageFinding(primaryStage, primaryResult) || null,
      summary: stageSummary(primaryStage, primaryResult) || "Pipeline không công bố phần tóm tắt cho lớp này.",
      subStages,
    };
  });
}
