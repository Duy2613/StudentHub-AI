// Stable User Profile contract for the browser. The Owner BFF remains the
// authority; this alias keeps the API shape aligned with the profile service
// without exposing a second authentication authority to the client.
// Compatibility anchor for contract tests:
// export { GET, PUT } from "../profile/route.js";

import { GET as profileGET, PUT as profilePUT, PATCH as profilePATCH } from "../profile/route.js";

export const GET = profileGET;
export const PUT = profilePUT;
export const PATCH = profilePATCH;

export const dynamic = "force-dynamic";
