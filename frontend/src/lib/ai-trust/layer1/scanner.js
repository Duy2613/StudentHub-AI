/**
 * Layer 1 — Unified Scanner Entry Point
 * 
 * Delegates directly to Layer1ScreenService for complete backend enforcement.
 */

import { Layer1ScreenService } from "./Layer1ScreenService.js";

/**
 * Screens an input at Layer 1
 * @param {object} input
 * @param {"url"|"link"|"text"|"image"|"file"} input.type - Input type
 * @param {string} input.content - URL string, plain text, or image base64/URL
 * @param {object} [input.metadata] - Optional file metadata (bytes, fileName, mimeType, ocrText, qrContent)
 * @param {object} [input.options] - Optional execution options (auxiliaryModel, requestId)
 * @returns {Promise<object>} Standardized Layer 1 Output
 */
export async function screenLayer1({ type = "text", content = "", metadata = {}, options = {} }) {
  return await Layer1ScreenService.screen({ type, content, metadata, options });
}
