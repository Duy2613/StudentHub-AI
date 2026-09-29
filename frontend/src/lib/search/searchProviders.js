import { CANONICAL_NAVIGATION } from "@/config/navigation";
import { containsRemovedOmniTerm, isDecommissionedRoute } from "@/config/productScopeRegistry";
import { navigationResults } from "@/lib/omni/omniV4Model";

/** Static suggestions are destinations, never fabricated search records. */
export const STATIC_SEARCH_INDEX = CANONICAL_NAVIGATION
  .filter((item) => item.group !== "utility")
  .map((item) => ({ id: `nav-${item.id}`, category: item.group === "account" ? "Commands" : "Navigation", title: item.label, href: item.route, description: `Mở ${item.label}.`, availability: item.availability }))
  .filter((item) => {
    const searchableText = `${item.title} ${item.description}`;
    return !isDecommissionedRoute(item.href) && !containsRemovedOmniTerm(searchableText);
  });

/** Compatibility consumer for deterministic navigation search. */
export async function searchCanonicalProduct(query, { authenticated = false } = {}) {
  const groups = {};
  for (const result of navigationResults(CANONICAL_NAVIGATION, query, authenticated)) {
    const category = result.kind === "COMMAND" ? "Commands" : "Navigation";
    (groups[category] ||= []).push({ ...result, category, description: result.summary });
  }
  return groups;
}
