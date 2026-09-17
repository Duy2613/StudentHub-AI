import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const rootDir = resolve(process.cwd());
const frontendDir = join(rootDir, "frontend");
const req = createRequire(join(frontendDir, "package.json"));

try {
  const { loadEnvConfig } = req("@next/env");
  loadEnvConfig(frontendDir);
} catch (e) {
  // ignore
}

const configModule = await import(pathToFileURL(join(frontendDir, "src/lib/ai-gateway/config/AIGatewayConfig.js")).href);
const providerModule = await import(pathToFileURL(join(frontendDir, "src/lib/ai-gateway/providers/GeminiProvider.js")).href);
const extractorModule = await import(pathToFileURL(join(frontendDir, "src/lib/server/academic/TimetableVisionExtractor.js")).href);

const { AI_GATEWAY_CONFIG } = configModule;
const { GeminiProvider } = providerModule;
const { TIMETABLE_VISION_RESPONSE_SCHEMA } = extractorModule;

// Small 1x1 transparent PNG for safe multimodal testing
const ONE_PIXEL_PNG_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY is not set in environment or .env");
  process.exit(1);
}

const provider = new GeminiProvider({
  env: process.env,
  fetchImpl: globalThis.fetch,
});

const modelsToProbe = [
  { id: "gemini-3.8-flash", catalogKey: "GEMINI_3_8_FLASH" },
  { id: "gemini-3.7-flash", catalogKey: "GEMINI_3_7_FLASH" },
  { id: "gemini-3.6-flash", catalogKey: "GEMINI_3_6_FLASH" },
  { id: "gemini-2.5-flash", catalogKey: "GEMINI_2_5_FLASH" },
];

const results = [];

for (const item of modelsToProbe) {
  const catalogEntry = AI_GATEWAY_CONFIG.MODEL_CATALOG[item.catalogKey] || {
    id: item.catalogKey,
    model: item.id,
    active: false,
  };

  const isConfigured = Boolean(catalogEntry && catalogEntry.active);
  const start = performance.now();
  let httpStatus = null;
  let durationMs = 0;
  let structuredOutputValid = false;
  let visionSupported = false;
  let health = "UNHEALTHY";

  try {
    const generated = await provider.generate({
      catalogEntry: {
        ...catalogEntry,
        supportsJsonMode: true,
      },
      systemPrompt: "You are a timetable parser. Return JSON matching schema.",
      userPrompt: "Parse this 1x1 image test.",
      inputParts: [{
        type: "image",
        mime_type: "image/png",
        data: ONE_PIXEL_PNG_BASE64,
      }],
      jsonMode: true,
      responseSchema: TIMETABLE_VISION_RESPONSE_SCHEMA,
      timeoutMs: 12000,
      maxOutputTokens: 1024,
      allowShadowCandidate: true,
    });

    durationMs = Math.round(performance.now() - start);
    httpStatus = generated.httpStatus || 200;

    let parsed = null;
    try {
      parsed = JSON.parse(generated.text || "");
    } catch {
      parsed = null;
    }

    structuredOutputValid = Boolean(parsed && Array.isArray(parsed.entries));
    visionSupported = true;
    health = structuredOutputValid ? "HEALTHY" : "STRUCTURED_PARSE_FAILED";
  } catch (err) {
    durationMs = Math.round(performance.now() - start);
    httpStatus = err.httpStatus || (err.gatewayErrorType === "TIMEOUT" ? 408 : 500);
    const code = err.providerErrorCode || err.gatewayErrorType || "ERROR";

    if (code === "NOT_FOUND" || code === "MODEL_NOT_FOUND" || httpStatus === 404) {
      health = "RETIRED_OR_NOT_FOUND";
      visionSupported = false;
    } else if (code === "RESOURCE_EXHAUSTED" || code === "QUOTA_EXHAUSTED" || httpStatus === 429) {
      health = "QUOTA_EXHAUSTED";
      visionSupported = true;
    } else if (code === "MODEL_INCOMPATIBLE") {
      health = "MODEL_INCOMPATIBLE";
      visionSupported = false;
    } else {
      health = code;
      visionSupported = false;
    }
  }

  results.push({
    MODEL: item.id,
    CONFIGURED: isConfigured ? "YES" : "NO",
    VISION_SUPPORTED: visionSupported ? "YES" : "NO",
    HTTP_STATUS: httpStatus,
    DURATION_MS: durationMs,
    STRUCTURED_OUTPUT_VALID: structuredOutputValid ? "YES" : "NO",
    HEALTH: health,
  });
}

console.log(JSON.stringify(results, null, 2));
