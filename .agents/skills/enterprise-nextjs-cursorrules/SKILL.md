---
name: enterprise-nextjs-cursorrules
description: Enterprise architecture rules for Next.js 16+ App Router, React 19, Tailwind CSS v4, and clean state handling based on patrickjs/awesome-cursorrules.
---

# Enterprise Next.js App Router Rules (patrickjs/awesome-cursorrules)

## 1. App Router & Server/Client Boundary
- Mark interactive components with `"use client";` at the very top.
- Keep server-only logic (API routes, proxy handling, secrets) strictly in Server Components or `/api/...` route handlers.
- Never use deprecated Next.js patterns (e.g. `pages/` routing paradigms in `app/`).

## 2. Defensive Error Handling & Hydration Safety
- Always wrap browser-dependent APIs (`localStorage`, `window.matchMedia`, `IntersectionObserver`, `AudioContext`) in client-side `useEffect` or `typeof window !== "undefined"` checks to eliminate SSR hydration mismatches.
- Always implement defensive fallback values for async Supabase / API fetch calls.

## 3. Tailwind CSS v4 & Styling Discipline
- Avoid ad-hoc inline styles for standard tokens; use curated CSS variables (`--color-trust-teal`, `--color-space-950`, `--ease-premium`).
- Hardware accelerate all motion transforms using `transform`, `opacity`, and `will-change`.
