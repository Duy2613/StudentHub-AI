import { z } from "zod";
import { apiRequest } from "./client.ts";

export const communityPostSchema = z.object({
  postId: z.string(),
  topic: z.string().optional(),
  title: z.string().optional(),
  content: z.string(),
  contentType: z.string().optional(),
  authorCohort: z.string().optional(),
  createdAt: z.string().optional(),
  status: z.string().optional(),
  contributionId: z.string().optional(),
  claimId: z.string().nullable().optional(),
  caseScope: z.object({ caseId: z.string(), caseRevision: z.number().int().positive() }).nullable().optional(),
  contributionType: z.string().optional(),
  publicationState: z.string().optional(),
  evidenceState: z.string().optional(),
  reviewState: z.string().optional(),
  ranking: z.record(z.string(), z.unknown()).optional(),
}).passthrough();

const communityPostsResponseSchema = z.union([
  z.array(communityPostSchema),
  z.object({ posts: z.array(communityPostSchema) }).passthrough(),
]);

export const communityPostResponseSchema = z.object({
  success: z.literal(true),
  post: communityPostSchema,
}).passthrough();

export const communityExperienceResponseSchema = z.object({
  success: z.literal(true),
  experience: communityPostSchema,
}).passthrough();

type CommunityPreviewResponse = Readonly<{
  state?: string;
  preview?: Readonly<{ state?: string; previewDigest?: string }>;
}>;

export type CommunityPostsOptions = {
  signal?: AbortSignal;
  topic?: string;
  sort?: "relevant" | "recent" | "needs_review";
  requestId?: string;
};

function isAbortSignal(value: AbortSignal | CommunityPostsOptions): value is AbortSignal {
  return typeof value === "object" && value !== null && "aborted" in value && "addEventListener" in value;
}

export async function getCommunityPosts(signal?: AbortSignal): Promise<z.infer<typeof communityPostSchema>[]>;
export async function getCommunityPosts(options?: CommunityPostsOptions): Promise<z.infer<typeof communityPostSchema>[]>;
export async function getCommunityPosts(signalOrOptions: AbortSignal | CommunityPostsOptions = {}) {
  const options = isAbortSignal(signalOrOptions) ? { signal: signalOrOptions } : signalOrOptions;
  const topic = options.topic?.trim().slice(0, 80);
  const params = new URLSearchParams();
  if (topic) params.set("topic", topic);
  if (options.sort) params.set("sort", options.sort);
  const path = params.size ? `/api/intelligence/community/posts?${params}` : "/api/intelligence/community/posts";
  const result = await apiRequest<z.infer<typeof communityPostsResponseSchema>>(path, {
    signal: options.signal,
    requestId: options.requestId,
    schema: communityPostsResponseSchema,
  });
  return Array.isArray(result) ? result : result.posts;
}

export type CommunityPostInput = Readonly<{
  content: string;
  evidenceRefs?: readonly string[];
  caseScope?: Readonly<{ caseId: string; caseRevision: number }>;
  claimId?: string;
  contributionType?: string;
  source?: Readonly<Record<string, unknown>>;
}>;

export async function createCommunityPost(input: CommunityPostInput, signal?: AbortSignal, requestId?: string) {
  const preview = await apiRequest<CommunityPreviewResponse>("/api/intelligence/community/posts", {
    method: "POST",
    body: JSON.stringify({ ...input, phase: "PREVIEW" }),
    signal,
    requestId,
    headers: { "Idempotency-Key": requestId || `community-preview-${Date.now()}` },
  });
  if (preview?.state === "BLOCKED" || preview?.preview?.state === "BLOCKED") return preview;
  return apiRequest<z.infer<typeof communityPostResponseSchema>>("/api/intelligence/community/posts", {
    method: "POST",
    body: JSON.stringify({ ...input, phase: "PUBLISH", privacyConfirmed: true, previewDigest: preview?.preview?.previewDigest }),
    signal,
    requestId,
    headers: { "Idempotency-Key": requestId || `community-publish-${Date.now()}` },
    schema: communityPostResponseSchema,
  });
}

export function getCommunityExperience(observationId: string, signal?: AbortSignal, requestId?: string) {
  return apiRequest<z.infer<typeof communityExperienceResponseSchema>>(`/api/intelligence/community/experiences/${encodeURIComponent(observationId)}`, {
    signal,
    requestId,
    schema: communityExperienceResponseSchema,
  });
}
