import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { ExpertProfileService } from "@/lib/server/profile/ExpertProfileService.js";
import { qualificationErrorResponse } from "@/lib/server/expert/qualificationHttp.js";

export const dynamic = "force-dynamic";

async function readExpertProfile(_request, _routeParams, principal, securityContext) {
  try {
    const view = await ExpertProfileService.getExpertProfileView({ principal });
    return Response.json({
      success: true,
      contractVersion: "expert-profile.v1",
      profile: {
        ...view.profile,
        // The Owner schema does not currently expose these as writable profile
        // fields. Null is truthful; the UI must not invent a score or star level.
        trustScore: null,
        starLevel: null,
        ...view,
      },
      expert: view.expert,
      qualification: view.qualification,
      reputation: view.reputation,
      work: view.work,
      tasks: view.tasks,
      assessments: view.assessments,
      communityContribution: view.communityContribution,
      availability: view.availability,
      meta: { correlationId: securityContext.correlationId, sourceState: "OWNER_CANONICAL" },
    });
  } catch (error) {
    return qualificationErrorResponse(error, securityContext.correlationId);
  }
}

async function updateExpertProfile(request, _routeParams, principal, securityContext) {
  try {
    const body = await request.json().catch(() => ({}));
    const updates = {
      bio: body?.Bio ?? body?.bio,
      expertise: body?.Expertise ?? body?.expertise,
      ...body,
    };
    const view = await ExpertProfileService.updateExpertProfile({
      principal,
      updates,
    });
    return Response.json({
      success: true,
      contractVersion: "expert-profile.v1",
      profile: {
        ...view.profile,
        trustScore: null,
        starLevel: null,
        ...view,
      },
      expert: view.expert,
      qualification: view.qualification,
      reputation: view.reputation,
      work: view.work,
      tasks: view.tasks,
      assessments: view.assessments,
      communityContribution: view.communityContribution,
      meta: { correlationId: securityContext.correlationId, sourceState: "OWNER_CANONICAL" },
    });
  } catch (error) {
    return qualificationErrorResponse(error, securityContext.correlationId);
  }
}

const ownExpertProfilePolicy = {
  allowAnonymous: false,
  requiredScopes: ["expert:read"],
  maxRequests: 60,
  maxBodyBytes: 32 * 1024,
};

export const GET = SecurityFabric.wrapHandler({
  ...ownExpertProfilePolicy,
  action: "READ_OWN_EXPERT_PROFILE",
  maxBodyBytes: 0,
}, readExpertProfile);

export const PUT = SecurityFabric.wrapHandler({
  ...ownExpertProfilePolicy,
  action: "UPDATE_OWN_EXPERT_PROFILE",
}, updateExpertProfile);

export const PATCH = SecurityFabric.wrapHandler({
  ...ownExpertProfilePolicy,
  action: "UPDATE_OWN_EXPERT_PROFILE",
}, updateExpertProfile);
