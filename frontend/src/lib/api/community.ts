import { z } from "zod";
import { apiRequest } from "./client";

export const communityPostSchema = z.object({
  postId: z.string(),
  topic: z.string().optional(),
  title: z.string().optional(),
  content: z.string(),
  contentType: z.string().optional(),
  authorCohort: z.string().optional(),
  createdAt: z.string().optional(),
  status: z.string().optional(),
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

export type CommunityPostsOptions = {
  signal?: AbortSignal;
  topic?: string;
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
  const path = topic ? `/api/intelligence/community/posts?topic=${encodeURIComponent(topic)}` : "/api/intelligence/community/posts";
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
}>;

export function createCommunityPost(input: CommunityPostInput, signal?: AbortSignal, requestId?: string) {
  return apiRequest<z.infer<typeof communityPostResponseSchema>>("/api/intelligence/community/posts", {
    method: "POST",
    body: JSON.stringify(input),
    signal,
    requestId,
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
