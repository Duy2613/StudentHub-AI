import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import {
  LEGACY_ROUTE_REVIEW,
  REMOVED_PRODUCT_FEATURES,
  containsRemovedOmniTerm,
  isDecommissionedRoute,
} from "../../src/config/productScopeRegistry.js";

const frontendRoot = process.cwd().endsWith("frontend") ? process.cwd() : join(process.cwd(), "frontend");

test("v4 registry lists all six removed features with honest route disposition", () => {
  assert.deepEqual(REMOVED_PRODUCT_FEATURES.map((feature) => feature.featureId), [
    "dashboard",
    "learning",
    "scholarships",
    "tuition-radar",
    "safety-map",
    "sos",
  ]);
  for (const feature of REMOVED_PRODUCT_FEATURES) {
    assert.equal(feature.status, "REMOVED_FROM_PRODUCT_SCOPE", feature.featureId);
    assert.equal(feature.routeDisposition, "NOT_FOUND", feature.featureId);
    assert.equal(feature.replacementRoute, null, feature.featureId);
    assert.ok(feature.navigationExposure);
    assert.ok(feature.omniExposure);
    assert.ok(feature.sharedRuntimeExposure);
    assert.ok(feature.testOwnership);
    assert.ok(feature.notes);
  }

  const classification = JSON.parse(readFileSync(join(frontendRoot, "tests/test-scope-classification.json"), "utf8"));
  for (const feature of REMOVED_PRODUCT_FEATURES) {
    const manifestFiles = Object.entries(classification.explicit)
      .filter(([, item]) => item.classification === "REMOVED_FEATURE_TEST" && item.featureId === feature.featureId)
      .map(([file]) => file)
      .sort();
    assert.deepEqual([...feature.testOwnership.files].sort(), manifestFiles, feature.featureId);
  }
});

test("removed page routes call Next notFound instead of rendering feature pages", () => {
  const routeFiles = [
    ["/dashboard", "src/app/dashboard/page.jsx"],
    ["/learn", "src/app/learn/page.jsx"],
    ["/learn/[courseId]/[lessonId]", "src/app/learn/[courseId]/[lessonId]/page.jsx"],
    ["/scholarships", "src/app/scholarships/page.jsx"],
    ["/tuition-radar", "src/app/tuition-radar/page.jsx"],
    ["/safety-map", "src/app/safety-map/page.jsx"],
    ["/sos", "src/app/sos/page.jsx"],
    ["/roadmap", "src/app/roadmap/page.jsx"],
    ["/quests", "src/app/quests/page.jsx"],
    ["/practice", "src/app/practice/page.jsx"],
    ["/intelligence/knowledge", "src/app/intelligence/knowledge/page.jsx"],
  ];

  for (const [route, file] of routeFiles) {
    const source = readFileSync(join(frontendRoot, file), "utf8");
    assert.match(source, /import\s+\{\s*notFound\s*\}\s+from\s+["']next\/navigation["']/i, route);
    assert.match(source, /\bnotFound\s*\(\s*\)/, route);
    assert.doesNotMatch(source, /<\w+|router\.(?:push|replace)|redirect\(/, route);
  }
});

test("canonical navigation and Omni source contain no removed feature routes", () => {
  const navigationSource = readFileSync(join(frontendRoot, "src/config/navigation.ts"), "utf8");
  const searchSource = readFileSync(join(frontendRoot, "src/lib/search/searchProviders.js"), "utf8");
  const exposedUiFiles = [
    "src/app/page.jsx",
    "src/components/layout/AcademicNavbar.jsx",
    "src/components/layout/UnifiedAppShell.jsx",
    "src/components/layout/navigationConfig.js",
    "src/components/navigation/PrimaryNavbar.jsx",
    "src/components/navigation/MobileNavRail.jsx",
    "src/components/margin/MarginRail.jsx",
    "src/components/layout/ModernNavbar.jsx",
    "src/components/auth/UserDropdownMenu.jsx",
    "src/app/not-found.jsx",
    "src/app/register/page.jsx",
    "src/app/onboarding/page.jsx",
    "src/lib/auth/authRedirects.js",
    "src/lib/auth/authService.js",
    "src/lib/ultra/routes.js",
    "src/components/landing/LandingHeader.jsx",
    "src/components/landing/LandingFooter.jsx",
    "src/components/landing/CoreFeaturesSection.jsx",
    "src/components/landing/LivingCampusAtlas.jsx",
    "src/components/layout/CollapsibleSidebar.jsx",
    "src/components/ui/floating-dock.jsx",
  ];

  for (const route of ["/dashboard", "/learn", "/scholarships", "/tuition-radar", "/safety-map", "/sos"]) {
    assert.doesNotMatch(navigationSource, new RegExp(route.replaceAll("/", "\\/")), route);
    assert.doesNotMatch(searchSource, new RegExp(route.replaceAll("/", "\\/")), route);
    assert.equal(isDecommissionedRoute(route), true, route);
    for (const file of exposedUiFiles) {
      const source = readFileSync(join(frontendRoot, file), "utf8");
      assert.doesNotMatch(source, new RegExp(route.replaceAll("/", "\\/")), `${file} ${route}`);
    }
  }

  assert.equal(isDecommissionedRoute("/dashboard/old"), true);
  assert.equal(isDecommissionedRoute("/trust"), false);
  assert.equal(containsRemovedOmniTerm("Scholarships"), true);
  assert.equal(containsRemovedOmniTerm("AI tutor"), true);
  assert.equal(containsRemovedOmniTerm("Evidence-aware Trust"), false);
  assert.match(searchSource, /!isDecommissionedRoute\(item\.href\)/);
  assert.match(searchSource, /!containsRemovedOmniTerm\(searchableText\)/);

  const accountMenu = readFileSync(join(frontendRoot, "src/components/auth/UserDropdownMenu.jsx"), "utf8");
  assert.doesNotMatch(accountMenu, /trustScore\s*\?\?\s*\d+/);
  assert.doesNotMatch(accountMenu, /\{trustScore\}\s*pts/);
});

test("active landing copy does not present fabricated verdicts or live product data", () => {
  const activeLandingFiles = [
    "src/components/cinematic/HeroCinematicPorch.jsx",
    "src/components/cinematic/NoiseToSignalSection.jsx",
    "src/components/cinematic/CinematicReelStage.jsx",
    "src/components/cinematic/TrustCinematicJourney.jsx",
    "src/components/cinematic/WhyZeroManifestoSection.jsx",
    "src/components/cinematic/KnowledgeAtlasSection.jsx",
    "src/components/cinematic/VerifiedHumanAiSection.jsx",
    "src/components/cinematic/CollectiveCommunitySection.jsx",
    "src/components/cinematic/ExpertAuthoritySection.jsx",
    "src/components/spatial/KnowledgeAtlas3D.jsx",
    "src/lib/ultra/routes.js",
  ];
  const activeCopy = activeLandingFiles
    .map((file) => readFileSync(join(frontendRoot, file), "utf8"))
    .join("\n");

  for (const fabricatedSignal of [
    "94%",
    "1,240",
    "28,500",
    "4.9 / 5.0",
    "320+ Hồ sơ",
    "CASE-2026-089",
    "142/QĐ-ĐHQG",
    "LIVE FEED",
    "BLIND REVIEW ACTIVE",
    "REALTIME TOPOLOGY",
    "SHA-256 VERIFIED",
    "Trust Score 0–100",
  ]) {
    assert.ok(!activeCopy.includes(fabricatedSignal), `Unexpected fabricated signal: ${fabricatedSignal}`);
  }

  for (const route of ["/dashboard", "/scholarships", "/tuition-radar", "/safety-map", "/sos", "/quests", "/intelligence/knowledge"]) {
    assert.doesNotMatch(activeCopy, new RegExp(route.replaceAll("/", "\\/")), route);
  }
});

test("shared realtime keeps active channels and drops removed academic shell channels", () => {
  const realtimeSource = readFileSync(join(frontendRoot, "src/components/providers/RealtimeContext.jsx"), "utf8");
  const shellSource = readFileSync(join(frontendRoot, "src/components/layout/UnifiedAppShell.jsx"), "utf8");

  assert.match(realtimeSource, /\["system",\s*"trust",\s*"audit",\s*"community",\s*"expert"\]/);
  assert.doesNotMatch(realtimeSource, /\["[^"]*academic|"academic"|"telemetry"|"presence"/);
  assert.doesNotMatch(realtimeSource, /academic:timetable\.updated|telemetry:tick|presence:update/);
  assert.doesNotMatch(shellSource, /RealtimeLiveConsole/);
});

test("legacy aliases have explicit retained, replacement, removed, or unknown decisions", () => {
  const decisions = new Map(LEGACY_ROUTE_REVIEW.map((item) => [item.route, item]));
  const nextConfig = readFileSync(join(frontendRoot, "next.config.ts"), "utf8");
  for (const route of ["/roadmap", "/quests", "/practice", "/intelligence/knowledge", "/forum", "/ultra", "/marketplace", "/academic", "/credit-scheduler", "/prof-rating", "/academic-showcase", "/cases"]) {
    assert.ok(decisions.has(route), `Missing route disposition for ${route}`);
  }
  assert.doesNotMatch(nextConfig, /source:\s*["']\/(?:quests|intelligence\/knowledge)["']/);
  assert.equal(decisions.get("/forum").routeDisposition, "REDIRECT_TO_REAL_REPLACEMENT");
  assert.equal(decisions.get("/forum").currentBehavior, "Server redirect to /community");
  for (const route of ["/ultra", "/marketplace", "/academic", "/credit-scheduler", "/prof-rating", "/academic-showcase", "/cases"]) {
    assert.equal(decisions.get(route).classification, "UNKNOWN", route);
  }
  assert.equal(decisions.get("/credit-scheduler").routeDisposition, "NOT_FOUND");
  assert.equal(decisions.get("/prof-rating").routeDisposition, "NOT_FOUND");
  assert.equal(decisions.get("/ultra").currentBehavior, "Next.js redirect to /cases");
  assert.doesNotMatch(nextConfig, /source:\s*["']\/prof-rating["']/);
});
