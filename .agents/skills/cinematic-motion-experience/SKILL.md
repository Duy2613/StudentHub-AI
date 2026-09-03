---
name: cinematic-motion-experience
description: Elite UI/UX motion engineering skill covering 4 pillars of agency-grade websites: Parallax Scrolling Depth, Morphing Magnetic Cursor, Smooth Load Page Transitions, and Cinematic Background Video Atmosphere. Designed for 60fps locked performance, mobile safety, and ultra-luxurious visual polish.
---

# Cinematic Motion Experience & Motion Design Skill

This skill documents and standardizes 4 core motion design techniques that elevate websites from basic templates to Awwwards-tier interactive experiences.

---

## 1. The 4 Pillars of Cinematic Motion

### 1.1 Parallax Scrolling Depth (Chiều Sâu Đa Tầng)
- **Principle**: Foreground and background elements translate at different velocities (`y * 0.2` vs `y * 0.8`), creating true 3D spatial hierarchy on scroll.
- **Implementation Rules**:
  - Use Framer Motion `useScroll()` & `useTransform()` with hardware-accelerated GPU values (`translateY`, `scale`, `opacity`).
  - Never animate layout properties (`top`, `left`, `margin`) during scroll.
  - Disable heavy parallax loops on mobile or when `prefers-reduced-motion` is active.

### 1.2 Morphing Magnetic Cursor (Con Trỏ Biến Hóa & Lực Hút)
- **Principle**: A custom two-tier cursor (Center Dot + Elastic Follower Ring) that morphs size, changes blend mode (`mix-blend-mode: difference`), snaps magnetically to interactive buttons/cards, and displays context badges (`"Explore"`, `"Copilot"`).
- **Implementation Rules**:
  - Suppress completely on touchscreens (`pointer: coarse` / `(hover: none)`).
  - Use Lerp or Framer Motion springs (`damping: 28, stiffness: 300`) for zero-lag cursor trailing.
  - Listen for data attributes `data-cursor="magnetic"` or `data-cursor-text="Xem"`.

### 1.3 Smooth Load Page Transitions (Chuyển Cảnh Mượt Mà)
- **Principle**: Seamless view transitions between routes using gentle scale-blur fade (`filter: blur(6px) -> blur(0px)`, `opacity: 0 -> 1`) and top loading energy bar.
- **Implementation Rules**:
  - Keep transition duration between `0.35s` and `0.5s` with `ease: [0.16, 1, 0.3, 1]` to prevent user waiting fatigue.
  - Ensure immediate interactivity without blocking clicks.

### 1.4 Cinematic Video Atmosphere (Không Gian Video Sống Động)
- **Principle**: Procedural video-grade animated canvas loops, anamorphic light flare sweeps, and bioluminescent gradient streams that give pages a living movie-like atmospheric presence.
- **Implementation Rules**:
  - Render with 60fps requestAnimationFrame and auto-pause when off-screen (`IntersectionObserver`).
  - Fall back to smooth CSS radial mesh gradients if canvas is unsupported.

---

## 2. Performance & Mobile Guardrails

1. **Hardware Acceleration**: Always use `transform: translate3d()` and `will-change: transform` sparingly.
2. **Touch Device Safety**: Touch screens do not have cursors; always check `window.matchMedia("(hover: hover) and (pointer: fine)").matches`.
3. **Reduced Motion**: Respect `@media (prefers-reduced-motion: reduce)`.
