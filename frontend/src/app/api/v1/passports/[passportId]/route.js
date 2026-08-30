import { NextResponse } from "next/server";
import { appendEvidenceEvent, EvidencePassportValidationError } from "@/lib/intelligence/passport/evidencePassportModel.js";
import { PostgresCrossSystemRepository } from "@/lib/intelligence/crossSystem/PostgresCrossSystemRepository.js";
import { DatabaseUnavailableError } from "@/lib/server/database/PostgresPool.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";

function principalUserId(principal) {
  const value = String(principal?.subjectId || "").replace(/^(student|expert|user):/, "");
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) ? value : null;
}

async function passportIdFrom(routeParams) {
  const params = await routeParams?.params;
  return String(params?.passportId || "");
}

function failure(error) {
  if (error instanceof EvidencePassportValidationError) {
    const messages = {
      INVALID_EVIDENCE_PASSPORT: "Thông tin Evidence Passport chưa hợp lệ.",
      DEMO_PROVENANCE_MISMATCH: "Nguồn chứng cứ không phù hợp với Passport.",
      DEMO_DATA_REJECTED: "Dữ liệu demo không được phép ghi vào Passport thật.",
      NON_MONOTONIC_EVENT: "Mốc thời gian chứng cứ không hợp lệ.",
      DUPLICATE_EVENT: "Sự kiện chứng cứ đã tồn tại.",
      INVALID_STATUS_TRANSITION: "Chuyển trạng thái Passport không được phép.",
      UNSCOPED_RESOLUTION: "Kết quả giải quyết cần nguồn xác thực phù hợp.",
      SERVER_AUTHORITY_REQUIRED: "Trường quyền hạn chỉ được xác lập bởi quy trình tin cậy.",
    };
    return NextResponse.json({ success: false, error: { code: messages[error.code] ? error.code : "INVALID_EVIDENCE_PASSPORT", message: messages[error.code] || messages.INVALID_EVIDENCE_PASSPORT } }, { status: 422 });
  }
  if (error instanceof DatabaseUnavailableError) return NextResponse.json({ success: false, error: { code: "DATABASE_UNAVAILABLE", message: "Durable Evidence Passport storage is not configured." } }, { status: 503 });
  if (error?.code === "PASSPORT_REVISION_CONFLICT") return NextResponse.json({ success: false, error: { code: error.code, message: "Passport changed before this event was appended." } }, { status: 409 });
  return NextResponse.json({ success: false, error: { code: "PASSPORT_OPERATION_FAILED", message: "Evidence Passport operation could not be completed." } }, { status: 500 });
}

async function readPassport(request, routeParams, principal) {
  const ownerId = principalUserId(principal);
  if (!ownerId) return NextResponse.json({ success: false, error: { code: "DURABLE_IDENTITY_REQUIRED", message: "A durable Supabase user identity is required." } }, { status: 422 });
  try {
    const passport = await new PostgresCrossSystemRepository().getPassport(ownerId, await passportIdFrom(routeParams));
    if (!passport) return NextResponse.json({ success: false, error: { code: "PASSPORT_NOT_FOUND", message: "Evidence Passport was not found." } }, { status: 404 });
    return NextResponse.json({ success: true, passport });
  } catch (error) { return failure(error); }
}

async function appendEvent(request, routeParams, principal) {
  const ownerId = principalUserId(principal);
  if (!ownerId) return NextResponse.json({ success: false, error: { code: "DURABLE_IDENTITY_REQUIRED", message: "A durable Supabase user identity is required." } }, { status: 422 });
  try {
    const body = await request.json().catch(() => null);
    if (!body) throw new EvidencePassportValidationError("A user note is required.");
    const authorityFields = ["type", "provenanceClass", "previousStatus", "newStatus", "material", "changeReason", "references"];
    if (authorityFields.some((field) => Object.hasOwn(body, field))) {
      throw new EvidencePassportValidationError("Evidence authority fields are assigned by trusted server workflows only.", "SERVER_AUTHORITY_REQUIRED");
    }
    const repository = new PostgresCrossSystemRepository();
    const current = await repository.getPassport(ownerId, await passportIdFrom(routeParams));
    if (!current) return NextResponse.json({ success: false, error: { code: "PASSPORT_NOT_FOUND", message: "Evidence Passport was not found." } }, { status: 404 });
    const updated = appendEvidenceEvent(current, {
      id: crypto.randomUUID(),
      type: "USER_NOTE",
      provenanceClass: "USER_SUBMISSION",
      summary: body.summary,
      metadata: body.metadata,
      occurredAt: new Date().toISOString(),
    });
    const saved = await repository.appendPassportEvent(ownerId, updated);
    return NextResponse.json({ success: true, passport: saved });
  } catch (error) { return failure(error); }
}

export const GET = SecurityFabric.wrapHandler({ action: "READ_OWN_EVIDENCE_PASSPORT", requiredPermission: "PASSPORT.READ_OWN", allowAnonymous: false }, readPassport);
export const PATCH = SecurityFabric.wrapHandler({ action: "APPEND_OWN_EVIDENCE_PASSPORT", requiredPermission: "PASSPORT.WRITE_OWN", allowAnonymous: false, maxRequests: 60, maxBodyBytes: 64 * 1024 }, appendEvent);
