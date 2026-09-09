/**
 * StudentHub AI — Safe Provider Discovery & Health Smoke
 *
 * Probes OpenAI, Gemini, and Local Custom Model.
 * NEVER prints or stores secret keys.
 * Reports accessibility, accessible model IDs, latency, structured output, and health.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";

const rootDir = process.cwd();
const frontendDir = resolve(rootDir, "frontend");
const envLocalPath = join(frontendDir, ".env.local");

// Load .env.local
try {
  const nextEnvPath = join(frontendDir, "node_modules", "@next", "env");
  if (existsSync(nextEnvPath)) {
    const { loadEnvConfig } = await import(pathToFileURL(join(nextEnvPath, "index.js")).href);
    loadEnvConfig(frontendDir);
  }
} catch {}

if (!process.env.OPENAI_API_KEY && existsSync(envLocalPath)) {
  const content = readFileSync(envLocalPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq > 0) {
      const k = trimmed.slice(0, eq).trim();
      const v = trimmed.slice(eq + 1).trim();
      if (!process.env[k]) process.env[k] = v;
    }
  }
}

async function smokeCustomModel() {
  console.log("\n--- [CUSTOM MODEL: StudentHub Multi-Head Neural Trust Engine] ---");
  try {
    const modelModulePath = pathToFileURL(join(frontendDir, "src", "lib", "ai-trust", "models", "StudentHubMultiLabelNeuralModel.js")).href;
    const { StudentHubMultiLabelNeuralModel } = await import(modelModulePath);

    const start = performance.now();
    const result = StudentHubMultiLabelNeuralModel.predict("Đóng cọc nhận học bổng 50 triệu chuyển khoản ngay");
    const latency = (performance.now() - start).toFixed(2);

    console.log("  Status:          CALLABLE (LOCAL)");
    console.log(`  Latency:         ${latency} ms`);
    console.log(`  Verdict:         ${result.verdict}`);
    console.log(`  Confidence:      ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`  Scam Types:      ${result.scam_types?.join(", ") || "none"}`);
    console.log(`  Attack Stage:    ${result.attack_stage}`);
    console.log("  Role:            DOMAIN_SPECIALIST (Advisory/Fast pre-filter)");
    return { status: "VERIFIED", latency, details: result };
  } catch (err) {
    console.log(`  Status:          FAILED (${err.message})`);
    return { status: "FAILED", error: err.message };
  }
}

async function smokeOpenAI() {
  console.log("\n--- [OPENAI PROVIDER] ---");
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.log("  Status: NOT_CONFIGURED (OPENAI_API_KEY missing)");
    return { status: "NOT_CONFIGURED" };
  }

  const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");
  console.log(`  Base URL:        ${baseUrl}`);
  console.log(`  Key Length:      ${apiKey.length} chars (Masked)`);
  const configuredModel = process.env.OPENAI_MODEL || "gpt-4o-mini";
  console.log(`  Configured Model:${configuredModel}`);

  // Step 1: List models if supported
  let accessibleModels = [];
  try {
    const listRes = await fetch(`${baseUrl}/models`, {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(5000),
    });
    if (listRes.ok) {
      const data = await listRes.json();
      if (Array.isArray(data?.data)) {
        accessibleModels = data.data.map(m => m.id);
        console.log(`  Models Discovered: ${accessibleModels.length} models accessible`);
        const sample = accessibleModels.filter(m => m.includes("gpt") || m.includes("luna") || m.includes("mini")).slice(0, 8);
        console.log(`  Sample Models:   ${sample.join(", ")}`);
      }
    } else {
      console.log(`  /models check returned HTTP ${listRes.status}`);
    }
  } catch (e) {
    console.log(`  /models check error: ${e.message}`);
  }

  // Step 2: Minimal non-sensitive chat completion
  const candidateModels = [configuredModel, "gpt-4o-mini", "gpt-3.5-turbo", "gpt-4o"].filter(Boolean);
  let smokeSuccess = false;
  let activeModel = null;
  let latencyMs = 0;

  for (const model of candidateModels) {
    try {
      const start = performance.now();
      const chatRes = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: "ping" }],
          max_completion_tokens: 5,
        }),
        signal: AbortSignal.timeout(8000),
      });

      if (chatRes.ok) {
        const json = await chatRes.json();
        latencyMs = Math.round(performance.now() - start);
        const text = json?.choices?.[0]?.message?.content?.trim();
        console.log(`  Smoke Test:      SUCCESS with model '${model}'`);
        console.log(`  Latency:         ${latencyMs} ms`);
        console.log(`  Sample Response: "${text?.slice(0, 30)}"`);
        smokeSuccess = true;
        activeModel = model;
        break;
      } else {
        const errText = await chatRes.text().catch(() => "");
        console.log(`  Model '${model}' failed: HTTP ${chatRes.status} (${errText.slice(0, 100)})`);
      }
    } catch (e) {
      console.log(`  Model '${model}' request failed: ${e.message}`);
    }
  }

  return {
    status: smokeSuccess ? "VERIFIED" : "FAILED",
    activeModel,
    latencyMs,
    accessibleModelsCount: accessibleModels.length,
  };
}

async function smokeGemini() {
  console.log("\n--- [GEMINI PROVIDER] ---");
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    console.log("  Status: NOT_CONFIGURED (GEMINI_API_KEY missing)");
    return { status: "NOT_CONFIGURED" };
  }

  console.log(`  Key Length:      ${apiKey.length} chars (Masked)`);
  const configuredModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  console.log(`  Configured Model:${configuredModel}`);

  // Step 1: List models
  let accessibleModels = [];
  try {
    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
      method: "GET",
      signal: AbortSignal.timeout(6000),
    });
    if (listRes.ok) {
      const data = await listRes.json();
      if (Array.isArray(data?.models)) {
        accessibleModels = data.models.map(m => m.name.replace("models/", ""));
        console.log(`  Models Discovered: ${accessibleModels.length} models accessible`);
        const flashModels = accessibleModels.filter(m => m.includes("flash") || m.includes("gemini-2") || m.includes("gemini-3") || m.includes("1.5")).slice(0, 8);
        console.log(`  Key Candidates:  ${flashModels.join(", ")}`);
      }
    } else {
      console.log(`  /models check returned HTTP ${listRes.status}`);
    }
  } catch (e) {
    console.log(`  /models check error: ${e.message}`);
  }

  // Step 2: Minimal non-sensitive completion
  const candidateModels = [
    configuredModel,
    ...accessibleModels.filter(m => m.includes("flash") || m.includes("lite")),
    "gemini-flash-latest",
    "gemini-2.5-flash-lite",
  ].filter((v, i, a) => v && a.indexOf(v) === i);

  let smokeSuccess = false;
  let activeModel = null;
  let latencyMs = 0;

  for (const model of candidateModels) {
    try {
      const start = performance.now();
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: "ping" }] }],
          generationConfig: { maxOutputTokens: 5, temperature: 0.1 },
        }),
        signal: AbortSignal.timeout(8000),
      });

      if (res.ok) {
        const json = await res.json();
        latencyMs = Math.round(performance.now() - start);
        const text = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        console.log(`  Smoke Test:      SUCCESS with model '${model}'`);
        console.log(`  Latency:         ${latencyMs} ms`);
        console.log(`  Sample Response: "${text?.slice(0, 30)}"`);
        smokeSuccess = true;
        activeModel = model;
        break;
      } else {
        const errText = await res.text().catch(() => "");
        console.log(`  Model '${model}' failed: HTTP ${res.status} (${errText.slice(0, 100)})`);
      }
    } catch (e) {
      console.log(`  Model '${model}' request failed: ${e.message}`);
    }
  }

  return {
    status: smokeSuccess ? "VERIFIED" : "FAILED",
    activeModel,
    latencyMs,
    accessibleModelsCount: accessibleModels.length,
  };
}

async function main() {
  console.log("============================================================");
  console.log("🚀 STUDENTHUB AI PROVIDER DISCOVERY & HEALTH SMOKE");
  console.log("============================================================");

  const custom = await smokeCustomModel();
  const openai = await smokeOpenAI();
  const gemini = await smokeGemini();

  console.log("\n============================================================");
  console.log("📊 PROVIDER SUMMARY MATRIX");
  console.log("============================================================");
  console.log(`  CUSTOM MODEL:  ${custom.status} (${custom.latency || 0}ms) -> DOMAIN_SPECIALIST`);
  console.log(`  OPENAI:        ${openai.status} (${openai.activeModel || "none"}, ${openai.latencyMs || 0}ms)`);
  console.log(`  GEMINI:        ${gemini.status} (${gemini.activeModel || "none"}, ${gemini.latencyMs || 0}ms)`);
  console.log("============================================================\n");
}

main().catch(err => {
  console.error("Provider smoke failed fatal:", err);
  process.exit(1);
});
