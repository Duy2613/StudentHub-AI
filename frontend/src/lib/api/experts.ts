import { apiRequest } from "./client";
import { z } from "zod";

export type ExpertClaimInput = {
  expertId: string;
  claim: { text: string; domain: string; claimJurisdiction: string };
};

export const expertEvaluationResponseSchema = z.object({
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

const expertListProfileSchema = z.object({
  expertId: z.string().trim().min(1),
  name: z.string().trim().min(1),
}).passthrough();

export const expertListResponseSchema = z.object({
  success: z.literal(true),
  contractVersion: z.literal("experts.v1"),
  data: z.object({
    total: z.number().int().nonnegative(),
    experts: z.array(expertListProfileSchema),
  }).passthrough(),
}).passthrough();

export const expertDetailResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({ expert: expertListProfileSchema }).passthrough(),
}).passthrough();

export type ExpertListQuery = {
  topic?: string;
  domain?: string;
  limit?: number;
  requestId?: string;
};

export function listExperts(query: ExpertListQuery = {}, signal?: AbortSignal) {
  const params = new URLSearchParams();
  if (query.topic?.trim()) params.set("topic", query.topic.trim().slice(0, 160));
  if (query.domain?.trim()) params.set("domain", query.domain.trim().slice(0, 120));
  if (typeof query.limit === "number" && Number.isFinite(query.limit)) params.set("limit", String(Math.min(50, Math.max(1, Math.trunc(query.limit)))));
  const suffix = params.toString();
  return apiRequest<z.infer<typeof expertListResponseSchema>>(`/api/v1/experts${suffix ? `?${suffix}` : ""}`, {
    signal,
    requestId: query.requestId,
    schema: expertListResponseSchema,
  });
}

export function getExpert(expertId: string, signal?: AbortSignal, requestId?: string) {
  return apiRequest<z.infer<typeof expertDetailResponseSchema>>(`/api/intelligence/experts/${encodeURIComponent(expertId)}`, {
    signal,
    requestId,
    schema: expertDetailResponseSchema,
  });
}

export function evaluateExpertClaim(input: ExpertClaimInput, signal?: AbortSignal, requestId?: string) {
  return apiRequest<{ success: boolean; evaluation?: Record<string, unknown> }>("/api/expert/evaluate", {
    method: "POST",
    body: JSON.stringify(input),
    signal,
    requestId,
    schema: expertEvaluationResponseSchema,
  });
}
