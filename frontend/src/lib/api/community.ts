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

export async function getCommunityPosts(signal?: AbortSignal) {
  const result = await apiRequest<z.infer<typeof communityPostsResponseSchema>>("/api/intelligence/community/posts", {
    signal,
    schema: communityPostsResponseSchema,
  });
  return Array.isArray(result) ? result : result.posts;
}
