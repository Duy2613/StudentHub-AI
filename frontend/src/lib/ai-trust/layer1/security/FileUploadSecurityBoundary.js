/**
 * File/upload boundary used by Layer 1 and by security evaluations.
 *
 * FileDetector owns binary inspection. This boundary owns the checks that
 * require upload metadata or an external payload policy (dangerous extensions,
 * archive traversal, compression ratios, EXIF/QR text and empty uploads).
 * It deliberately returns structured observations so callers cannot turn a
 * test fixture flag into a security decision.
 */

import { FileDetector } from "../detectors/FileDetector.js";
import { LAYER_1_CONFIG } from "../config/Layer1Config.js";
import { LAYER_1_REASONS, SIGNAL_SEVERITY, createSignal } from "../types.js";
import { LiveWebRetrievalService } from "../../../server/trust/LiveWebRetrievalService.js";

const DANGEROUS_EXTENSIONS = new Set([
  "apk", "appx", "bat", "cmd", "com", "cpl", "dll", "dmg", "exe", "hta",
  "jar", "js", "jse", "lnk", "msi", "msp", "ps1", "scr", "sh", "svg",
  "vbe", "vbs", "wsf", "wsh"
]);

function extensionChain(fileName = "") {
  const cleanName = String(fileName || "").toLowerCase().split(/[\\/]/).pop();
  return cleanName
    .split(".")
    .filter(Boolean)
    .map((part) => part.replace(/%00.*$/i, ""));
}

function hasPathTraversal(fileName = "") {
  const cleanName = String(fileName || "").replace(/\\/g, "/");
  return cleanName.includes("\0") || /(?:^|\/)\.\.(?:\/|$)/.test(cleanName);
}

function signal(type, severity, evidence, confidence = 0.99) {
  return createSignal({
    type,
    category: "file",
    severity,
    confidence,
    evidence,
    source: "FileUploadSecurityBoundary",
  });
}

export class FileUploadSecurityBoundary {
  static inspect({
    bytes = null,
    fileName = "",
    filename = fileName,
    mimeType = "",
    fileSize = 0,
    compressionRatio = null,
    qrText = "",
    exif = "",
    isXml = false,
  } = {}) {
    const signals = [];
    const normalizedSize = Number(fileSize);
    const name = String(filename || fileName || "");
    const parts = extensionChain(name);
    const terminalExtension = parts.at(-1) || "";

    const detectorResult = FileDetector.detect({
      bytes,
      fileName: name,
      mimeType,
      fileSize: normalizedSize,
    });
    signals.push(...detectorResult.signals);

    if (normalizedSize === 0 && (bytes === null || bytes?.length === 0)) {
      signals.push(signal(
        LAYER_1_REASONS.INVALID_INPUT,
        SIGNAL_SEVERITY.HIGH,
        { details: "Empty file upload has no verifiable content." },
        0.98,
      ));
    }

    if (parts.some((part) => DANGEROUS_EXTENSIONS.has(part))) {
      signals.push(signal(
        LAYER_1_REASONS.DANGEROUS_EXTENSION,
        SIGNAL_SEVERITY.CRITICAL,
        { claimedExtension: `.${terminalExtension}`, details: "Executable or active-content extension is not accepted." },
      ));
    }

    if (hasPathTraversal(name)) {
      signals.push(signal(
        LAYER_1_REASONS.INVALID_INPUT,
        SIGNAL_SEVERITY.CRITICAL,
        { details: "Archive/file name contains a path traversal or NUL byte." },
      ));
    }

    if (Number.isFinite(compressionRatio) && compressionRatio > 100) {
      signals.push(signal(
        LAYER_1_REASONS.PAYLOAD_LIMIT_EXCEEDED,
        SIGNAL_SEVERITY.CRITICAL,
        { compressionRatio, maximumRatio: 100, details: "Compression ratio exceeds decompression-bomb guard." },
      ));
    }

    if (isXml && /<!ENTITY\s+[^>]+SYSTEM|<!ENTITY\s+\w+\s+"/i.test(String(exif || ""))) {
      signals.push(signal(
        LAYER_1_REASONS.MALWARE_PATTERN,
        SIGNAL_SEVERITY.CRITICAL,
        { details: "XML entity expansion payload rejected." },
      ));
    }

    if (/<script\b|javascript\s*:|<svg\b|on\w+\s*=/i.test(String(exif || ""))) {
      signals.push(signal(
        LAYER_1_REASONS.MALWARE_PATTERN,
        SIGNAL_SEVERITY.CRITICAL,
        { details: "Active content in metadata rejected." },
      ));
    }

    if (qrText && (!LiveWebRetrievalService.isSafeUrl(String(qrText)) || /^(?:javascript|data|file|vbscript|blob):/i.test(String(qrText).trim()))) {
      signals.push(signal(
        LAYER_1_REASONS.QR_MALICIOUS_URL,
        SIGNAL_SEVERITY.CRITICAL,
        { details: "QR payload is not an allowed public HTTP(S) URL." },
      ));
    }

    const hasCritical = signals.some((item) => item.severity === SIGNAL_SEVERITY.CRITICAL);
    const hasHigh = signals.some((item) => item.severity === SIGNAL_SEVERITY.HIGH);
    const blocked = hasCritical || normalizedSize > LAYER_1_CONFIG.LIMITS.MAX_FILE_SIZE_BYTES || normalizedSize === 0;

    return {
      blocked,
      detectedType: detectorResult.detectedType,
      signals,
      reasons: [...new Set(signals.map((item) => item.type))],
      severity: hasCritical ? SIGNAL_SEVERITY.CRITICAL : hasHigh ? SIGNAL_SEVERITY.HIGH : null,
    };
  }
}
