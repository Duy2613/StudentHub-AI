/**
 * StudentHub AI — C2paProvenanceAnalyzer (Deterministic Forensics)
 * 
 * Inspects image binary for C2PA (Coalition for Content Provenance and Authenticity)
 * and CAI (Content Authenticity Initiative) JUMBF manifests.
 * 
 * Canonical States:
 * - VALID: Cryptographic trust chain & signature verified against trusted root certs.
 * - PRESENT_UNVERIFIED: Manifest data is present, but trust chain/signature is not cryptographically verified.
 * - UNTRUSTED: Signature is invalid or certificate is self-signed/untrusted/expired.
 * - INVALID: Manifest structure is corrupted or tampering detected.
 * - ABSENT: No C2PA manifest found in image.
 * - UNKNOWN: Could not inspect container structure.
 * 
 * STRICT INVARIANT:
 * - Presence of JUMBF data alone must NEVER return VALID without cryptographic proof.
 * - ABSENT never implies fake or manipulation.
 */

export const C2PA_STATUS = Object.freeze({
  VALID: "VALID",
  INVALID: "INVALID",
  UNTRUSTED: "UNTRUSTED",
  PRESENT_UNVERIFIED: "PRESENT_UNVERIFIED",
  ABSENT: "ABSENT",
  UNKNOWN: "UNKNOWN",
});

export class C2paProvenanceAnalyzer {
  /**
   * Scans an image buffer for C2PA / JUMBF boxes.
   * 
   * @param {Buffer|Uint8Array} buffer 
   * @returns {object} { status, c2paStatus, issuer, claimGenerator, isVerified, signals, warnings }
   */
  static analyze(buffer) {
    if (!buffer || buffer.length < 32) {
      return {
        status: "INSUFFICIENT_DATA",
        c2paStatus: C2PA_STATUS.UNKNOWN,
        issuer: null,
        claimGenerator: null,
        isVerified: false,
        signals: [],
        warnings: ["Dữ liệu không đủ để kiểm tra cấu trúc C2PA."],
      };
    }

    const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
    const ascii = buf.toString("latin1");

    // Scan for standard C2PA JUMBF box markers (e.g. 'c2pa', 'jumb', 'c2ma')
    const hasJumbf = ascii.includes("jumb") || ascii.includes("c2pa") || ascii.includes("c2ma");

    if (!hasJumbf) {
      return {
        status: "COMPLETED",
        c2paStatus: C2PA_STATUS.ABSENT,
        issuer: null,
        claimGenerator: null,
        isVerified: false,
        signals: [
          {
            code: "C2PA_MANIFEST_ABSENT",
            severity: "INFO",
            source: "C2paProvenanceAnalyzer",
            details: "Không tìm thấy dữ liệu Content Credentials (C2PA). Việc thiếu C2PA là phổ biến và hoàn toàn bình thường đối với ảnh thông thường.",
          },
        ],
        warnings: [],
      };
    }

    // JUMBF manifest is physically present in binary container
    // Extract claim generator / software if visible
    let claimGenerator = null;
    const genMatch = ascii.match(/(Adobe Photoshop|Truepic|Leica|Nikon CAI|Content Authenticity Initiative|c2pa-rs|c2patool)[^\x00-\x1F]*/i);
    if (genMatch) {
      claimGenerator = genMatch[0].slice(0, 100).trim();
    }

    // MANDATORY HARDENING RULE:
    // Without full cryptographic verification of certificate trust chains and digital signatures,
    // we MUST return PRESENT_UNVERIFIED, NEVER VALID.
    return {
      status: "COMPLETED",
      c2paStatus: C2PA_STATUS.PRESENT_UNVERIFIED,
      issuer: "UNKNOWN_ROOT",
      claimGenerator: claimGenerator || "C2PA_JUMBF_CONTAINER",
      isVerified: false,
      signals: [
        {
          code: "C2PA_MANIFEST_PRESENT_UNVERIFIED",
          severity: "INFO",
          source: "C2paProvenanceAnalyzer",
          details: `Phát hiện khối dữ liệu Content Credentials (C2PA)${claimGenerator ? ` (${claimGenerator})` : ""}, nhưng chưa đối soát mật mã chuỗi chứng thư số gốc.`,
        },
      ],
      warnings: ["Phát hiện khối C2PA nhưng chữ ký số chưa được xác thực mật mã hoàn chỉnh."],
    };
  }
}
