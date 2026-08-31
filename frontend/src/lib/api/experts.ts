import { apiRequest } from "./client";
import { z } from "zod";

export type ExpertClaimInput = {
  expertId: string;
  claim: { text: string; domain: string; claimJurisdiction: string };
};

const expertEvaluationResponseSchema = z.object({
  success: z.boolean(),
  evaluation: z.object({
    claimStatus: z.string().optional(),
    explanation: z.string().optional(),
    expertConsensus: z.object({
      reviewCount: z.number().int().nonnegative(),
      agreement: z.string().optional(),
      disagreementLevel: z.string(),
    }).passthrough().optional(),
  }).passthrough().optional(),
}).passthrough();

export function evaluateExpertClaim(input: ExpertClaimInput, signal?: AbortSignal) {
  return apiRequest<{ success: boolean; evaluation?: Record<string, unknown> }>("/api/expert/evaluate", {
    method: "POST",
    body: JSON.stringify(input),
    signal,
    schema: expertEvaluationResponseSchema,
  });
}
