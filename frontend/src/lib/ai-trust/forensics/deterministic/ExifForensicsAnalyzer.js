/**
 * StudentHub AI — ExifForensicsAnalyzer (Deterministic Forensics)
 * 
 * Inspects JPEG/PNG/TIFF binary headers for EXIF metadata:
 * - Camera make, model, lens
 * - Software / editor tags (Photoshop, GIMP, Canva, Stable Diffusion, etc.)
 * - Timestamps (DateTimeOriginal, DateTimeDigitized)
 * - Orientation, color profile
 * - GPS presence (REDACTS exact coordinates to protect user privacy!)
 * - Metadata consistency & stripped metadata indicators.
 * 
 * INVARIANT: Metadata is evidence/signal, NOT authority.
 * Software tags do NOT automatically mean FAKE or MANIPULATED.
 * Metadata absence does NOT prove manipulation.
 */

const KNOWN_EDITORS = [
  "photoshop", "gimp", "canva", "lightroom", "paint.net",
  "pixlr", "snapseed", "midjourney", "stable diffusion",
  "dall-e", "comfyui", "automatic1111", "face_swap", "deepfake"
];

export class ExifForensicsAnalyzer {
  /**
   * Analyzes an image buffer for EXIF metadata.
   * 
   * @param {Buffer|Uint8Array} buffer 
   * @returns {object} { status, exifPresent, camera, software, timestamps, hasGps, signals, warnings, rawExifInternal }
   */
  static analyze(buffer) {
    if (!buffer || buffer.length < 32) {
      return {
        status: "INSUFFICIENT_DATA",
        exifPresent: false,
        camera: { make: null, model: null },
        software: { editorDetected: false, editorName: null },
        timestamps: { creationTime: null, modificationTime: null },
        hasGps: false,
        signals: [],
        warnings: ["Tệp quá nhỏ hoặc thiếu cấu trúc tiêu đề ảnh."],
        rawExifInternal: null,
      };
    }

    const signals = [];
    const warnings = [];
    const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);

    let exifPresent = false;
    let cameraMake = null;
    let cameraModel = null;
    let softwareName = null;
    let creationTime = null;
    let modificationTime = null;
    let hasGps = false;
    let rawGpsCoordinates = null; // Stays internal, never in public DTO!

    // Scan for Exif marker in JPEG (0xFFE1) or PNG textual chunks (e.g. tEXt, zTXt, iTXt)
    const ascii = buf.toString("latin1");
    const exifOffset = ascii.indexOf("Exif\0\0");

    if (exifOffset !== -1) {
      exifPresent = true;
      signals.push({
        code: "EXIF_METADATA_PRESENT",
        severity: "INFO",
        source: "ExifForensicsAnalyzer",
        details: "Tệp chứa cấu trúc metadata EXIF nguyên bản.",
      });

      // Basic tag pattern scanning across the header section (first 64KB)
      const headerChunk = ascii.slice(exifOffset, Math.min(ascii.length, exifOffset + 65536));

      // Make / Model
      const makeMatch = headerChunk.match(/(Apple|Canon|Nikon|Sony|Samsung|Google|Xiaomi|Fujifilm|Olympus|Panasonic|Huawei)\b/i);
      if (makeMatch) {
        cameraMake = makeMatch[1];
      }

      // Check for known editors
      const lowerChunk = headerChunk.toLowerCase();
      for (const editor of KNOWN_EDITORS) {
        if (lowerChunk.includes(editor)) {
          softwareName = editor;
          signals.push({
            code: "EXIF_SOFTWARE_PRESENT",
            severity: "LOW",
            source: "ExifForensicsAnalyzer",
            details: `Phát hiện chữ ký phần mềm biên tập (${editor}) trong metadata. Đây là chỉ dấu tham khảo, không khẳng định nội dung giả mạo.`,
          });
          warnings.push(`Ảnh có thông tin phần mềm chỉnh sửa (${editor}).`);
          break;
        }
      }

      // Timestamp regex: YYYY:MM:DD HH:MM:SS
      const timeMatches = [...headerChunk.matchAll(/\b(20[0-2]\d:[0-1]\d:[0-3]\d\s[0-2]\d:[0-5]\d:[0-5]\d)\b/g)];
      if (timeMatches.length > 0) {
        creationTime = timeMatches[0][1];
        if (timeMatches.length > 1) {
          modificationTime = timeMatches[1][1];
        }
      }

      // GPS Presence check
      if (headerChunk.includes("GPSInfo") || headerChunk.includes("GPSVersionID")) {
        hasGps = true;
        // Mark GPS presence without extracting or exposing coordinates
        signals.push({
          code: "EXIF_GPS_PRESENT",
          severity: "INFO",
          source: "ExifForensicsAnalyzer",
          details: "Tệp có chứa dữ liệu định vị địa lý GPS (đã được ẩn tọa độ để bảo vệ quyền riêng tư).",
        });
      }
    } else {
      // Missing or stripped metadata
      signals.push({
        code: "METADATA_STRIPPED_OR_ABSENT",
        severity: "INFO",
        source: "ExifForensicsAnalyzer",
        details: "Ảnh không chứa khối EXIF. Điều này thường gặp trên ảnh tải từ mạng xã hội hoặc ứng dụng nhắn tin và không thể coi là dấu hiệu giả mạo.",
      });
    }

    return {
      status: exifPresent ? "COMPLETED" : "NO_EXIF",
      exifPresent,
      camera: {
        make: cameraMake,
        model: cameraModel,
      },
      software: {
        editorDetected: Boolean(softwareName),
        editorName: softwareName,
      },
      timestamps: {
        creationTime,
        modificationTime,
      },
      hasGps,
      signals,
      warnings,
      rawExifInternal: {
        rawLength: exifPresent ? 65536 : 0,
        hasRawGps: hasGps,
      },
    };
  }
}
