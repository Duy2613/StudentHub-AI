// An in-process capability proves that the result crossed the canonical
// Layer 3 evidence service. Caller-asserted `liveEvidence` fields are not
// sufficient to authorize a final policy outcome.
const trustedLayer3Results = new WeakSet();

export function markTrustedLayer3Result(result) {
  if (result && typeof result === "object") trustedLayer3Results.add(result);
  return result;
}

export function isTrustedLayer3Result(result) {
  return Boolean(result && typeof result === "object" && trustedLayer3Results.has(result));
}
