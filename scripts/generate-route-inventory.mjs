import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const appRoot = join(root, "frontend", "src", "app");
const buildRoot = join(root, "frontend", ".next");
const outputPath = join(root, "artifacts", "manifests", "route-inventory-2026-09-10.json");

function collectFiles(directory, predicate) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) return collectFiles(absolute, predicate);
    return predicate(entry.name) ? [absolute] : [];
  });
}

function appRoute(file, kind) {
  const relativePath = relative(appRoot, file).split(sep).join("/");
  const suffix = kind === "page" ? "/page.jsx" : "/route.js";
  const withoutSuffix = relativePath.endsWith(suffix) ? relativePath.slice(0, -suffix.length) : relativePath;
  return `/${withoutSuffix === "page" ? "" : withoutSuffix}`.replaceAll("//", "/") || "/";
}

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function sourceSignals(source) {
  return [
    ["security-fabric", /SecurityFabric\.wrapHandler/.test(source)],
    ["session-principal", /principal\.subjectId|requireSession|requireAuthenticated|useAuth|supabase\.auth/.test(source)],
    ["admin-permission", /ADMIN\.|requiredPermission\s*:\s*["']ADMIN/.test(source)],
    ["public-contract", /allowAnonymous\s*:\s*true|SECURITY_CONTRACT:\s*\w+\s+PUBLIC/.test(source)],
  ].filter(([, matched]) => matched).map(([name]) => name);
}

function explicitContract(source, method) {
  const match = source.match(new RegExp(`SECURITY_CONTRACT:\\s*${method}\\s+(PUBLIC|AUTHENTICATED|ADMIN|SERVICE_ONLY)\\s+([A-Z0-9_]+)`));
  return match ? { accessClass: match[1], action: match[2] } : null;
}

function methods(source) {
  return [...source.matchAll(/export\s+(?:async\s+function|const|let)\s+(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\b/g)].map((match) => match[1]);
}

function pageClassification(path, source, redirects) {
  if (redirects.has(path)) return "REDIRECT";
  if (["/", "/login", "/register", "/callback"].includes(path)) return "PUBLIC_PAGE";
  if (["/c9", "/cinema"].includes(path)) return "INTERNAL/TEST";
  if (["/trust", "/expert", "/cases", "/dashboard", "/settings", "/settings/privacy"].some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) return "ADMIN/PRIVILEGED_PAGE";
  return sourceSignals(source).includes("session-principal") ? "AUTHENTICATED_PAGE" : "PUBLIC_PAGE";
}

function apiClassification(path, source, method) {
  const contract = explicitContract(source, method);
  if (contract) return contract.accessClass;
  if (path === "/api/[...path]") return "SERVICE_ONLY";
  if (/ADMIN\.|requiredPermission\s*:\s*["']ADMIN/.test(source)) return "ADMIN";
  if (/allowAnonymous\s*:\s*true/.test(source)) return "PUBLIC";
  if (/SecurityFabric\.wrapHandler|principal\.subjectId|requireSession|requireAuthenticated/.test(source)) return "AUTHENTICATED";
  return "INTERNAL/TEST";
}

const manifest = readJson(join(buildRoot, "routes-manifest.json")) || {};
const appPaths = readJson(join(buildRoot, "server", "app-paths-manifest.json")) || {};
const redirectMap = new Map((manifest.redirects || []).filter((item) => !item.internal).map((item) => [item.source, item.destination]));
const pageFiles = collectFiles(appRoot, (name) => /^page\.(?:js|jsx|ts|tsx)$/.test(name));
const apiFiles = collectFiles(join(appRoot, "api"), (name) => /^route\.(?:js|jsx|ts|tsx)$/.test(name));

const pages = pageFiles.map((file) => {
  const path = appRoute(file, "page");
  const source = readFileSync(file, "utf8");
  return {
    path,
    classification: pageClassification(path, source, redirectMap),
    redirectTarget: redirectMap.get(path) || null,
    source: relative(root, file).split(sep).join("/"),
    sourceSignals: sourceSignals(source),
    builtManifestEntry: appPaths[`${path}/page`] || null,
  };
}).sort((left, right) => left.path.localeCompare(right.path));

const api = apiFiles.flatMap((file) => {
  const path = appRoute(file, "api");
  const source = readFileSync(file, "utf8");
  return methods(source).map((method) => ({
    path,
    method,
    classification: apiClassification(path, source, method),
    source: relative(root, file).split(sep).join("/"),
    sourceSignals: sourceSignals(source),
    builtManifestEntry: appPaths[`${path}/route`] || null,
  }));
}).sort((left, right) => `${left.path}:${left.method}`.localeCompare(`${right.path}:${right.method}`));

const inventory = {
  generatedAt: new Date().toISOString(),
  sourceOfTruth: [
    "frontend/src/app filesystem",
    "frontend/.next/server/app-paths-manifest.json",
    "frontend/.next/routes-manifest.json",
    "frontend/src/proxy.js",
    "frontend/next.config.ts",
  ],
  counts: {
    pageRoutes: pages.length,
    apiHandlers: api.length,
    redirects: redirectMap.size,
  },
  redirects: [...redirectMap.entries()].map(([source, destination]) => ({ source, destination, classification: "REDIRECT" })),
  pages,
  api,
  notes: [
    "Page classification is a release inventory heuristic; server/API authorization remains authoritative.",
    "Routes with an explicit next.config redirect are recorded as REDIRECT even when a source page file remains for compatibility.",
    "No LEGACY RETIRED ROUTE was inferred from the current build; /learn, /practice, /projects, /roadmap remain active source routes unless redirected by the manifest.",
  ],
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(inventory, null, 2)}\n`, "utf8");
console.log(`Wrote ${relative(root, outputPath)} (${pages.length} pages, ${api.length} API handlers, ${redirectMap.size} redirects).`);
