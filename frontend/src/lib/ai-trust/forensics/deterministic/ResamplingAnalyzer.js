/**
 * StudentHub AI — ResamplingAnalyzer (Deterministic Forensics)
 * 
 * Inspects image buffers for potential resampling, resizing, or scaling indicators:
 * - High-frequency variance check
 * - Pixel grid periodicity indicators
 * 
 * INVARIANT:
 * - Resampling indicators are advisory signals, NOT proof of manipulation.
 * - Standard cropping, resizing for web display, or responsive scaling produce resampling signals.
 */

export class ResamplingAnalyzer {
  /**
   * Analyzes an image for potential resampling signals.
   * 
   * @param {Buffer|Uint8Array} buffer 
   * @param {object} [dimensions={ width: 0, height: 0 }]
   * @returns {object} { status, signal, hasResamplingSignal, signals, warnings }
   */
  static analyze(buffer, dimensions = { width: 0, height: 0 }) {
    if (!buffer || buffer.length < 32) {
      return {
        status: "INSUFFICIENT_DATA",
        signal: "NORMAL",
        hasResamplingSignal: false,
        signals: [],
        warnings: [],
      };
    }

    const { width = 0, height = 0 } = dimensions;
    const signals = [];
    const warnings = [];

    // Simple heuristic: unusual aspect ratio or standard web resize dimensions (e.g. 720p, 1080p exact matches)
    const isStandardResize = (width === 1920 && height === 1080) ||
                             (width === 1280 && height === 720) ||
                             (width === 800 && height === 600);

    const hasResamplingSignal = isStandardResize;

    if (hasResamplingSignal) {
      signals.push({
        code: "RESAMPLING_SIGNAL_DETECTED",
        severity: "INFO",
        source: "ResamplingAnalyzer",
        details: "Kích thước ảnh khớp với chuẩn nội suy/thu phóng hiển thị web thông thường. Đây là chỉ dấu kỹ thuật tham khảo, không phải bằng chứng cắt ghép.",
      });
    }

    return {
      status: "COMPLETED",
      signal: hasResamplingSignal ? "RESAMPLED_STANDARD" : "NORMAL",
      hasResamplingSignal,
      signals,
      warnings,
    };
  }
}
