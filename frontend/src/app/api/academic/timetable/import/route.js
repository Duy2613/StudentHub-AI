import { NextResponse } from "next/server";

import { TimetableVisionExtractor } from "@/lib/server/academic/TimetableVisionExtractor.js";
import {
  MAX_TIMETABLE_IMAGE_BYTES,
  validateTimetableImage,
} from "@/lib/server/academic/timetableImage.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import {
  academicErrorResponse,
  requestId,
} from "@/lib/server/academic/academicApi.js";

async function importTimetableImage(request, _routeContext, _principal, securityContext) {
  try {
    const form = await request.formData();
    const file = form.get("file") || form.get("image");
    if (!file || typeof file.arrayBuffer !== "function") {
      const error = new Error("A timetable image is required.");
      error.code = "TIMETABLE_IMAGE_REQUIRED";
      error.statusCode = 400;
      throw error;
    }
    if (Number(file.size) > MAX_TIMETABLE_IMAGE_BYTES) {
      const error = new Error("The timetable image is too large.");
      error.code = "TIMETABLE_IMAGE_SIZE_INVALID";
      error.statusCode = 422;
      throw error;
    }
    const validated = validateTimetableImage({
      bytes: await file.arrayBuffer(),
      mimeType: file.type,
      name: file.name,
    });
    const result = await new TimetableVisionExtractor().extract({
      bytes: validated.bytes,
      mimeType: validated.mimeType,
      requestId: requestId(request, securityContext),
    });
    return NextResponse.json({
      success: true,
      ...result,
      file: {
        mimeType: validated.mimeType,
        byteSize: validated.byteSize,
        dimensions: validated.dimensions,
        sha256: validated.sha256,
        retained: false,
      },
    });
  } catch (error) {
    return academicErrorResponse(error, requestId(request, securityContext));
  }
}

export const POST = SecurityFabric.wrapHandler({
  action: "IMPORT_OWN_ACADEMIC_TIMETABLE_IMAGE",
  requiredPermission: "ACADEMIC.PLAN_OWN",
  requiredScopes: ["academic:plan"],
  allowAnonymous: false,
  maxRequests: 20,
  maxBodyBytes: MAX_TIMETABLE_IMAGE_BYTES + 64 * 1024,
}, importTimetableImage);

