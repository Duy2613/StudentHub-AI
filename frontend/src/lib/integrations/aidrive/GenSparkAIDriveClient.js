const DEFAULT_BASE_URL = "https://www.genspark.ai";
const DEFAULT_API_PREFIX = "/api/aidrive";
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
const MAX_PATH_LENGTH = 512;
const RELEASE = "aidrive-fuse-v1.0.17";
const SDK_REFERENCE = "genspark-aidrive-sdk-v0.1.1";

function isAIDriveEnabled(env = process.env) {
  return String(env.GENSPARK_AIDRIVE_ENABLED || "").trim().toLowerCase() === "true";
}

export const AIDRIVE_CAPABILITIES = Object.freeze([
  "LIST_FILES",
  "READ_STORAGE_USAGE",
]);

export class AIDriveIntegrationError extends Error {
  constructor(message, code, status = 502) {
    super(message);
    this.name = "AIDriveIntegrationError";
    this.code = code;
    this.status = status;
  }
}

export function normalizeAIDrivePath(input = "/") {
  const raw = String(input || "/").trim();
  if (!raw.startsWith("/") || raw.length > MAX_PATH_LENGTH) {
    throw new AIDriveIntegrationError("AI Drive path must be absolute and no longer than 512 characters.", "INVALID_REMOTE_PATH", 422);
  }
  if (raw.includes("\\") || /[\u0000-\u001f\u007f]/.test(raw)) {
    throw new AIDriveIntegrationError("AI Drive path contains unsupported characters.", "INVALID_REMOTE_PATH", 422);
  }

  const segments = raw.split("/").filter(Boolean);
  if (segments.some((segment) => segment === "." || segment === "..")) {
    throw new AIDriveIntegrationError("AI Drive path traversal is not allowed.", "INVALID_REMOTE_PATH", 422);
  }
  return `/${segments.join("/")}`;
}

function boundedInteger(value, fallback, min, max) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function safeHeader(value) {
  const clean = String(value || "").trim();
  return clean && clean.length <= 128 && !/[\r\n]/.test(clean) ? clean : null;
}

function resolveConfiguration(env = process.env) {
  const token = String(env.GENSPARK_TOKEN || "").trim();
  const baseUrl = new URL(String(env.GENSPARK_BASE_URL || DEFAULT_BASE_URL));
  const allowedHosts = new Set([
    new URL(DEFAULT_BASE_URL).host,
    ...String(env.GENSPARK_AIDRIVE_ALLOWED_HOSTS || "").split(",").map((host) => host.trim()).filter(Boolean),
  ]);

  if (baseUrl.protocol !== "https:" || !allowedHosts.has(baseUrl.host) || baseUrl.username || baseUrl.password) {
    throw new AIDriveIntegrationError("AI Drive origin is not an approved HTTPS host.", "UNAPPROVED_PROVIDER_ORIGIN", 503);
  }

  const apiPrefix = String(env.GENSPARK_AIDRIVE_API_PREFIX || DEFAULT_API_PREFIX).trim();
  if (!/^\/[A-Za-z0-9/_-]+$/.test(apiPrefix) || apiPrefix.includes("..") || apiPrefix.includes("//")) {
    throw new AIDriveIntegrationError("AI Drive API prefix is invalid.", "INVALID_PROVIDER_CONFIGURATION", 503);
  }

  return {
    enabled: isAIDriveEnabled(env),
    token,
    baseUrl: baseUrl.origin,
    apiPrefix: apiPrefix.replace(/\/$/, ""),
    routeIdentifier: safeHeader(env.GENSPARK_ROUTE_IDENTIFIER),
    environmentId: safeHeader(env.GENSPARK_ENVIRONMENT_ID),
    timeoutMs: boundedInteger(env.GENSPARK_AIDRIVE_TIMEOUT_MS, 8000, 1000, 20000),
  };
}

export function getAIDriveIntegrationStatus(env = process.env) {
  if (!isAIDriveEnabled(env)) {
    return {
      provider: "GENSPARK_AIDRIVE",
      status: "DISABLED",
      mode: "SERVER_READ_ONLY",
      release: RELEASE,
      sdkReference: SDK_REFERENCE,
      optional: true,
      coreDependency: false,
      capabilities: AIDRIVE_CAPABILITIES,
    };
  }

  try {
    const config = resolveConfiguration(env);
    return {
      provider: "GENSPARK_AIDRIVE",
      status: config.token ? "READY" : "NOT_CONFIGURED",
      mode: "SERVER_READ_ONLY",
      release: RELEASE,
      sdkReference: SDK_REFERENCE,
      optional: true,
      coreDependency: false,
      origin: new URL(config.baseUrl).host,
      capabilities: AIDRIVE_CAPABILITIES,
    };
  } catch (error) {
    return {
      provider: "GENSPARK_AIDRIVE",
      status: "INVALID_CONFIGURATION",
      mode: "SERVER_READ_ONLY",
      release: RELEASE,
      optional: true,
      coreDependency: false,
      capabilities: AIDRIVE_CAPABILITIES,
      errorCode: error.code || "INVALID_PROVIDER_CONFIGURATION",
    };
  }
}

function normalizeFileItem(item) {
  if (!item || typeof item !== "object") return null;
  const type = item.type === "directory" ? "directory" : item.type === "file" ? "file" : null;
  let path = null;
  try {
    path = typeof item.path === "string" ? normalizeAIDrivePath(item.path) : null;
  } catch {
    return null;
  }
  const name = typeof item.name === "string" ? item.name.trim().slice(0, 255) : "";
  if (!type || !path || !name) return null;
  return {
    name,
    path,
    type,
    size: type === "directory" ? 0 : Math.max(0, Number(item.size) || 0),
    modifiedTime: Number.isFinite(Number(item.modified_time)) ? Number(item.modified_time) : null,
    mimeType: typeof item.mime_type === "string" ? item.mime_type.slice(0, 160) : null,
  };
}

export class GenSparkAIDriveClient {
  constructor({ env = process.env, fetchImpl = globalThis.fetch } = {}) {
    if (!isAIDriveEnabled(env)) {
      throw new AIDriveIntegrationError(
        "AI Drive is disabled for this release.",
        "AIDRIVE_DISABLED",
        503
      );
    }
    this.config = resolveConfiguration(env);
    this.fetchImpl = fetchImpl;
    if (!this.config.token) {
      throw new AIDriveIntegrationError("AI Drive is not configured on this server.", "AIDRIVE_NOT_CONFIGURED", 503);
    }
    if (typeof fetchImpl !== "function") {
      throw new AIDriveIntegrationError("Server fetch is unavailable.", "PROVIDER_UNAVAILABLE", 503);
    }
  }

  buildHeaders() {
    const headers = {
      Accept: "application/json",
      Authorization: `Bearer ${this.config.token}`,
      "User-Agent": "StudentHub-AIDrive-Bridge/1.0",
    };
    if (this.config.routeIdentifier) headers["X-Route-Identifier"] = this.config.routeIdentifier;
    if (this.config.environmentId) headers["X-Environment-ID"] = this.config.environmentId;
    return headers;
  }

  async requestJson(pathname, searchParams = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);
    try {
      const url = new URL(`${this.config.apiPrefix}${pathname}`, this.config.baseUrl);
      Object.entries(searchParams).forEach(([key, value]) => url.searchParams.set(key, String(value)));
      const response = await this.fetchImpl(url, {
        method: "GET",
        headers: this.buildHeaders(),
        signal: controller.signal,
        redirect: "error",
        cache: "no-store",
      });

      if (!response.ok) {
        const mapping = response.status === 401 || response.status === 403
          ? ["AIDRIVE_AUTHENTICATION_FAILED", 502]
          : response.status === 429
            ? ["AIDRIVE_RATE_LIMITED", 429]
            : response.status === 404
              ? ["AIDRIVE_PATH_NOT_FOUND", 404]
              : ["AIDRIVE_PROVIDER_UNAVAILABLE", 502];
        throw new AIDriveIntegrationError("AI Drive provider request failed.", mapping[0], mapping[1]);
      }

      const text = await response.text();
      if (text.length > MAX_RESPONSE_BYTES) {
        throw new AIDriveIntegrationError("AI Drive response exceeded the safe size limit.", "AIDRIVE_RESPONSE_TOO_LARGE", 502);
      }
      try {
        return JSON.parse(text);
      } catch {
        throw new AIDriveIntegrationError("AI Drive returned an invalid response.", "AIDRIVE_INVALID_RESPONSE", 502);
      }
    } catch (error) {
      if (error instanceof AIDriveIntegrationError) throw error;
      const code = error?.name === "AbortError" ? "AIDRIVE_TIMEOUT" : "AIDRIVE_PROVIDER_UNAVAILABLE";
      throw new AIDriveIntegrationError("AI Drive provider is unavailable.", code, 503);
    } finally {
      clearTimeout(timeout);
    }
  }

  async listFiles(path = "/", limit = 100) {
    const normalizedPath = normalizeAIDrivePath(path);
    const safeLimit = boundedInteger(limit, 100, 1, 200);
    const encodedPath = normalizedPath.split("/").filter(Boolean).map(encodeURIComponent).join("/");
    const payload = await this.requestJson(`/ls/files/${encodedPath}`, { limit: safeLimit });
    const items = Array.isArray(payload?.items) ? payload.items.map(normalizeFileItem).filter(Boolean).slice(0, safeLimit) : [];
    return { path: normalizedPath, items, totalCount: items.length };
  }

  async getStorageUsage() {
    const payload = await this.requestJson("/storage_usage");
    const quotaBytes = Math.max(0, Number(payload?.quota_bytes) || 0);
    const usedBytes = Math.max(0, Number(payload?.used_bytes) || 0);
    return {
      plan: typeof payload?.plan === "string" ? payload.plan.slice(0, 80) : "unknown",
      quotaBytes,
      usedBytes,
      availableBytes: Math.max(0, quotaBytes - usedBytes),
      usedPercentage: quotaBytes > 0 ? Math.min(100, (usedBytes / quotaBytes) * 100) : 0,
    };
  }
}
