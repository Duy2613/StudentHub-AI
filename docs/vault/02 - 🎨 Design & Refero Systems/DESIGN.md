# 🎨 Refero Styles — Design System Tokens
> **Vault Node**: `DESIGN` | **Tags**: `#design-system` `#refero` `#tokens` `#styles`

---

## 1. Triết Lý Thiết Kế (Refero Standards)
- **Deep Space Matrix**: Sự kết hợp giữa nền không gian tối sâu thẳm `#07090e` và các quầng sáng cực quang tím, chàm và ngọc lục bảo.
- **Glassmorphism Chuẩn Mực**: Kính mờ siêu sâu `backdrop-blur-2xl` kết hợp viền sáng 1px thanh mảnh `rgba(255,255,255,0.08)`.

---

## 2. Bảng Mã Màu Chi Tiết

```css
/* Nền không gian */
--space-950: #07090e;
--space-900: #0c0f17;
--space-850: #111522;
--space-800: #171c2d;

/* Điểm nhấn & Trạng thái */
--accent-indigo: #6366f1;
--accent-purple: #a855f7;
--accent-cyan:   #06b6d4;
--accent-jade:   #0caa8f; /* Settigation Verified */
--accent-amber:  #f59e0b;
--accent-rose:   #f43f5e;
```

---

## 3. Digital Guardian Typography Tokens

```css
/* Human Interface — hướng dẫn, headings, body */
--font-human: var(--font-inter), var(--font-geist-sans), system-ui, sans-serif;

/* Machine Interface — AI output, OCR, scanner data */
--font-machine: var(--font-jetbrains-mono), var(--font-geist-mono), monospace;

/* Security Status Colors */
--color-threat-red: #ef4444;
--color-warn-amber: #f59e0b;
--color-safe-emerald: #10b981;
```

**Key Components**:
- `AITerminalBlock` @ `@/components/ui/AITerminalBlock`
- CSS classes: `.dg-terminal`, `.dg-alert-*`, `.dg-badge-machine`, `.dg-scan-btn`
- Full protocol: [[DESIGN|Agent DESIGN.md § Section 4]]

---

## 4. Liên Kết
- [[Settigation-OTP-Verification-v3|💫 Settigation Orbit OTP Component]]
- [[OpenHero-Cinematic-Aesthetics|🎬 OpenHero Cinematic Visuals]]
- [[UI-Component-Registry|📦 Danh Mục UI Components]]
