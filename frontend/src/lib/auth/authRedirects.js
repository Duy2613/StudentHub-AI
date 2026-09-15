const INTERNAL_ORIGIN = "https://studenthub.internal";

// These are application destinations that are safe after authentication. The
// allowlist is deliberately route-based so a provider callback can never turn
// an arbitrary `next` value into an external redirect.
const AUTH_RETURN_PREFIXES = Object.freeze([
  "/dashboard",
  "/community",
  "/trust",
  "/expert",
  "/profile",
  "/cases",
  "/settings",
  "/onboarding",
  "/forum",
  "/scam-check",
]);

function isAllowedPathname(pathname) {
  return AUTH_RETURN_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function parseInternalPath(value) {
  if (typeof value !== "string") return null;
  const candidate = value.trim();
  if (!candidate || candidate.length > 2048) return null;

  // Reject protocol-relative, backslash-normalized, encoded separator, and
  // control-character forms before URL parsing can reinterpret them.
  if (
    !candidate.startsWith("/")
    || candidate.startsWith("//")
    || candidate.includes("\\")
    || /[\u0000-\u001F\u007F]/.test(candidate)
    || /%(?:2f|5c|3a)/i.test(candidate)
  ) return null;

  let parsed;
  try {
    parsed = new URL(candidate, INTERNAL_ORIGIN);
  } catch {
    return null;
  }
  if (parsed.origin !== INTERNAL_ORIGIN || !isAllowedPathname(parsed.pathname)) return null;
  return `${parsed.pathname}${parsed.search}`;
}

export function normalizeAuthReturnPath(value, fallback = "/dashboard") {
  return parseInternalPath(value) || parseInternalPath(fallback) || "/dashboard";
}

export function buildAuthCallbackUrl(origin, next = "/dashboard") {
  const callbackOrigin = typeof origin === "string" && origin ? origin : INTERNAL_ORIGIN;
  let callback;
  try {
    callback = new URL("/callback", callbackOrigin);
  } catch {
    callback = new URL("/callback", INTERNAL_ORIGIN);
  }
  const safeNext = normalizeAuthReturnPath(next);
  if (safeNext !== "/dashboard") callback.searchParams.set("next", safeNext);
  return callback.toString();
}

export function buildLoginErrorPath(errorCode, next = "/dashboard") {
  const params = new URLSearchParams({ error: String(errorCode || "oauth_failed") });
  const safeNext = normalizeAuthReturnPath(next);
  if (safeNext !== "/dashboard") params.set("next", safeNext);
  return `/login?${params.toString()}`;
}

export function postAuthDestination({ next, onboarded = false } = {}) {
  const safeNext = normalizeAuthReturnPath(next);
  // An explicit in-app return path is an intent from the user (for example a
  // profile edit or a community reply). Onboarding must not swallow that
  // intent and send the user into a redirect loop. Only the default dashboard
  // destination may enter first-time onboarding.
  if (onboarded || safeNext !== "/dashboard") return safeNext;
  return "/onboarding";
}
