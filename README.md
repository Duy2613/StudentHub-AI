# ?? StudentHubAI Sequential — 4-Layer Verification Variant

> **Standalone Sequential Trust Engine variant of StudentHub AI, powered by the friend's 4-layer backend.**

## Overview
This repository contains the standalone, production-ready **Sequential Trust Engine** variant:
- **Layer 1:** Local Deterministic & Regex Screening
- **Layer 2:** Threat & URL Reputation Intelligence (Google Safe Browsing via \POST /api/verify/layer2\)
- **Layer 3:** Multi-Source Evidence Retrieval (Tavily search via \POST /api/verify/layer3\)
- **Layer 4:** Independent Synthesis & Reasoning (Groq / Gemini via \POST /api/verify/layer4\)

## Live Deployment
- **Production URL:** [https://studenthubai-sequential.vercel.app](https://studenthubai-sequential.vercel.app)
- **Trust Studio:** [https://studenthubai-sequential.vercel.app/trust](https://studenthubai-sequential.vercel.app/trust)

## Getting Started
\\\ash
cd frontend
npm install
npm run dev
\\\

