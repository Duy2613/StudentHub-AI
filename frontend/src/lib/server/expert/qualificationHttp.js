import { ExpertQualificationError } from "./ExpertQualificationService.js";

export function qualificationErrorResponse(error, correlationId) {
  if (!(error instanceof ExpertQualificationError)) throw error;
  return Response.json(
    {
      success: false,
      error: {
        code: error.code,
        userMessage: error.message,
        correlationId,
      },
    },
    { status: error.statusCode }
  );
}

