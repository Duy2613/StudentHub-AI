---
name: spec-driven-development
description: Enforces Spec-Driven Development (github/spec-kit) for full-stack engineering. Mandates explicit state matrices (Triggers, Actions, Boundary Conditions, Error Paths) before writing code to eliminate vibe-coding and hallucinated architectures.
---

# Spec-Driven Development (github/spec-kit)

## 1. Principles
- **Zero Vibe-Coding**: Never guess or improvise application states. Every interactive component must define an explicit state transition table.
- **Defensive Boundary Architecture**: All API payloads, file uploads, and user inputs must have explicit boundary validations, early-exit guardrails, and optimistic/error fallbacks.

## 2. State Transition Matrix Template
Before implementing any core feature (e.g. AI Scam Checker, Trust Verification, Forum Post), verify:

| State | Trigger | Action / System Response | UI Feedback / Micro-animation | Error / Boundary Handling |
| :--- | :--- | :--- | :--- | :--- |
| **Idle** | User loads page | Render clean inputs & default atmosphere | Ambient background particles | None |
| **Submitting** | Click verify / scan | Validate format, start 4-layer engine pipeline | Multi-stage progressive loader & pulsing node | Reject invalid URL / empty text |
| **Early Exit** | Whitelist / blacklist match | Early terminate layer 1/2 in $0.1\text{s}-0.5\text{s}$ | Instant Risk Gauge snap & XAI badge | Cache locally |
| **Deep AI Scan** | Complex scenario | Run Layer 3 RAG + Layer 4 Ensemble ($3\text{s}-5\text{s}$) | Staggered XAI breakdown table animation | Network timeout fallback to local heuristic |
| **Completed** | Results ready | Display dual 🤖 AI breakdown & 👨‍⚕️ Expert opinion | Risk Meter color sweep + share button | Offer dispute / feedback flow |
