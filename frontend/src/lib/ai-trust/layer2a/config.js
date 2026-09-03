export const LAYER_2A_CONFIG = {
  VERSION: "layer2a-v1.0.0",
  BASE_URL_ENV: "STUDENTHUB_LAYER2_BASE_URL",
  ENDPOINT_PATH: "/api/verify/layer2",
  TIMEOUT_MS: 4000,
  MAX_URL_LENGTH: 2048,
  MAX_RESPONSE_BYTES: 256 * 1024,
  MAX_PROVIDER_RESULTS: 20,
  MAX_RETRIES: 1,
  RETRY_JITTER_MAX_MS: 125,
  CACHE_MAX_ENTRIES: 2000,
  CACHE_MAX_TTL_MS: 24 * 60 * 60 * 1000,
  BREAKER_FAILURE_THRESHOLD: 3,
  BREAKER_RESET_MS: 15_000,
};

export function getLayer2AConfig(env = process.env) {
  const requestedTimeout = Number(env?.STUDENTHUB_LAYER2_TIMEOUT_MS);
  const timeoutMs = Number.isFinite(requestedTimeout)
    ? Math.min(5000, Math.max(300, Math.floor(requestedTimeout)))
    : LAYER_2A_CONFIG.TIMEOUT_MS;

  return {
    ...LAYER_2A_CONFIG,
    baseUrl: typeof env?.STUDENTHUB_LAYER2_BASE_URL === "string"
      ? env.STUDENTHUB_LAYER2_BASE_URL.trim()
      : "",
    timeoutMs,
  };
}
