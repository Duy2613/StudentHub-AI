/**
 * Compatibility entrypoint for the retired multi-provider benchmark.
 *
 * It delegates to the canonical five-call Gemini smoke and never attempts
 * OpenAI traffic. The smoke report contains per-fixture latency and status.
 */

console.log("OPENAI_RUNTIME = DISABLED_INTENTIONALLY");
console.log("The legacy multi-provider benchmark is retired; using Gemini-only smoke.");
await import("./gemini-only-provider-smoke.mjs");
