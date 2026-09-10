/**
 * Hermetic network guard for the authenticated disposable Local Supabase pass.
 *
 * The guard is intentionally opt-in. It rejects server-side fetches to every
 * non-loopback HTTP(S) destination while STUDENTHUB_LOCAL_E2E=1. This keeps a
 * local authenticated run from silently falling back to Main Supabase or an
 * external provider. Database traffic is separately forced to loopback by the
 * runner's environment overlay.
 */

const loopbackHosts = new Set(["127.0.0.1", "localhost", "::1"]);
const violations = [];

function hostnameOf(input) {
  try {
    return new URL(typeof input === "string" ? input : input?.url || String(input)).hostname.toLowerCase();
  } catch {
    return "<invalid-url>";
  }
}

function targetUrl(input) {
  try {
    return new URL(typeof input === "string" ? input : input?.url || String(input));
  } catch {
    return null;
  }
}

function isAllowed(url) {
  return Boolean(url && (!/^https?:$/i.test(url.protocol) || loopbackHosts.has(url.hostname.toLowerCase())));
}

function recordViolation(url, reason) {
  const host = url?.hostname?.toLowerCase() || "<unknown>";
  violations.push({ host, protocol: url?.protocol || "", reason });
  if (violations.length > 20) violations.shift();
}

if (process.env.STUDENTHUB_LOCAL_E2E === "1" && !globalThis.__studenthubLocalE2ENetworkGuardInstalled) {
  const originalFetch = globalThis.fetch;
  if (typeof originalFetch !== "function") throw new Error("LOCAL_E2E_NETWORK_GUARD_FETCH_UNAVAILABLE");

  globalThis.fetch = async function guardedFetch(input, init) {
    const url = targetUrl(input);
    if (!isAllowed(url)) {
      recordViolation(url, "NON_LOOPBACK_FETCH_REJECTED");
      throw new Error(`LOCAL_E2E_NETWORK_GUARD_BLOCKED:${hostnameOf(input)}`);
    }
    return originalFetch.call(this, input, init);
  };

  globalThis.__studenthubLocalE2ENetworkGuardInstalled = true;
  globalThis.__studenthubLocalE2ENetworkViolations = violations;
}

export function getLocalE2ENetworkViolations() {
  return [...violations];
}

\n