import { NextResponse } from "next/server";
import { createEvidencePassport, EvidencePassportValidationError } from "@/lib/intelligence/passport/evidencePassportModel.js";
import { PostgresCrossSystemRepository } from "@/lib/intelligence/crossSystem/PostgresCrossSystemRepository.js";
import { DatabaseUnavailableError } from "@/lib/server/database/PostgresPool.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";

function principalUserId(principal) {
  const value = String(principal?.subjectId || "").replace(/^(student|expert|user):/, "");
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) ? value : null;
}

function apiFailure(error) {
  if (error instanceof EvidencePassportValidationError) {
    const messages = {
      INVALID_EVIDENCE_PASSPORT: "Thông tin Evidence Passport chưa hợp lệ.",
      DEMO_DATA_REJECTED: "Dữ liệu demo không được phép ghi vào Passport thật.",
      SERVER_AUTHORITY_REQUIRED: "Trạng thái Passport chỉ được xác lập bởi quy trình tin cậy.",
    };
    return NextResponse.json({ success: false, error: { code: messages[error.code] ? error.code : "INVALID_EVIDENCE_PASSPORT", message: messages[error.code] || messages.INVALID_EVIDENCE_PASSPORT } }, { status: 422 });
  }
  if (error instanceof DatabaseUnavailableError) return NextResponse.json({ success: false, error: { code: "DATABASE_UNAVAILABLE", message: "Durable Evidence Passport storage is not configured." } }, { status: 503 });
  if (error?.code === "23505") return NextResponse.json({ success: false, error: { code: "PASSPORT_ALREADY_EXISTS", message: "A passport already exists for this subject." } }, { status: 409 });
  return NextResponse.json({ success: false, error: { code: "PASSPORT_OPERATION_FAILED", message: "Evidence Passport operation could not be completed." } }, { status: 500 });
}

async function listPassports(request, routeParams, principal) {
  const ownerId = principalUserId(principal);
  if (!ownerId) return NextResponse.json({ success: false, error: { code: "DURABLE_IDENTITY_REQUIRED", message: "A durable Supabase user identity is required." } }, { status: 422 });
  try {
    const passports = await new PostgresCrossSystemRepository().listPassports(ownerId);
    return NextResponse.json({ success: true, passports });
  } catch (error) { return apiFailure(error); }
}

async function createPassport(request, routeParams, principal) {
  const ownerId = principalUserId(principal);
  if (!ownerId) return NextResponse.json({ success: false, error: { code: "DURABLE_IDENTITY_REQUIRED", message: "A durable Supabase user identity is required." } }, { status: 422 });
  try {
    const body = await request.json().catch(() => null);
    if (!body || body.demo === true) throw new EvidencePassportValidationError("Demo evidence cannot be persisted through the live API.", "DEMO_DATA_REJECTED");
    if (body.initialStatus && body.initialStatus !== "INSUFFICIENT_EVIDENCE") {
      throw new EvidencePassportValidationError("Initial Passport status is assigned by trusted server workflows only.", "SERVER_AUTHORITY_REQUIRED");
    }
    const passport = createEvidencePassport({
      id: crypto.randomUUID(),
      ownerId,
      title: body.title,
      subjectType: body.subjectType,
      subjectId: body.subjectId,
      initialStatus: "INSUFFICIENT_EVIDENCE",
      createdAt: new Date().toISOString(),
      demo: false,
    });
    const saved = await new PostgresCrossSystemRepository().createPassport(passport);
    return NextResponse.json({ success: true, passport: saved }, { status: 201 });
  } catch (error) { return apiFailure(error); }
}

export const GET = SecurityFabric.wrapHandler({ action: "READ_OWN_EVIDENCE_PASSPORTS", requiredPermission: "PASSPORT.READ_OWN", allowAnonymous: false }, listPassports);
export const POST = SecurityFabric.wrapHandler({ action: "CREATE_OWN_EVIDENCE_PASSPORT", requiredPermission: "PASSPORT.WRITE_OWN", allowAnonymous: false, maxRequests: 30, maxBodyBytes: 64 * 1024 }, createPassport);
