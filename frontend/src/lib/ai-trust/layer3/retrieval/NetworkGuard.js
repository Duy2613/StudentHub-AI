// Capability marker for retrievers whose implementation owns the complete
// network safety boundary (SSRF validation, redirect validation, size limits,
// and response validation). A caller-supplied `networkGuarded` property is not
// sufficient to authorize live evidence.
const networkGuardedRetrievers = new WeakSet();

export function markNetworkGuardedRetriever(retriever) {
  if (retriever && typeof retriever === "object") networkGuardedRetrievers.add(retriever);
  return retriever;
}

export function isNetworkGuardedRetriever(retriever) {
  return Boolean(retriever && typeof retriever === "object" && networkGuardedRetrievers.has(retriever));
}
