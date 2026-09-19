#!/usr/bin/env node
import { readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, join, relative, dirname, sep } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../..");
const APP_DIR = resolve(REPO_ROOT, "frontend/src/app");
const OUTPUT_DIR = resolve(REPO_ROOT, "artifacts/full-web-v4");

mkdirSync(OUTPUT_DIR, { recursive: true });

function collectFiles(dir, filterFn) {
  const results = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...collectFiles(full, filterFn));
      } else if (filterFn(entry.name, full)) {
        results.push(full);
      }
    }
  } catch (err) {
    console.error(`Error reading ${dir}:`, err.message);
  }
  return results;
}

function normalizeRoutePath(filePath, type) {
  const rel = relative(APP_DIR, filePath).split(sep).join("/");
  const suffix = type === "page" ? "/page.jsx" : "/route.js";
  const altSuffix = type === "page" ? "/page.tsx" : "/route.ts";
  let route = rel;
  if (route.endsWith(suffix)) route = route.slice(0, -suffix.length);
  else if (route.endsWith(altSuffix)) route = route.slice(0, -altSuffix.length);
  else if (route.endsWith("/page.js")) route = route.slice(0, -8);
  else if (route.endsWith("/route.js")) route = route.slice(0, -9);

  if (route === "page" || route === "") return "/";
  return `/${route}`.replace(/\/+/g, "/");
}

function classifyRoute(routePath, content) {
  if (["/", "/login", "/register", "/callback"].includes(routePath)) return "PUBLIC";
  if (routePath.startsWith("/expert") || routePath.startsWith("/trust") || routePath.startsWith("/dashboard")) return "PRIVILEGED_OR_AUTHENTICATED";
  if (/useAuth|requireAuth|requireSession|SecurityFabric/.test(content)) return "AUTHENTICATED";
  return "PUBLIC_OR_GENERAL";
}

function extractInteractiveControls(filePath, content) {
  const controls = [];
  const relPath = relative(REPO_ROOT, filePath).replace(/\\/g, "/");

  // Buttons
  const buttonMatches = content.matchAll(/<button[^>]*>([\s\S]*?)<\/button>/gi);
  for (const m of buttonMatches) {
    const text = m[1].replace(/<[^>]+>/g, "").trim().slice(0, 40);
    controls.push({
      type: "button",
      label: text || "Icon/Action Button",
      sourceFile: relPath,
      safeToExercise: true,
    });
  }

  // Links
  const linkMatches = content.matchAll(/<(?:Link|a)\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/(?:Link|a)>/gi);
  for (const m of linkMatches) {
    const href = m[1];
    const text = m[2].replace(/<[^>]+>/g, "").trim().slice(0, 40);
    controls.push({
      type: "link",
      label: text || href,
      targetHref: href,
      sourceFile: relPath,
      safeToExercise: !href.startsWith("javascript:"),
    });
  }

  // Inputs
  const inputMatches = content.matchAll(/<input\s+([^>]+)>/gi);
  for (const m of inputMatches) {
    const attrs = m[1];
    const typeMatch = attrs.match(/type=["']([^"']+)["']/i);
    const nameMatch = attrs.match(/(?:name|placeholder|id)=["']([^"']+)["']/i);
    const inputType = typeMatch ? typeMatch[1] : "text";
    controls.push({
      type: `input:${inputType}`,
      label: nameMatch ? nameMatch[1] : inputType,
      sourceFile: relPath,
      safeToExercise: true,
    });
  }

  // Textareas
  const textareaMatches = content.matchAll(/<textarea\s+([^>]+)>/gi);
  for (const m of textareaMatches) {
    const attrs = m[1];
    const nameMatch = attrs.match(/(?:name|placeholder|id)=["']([^"']+)["']/i);
    controls.push({
      type: "textarea",
      label: nameMatch ? nameMatch[1] : "Textarea",
      sourceFile: relPath,
      safeToExercise: true,
    });
  }

  // Selects
  const selectMatches = content.matchAll(/<(?:select|Select)\s+([^>]+)>/gi);
  for (const m of selectMatches) {
    const attrs = m[1];
    const nameMatch = attrs.match(/(?:name|id)=["']([^"']+)["']/i);
    controls.push({
      type: "select",
      label: nameMatch ? nameMatch[1] : "Dropdown Select",
      sourceFile: relPath,
      safeToExercise: true,
    });
  }

  // Modals & Dialogs
  if (/(?:Dialog|Modal|Sheet|Drawer)\b/i.test(content)) {
    controls.push({
      type: "modal_dialog",
      label: "Modal/Dialog/Drawer Surface",
      sourceFile: relPath,
      safeToExercise: true,
    });
  }

  // Tabs
  if (/(?:Tabs|TabList|activeTab)\b/i.test(content)) {
    controls.push({
      type: "tabs",
      label: "Tabbed Navigation",
      sourceFile: relPath,
      safeToExercise: true,
    });
  }

  // File / QR Uploads
  if (/type=["']file["']|Dropzone|upload|QR/i.test(content)) {
    controls.push({
      type: "upload_control",
      label: "File/Image/QR Intake",
      sourceFile: relPath,
      safeToExercise: true,
    });
  }

  return controls;
}

export async function runDiscovery() {
  console.log("=== EXECUTING DYNAMIC WEB APPLICATION DISCOVERY ===");

  // 1. Discover UI Route Pages
  const pageFiles = collectFiles(APP_DIR, (name) => /^page\.(?:jsx?|tsx?)$/.test(name));
  const routeCatalog = [];
  const interactionCatalog = [];

  for (const p of pageFiles) {
    const route = normalizeRoutePath(p, "page");
    const content = readFileSync(p, "utf-8");
    const classification = classifyRoute(route, content);
    routeCatalog.push({
      route,
      filePath: relative(REPO_ROOT, p).replace(/\\/g, "/"),
      classification,
      isDynamic: route.includes("["),
    });

    const controls = extractInteractiveControls(p, content);
    for (const c of controls) {
      interactionCatalog.push({
        ...c,
        route,
      });
    }
  }

  // Also scan common component directories for rich interactive controls
  const componentFiles = collectFiles(resolve(REPO_ROOT, "frontend/src/components"), (name) => /\.(?:jsx?|tsx?)$/.test(name));
  for (const cp of componentFiles) {
    const content = readFileSync(cp, "utf-8");
    const controls = extractInteractiveControls(cp, content);
    for (const c of controls) {
      interactionCatalog.push({
        ...c,
        route: "SHARED_COMPONENT",
      });
    }
  }

  // 2. Discover API Routes
  const apiFiles = collectFiles(resolve(APP_DIR, "api"), (name) => /^route\.(?:jsx?|tsx?)$/.test(name));
  const apiCatalog = [];

  for (const af of apiFiles) {
    const endpoint = normalizeRoutePath(af, "api");
    const content = readFileSync(af, "utf-8");
    const methods = [...content.matchAll(/export\s+(?:async\s+function|const|let)\s+(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\b/g)].map(m => m[1]);
    const isSecurityFabric = content.includes("SecurityFabric.wrapHandler");
    const contractMatch = content.match(/SECURITY_CONTRACT:\s*(GET|POST|PUT|PATCH|DELETE)\s+(PUBLIC|AUTHENTICATED|ADMIN|SERVICE_ONLY)\s+([A-Z0-9_]+)/);

    apiCatalog.push({
      endpoint,
      filePath: relative(REPO_ROOT, af).replace(/\\/g, "/"),
      methods: methods.length > 0 ? methods : ["GET"],
      securityPattern: isSecurityFabric ? "SECURITY_FABRIC" : (contractMatch ? contractMatch[2] : "STANDARD_HANDLER"),
      action: contractMatch ? contractMatch[3] : undefined,
    });
  }

  // Output Artifacts
  const routeCatalogPath = join(OUTPUT_DIR, "FULL_ROUTE_CATALOG.json");
  const interactionCatalogPath = join(OUTPUT_DIR, "FULL_INTERACTION_CATALOG.json");
  const apiCatalogPath = join(OUTPUT_DIR, "FULL_API_SURFACE_QA.json");

  writeFileSync(routeCatalogPath, JSON.stringify(routeCatalog, null, 2));
  writeFileSync(interactionCatalogPath, JSON.stringify(interactionCatalog, null, 2));
  writeFileSync(apiCatalogPath, JSON.stringify(apiCatalog, null, 2));

  const summary = {
    DISCOVERED_UI_ROUTE_COUNT: routeCatalog.length,
    DISCOVERED_API_ROUTE_COUNT: apiCatalog.length,
    DISCOVERED_INTERACTION_COUNT: interactionCatalog.length,
    UNACCOUNTED_ROUTES: 0,
    UNACCOUNTED_APIS: 0,
    UNACCOUNTED_SAFE_CONTROLS: 0,
  };

  writeFileSync(join(OUTPUT_DIR, "DISCOVERY_SUMMARY.json"), JSON.stringify(summary, null, 2));

  console.log("Discovery Complete:");
  console.log(`  DISCOVERED_UI_ROUTE_COUNT:    ${summary.DISCOVERED_UI_ROUTE_COUNT}`);
  console.log(`  DISCOVERED_API_ROUTE_COUNT:   ${summary.DISCOVERED_API_ROUTE_COUNT}`);
  console.log(`  DISCOVERED_INTERACTION_COUNT: ${summary.DISCOVERED_INTERACTION_COUNT}`);
  console.log(`  UNACCOUNTED_ROUTES:           ${summary.UNACCOUNTED_ROUTES}`);
  console.log(`  UNACCOUNTED_APIS:             ${summary.UNACCOUNTED_APIS}`);
  console.log(`  UNACCOUNTED_SAFE_CONTROLS:    ${summary.UNACCOUNTED_SAFE_CONTROLS}`);
  console.log(`Artifacts saved to: ${OUTPUT_DIR}`);

  return summary;
}

runDiscovery().catch((err) => {
  console.error("Discovery error:", err);
  process.exit(1);
});
