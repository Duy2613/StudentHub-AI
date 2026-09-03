# Visual Handoff — Trust Input

**Status:** `READY_FOR_ANTIGRAVITY`  
**Feature:** `/trust` investigation input  
**Owner:** Antigravity visual; Luna contract/domain  
**Date:** 2026-09-01

## USER GOAL

Give a student a calm, bounded way to submit a URL, text/message, screenshot/image, or QR-ready content for investigation before taking action.

## INFO HIERARCHY

1. What can be checked and what will not be claimed.
2. Input mode and bounded input control.
3. Validation/privacy/source disclosure.
4. Start, cancel, retry, or safe next action.

## DATA CONTRACT

Input modes are `URL`, `TEXT`, `MESSAGE`, `IMAGE`, `SCREENSHOT`, and `QR_READY`. Uploads are limited by the existing client/server contract (PNG/JPG/WEBP, 8 MB). OCR/entity confirmation is a client hint only; raw input is not automatically a Passport record. Preserve `caseId`, `runId`, `caseRevision`, `requestId`, provenance, and source mode where returned.

## STATE CONTRACT

Support `IDLE`, `VALIDATING`, `OCR_RUNNING`, `ENTITY_REVIEW`, `NORMALIZED`, `LOADING`, `PARTIAL`, `UNKNOWN`, `INSUFFICIENT_EVIDENCE`, `UNAVAILABLE`, `ERROR`, `OFFLINE`, and `CANCELLED`. Invalid input fails closed. No report placeholder may look like a completed investigation.

## INTERACTION

Mode changes reset incompatible local hints. Validate URL/text before submit, keep upload cancelable, show preview only for the selected file, and preserve explicit confirmation for OCR entities. A QR-ready path may show “content extracted/provided”; it may not imply QR decoding or provider verification.

## DESKTOP / TABLET / MOBILE

- Desktop: input and explanation are adjacent, with the primary Trust action prominent.
- Tablet: preserve mode switching and validation copy without hiding provenance.
- Mobile: use full-width controls, safe file input, readable error/status text, and no clipped preview or action row.

## ACCESSIBILITY

Every mode control has a label and selected state. File errors are associated with the input. Async progress and cancellation are announced; focus returns to the triggering control after dismissing an inspector/dialog.

## PERFORMANCE BUDGET

Keep OCR/QR helpers route-scoped or lazy; never load model weights or canvas globally. Preserve the `/trust` route budget of `500,000` bytes.

## ALLOWED FILES

Trust input composition/styles, input-focused tests, and feature-owned visual assets that do not change the provider or state contract.

## FORBIDDEN FILES

Backend/API/schema/provider/auth files, OCR truth logic, route ownership, automatic persistence, unsafe remote fetches, or invented coordinates/confidence.

## VISUAL FREEDOM

Choose the input layout, preview treatment, empty/error/loading choreography, and restrained feedback treatment while preserving the state labels and Trust-first hierarchy.

## SEMANTIC RESTRICTIONS

Do not present client OCR as server evidence, a missing result as safe, or an input preview as a stored case. Do not hide input bounds or privacy implications.

## ACCEPTANCE

All six input modes, invalid input, upload bounds, cancel/reset, offline/unavailable, explicit demo disclosure, keyboard, mobile overflow, and reduced-motion tests remain green.

