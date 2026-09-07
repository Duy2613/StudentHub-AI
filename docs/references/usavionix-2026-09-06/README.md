# USAvionix / cogni:wave reference pack

## Scope

This folder stores local evidence collected for the StudentHub AI design synthesis on 2026-09-06.

The two supplied references are different works:

1. `https://www.usavionix.com/?ref=landing.love` is the primary website reference. It presents USAvionix autonomous aircraft and a long-form operational scrollytelling experience.
2. `20260906-0256-57.1295221.mp4` is a secondary motion reference. The recording shows a `cogni:wave` mental-wellness website showcase, not the USAvionix site and not an implementation instruction.

The original MP4 remains at:

`C:/Users/Duy/AppData/Local/Packages/Microsoft.ScreenSketch_8wekyb3d8bbwe/TempState/Recordings/20260906-0256-57.1295221.mp4`

The project does not copy or redistribute the original source site's assets. The PNGs in this folder are review evidence captured during this audit.

## Evidence files

- `video-metadata.json`: source hash and technical metadata for the supplied MP4.
- `video-contact-sheet.jpg`: 20 evenly spaced frames from the 15.367-second recording.
- `video-*.jpg`: individual sampled frames.
- `website-desktop-initial.png`: USAvionix initial hero at approximately 1262×624.
- `website-mobile-initial.png`: USAvionix initial hero at 390×844.
- `website-section-01.png`: Mission scene with three labeled drone units.
- `website-section-02.png`: Sync scene with radial motion and system telemetry.
- `website-section-03.png`: Detection scene with terrain map and thermal anomaly readout.
- `website-section-04.png`: Coordination scene with service areas, alerts, and status overlays.
- `website-section-05.png`: Response section with mission cards.

## Capture notes

The website was reviewed in Chromium with `agent-browser@0.36.0` on 2026-09-06. At a 1262×624 viewport, the homepage reported a document height of about 45,684 px and three canvas elements. At 390×844, the hero reflowed into a vertical aircraft-over-terrain composition with the primary heading and scroll CTA below it.

These observations describe the captured session. They do not certify the source site's production stack, asset ownership, data provenance, accessibility, or mobile performance outside the tested viewport.
