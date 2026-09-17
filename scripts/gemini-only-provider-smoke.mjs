/**
 * Backward-compatible entrypoint for the old Gemini smoke command.
 *
 * The implementation now runs the one-shot multi-model production probe so
 * that the historical command cannot accidentally issue five duplicate calls
 * against one model.
 */

await import("./gemini-model-router-probe.mjs");

