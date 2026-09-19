/**
 * Shared presentation scale for expert reputation.
 *
 * The append-only reputation ledger keeps its historical events, while every
 * public/effective score projection uses this bounded 0–100 scale.
 */

export const MAX_REPUTATION_SCORE = 100;

export function clampReputationScore(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return 0;
  return Math.min(MAX_REPUTATION_SCORE, Math.max(0, numericValue));
}
