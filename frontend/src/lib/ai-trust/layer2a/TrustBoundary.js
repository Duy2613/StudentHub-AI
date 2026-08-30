// An in-process capability proves that the result crossed the canonical
// Layer 2A adapter. A caller-supplied DTO can copy fields but cannot copy the
// WeakSet membership after crossing an HTTP boundary.
const trustedLayer2AResults = new WeakSet();

export function markTrustedLayer2AResult(result) {
  if (result && typeof result === "object") trustedLayer2AResults.add(result);
  return result;
}

export function isTrustedLayer2AResult(result) {
  return Boolean(result && typeof result === "object" && trustedLayer2AResults.has(result));
}
