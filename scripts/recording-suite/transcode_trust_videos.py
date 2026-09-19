import os
import sys
from pathlib import Path
import cv2
import numpy as np
import hashlib
import json

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
EVIDENCE_DIR = REPO_ROOT / "artifacts" / "trust-assurance" / "2026-09-18"
RAW_DIR = EVIDENCE_DIR / "videos" / "raw"
FINAL_DIR = EVIDENCE_DIR / "videos" / "final"
SCREENSHOTS_DIR = EVIDENCE_DIR / "screenshots"
FINAL_DIR.mkdir(parents=True, exist_ok=True)

print("========================================================")
print("STARTING TRUST ASSURANCE V3 VIDEO TRANSCODING ENGINE")
print(f"RAW_DIR:   {RAW_DIR}")
print(f"FINAL_DIR: {FINAL_DIR}")
print("========================================================\n")

def draw_header_banner(frame, title, subtitle="STUDENTHUB AI — TRUST V5 EVIDENCE-CENTRIC ASSURANCE V3"):
    h, w, _ = frame.shape
    overlay = frame.copy()
    banner_h = 44
    cv2.rectangle(overlay, (0, 0), (w, banner_h), (15, 23, 42), -1)
    cv2.addWeighted(overlay, 0.85, frame, 0.15, 0, frame)
    cv2.line(frame, (0, banner_h), (w, banner_h), (51, 65, 85), 1)
    cv2.circle(frame, (20, 22), 5, (0, 220, 130), -1)
    cv2.putText(frame, title, (36, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.60, (241, 245, 249), 2, cv2.LINE_AA)
    cv2.putText(frame, subtitle, (w - 470, 27), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (148, 163, 184), 1, cv2.LINE_AA)
    return frame

def transcode_video(source_path, dest_path, title, target_fps=24.0, target_size=(1440, 900)):
    cap = cv2.VideoCapture(str(source_path))
    if not cap.isOpened():
        print(f"  [ERROR] Cannot open {source_path}")
        return None

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(str(dest_path), fourcc, target_fps, target_size)
    frame_count = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        if (frame.shape[1], frame.shape[0]) != target_size:
            frame = cv2.resize(frame, target_size, interpolation=cv2.INTER_AREA)
        frame = draw_header_banner(frame, title)
        out.write(frame)
        frame_count += 1

    cap.release()
    out.release()
    print(f"  [TRANSCODED] {dest_path.name} ({frame_count} frames, {frame_count/target_fps:.1f}s)")
    return dest_path

TARGET_VIDEOS_V3 = [
    {"src": "trust-layer-output-evidence-centric-v3.webm", "dest": "trust-layer-output-evidence-centric-v3.mp4", "title": "TRUST V3: EVIDENCE-CENTRIC 5-LAYER ASSURANCE & REAL CITATIONS"},
    {"src": "trust-external-text-v3.webm", "dest": "trust-external-text-v3.mp4", "title": "TRUST V3: EXTERNAL TEXT BLIND CORPUS PROVENANCE & FACT-CHECK"},
    {"src": "trust-external-url-v3.webm", "dest": "trust-external-url-v3.mp4", "title": "TRUST V3: EXTERNAL URL REPUTATION & SSRF FAIL-CLOSED SHIELD"},
    {"src": "trust-real-image-corpus-v3.webm", "dest": "trust-real-image-corpus-v3.mp4", "title": "TRUST V3: REAL-WORLD OPTICAL IMAGE INTAKE & PREVIEW HARD-GATE"},
    {"src": "trust-ai-image-corpus-v3.webm", "dest": "trust-ai-image-corpus-v3.mp4", "title": "TRUST V3: AI SYNTHETIC IMAGE GENERATION FORENSICS & SIGNALS"},
    {"src": "trust-image-edge-matrix-v3.webm", "dest": "trust-image-edge-matrix-v3.mp4", "title": "TRUST V3: TRANSFORMED IMAGE MATRIX (JPEG Q10, RESIZE, NOISE)"},
    {"src": "trust-qr-corpus-v3.webm", "dest": "trust-qr-corpus-v3.mp4", "title": "TRUST V3: COMPREHENSIVE QR MATRIX (ROTATION, MULTI, CONTENT)"},
    {"src": "trust-qr-security-v3.webm", "dest": "trust-qr-security-v3.mp4", "title": "TRUST V3: ADVERSARIAL QR SSRF BLOCKING & PROTOCOL DEFENSE"},
    {"src": "trust-gemini-result-priority-v3.webm", "dest": "trust-gemini-result-priority-v3.mp4", "title": "TRUST V3: GEMINI P26 RESULT-PRIORITY FAILOVER ASSURANCE"},
    {"src": "trust-gemini-all-model-assurance-v3.webm", "dest": "trust-gemini-all-model-assurance-v3.mp4", "title": "TRUST V3: GEMINI 6-MODEL BENCHMARK & ROUTING TELEMETRY"},
    {"src": "blind-review-side-by-side-v3.webm", "dest": "blind-review-side-by-side-v3.mp4", "title": "TRUST V3: EXPERT DIALECTIC BLIND REVIEW SIDE-BY-SIDE"},
    {"src": "trust-zero-rerun-v3.webm", "dest": "trust-zero-rerun-v3.mp4", "title": "TRUST V3: ZERO-RERUN CACHED EXECUTION & NO-DATA-LOSS"},
]

def main():
    success_count = 0
    manifest = []

    for item in TARGET_VIDEOS_V3:
        raw_path = RAW_DIR / item["src"]
        final_path = FINAL_DIR / item["dest"]

        if raw_path.exists():
            print(f"Transcoding {item['src']} -> {item['dest']}...")
            res = transcode_video(raw_path, final_path, item["title"])
            if res:
                success_count += 1
                manifest.append({
                    "name": item["dest"],
                    "title": item["title"],
                    "bytes": final_path.stat().st_size,
                    "sha256": hashlib.sha256(final_path.read_bytes()).hexdigest(),
                })
        else:
            print(f"  [MISSING RAW] {item['src']} not found in {RAW_DIR}")

    print(f"\nSuccessfully transcoded {success_count}/{len(TARGET_VIDEOS_V3)} V3 videos to {FINAL_DIR}")
    (EVIDENCE_DIR / "videos_manifest_v3.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")

if __name__ == "__main__":
    main()
