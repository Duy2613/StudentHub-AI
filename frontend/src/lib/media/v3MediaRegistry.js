/**
 * StudentHub AI — Canonical V3 Media Registry
 *
 * Grounded in public/media/v3/media-manifest.json.
 * Components resolve media properties here instead of hardcoding raw strings.
 */

export const V3_MEDIA = Object.freeze({
  landing: Object.freeze({
    hero: Object.freeze({
      video: "/media/v3/landing/hero-main.mp4",
      poster: "/media/v3/landing/hero-main-poster.webp",
      mobile: "/media/v3/landing/hero-main-mobile.webp",
      reducedMotion: "/media/v3/landing/hero-main-poster.webp",
      type: "video"
    }),
    prism: "/media/v3/landing/prism.webp",
    atlas: "/media/v3/landing/atlas.webp",
    humanAi: "/media/v3/landing/human-ai.webp",
    community: "/media/v3/landing/community.webp",
    expert: "/media/v3/landing/expert.webp",
    trustTransform: Object.freeze({
      video: "/media/v3/landing/trust-transform.mp4",
      poster: "/media/v3/landing/prism.webp",
      mobile: "/media/v3/landing/prism.webp",
      reducedMotion: "/media/v3/landing/prism.webp",
      type: "video"
    })
  }),
  auth: Object.freeze({
    loginLoop: Object.freeze({
      video: "/media/v3/auth/login-loop.mp4",
      poster: "/media/v3/auth/login-poster.webp",
      mobile: "/media/v3/auth/login-mobile.webp",
      reducedMotion: "/media/v3/auth/login-poster.webp",
      type: "video"
    }),
    register: "/media/v3/auth/register.webp",
    verify: "/media/v3/auth/verify.webp"
  }),
  trust: Object.freeze({
    input: "/media/v3/trust/input.webp",
    l1Claim: "/media/v3/trust/l1-claim.webp",
    l2Discovery: Object.freeze({
      video: "/media/v3/trust/l2-discovery.mp4",
      poster: "/media/v3/trust/l2-discovery-poster.webp",
      mobile: "/media/v3/trust/l2-discovery-poster.webp",
      reducedMotion: "/media/v3/trust/l2-discovery-poster.webp",
      type: "video"
    }),
    officialSource: "/media/v3/trust/official-source.webp",
    sourceIndependence: "/media/v3/trust/source-independence.webp",
    l3Forensics: "/media/v3/trust/l3-forensics.webp",
    l4MultiAi: Object.freeze({
      video: "/media/v3/trust/l4-multiai.mp4",
      poster: "/media/v3/trust/l4-multiai-poster.webp",
      mobile: "/media/v3/trust/l4-multiai-poster.webp",
      reducedMotion: "/media/v3/trust/l4-multiai-poster.webp",
      type: "video"
    }),
    l5Decision: "/media/v3/trust/l5-decision.webp",
    humanReview: Object.freeze({
      video: "/media/v3/trust/human-review.mp4",
      poster: "/media/v3/trust/human-review-poster.webp",
      mobile: "/media/v3/trust/human-review-poster.webp",
      reducedMotion: "/media/v3/trust/human-review-poster.webp",
      type: "video"
    })
  }),
  community: Object.freeze({
    hero: Object.freeze({
      video: "/media/v3/community/hero.mp4",
      poster: "/media/v3/community/hero-poster.webp",
      mobile: "/media/v3/community/hero-poster.webp",
      reducedMotion: "/media/v3/community/hero-poster.webp",
      type: "video"
    }),
    feedBg: "/media/v3/community/feed-bg.webp",
    evidencePost: "/media/v3/community/evidence-post.webp",
    expertResponse: "/media/v3/community/expert-response.webp",
    discussion: "/media/v3/community/discussion.webp"
  }),
  expert: Object.freeze({
    network: "/media/v3/expert/network.webp",
    qualification: "/media/v3/expert/qualification.webp",
    liveReview: Object.freeze({
      video: "/media/v3/expert/live-review.mp4",
      poster: "/media/v3/expert/live-review-poster.webp",
      mobile: "/media/v3/expert/live-review-poster.webp",
      reducedMotion: "/media/v3/expert/live-review-poster.webp",
      type: "video"
    }),
    reputation: "/media/v3/expert/reputation.webp"
  }),
  profile: Object.freeze({
    user: "/media/v3/profile/user.webp",
    expert: "/media/v3/profile/expert.webp"
  }),
  dashboard: Object.freeze({
    dashboard: "/media/v3/dashboard/dashboard.webp"
  }),
  shared: Object.freeze({
    evidencePaper: "/media/v3/shared/evidence-paper.webp",
    prismTexture: "/media/v3/shared/prism-texture.webp",
    emptyCommunity: "/media/v3/shared/empty-community.webp",
    emptyExpert: "/media/v3/shared/empty-expert.webp",
    emptyExpertFallback: "/media/v3/shared/empty-community.webp",
    emptyTrust: "/media/v3/shared/empty-trust.webp"
  })
});

export default V3_MEDIA;
