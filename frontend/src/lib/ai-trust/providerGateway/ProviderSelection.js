/**
 * Server-side strangler-migration selection.
 *
 * `auto` preserves compatibility: a supplied native capability is preferred,
 * then an enabled legacy adapter is used. Explicit `legacy`, `native`, and
 * `shadow` modes make cutover and rollback reviewable without changing the
 * canonical Trust policy.
 */

import { PROVIDER_CAPABILITY } from "./types.js";

export const PROVIDER_SELECTION_MODE = Object.freeze({
  AUTO: "auto",
  LEGACY: "legacy",
  NATIVE: "native",
  SHADOW: "shadow",
});

export const PROVIDER_SELECTION_ENV = Object.freeze({
  [PROVIDER_CAPABILITY.URL_THREAT]: "L2_PROVIDER",
  [PROVIDER_CAPABILITY.WEB_EVIDENCE]: "L3_PROVIDER",
  [PROVIDER_CAPABILITY.INDEPENDENT_RESEARCH]: "L4_PROVIDER",
  [PROVIDER_CAPABILITY.EVIDENCE_ANALYSIS]: "EVIDENCE_ANALYSIS_PROVIDER",
  [PROVIDER_CAPABILITY.FINAL_SYNTHESIS]: "FINAL_SYNTHESIS_PROVIDER",
});

const ALLOWED_MODES = new Set(Object.values(PROVIDER_SELECTION_MODE));

function safeMode(value) {
  const mode = typeof value === "string" ? value.trim().toLowerCase() : "";
  return ALLOWED_MODES.has(mode) ? mode : PROVIDER_SELECTION_MODE.AUTO;
}

export function normalizeProviderSelection(selection = {}) {
  const input = selection && typeof selection === "object" && !Array.isArray(selection) ? selection : {};
  return Object.freeze(Object.fromEntries(Object.values(PROVIDER_CAPABILITY).map((capability) => [
    capability,
    safeMode(input[capability] || input[PROVIDER_SELECTION_ENV[capability]]),
  ])));
}

export function readProviderSelection(env = process.env, overrides = {}) {
  const source = env && typeof env === "object" ? env : {};
  const values = {};
  for (const capability of Object.values(PROVIDER_CAPABILITY)) {
    const key = PROVIDER_SELECTION_ENV[capability];
    values[capability] = overrides[capability] ?? overrides[key] ?? source[key] ?? PROVIDER_SELECTION_MODE.AUTO;
  }
  return normalizeProviderSelection(values);
}

