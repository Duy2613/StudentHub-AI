const ACTION_EVENT_TYPES = Object.freeze({
  POST_CREATED: "community:contribution",
  COMMENT_CREATED: "community:comment",
  LIKE_SET: "community:reaction",
  PERCEPTION_SET: "community:reaction",
});

/** Build a payload-only public invalidation for the durable Community stream. */
export function createCommunitySocialRealtimeEvent({ postId, action, correlationId, environment = "development" } = {}) {
  const normalizedAction = String(action || "").toUpperCase();
  const eventType = ACTION_EVENT_TYPES[normalizedAction];
  if (!postId || !eventType || !correlationId) return null;

  return {
    channel: "community",
    eventType,
    subjectId: null,
    classification: "PUBLIC",
    producer: "StudentHub-AI",
    environment,
    correlationId,
    causationId: postId,
    idempotencyKey: `community:social:${correlationId}`,
    // The stream tells open feeds to refetch. It never carries user-authored text or identity.
    data: { postId, action: normalizedAction },
  };
}
