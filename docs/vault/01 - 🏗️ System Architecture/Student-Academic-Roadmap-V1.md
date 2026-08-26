# Student Academic Roadmap & Student Journey Projection V1

## 1. Architectural Role & Invariant Guarantees

The **Academic Roadmap** is a canonical downstream projection layer in StudentHub AI that synthesizes a student's holistic academic trajectory into a unified journey view:

```text
OFFICIAL SOURCES (HCMUTE SIS, IIG, Finance, CTSV)
                       ↓
   STUDENT PROFILE 360 + DIGITAL TWIN + ELIGIBILITY ENGINE
                       ↓
              WORKFLOW & DEADLINE ENGINES
                       ↓
       ┌──────────────────────────────────────┐
       │   ACADEMIC ROADMAP PROJECTION V1    │
       ├──────────────────────────────────────┤
       │  • Canonical Milestone Dependency DAG│
       │  • Curriculum-Aware Evaluation       │
       │  • Four Journey Zones (NOW/NEXT/...) │
       │  • Graduation Goal & Confidence      │
       │  • Traceable Workflow Linkage        │
       └──────────────────────────────────────┘
```

### Core Invariants:
1. **Read-Only Projection**: The Roadmap NEVER mutates upstream profile, twin, eligibility, workflow, or deadline state. All student interactions navigate to existing canonical workflow tasks.
2. **Deterministic & Idempotent**: Given the same source revisions (`profileRevision`, `twinRevision`, `eligibilityTwinRevision`), `buildStudentRoadmap()` produces bit-identical output.
3. **No Hardcoded Progress**: Milestone completion percentages and overall progress are calculated strictly as $\frac{\text{Satisfied Requirements}}{\text{Total Applicable Requirements}}$.
4. **Curriculum-Aware**: Evaluates requirements against cohort-specific curriculum rules (`HCMUTE_VERSIONED_CURRICULA`) — e.g. K23 requires TOEIC 450, K24/K25 require TOEIC 500, K26 requires TOEIC 550.
5. **Freshness & Conflict Propagation**: Inherits section-level provenance and freshness status (`FRESH`, `STALE`, `CONFLICTED`) from `StudentProfile360Model`. Never masks stale data.

---

## 2. Milestone Model & Dependency Graph

Milestones are coarse, authoritative academic checkpoints along the path to graduation:

```text
ACADEMIC_PROGRESS (150 Credits) ──┐
GPA_STANDING (CGPA >= 2.0) ───────┼──> THESIS_ELIGIBILITY ──> GRADUATION_APPLICATION ──> GRADUATION
LANGUAGE_REQUIREMENT (TOEIC) ─────┤
TUITION_CLEARANCE (Debt = 0) ─────┘
```

| Milestone Type | Requirement Mapping | Satisfied Condition |
| :--- | :--- | :--- |
| `ACADEMIC_PROGRESS` | `CREDITS_MIN` | $\text{earnedCredits} \ge \text{minCredits}$ |
| `GPA_STANDING` | `GPA_MIN` | $\text{CGPA} \ge \text{minGpa}$ |
| `LANGUAGE_REQUIREMENT` | `CERTIFICATE_PRESENT` | $\text{TOEIC Score} \ge \text{Cohort Threshold}$ |
| `TUITION_CLEARANCE` | `TUITION_CLEAR` | $\text{Remaining Debt} = 0 \lor \text{Waived}$ |
| `THESIS_ELIGIBILITY` | Derived Composite | Credits $\ge 110 \land \text{CGPA} \ge 2.0$ |
| `GRADUATION_APPLICATION` | Derived Composite | All prerequisites `COMPLETED` $\lor$ `WAIVED` |
| `GRADUATION` | Terminal Milestone | Dossier Approved $\land$ Registrar Verified |

---

## 3. Four Journey Presentation Zones

| Zone | Semantics | Source |
| :--- | :--- | :--- |
| **NOW (Active)** | Milestones currently `IN_PROGRESS`, `BLOCKED`, or `REVIEW_REQUIRED` | `roadmap.activeMilestones` + `roadmap.blockers` |
| **NEXT (Ready)** | Milestones that are `READY` to be undertaken immediately | `roadmap.nextMilestones` + `roadmap.nextAction` |
| **UPCOMING (Future)** | Milestones blocked by prerequisite dependencies or `NOT_STARTED` | `roadmap.upcomingMilestones` |
| **GOAL (Terminal)** | Graduation target term, estimated timeline, and overall completion | `roadmap.goal` + `roadmap.progress` |

---

## 4. API & Component Architecture

### Endpoints:
- `GET /api/academic/me/roadmap`: Returns authoritative roadmap projection for the authenticated student.

### UI Components:
- `app/academic/roadmap/page.jsx`: Server-Rendered Component fetching data server-side with zero waterfall.
- `components/academic/AcademicRoadmapView.jsx`: Interactive, accessible dashboard supporting all 4 journey zones.
- `components/academic/MilestoneDetailDrawer.jsx`: Slide-over detailing requirements, evidence, blockers, and dependencies.
