/**
 * Compatibility entrypoint for the retired provider smoke command.
 *
 * The production release is Gemini-only. Keeping this filename avoids
 * breaking operator runbooks while guaranteeing that the old command cannot
 * attempt an OpenAI request.
 */

console.log("OPENAI_RUNTIME = DISABLED_INTENTIONALLY");
console.log("Running the canonical Gemini-only smoke instead.");
await import("./gemini-only-provider-smoke.mjs");
