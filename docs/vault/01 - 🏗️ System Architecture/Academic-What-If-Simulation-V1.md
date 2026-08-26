# Academic Planning & What-If Simulator V1

## 1. Architectural Mission & Invariant Guarantees

The **Academic Planning & What-If Simulator V1** enables students to explore hypothetical scenarios (*"What if I score TOEIC 550?", "What if I complete Course X?", "What if I earn 15 credits?"*) and observe the projected downstream effects on **Eligibility** and **Personal Roadmap** without mutating real academic records.

```text
CURRENT REAL STATE (Profile360 + DigitalTwin + Curriculum)
                       │
                       ▼
             IMMUTABLE SANDBOX CLONE
                       │
                       ▼
           TYPED WHAT-IF SCENARIO INPUTS
    (TOEIC Score, Credits, GPA, Course Completion)
                       │
                       ▼
          SIMULATED DIGITAL TWIN (in-memory)
                       │
                       ▼
            CANONICAL ENGINES COMPOSITION
   ┌───────────────────┼───────────────────┐
   ↓                   ↓                   ↓
Simulated          Simulated           Simulated
Eligibility         Roadmap             Workflow
   └───────────────────┼───────────────────┘
                       │
                       ▼
           DELTA & EXPLAINABILITY ENGINE
                       │
                       ▼
            WHAT-IF SIMULATION RESULT
  (CURRENT vs WHAT-IF vs PROJECTED DELTA, mode: "SIMULATION")
```

### Absolute Invariants:
1. **Simulation != Reality**: Simulation is a **pure in-memory projection**. It NEVER mutates `StudentProfile360Store`, `StudentDigitalTwinStore`, `AcademicRecordsStore`, `AcademicTaskStore`, `AcademicNotificationStore`, or document snapshot stores.
2. **Composition of Existing Engines**: The simulator directly composes `AcademicEligibilityEngine.evaluateEligibility()` and `AcademicRoadmapEngine.buildStudentRoadmap()` on the sandbox clone — zero duplicated or parallel eligibility/milestone rules.
3. **Forbidden Mutation Firewall**: Direct override operations such as `FORCE_ELIGIBLE`, `FORCE_COMPLETED`, or arbitrary root field tampering are strictly rejected at the validation boundary.
4. **Transparent Explainability**: Every delta produces a human-readable Vietnamese explanation detailing what changed, which curriculum policy triggered it, and which downstream milestone was unlocked.
5. **Session-Bound Authorization**: Simulation endpoints reject client-supplied `studentId` overrides and bind strictly to authenticated session credentials.

---

## 2. Supported Scenario Operations & Validation Matrix

| Operation Type | Value Payload | Semantic Effect | Boundary Constraints |
| :--- | :--- | :--- | :--- |
| `SET_GPA` | `value: number` | Simulates target CGPA | $0.00 \le \text{GPA} \le 4.00$ |
| `ADD_CREDITS` | `value: number` | Adds credits to earnedCredits | Integer $1 \le \Delta \le 150$ |
| `COMPLETE_COURSE` | `courseCode: string` | Simulates completion of curriculum course | Valid course code string |
| `SET_CERTIFICATE_SCORE` | `type: string, score: number` | Simulates language certificate result | Score $\ge 0$, $\le 990$ (TOEIC) |
| `VERIFY_CERTIFICATE` | `type: string` | Simulates certificate verification inside sandbox | Sandbox scope only |
| `SET_TUITION_CLEARANCE` | `isCleared: boolean, remainingDebt: number` | Simulates fee payment / debt clearance | $\text{Debt} \ge 0$ |
| `SATISFY_REQUIREMENT` | `requirementId: string` | Simulates generic requirement fulfillment | Valid requirement ID |

---

## 3. Delta Model & Explainability

```json
{
  "simulationId": "SIM_24110001_1771985000000",
  "mode": "SIMULATION",
  "isSimulated": true,
  "baseRevisions": {
    "profileRevision": 3,
    "twinRevision": 2,
    "curriculumVersion": "HCMUTE_SE_2024"
  },
  "baseline": {
    "cgpa": 2.85,
    "earnedCredits": 115,
    "eligibilityStatus": "PARTIALLY_ELIGIBLE",
    "roadmapProgress": { "completed": 3, "total": 7, "percentage": 43 }
  },
  "projected": {
    "cgpa": 3.20,
    "earnedCredits": 150,
    "eligibilityStatus": "ELIGIBLE",
    "roadmapProgress": { "completed": 6, "total": 7, "percentage": 86 }
  },
  "deltas": [
    {
      "deltaId": "DELTA_ELIGIBILITY",
      "type": "CHANGED",
      "before": "PARTIALLY_ELIGIBLE",
      "after": "ELIGIBLE",
      "summary": "Điều kiện xét duyệt học vụ chuyển sang ELIGIBLE.",
      "whyItChanged": "Tất cả các tiêu chí xét tốt nghiệp theo khung CTĐT HCMUTE_SE_2024 đã được đáp ứng trong kịch bản giả định."
    }
  ]
}
```

---

## 4. UI Architecture & Navigation

- **Page**: `/academic/planner` (Server-Rendered Component with zero client waterfall).
- **Interactive Component**: `AcademicWhatIfPlannerView.jsx` with real-time slider/preset controls, side-by-side comparison, and action bridges to official university workflows.
- **Entry Points**: Direct access from `AcademicCommandCenter.jsx` (Journey Card) and `AcademicRoadmapView.jsx` (Header badge).
