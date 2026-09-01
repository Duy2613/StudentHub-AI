# 06 — Mobile, Responsive, and Accessibility Gaps

**Audit date:** 2026-09-01  
**Browser evidence:** local Next dev server on 127.0.0.1:3100; Playwright equivalent used because agent-browser was not installed. Screenshots were saved outside the repository. No source changes were made.

## P0 mobile finding

At a 390 × 844 viewport, the canonical app shell is not usable:

| Route | Main content x | Main content width | Observed consequence |
| --- | ---: | ---: | --- |
| /trust | 244 px | 146 px | headings and controls wrap into a narrow column; report content is visibly clipped/squeezed |
| /community | 244 px | 146 px | observation cards and feed layout are squeezed |
| /expert | 244 px | 146 px | directory/dossier content is squeezed |
| /cases | 244 px | 146 px | case lab becomes a narrow strip |
| /academic | 244 px | 146 px | canonical app content is squeezed |
| /dashboard | 270 px | 120 px | personal content is even narrower |
| / | 0 px | 390 px | Atlas landing has a separate, usable mobile composition |

The desktop baseline at 1440 px has a 240 px sidebar and a 1,200 px main region, so this is a responsive composition defect rather than a general content-width issue.

### Likely structural cause

MarginRail renders the desktop aside and a mobile details element in the same fragment. The desktop rail is hidden below 768 px, but the mobile element is displayed as a normal flex child inside app-body. app-body is display:flex, so the mobile navigation consumes horizontal space instead of behaving as a full-width overlay/row above main.

The current overflow assertion does not catch this: the browser reported document scrollWidth equal to clientWidth at 390 px. The content is being shrunk and clipped inside the viewport, not creating horizontal overflow. A future responsive gate must assert main content width and visual clipping, not only scrollWidth.

## Mobile composition assessment

### Good baseline

- Landing has intentionally different mobile sizing, crop, and hero composition.
- Canonical header exposes a labelled menu button with aria-expanded.
- Escape closes the open mobile navigation and command overlay.
- Trust input controls remain present in the DOM and are reachable in the narrow layout, although their container is not usable.

### Gaps

- Core mobile pages must place decision/action content first and defer graph/technical depth.
- The Margin navigation should be one coherent mobile control. Header menu and details strip currently represent the same state in different places.
- The Trust report needs mobile accordion/bottom-sheet behavior for technical evidence and screenshot annotations.
- Community needs a card/detail flow that does not depend on desktop two-column assumptions.
- Expert dossier needs a mobile sheet or stacked route with scope, evidence, and assessment actions.
- The current browser check did not cover all 39 page routes at the mobile matrix.

## Accessibility observations

### Browser Axe sample

One-off Axe runs were made at desktop and mobile sizes for the principal routes:

| Route group | Result |
| --- | --- |
| /trust, /community, /expert | Only a minor aria-allowed-role issue on the editorial doc-noteref annotation in the sampled page |
| /login | Moderate landmark-one-main, page-has-heading-one, and region findings affecting 10 nodes |
| /academic/profile, /intelligence/knowledge | No sampled violations |

The existing official accessibility suite filters for serious and critical violations. Therefore the login findings are not a contradiction of the current 6/6 serious/critical release result; they are a coverage/quality gap that should be triaged before a WCAG 2.2 AA claim.

### Keyboard and focus behavior

- The mobile menu opens and closes with the labelled header button and Escape.
- Ctrl/Cmd+K opens the command dialog and autofocuses its input.
- Closing the command dialog leaves focus on no useful trigger in the observed run; focus restoration is not implemented.
- The command dialog source has no verified focus trap.
- Trust input buttons use role=tab and aria-selected, but source inspection found no explicit aria-controls, tabIndex management, or arrow-key tab navigation. Pressing ArrowRight on the first tab did not move selection/focus in the browser check.
- TrustGraph has a list fallback, but keyboard node selection and announced graph traversal were not observed.
- The image drop zone itself is not a keyboard activation target; its inner upload button is the accessible control.

## Current responsive test coverage

The repository has useful coverage for the canonical Trust, Community, and Expert pages at 360, 390, 768, 1280, 1440, and 1920, plus selected Academic/Profile and Intelligence/Knowledge checks at 320 and 768. It includes reduced-motion checks and an overflow assertion.

Coverage still misses:

- main-content-width/clipping assertions that catch the 390 px Margin defect;
- a route matrix for all 39 page routes;
- authenticated and signed-out variants for every core path;
- mobile Trust image annotation, Graph/list, Passport, and error states;
- mobile Community observation detail/corroboration;
- mobile Expert authority/assessment/review states;
- focus trap and focus restoration assertions for command/dossier dialogs;
- arrow-key tab behavior and graph keyboard behavior;
- moderate axe findings on login and non-core route landmarks;
- Edge and a complete Firefox-on-Windows parity run.

## Required responsive and a11y gate

Before design handoff, the acceptance matrix should include:

    widths: 360, 390, 430, 768, 1024, 1280, 1440, 1920
    browsers: Chromium, Edge, Firefox, WebKit
    states: live, demo, signed-out, slow, offline, timeout, 401, 403, 404, 429, 500, 503
    checks: content width, visual clipping, keyboard order, focus trap/restore,
             labels, error association, contrast, reduced motion, touch targets

The verified 390 px failure is a release blocker for the canonical app baseline. It should be fixed or explicitly dispositioned before any visual reference screenshot is treated as a design source of truth.
