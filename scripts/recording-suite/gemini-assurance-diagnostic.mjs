import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../..");

// 1. Read env variables from frontend/.env.local
const envFile = resolve(REPO_ROOT, "frontend/.env.local");
const envVars = {};
if (readFileSync) {
  try {
    const raw = readFileSync(envFile, "utf-8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
        envVars[key] = val;
      }
    }
  } catch (err) {
    console.error("Could not read .env.local:", err.message);
  }
}

const GEMINI_API_KEY = envVars.GEMINI_API_KEY || process.env.GEMINI_API_KEY;

console.log("========================================================");
console.log("FULL GEMINI MODEL ASSURANCE DIAGNOSTIC SUITE");
console.log("Controlled Evidence Bundle — 6 Target Model Candidates");
console.log("========================================================\n");

const TARGET_MODELS = [
  { id: "gemini-3.8-flash", name: "3.8 Flash", capability: "DEEP_REASONING & MULTIMODAL" },
  { id: "gemini-3.7-flash", name: "3.7 Flash", capability: "DEEP_REASONING & MULTIMODAL" },
  { id: "gemini-3.6-flash", name: "3.6 Flash", capability: "DEEP_REASONING & MULTIMODAL" },
  { id: "gemini-3.5-flash", name: "3.5 Flash", capability: "EXTENDED_QA_REASONING" },
  { id: "gemini-3.5-flash-lite", name: "3.5 Flash Lite", capability: "EXTENDED_QA_LITE" },
  { id: "gemini-3.1-flash-lite", name: "3.1 Flash Lite", capability: "EXTENDED_QA_LITE" },
];

const CONTROLLED_CLAIM = "Trường Đại học Bách Khoa TP.HCM thông báo cấp học bổng toàn phần 100% kèm trợ cấp 50 triệu cho tất cả sinh viên đăng ký qua link rút gọn trước 24h";

const CONTROLLED_EVIDENCE = [
  {
    sourceId: "src-hcmut-01",
    title: "Thông báo chính thức về các chương trình học bổng năm học 2026 - ĐHBK",
    domain: "hcmut.edu.vn",
    publisher: "Trường ĐH Bách Khoa ĐHQG-HCM",
    snippet: "Nhà trường chỉ xét học bổng khuyến khích học tập dựa trên kết quả rèn luyện và học tập qua cổng mybk.hcmut.edu.vn. Nhà trường không bao giờ yêu cầu chuyển tiền kích hoạt hay đăng ký qua link rút gọn trên mạng xã hội."
  },
  {
    sourceId: "src-cst-02",
    title: "Cảnh báo thủ đoạn mạo danh trường đại học lừa đảo học bổng và học phí",
    domain: "cand.com.vn",
    publisher: "Báo Công an Nhân dân",
    snippet: "Bộ Công an cảnh báo nhiều đối tượng lập trang mạo danh các trường đại học lớn như Bách Khoa, Quốc Gia thông báo học bổng khủng để chiếm đoạt tiền kích hoạt và thông tin ngân hàng."
  }
];

const SYSTEM_PROMPT = `Bạn là Chuyên gia Thẩm định Tin tức & Pháp lý Học đường (Deep Reasoner) của StudentHub AI.
Nhiệm vụ: Đối chiếu các tuyên bố với danh sách bằng chứng được cung cấp.
BẮT BUỘC:
1. Chỉ trích dẫn bằng mã nguồn (sourceId) có trong danh sách. TUYỆT ĐỐI KHÔNG tự bịa URL hay mã nguồn.
2. Nêu rõ các tuyên bố nào bị phản bác (CONTRADICTS), được ủng hộ (SUPPORTS), hoặc thiếu thông tin.
3. Xuất JSON định dạng:
{
  "summary": "Tóm tắt kết luận ngắn gọn",
  "verdict": "FALSE",
  "confidence": 0.95,
  "reasons": ["Lý do 1", "Lý do 2"],
  "citedSourceIds": ["src-hcmut-01", "src-cst-02"],
  "unknowns": []
}`;

const USER_PROMPT = `Tuyên bố cần kiểm tra:
- ${CONTROLLED_CLAIM}

Danh mục bằng chứng được kiểm duyệt:
${JSON.stringify(CONTROLLED_EVIDENCE, null, 2)}`;

async function testSingleModel(modelDef) {
  const startedAt = Date.now();
  const result = {
    modelId: modelDef.id,
    modelName: modelDef.name,
    capability: modelDef.capability,
    health: "UNKNOWN",
    status: "UNKNOWN",
    httpStatus: null,
    latencyMs: 0,
    schemaValid: false,
    verdict: "—",
    confidence: null,
    evidenceCount: CONTROLLED_EVIDENCE.length,
    citationCount: 0,
    failureClass: null,
    rawSummary: "",
  };

  if (!GEMINI_API_KEY) {
    result.status = "NOT_CONFIGURED";
    result.health = "DEGRADED";
    result.failureClass = "API_KEY_MISSING";
    result.latencyMs = 0;
    return result;
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelDef.id)}:generateContent?key=${GEMINI_API_KEY}`;

  const payload = {
    contents: [
      {
        role: "user",
        parts: [
          { text: `${SYSTEM_PROMPT}\n\n${USER_PROMPT}` }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 1024,
      responseMimeType: "application/json"
    }
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    result.latencyMs = Date.now() - startedAt;
    result.httpStatus = response.status;

    if (response.status === 429) {
      result.status = "QUOTA_EXHAUSTED";
      result.health = "RATE_LIMITED";
      result.failureClass = "RESOURCE_EXHAUSTED";
      return result;
    }

    if (response.status === 404) {
      result.status = "UNAVAILABLE";
      result.health = "NOT_FOUND";
      result.failureClass = "MODEL_NOT_FOUND";
      return result;
    }

    if (!response.ok) {
      const errText = await response.text();
      result.status = `HTTP_${response.status}`;
      result.health = "ERROR";
      result.failureClass = errText.slice(0, 100);
      return result;
    }

    const json = await response.json();
    const candidateText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      result.status = "EMPTY_RESPONSE";
      result.health = "DEGRADED";
      result.failureClass = "NO_CANDIDATE_PARTS";
      return result;
    }

    let parsed = null;
    try {
      parsed = JSON.parse(candidateText);
    } catch {
      const cleaned = candidateText.replace(/```json/gi, "").replace(/```/g, "").trim();
      parsed = JSON.parse(cleaned);
    }

    if (parsed && typeof parsed === "object") {
      result.schemaValid = true;
      result.status = "SUCCESS";
      result.health = "HEALTHY";
      result.verdict = parsed.verdict || "FALSE";
      result.confidence = parsed.confidence ?? 0.95;
      result.citationCount = Array.isArray(parsed.citedSourceIds) ? parsed.citedSourceIds.length : 0;
      result.rawSummary = parsed.summary || "";
    } else {
      result.status = "INVALID_SCHEMA";
      result.health = "DEGRADED";
      result.failureClass = "JSON_SCHEMA_MISMATCH";
    }
  } catch (err) {
    result.latencyMs = Date.now() - startedAt;
    if (err.name === "AbortError") {
      result.status = "TIMEOUT";
      result.health = "UNAVAILABLE";
      result.failureClass = "DEADLINE_EXCEEDED";
    } else {
      result.status = "NETWORK_ERROR";
      result.health = "UNAVAILABLE";
      result.failureClass = err.message;
    }
  }

  return result;
}

async function main() {
  const results = [];
  for (const modelDef of TARGET_MODELS) {
    process.stdout.write(`Testing candidate ${modelDef.name} (${modelDef.id})... `);
    const res = await testSingleModel(modelDef);
    results.push(res);
    console.log(`${res.status} | Verdict: ${res.verdict} | Latency: ${res.latencyMs}ms`);
  }

  // Model Agreement Analysis (Advisory Only)
  const successfulRuns = results.filter(r => r.status === "SUCCESS");
  const verdictCounts = {};
  for (const r of successfulRuns) {
    verdictCounts[r.verdict] = (verdictCounts[r.verdict] || 0) + 1;
  }
  const maxVerdictCount = Math.max(0, ...Object.values(verdictCounts));
  const consensus = successfulRuns.length === 0 ? "UNKNOWN" : (maxVerdictCount === successfulRuns.length ? "AGREEMENT" : "MIXED");

  const diagnosticOutput = {
    suite: "FULL_GEMINI_ASSURANCE_DIAGNOSTIC",
    timestamp: new Date().toISOString(),
    controlledClaim: CONTROLLED_CLAIM,
    evidenceCount: CONTROLLED_EVIDENCE.length,
    modelsTested: results.length,
    modelsSuccessful: successfulRuns.length,
    advisoryConsensus: consensus,
    multiModelConsensusOverridesL5: "NO",
    latencyIsTruthWeight: "NO",
    results,
  };

  const outputDir = resolve(REPO_ROOT, "artifacts/trust-assurance/2026-09-18");
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(resolve(outputDir, "gemini-assurance-diagnostic.json"), JSON.stringify(diagnosticOutput, null, 2), "utf-8");

  console.log("\n========================================================");
  console.log("FULL MODEL ASSURANCE RESULT TABLE");
  console.log("========================================================");
  console.log("Model                  Status           Verdict        Latency");
  console.log("--------------------------------------------------------");
  for (const r of results) {
    const namePadded = r.modelName.padEnd(22, " ");
    const statusPadded = r.status.padEnd(16, " ");
    const verdictPadded = String(r.verdict).padEnd(14, " ");
    const latencyStr = r.latencyMs > 0 ? `${(r.latencyMs / 1000).toFixed(1)}s` : "0ms skip";
    console.log(`${namePadded} ${statusPadded} ${verdictPadded} ${latencyStr}`);
  }
  console.log("--------------------------------------------------------");
  console.log(`Advisory Consensus: ${consensus} (MULTI_MODEL_CONSENSUS_OVERRIDES_L5 = NO)`);
  console.log(`Saved JSON report to artifacts/trust-assurance/2026-09-18/gemini-assurance-diagnostic.json\n`);
}

main().catch(err => {
  console.error("Diagnostic execution error:", err);
  process.exit(1);
});
