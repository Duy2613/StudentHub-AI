import { createApiProviderBundle, createProvider } from "./providerFactory";

function configuredMode() {
  // A production bundle always uses live adapters. Demo fixtures remain
  // available to isolated development/contract tests, but an environment
  // flag must never turn the deployed application into a fake data surface.
  if (process.env.NODE_ENV === "production") return "LIVE";
  const configured = process.env.NEXT_PUBLIC_STUDENTHUB_PROVIDER_MODE;
  if (configured === "DEMO" || configured === "LIVE") return configured;
  if (process.env.NEXT_PUBLIC_COMPETITION_DEMO === "true") return "DEMO";
  return "LIVE";
}

export const RUNTIME_PROVIDER_MODE = configuredMode();

let cachedBundle;

/**
 * Resolve the source mode once per browser module graph. LIVE uses the
 * approved same-origin adapter; a transport failure is returned as a typed
 * unavailable/error result and never changes this selection to DEMO.
 */
export function getRuntimeProviderBundle() {
  if (cachedBundle) return cachedBundle;
  cachedBundle = RUNTIME_PROVIDER_MODE === "DEMO"
    ? createProvider("DEMO")
    : createApiProviderBundle();
  return cachedBundle;
}

export function getRuntimeProviderSelection() {
  const provider = getRuntimeProviderBundle();
  return Object.freeze({
    requestedMode: RUNTIME_PROVIDER_MODE,
    sourceMode: provider.sourceMode,
    availability: provider.availability,
    provider,
  });
}

