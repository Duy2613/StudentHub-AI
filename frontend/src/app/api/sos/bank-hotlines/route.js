import { removedProductSurfaceResponse } from "@/lib/server/removedProductSurface.js";

export function GET() {
  return removedProductSurfaceResponse();
}
