/**
 * Layer 1 — Brand Registry & Authoritative Domain Directory
 * 
 * Maps recognized brand identities, canonical domains, and aliases.
 * Provides structural domain dissection with Token-Boundary Precision Matching
 * to distinguish true owners from deceptive subdomains, combo-squatting, and typosquatting
 * while completely eliminating false positives on benign dictionary words.
 */

export const BRAND_REGISTRY = [
  // =========================================================================
  // 1. VIETNAMESE HIGHER EDUCATION & ACADEMIC INSTITUTIONS
  // =========================================================================
  {
    id: "hcmute",
    name: "Trường ĐH Sư phạm Kỹ thuật TP.HCM (HCMUTE)",
    canonicalDomains: ["hcmute.edu.vn"],
    aliases: ["hcmute", "spkt", "ute"],
    category: "education",
  },
  {
    id: "vnuhcm",
    name: "Đại học Quốc gia TP.HCM (VNU-HCM)",
    canonicalDomains: ["vnuhcm.edu.vn"],
    aliases: ["vnuhcm", "dhqg-tphcm", "vnu-hcm"],
    category: "education",
  },
  {
    id: "hcmut",
    name: "Trường ĐH Bách Khoa - ĐHQG TP.HCM (HCMUT)",
    canonicalDomains: ["hcmut.edu.vn", "bknet.vn"],
    aliases: ["bachkhoa", "hcmut", "bk-tphcm", "bknet"],
    category: "education",
  },
  {
    id: "uit",
    name: "Trường ĐH Công nghệ Thông tin - ĐHQG TP.HCM (UIT)",
    canonicalDomains: ["uit.edu.vn"],
    aliases: ["uit", "cntt-dhqg"],
    category: "education",
  },
  {
    id: "ussh",
    name: "Trường ĐH Khoa học Xã hội và Nhân văn - ĐHQG TP.HCM",
    canonicalDomains: ["ussh.edu.vn", "ussh.vnu.edu.vn"],
    aliases: ["ussh", "xhnv"],
    category: "education",
  },
  {
    id: "uel",
    name: "Trường ĐH Kinh tế - Luật - ĐHQG TP.HCM (UEL)",
    canonicalDomains: ["uel.edu.vn"],
    aliases: ["uel", "kinhteluat"],
    category: "education",
  },
  {
    id: "hcmiu",
    name: "Trường ĐH Quốc tế - ĐHQG TP.HCM (IU)",
    canonicalDomains: ["hcmiu.edu.vn"],
    aliases: ["hcmiu", "daihocquocte"],
    category: "education",
  },
  {
    id: "hcmus",
    name: "Trường ĐH Khoa học Tự nhiên - ĐHQG TP.HCM",
    canonicalDomains: ["hcmus.edu.vn", "hus.vnu.edu.vn"],
    aliases: ["hcmus", "khoahoctunhien", "khtn"],
    category: "education",
  },
  {
    id: "hust",
    name: "Đại học Bách Khoa Hà Nội (HUST)",
    canonicalDomains: ["hust.edu.vn"],
    aliases: ["hust", "bachkhoa-hn", "bachkhoahn"],
    category: "education",
  },
  {
    id: "vnu",
    name: "Đại học Quốc gia Hà Nội (VNU)",
    canonicalDomains: ["vnu.edu.vn"],
    aliases: ["vnu", "dhqg-hn", "dhqghn"],
    category: "education",
  },
  {
    id: "neu",
    name: "Trường ĐH Kinh tế Quốc dân (NEU)",
    canonicalDomains: ["neu.edu.vn"],
    aliases: ["neu", "kinhtequocdan", "ktqd"],
    category: "education",
  },
  {
    id: "ftu",
    name: "Trường ĐH Ngoại thương (FTU)",
    canonicalDomains: ["ftu.edu.vn"],
    aliases: ["ftu", "ngoaithuong"],
    category: "education",
  },
  {
    id: "ueh",
    name: "Đại học Kinh tế TP.HCM (UEH)",
    canonicalDomains: ["ueh.edu.vn"],
    aliases: ["ueh", "kinhtetphcm"],
    category: "education",
  },
  {
    id: "ump",
    name: "Đại học Y Dược TP.HCM (UMP)",
    canonicalDomains: ["ump.edu.vn", "ydtphcm.edu.vn"],
    aliases: ["ump", "yduoctphcm", "yduoc"],
    category: "education",
  },
  {
    id: "hmu",
    name: "Trường ĐH Y Hà Nội (HMU)",
    canonicalDomains: ["hmu.edu.vn"],
    aliases: ["hmu", "yduc-hn", "yhanoi"],
    category: "education",
  },
  {
    id: "ctu",
    name: "Trường ĐH Cần Thơ (CTU)",
    canonicalDomains: ["ctu.edu.vn"],
    aliases: ["ctu", "daihoccantho"],
    category: "education",
  },
  {
    id: "dut",
    name: "Trường ĐH Bách Khoa - ĐH Đà Nẵng (DUT)",
    canonicalDomains: ["dut.udn.vn", "dut.edu.vn"],
    aliases: ["dut", "bkdanang", "bkdn"],
    category: "education",
  },
  {
    id: "udn",
    name: "Đại học Đà Nẵng (UDN)",
    canonicalDomains: ["udn.vn"],
    aliases: ["udn", "dhdanang"],
    category: "education",
  },
  {
    id: "hueuni",
    name: "Đại học Huế",
    canonicalDomains: ["hueuni.edu.vn"],
    aliases: ["hueuni", "daihochue", "dhhue"],
    category: "education",
  },
  {
    id: "tdtu",
    name: "Trường ĐH Tôn Đức Thắng (TDTU)",
    canonicalDomains: ["tdtu.edu.vn"],
    aliases: ["tdtu", "tonducthang"],
    category: "education",
  },
  {
    id: "ptit",
    name: "Học viện Công nghệ Bưu chính Viễn thông (PTIT)",
    canonicalDomains: ["ptit.edu.vn"],
    aliases: ["ptit", "buuchinhvienthong"],
    category: "education",
  },
  {
    id: "fpt",
    name: "Trường ĐH FPT",
    canonicalDomains: ["fpt.edu.vn"],
    aliases: ["fpt-edu", "daihocfpt"],
    category: "education",
  },
  {
    id: "rmit",
    name: "RMIT University Vietnam",
    canonicalDomains: ["rmit.edu.vn", "rmit.edu.au"],
    aliases: ["rmit", "rmitvietnam"],
    category: "education",
  },
  {
    id: "hutech",
    name: "Trường ĐH Công nghệ TP.HCM (HUTECH)",
    canonicalDomains: ["hutech.edu.vn"],
    aliases: ["hutech"],
    category: "education",
  },
  {
    id: "vlu",
    name: "Trường ĐH Văn Lang (VLU)",
    canonicalDomains: ["vlu.edu.vn", "vanlanguni.edu.vn"],
    aliases: ["vlu", "vanlang"],
    category: "education",
  },

  // =========================================================================
  // 2. VIETNAMESE BANKING & FINANCIAL INSTITUTIONS
  // =========================================================================
  {
    id: "vietcombank",
    name: "Ngân hàng Ngoại thương Việt Nam (Vietcombank)",
    canonicalDomains: ["vietcombank.com.vn"],
    aliases: ["vietcombank", "vcb", "vcbdigibank", "digibank"],
    category: "bank",
  },
  {
    id: "mbbank",
    name: "Ngân hàng Quân đội (MBBank)",
    canonicalDomains: ["mbbank.com.vn"],
    aliases: ["mbbank", "mb-bank", "mbebanking"],
    category: "bank",
  },
  {
    id: "techcombank",
    name: "Ngân hàng Kỹ thương Việt Nam (Techcombank)",
    canonicalDomains: ["techcombank.com", "techcombank.com.vn"],
    aliases: ["techcombank", "tcb", "techcom"],
    category: "bank",
  },
  {
    id: "bidv",
    name: "Ngân hàng Đầu tư và Phát triển Việt Nam (BIDV)",
    canonicalDomains: ["bidv.com.vn"],
    aliases: ["bidv", "smartbanking-bidv", "bidvsmartbanking"],
    category: "bank",
  },
  {
    id: "vietinbank",
    name: "Ngân hàng Công thương Việt Nam (VietinBank)",
    canonicalDomains: ["vietinbank.vn"],
    aliases: ["vietinbank", "ctg", "vietin", "ipay-vietinbank", "vietinbankipay"],
    category: "bank",
  },
  {
    id: "agribank",
    name: "Ngân hàng Nông nghiệp và PTNT (Agribank)",
    canonicalDomains: ["agribank.com.vn"],
    aliases: ["agribank", "agri-bank", "agribankonline"],
    category: "bank",
  },
  {
    id: "vpbank",
    name: "Ngân hàng Việt Nam Thịnh Vượng (VPBank)",
    canonicalDomains: ["vpbank.com.vn"],
    aliases: ["vpbank", "vpbankneo", "vp-bank"],
    category: "bank",
  },
  {
    id: "acb",
    name: "Ngân hàng Á Châu (ACB)",
    canonicalDomains: ["acb.com.vn"],
    aliases: ["acb", "acbbank", "acb-bank", "acbone"],
    category: "bank",
  },
  {
    id: "tpbank",
    name: "Ngân hàng Tiên Phong (TPBank)",
    canonicalDomains: ["tpb.vn", "tpbank.com.vn"],
    aliases: ["tpbank", "tienphongbank"],
    category: "bank",
  },
  {
    id: "sacombank",
    name: "Ngân hàng Sài Gòn Thương Tín (Sacombank)",
    canonicalDomains: ["sacombank.com.vn", "sacombank.com"],
    aliases: ["sacombank", "isacombank", "sacom"],
    category: "bank",
  },
  {
    id: "vib",
    name: "Ngân hàng Quốc Tế (VIB)",
    canonicalDomains: ["vib.com.vn"],
    aliases: ["vibbank", "myvib"],
    category: "bank",
  },
  {
    id: "hdbank",
    name: "Ngân hàng Phát triển TP.HCM (HDBank)",
    canonicalDomains: ["hdbank.com.vn"],
    aliases: ["hdbank", "hd-bank"],
    category: "bank",
  },
  {
    id: "msb",
    name: "Ngân hàng Hàng Hải (MSB)",
    canonicalDomains: ["msb.com.vn"],
    aliases: ["msbbank", "maritimebank"],
    category: "bank",
  },
  {
    id: "ocb",
    name: "Ngân hàng Phương Đông (OCB)",
    canonicalDomains: ["ocb.com.vn"],
    aliases: ["ocbbank", "ocbomini"],
    category: "bank",
  },
  {
    id: "shb",
    name: "Ngân hàng Sài Gòn - Hà Nội (SHB)",
    canonicalDomains: ["shb.com.vn"],
    aliases: ["shbbank", "shb-bank"],
    category: "bank",
  },
  {
    id: "seabank",
    name: "Ngân hàng Đông Nam Á (SeABank)",
    canonicalDomains: ["seabank.com.vn"],
    aliases: ["seabank", "seanet"],
    category: "bank",
  },
  {
    id: "shinhan",
    name: "Ngân hàng Shinhan Việt Nam",
    canonicalDomains: ["shinhan.com.vn"],
    aliases: ["shinhan", "shinhanbank"],
    category: "bank",
  },

  // =========================================================================
  // 3. FINTECH, DIGITAL WALLETS & CRYPTO
  // =========================================================================
  {
    id: "vnpay",
    name: "Cổng thanh toán VNPAY",
    canonicalDomains: ["vnpay.vn"],
    aliases: ["vnpay", "vnpayqr"],
    category: "payment",
  },
  {
    id: "momo",
    name: "Ví điện tử MoMo",
    canonicalDomains: ["momo.vn"],
    aliases: ["momo", "vi-momo"],
    category: "payment",
  },
  {
    id: "zalopay",
    name: "Ví điện tử ZaloPay",
    canonicalDomains: ["zalopay.vn"],
    aliases: ["zalopay", "zalo-pay"],
    category: "payment",
  },
  {
    id: "viettelmoney",
    name: "Viettel Money / ViettelPay",
    canonicalDomains: ["viettelmoney.vn", "viettelpay.vn"],
    aliases: ["viettelmoney", "viettelpay", "viettel-money"],
    category: "payment",
  },
  {
    id: "vnptmoney",
    name: "VNPT Money",
    canonicalDomains: ["vnptmoney.vn"],
    aliases: ["vnptmoney", "vnpt-money"],
    category: "payment",
  },
  {
    id: "shopeepay",
    name: "Ví ShopeePay",
    canonicalDomains: ["shopeepay.vn", "airpay.vn"],
    aliases: ["shopeepay", "airpay"],
    category: "payment",
  },
  {
    id: "paypal",
    name: "PayPal International",
    canonicalDomains: ["paypal.com", "paypal.me"],
    aliases: ["paypal"],
    category: "payment",
  },
  {
    id: "stripe",
    name: "Stripe Payment Gateway",
    canonicalDomains: ["stripe.com"],
    aliases: ["stripe"],
    category: "payment",
  },
  {
    id: "binance",
    name: "Binance Exchange",
    canonicalDomains: ["binance.com", "bnbstatic.com"],
    aliases: ["binance", "binance-pay"],
    category: "crypto",
  },
  {
    id: "remitano",
    name: "Remitano Crypto",
    canonicalDomains: ["remitano.com", "remitano.net"],
    aliases: ["remitano"],
    category: "crypto",
  },

  // =========================================================================
  // 4. NATIONAL PUBLIC SERVICES, IDENTIFICATION & GOVERNMENT
  // =========================================================================
  {
    id: "dichvucong",
    name: "Cổng Dịch vụ công Quốc gia",
    canonicalDomains: ["dichvucong.gov.vn"],
    aliases: ["dichvucong", "dvc-quocgia"],
    category: "government",
  },
  {
    id: "vneid",
    name: "Ứng dụng Định danh điện tử Quốc gia (VNeID)",
    canonicalDomains: ["vneid.gov.vn"],
    aliases: ["vneid", "dinhdanhdientu", "dinhdanh-quocgia", "dinhdanh"],
    category: "government",
  },
  {
    id: "bocongan",
    name: "Bộ Công an",
    canonicalDomains: ["bocongan.gov.vn", "congan.gov.vn", "mps.gov.vn"],
    aliases: ["bocongan", "bca-gov"],
    category: "government",
  },
  {
    id: "baohiemxahoi",
    name: "Bảo hiểm Xã hội Việt Nam",
    canonicalDomains: ["baohiemxahoi.gov.vn", "vss.gov.vn"],
    aliases: ["baohiemxahoi", "bhxh", "vss-gov"],
    category: "government",
  },
  {
    id: "chinhphu",
    name: "Cổng Thông tin Điện tử Chính phủ",
    canonicalDomains: ["chinhphu.vn", "baochinhphu.vn"],
    aliases: ["chinhphu", "chinh-phu"],
    category: "government",
  },
  {
    id: "thuedientu",
    name: "Tổng cục Thuế - Thuế Điện Tử",
    canonicalDomains: ["thuedientu.gdt.gov.vn", "gdt.gov.vn"],
    aliases: ["thuedientu", "tongcucthue"],
    category: "government",
  },
  {
    id: "csgt",
    name: "Cục Cảnh sát Giao thông",
    canonicalDomains: ["csgt.vn", "csgt.gov.vn"],
    aliases: ["csgt", "cansatgiaothong"],
    category: "government",
  },
  {
    id: "moet",
    name: "Bộ Giáo dục và Đào tạo",
    canonicalDomains: ["moet.gov.vn"],
    aliases: ["moet", "bogiaoduc"],
    category: "government",
  },

  // =========================================================================
  // 5. GLOBAL TECH, CLOUD & IDENTITY PROVIDERS
  // =========================================================================
  {
    id: "google",
    name: "Google Services & Gmail",
    canonicalDomains: ["google.com", "google.com.vn", "mail.google.com", "accounts.google.com", "gmail.com", "drive.google.com"],
    aliases: ["google", "gmail", "googlemail"],
    category: "tech",
  },
  {
    id: "microsoft",
    name: "Microsoft Services & Office365",
    canonicalDomains: ["microsoft.com", "live.com", "office.com", "outlook.com", "microsoftonline.com", "login.microsoftonline.com", "azure.com"],
    aliases: ["microsoft", "office365", "outlook", "msonline"],
    category: "tech",
  },
  {
    id: "apple",
    name: "Apple Inc. & iCloud",
    canonicalDomains: ["apple.com", "icloud.com", "appleid.apple.com"],
    aliases: ["apple", "icloud", "appleid"],
    category: "tech",
  },
  {
    id: "facebook",
    name: "Meta / Facebook / Instagram",
    canonicalDomains: ["facebook.com", "fb.com", "meta.com", "instagram.com", "messenger.com", "whatsapp.com"],
    aliases: ["facebook", "instagram", "messenger", "meta"],
    category: "social",
  },
  {
    id: "telegram",
    name: "Telegram Messenger",
    canonicalDomains: ["telegram.org", "t.me"],
    aliases: ["telegram", "tele-gram"],
    category: "social",
  },
  {
    id: "discord",
    name: "Discord",
    canonicalDomains: ["discord.com", "discord.gg"],
    aliases: ["discord"],
    category: "social",
  },
  {
    id: "tiktok",
    name: "TikTok",
    canonicalDomains: ["tiktok.com"],
    aliases: ["tiktok", "tiktok-shop"],
    category: "social",
  },
  {
    id: "github",
    name: "GitHub",
    canonicalDomains: ["github.com", "github.io"],
    aliases: ["github"],
    category: "tech",
  },
  {
    id: "openai",
    name: "OpenAI / ChatGPT",
    canonicalDomains: ["openai.com", "chatgpt.com"],
    aliases: ["openai", "chatgpt"],
    category: "tech",
  },
  {
    id: "anthropic",
    name: "Anthropic / Claude",
    canonicalDomains: ["anthropic.com", "claude.ai"],
    aliases: ["anthropic", "claudeai"],
    category: "tech",
  },
  {
    id: "cloudflare",
    name: "Cloudflare",
    canonicalDomains: ["cloudflare.com"],
    aliases: ["cloudflare"],
    category: "tech",
  },
  {
    id: "vercel",
    name: "Vercel",
    canonicalDomains: ["vercel.com", "vercel.app"],
    aliases: ["vercel"],
    category: "tech",
  },

  // =========================================================================
  // 6. STUDENT LEARNING, LMS & PRODUCTIVITY PLATFORMS
  // =========================================================================
  {
    id: "canvas",
    name: "Instructure Canvas LMS",
    canonicalDomains: ["instructure.com", "canvas.net"],
    aliases: ["canvas-lms", "instructure"],
    category: "education",
  },
  {
    id: "coursera",
    name: "Coursera Learning",
    canonicalDomains: ["coursera.org"],
    aliases: ["coursera"],
    category: "education",
  },
  {
    id: "udemy",
    name: "Udemy Online Courses",
    canonicalDomains: ["udemy.com"],
    aliases: ["udemy"],
    category: "education",
  },
  {
    id: "overleaf",
    name: "Overleaf LaTeX Editor",
    canonicalDomains: ["overleaf.com"],
    aliases: ["overleaf"],
    category: "education",
  },
  {
    id: "notion",
    name: "Notion Workspace",
    canonicalDomains: ["notion.so", "notion.site"],
    aliases: ["notion"],
    category: "tech",
  },
  {
    id: "canva",
    name: "Canva Design",
    canonicalDomains: ["canva.com"],
    aliases: ["canva"],
    category: "tech",
  },
  {
    id: "zoom",
    name: "Zoom Video Communications",
    canonicalDomains: ["zoom.us", "zoom.com"],
    aliases: ["zoom-meet", "zoomvideo"],
    category: "tech",
  },

  // =========================================================================
  // 7. E-COMMERCE & LOGISTICS (VIETNAM & SEA)
  // =========================================================================
  {
    id: "shopee",
    name: "Shopee Vietnam",
    canonicalDomains: ["shopee.vn", "shopee.com"],
    aliases: ["shopee", "shopee-vn"],
    category: "ecommerce",
  },
  {
    id: "lazada",
    name: "Lazada Vietnam",
    canonicalDomains: ["lazada.vn", "lazada.com"],
    aliases: ["lazada", "lazada-vn"],
    category: "ecommerce",
  },
  {
    id: "tiki",
    name: "Tiki Corporation",
    canonicalDomains: ["tiki.vn"],
    aliases: ["tikivn", "tiki-vn"],
    category: "ecommerce",
  },
  {
    id: "sendo",
    name: "Sendo Vietnam",
    canonicalDomains: ["sendo.vn"],
    aliases: ["sendovn"],
    category: "ecommerce",
  },
  {
    id: "ghtk",
    name: "Giao Hàng Tiết Kiệm (GHTK)",
    canonicalDomains: ["giaohangtietkiem.vn", "ghtk.vn"],
    aliases: ["ghtk", "giaohangtietkiem"],
    category: "logistics",
  },
  {
    id: "ghn",
    name: "Giao Hàng Nhanh (GHN)",
    canonicalDomains: ["ghn.vn", "giaohangnhanh.vn"],
    aliases: ["ghnvn", "giaohangnhanh"],
    category: "logistics",
  },
  {
    id: "viettelpost",
    name: "Tổng công ty Cổ phần Bưu chính Viettel (Viettel Post)",
    canonicalDomains: ["viettelpost.com.vn", "viettelpost.vn"],
    aliases: ["viettelpost", "viettel-post"],
    category: "logistics",
  },
  {
    id: "vnpost",
    name: "Tổng công ty Bưu điện Việt Nam (VNPost)",
    canonicalDomains: ["vnpost.vn"],
    aliases: ["vnpost", "buudienvietnam"],
    category: "logistics",
  },
  {
    id: "jtexpress",
    name: "J&T Express Vietnam",
    canonicalDomains: ["jtexpress.vn"],
    aliases: ["jtexpress", "jt-express"],
    category: "logistics",
  },
  {
    id: "grab",
    name: "Grab Holdings",
    canonicalDomains: ["grab.com"],
    aliases: ["grab-vn", "grabhub"],
    category: "logistics",
  },
];

// Top-Level Domains (TLDs) with high statistical correlation to spam/scam campaigns
export const SUSPICIOUS_TLDS = new Set([
  "xyz", "top", "site", "online", "club", "work", "vip", "click", "buzz",
  "cam", "live", "monster", "rest", "bar", "cfd", "sbs", "icu", "cyou",
  "gq", "ml", "cf", "tk", "fit", "loan", "surf", "cc", "link", "bid", "casa",
  "stream", "trade", "racing", "win", "date", "party", "review", "press"
]);

// URL Shortener Hostnames
export const KNOWN_URL_SHORTENERS = new Set([
  "bit.ly", "tinyurl.com", "t.co", "cutt.ly", "is.gd", "shorturl.at",
  "gg.gg", "rb.gy", "buff.ly", "ow.ly", "rebrand.ly", "s.id", "v.gd",
  "clck.ru", "qr.ae", "trib.al", "t.ly", "shortcm.li", "zpr.io"
]);

export const HOMOGLYPH_SCRIPTS_REGEX = /[\u0400-\u04FF\u0370-\u03FF]/; // Cyrillic & Greek

/**
 * Homoglyph mapping table: Cyrillic / Greek / Lookalike symbols -> ASCII Latin equivalents
 */
export const HOMOGLYPH_MAP = {
  // Cyrillic
  "\u0430": "a", "\u0410": "a", // а, А
  "\u0441": "c", "\u0421": "c", // с, С
  "\u0435": "e", "\u0415": "e", // е, Е
  "\u0456": "i", "\u0406": "i", // і, І
  "\u0458": "j", "\u0408": "j", // ј, Ј
  "\u043E": "o", "\u041E": "o", // о, О
  "\u0440": "p", "\u0420": "p", // р, Р
  "\u0455": "s", "\u0405": "s", // ѕ, Ѕ
  "\u0443": "y", "\u0423": "y", // у, У
  "\u0445": "x", "\u0425": "x", // х, Х
  // Greek
  "\u03B1": "a", "\u0391": "a", // α, Α
  "\u03B5": "e", "\u0395": "e", // ε, Ε
  "\u03BF": "o", "\u039F": "o", // ο, Ο
  "\u03C1": "p", "\u03A1": "p", // ρ, Ρ
  "\u03C4": "t", "\u03A4": "t", // τ, Τ
  "\u03C5": "u", "\u03A5": "u", // υ, Υ
  "\u03BD": "v", "\u039D": "v", // ν, Ν
  "\u03BA": "k", "\u039A": "k", // κ, Κ
  "\u03B9": "i", "\u0399": "i", // ι, Ι
};

/**
 * Translates homoglyphic hostname into ASCII normalized form
 * @param {string} text 
 * @returns {string}
 */
export function resolveHomoglyphText(text) {
  if (!text) return "";
  let resolved = "";
  for (const ch of text) {
    resolved += HOMOGLYPH_MAP[ch] || ch;
  }
  return resolved.toLowerCase();
}

export class BrandRegistry {
  /**
   * Checks if domain belongs to authentic whitelist (universities, gov, banks, tech platforms)
   * @param {string} hostname
   * @returns {boolean}
   */
  static isWhitelistedDomain(hostname) {
    if (!hostname) return false;
    const cleanHost = hostname.toLowerCase();

    // Homoglyphs / Punycode characters must NEVER be whitelisted (anti-spoofing guard)
    if (
      HOMOGLYPH_SCRIPTS_REGEX.test(cleanHost) ||
      cleanHost.startsWith("xn--") ||
      cleanHost.includes(".xn--")
    ) {
      return false;
    }

    // A top-level suffix is not an identity proof. Only a registered
    // canonical domain (or its subdomain) may produce the local whitelist
    // hint, and that hint remains scoped to Layer 1 screening.
    return BRAND_REGISTRY.some((brand) =>
      brand.canonicalDomains.some(
        (canonical) => cleanHost === canonical || cleanHost.endsWith("." + canonical)
      )
    );
  }

  /**
   * Checks if domain matches an authentic registered brand (tech, banking, social, etc.)
   * @param {string} hostname
   * @returns {object|null}
   */
  static getAuthenticBrand(hostname) {
    if (!hostname) return null;
    const cleanHost = hostname.toLowerCase();

    return BRAND_REGISTRY.find((brand) =>
      brand.canonicalDomains.some(
        (canonical) => cleanHost === canonical || cleanHost.endsWith("." + canonical)
      )
    ) || null;
  }

  /**
   * Extracts registrable domain (eTLD+1 approximation)
   * @param {string} hostname
   * @returns {string}
   */
  static getRegistrableDomain(hostname) {
    if (!hostname) return "";
    const parts = hostname.toLowerCase().split(".");
    if (parts.length <= 2) return hostname.toLowerCase();

    const secondLast = parts[parts.length - 2];
    const last = parts[parts.length - 1];

    // Multi-part ccTLDs: e.g. .edu.vn, .gov.vn, .com.vn, .co.uk, .edu.au, .com.au, .or.jp, .co.jp
    const ccTlds = ["vn", "uk", "au", "jp", "kr", "sg", "th", "my", "nz", "za", "br"];
    const secondLevelDomains = ["edu", "gov", "com", "net", "org", "co", "ac", "or", "go", "mil"];

    if (ccTlds.includes(last) && secondLevelDomains.includes(secondLast)) {
      return parts.slice(-3).join(".");
    }

    return parts.slice(-2).join(".");
  }

  /**
   * Splits hostname into normalized token units (by dot, hyphen, underscore, numbers)
   * @param {string} text
   * @returns {string[]}
   */
  static extractTokens(text) {
    if (!text) return [];
    return text
      .toLowerCase()
      .split(/[.\-_0-9]+/)
      .filter((t) => t.length > 0);
  }

  /**
   * Detects brand impersonation outside the authentic registrable domain
   * Uses Token-Boundary Precision Matching to eliminate false positives on benign words.
   * 
   * @param {string} hostname
   * @returns {object|null}
   */
  static checkBrandImpersonation(hostname) {
    if (!hostname) return null;
    const cleanHost = hostname.toLowerCase();
    const resolvedHost = resolveHomoglyphText(cleanHost);
    const registrableDomain = this.getRegistrableDomain(cleanHost);

    // If host is already an authentic canonical domain of any brand, it is legitimate
    for (const brand of BRAND_REGISTRY) {
      const isOfficial = brand.canonicalDomains.some(
        (canonical) =>
          cleanHost === canonical ||
          cleanHost.endsWith("." + canonical) ||
          resolvedHost === canonical ||
          resolvedHost.endsWith("." + canonical)
      );
      if (isOfficial) return null;
    }

    const hostTokens = this.extractTokens(cleanHost);
    const resolvedTokens = this.extractTokens(resolvedHost);
    const allTokens = new Set([...hostTokens, ...resolvedTokens]);

    // Subdomains part only
    const subdomainsOnly = cleanHost.replace("." + registrableDomain, "");
    const subTokens = new Set(this.extractTokens(subdomainsOnly));

    for (const brand of BRAND_REGISTRY) {
      // 1. Check if canonical domain itself appears in the untrusted hostname (Subdomain Hijack)
      for (const canonical of brand.canonicalDomains) {
        if (cleanHost.includes(canonical) || resolvedHost.includes(canonical)) {
          return {
            brand: brand.name,
            brandId: brand.id,
            canonicalDomains: brand.canonicalDomains,
            registrableDomain,
            hostname: cleanHost,
            isSubdomainHijack: true,
            matchedKeyword: canonical,
          };
        }
      }

      // 2. Check brand aliases with Token Boundary Precision
      for (const alias of brand.aliases) {
        const cleanAlias = alias.toLowerCase();
        let matched = false;

        // Token boundary match:
        // Standalone token (split by . - _ and numbers)
        if (allTokens.has(cleanAlias)) {
          matched = true;
        } else if (cleanAlias.length >= 7) {
          // Long distinctive alias (>= 7 chars, e.g. "vietcombank", "techcombank", "sacombank", "facebook", "microsoft", "baohiemxahoi"):
          if (cleanHost.includes(cleanAlias) || resolvedHost.includes(cleanAlias)) {
            matched = true;
          }
        }

        if (matched) {
          const isSubdomainHijack =
            subTokens.has(cleanAlias) ||
            brand.canonicalDomains.some((d) => cleanHost.includes(d));

          return {
            brand: brand.name,
            brandId: brand.id,
            canonicalDomains: brand.canonicalDomains,
            registrableDomain,
            hostname: cleanHost,
            isSubdomainHijack: Boolean(isSubdomainHijack),
            matchedKeyword: cleanAlias,
          };
        }
      }
    }

    return null;
  }
}
