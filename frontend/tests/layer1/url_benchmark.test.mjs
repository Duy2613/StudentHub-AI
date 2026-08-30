/**
 * Layer 1 — Comprehensive URL Benchmark & Training Evaluation Suite
 * 
 * Tests 120+ real-world URL vectors across 11 distinct categories:
 * - Legitimate VN Universities (.edu.vn & canonicals)
 * - Legitimate VN Banks, Wallets & Financial Portals
 * - Legitimate National Government & Public Services (.gov.vn)
 * - Legitimate Global Tech, Cloud, AI & Student Productivity
 * - Bank & Biometric Update Phishing Attacks (Hot Threat)
 * - Student Scholarship, University & Task Scams
 * - Unicode Homoglyph & Punycode Deception Attacks
 * - SSRF Obfuscation (Decimal, Hex, Octal, IPv6, Localhost)
 * - Dangerous Executable Payload Drops (.exe, .apk, .msi, .ps1)
 * - URL Shorteners & Unencrypted HTTP Hosts
 * - False Positive Guards (Benign dictionary words containing sub-strings)
 */

import { Layer1ScreenService } from "../../src/lib/ai-trust/layer1/Layer1ScreenService.js";
import { LAYER_1_STATUS, LAYER_1_REASONS } from "../../src/lib/ai-trust/layer1/types.js";

export const URL_BENCHMARK_CASES = [
  // =========================================================================
  // 1. LEGITIMATE VIETNAMESE UNIVERSITIES (.edu.vn & canonicals)
  // =========================================================================
  {
    category: "1. VN Universities — HCMUTE Official",
    url: "https://hcmute.edu.vn/tin-tuc/thong-bao-tuyen-sinh",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: LAYER_1_REASONS.WHITELISTED_DOMAIN,
  },
  {
    category: "1. VN Universities — VNU-HCM Portal",
    url: "https://vnuhcm.edu.vn/dao-tao-dai-hoc/thong-tin",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: LAYER_1_REASONS.WHITELISTED_DOMAIN,
  },
  {
    category: "1. VN Universities — HCMUT Bách Khoa TP.HCM",
    url: "https://hcmut.edu.vn/sinh-vien/bieu-mau",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: LAYER_1_REASONS.WHITELISTED_DOMAIN,
  },
  {
    category: "1. VN Universities — UIT Công nghệ Thông tin",
    url: "https://uit.edu.vn/tuyen-sinh/chuong-trinh-dao-tao",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: LAYER_1_REASONS.WHITELISTED_DOMAIN,
  },
  {
    category: "1. VN Universities — USSH Nhân Văn TP.HCM",
    url: "https://ussh.edu.vn/gioi-thieu/khoa-hoc",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: LAYER_1_REASONS.WHITELISTED_DOMAIN,
  },
  {
    category: "1. VN Universities — UEL Kinh tế Luật",
    url: "https://uel.edu.vn/thong-bao-hoc-vu",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: LAYER_1_REASONS.WHITELISTED_DOMAIN,
  },
  {
    category: "1. VN Universities — HUST Bách Khoa Hà Nội",
    url: "https://hust.edu.vn/tin-tuc/su-kien-noi-bat",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: LAYER_1_REASONS.WHITELISTED_DOMAIN,
  },
  {
    category: "1. VN Universities — VNU Hà Nội",
    url: "https://vnu.edu.vn/home/thong-bao",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: LAYER_1_REASONS.WHITELISTED_DOMAIN,
  },
  {
    category: "1. VN Universities — NEU Kinh tế Quốc dân",
    url: "https://neu.edu.vn/tuyen-sinh-dai-hoc-chinh-quy",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: LAYER_1_REASONS.WHITELISTED_DOMAIN,
  },
  {
    category: "1. VN Universities — FTU Ngoại Thương",
    url: "https://ftu.edu.vn/thong-bao-hoc-bong",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: LAYER_1_REASONS.WHITELISTED_DOMAIN,
  },
  {
    category: "1. VN Universities — UEH Kinh tế TP.HCM",
    url: "https://ueh.edu.vn/sinh-vien/lich-thi",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: LAYER_1_REASONS.WHITELISTED_DOMAIN,
  },
  {
    category: "1. VN Universities — UMP Y Dược TP.HCM",
    url: "https://ump.edu.vn/dao-tao/thong-bao-moi",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: LAYER_1_REASONS.WHITELISTED_DOMAIN,
  },
  {
    category: "1. VN Universities — CTU Cần Thơ",
    url: "https://ctu.edu.vn/thong-tin-dao-tao",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: LAYER_1_REASONS.WHITELISTED_DOMAIN,
  },
  {
    category: "1. VN Universities — DUT Bách Khoa Đà Nẵng",
    url: "https://dut.udn.vn/tin-tuc/thong-bao",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: LAYER_1_REASONS.WHITELISTED_DOMAIN,
  },
  {
    category: "1. VN Universities — TDTU Tôn Đức Thắng",
    url: "https://tdtu.edu.vn/giao-duc/chuong-trinh",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: LAYER_1_REASONS.WHITELISTED_DOMAIN,
  },
  {
    category: "1. VN Universities — PTIT Bưu chính Viễn thông",
    url: "https://ptit.edu.vn/sinh-vien/tin-hoc-bong",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: LAYER_1_REASONS.WHITELISTED_DOMAIN,
  },
  {
    category: "1. VN Universities — FPT University",
    url: "https://fpt.edu.vn/nganh-hoc/cong-nghe-thong-tin",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: LAYER_1_REASONS.WHITELISTED_DOMAIN,
  },
  {
    category: "1. VN Universities — RMIT Vietnam",
    url: "https://rmit.edu.vn/vi/hoc-tap/chuong-trinh-dao-tao",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: LAYER_1_REASONS.WHITELISTED_DOMAIN,
  },
  {
    category: "1. VN Universities — HUTECH University",
    url: "https://hutech.edu.vn/tuyen-sinh/de-an-tuyen-sinh",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: LAYER_1_REASONS.WHITELISTED_DOMAIN,
  },
  {
    category: "1. VN Universities — Văn Lang University",
    url: "https://vlu.edu.vn/thong-bao-tuyen-dung",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: LAYER_1_REASONS.WHITELISTED_DOMAIN,
  },

  // =========================================================================
  // 2. LEGITIMATE VIETNAMESE BANKS, WALLETS & FINANCIAL INSTITUTIONS
  // =========================================================================
  {
    category: "2. VN Banks — Vietcombank Official",
    url: "https://vietcombank.com.vn/vi-VN/Khach-hang-ca-nhan",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: LAYER_1_REASONS.WHITELISTED_DOMAIN,
  },
  {
    category: "2. VN Banks — MBBank Official",
    url: "https://mbbank.com.vn/khach-hang-ca-nhan/dich-vu-the",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: LAYER_1_REASONS.WHITELISTED_DOMAIN,
  },
  {
    category: "2. VN Banks — Techcombank Official",
    url: "https://techcombank.com/khach-hang-ca-nhan",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: LAYER_1_REASONS.WHITELISTED_DOMAIN,
  },
  {
    category: "2. VN Banks — BIDV Official",
    url: "https://bidv.com.vn/vn/ca-nhan/san-pham-dich-vu",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: LAYER_1_REASONS.WHITELISTED_DOMAIN,
  },
  {
    category: "2. VN Banks — VietinBank Official",
    url: "https://vietinbank.vn/vn/ca-nhan/san-pham-dich-vu",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: LAYER_1_REASONS.WHITELISTED_DOMAIN,
  },
  {
    category: "2. VN Banks — Agribank Official",
    url: "https://agribank.com.vn/vn/ca-nhan/san-pham",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: LAYER_1_REASONS.WHITELISTED_DOMAIN,
  },
  {
    category: "2. VN Banks — VPBank Official",
    url: "https://vpbank.com.vn/ca-nhan/dich-vu-ngan-hang-so",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: LAYER_1_REASONS.WHITELISTED_DOMAIN,
  },
  {
    category: "2. VN Banks — ACB Official",
    url: "https://acb.com.vn/khach-hang-ca-nhan",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: LAYER_1_REASONS.WHITELISTED_DOMAIN,
  },
  {
    category: "2. VN Banks — TPBank Official",
    url: "https://tpb.vn/khach-hang-ca-nhan/tiet-kiem",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: LAYER_1_REASONS.WHITELISTED_DOMAIN,
  },
  {
    category: "2. VN Banks — Sacombank Official",
    url: "https://sacombank.com.vn/ca-nhan/the.html",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: LAYER_1_REASONS.WHITELISTED_DOMAIN,
  },
  {
    category: "2. VN Banks — VIB Official",
    url: "https://vib.com.vn/vn/ca-nhan",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: LAYER_1_REASONS.WHITELISTED_DOMAIN,
  },
  {
    category: "2. VN Fintech — MoMo Wallet",
    url: "https://momo.vn/tin-tuc/khuyen-mai",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: LAYER_1_REASONS.WHITELISTED_DOMAIN,
  },
  {
    category: "2. VN Fintech — ZaloPay Wallet",
    url: "https://zalopay.vn/tin-tuc/uu-dai",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: LAYER_1_REASONS.WHITELISTED_DOMAIN,
  },
  {
    category: "2. VN Fintech — VNPAY Payment Gateway",
    url: "https://vnpay.vn/giai-phap-thanh-toan",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: LAYER_1_REASONS.WHITELISTED_DOMAIN,
  },
  {
    category: "2. VN Fintech — Viettel Money",
    url: "https://viettelmoney.vn/dich-vu-chuyen-tien",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: LAYER_1_REASONS.WHITELISTED_DOMAIN,
  },

  // =========================================================================
  // 3. LEGITIMATE GOVERNMENT & PUBLIC SERVICES (.gov.vn)
  // =========================================================================
  {
    category: "3. Gov Portals — Cổng Dịch vụ công Quốc gia",
    url: "https://dichvucong.gov.vn/p/home/dvc-index.html",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: LAYER_1_REASONS.WHITELISTED_DOMAIN,
  },
  {
    category: "3. Gov Portals — VNeID Định danh điện tử",
    url: "https://vneid.gov.vn/huong-dan-cai-dat.html",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: LAYER_1_REASONS.WHITELISTED_DOMAIN,
  },
  {
    category: "3. Gov Portals — Bộ Công an",
    url: "https://bocongan.gov.vn/tin-tuc/thong-bao",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: LAYER_1_REASONS.WHITELISTED_DOMAIN,
  },
  {
    category: "3. Gov Portals — Bảo hiểm Xã hội Việt Nam",
    url: "https://baohiemxahoi.gov.vn/tra-cuu/Pages/default.aspx",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: LAYER_1_REASONS.WHITELISTED_DOMAIN,
  },
  {
    category: "3. Gov Portals — Thuế Điện Tử Tổng cục Thuế",
    url: "https://thuedientu.gdt.gov.vn/ttht/login",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: LAYER_1_REASONS.WHITELISTED_DOMAIN,
  },
  {
    category: "3. Gov Portals — Cục Cảnh sát Giao thông",
    url: "https://csgt.vn/tra-cuu-phuong-tien-vi-pham.html",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: LAYER_1_REASONS.WHITELISTED_DOMAIN,
  },
  {
    category: "3. Gov Portals — Cổng Thông tin Chính phủ",
    url: "https://chinhphu.vn/thoi-su",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: LAYER_1_REASONS.WHITELISTED_DOMAIN,
  },
  {
    category: "3. Gov Portals — Bộ Giáo dục và Đào tạo",
    url: "https://moet.gov.vn/tintuc/Pages/tin-tong-hop.aspx",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: LAYER_1_REASONS.WHITELISTED_DOMAIN,
  },

  // =========================================================================
  // 4. LEGITIMATE GLOBAL TECH, CLOUD, AI & PRODUCTIVITY PLATFORMS
  // =========================================================================
  {
    category: "4. Global Tech — Google Accounts",
    url: "https://accounts.google.com/signin/v2/identifier",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: LAYER_1_REASONS.WHITELISTED_DOMAIN,
  },
  {
    category: "4. Global Tech — Gmail Web",
    url: "https://mail.google.com/mail/u/0/#inbox",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: LAYER_1_REASONS.WHITELISTED_DOMAIN,
  },
  {
    category: "4. Global Tech — Microsoft Online Login",
    url: "https://login.microsoftonline.com/common/oauth2/authorize",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: LAYER_1_REASONS.WHITELISTED_DOMAIN,
  },
  {
    category: "4. Global Tech — Apple iCloud",
    url: "https://icloud.com/find",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: LAYER_1_REASONS.WHITELISTED_DOMAIN,
  },
  {
    category: "4. Global Tech — GitHub Repository",
    url: "https://github.com/google-deepmind/studenthub-ai",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: LAYER_1_REASONS.WHITELISTED_DOMAIN,
  },
  {
    category: "4. Global Tech — OpenAI ChatGPT",
    url: "https://chatgpt.com/c/student-assistant",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: LAYER_1_REASONS.WHITELISTED_DOMAIN,
  },
  {
    category: "4. Global Tech — Anthropic Claude",
    url: "https://claude.ai/chat/study-analysis",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: LAYER_1_REASONS.WHITELISTED_DOMAIN,
  },
  {
    category: "4. Global Tech — Canvas LMS Instructure",
    url: "https://instructure.com/canvas/login",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: LAYER_1_REASONS.WHITELISTED_DOMAIN,
  },
  {
    category: "4. Global Tech — Overleaf LaTeX",
    url: "https://overleaf.com/project/658b9f",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: LAYER_1_REASONS.WHITELISTED_DOMAIN,
  },
  {
    category: "4. Global Tech — Notion Workspace",
    url: "https://notion.so/studenthub-roadmap",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: LAYER_1_REASONS.WHITELISTED_DOMAIN,
  },
  {
    category: "4. Global Tech — Canva Design",
    url: "https://canva.com/design/DAF-template",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: LAYER_1_REASONS.WHITELISTED_DOMAIN,
  },
  {
    category: "4. Global Tech — Zoom Meeting",
    url: "https://zoom.us/j/8492048592",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: LAYER_1_REASONS.WHITELISTED_DOMAIN,
  },

  // =========================================================================
  // 5. BANK & BIOMETRIC UPDATE PHISHING ATTACKS (CRITICAL HOT THREATS)
  // =========================================================================
  {
    category: "5. Bank Phishing — Vietcombank Sinh Trắc Học Fake",
    url: "http://vietcombank-login.verify-portal.xyz/cap-nhat-sinh-trac-hoc",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: null,
  },
  {
    category: "5. Bank Phishing — VCB Digibank Smart OTP Theft",
    url: "http://vcb-digibank.smart-otp-auth.top/mo-khoa-tai-khoan",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: null,
  },
  {
    category: "5. Bank Phishing — MBBank E-banking Face ID Scam",
    url: "https://mbbank-online-ebanking.net/xac-thuc-khuon-mat",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: null,
  },
  {
    category: "5. Bank Phishing — Techcombank Security Alert Fake",
    url: "http://techcombank-tcb.security-alert.click/kich-hoat",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: null,
  },
  {
    category: "5. Bank Phishing — BIDV SmartBanking Sinh Trắc Học",
    url: "http://bidv-smartbanking.update-info.cam/sinh-trac-hoc",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: null,
  },
  {
    category: "5. Bank Phishing — VietinBank iPay Data Sync Phish",
    url: "http://vietinbank-ipay.verify-account.vip/dong-bo-du-lieu",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: null,
  },
  {
    category: "5. Bank Phishing — Agribank E-banking Biometrics",
    url: "http://agribank-ebanking.cfd/cap-nhat-sinh-trac-hoc",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: null,
  },
  {
    category: "5. Bank Phishing — ACB ONE OTP Confirm Trap",
    url: "http://acb-one-login.online/xac-nhan-otp",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: null,
  },
  {
    category: "5. Bank Phishing — VPBank NEO Unlock Card Phish",
    url: "http://vpbank-neo.security-check.club/mo-khoa-the",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: null,
  },
  {
    category: "5. Bank Phishing — TPBank Smart OTP Upgrade Scam",
    url: "http://tpbank-ebanking.site/nang-cap-smart-otp",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: null,
  },
  {
    category: "5. Bank Phishing — MoMo Fake Claim Voucher Trap",
    url: "http://momo-vi-nhan-tien.top/claim-voucher",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: null,
  },
  {
    category: "5. Bank Phishing — ZaloPay 2026 Reward Scam",
    url: "http://zalopay-xac-thuc.xyz/nhan-thuong-2026",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: null,
  },
  {
    category: "5. Bank Phishing — VNPAY QR Merchant Activate Trap",
    url: "http://vnpay-qr-merchant.cam/kich-hoat-vi",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: null,
  },

  // =========================================================================
  // 6. STUDENT SCHOLARSHIP, UNIVERSITY & TASK DEPOSIT SCAMS
  // =========================================================================
  {
    category: "6. Student Phishing — HCMUTE University Student OTP Theft",
    url: "http://hcmute-login.verify-portal.xyz/student-otp",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: null,
  },
  {
    category: "6. Student Phishing — HCMUTE Enterprise Scholarship Trap",
    url: "http://sinhvien-hcmute.hocbong-doanhnghiep.top/nhan-hoc-bong",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: null,
  },
  {
    category: "6. Student Phishing — VNU-HCM Tuition Aid Scam",
    url: "http://dhqg-vnuhcm.portal-sinhvien.site/tro-cap-hoc-phi",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: null,
  },
  {
    category: "6. Student Phishing — HUST Bách Khoa HN Reward Phish",
    url: "http://hust-bachkhoahn.dang-ky-hoc-bong.club/nhan-thuong",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: null,
  },
  {
    category: "6. Student Phishing — Shopee CTV Part-Time Deposit Scam",
    url: "http://shopee-tuyen-ctv.kiem-tien-online.top/nap-tien-du-an",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: null,
  },
  {
    category: "6. Student Phishing — Lazada Order Review Task Scam",
    url: "http://lazada-don-hang.nhiem-vu-kiem-tien.site/dat-coc",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: null,
  },
  {
    category: "6. Student Phishing — TikTok Shop Commission Task Scam",
    url: "http://tiktok-shop-ctv.nhan-hoa-hong.xyz/nhiem-vu",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: null,
  },
  {
    category: "6. Gov Phishing — VNeID Level 2 Identification Trap",
    url: "http://dichvucong-vneid-dinhdanh.top/cap-nhat-dinh-danh",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: null,
  },
  {
    category: "6. Gov Phishing — National CCCD Data Sync Scam",
    url: "http://vneid-dinhdanh-quocgia.xyz/dong-bo-cccd",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: null,
  },

  // =========================================================================
  // 7. UNICODE HOMOGLYPH & PUNYCODE DECEPTION ATTACKS
  // =========================================================================
  {
    category: "7. Homoglyph — Cyrillic 'а' in Apple",
    url: "https://аpple.com/verify-account",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: LAYER_1_REASONS.UNICODE_HOMOGLYPH,
  },
  {
    category: "7. Homoglyph — Cyrillic 'оо' in Google",
    url: "https://gооgle.com/accounts/login",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: LAYER_1_REASONS.UNICODE_HOMOGLYPH,
  },
  {
    category: "7. Homoglyph — Cyrillic 'і' in Vietcombank",
    url: "https://vіetcombank.com.vn/ebanking",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: LAYER_1_REASONS.UNICODE_HOMOGLYPH,
  },
  {
    category: "7. Homoglyph — Cyrillic 'і' in Microsoft",
    url: "https://mіcrosoft.com/auth/login",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: LAYER_1_REASONS.UNICODE_HOMOGLYPH,
  },
  {
    category: "7. Homoglyph — Cyrillic 'а' in Facebook",
    url: "https://fаcebook.com/recover/code",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: LAYER_1_REASONS.UNICODE_HOMOGLYPH,
  },
  {
    category: "7. Homoglyph — Cyrillic 'ор' in Shopee",
    url: "https://shорee.vn/order-confirm",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: LAYER_1_REASONS.UNICODE_HOMOGLYPH,
  },
  {
    category: "7. Homoglyph — Cyrillic 'о' in MoMo",
    url: "https://mоmo.vn/transfer",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: LAYER_1_REASONS.UNICODE_HOMOGLYPH,
  },
  {
    category: "7. Homoglyph — Cyrillic 'с' in HCMUTE",
    url: "https://hсmute.edu.vn/login",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: LAYER_1_REASONS.UNICODE_HOMOGLYPH,
  },
  {
    category: "7. Punycode — Spoofed Apple IDN",
    url: "http://xn--pple-43d.com/signin",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: LAYER_1_REASONS.UNICODE_HOMOGLYPH,
  },
  {
    category: "7. Punycode — Spoofed Google IDN",
    url: "http://xn--gogle-1qa.com/auth",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: LAYER_1_REASONS.UNICODE_HOMOGLYPH,
  },

  // =========================================================================
  // 8. SSRF & OBFUSCATED PRIVATE DESTINATION TARGETS
  // =========================================================================
  {
    category: "8. SSRF — Standard Loopback IPv4",
    url: "http://127.0.0.1:8080/admin/delete",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: LAYER_1_REASONS.SSRF_ATTEMPT,
  },
  {
    category: "8. SSRF — Cloud Metadata Endpoint IPv4",
    url: "http://169.254.169.254/latest/meta-data/",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: LAYER_1_REASONS.SSRF_ATTEMPT,
  },
  {
    category: "8. SSRF — Decimal Dword IP (127.0.0.1 = 2130706433)",
    url: "http://2130706433/admin",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: LAYER_1_REASONS.SSRF_ATTEMPT,
  },
  {
    category: "8. SSRF — Decimal Dword IP (169.254.169.254 = 2852039166)",
    url: "http://2852039166/latest/meta-data/",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: LAYER_1_REASONS.SSRF_ATTEMPT,
  },
  {
    category: "8. SSRF — Hexadecimal IP (127.0.0.1 = 0x7f000001)",
    url: "http://0x7f000001/api/secret",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: LAYER_1_REASONS.SSRF_ATTEMPT,
  },
  {
    category: "8. SSRF — Hexadecimal IP (169.254.169.254 = 0xa9fea9fe)",
    url: "http://0xa9fea9fe/metadata",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: LAYER_1_REASONS.SSRF_ATTEMPT,
  },
  {
    category: "8. SSRF — Octal IP (127.0.0.1 = 017700000001)",
    url: "http://017700000001/debug",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: LAYER_1_REASONS.SSRF_ATTEMPT,
  },
  {
    category: "8. SSRF — IPv6 Loopback [::1]",
    url: "http://[::1]:9000/internal",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: LAYER_1_REASONS.SSRF_ATTEMPT,
  },
  {
    category: "8. SSRF — Named Host Localhost",
    url: "http://localhost:3000/system/metrics",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: LAYER_1_REASONS.SSRF_ATTEMPT,
  },

  // =========================================================================
  // 9. DIRECT DANGEROUS EXECUTABLE PAYLOAD LINKS
  // =========================================================================
  {
    category: "9. Dangerous Executable — Windows EXE Payload",
    url: "https://portal-tai-lieu.online/scholarship_form.exe",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: LAYER_1_REASONS.DANGEROUS_EXECUTABLE,
  },
  {
    category: "9. Dangerous Executable — Windows MSI Installer",
    url: "https://update-driver.xyz/patch_install.msi",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: LAYER_1_REASONS.DANGEROUS_EXECUTABLE,
  },
  {
    category: "9. Dangerous Executable — Android Trojan APK",
    url: "https://sv-app-download.site/sinhvien_portal.apk",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: LAYER_1_REASONS.DANGEROUS_EXECUTABLE,
  },
  {
    category: "9. Dangerous Executable — PowerShell Malicious Script",
    url: "https://document-share.top/instruction.ps1",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: LAYER_1_REASONS.DANGEROUS_EXECUTABLE,
  },
  {
    category: "9. Dangerous Executable — macOS DMG Dropper",
    url: "https://secure-vpn.club/installer.dmg",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: LAYER_1_REASONS.DANGEROUS_EXECUTABLE,
  },
  {
    category: "9. Dangerous Executable — Windows Batch Payload",
    url: "https://quick-setup.vip/run_update.bat",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: LAYER_1_REASONS.DANGEROUS_EXECUTABLE,
  },
  {
    category: "9. Dangerous Executable — Screensaver SCR Payload",
    url: "https://anti-scam-guide.cam/tool.scr",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: LAYER_1_REASONS.DANGEROUS_EXECUTABLE,
  },
  {
    category: "9. Dangerous Executable — VBScript Payload",
    url: "https://cloud-share.rest/payload.vbs",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: LAYER_1_REASONS.DANGEROUS_EXECUTABLE,
  },

  // =========================================================================
  // 10. URL SHORTENERS & UNENCRYPTED HTTP TRANSPORT
  // =========================================================================
  {
    category: "10. Suspicious Transport — Bit.ly URL Shortener",
    url: "https://bit.ly/student-guide-2026",
    expectedStatus: LAYER_1_STATUS.SUSPICIOUS,
    expectedReason: LAYER_1_REASONS.SHORTENED_URL,
  },
  {
    category: "10. Suspicious Transport — TinyURL Shortener",
    url: "https://tinyurl.com/scholarship-hcmute",
    expectedStatus: LAYER_1_STATUS.SUSPICIOUS,
    expectedReason: LAYER_1_REASONS.SHORTENED_URL,
  },
  {
    category: "10. Suspicious Transport — T.co Twitter Shortener",
    url: "https://t.co/studenthub-news",
    expectedStatus: LAYER_1_STATUS.SUSPICIOUS,
    expectedReason: LAYER_1_REASONS.SHORTENED_URL,
  },
  {
    category: "10. Suspicious Transport — Cutt.ly Shortener",
    url: "https://cutt.ly/tai-lieu-on-thi",
    expectedStatus: LAYER_1_STATUS.SUSPICIOUS,
    expectedReason: LAYER_1_REASONS.SHORTENED_URL,
  },
  {
    category: "10. Suspicious Transport — Unencrypted HTTP Blog",
    url: "http://my-academic-blog.org/article-1",
    expectedStatus: LAYER_1_STATUS.SUSPICIOUS,
    expectedReason: LAYER_1_REASONS.UNENCRYPTED_TRANSPORT,
  },
  {
    category: "10. Suspicious Transport — Unencrypted HTTP Notes",
    url: "http://tech-notes-student.net/tips",
    expectedStatus: LAYER_1_STATUS.SUSPICIOUS,
    expectedReason: LAYER_1_REASONS.UNENCRYPTED_TRANSPORT,
  },
  {
    category: "10. Suspicious Transport — Raw IPv4 Hostname",
    url: "http://192.168.1.50/dashboard",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: LAYER_1_REASONS.SSRF_ATTEMPT,
  },
  {
    category: "10. Suspicious Transport — Raw IPv4 Host Announcements",
    url: "http://203.113.131.2/announcements",
    expectedStatus: LAYER_1_STATUS.SUSPICIOUS,
    expectedReason: LAYER_1_REASONS.IP_BASED_HOST,
  },

  // =========================================================================
  // 11. FALSE POSITIVE PREVENTION (BENIGN DICTIONARY WORDS WITH SUB-STRINGS)
  // =========================================================================
  {
    category: "11. False Positive Guard — 'cute' in cute-puppies.org (NOT HCMUTE)",
    url: "https://cute-puppies.org/gallery",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: null,
  },
  {
    category: "11. False Positive Guard — 'minute' in tutor-minute.com (NOT HCMUTE)",
    url: "https://tutor-minute.com/courses",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: null,
  },
  {
    category: "11. False Positive Guard — 'pineapple' in pineapple-recipes.net (NOT Apple)",
    url: "https://pineapple-recipes.net/dishes",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: null,
  },
  {
    category: "11. False Positive Guard — 'metadata' in metadata-governance.org (NOT Meta)",
    url: "https://metadata-governance.org/standards",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: null,
  },
  {
    category: "11. False Positive Guard — 'computational' in computational-physics.com (NOT HCMUTE)",
    url: "https://computational-physics.com/lecture",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: null,
  },
  {
    category: "11. False Positive Guard — 'travel' in singapore-travel-guide.com (NOT Apple)",
    url: "https://singapore-travel-guide.com/attractions",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: null,
  },
  {
    category: "11. False Positive Guard — 'dispute' in dispute-resolution-center.org (NOT HCMUTE)",
    url: "https://dispute-resolution-center.org/cases",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: null,
  },
  {
    category: "11. False Positive Guard — 'minute' in minute-maid-beverages.com (NOT HCMUTE)",
    url: "https://minute-maid-beverages.com/products",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: null,
  },
  {
    category: "11. False Positive Guard — 'culture' in open-culture-foundation.org (NOT HCMUTE)",
    url: "https://open-culture-foundation.org/initiatives",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: null,
  },
  {
    category: "11. False Positive Guard — 'executive' in executive-leadership-program.com (NOT HCMUTE)",
    url: "https://executive-leadership-program.com/mba",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: null,
  },
  {
    category: "11. False Positive Guard — 'atmospheric' in atmospheric-science.net (NOT MoMo)",
    url: "https://atmospheric-science.net/data",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: null,
  },
];

export async function runUrlBenchmarkSuite() {
  console.log("======================================================================");
  console.log("🌐 LAYER 1 — COMPREHENSIVE URL BENCHMARK & EVALUATION SUITE");
  console.log("======================================================================\n");

  let passed = 0;
  let failed = 0;
  let totalLatency = 0;
  const categoryStats = {};

  const confusionMatrix = {
    TP: 0, // Malicious correctly blocked/suspicious
    TN: 0, // Safe correctly passed
    FP: 0, // Safe incorrectly blocked/suspicious (False Alarm)
    FN: 0, // Malicious missed as pass (Dangerous Leak)
  };

  for (const test of URL_BENCHMARK_CASES) {
    const catGroup = test.category.split("—")[0].trim();
    if (!categoryStats[catGroup]) {
      categoryStats[catGroup] = { passed: 0, failed: 0, total: 0 };
    }
    categoryStats[catGroup].total++;

    const result = await Layer1ScreenService.screen({
      type: "url",
      content: test.url,
    });

    totalLatency += result.metrics.executionTimeMs;

    const isStatusMatch = result.status === test.expectedStatus;
    const isReasonMatch =
      test.expectedReason === null ||
      result.reasons.includes(test.expectedReason) ||
      (result.status === LAYER_1_STATUS.BLOCK &&
        (result.reasons.includes(LAYER_1_REASONS.PHISHING_PATTERN) ||
          result.reasons.includes(LAYER_1_REASONS.BRAND_IMPERSONATION_SUBDOMAIN) ||
          result.reasons.includes(LAYER_1_REASONS.BRAND_IMPERSONATION)));

    const isTestPassed = isStatusMatch && isReasonMatch;

    // Confusion Matrix Accounting
    const isExpectedMalicious =
      test.expectedStatus === LAYER_1_STATUS.BLOCK ||
      test.expectedStatus === LAYER_1_STATUS.SUSPICIOUS;
    const isReceivedMalicious =
      result.status === LAYER_1_STATUS.BLOCK ||
      result.status === LAYER_1_STATUS.SUSPICIOUS;

    if (isExpectedMalicious && isReceivedMalicious) confusionMatrix.TP++;
    else if (!isExpectedMalicious && !isReceivedMalicious) confusionMatrix.TN++;
    else if (!isExpectedMalicious && isReceivedMalicious) confusionMatrix.FP++;
    else if (isExpectedMalicious && !isReceivedMalicious) confusionMatrix.FN++;

    if (isTestPassed) {
      passed++;
      categoryStats[catGroup].passed++;
      console.log(`✅ [PASS] ${test.category}`);
      console.log(`   URL: ${test.url}`);
      console.log(`   Status: ${result.status} | Conf: ${result.confidence} | Latency: ${result.metrics.executionTimeMs}ms | Reasons: [${result.reasons.join(", ")}]`);
    } else {
      failed++;
      categoryStats[catGroup].failed++;
      console.error(`❌ [FAIL] ${test.category}`);
      console.error(`   URL: ${test.url}`);
      console.error(`   Expected: Status=${test.expectedStatus}, Reason=${test.expectedReason}`);
      console.error(`   Received: Status=${result.status}, Reasons=[${result.reasons.join(", ")}]`);
    }
  }

  const total = passed + failed;
  const avgLatency = (totalLatency / total).toFixed(2);
  const accuracy = ((passed / total) * 100).toFixed(1);

  console.log("\n======================================================================");
  console.log("📈 CATEGORY BREAKDOWN SUMMARY");
  console.log("======================================================================");
  for (const [category, stats] of Object.entries(categoryStats)) {
    const rate = ((stats.passed / stats.total) * 100).toFixed(1);
    console.log(`🔹 ${category.padEnd(25)}: ${stats.passed}/${stats.total} (${rate}%)`);
  }

  console.log("\n======================================================================");
  console.log("🎯 CONFUSION MATRIX & QUALITY METRICS");
  console.log("======================================================================");
  console.log(`True Positives (Threats Blocked)   [TP]: ${confusionMatrix.TP}`);
  console.log(`True Negatives (Legitimate Passed)  [TN]: ${confusionMatrix.TN}`);
  console.log(`False Positives (False Alarms)      [FP]: ${confusionMatrix.FP}`);
  console.log(`False Negatives (Missed Threats)    [FN]: ${confusionMatrix.FN}`);
  console.log(`Average Screening Latency                : ${avgLatency} ms`);
  console.log(`Overall Deterministic Accuracy           : ${accuracy}%`);
  console.log("======================================================================\n");

  return { passed, failed, total, accuracy, avgLatency, confusionMatrix };
}

// Auto-run if executed directly
if (process.argv[1]?.endsWith("url_benchmark.test.mjs")) {
  runUrlBenchmarkSuite().then(({ failed }) => {
    if (failed > 0) process.exit(1);
    else process.exit(0);
  });
}
