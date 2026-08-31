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
    academic: { id: "academic", label: "Học Vụ & Lộ Trình", order: 2, color: "#38bdf8" },
    money: { id: "money", label: "Tài Chính Sinh Viên", order: 3, color: "#10b981" },
    community: { id: "community", label: "Cộng Đồng & Uy Tín", order: 4, color: "#ca56ed" },
    intelligence: { id: "intelligence", label: "Trung Tâm Tri Thức AI", order: 5, color: "#06b6d4" },
    account: { id: "account", label: "Tài Khoản & Hồ Sơ", order: 6, color: "#f59e0b" },
    lab: { id: "lab", label: "Ultra Lab & Trải Nghiệm", order: 7, color: "#f43f5e" },
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
        id: "scam-check",
        path: "/scam-check",
        title: "Kiểm Tra Lừa Đảo (AI 4 Lớp)",
        desc: "Quét Link / Text / Ảnh OCR / QR bằng động cơ 4 tầng",
        group: "core",
        icon: "ShieldAlert",
        keywords: "scam check lua dao quet kiem tra ai 4 lop ocr qr link",
        priority: 99,
        shortcut: "G S",
        badge: "AI 4 LỚP",
    },
    {
        id: "sos",
        path: "/sos",
        title: "Cấp Cứu SOS",
        desc: "Kênh phản ứng nhanh khi đã bị lừa hoặc gặp nguy hiểm",
        group: "core",
        icon: "AlertOctagon",
        keywords: "sos cap cuu khan cap emergency bi lua bao cong an",
        priority: 95,
        badge: "24/7",
    },
    {
        id: "safety-map",
        path: "/safety-map",
        title: "Bản Đồ An Ninh",
        desc: "Heatmap điểm nóng lừa đảo & khu vực rủi ro quanh trường",
        group: "core",
        icon: "Compass",
        keywords: "ban do an ninh safety map heatmap diem nong khu vuc",
        priority: 88,
    },
    {
        id: "contract-check",
        path: "/contract-check",
        title: "Bóc Tách Hợp Đồng",
        desc: "Giám định điều khoản bẫy theo Luật 2019/2023",
        group: "core",
        icon: "Scale",
        keywords: "hop dong contract boc tach dieu khoan phap ly luat thue tro",
        priority: 86,
    },
    {
        id: "trust",
        path: "/trust",
        title: "AI Trust Studio",
        desc: "Bảng điều khiển 4 lớp niềm tin & benchmark trực tiếp",
        group: "core",
        icon: "ShieldCheck",
        keywords: "trust studio ai niem tin benchmark layer 4 lop",
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

    // ── HỌC VỤ & LỘ TRÌNH ───────────────────────────────────────
    {
        id: "credit-scheduler",
        path: "/credit-scheduler",
        title: "Xếp Lịch Tín Chỉ (CSP)",
        desc: "Bộ giải ràng buộc backtracking — 0% trùng tiết",
        group: "academic",
        icon: "Calendar",
        keywords: "xep lich tin chi credit scheduler csp thoi khoa bieu",
        priority: 92,
        shortcut: "G C",
    },
    {
        id: "academic",
        path: "/academic",
        title: "Academic Command Center",
        desc: "Trung tâm chỉ huy học vụ: nguồn, thay đổi, tác động",
        group: "academic",
        icon: "GraduationCap",
        keywords: "academic hoc vu command center thay doi tac dong",
        priority: 90,
    },
    {
        id: "academic-roadmap",
        path: "/academic/roadmap",
        title: "Lộ Trình Học Tập",
        desc: "Timeline mốc học vụ & đồ thị tiên quyết",
        group: "academic",
        icon: "Route",
        keywords: "lo trinh roadmap timeline moc tien quyet",
        priority: 78,
    },
    {
        id: "academic-planner",
        path: "/academic/planner",
        title: "What-If Planner",
        desc: "Mô phỏng kịch bản: nếu đổi ngành / trượt môn thì sao?",
        group: "academic",
        icon: "GitBranch",
        keywords: "what if planner mo phong kich ban doi nganh truot mon",
        priority: 77,
    },
    {
        id: "academic-execution",
        path: "/academic/execution",
        title: "Execution Center",
        desc: "Hàng đợi nhiệm vụ học vụ & trạng thái workflow",
        group: "academic",
        icon: "ListChecks",
        keywords: "execution center nhiem vu workflow hang doi",
        priority: 74,
    },
    {
        id: "academic-profile",
        path: "/academic/profile",
        title: "Profile 360 Học Vụ",
        desc: "Bản sao số (digital twin) toàn cảnh sinh viên",
        group: "academic",
        icon: "UserSearch",
        keywords: "profile 360 digital twin ban sao so hoc vu",
        priority: 73,
    },
    {
        id: "prof-rating",
        path: "/prof-rating",
        title: "Review Giảng Viên",
        desc: "Đánh giá giảng viên có kiểm chứng, chống bơm điểm",
        group: "academic",
        icon: "Star",
        keywords: "review giang vien prof rating danh gia thay co",
        priority: 85,
    },

    // ── TÀI CHÍNH SINH VIÊN ─────────────────────────────────────
    {
        id: "scholarships",
        path: "/scholarships",
        title: "Radar Học Bổng",
        desc: "Dò học bổng khớp hồ sơ + phát hiện học bổng giả",
        group: "money",
        icon: "Award",
        keywords: "hoc bong scholarship radar tim kiem gia mao",
        priority: 89,
    },
    {
        id: "tuition-radar",
        path: "/tuition-radar",
        title: "Radar Học Phí",
        desc: "Theo dõi biến động học phí & cảnh báo thu sai",
        group: "money",
        icon: "CreditCard",
        keywords: "hoc phi tuition radar bien dong thu sai",
        priority: 83,
    },
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
        id: "forum",
        path: "/forum",
        title: "Diễn Đàn Xác Thực",
        desc: "Vote uy tín theo trọng số, tách biệt với lượt tim",
        group: "community",
        icon: "MessageSquare",
        keywords: "dien dan forum vote uy tin bai viet thao luan",
        priority: 87,
        shortcut: "G F",
    },
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
        title: "Mạng Lưới Chuyên Gia",
        desc: "Cố vấn đã kiểm chứng & đồ thị tri thức chuyên gia",
        group: "community",
        icon: "BadgeCheck",
        keywords: "chuyen gia expert co van mang luoi",
        priority: 79,
    },
    {
        id: "quests",
        path: "/quests",
        title: "Nhiệm Vụ Hiệp Sĩ",
        desc: "Gamification: quest, streak, huy hiệu & bảng xếp hạng",
        group: "community",
        icon: "Trophy",
        keywords: "quest nhiem vu hiep si game huy hieu xep hang streak",
        priority: 75,
    },

    // ── TRUNG TÂM TRI THỨC AI ───────────────────────────────────
    {
        id: "intelligence-ai-trust",
        path: "/intelligence/ai-trust",
        title: "AI Trust Console V2",
        desc: "Động cơ tự kiểm chứng nhận thức (self-verifying)",
        group: "intelligence",
        icon: "Cpu",
        keywords: "ai trust console v2 tu kiem chung nhan thuc",
        priority: 72,
    },
    {
        id: "intelligence-community",
        path: "/intelligence/community",
        title: "Community Reality Graph",
        desc: "Đồ thị thực tại cộng đồng V2",
        group: "intelligence",
        icon: "Network",
        keywords: "community reality graph do thi thuc tai",
        priority: 71,
    },
    {
        id: "intelligence-experts",
        path: "/intelligence/experts",
        title: "Expert Knowledge Graph",
        desc: "Đồ thị tri thức chuyên gia đã xác minh",
        group: "intelligence",
        icon: "BrainCircuit",
        keywords: "expert knowledge graph do thi tri thuc",
        priority: 70,
    },
    {
        id: "intelligence-knowledge",
        path: "/intelligence/knowledge",
        title: "Knowledge Object Studio",
        desc: "Hợp nhất bằng chứng & tổng hợp nhận thức T4",
        group: "intelligence",
        icon: "Boxes",
        keywords: "knowledge object fusion bang chung tong hop",
        priority: 69,
    },

    // ── TÀI KHOẢN & HỒ SƠ ───────────────────────────────────────
    {
        id: "dashboard",
        path: "/dashboard",
        title: "Mission Control Dashboard",
        desc: "Trạm chỉ huy tổng quan an ninh & tiến độ cá nhân",
        group: "account",
        icon: "LayoutDashboard",
        keywords: "dashboard bang dieu khien mission control tong quan",
        priority: 94,
        shortcut: "G D",
    },
    {
        id: "profile",
        path: "/profile",
        title: "Hồ Sơ Uy Tín",
        desc: "Trust Score 0–100, huy hiệu & lịch sử xác thực",
        group: "account",
        icon: "User",
        keywords: "ho so profile trust score uy tin huy hieu",
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
