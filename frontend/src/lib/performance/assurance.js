// Lightweight, browser-only User Timing helpers used by release assurance
// traces. They are no-ops during SSR and never affect product state.
export function markAssurance(name, detail) {
  if (typeof window === "undefined" || typeof globalThis.performance?.mark !== "function") return;
  try {
    if (detail === undefined) globalThis.performance.mark(name);
    else globalThis.performance.mark(name, { detail });
  } catch {
    // Performance marks are diagnostic only; an unsupported browser must not
    // change the user-visible path.
  }
}

export function measureAssurance(name, startMark, endMark) {
  if (typeof window === "undefined" || typeof globalThis.performance?.measure !== "function") return;
  try {
    globalThis.performance.measure(name, startMark, endMark);
  } catch {
    // The end mark may be absent when an optional enhancement fails to load.
  }
}
