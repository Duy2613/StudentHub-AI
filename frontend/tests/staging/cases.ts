import { readFileSync } from "node:fs";

export type StagingCase = {
  type: "text" | "url";
  value: string;
  expected?: string;
  expectedProviderStatuses?: Array<"clean" | "findings" | "unknown" | "error" | "unavailable">;
  expectedErrorFragment?: string;
};

export type StagingCases = {
  suspicious: StagingCase;
  benign: StagingCase;
  invalid: StagingCase;
  partial: StagingCase;
  insufficient: StagingCase;
  failure: StagingCase;
};

const path = process.env.STUDENTHUB_STAGING_CASES_PATH;
if (!path) throw new Error("STAGING_E2E_BLOCKED_BY_ENV: STUDENTHUB_STAGING_CASES_PATH is required");
const parsed = JSON.parse(readFileSync(path, "utf8")) as Partial<StagingCases>;
for (const key of ["suspicious", "benign", "invalid", "partial", "insufficient", "failure"] as const) {
  if (!parsed[key]?.value || !["text", "url"].includes(parsed[key]?.type || "")) {
    throw new Error(`STAGING_E2E_BLOCKED_BY_ENV: invalid or missing staging case '${key}'`);
  }
}
export const stagingCases = parsed as StagingCases;
