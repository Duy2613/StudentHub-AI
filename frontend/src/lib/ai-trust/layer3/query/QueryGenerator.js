/**
 * Layer 3 — QueryGenerator
 * 
 * Generates multi-strategy search queries for raw input and extracted claims.
 * Enforces the Anti-Confirmation-Bias rule by producing both supporting and contradiction-oriented queries.
 */

import { L2C_VERIFICATION_TASK_TYPES, verificationTaskCatalog } from "../../v5/l2c/verificationPackage.js";

const MAX_INPUT_CONTEXT_CHARS = 500_000;
const INPUT_QUERY_CHUNK_CHARS = 320;
const MAX_TAVILY_QUERY_CHARS = 380;

function sanitizeQueryPart(value, maxLength = 180) {
  return typeof value === "string"
    ? value.normalize("NFKC").replace(/[\u0000-\u001F\u007F\u200B-\u200D\u2060\uFEFF]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}

function safeDomain(value) {
  const domain = sanitizeQueryPart(value, 180).toLowerCase();
  return /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/.test(domain) && domain.includes(".") ? domain : null;
}

function sanitizeInputContextPart(value) {
  return typeof value === "string"
    ? value.normalize("NFKC").replace(/[\u0000-\u001F\u007F\u200B-\u200D\u2060\uFEFF]/g, " ").replace(/\s+/g, " ").trim()
    : "";
}

function inputContextText(input = {}) {
  const source = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const metadata = source.metadata && typeof source.metadata === "object" && !Array.isArray(source.metadata)
    ? source.metadata
    : {};
  const inputType = sanitizeQueryPart(source.type, 40).toLowerCase();
  const values = [
    inputType === "url" || inputType === "link" ? source.content : "",
    metadata.url,
    source.url,
    source.content && !/^data:/i.test(String(source.content)) ? source.content : "",
    metadata.ocrText,
    metadata.qrContent,
    metadata.qrPayload,
    metadata.qrIntake?.normalizedValue,
  ]
    .filter((value) => typeof value === "string" && value.trim())
    .map(sanitizeInputContextPart)
    .filter(Boolean);
  return Array.from(new Set(values)).join(" ").slice(0, MAX_INPUT_CONTEXT_CHARS);
}

function splitInputContext(text, maxLength = INPUT_QUERY_CHUNK_CHARS) {
  const chunks = [];
  let cursor = 0;
  while (cursor < text.length) {
    let end = Math.min(cursor + maxLength, text.length);
    if (end < text.length) {
      const boundary = text.lastIndexOf(" ", end);
      if (boundary > cursor + 80) end = boundary;
    }
    const chunk = text.slice(cursor, end).trim();
    if (chunk) chunks.push(chunk);
    cursor = end;
    while (cursor < text.length && /\s/.test(text[cursor])) cursor += 1;
  }
  return chunks;
}

function inputUrl(text) {
  const match = typeof text === "string" ? text.match(/https?:\/\/[^\s<>"'`]+/i) : null;
  if (!match) return null;
  const candidate = match[0].replace(/[),.;!?\]}]+$/g, "");
  try {
    const parsed = new URL(candidate);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    return {
      url: parsed.toString(),
      hostname: parsed.hostname.toLowerCase(),
      path: parsed.pathname.replace(/\/+/, " ").trim(),
    };
  } catch {
    return null;
  }
}

export class QueryGenerator {
  /**
   * Generates bounded discovery queries directly from the submitted input.
   * Claims are useful verification structure, but they must not be a gate for
   * free-form research and source discovery.
   */
  static generateInputQueries(input = {}) {
    const text = inputContextText(input);
    if (!text) return [];

    const normalized = text.replace(/["']/g, " ").replace(/\s+/g, " ").trim();
    const url = inputUrl(normalized);
    if (url) {
      const hostContext = sanitizeQueryPart(`${url.hostname} ${sanitizeQueryPart(url.path, 100)}`.trim(), 260);
      return [
        { strategy: "INPUT_URL_EXACT", query: sanitizeQueryPart(url.url, MAX_TAVILY_QUERY_CHARS), purpose: "Tìm nguồn trực tiếp cho URL người dùng gửi", sourceScope: "input_context", origin: "INPUT_CONTEXT" },
        { strategy: "INPUT_URL_CONTEXT", query: sanitizeQueryPart(`${hostContext} news analysis review`, MAX_TAVILY_QUERY_CHARS), purpose: "Tìm ngữ cảnh công khai quanh URL", sourceScope: "input_context", origin: "INPUT_CONTEXT" },
        { strategy: "INPUT_URL_OFFICIAL", query: sanitizeQueryPart(`site:${url.hostname} ${sanitizeQueryPart(url.path, 100)}`, MAX_TAVILY_QUERY_CHARS), purpose: "Tìm thông tin chính thức quanh URL", sourceScope: "input_context", origin: "INPUT_CONTEXT" },
        { strategy: "INPUT_URL_COUNTER_CONTEXT", query: sanitizeQueryPart(`${hostContext} criticism warning discussion`, MAX_TAVILY_QUERY_CHARS), purpose: "Tìm góc nhìn đối chiếu quanh URL", sourceScope: "input_context", origin: "INPUT_CONTEXT", isContradictionSeeking: true },
      ];
    }

    return splitInputContext(normalized).flatMap((queryText, index) => {
      const suffix = index === 0 ? "" : `_${index + 1}`;
      return [
        { strategy: `INPUT_EXACT${suffix}`, query: sanitizeQueryPart(`"${queryText}"`, MAX_TAVILY_QUERY_CHARS), purpose: "Tìm nguồn trực tiếp cho toàn bộ input", sourceScope: "input_context", origin: "INPUT_CONTEXT" },
        { strategy: `INPUT_NEUTRAL_CONTEXT${suffix}`, query: sanitizeQueryPart(`${queryText} news analysis`, MAX_TAVILY_QUERY_CHARS), purpose: "Tìm ngữ cảnh và nguồn báo chí liên quan", sourceScope: "input_context", origin: "INPUT_CONTEXT" },
        { strategy: `INPUT_VIEWPOINTS${suffix}`, query: sanitizeQueryPart(`${queryText} opinions debate comparison`, MAX_TAVILY_QUERY_CHARS), purpose: "Tìm các quan điểm và tranh luận liên quan", sourceScope: "input_context", origin: "INPUT_CONTEXT" },
        { strategy: `INPUT_COUNTER_CONTEXT${suffix}`, query: sanitizeQueryPart(`${queryText} criticism evidence fact check`, MAX_TAVILY_QUERY_CHARS), purpose: "Tìm thông tin phản biện và kiểm chứng", sourceScope: "input_context", origin: "INPUT_CONTEXT", isContradictionSeeking: true },
      ];
    });
  }

  static getInputContextText(input = {}) {
    return inputContextText(input);
  }

  /**
   * Generates search queries for a claim and candidate sources
   * @param {object} claim - Claim DTO from Layer 2
   * @param {Array<object>} candidateSources - Official domains from Layer 2
   * @returns {Array<object>} Array of query strategy objects
   */
  static generateQueries(claim, candidateSources = []) {
    if (!claim || !claim.rawText) return [];

    const queries = [];
    const rawText = sanitizeQueryPart(claim.rawText, 180).replace(/["']/g, " ");
    const subject = sanitizeQueryPart(claim.subject, 120);
    const predicate = sanitizeQueryPart(claim.predicate, 180);
    const primaryDomain = safeDomain(candidateSources[0]?.officialDomains?.[0]);

    // Strategy A: Exact Claim Search
    queries.push({
      strategy: "EXACT_CLAIM",
      query: `"${rawText.slice(0, 100)}"`,
      purpose: "Tìm kiếm trích dẫn nguyên văn",
      targetClaimId: claim.claimId,
    });

    // Strategy B: Entity + Predicate / Keywords
    const entityActionKeywords = `${subject} ${predicate}`.trim();
    queries.push({
      strategy: "ENTITY_ACTION",
      query: entityActionKeywords,
      purpose: "Tìm kiếm nội dung hành động của thực thể",
      targetClaimId: claim.claimId,
    });

    // Strategy C: Entity + Date / Year
    const claimTime = sanitizeQueryPart(claim.time, 40);
    if (claimTime) {
      queries.push({
        strategy: "ENTITY_TEMPORAL",
        query: `${subject} ${predicate} ${claimTime}`.trim(),
        purpose: "Kiểm tra mốc thời gian hiệu lực",
        targetClaimId: claim.claimId,
      });
    }

    // Strategy D: Official Domain Site Search
    if (primaryDomain) {
      queries.push({
        strategy: "OFFICIAL_SITE_FILTER",
        query: `site:${primaryDomain} ${predicate}`,
        purpose: "Truy vấn trực tiếp trên cổng thông tin chính thống",
        targetClaimId: claim.claimId,
        targetDomain: primaryDomain,
      });
    }

    // Strategy E: Anti-Confirmation-Bias Contradiction Search
    // Mandated: Always create at least one contradiction query for high-impact claims!
    queries.push({
      strategy: "CONTRADICTION_SEARCH",
      query: `${subject} ${predicate} đính chính OR cảnh báo lừa đảo OR sai sự thật OR bác bỏ OR dời lịch OR hoãn OR hủy`,
      purpose: "Tìm kiếm thông tin đính chính hoặc cảnh báo giả mạo",
      targetClaimId: claim.claimId,
      isContradictionSeeking: true,
    });

    // Strategy F: Source Claim Official Directive
    queries.push({
      strategy: "SOURCE_CLAIM_ANNOUNCEMENT",
      query: `thông báo chính thức ${subject} ${predicate}`,
      purpose: "Tìm kiếm văn bản thông cáo báo chí chính thức",
      targetClaimId: claim.claimId,
    });

    return queries;
  }

  /**
   * Generates retrieval queries for a fixed L2C verification task. The task
   * type selects the wording; model-provided instructions are never used as
   * query templates.
   */
  static generateTaskQueries(task, claim = null) {
    if (!task || typeof task !== "object" || Array.isArray(task)) return [];
    if (!Object.values(L2C_VERIFICATION_TASK_TYPES).includes(task.type)) return [];
    const catalog = verificationTaskCatalog(task.type);
    if (!catalog) return [];
    const target = sanitizeQueryPart(task.targetClaim || claim?.rawText || "", 180);
    const subject = sanitizeQueryPart(claim?.subject, 100);
    const queryTarget = sanitizeQueryPart(`${subject} ${target}`.trim(), 220);
    const base = `${catalog.purpose} ${queryTarget}`.trim();
    const taskId = sanitizeQueryPart(task.taskId, 160) || "l2c-task";
    const common = {
      targetClaimId: task.claimId || claim?.claimId || null,
      verificationTaskId: taskId,
      purpose: catalog.purpose,
      sourceScope: catalog.sourceScope,
      isCandidateOnly: true,
      origin: "L2C_DOMAIN_AI",
    };
    const queries = [{
      strategy: "L2C_OFFICIAL_TASK",
      query: base,
      ...common,
    }];
    if (queryTarget) {
      queries.push({
        strategy: "L2C_TASK_CONTRADICTION",
        query: `${queryTarget} đính chính OR cảnh báo lừa đảo OR giả mạo OR không chính thức`,
        isContradictionSeeking: true,
        ...common,
      });
    }
    return queries.slice(0, 2);
  }
}
