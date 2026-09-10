/**
 * Dynamic Runtime Capability Controller
 * Governs progressive enhancement levels 0 to 4.
 * Never defaults desktop blindly to Level 4.
 */

export type CapabilityLevel = 0 | 1 | 2 | 3 | 4;

type NavigatorWithConnection = Navigator & {
  connection?: {
    saveData?: boolean;
    effectiveType?: string;
  };
};

export function resolveAdaptiveRuntimeLevel(): CapabilityLevel {
  if (typeof window === 'undefined') return 0;

  // Level 1 Override: User prefers reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return 1;
  }

  // Level 0 Override: Data Saver active or network is 2G
  const conn = (navigator as NavigatorWithConnection).connection;
  if (conn && (conn.saveData || conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g')) {
    return 0;
  }

  // Level 2 Cap: Mobile & Tablet viewports (preserving battery and thermals)
  if (window.innerWidth < 1024) {
    return 2;
  }

  // Level 4 Check: Probe WebGL availability
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return 2;
  } catch {
    return 2;
  }

  // Default Desktop Baseline (Video Loops allowed, WebGL gated)
  return 3;
}
