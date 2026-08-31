// frontend/src/lib/ultra/themes.js
//
// ULTRA THEME ENGINE — 6 bảng màu điện ảnh (cinematic palettes) áp dụng runtime
// qua CSS custom properties trên <html data-ultra-theme="...">.
//
// Mỗi theme định nghĩa: accent chính/phụ, nền sâu, glow, và tham số cho canvas 3D
// (particleColor, roadColor, fogColor) để hiệu ứng WebGL đồng bộ với UI 2D.

export const ULTRA_THEMES = [
    {
        id: "saffron",
        name: "Saffron Obsidian",
        tagline: "Vàng nghệ trên đá đen — bản sắc gốc StudentHub",
        vars: {
            "--ux-accent": "#ffbc09",
            "--ux-accent-2": "#ffd15c",
            "--ux-accent-3": "#ea3810",
            "--ux-bg-0": "#070403",
            "--ux-bg-1": "#150604",
            "--ux-bg-2": "#210a07",
            "--ux-border": "#47140b",
            "--ux-text": "#ece7e0",
            "--ux-glow": "rgba(255, 188, 9, 0.42)",
            "--ux-glow-soft": "rgba(255, 188, 9, 0.14)",
        },
        three: { particle: "#ffbc09", road: "#ffd15c", fog: "#0b0503", rim: "#ea3810" },
        swatch: ["#ffbc09", "#ea3810", "#150604"],
    },
    {
        id: "cyber-teal",
        name: "Cyber Teal Deep",
        tagline: "Xanh ngọc lượng tử trên nền không gian sâu",
        vars: {
            "--ux-accent": "#34e7c4",
            "--ux-accent-2": "#06b6d4",
            "--ux-accent-3": "#6366f1",
            "--ux-bg-0": "#04070a",
            "--ux-bg-1": "#06110f",
            "--ux-bg-2": "#0a1a18",
            "--ux-border": "#12403a",
            "--ux-text": "#e2f7f2",
            "--ux-glow": "rgba(52, 231, 196, 0.42)",
            "--ux-glow-soft": "rgba(52, 231, 196, 0.14)",
        },
        three: { particle: "#34e7c4", road: "#06b6d4", fog: "#04090c", rim: "#6366f1" },
        swatch: ["#34e7c4", "#06b6d4", "#04070a"],
    },
    {
        id: "violet-nebula",
        name: "Violet Nebula",
        tagline: "Tinh vân tím điện & ánh magenta huyền ảo",
        vars: {
            "--ux-accent": "#ca56ed",
            "--ux-accent-2": "#a855f7",
            "--ux-accent-3": "#f472b6",
            "--ux-bg-0": "#07030c",
            "--ux-bg-1": "#0f0718",
            "--ux-bg-2": "#180c26",
            "--ux-border": "#3b1e52",
            "--ux-text": "#f1e6fb",
            "--ux-glow": "rgba(202, 86, 237, 0.42)",
            "--ux-glow-soft": "rgba(202, 86, 237, 0.14)",
        },
        three: { particle: "#ca56ed", road: "#a855f7", fog: "#08040e", rim: "#f472b6" },
        swatch: ["#ca56ed", "#f472b6", "#0f0718"],
    },
    {
        id: "arctic-glass",
        name: "Arctic Glass",
        tagline: "Kính băng Bắc Cực — sáng, sạch, độ tương phản cao",
        vars: {
            "--ux-accent": "#38bdf8",
            "--ux-accent-2": "#818cf8",
            "--ux-accent-3": "#22d3ee",
            "--ux-bg-0": "#050a12",
            "--ux-bg-1": "#0a1220",
            "--ux-bg-2": "#111c2f",
            "--ux-border": "#1e3a5f",
            "--ux-text": "#e6f2ff",
            "--ux-glow": "rgba(56, 189, 248, 0.42)",
            "--ux-glow-soft": "rgba(56, 189, 248, 0.14)",
        },
        three: { particle: "#38bdf8", road: "#818cf8", fog: "#050b13", rim: "#22d3ee" },
        swatch: ["#38bdf8", "#818cf8", "#0a1220"],
    },
    {
        id: "emerald-forge",
        name: "Emerald Forge",
        tagline: "Lục bảo nung chảy — tín hiệu an toàn & tăng trưởng",
        vars: {
            "--ux-accent": "#10b981",
            "--ux-accent-2": "#34d399",
            "--ux-accent-3": "#a3e635",
            "--ux-bg-0": "#030806",
            "--ux-bg-1": "#04140d",
            "--ux-bg-2": "#072016",
            "--ux-border": "#12472f",
            "--ux-text": "#e4f7ee",
            "--ux-glow": "rgba(16, 185, 129, 0.42)",
            "--ux-glow-soft": "rgba(16, 185, 129, 0.14)",
        },
        three: { particle: "#10b981", road: "#34d399", fog: "#030a07", rim: "#a3e635" },
        swatch: ["#10b981", "#a3e635", "#04140d"],
    },
    {
        id: "crimson-alert",
        name: "Crimson Alert",
        tagline: "Chế độ báo động — đỏ thẫm cường độ cao",
        vars: {
            "--ux-accent": "#f43f5e",
            "--ux-accent-2": "#fb7185",
            "--ux-accent-3": "#f59e0b",
            "--ux-bg-0": "#0a0304",
            "--ux-bg-1": "#170508",
            "--ux-bg-2": "#24080d",
            "--ux-border": "#571620",
            "--ux-text": "#ffe8ec",
            "--ux-glow": "rgba(244, 63, 94, 0.42)",
            "--ux-glow-soft": "rgba(244, 63, 94, 0.14)",
        },
        three: { particle: "#f43f5e", road: "#fb7185", fog: "#0b0305", rim: "#f59e0b" },
        swatch: ["#f43f5e", "#f59e0b", "#170508"],
    },
];

export const DEFAULT_THEME_ID = "saffron";

export function getTheme(id) {
    return ULTRA_THEMES.find((t) => t.id === id) || ULTRA_THEMES[0];
}

/** Mức độ hiệu ứng: quyết định số hạt, blur, và có bật WebGL nặng hay không. */
export const MOTION_LEVELS = [
    {
        id: "cinematic",
        name: "Điện Ảnh",
        desc: "Toàn bộ hiệu ứng: WebGL, hạt, parallax, blur sâu",
        particleScale: 1,
        enableHeavy3D: true,
        blur: 24,
        parallax: 1,
    },
    {
        id: "balanced",
        name: "Cân Bằng",
        desc: "Giảm ~45% hạt, giữ 3D & animation chính",
        particleScale: 0.55,
        enableHeavy3D: true,
        blur: 16,
        parallax: 0.6,
    },
    {
        id: "performance",
        name: "Hiệu Năng",
        desc: "Tắt WebGL nặng, chỉ giữ transition CSS",
        particleScale: 0.2,
        enableHeavy3D: false,
        blur: 8,
        parallax: 0.25,
    },
    {
        id: "still",
        name: "Tĩnh Lặng",
        desc: "Không animation — tôn trọng prefers-reduced-motion",
        particleScale: 0,
        enableHeavy3D: false,
        blur: 0,
        parallax: 0,
    },
];

export const DEFAULT_MOTION_ID = "cinematic";

export function getMotionLevel(id) {
    return MOTION_LEVELS.find((m) => m.id === id) || MOTION_LEVELS[0];
}

/** Áp theme vào documentElement. An toàn khi gọi nhiều lần. */
export function applyThemeToDocument(themeId) {
    if (typeof document === "undefined") return;
    const theme = getTheme(themeId);
    const root = document.documentElement;
    root.setAttribute("data-ultra-theme", theme.id);
    Object.entries(theme.vars).forEach(([key, value]) => {
        root.style.setProperty(key, value);
    });
}

export function applyMotionToDocument(motionId) {
    if (typeof document === "undefined") return;
    const level = getMotionLevel(motionId);
    const root = document.documentElement;
    root.setAttribute("data-ultra-motion", level.id);
    root.style.setProperty("--ux-blur", `${level.blur}px`);
    root.style.setProperty("--ux-parallax", String(level.parallax));
}

export const STORAGE_KEYS = {
    theme: "ultra_theme_id",
    motion: "ultra_motion_id",
    sound: "ultra_sound_enabled",
    grain: "ultra_grain_enabled",
    cursor: "ultra_cursor_enabled",
};
