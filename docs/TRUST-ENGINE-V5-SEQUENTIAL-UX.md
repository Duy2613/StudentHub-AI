# Trust Engine V5 — Sequential UX

The Trust page presents a seven-card vertical timeline from `TrustPipelineTimeline.jsx`. The cards are not a single AI verdict: every card has its own operation status and finding.

## Required card fields

Each card visibly presents:

1. What the stage is checking.
2. Operation status (`NOT_STARTED`, `RUNNING`, `COMPLETED`, `PARTIAL`, `FAILED`, `SKIPPED`, or `BLOCKED`).
3. The stage's own finding, including an explicit no-finding state before execution.
4. Signals and evidence references, or an explicit “none reported” message.
5. What the finding means.
6. What the finding does not prove.
7. Limitations.
8. The next stage.

The header keeps stage name, status and finding visible. The body is rendered as ordinary text and lists, so mobile users and assistive technology do not depend on color, animation, or a graph.

## Interaction states

- Before analysis: all seven cards are visible as `NOT_STARTED`; no final result is shown.
- During analysis: only the current stage is `RUNNING`; earlier cards retain their findings and later cards remain not started.
- Retry: the timeline shows `STAGE_RETRY_SCHEDULED`; only the transient L2A/L3 boundary is rerun.
- Cancellation: the current request is marked cancelled in server state and the browser ignores stale callbacks.
- Partial/failure: the card remains visible with a typed failure and limitation; the page keeps rendering instead of showing a white screen.
- Final: L4's three axes and L5's assurance status are shown alongside the cards. “Pipeline completed” is not rendered as “safe”.

## Accessibility and responsive behavior

- The timeline is an ordered list with stable `data-stage-id`, operation status and finding attributes.
- Status updates use `aria-live`; critical hard-negative findings use assertive announcement.
- All meaning is textual; warning colors are supplemental only.
- Every action remains keyboard reachable.
- The two-column field grid collapses to one column on narrow screens.
- Reduced-motion users receive no required animation; the global reduced-motion rule disables transitions/animation.
- Print output retains the stage report and hides the input/interactive graph controls.
