# Visual Handoff — Multimodal Trust

**Status:** `READY_FOR_ANTIGRAVITY`  
**Feature:** Screenshot/image/QR-ready interaction in `/trust`  
**Owner:** Antigravity visual; Luna input/OCR contract  
**Date:** 2026-09-01

## USER GOAL

Let a student inspect an uploaded image, understand extracted hints, confirm or reject entities, and continue to Trust without confusing client assistance for verified evidence.

## INFO HIERARCHY

1. Image preview and privacy/bounds.
2. OCR/QR extraction status and authority disclosure.
3. Entity inspector with explicit user confirmation.
4. Continue, replace, cancel, or start over.

## DATA CONTRACT

Accepted image types are PNG/JPG/WEBP up to 8 MB. OCR is `CLIENT_OCR_HINT`; confirmed entities are user-provided hints. Provider coordinates may be displayed only when returned, valid, and tied to the source image. Current local OCR does not fabricate coordinates.

## STATE CONTRACT

Use `IDLE`, `VALIDATING`, `OCR_RUNNING`, `OCR_PARTIAL`, `ENTITY_REVIEW`, `NORMALIZED`, `ERROR`, `UNAVAILABLE`, `OFFLINE`, and `CANCELLED`. Absence of OCR is unknown/partial, not a clean result. QR-ready content must disclose whether content was user-provided or provider-returned.

## INTERACTION

Preview is reversible. Entity checkboxes are opt-in hints and reset on file/mode/reset changes. Overlays are optional and must degrade to a text/list inspector. No auto-confirmation or destructive upload action.

## DESKTOP / TABLET / MOBILE

- Desktop: preview and entity list may sit side by side.
- Tablet: keep source image, disclosure, and confirmation action in the first viewport.
- Mobile: use a readable preview, scrollable list fallback, large controls, and no overlay-only interaction.

## ACCESSIBILITY

Provide alt/label text, keyboard-accessible entity controls, visible focus, text equivalents for overlays, and announcements for OCR completion/partial/cancelled state.

## PERFORMANCE BUDGET

Revoke temporary object URLs, lazy-load OCR/preview helpers, cap image work, and avoid global model/canvas imports.

## ALLOWED FILES

Multimodal preview, inspector, bounded image interaction, and feature-owned visual styles/tests.

## FORBIDDEN FILES

OCR truth/provenance changes, fake confidence or coordinates, server/provider/auth/API changes, unbounded uploads, or auto-persisting raw images.

## VISUAL FREEDOM

Choose preview framing, overlay treatment for validated coordinates, inspector composition, and mobile interaction pattern within the fallback contract.

## SEMANTIC RESTRICTIONS

Do not label OCR as verified, present a missing overlay as a failed scan, or imply that a checked entity is authoritative evidence.

## ACCEPTANCE

8 MB/type limits, OCR hint disclosure, no fabricated boxes, entity confirmation/reset, list fallback, keyboard/mobile access, cancellation, and reduced motion remain testable.

