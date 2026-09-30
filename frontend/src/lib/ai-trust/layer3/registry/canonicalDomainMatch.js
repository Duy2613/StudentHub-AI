function normalizeHost(value) {
  if (typeof value !== "string") return "";
  const candidate = value.trim();
  if (!candidate) return "";

  let hostname = candidate;
  try {
    hostname = candidate.includes("://") ? new URL(candidate).hostname : candidate.split(/[/?#]/, 1)[0].replace(/:\d+$/, "");
  } catch {
    return "";
  }

  hostname = hostname.toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
  const label = "[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?";
  return hostname.length <= 253 && new RegExp(`^(?:${label})(?:\\.(?:${label}))*$`).test(hostname) ? hostname : "";
}

/** Match a canonical registrable authority host and its subdomains. */
export function hostMatchesCanonicalDomain(hostOrUrl, canonicalDomain) {
  const hostname = normalizeHost(hostOrUrl);
  const authority = normalizeHost(canonicalDomain);
  return Boolean(hostname && authority && (hostname === authority || hostname.endsWith(`.${authority}`)));
}
