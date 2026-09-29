/**
 * StudentHub AI v4 product-scope registry.
 * Removed product routes are retired at the frontend boundary; backend
 * contracts remain available until a separately authorized API migration.
 */

export const REMOVED_PRODUCT_FEATURES = Object.freeze([
  Object.freeze({
    featureId: "dashboard",
    name: "Dashboard",
    status: "REMOVED_FROM_PRODUCT_SCOPE",
    formerRoutes: ["/dashboard"],
    navigationExposure: "Removed from canonical, shell, mobile, landing, and legacy utility navigation; shell brand now points to /.",
    omniExposure: {
      entries: ["dash-1"],
      searchTerms: ["dashboard", "tổng quan", "command center"],
    },
    sharedRuntimeExposure: "RealtimeLiveConsole is no longer mounted in the active app shell. Presence and telemetry channels are no longer requested globally.",
    testOwnership: {
      classification: "REMOVED_FEATURE_TEST",
      manifest: "frontend/tests/test-scope-classification.json",
      files: [
        "academic/academic_action_intent.test.mjs", "academic/academic_ai_failure_fallback.test.mjs", "academic/academic_command_center_ui.test.mjs",
        "academic/academic_deadline_engine.test.mjs", "academic/academic_decision_e2e.test.mjs", "academic/academic_decision_mutation.test.mjs",
        "academic/academic_decision_staleness.test.mjs", "academic/academic_decision_studio.test.mjs", "academic/academic_execution_e2e.test.mjs",
        "academic/academic_execution_mutation.test.mjs", "academic/academic_execution_reconciliation.test.mjs", "academic/academic_execution_staleness.test.mjs",
        "academic/academic_execution_ui.test.mjs", "academic/academic_milestone_model.test.mjs", "academic/academic_notification_completion_stop.test.mjs",
        "academic/academic_notification_deduplication.test.mjs", "academic/academic_notification_e2e.test.mjs", "academic/academic_notification_policy.test.mjs",
        "academic/academic_notification_reconciliation.test.mjs", "academic/academic_notification_scheduler.test.mjs", "academic/academic_notification_state_machine.test.mjs",
        "academic/academic_notification_store.test.mjs", "academic/academic_plan_adoption.test.mjs", "academic/academic_plan_comparison.test.mjs",
        "academic/academic_plan_drift.test.mjs", "academic/academic_planner_constraints.test.mjs", "academic/academic_planner_e2e.test.mjs",
        "academic/academic_planner_mutation.test.mjs", "academic/academic_planner_ranking.test.mjs", "academic/academic_planner_staleness.test.mjs",
        "academic/academic_source_deadline_reminder.test.mjs", "academic/academic_source_watcher.test.mjs", "academic/academic_student_impact.test.mjs",
        "academic/academic_task_model.test.mjs", "academic/academic_tradeoff_engine.test.mjs", "academic/academic_twin_workflow_reconciliation.test.mjs",
        "academic/academic_workflow_concurrency.test.mjs", "academic/academic_workflow_e2e.test.mjs", "academic/academic_workflow_persistence.test.mjs",
        "academic/academic_workflow_reconciliation.test.mjs", "academic/academic_workflow_restart.test.mjs", "academic/academic_workflow_state.test.mjs",
        "academic/academic_timetable_ai_import.test.mjs", "academic/academic_timetable_confirm.test.mjs", "academic/academic_timetable_contract.test.mjs",
        "academic/academic_timetable_idempotency.test.mjs", "academic/academic_timetable_manual.test.mjs", "academic/academic_timetable_realtime.test.mjs",
      ],
    },
    replacementRoute: null,
    routeDisposition: "NOT_FOUND",
    notes: "No active v4 route represents the former personal academic dashboard. Dashboard API handlers are retained; no backend contract was changed.",
  }),
  Object.freeze({
    featureId: "learning",
    name: "Learning",
    status: "REMOVED_FROM_PRODUCT_SCOPE",
    formerRoutes: ["/learn", "/learn/[courseId]/[lessonId]", "/roadmap", "/quests", "/practice"],
    navigationExposure: "Removed from canonical desktop/mobile and shell navigation; landing surfaces use the three active core destinations.",
    omniExposure: {
      entries: ["learn-1", "learn-2", "ai-1"],
      searchTerms: ["learning", "học tập", "course", "khóa học", "lesson", "bài giảng", "practice", "luyện tập", "roadmap", "lộ trình học vụ", "quest", "focus mode", "ai tutor"],
    },
    sharedRuntimeExposure: "The global academic realtime channel and academic:timetable.updated handler were removed. Unknown /academic remains isolated from the globally mounted provider.",
    testOwnership: {
      classification: "REMOVED_FEATURE_TEST",
      manifest: "frontend/tests/test-scope-classification.json",
      files: [
        "academic/academic_course_records.test.mjs", "academic/academic_prerequisite_engine.test.mjs", "academic/academic_roadmap_curriculum.test.mjs",
        "academic/academic_roadmap_e2e.test.mjs", "academic/academic_roadmap_generation.test.mjs", "academic/academic_roadmap_mutation.test.mjs",
        "academic/academic_roadmap_twin_change.test.mjs", "academic/academic_roadmap_versioning.test.mjs", "academic/academic_roadmap_workflow_link.test.mjs",
        "academic/academic_semester_planner.test.mjs", "academic/academic_simulation_e2e.test.mjs", "academic/academic_simulation_engine.test.mjs",
        "academic/academic_simulation_mutation.test.mjs", "academic/academic_simulation_property.test.mjs", "academic/academic_simulation_revision.test.mjs",
        "academic/academic_simulation_side_effects.test.mjs",
      ],
    },
    replacementRoute: null,
    routeDisposition: "NOT_FOUND",
    notes: "Course, lesson, practice, roadmap, and gamified learning routes have no canonical v4 replacement. Academic and profile APIs remain untouched.",
  }),
  Object.freeze({
    featureId: "scholarships",
    name: "Scholarships",
    status: "REMOVED_FROM_PRODUCT_SCOPE",
    formerRoutes: ["/scholarships"],
    navigationExposure: "Removed from canonical navigation and active shell menus.",
    omniExposure: {
      entries: ["tool-1"],
      searchTerms: ["scholarship", "scholarships", "học bổng"],
    },
    sharedRuntimeExposure: "No scholarship-specific provider is mounted globally. Scholarship API handlers remain unchanged.",
    testOwnership: { classification: "NO_EXCLUSIVE_TESTS_IDENTIFIED", files: [], note: "Authorization coverage remains in shared route and security suites." },
    replacementRoute: null,
    routeDisposition: "NOT_FOUND",
    notes: "Trust may verify scholarship claims, but it is not a replacement for a scholarship discovery product.",
  }),
  Object.freeze({
    featureId: "tuition-radar",
    name: "Tuition Radar",
    status: "REMOVED_FROM_PRODUCT_SCOPE",
    formerRoutes: ["/tuition-radar"],
    navigationExposure: "Removed from canonical navigation and active shell menus.",
    omniExposure: {
      entries: ["tool-2"],
      searchTerms: ["tuition radar", "tuition", "học phí", "công nợ"],
    },
    sharedRuntimeExposure: "No tuition-specific provider is mounted globally. Tuition API contracts were not changed.",
    testOwnership: { classification: "NO_EXCLUSIVE_TESTS_IDENTIFIED", files: [], note: "No frontend test was proven exclusive to this removed route." },
    replacementRoute: null,
    routeDisposition: "NOT_FOUND",
    notes: "The previous redirect to /academic was not a canonical v4 replacement and has been removed.",
  }),
  Object.freeze({
    featureId: "safety-map",
    name: "Safety Map",
    status: "REMOVED_FROM_PRODUCT_SCOPE",
    formerRoutes: ["/safety-map"],
    navigationExposure: "Removed from legacy utility navigation and active shell menus.",
    omniExposure: {
      entries: ["tool-3"],
      searchTerms: ["safety map", "bản đồ an toàn", "an toàn khu vực"],
    },
    sharedRuntimeExposure: "No geospatial or safety-map provider is mounted globally. Safety-report API handlers remain unchanged.",
    testOwnership: { classification: "NO_EXCLUSIVE_TESTS_IDENTIFIED", files: [], note: "Geospatial test ownership remains UNKNOWN and is not excluded." },
    replacementRoute: null,
    routeDisposition: "NOT_FOUND",
    notes: "Trust remains a valid place to verify safety claims; it is not a replacement for the former map product.",
  }),
  Object.freeze({
    featureId: "sos",
    name: "SOS",
    status: "REMOVED_FROM_PRODUCT_SCOPE",
    formerRoutes: ["/sos"],
    navigationExposure: "Removed from desktop legacy utilities and mobile quick actions.",
    omniExposure: {
      entries: ["tool-4"],
      searchTerms: ["sos", "emergency", "khẩn cấp", "hotline"],
    },
    sharedRuntimeExposure: "No SOS handler or emergency geolocation workflow is mounted globally. SOS API handlers remain unchanged.",
    testOwnership: { classification: "NO_EXCLUSIVE_TESTS_IDENTIFIED", files: [], note: "Emergency API authorization tests remain visible in shared route coverage." },
    replacementRoute: null,
    routeDisposition: "NOT_FOUND",
    notes: "No emergency-service replacement is implied by the active three-core product.",
  }),
]);

export const LEGACY_ROUTE_REVIEW = Object.freeze([
  Object.freeze({ route: "/roadmap", classification: "REMOVED_ALIAS", featureId: "learning", currentBehavior: "Next.js not-found", routeDisposition: "NOT_FOUND", rationale: "Learning roadmap alias; no real v4 replacement." }),
  Object.freeze({ route: "/quests", classification: "REMOVED_ALIAS", featureId: "learning", currentBehavior: "Next.js not-found", routeDisposition: "NOT_FOUND", rationale: "Gamified learning progression is removed." }),
  Object.freeze({ route: "/practice", classification: "REMOVED_ALIAS", featureId: "learning", currentBehavior: "Next.js not-found", routeDisposition: "NOT_FOUND", rationale: "Learning practice route; no real v4 replacement." }),
  Object.freeze({ route: "/intelligence/knowledge", classification: "REMOVED_ALIAS", featureId: "learning", currentBehavior: "Next.js not-found", routeDisposition: "NOT_FOUND", rationale: "Standalone Knowledge Universe is removed; Trust is not a semantically equivalent redirect target." }),
  Object.freeze({ route: "/forum", classification: "KNOWN_ALIAS", featureId: null, currentBehavior: "Server redirect to /community", routeDisposition: "REDIRECT_TO_REAL_REPLACEMENT", rationale: "Forum discussions map directly to the active Community destination." }),
  Object.freeze({ route: "/ultra", classification: "UNKNOWN", featureId: null, currentBehavior: "Next.js redirect to /cases", routeDisposition: null, rationale: "The legacy Ultra entry resolves to the retained case studio, whose ownership is still under review; preserve both behaviors pending a product decision." }),
  Object.freeze({ route: "/marketplace", classification: "UNKNOWN", featureId: null, currentBehavior: "Existing Next.js redirect to /community retained", routeDisposition: null, rationale: "Marketplace meaning and Community equivalence need a product decision; preserve current behavior pending review." }),
  Object.freeze({ route: "/academic", classification: "UNKNOWN", featureId: null, currentBehavior: "Existing dynamic academic workspace retained", routeDisposition: null, rationale: "The route's relationship to the active three-core scope is not established; do not remove blindly." }),
  Object.freeze({ route: "/credit-scheduler", classification: "UNKNOWN", featureId: null, currentBehavior: "Next.js not-found", routeDisposition: "NOT_FOUND", rationale: "Credit scheduler ownership and any replacement are unconfirmed; do not redirect to the removed Dashboard." }),
  Object.freeze({ route: "/prof-rating", classification: "UNKNOWN", featureId: null, currentBehavior: "Next.js not-found", routeDisposition: "NOT_FOUND", rationale: "No canonical profile-rating surface or approved Expert replacement exists." }),
  Object.freeze({ route: "/academic-showcase", classification: "UNKNOWN", featureId: null, currentBehavior: "Existing showcase page retained", routeDisposition: null, rationale: "Demo/showcase ownership is unclear; preserve pending a product decision." }),
  Object.freeze({ route: "/cases", classification: "UNKNOWN", featureId: null, currentBehavior: "Existing case studio page retained", routeDisposition: null, rationale: "Case studio may be Trust-related, but v4 route ownership needs a product decision." }),
]);

export const DECOMMISSIONED_ROUTE_PATHS = Object.freeze([
  ...REMOVED_PRODUCT_FEATURES.flatMap((feature) => feature.formerRoutes),
  ...LEGACY_ROUTE_REVIEW.filter((item) => item.classification === "REMOVED_ALIAS").map((item) => item.route),
]);

export const REMOVED_OMNI_TERMS = Object.freeze(
  [...new Set(REMOVED_PRODUCT_FEATURES.flatMap((feature) => feature.omniExposure.searchTerms))],
);

export function isDecommissionedRoute(href) {
  if (typeof href !== "string") return false;
  const pathname = href.split(/[?#]/, 1)[0].replace(/\/$/, "") || "/";
  return DECOMMISSIONED_ROUTE_PATHS.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function containsRemovedOmniTerm(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return REMOVED_OMNI_TERMS.some((term) => normalized.includes(term));
}
