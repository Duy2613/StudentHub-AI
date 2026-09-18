import { createRequire } from "node:module";
import { join, resolve } from "node:path";

const rootDir = resolve(process.cwd());
const frontendDir = join(rootDir, "frontend");
const req = createRequire(join(frontendDir, "package.json"));
const { loadEnvConfig } = req("@next/env");
loadEnvConfig(frontendDir);

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY is not set.");
  process.exit(1);
}

// Minimal 1x1 transparent PNG base64
const ONE_PIXEL_PNG_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const models = [
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
];

const results = [];

for (const model of models) {
  const start = Date.now();
  let httpStatus = null;
  let available = "NO";
  let textSupported = "NO";
  let imageInputSupported = "NO";
  let structuredOutputSupported = "NO";
  let rateLimitState = "NONE";
  let quotaClass = null;

  try {
    // 1. Text & Structured Output probe
    const url = "https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model) + ":generateContent?key=" + encodeURIComponent(apiKey);
    const textRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Trả về JSON: {\"ping\": \"pong\"}" }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              ping: { type: "STRING" }
            },
            required: ["ping"]
          }
        }
      }),
    });

    httpStatus = textRes.status;
    const textData = await textRes.json();

    if (textRes.ok) {
      available = "YES";
      textSupported = "YES";
      try {
        const textOutput = textData.candidates?.[0]?.content?.parts?.[0]?.text;
        const parsed = JSON.parse(textOutput || "{}");
        if (parsed.ping) {
          structuredOutputSupported = "YES";
        }
      } catch {
        structuredOutputSupported = "PARSE_FAILED";
      }

      // 2. Multimodal image input probe
      const mmRes = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: "Describe image dimensions or colors in json" },
              { inlineData: { mimeType: "image/png", data: ONE_PIXEL_PNG_BASE64 } }
            ]
          }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        }),
      });

      if (mmRes.ok) {
        imageInputSupported = "YES";
      } else {
        imageInputSupported = `HTTP_${mmRes.status}`;
      }
    } else {
      if (httpStatus === 429) {
        rateLimitState = "429_RATE_LIMITED";
        const msg = JSON.stringify(textData).toLowerCase();
        quotaClass = /daily|per day|rpd/.test(msg) ? "DAILY_RPD" : "CONCURRENT_RPM";
      } else if (httpStatus === 503) {
        rateLimitState = "503_HIGH_DEMAND_SPIKE";
      } else if (httpStatus === 404) {
        rateLimitState = "404_MODEL_NOT_FOUND";
      } else {
        rateLimitState = `HTTP_${httpStatus}`;
      }
    }
  } catch (err) {
    httpStatus = httpStatus || 500;
    rateLimitState = err.name === "AbortError" ? "TIMEOUT" : "NETWORK_ERROR";
  }

  const durationMs = Date.now() - start;

  results.push({
    MODEL: model,
    HTTP_STATUS: httpStatus,
    AVAILABLE: available,
    TEXT_SUPPORTED: textSupported,
    IMAGE_INPUT_SUPPORTED: imageInputSupported,
    STRUCTURED_OUTPUT_SUPPORTED: structuredOutputSupported,
    DURATION_MS: durationMs,
    RATE_LIMIT_STATE: rateLimitState,
    QUOTA_CLASS: quotaClass,
  });
}

console.log(JSON.stringify(results, null, 2));
