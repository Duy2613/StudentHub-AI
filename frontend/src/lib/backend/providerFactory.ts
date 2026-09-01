import {
  createDemoProviderBundle,
  DemoProvider,
} from "./providers/DemoProvider";
import {
  createFutureLiveProviderBundle,
  FutureLiveProvider,
} from "./providers/FutureLiveProvider";
import {
  PROVIDER_MODE_VALUES,
  type ProviderBundle,
  type ProviderMode,
} from "./ports";
import { ApiProviderAdapter, type ApiProviderTransport } from "./adapters/ApiProviderAdapter";

export type ProviderFactoryOptions = Readonly<{
  demoProvider?: ProviderBundle;
  liveProvider?: ProviderBundle;
  unavailableDependency?: string;
}>;

export type ProviderSelection = Readonly<{
  requestedMode: ProviderMode;
  sourceMode: "DEMO" | "LIVE" | "UNAVAILABLE";
  availability: "AVAILABLE" | "UNAVAILABLE";
  provider: ProviderBundle;
}>;

function isProviderMode(value: unknown): value is ProviderMode {
  return typeof value === "string" && (PROVIDER_MODE_VALUES as readonly string[]).includes(value);
}

function assertBundleMode(bundle: ProviderBundle, mode: ProviderMode): void {
  if (bundle.mode !== mode) throw new TypeError(`Provider bundle mode must be ${mode}.`);
}

export function createProvider(mode: ProviderMode, options: ProviderFactoryOptions = {}): ProviderBundle {
  if (!isProviderMode(mode)) throw new TypeError("Provider mode must be explicitly DEMO or LIVE.");
  const supplied = mode === "DEMO" ? options.demoProvider : options.liveProvider;
  if (supplied) {
    assertBundleMode(supplied, mode);
    return supplied;
  }
  return mode === "DEMO" ? createDemoProviderBundle() : createFutureLiveProviderBundle(options.unavailableDependency);
}

export function selectProvider(mode: ProviderMode, options: ProviderFactoryOptions = {}): ProviderSelection {
  const provider = createProvider(mode, options);
  return Object.freeze({
    requestedMode: mode,
    sourceMode: provider.sourceMode,
    availability: provider.availability,
    provider,
  });
}

export function createApiProviderBundle(transport: Partial<ApiProviderTransport> = {}): ProviderBundle {
  const provider = new ApiProviderAdapter(transport);
  return Object.freeze({
    mode: "LIVE" as const,
    sourceMode: "LIVE" as const,
    availability: "AVAILABLE" as const,
    trust: provider,
    community: provider,
    expert: provider,
    passport: provider,
  });
}

export { ApiProviderAdapter, DemoProvider, FutureLiveProvider, createDemoProviderBundle, createFutureLiveProviderBundle };
