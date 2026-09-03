/**
 * Shared outbound URL boundary for server-side retrieval.
 *
 * The check is intentionally conservative: only HTTP(S) is permitted and
 * loopback, link-local, private, unique-local and cloud-metadata destinations
 * are rejected before a request is issued.  DNS resolution is an optional
 * second check used immediately before network fetches to reduce DNS-rebind
 * exposure; callers must still validate every redirect hop.
 */

import dns from "node:dns/promises";
import net from "node:net";

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "ip6-localhost",
  "ip6-loopback",
  "metadata.google.internal",
  "metadata.google",
  "169.254.169.254",
  "100.100.100.200"
]);

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

function normalizeHostname(hostname) {
  return String(hostname || "")
    .trim()
    .toLowerCase()
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .replace(/\.+$/, "");
}

function isPrivateIpv4(hostname) {
  const octets = hostname.split(".").map(Number);
  if (octets.length !== 4 || octets.some(octet => !Number.isInteger(octet) || octet < 0 || octet > 255)) return false;
  const [a, b] = octets;
  return a === 0 || a === 10 || a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a >= 224);
}

function isPrivateIpv6(hostname) {
  const clean = hostname.split("%")[0];
  if (!clean.includes(":")) return false;
  const compact = clean.toLowerCase();
  if (compact === "::" || compact === "::1" || compact.startsWith("fe80:") ||
      compact.startsWith("fc") || compact.startsWith("fd") || compact.startsWith("ff") ||
      compact.startsWith("fec0:")) return true;

  // IPv4-mapped IPv6 addresses can hide loopback/private IPv4 targets.
  const mappedIpv4 = compact.match(/(?:^|:)(\d{1,3}(?:\.\d{1,3}){3})$/)?.[1];
  if (mappedIpv4 && isPrivateIpv4(mappedIpv4)) return true;

  // WHATWG URL canonicalization rewrites dotted IPv4 tails to hexadecimal
  // (for example ::ffff:127.0.0.1 becomes ::ffff:7f00:1).  Expand the
  // address and inspect the final 32 bits so that the canonical form cannot
  // bypass the private/loopback guard.
  const parts = compact.split("::");
  if (parts.length > 2) return false;
  const left = parts[0] ? parts[0].split(":").filter(Boolean) : [];
  const right = parts.length === 2 && parts[1] ? parts[1].split(":").filter(Boolean) : [];
  const missing = 8 - (left.length + right.length);
  if (missing < 0) return false;
  const groups = [
    ...left,
    ...(parts.length === 2 ? Array.from({ length: missing }, () => "0") : []),
    ...right
  ];
  if (groups.length !== 8 || groups.some(group => !/^[0-9a-f]{1,4}$/.test(group))) return false;
  const tail = groups.slice(6).map(group => Number.parseInt(group, 16));
  const mappedTail = `${tail[0] >> 8}.${tail[0] & 0xff}.${tail[1] >> 8}.${tail[1] & 0xff}`;
  return groups[0] === "0" && groups[1] === "0" && groups[2] === "0" &&
    groups[3] === "0" && groups[4] === "0" &&
    (groups[5] === "ffff" || groups[5] === "0") && isPrivateIpv4(mappedTail);
}

export function isPrivateAddress(hostname) {
  const normalized = normalizeHostname(hostname);
  const ipVersion = net.isIP(normalized);
  return ipVersion === 4 ? isPrivateIpv4(normalized) : ipVersion === 6 ? isPrivateIpv6(normalized) : false;
}

export function isBlockedHostname(hostname) {
  const normalized = normalizeHostname(hostname);
  return !normalized || BLOCKED_HOSTNAMES.has(normalized) ||
    normalized === "0.0.0.0" ||
    normalized.endsWith(".localhost") ||
    normalized.endsWith(".internal") ||
    normalized.endsWith(".local") ||
    isPrivateAddress(normalized);
}

export function validateRemoteUrlSync(value) {
  if (typeof value !== "string" || !value.trim() || value.length > 4096) {
    return { ok: false, code: "INVALID_REMOTE_URL" };
  }

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return { ok: false, code: "INVALID_REMOTE_URL" };
  }

  if (!/^https?:$/.test(parsed.protocol)) {
    return { ok: false, code: "UNSUPPORTED_REMOTE_SCHEME" };
  }

  if (parsed.username || parsed.password) {
    return { ok: false, code: "REMOTE_CREDENTIALS_NOT_ALLOWED" };
  }

  const hostname = normalizeHostname(parsed.hostname);
  if (isBlockedHostname(hostname)) {
    return { ok: false, code: "SSRF_RESTRICTED" };
  }

  return { ok: true, url: parsed.toString(), hostname };
}

export async function validateRemoteUrl(value, { resolveDns = false, dnsTimeoutMs = 1200 } = {}) {
  const staticResult = validateRemoteUrlSync(value);
  if (!staticResult.ok || !resolveDns || net.isIP(staticResult.hostname)) return staticResult;

  let timer;
  try {
    const boundedDnsTimeout = Math.min(5000, Math.max(100, Number(dnsTimeoutMs) || 1200));
    const lookup = dns.lookup(staticResult.hostname, { all: true, verbatim: true });
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error("DNS_TIMEOUT")), boundedDnsTimeout);
    });
    const addresses = await Promise.race([lookup, timeout]);
    if (!Array.isArray(addresses) || addresses.length === 0 || addresses.some(item => isPrivateAddress(item.address))) {
      return { ok: false, code: "SSRF_RESTRICTED" };
    }
    return staticResult;
  } catch {
    // Fail closed when a hostname cannot be resolved at the point of fetch.
    return { ok: false, code: "DNS_RESOLUTION_FAILED" };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function isRedirectStatus(status) {
  return REDIRECT_STATUSES.has(Number(status));
}

export { normalizeHostname };
