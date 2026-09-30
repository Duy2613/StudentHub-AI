// frontend/src/lib/ultra/routes.js
//
// ULTRA ROUTE REGISTRY — Nguồn dữ liệu duy nhất (single source of truth) cho:
// - Command Palette (⌘K / Ctrl+K)
// - Spotlight Search & Quick Launch
// - Sitemap 3D Orbit Gallery
// - Keyboard shortcut router
//
// Mỗi entry gồm: id, path, tên tiếng Việt, mô tả, nhóm, keywords (hỗ trợ tìm không dấu),
// icon key (map sang lucide-react ở tầng UI), màu accent và mức độ ưu tiên.

export const ULTRA_GROUPS = {
    core: { id: "core", label: "Lõi Bảo Vệ", order: 1, color: "#ffbc09" },
    money: { id: "money", label: "Tài Chính Sinh Viên", order: 2, color: "#10b981" },
    community: { id: "community", label: "Cộng Đồng & Uy Tín", order: 3, color: "#ca56ed" },
    intelligence: { id: "intelligence", label: "Trung Tâm Tri Thức AI", order: 4, color: "#06b6d4" },
    account: { id: "account", label: "Tài Khoản & Hồ Sơ", order: 5, color: "#f59e0b" },
    lab: { id: "lab", label: "Ultra Lab & Trải Nghiệm", order: 6, color: "#f43f5e" },
};

/**
 * Chuẩn hoá chuỗi tiếng Việt về dạng không dấu, chữ thường.
 * Dùng cho fuzzy search: "hoc bong" khớp "Học Bổng".
 */
export function normalizeVi(input) {
    if (!input) return "";
    return String(input)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase()
        .trim();
}

export const ULTRA_ROUTES = [
    // ── LÕI BẢO VỆ ──────────────────────────────────────────────
    {
        id: "home",
        path: "/",
        title: "Trang Chủ 3D Highway",
        desc: "Đường bay 3D với 5 bảng đen tương tác dọc tuyến",
        group: "core",
        icon: "Home",
        keywords: "trang chu home landing 3d highway duong bay",
        priority: 100,
        shortcut: "G H",
    },
    {
        id: "trust",
        path: "/trust",
        title: "Trust",
        desc: "Xem kết quả và căn cứ khi được dịch vụ trả về",
        group: "core",
        icon: "ShieldCheck",
        keywords: "trust kiem chung noi dung can cu",
        priority: 84,
    },
    {
        id: "evidence-cases",
        path: "/cases",
        title: "Evidence Case Lab",
        desc: "Ba superflow kiểm chứng, Evidence Passport và Decision Twin",
        group: "core",
        icon: "Fingerprint",
        keywords: "evidence case passport decision twin kiem chung bang chung",
        priority: 97,
        shortcut: "G E",
        badge: "FREEZE",
    },

    // ── TÀI CHÍNH SINH VIÊN ─────────────────────────────────────
    {
        id: "marketplace",
        path: "/marketplace",
        title: "Sàn Pass Đồ",
        desc: "Chợ đồ cũ sinh viên có ký quỹ & điểm uy tín",
        group: "money",
        icon: "ShoppingBag",
        keywords: "san pass do marketplace cho do cu mua ban",
        priority: 80,
    },

    // ── CỘNG ĐỒNG & UY TÍN ──────────────────────────────────────
    {
        id: "community",
        path: "/community",
        title: "Community Experience Studio",
        desc: "Studio tổng hợp trải nghiệm thực tế của cộng đồng",
        group: "community",
        icon: "Users",
        keywords: "community studio trai nghiem cong dong",
        priority: 76,
    },
    {
        id: "expert",
        path: "/expert",
        title: "Expert",
        desc: "Danh bạ và nhiệm vụ theo hồ sơ do máy chủ xác nhận",
        group: "community",
        icon: "BadgeCheck",
        keywords: "chuyen gia expert co van mang luoi",
        priority: 79,
    },

    // ── TRUNG TÂM TRI THỨC AI ───────────────────────────────────

    // ── TÀI KHOẢN & HỒ SƠ ───────────────────────────────────────
    {
        id: "profile",
        path: "/profile",
        title: "Hồ sơ cá nhân",
        desc: "Thông tin tài khoản và hồ sơ cá nhân",
        group: "account",
        icon: "User",
        keywords: "ho so profile tai khoan",
        priority: 82,
        shortcut: "G P",
    },
    {
        id: "onboarding",
        path: "/onboarding",
        title: "Onboarding Sinh Viên",
        desc: "Thiết lập trường, ngành, khoá & mục tiêu học tập",
        group: "account",
        icon: "Rocket",
        keywords: "onboarding thiet lap khoi tao truong nganh",
        priority: 66,
    },
    {
        id: "login",
        path: "/login",
        title: "Đăng Nhập",
        desc: "Cổng đăng nhập Saffron Auth Deck",
        group: "account",
        icon: "LogIn",
        keywords: "dang nhap login sign in",
        priority: 64,
    },
    {
        id: "register",
        path: "/register",
        title: "Đăng Ký & Orbit OTP",
        desc: "Xác thực 2 bước với bàn phím quỹ đạo Orbit OTP",
        group: "account",
        icon: "UserPlus",
        keywords: "dang ky register otp orbit xac thuc",
        priority: 65,
    },

    // ── ULTRA LAB ───────────────────────────────────────────────
    {
        id: "ultra",
        path: "/ultra",
        title: "Ultra Experience Lab",
        desc: "Showcase toàn bộ hiệu ứng 3D, animation & UI đẳng cấp",
        group: "lab",
        icon: "Sparkles",
        keywords: "ultra lab showcase hieu ung 3d animation trai nghiem",
        priority: 98,
        shortcut: "G U",
        badge: "MỚI",
    },
];

/** Tất cả route theo group, đã sắp xếp theo priority giảm dần. */
export function groupedRoutes() {
    const groups = Object.values(ULTRA_GROUPS).sort((a, b) => a.order - b.order);
    return groups
        .map((g) => ({
            ...g,
            items: ULTRA_ROUTES.filter((r) => r.group === g.id).sort(
                (a, b) => b.priority - a.priority
            ),
        }))
        .filter((g) => g.items.length > 0);
}

/**
 * Fuzzy search chịu lỗi chính tả nhẹ và bỏ dấu.
 * Trả về mảng { route, score } sắp xếp theo độ khớp.
 */
export function searchRoutes(query, limit = 12) {
    const q = normalizeVi(query);
    if (!q) {
        return ULTRA_ROUTES.slice()
            .sort((a, b) => b.priority - a.priority)
            .slice(0, limit)
            .map((route) => ({ route, score: route.priority }));
    }

    const tokens = q.split(/\s+/).filter(Boolean);

    const scored = ULTRA_ROUTES.map((route) => {
        const haystack = normalizeVi(
            `${route.title} ${route.desc} ${route.keywords} ${route.path} ${route.id}`
        );
        const titleHay = normalizeVi(route.title);

        let score = 0;
        let matchedAll = true;

        for (const token of tokens) {
            if (titleHay.startsWith(token)) score += 60;
            else if (titleHay.includes(token)) score += 40;
            else if (haystack.includes(token)) score += 22;
            else if (subsequenceMatch(haystack, token)) score += 8;
            else matchedAll = false;
        }

        if (!matchedAll) score -= 40;
        score += route.priority * 0.15;

        return { route, score };
    });

    return scored
        .filter((s) => s.score > 6)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
}

/** Kiểm tra token có xuất hiện dưới dạng dãy con (subsequence) trong haystack. */
function subsequenceMatch(haystack, token) {
    if (token.length < 2) return false;
    let i = 0;
    for (const ch of haystack) {
        if (ch === token[i]) i++;
        if (i === token.length) return true;
    }
    return false;
}

/** Tìm route theo pathname chính xác nhất (hỗ trợ nested). */
export function findRouteByPath(pathname) {
    if (!pathname) return null;
    const exact = ULTRA_ROUTES.find((r) => r.path === pathname);
    if (exact) return exact;
    const nested = ULTRA_ROUTES.filter(
        (r) => r.path !== "/" && pathname.startsWith(r.path)
    ).sort((a, b) => b.path.length - a.path.length);
    return nested[0] || null;
}

/** Bảng shortcut "G <key>" -> path. */
export const ULTRA_SHORTCUTS = ULTRA_ROUTES.filter((r) => r.shortcut).reduce(
    (acc, r) => {
        const key = r.shortcut.split(" ")[1]?.toLowerCase();
        if (key) acc[key] = r.path;
        return acc;
    },
    {}
);
