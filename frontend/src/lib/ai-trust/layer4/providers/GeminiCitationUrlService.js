import {
  isRedirectStatus,
  validateRemoteUrl,
  validateRemoteUrlSync,
} from "../../../security/hardening/SafeRemoteUrl.js";

const MAX_REDIRECTS = 3;
const DEFAULT_TIMEOUT_MS = 3_500;
const USER_AGENT = "StudentHub-TrustEngine/6.0 (Gemini citation validation)";

function realHttpUrl(value) {
  if (typeof value !== "string" || !/^https?:\/\//i.test(value)) return null;
  try {
    const parsed = new URL(value);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.toString().slice(0, 4096) : null;
  } catch {
    return null;
  }
}

function responseLocation(response) {
  try {
    return response?.headers?.get?.("location") || response?.headers?.get?.("Location") || null;
  } catch {
    return null;
  }
}

function stopResponseBody(response) {
  try {
    const cancel = response?.body?.cancel;
    if (typeof cancel === "function") cancel.call(response.body);
  } catch {
    // The response has already been classified; a body cleanup failure must
    // never turn a reachable citation into an unhandled request failure.
  }
}

function timeoutError() {
  const error = new Error("GEMINI_CITATION_TIMEOUT");
  error.code = "GEMINI_CITATION_TIMEOUT";
  return error;
}

/**
 * Checks a Gemini-provided URL before it becomes public evidence.
 *
 * This is deliberately a reachability check, not a truth check: Tavily and
 * the deterministic policy remain responsible for evidence quality and the
 * final decision. Gemini may add a useful public source, but a fabricated,
 * private, broken, or redirect-to-private URL never reaches the client.
 */
export async function validateGeminiCitationUrl(rawUrl, {
  fetchImpl = globalThis.fetch,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  maxRedirects = MAX_REDIRECTS,
} = {}) {
  const initial = validateRemoteUrlSync(rawUrl);
  if (!initial.ok) return { ok: false, code: initial.code || "INVALID_REMOTE_URL" };
  if (typeof fetchImpl !== "function") return { ok: false, code: "FETCH_UNAVAILABLE" };

  let currentUrl = initial.url;
  let redirectCount = 0;
  const boundedTimeout = Math.min(8_000, Math.max(500, Number(timeoutMs) || DEFAULT_TIMEOUT_MS));
  const boundedRedirects = Math.min(MAX_REDIRECTS, Math.max(0, Number(maxRedirects) || MAX_REDIRECTS));

  while (true) {
    const dnsCheck = await validateRemoteUrl(currentUrl, { resolveDns: true, dnsTimeoutMs: 1_200 });
    if (!dnsCheck.ok) return { ok: false, code: dnsCheck.code || "DNS_RESOLUTION_FAILED" };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(timeoutError()), boundedTimeout);
    let response;
    try {
      response = await fetchImpl(currentUrl, {
        method: "GET",
        redirect: "manual",
        headers: {
          Accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.1",
          "User-Agent": USER_AGENT,
        },
        signal: controller.signal,
      });
    } catch (error) {
      const code = error?.code || (error?.name === "AbortError" ? "GEMINI_CITATION_TIMEOUT" : "FETCH_UNAVAILABLE");
      return { ok: false, code: String(code).slice(0, 120) };
    } finally {
      clearTimeout(timer);
    }

    const status = Number(response?.status);
    if (isRedirectStatus(status)) {
      const location = responseLocation(response);
      stopResponseBody(response);
      if (redirectCount >= boundedRedirects || !location) {
        return { ok: false, code: location ? "TOO_MANY_REDIRECTS" : "REDIRECT_LOCATION_MISSING", httpStatus: status };
      }
      let nextUrl;
      try {
        nextUrl = new URL(location, currentUrl).toString();
      } catch {
        return { ok: false, code: "INVALID_REDIRECT_URL", httpStatus: status };
      }
      const nextGuard = validateRemoteUrlSync(nextUrl);
      if (!nextGuard.ok) return { ok: false, code: nextGuard.code || "SSRF_RESTRICTED", httpStatus: status };
      currentUrl = nextGuard.url;
      redirectCount += 1;
      continue;
    }

    stopResponseBody(response);
    if (Number.isInteger(status) && status >= 200 && status < 400) {
      return {
        ok: true,
        requestedUrl: initial.url,
        finalUrl: currentUrl,
        url: currentUrl,
        httpStatus: status,
        redirectCount,
        validationStatus: "REACHABLE",
      };
    }
    return { ok: false, code: Number.isInteger(status) ? `HTTP_${status}` : "INVALID_HTTP_RESPONSE", httpStatus: Number.isInteger(status) ? status : null };
  }
}

/**
 * Validates only citations that are not already covered by Layer 3. This
 * keeps Tavily-validated sources cheap while still permitting Gemini to add
 * independent URLs of its own.
 */
export async function validateGeminiCitationList(citations, {
  allowedCitationUrls = new Set(),
  evidenceByUrl = new Map(),
  validateUrl = validateGeminiCitationUrl,
} = {}) {
  const accepted = [];
  const rejected = [];
  const seen = new Set();

  for (const item of Array.isArray(citations) ? citations : []) {
    const inputUrl = realHttpUrl(item?.url);
    if (!inputUrl || seen.has(inputUrl)) continue;
    seen.add(inputUrl);

    const existingEvidence = evidenceByUrl.get(inputUrl);
    if (allowedCitationUrls.has(inputUrl) || existingEvidence) {
      accepted.push({
        ...item,
        id: typeof item.id === "string" && item.id.trim() ? item.id.trim().slice(0, 180) : inputUrl,
        url: inputUrl,
        retrievalOrigin: existingEvidence?.retrievalOrigin || "TAVILY_INITIAL",
        validationStatus: "LAYER3_VALIDATED",
        httpStatus: existingEvidence?.httpStatus || null,
      });
      continue;
    }

    try {
      const result = await validateUrl(inputUrl);
      if (result?.ok === true && realHttpUrl(result.finalUrl || result.url)) {
        accepted.push({
          ...item,
          id: typeof item.id === "string" && item.id.trim() ? item.id.trim().slice(0, 180) : inputUrl,
          url: realHttpUrl(result.finalUrl || result.url),
          requestedUrl: inputUrl,
          retrievalOrigin: "GEMINI_GENERATED",
          validationStatus: result.validationStatus || "REACHABLE",
          httpStatus: Number.isInteger(result.httpStatus) ? result.httpStatus : null,
          redirectCount: Number.isInteger(result.redirectCount) ? result.redirectCount : 0,
        });
      } else {
        rejected.push({ url: inputUrl, code: result?.code || "URL_NOT_REACHABLE", httpStatus: result?.httpStatus || null });
      }
    } catch (error) {
      rejected.push({ url: inputUrl, code: error?.code || error?.name || "URL_VALIDATION_FAILED", httpStatus: null });
    }
  }

  return {
    accepted,
    rejected,
    checkedCount: accepted.length + rejected.length,
    acceptedCount: accepted.length,
    rejectedCount: rejected.length,
    allLinksValidated: rejected.length === 0,
  };
}
