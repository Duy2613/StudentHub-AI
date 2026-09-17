import { createRequire } from "node:module";
import { join, resolve } from "node:path";

const req = createRequire(join(resolve(process.cwd(), "frontend"), "package.json"));
const { loadEnvConfig } = req("@next/env");
loadEnvConfig(resolve(process.cwd(), "frontend"));

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.log("NO_KEY");
  process.exit(1);
}

const models = ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.6-flash"];

for (const model of models) {
  const start = Date.now();
  try {
    const url = "https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model) + ":generateContent?key=" + encodeURIComponent(apiKey);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: "ping" }] }] }),
    });
    const duration = Date.now() - start;
    const retryAfter = res.headers.get("retry-after");
    const data = await res.json();
    
    // Sanitize any key occurrences
    const errObj = data?.error ? {
      code: data.error.code,
      status: data.error.status,
      message: (data.error.message || "").replace(apiKey, "[REDACTED]"),
      details: (data.error.details || []).map(d => {
        const copy = { ...d };
        if (copy.metadata) {
          copy.metadata = JSON.parse(JSON.stringify(copy.metadata).replace(new RegExp(apiKey, "g"), "[REDACTED]"));
        }
        return copy;
      }),
    } : null;

    console.log("MODEL:", model);
    console.log("HTTP_STATUS:", res.status);
    console.log("DURATION_MS:", duration);
    console.log("RETRY_AFTER:", retryAfter);
    console.log("ERROR_STATUS:", errObj?.status);
    console.log("ERROR_MESSAGE:", errObj?.message?.slice(0, 200));
    console.log("DETAILS:", JSON.stringify(errObj?.details || []));
    console.log("---");
  } catch (err) {
    console.log("MODEL:", model, "FETCH_ERROR:", err.message);
  }
}
