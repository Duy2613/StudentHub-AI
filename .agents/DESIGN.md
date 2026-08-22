# StudentHub AI — Design System Specification
> Extracted & structured according to [Refero Styles](https://styles.refero.design/) principles.
> This file acts as a permanent design contract for all AI coding agents and frontend components.

---

## 1. Visual Identity & Mood
- **Archetype**: Futuristic Academic Studio / Dark Cybernetic Space / High-Precision Educational Hub.
- **Atmosphere**: Ultra-dark space canvas, deep radial violet/cyan glow mesh, razor-sharp frosted glass (`backdrop-blur-2xl`), kinetic spring animations.
- **Zero Generic AI Slop Rule**: Avoid flat borders, plain bootstrap colors, standard buttons, or plain 1-second linear spinners. Everything must feel crafted, weighted, and tactile.

---

## 2. Color Palette & Design Tokens

### 2.1 Backgrounds & Surfaces (Deep Space)
```css
--bg-space-950: #07090e; /* Primary canvas background */
--bg-space-900: #0c0f17; /* Elevated card surface */
--bg-space-850: #111522; /* Elevated modal surface */
--bg-space-800: #171c2d; /* Hover interactive surface */
--bg-space-700: #222941; /* Inactive border/element surface */
```

### 2.2 Brand & Kinetic Accents
```css
--accent-indigo: #6366f1;   /* Primary focal light */
--accent-purple: #a855f7;   /* Secondary ambient hue */
--accent-cyan:   #06b6d4;   /* High-tech data highlight */
--accent-jade:   #0caa8f;   /* Settigation Verified success teal */
--accent-amber:  #f59e0b;   /* Expert / VIP gold */
--accent-rose:   #f43f5e;   /* Alert / Destructive red */
```

### 2.3 Glass & Border Lighting
```css
--glass-bg: rgba(255, 255, 255, 0.03);
--glass-border: rgba(255, 255, 255, 0.08);
--glass-border-hover: rgba(255, 255, 255, 0.20);
--glass-border-focus: rgba(99, 102, 241, 0.50);
--glass-glow: 0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(99, 102, 241, 0.08);
```

---

## 3. Typography Hierarchy
- **Display / Headers**: `font-sans` with tight tracking (`tracking-tight`), gradient text fill (`bg-clip-text text-transparent bg-gradient-to-br from-white via-gray-200 to-indigo-200`).
- **Body**: `font-sans` regular/medium with high contrast reading values (`text-gray-300` / `text-gray-400`).
- **Code / Technical**: `font-mono` (`JetBrains Mono`, `Geist Mono`) for tokens, terminal outputs, and OTP numbers.

---

## 4. Motion & Micro-Interactions (Refero & Settigation Physics)
- **Cubic Bezier Easing**: `cubic-bezier(0.16, 1, 0.3, 1)` for snappy, premium spring-like deceleration.
- **Settigation Orbit Rotation**: Rotating elements along circular SVG paths with dashed stroke animation (`stroke-dasharray: 2 8`), 450-degree spinning orbit transitions upon completion.
- **Cinematic Ambient Lights**: Radial blur blobs (`blur-[140px]`) floating with 8s–12s keyframe periods to create dynamic studio depth.
