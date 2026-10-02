import { createHash, X509Certificate } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

export const EXPECTED_PRODUCTION_PROJECT_REF = "kytdomflmjytzyaabogi";
export const FORBIDDEN_STAGING_PROJECT_REF = "bniwtkjtramqaozrrtrk";
export const APPROVED_PRODUCTION_CA_SHA256 = "700723581420DD1AC98FD7E9AC529F0EF210EADCAF87FC868A3AD7D114C2F3B7";

export class GovernanceTransportError extends Error {
  constructor(code) {
    super(code);
    this.name = "GovernanceTransportError";
    this.code = code;
  }
}

function fail(code) {
  throw new GovernanceTransportError(code);
}

export function normalizeApprovedOperatorDatabaseUrl(raw) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    fail("DATABASE_URL_INVALID");
  }
  if (!new Set(["postgres:", "postgresql:"]).has(url.protocol)) {
    fail("DATABASE_PROTOCOL_INVALID");
  }
  if (url.hostname.endsWith(".pooler.supabase.com") && url.port === "6543") {
    // OWNER_FRESH_BACKUP.ps1 uses the same approved project credential and
    // normalizes Supavisor transaction-pooler URLs to the 5432 session port.
    url.port = "5432";
  }
  return url.toString();
}

export function strictNodePgConnectionString(raw) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    fail("DATABASE_URL_INVALID");
  }

  // node-postgres parses SSL query options after Pool options and replaces an
  // explicit `ssl` object when these parameters are present. Keep TLS policy
  // in the Pool's pinned CA + rejectUnauthorized configuration instead.
  for (const parameter of ["ssl", "sslmode", "sslrootcert", "sslcert", "sslkey", "sslpassword", "sslnegotiation"]) {
    url.searchParams.delete(parameter);
  }
  return url.toString();
}

export function projectRefFromDatabaseUrl(raw) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    fail("DATABASE_URL_INVALID");
  }

  if (!new Set(["postgres:", "postgresql:"]).has(url.protocol)) {
    fail("DATABASE_PROTOCOL_INVALID");
  }

  const directRef = url.hostname.match(/^db\.([a-z0-9]{20})\.supabase\.co$/)?.[1] || null;
  const poolerRef = url.hostname.endsWith(".pooler.supabase.com")
    ? decodeURIComponent(url.username).match(/^postgres\.([a-z0-9]{20})$/)?.[1] || null
    : null;
  const ref = directRef || poolerRef;

  if (ref === FORBIDDEN_STAGING_PROJECT_REF) fail("STAGING_DATABASE_REF_FORBIDDEN");
  if (ref !== EXPECTED_PRODUCTION_PROJECT_REF) fail("DATABASE_PROJECT_REF_MISMATCH");
  if ((url.port || "5432") !== "5432") fail("DATABASE_PORT_NOT_APPROVED");
  if (decodeURIComponent(url.pathname.slice(1)) !== "postgres") fail("DATABASE_NAME_NOT_APPROVED");

  return ref;
}

export function projectRefFromSupabaseUrl(raw) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    fail("SUPABASE_URL_INVALID");
  }

  if (url.protocol !== "https:") fail("SUPABASE_URL_MUST_USE_HTTPS");
  const ref = url.hostname.match(/^([a-z0-9]{20})\.supabase\.co$/)?.[1] || null;
  if (ref === FORBIDDEN_STAGING_PROJECT_REF) fail("STAGING_AUTH_REF_FORBIDDEN");
  if (ref !== EXPECTED_PRODUCTION_PROJECT_REF) fail("AUTH_PROJECT_REF_MISMATCH");
  return ref;
}

export function verifyProductionCaFile(caFile) {
  if (!caFile) fail("PRODUCTION_CA_PATH_REQUIRED");

  let bytes;
  try {
    bytes = readFileSync(caFile);
  } catch {
    fail("PRODUCTION_CA_FILE_UNAVAILABLE");
  }

  if (bytes.toString("utf8").includes("PRIVATE KEY")) fail("PRODUCTION_CA_FILE_CONTAINS_PRIVATE_KEY");

  let certificate;
  try {
    certificate = new X509Certificate(bytes);
  } catch {
    fail("PRODUCTION_CA_CERTIFICATE_INVALID");
  }

  if (!certificate.ca) fail("PRODUCTION_CA_CERTIFICATE_NOT_CA");
  if (Date.parse(certificate.validFrom) > Date.now() || Date.parse(certificate.validTo) <= Date.now()) {
    fail("PRODUCTION_CA_CERTIFICATE_EXPIRED_OR_NOT_YET_VALID");
  }

  const sha256 = createHash("sha256").update(bytes).digest("hex").toUpperCase();
  if (sha256 !== APPROVED_PRODUCTION_CA_SHA256) fail("PRODUCTION_CA_FINGERPRINT_MISMATCH");
  return { sha256, absolutePath: path.resolve(caFile) };
}

export function prepareProductionDatabaseUrl(raw, caFile) {
  const normalizedRaw = normalizeApprovedOperatorDatabaseUrl(raw);
  const projectRef = projectRefFromDatabaseUrl(normalizedRaw);
  const url = new URL(normalizedRaw);
  const sslMode = url.searchParams.get("sslmode")?.toLowerCase();
  const sslOverride = url.searchParams.get("ssl")?.toLowerCase();

  if (["disable", "no-verify", "allow", "prefer"].includes(sslMode)) {
    fail("DATABASE_SSLMODE_NOT_STRICT");
  }
  if (["0", "false", "disable", "no-verify"].includes(sslOverride)) {
    fail("DATABASE_SSL_OVERRIDE_FORBIDDEN");
  }
  if (url.searchParams.has("sslcert") || url.searchParams.has("sslkey")) {
    fail("DATABASE_CLIENT_CERT_OVERRIDE_UNSUPPORTED");
  }

  const ca = verifyProductionCaFile(caFile);
  // Match OWNER_FRESH_BACKUP.ps1: verify the full host and chain with the
  // approved root certificate, and prevent URL parsing from weakening TLS or
  // selecting a different CA.
  const connectionString = strictNodePgConnectionString(url.toString());

  return {
    connectionString,
    projectRef,
    caPath: ca.absolutePath,
    caSha256: ca.sha256,
    tlsMode: "verify-full",
    rejectUnauthorized: true,
  };
}
