/**
 * Stable, non-disclosing response for APIs belonging to retired product areas.
 * The handler deliberately ignores request bodies and performs no reads/writes.
 */
export function removedProductSurfaceResponse() {
  return Response.json(
    {
      success: false,
      error: {
        code: "LEGACY_PRODUCT_SURFACE_REMOVED",
        userMessage: "Tính năng này không còn khả dụng trong StudentHub.",
      },
    },
    {
      status: 404,
      headers: { "Cache-Control": "no-store, max-age=0" },
    },
  );
}
