const PREFIX = "expert-v4";

/**
 * Test-only User Timing hook. The browser test harness enables it on a single
 * page via document.documentElement.dataset.expertPerfHarness. Normal product
 * sessions create no marks, send no analytics, and load no fixture data.
 */
export function markExpertV4Timing(metric) {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const harnessEnabled = document.documentElement?.dataset?.expertPerfHarness === "true"
    || window.__expertV4PerfHarness === true;
  if (!harnessEnabled) return;
  if (!window.performance?.mark) return;

  const name = `${PREFIX}:${metric}`;
  if (window.performance.getEntriesByName(name, "mark").length) return;
  window.performance.mark(name);
}
