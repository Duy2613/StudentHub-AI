/**
 * StudentHub AI — environment target safety.
 *
 * This module intentionally inspects only non-secret connection metadata. It
 * is shared by test runners and the PostgreSQL pool so a production-bound
 * local environment cannot be used accidentally by staging tests.
 */

export const STAGING_SUPABASE_PROJECT_REF = "bniwtkjtramqaozrrtrk";
export const PRODUCTION_SUPABASE_PROJECT_REF = "kytdomflmjytzyaabogi";
export const STAGING_SUPABASE_URL = `https://${STAGING_SUPABASE_PROJECT_REF}.supabase.co`;

export const ENVIRONMENT_ERROR_CODE = Object.freeze({
  STAGING_SUPABASE_URL_REQUIRED: "STAGING_SUPABASE_URL_REQUIRED",
  STAGING_TARGET_REQUIRED: "STAGING_TARGET_REQUIRED",
  STAGING_DATABASE_URL_REQUIRED: "STAGING_DATABASE_URL_REQUIRED",
  STAGING_DATABASE_URL_INVALID: "STAGING_DATABASE_URL_INVALID",
  STAGING_DATABASE_TARGET_UNKNOWN: "STAGING_DATABASE_TARGET_UNKNOWN",
  STAGING_LIVE_OPT_IN_REQUIRED: "STAGING_LIVE_OPT_IN_REQUIRED",
  REFUSING_PRODUCTION_DATABASE_IN_STAGING_TEST: "REFUSING_PRODUCTION_DATABASE_IN_STAGING_TEST",
});

const PROJECT_REF_PATTERN = /^[a-z0-9]{20}$/;
const DATABASE_PROTOCOLS = new Set(["postgres:", "postgresql:"]);

export class EnvironmentSafetyError extends Error {
  constructor(code, message, metadata = {}) {
    super(message);
    this.name = "EnvironmentSafetyError";
    this.code = code;
    this.metadata = Object.freeze({ ...metadata });
  }
}

function asTrimmedString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function decodeMetadata(value) {
  let decoded = String(value || "");
  for (let pass = 0; pass < 2; pass += 1) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) return decoded;
      decoded = next;
    } catch {
      return decoded;
    }
  }
  return decoded;
}

function findProjectRef(sources) {
  for (const source of sources) {
    const match = decodeMetadata(source).toLowerCase().match(
      /(?:^|[^a-z0-9])([a-z0-9]{20})(?:$|[^a-z0-9])/i
    );
    if (match && PROJECT_REF_PATTERN.test(match[1])) return match[1];
  }
  return null;
}

/**
 * Returns the project ref for an HTTPS Supabase project URL, or null for an
 * invalid/non-Supabase URL. The returned value is safe metadata, not a secret.
 */
export function extractSupabaseProjectRef(value) {
  const raw = asTrimmedString(value);
  if (!raw) return null;

  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }

  if (parsed.protocol !== "https:") return null;
  const match = parsed.hostname.toLowerCase().match(/^([a-z0-9]{20})\.supabase\.co$/i);
  return match?.[1] && PROJECT_REF_PATTERN.test(match[1]) ? match[1] : null;
}

/**
 * Inspects a PostgreSQL URL without returning its password or raw URL.
 * Supabase pooler URLs normally carry the project ref in the username or
 * `options=reference=...`; both are checked, while the password is ignored.
 */
export function inspectDatabaseTarget(value) {
  const raw = asTrimmedString(value);
  if (!raw) {
    return Object.freeze({ configured: false, valid: false, host: null, port: null, projectRef: null });
  }

  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    return Object.freeze({ configured: true, valid: false, host: null, port: null, projectRef: null });
  }

  if (!DATABASE_PROTOCOLS.has(parsed.protocol)) {
    return Object.freeze({ configured: true, valid: false, host: null, port: null, projectRef: null });
  }

  const queryValues = [...parsed.searchParams.entries()].flatMap(([key, value]) => [key, value]);
  const projectRef = findProjectRef([
    parsed.username,
    parsed.hostname,
    parsed.pathname,
    ...queryValues,
  ]);

  return Object.freeze({
    configured: true,
    valid: true,
    host: parsed.hostname.toLowerCase(),
    port: parsed.port ? Number(parsed.port) : null,
    projectRef,
  });
}

function reject(code, message, metadata = {}) {
  throw new EnvironmentSafetyError(code, message, metadata);
}

/**
 * Proves that the supplied environment targets the approved staging project.
 * No network or database connection is made by this function.
 */
export function assertStagingEnvironment({
  env = process.env,
  databaseEnvNames = ["DATABASE_URL", "STUDENTHUB_RLS_TEST_DATABASE_URL"],
  requireDatabase = false,
  requireLiveOptIn = false,
  command = "staging test",
} = {}) {
  const supabaseProjectRef = extractSupabaseProjectRef(env.NEXT_PUBLIC_SUPABASE_URL);
  if (!supabaseProjectRef) {
    reject(
      ENVIRONMENT_ERROR_CODE.STAGING_SUPABASE_URL_REQUIRED,
      `${command} requires NEXT_PUBLIC_SUPABASE_URL for the approved staging Supabase project.`,
    );
  }

  if (supabaseProjectRef === PRODUCTION_SUPABASE_PROJECT_REF) {
    reject(
      ENVIRONMENT_ERROR_CODE.REFUSING_PRODUCTION_DATABASE_IN_STAGING_TEST,
      `${command} refused: the configured Supabase project is production. No database connection was opened.`,
      { supabaseProjectRef },
    );
  }

  if (supabaseProjectRef !== STAGING_SUPABASE_PROJECT_REF) {
    reject(
      ENVIRONMENT_ERROR_CODE.STAGING_TARGET_REQUIRED,
      `${command} requires Supabase project ${STAGING_SUPABASE_PROJECT_REF}; received a different project ref.`,
      { supabaseProjectRef },
    );
  }

  if (requireLiveOptIn && env.STUDENTHUB_LIVE_STAGING_TESTS !== "1") {
    reject(
      ENVIRONMENT_ERROR_CODE.STAGING_LIVE_OPT_IN_REQUIRED,
      `${command} requires STUDENTHUB_LIVE_STAGING_TESTS=1.`,
      { supabaseProjectRef },
    );
  }

  const configuredDatabaseNames = databaseEnvNames.filter((name) => asTrimmedString(env[name]));
  if (requireDatabase && configuredDatabaseNames.length === 0) {
    reject(
      ENVIRONMENT_ERROR_CODE.STAGING_DATABASE_URL_REQUIRED,
      `${command} requires an explicit staging PostgreSQL URL.`,
      { supabaseProjectRef },
    );
  }

  const databases = configuredDatabaseNames.map((name) => {
    const target = inspectDatabaseTarget(env[name]);
    if (!target.valid) {
      reject(
        ENVIRONMENT_ERROR_CODE.STAGING_DATABASE_URL_INVALID,
        `${command} refused: ${name} is not a valid PostgreSQL URL.`,
        { name, supabaseProjectRef },
      );
    }
    if (target.projectRef === PRODUCTION_SUPABASE_PROJECT_REF) {
      reject(
        ENVIRONMENT_ERROR_CODE.REFUSING_PRODUCTION_DATABASE_IN_STAGING_TEST,
        `${command} refused: ${name} resolves to the production project. No database connection was opened.`,
        { name, supabaseProjectRef },
      );
    }
    if (target.projectRef !== STAGING_SUPABASE_PROJECT_REF) {
      reject(
        ENVIRONMENT_ERROR_CODE.STAGING_DATABASE_TARGET_UNKNOWN,
        `${command} refused: ${name} does not expose the approved staging project ref.`,
        { name, supabaseProjectRef, databaseProjectRef: target.projectRef },
      );
    }
    return Object.freeze({ name, ...target });
  });

  return Object.freeze({
    supabaseProjectRef,
    databases: Object.freeze(databases),
  });
}

/**
 * PostgreSQL pool guard for local development and automated tests. Production
 * application runtime is intentionally handled by its deployment secret
 * boundary; every non-production pool must prove staging first.
 */
export function assertLocalDatabaseTarget(env = process.env) {
  return assertStagingEnvironment({
    env,
    databaseEnvNames: ["DATABASE_URL"],
    requireDatabase: true,
    requireLiveOptIn: env.STUDENTHUB_TEST_RUNNER === "1",
    command: env.STUDENTHUB_TEST_RUNNER === "1" ? "automated database test" : "local database access",
  });
}
