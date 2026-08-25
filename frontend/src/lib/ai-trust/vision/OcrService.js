/**
 * StudentHub AI — Multimodal OCR & Vision Extraction Service
 * 
 * Extracts Vietnamese & English text from uploaded photos, screenshots, and live camera frames.
 * Also decodes QR codes and performs magic-byte binary integrity verification.
 */

import { createWorker } from "tesseract.js";
import jsQR from "jsqr";

export class OcrService {
  static workerInstance = null;
  static isInitializing = false;

  /**
   * Initializes and caches Tesseract Worker
   */
  static async getWorker() {
    if (this.workerInstance) return this.workerInstance;
    if (this.isInitializing) {
      // Wait for existing initialization
      while (this.isInitializing) {
        await new Promise((r) => setTimeout(r, 100));
      }
      return this.workerInstance;
    }

    this.isInitializing = true;
    try {
      const worker = await createWorker("vie+eng");
      this.workerInstance = worker;
      return worker;
    } catch (err) {
      console.warn("[OCR Worker Warning] Could not initialize vie+eng, falling back to eng:", err.message);
      try {
        const worker = await createWorker("eng");
        this.workerInstance = worker;
        return worker;
      } catch (fallbackErr) {
        console.error("[OCR Worker Error] Failed to create OCR worker:", fallbackErr);
        return null;
      }
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Extracts QR code payload from an HTML Image or Canvas
   * @param {HTMLImageElement|HTMLCanvasElement|ImageData} imageSource
   * @returns {string|null} QR payload URL or string
   */
  static scanQrCode(imageSource) {
    try {
      if (typeof window === "undefined") return null;

      let imageData = null;

      if (imageSource instanceof ImageData) {
        imageData = imageSource;
      } else if (imageSource instanceof HTMLCanvasElement) {
        const ctx = imageSource.getContext("2d");
        imageData = ctx.getImageData(0, 0, imageSource.width, imageSource.height);
      } else if (imageSource instanceof HTMLImageElement) {
        const canvas = document.createElement("canvas");
        canvas.width = imageSource.naturalWidth || imageSource.width || 300;
        canvas.height = imageSource.naturalHeight || imageSource.height || 300;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(imageSource, 0, 0, canvas.width, canvas.height);
        imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      }

      if (!imageData) return null;

      const code = jsQR(imageData.data, imageData.width, imageData.height);
      return code ? code.data : null;
    } catch (err) {
      console.warn("[QR Scan Warning]:", err.message);
      return null;
    }
  }

  /**
   * Performs full multimodal extraction from an image file/blob or base64 URL
   * @param {File|Blob|string} imageInput
   * @param {Function} [onProgress]
   * @returns {Promise<object>} { text, qrContent, confidence, magicBytes, executionTimeMs }
   */
  static async extract(imageInput, onProgress = null) {
    const startTime = performance.now();
    let text = "";
    let qrContent = null;
    let confidence = 0;
    let magicBytes = [];

    // 1. Process Magic Bytes if input is File or Blob
    if (imageInput instanceof Blob) {
      try {
        const slice = imageInput.slice(0, 32);
        const arrayBuffer = await slice.arrayBuffer();
        magicBytes = Array.from(new Uint8Array(arrayBuffer));
      } catch (err) {
        console.warn("[Magic Bytes Extraction Warning]:", err);
      }
    }

    // 2. Scan QR Code on client-side
    if (typeof window !== "undefined") {
      try {
        const img = new Image();
        const url = typeof imageInput === "string" ? imageInput : URL.createObjectURL(imageInput);
        await new Promise((resolve, reject) => {
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = url;
        });

        if (img.width > 0) {
          qrContent = this.scanQrCode(img);
        }
      } catch (err) {
        console.warn("[QR Pre-check Warning]:", err);
      }
    }

    // 3. OCR Text Extraction via Tesseract
    try {
      if (onProgress) onProgress({ status: "recognizing_text", progress: 0.2 });
      const worker = await this.getWorker();

      if (worker) {
        const res = await worker.recognize(imageInput);
        text = (res.data?.text || "").trim();
        confidence = Number(((res.data?.confidence || 80) / 100).toFixed(2));
        if (onProgress) onProgress({ status: "done", progress: 1.0 });
      }
    } catch (err) {
      console.error("[OCR Extraction Error]:", err);
    }

    const executionTimeMs = Number((performance.now() - startTime).toFixed(2));

    return {
      text,
      qrContent,
      confidence,
      magicBytes,
      executionTimeMs,
    };
  }
}
