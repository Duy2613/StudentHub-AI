/**
 * StudentHub AI — JpegRecompressionAnalyzer (Deterministic Forensics)
 * 
 * Inspects JPEG Quantization Tables (DQT), compression quality estimates,
 * and double-compression blocking indicators.
 * 
 * INVARIANT:
 * - JPEG recompression does NOT prove manipulation.
 * - Recompression frequently occurs when sharing images via messaging apps or social networks.
 * - Returns advisory signals and quality estimates only.
 */

export class JpegRecompressionAnalyzer {
  /**
   * Evaluates JPEG compression signals.
   * 
   * @param {Buffer|Uint8Array} buffer 
   * @param {string} [format="jpeg"]
   * @returns {object} { status, signal, qualityEstimate, dqtCount, signals, warnings }
   */
  static analyze(buffer, format = "jpeg") {
    if (!buffer || buffer.length < 32 || format !== "jpeg") {
      return {
        status: format === "jpeg" ? "INSUFFICIENT_DATA" : "NOT_APPLICABLE",
        signal: "NORMAL",
        qualityEstimate: null,
        dqtCount: 0,
        signals: [],
        warnings: [],
      };
    }

    const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
    const signals = [];
    const warnings = [];

    // Count DQT (Define Quantization Table) markers (0xFFDB)
    let dqtCount = 0;
    let offset = 2;
    let qualityEstimate = 85;

    while (offset < buf.length - 4) {
      if (buf[offset] === 0xFF && buf[offset + 1] === 0xDB) {
        dqtCount++;
        // Check quantization values if table length is sufficient
        if (offset + 10 < buf.length) {
          const sampleVal = buf[offset + 5];
          if (sampleVal > 30) qualityEstimate = Math.min(qualityEstimate, 65);
          else if (sampleVal < 5) qualityEstimate = Math.max(qualityEstimate, 95);
        }
      }
      offset++;
    }

    const hasMultipleDqt = dqtCount > 2;

    if (hasMultipleDqt) {
      signals.push({
        code: "JPEG_RECOMPRESSION_OBSERVED",
        severity: "INFO",
        source: "JpegRecompressionAnalyzer",
        details: "Phát hiện nhiều bảng lượng tử hóa (DQT), biểu hiện ảnh đã trải qua tái nén (recompression). Đây là hiện tượng phổ biến khi tải qua mạng xã hội, không phải bằng chứng chỉnh sửa nội dung.",
      });
      warnings.push("Ảnh có dấu hiệu tái nén (recompression).");
    }

    if (qualityEstimate < 60) {
      signals.push({
        code: "LOW_COMPRESSION_QUALITY",
        severity: "LOW",
        source: "JpegRecompressionAnalyzer",
        details: `Chất lượng nén ước tính ở mức thấp (~${qualityEstimate}%), độ nét chi tiết có thể bị suy giảm.`,
      });
      warnings.push("Chất lượng nén hình ảnh thấp, có thể ảnh hưởng đến độ tin cậy của các bộ phân tích.");
    }

    return {
      status: "COMPLETED",
      signal: hasMultipleDqt ? "ANOMALOUS_RECOMPRESSION" : "NORMAL",
      qualityEstimate,
      dqtCount,
      signals,
      warnings,
    };
  }
}
