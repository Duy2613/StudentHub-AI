import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const apiRoot = join(root, "frontend", "src", "app", "api");
const outputPath = join(root, "docs", "security", "API-Authorization-Inventory.md");
const httpMethods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"];

function collectRoutes(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) return collectRoutes(absolute);
    return /^route\.(?:js|jsx|ts|tsx)$/.test(entry.name) ? [absolute] : [];
  });
}

function routePath(file) {
  const directory = dirname(relative(apiRoot, file)).split(sep).join("/");
  return `/api${directory === "." ? "" : `/${directory}`}`;
}

function methodSlices(source) {
  const declarations = [];
  const declarationPattern = /export\s+(?:async\s+function|const|let)\s+(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\b/g;
  let match;
  while ((match = declarationPattern.exec(source))) {
    declarations.push({ method: match[1], index: match.index });
  }
  return declarations.map((declaration, index) => ({
    method: declaration.method,
    source: source.slice(declaration.index, declarations[index + 1]?.index || source.length)
  }));
}

function firstMatch(source, pattern, fallback = "—") {
  return source.match(pattern)?.[1]?.trim() || fallback;
}

function explicitSecurityContract(source, method) {
  const pattern = new RegExp(`SECURITY_CONTRACT:\\s*${method}\\s+(PUBLIC|AUTHENTICATED|ADMIN|SERVICE_ONLY)\\s+([A-Z0-9_]+)\\s+(\\d+)\\s+(\\d+)`);
  const match = source.match(pattern);
  return match ? { accessClass: match[1], action: match[2], maxRequests: match[3], maxBodyBytes: match[4] } : null;
}

function classifyOwner(source) {
  if (/principal\.subjectId/.test(source)) return "authenticated principal";
  if (/(studentId|authorId|sellerId|userId|email).*(searchParams|body)|(?:searchParams|body).*?(studentId|authorId|sellerId|userId|email)/s.test(source)) {
    return "client field / review required";
  }
  return "public or domain-defined";
}

function classifySensitivity(path, method, source) {
  if (/academic|student|personalization|profile|devices|notifications/.test(path)) return "private/user data";
  if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") return "state mutation";
  if (/trustScore|privateContact|personalEmail|phone|bank|location/i.test(source)) return "potential sensitive data";
  return "public/read-only candidate";
}

function classifyAccess(path, auth, permission, action) {
  if (path === "/api/[...path]") return "SERVICE_ONLY";
  if (auth === "anonymous allowed" || auth === "none visible") return "PUBLIC";
  if (permission.startsWith("ADMIN.") || action.includes("ADMIN")) return "ADMIN";
  if (permission === "TRUST.EVALUATE" || action.includes("SOURCE_SYNC")) return "SERVICE_ONLY";
  return "AUTHENTICATED";
}

function escapeCell(value) {
  return String(value).replaceAll("|", "\\|").replaceAll("\n", " ");
}

const rows = [];
for (const file of collectRoutes(apiRoot).sort()) {
  const source = readFileSync(file, "utf8");
  const path = routePath(file);
  for (const declaration of methodSlices(source)) {
    const usesFabric = /SecurityFabric\.wrapHandler/.test(declaration.source);
    const explicit = explicitSecurityContract(source, declaration.method);
    const allowAnonymous = usesFabric
      ? firstMatch(declaration.source, /allowAnonymous\s*:\s*(true|false)/, "false (default)")
      : "unprotected";
    const permission = usesFabric
      ? firstMatch(declaration.source, /requiredPermission\s*:\s*["']([^"']+)["']/)
      : "—";
    const action = usesFabric
      ? firstMatch(declaration.source, /action\s*:\s*["']([^"']+)["']/)
      : "—";
    const auth = explicit
      ? explicit.accessClass === "PUBLIC" ? "anonymous allowed" : "required"
      : usesFabric && allowAnonymous !== "true" ? "required" : allowAnonymous === "true" ? "anonymous allowed" : "none visible";
    const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(declaration.method);
    const accessClass = explicit?.accessClass || classifyAccess(path, auth, permission, action);
    const risk = path === "/api/[...path]"
      ? "allowlisted auth service proxy"
      : explicit
      ? "explicit bootstrap/session contract"
      : auth === "none visible" && isMutation
      ? "P0 review"
      : auth === "none visible"
        ? "P1 review"
        : allowAnonymous === "true" && permission !== "—"
          ? "contract conflict"
          : "policy declared";

    rows.push([
      path,
      declaration.method,
      accessClass,
      auth,
      explicit?.action || action,
      permission,
      classifyOwner(`${declaration.source}\n${source}`),
      explicit ? `${explicit.maxRequests}/minute declared` : usesFabric ? "default/configured" : "none visible",
      explicit ? `${explicit.maxBodyBytes} bytes` : usesFabric
        ? `${firstMatch(declaration.source, /maxBodyBytes\s*:\s*([^,\n}]+)/, "262144")} bytes`
        : path === "/api/[...path]" ? "65536 bytes" : "not enforced",
      /zod|safeParse|\.parse\(/.test(declaration.source) ? "schema parser" : "manual/none",
      classifySensitivity(path, declaration.method, declaration.source),
      risk
    ]);
  }
}

const counts = rows.reduce((acc, row) => {
  acc.methods += 1;
  if (row[3] === "required") acc.authenticated += 1;
  if (row[3] === "anonymous allowed") acc.anonymous += 1;
  if (row[3] === "none visible") acc.unprotected += 1;
  if (row[11] === "P0 review") acc.p0 += 1;
  return acc;
}, { methods: 0, authenticated: 0, anonymous: 0, unprotected: 0, p0: 0 });

const header = `# API Authorization Inventory\n\nGenerated from source by \`npm run audit:api-auth\` on ${new Date().toISOString()}. This is a triage inventory, not a security certification. Dynamic ownership and data sensitivity still require human review.\n\n- Route files: ${collectRoutes(apiRoot).length}\n- HTTP handlers: ${counts.methods}\n- Authentication required by Security Fabric: ${counts.authenticated}\n- Explicit anonymous access: ${counts.anonymous}\n- No visible Security Fabric wrapper: ${counts.unprotected}\n- Unprotected mutations requiring P0 review: ${counts.p0}\n\n| Route | Method | Access class | Authentication | Action | Permission | Resource owner | Rate limit | Request size | Schema | Sensitive output/state | Review |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n`;
const table = rows.map((row) => `| ${row.map(escapeCell).join(" | ")} |`).join("\n");
const footer = `\n\n## Interpretation\n\n- \`none visible\` means the route itself has no Security Fabric wrapper; protection elsewhere was not assumed.\n- \`Access class\` assigns every handler exactly one external contract: \`PUBLIC\`, \`AUTHENTICATED\`, \`ADMIN\`, or \`SERVICE_ONLY\`.\n- The catch-all route is \`SERVICE_ONLY\`: only the four allowlisted authentication contracts may be forwarded and all other path/method pairs fail closed.\n- \`contract conflict\` means anonymous access is enabled while a permission is declared, so the permission does not protect anonymous callers.\n- \`client field / review required\` identifies a possible BOLA/authority boundary; it is not proof of exploitation.\n- Every private or mutating handler must ultimately have schema validation, authenticated server-derived ownership, a policy decision, rate limiting, and runtime negative tests.\n`;

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${header}${table}${footer}`, "utf8");
console.log(`Wrote ${relative(root, outputPath)} with ${counts.methods} handlers.`);
