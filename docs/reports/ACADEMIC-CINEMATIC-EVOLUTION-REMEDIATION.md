# Academic Cinematic Evolution — remediation report

> **Historical first-pass record.** The authoritative final closure evidence, including the subsequent WebKit pass, fresh Lighthouse sample, and current blockers, is maintained in [STUDENTHUB-AI-RELEASE-ASSURANCE-REPORT.md](STUDENTHUB-AI-RELEASE-ASSURANCE-REPORT.md). Values in this document describe the earlier remediation checkpoint.

**Ngày kiểm tra:** 2026-09-06  
**Phạm vi:** critical-path performance của bốn route mobile canonical, theo feature freeze trong `pasted-text.txt`  
**Verdict trước remediation:** `ACADEMIC_CINEMATIC_EVOLUTION_NOT_RELEASE_READY`  
**Verdict hiện tại:** `ACADEMIC_CINEMATIC_EVOLUTION_NOT_RELEASE_READY`

Verdict vẫn giữ nguyên vì bằng chứng nội bộ trên Chromium đã cải thiện rõ rệt nhưng chưa đủ để chỉ còn blocker WebKit/Firefox. Chưa có Lighthouse CI xanh trên runner, dữ liệu field/RUM, thiết bị thật, canonical Preview, staging provider, hoặc live PostgreSQL/RLS/server-restart proof. Không tạo deployment mới trong lúc feature freeze còn hiệu lực.

## Vì sao chưa thể gọi là hoàn hảo 100%

Các lỗi critical-path đã được xử lý ở local production build, nhưng các giới hạn sau vẫn là lỗi phát hành hoặc khoảng trống bằng chứng:

1. **Chưa có cross-browser evidence.** Closure và axe đã chạy trên Chromium; Firefox/WebKit chưa chạy trên cùng profile mobile. Vì vậy chưa thể dùng verdict `COMPLETE_WITH_EXTERNAL_BLOCKERS` theo quy tắc freeze.
2. **Chưa có field evidence.** Không có RUM/CrUX hoặc thiết bị Android/iOS thật để kiểm chứng LCP, INP và tail latency. INP vẫn `NOT_MEASURED` đúng quy ước.
3. **Lighthouse CLI trên Windows không trả exit code 0.** JSON được ghi đầy đủ nhưng CLI thoát `1` khi dọn Chrome profile tạm với `EPERM`. Đây là lỗi môi trường/tooling cần xử lý ở runner trước khi biến Lighthouse CI thành release gate.
4. **Tail variance ngoài local chưa được chứng minh.** Ba run Roadmap local hiện tại là `2,420.6 / 2,390.5 / 2,367.6 ms`, đều dưới 2.5 s trong profile này. Cần kiểm tra lại trên Preview và nhiều thiết bị trước khi gọi là ổn định trong thực tế.
5. **Shared CSS vẫn lớn.** Stylesheet chung lớn nhất là `369,777 B` uncompressed và chứa legacy styles. Đây là nợ payload còn lại; chưa tách mù trong feature freeze vì chưa có proof route-specific nào đủ lợi ích.
6. **Lint còn nợ kỹ thuật.** `npm run lint` có `0 errors / 393 warnings`. Warnings không chặn build nhưng vẫn là lỗi chất lượng cần giảm dần.
7. **Các gate bên ngoài sản phẩm chưa được chứng minh.** Live ASP.NET/provider, PostgreSQL/RLS trên database sạch, session restart, staging observability và rollback thật vẫn `BLOCKED_BY_ENV` hoặc `NOT_EXECUTED`. Những thay đổi lần này không đụng backend, database, auth contract, RLS, storage hay security contract.
8. **Một số mốc runtime chưa có User Timing marks.** HTML/CSS/network và paint được quan sát trực tiếp; ứng dụng chưa phát mark định lượng cho “hydration complete”, AI drawer init và TOC observer init. Vì vậy các mốc đó không được tuyên bố như dữ liệu đo chính xác.

## Kết quả LCP trước và sau

Các giá trị “previous RC” là số liệu trong yêu cầu freeze. “Final local” là median của ba Lighthouse CLI 13.4.1 chạy cùng profile mobile DevTools trên production build hiện tại.

| Route | Previous RC | Final local median | Delta | Kết quả nội bộ |
| --- | ---: | ---: | ---: | --- |
| Landing `/` | 5,810 ms | 2,139.9 ms | −3,670.1 ms (−63.2%) | PASS mục tiêu median |
| Quiet Lesson `/learn/cs101/fullstack-intro` | 4,430 ms | 2,121.3 ms | −2,308.7 ms (−52.1%) | PASS mục tiêu median |
| Roadmap `/roadmap` | 5,930 ms | 2,390.5 ms | −3,539.5 ms (−59.7%) | PASS cả ba local run |
| Trust `/trust` | 5,370 ms | 2,243.5 ms | −3,126.5 ms (−58.2%) | PASS mục tiêu median |

Profile: viewport `360×640`, device scale factor `2`, `formFactor=mobile`, DevTools throttling, headless Chromium, ba run cho mỗi route. LCP và FCP trùng nhau trong các run vì candidate là text.

## True LCP phase breakdown

Lighthouse trace/JSON cho text candidates báo `RESOURCE_LOAD_DELAY = 0` và `RESOURCE_LOAD_DURATION = 0`. Phép tính khớp trong mọi run: `TTFB + ELEMENT_RENDER_DELAY = TOTAL_LCP`.

| Route | LCP candidate | TTFB median | Resource delay | Resource duration | Element render delay median | Total LCP median | CLS | TBT median |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | `section.relative … h1#hero-title` | 6.7 ms | 0 ms | 0 ms | 2,134.0 ms | 2,139.9 ms | 0.000 | 164.5 ms |
| `/learn/cs101/fullstack-intro` | first reading paragraph | 8.2 ms | 0 ms | 0 ms | 2,095.3 ms | 2,121.3 ms | 0.000 | 51.3 ms |
| `/roadmap` | visible milestone row | 4.7 ms | 0 ms | 0 ms | 2,386.4 ms | 2,390.5 ms | 0.000 | 42.7 ms |
| `/trust` | hero explanation paragraph | 4.5 ms | 0 ms | 0 ms | 2,239.0 ms | 2,243.5 ms | 0.000 | 67.6 ms |

The dominant cost is therefore render delay after a very small TTFB, not server data latency or an image resource. On Quiet Lesson, the main stylesheet finished at about `1,829.9 ms`; optional fonts were requested at `2,117.3–2,118.0 ms` and finished after the `2,121.3 ms` LCP. This explains why a fallback can paint before the webfont and why the font is not the direct LCP timestamp.

## Quiet Lesson critical request chain

The representative `lesson-3.json` trace is in `frontend/.lighthouseci/academic-mobile/final-canonical/`.

| Chronology | Resource | Transfer | Start → end | Priority | Before LCP? | Interpretation |
| --- | --- | ---: | ---: | --- | --- | --- |
| 1 | document `/learn/cs101/fullstack-intro` | 8,891 B | 0.5 → 608.1 ms | VeryHigh | yes | Contains the server-rendered route shell and reading content. |
| 2 | critical CSS chunk | 2,688 B | 601.4 → 1,233.3 ms | VeryHigh | yes | Render-blocking global CSS. |
| 3 | largest shared CSS chunk | 50,976 B transferred / 369,777 B resource | 601.7 → 1,829.9 ms | VeryHigh | yes | Main remaining render-blocking cost. |
| 4 | route CSS chunk | 2,192 B | 601.9 → 1,233.4 ms | VeryHigh | yes | Route/style layer needed for final layout. |
| 5 | shared and route JS chunks | 699–65,066 B each | 610.0 ms onward | Low | queued | Hydration and enhancement; not needed to obtain the SSR text candidate. |
| 6 | Be Vietnam Pro / JetBrains Mono font subsets | 5,019–31,640 B each | 2,117.3 ms onward | VeryHigh | queued | Optional font enhancement; responses finish after LCP. |
| 7 | deferred LessonCompanionPanel chunk | 6,379 B | 3,184.9 → 3,807.5 ms | Low | no | AI and notes enhancement requested only after the user opens the panel. |
| 8 | secondary chunks and RSC fetches | 1,231–16,838 B each | after 2,996 ms | Low | no | Post-LCP enhancement/navigation work. |

`BYTES_REQUESTED_BEFORE_LCP` counts requests whose network start is before LCP. `BYTES_REQUIRED_BEFORE_LCP` is the document plus the three render-blocking stylesheets; the SSR text candidate does not require optional fonts or hydration.

| Route | Bytes requested before LCP (median) | Bytes required before LCP | Total page transfer |
| --- | ---: | ---: | ---: |
| `/` | 386,268 B | 76,073 B | 776,227 B |
| `/learn/cs101/fullstack-intro` | 376,428 B | 64,747 B | 567,847 B |
| `/roadmap` | 393,424 B | 73,066 B | 594,703 B |
| `/trust` | 426,599 B | 64,144 B | 635,410 B |

The large gap between requested and required bytes is mostly low-priority JS and optional fonts queued before the text paint. The next payload opportunity is to reduce that queue, while preserving SSR behavior and the approved experience.

## Paint trace and runtime timeline

A Playwright performance trace and two screenshots were captured for Quiet Lesson at `frontend/.lighthouseci/academic-mobile/quiet-lesson-performance-trace.zip`, `quiet-lesson-initial.png`, and `quiet-lesson-after-3500ms.png`. The companion `quiet-lesson-trace-metrics.json` records the browser Performance API timeline. On the latest warm unthrottled trace, the document response began at `19.8 ms`, DOMContentLoaded fired at `181.2 ms`, first paint/FCP occurred at `212 ms`, and the text LCP candidate was a `DIV` paragraph at `212 ms`. The throttled Lighthouse trace is the release comparison above; its CSS/font order is the same, with the network stretched to the 2.1–2.4 s LCP window.

The app does not currently emit User Timing marks for hydration start/end, AI drawer initialization, or TOC observer initialization. Those exact application milestones are therefore recorded as **not instrumented**, rather than inferred from a chunk download. The trace shows the SSR text can paint before those optional enhancement paths; the closure suite confirms the controls remain usable after enhancement.

## Font and wallpaper audit

Only the approved families remain in `frontend/src`: **Be Vietnam Pro**, **Lora**, and **JetBrains Mono**. The removed drift names—Instrument Serif, Plus Jakarta Sans, and Inter Tight—have no remaining source references.

| Font | Weights emitted | Above-fold use | Preload / display | Result |
| --- | --- | --- | --- | --- |
| Be Vietnam Pro | 400, 700 | body, controls, primary headings | `preload:false`, `optional` | critical family with only rendered weights |
| Lora | 400, 600 | editorial sections when present | `preload:false`, `optional` | enhancement, not required for text LCP |
| JetBrains Mono | 400, 600 | metadata/code labels | `preload:false`, `optional` | enhancement; requested only where used |

On Quiet Lesson, the font requests begin after the CSS cost and complete after LCP. The LCP is therefore correlated with fallback text painting, not a late font swap. The final traces had zero CLS.

The global `BackgroundContext` maps no wallpaper to `/`, `/learn/cs101/fullstack-intro`, `/roadmap`, or `/trust`; all four traces contain zero `/wallpapers/` requests. For those canonical routes the active wallpaper format, transfer, start, end, priority, above-fold visibility, and required-before-LCP status are **N/A / not requested**. This verifies that the previous six-wallpaper, 5.02 MB flood is not on the canonical critical path. Landing's own approved hero/environment remains separate from the global wallpaper contract.

## What was upgraded and fixed

- Reduced the global font surface to the canonical three families, removed unapproved family references, disabled unnecessary preload, and kept only weights used by the UI.
- Split the global Command Palette and search graph behind the existing Cmd/Ctrl+K trigger while preserving focus restoration and keyboard behavior.
- Moved Lenis and the auth/Supabase bootstrap out of the first render; native scroll and public shell remain usable while optional modules load.
- Added a semantic SVG Knowledge Universe fallback and viewport-triggered `ssr:false` WebGL enhancement. WebGL data is now a light module, and renderer state is retained when the selected node changes.
- Added a server-first Trust shell containing the title, explanation, input modes, primary action, pipeline state, and unavailable provenance. The full Trust analysis island loads only after interaction; an import failure leaves the shell usable.
- Deferred landing sections below the hero with `content-visibility:auto` and an intrinsic size, without removing any section or changing the approved visual hierarchy.
- Extended the bundle audit to `/`, Quiet Lesson, Roadmap, Trust, Community, and Expert. Current initial-JS measurements are `152,993 / 77,095 / 88,360 / 79,683 / 68,522 / 68,549 B` respectively, all below the `500,000 B` interim budget.
- Split Quiet Lesson's AI Tutor and notes state into the interaction-only `LessonCompanionPanel`; the route now paints its reading shell without requesting that chunk before LCP.
- Updated the canonical Lighthouse config to the requested mobile profile and made the closure console assertion ignore the known unauthenticated `401` boundary while still failing on unexpected errors.

No backend, database, auth contract, RLS, storage, security contract, route inventory, or feature behavior was changed.

## State matrices

### Trust workspace

| State | What renders | Transition | Failure behavior |
| --- | --- | --- | --- |
| Initial | SSR hero, explanation, four mode tabs, input/action, READY pipeline, `UNAVAILABLE` disclosure | user focuses, clicks, changes mode, or submits | remains usable as a semantic shell |
| Enhancement requested | same shell while `AiTrustStudioView` imports | module resolves | preserve selected mode and draft content |
| Enhancement loaded | full Trust UI replaces the input shell while the critical hero remains | user submits a scan | provider/analyzer loads on demand |
| Enhancement import failure | critical hero/input shell remains | retry via another interaction | no fabricated finding or broken blank state |

### Knowledge Universe / Atlas

| State | What renders | Transition | Failure behavior |
| --- | --- | --- | --- |
| Initial | semantic SVG nodes with roles, labels, focus, and keyboard activation | viewport enters the observer root | no Three.js request is required for first paint |
| Enhancement requested | fallback stays visible | dynamic WebGL module resolves | preserve selected node id |
| WebGL ready | interactive 3D canvas | node selection changes | renderer remains mounted; no teardown loop |
| WebGL unavailable | SVG fallback remains the source of interaction | reduced motion/unsupported browser/error | no blank canvas and no runtime crash |

## Verification completed

| Gate | Evidence |
| --- | --- |
| Production build | `npm run build` passed; Next.js generated `124/124` static pages. |
| Bundle budget | `npm run audit:bundle` passed for six routes. |
| Full deterministic suites | `npm run test:all` passed: Layer 1 multimodal 148, Layer 2 14, Layer 3 8, Layer 4 8, Intelligence 14, Geospatial 9, Threat Intelligence 6. |
| Closure browser suite | Chromium `6/6` passed; measured timing run reported DCL 229 ms, load 419 ms, FCP 280 ms in the final local run. |
| Accessibility | Chromium axe/keyboard suite `14/14` passed, including completed Trust result and Trust keyboard reachability. |
| Lint | `0 errors / 393 warnings`; warnings are existing technical debt. |
| Working tree hygiene | `git diff --check` passed; temporary Lighthouse inspection files removed. |
| Closed freeze gates | Security 42/42, backend freeze, reduced motion, responsive, particle, Atlas, epistemic, and preview gates remain carried-forward baseline evidence; no contract changes were made. |

## Release follow-up

Before changing the verdict, run the same three-run profile against one canonical Preview in Chromium, Firefox, and WebKit; repair the Windows Lighthouse `EPERM` runner; collect real-device/field CWV; and execute staging provider, clean PostgreSQL/RLS, restart, and rollback proofs. Only then can the final status move from `ACADEMIC_CINEMATIC_EVOLUTION_NOT_RELEASE_READY` to a complete verdict.
