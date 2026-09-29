export function assertCommunityDemoModeAllowed({
  nodeEnv = process.env.NODE_ENV,
  productionBuild = false,
  demoFlag = process.env.STUDENTHUB_COMMUNITY_DEMO,
  persistenceAdapter = process.env.STUDENTHUB_PERSISTENCE_ADAPTER,
} = {}) {
  const demoRequested = demoFlag === "true" || persistenceAdapter === "memory";
  if ((nodeEnv === "production" || productionBuild) && demoRequested) {
    throw new Error("[DEMO_GATE_CHECK] Community demo fixtures and the memory adapter are forbidden in production builds.");
  }
  return demoRequested;
}

export function isCommunityDemoMode() {
  const demoRequested = assertCommunityDemoModeAllowed();
  return process.env.NODE_ENV === "test" || (process.env.NODE_ENV !== "production" && demoRequested);
}
