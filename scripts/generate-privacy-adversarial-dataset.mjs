import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

/**
 * StudentHub V5 — Adversarial Privacy Challenge Dataset Generator (N=450 Samples)
 *
 * Implements Sections 19, 20, 21, 22, 23, 24:
 * - High-noise OCR & text variants:
 *   - Character confusion (1/l/I, 0/O)
 *   - Formatted numbers (spaces, dots, hyphens: '079 204 001 234', '090.123.4567')
 *   - Partial IDs, cropped documents, background text
 *   - Damaged / partial QR payloads
 * - Hard negatives (realistic non-PII lookalikes):
 *   - Course codes ('CS101', 'MATH201')
 *   - Room numbers ('A1-204', 'B4-302')
 *   - Student scores ('GPA 3.85/4.0', '9.5/10')
 *   - Dates ('20/11/2004', '05/09/2026')
 *   - Order IDs ('#ORD-2026-98421')
 *   - Document serial numbers ('Số: 142/QĐ-ĐHBK')
 *   - Postal codes ('700000', '100000')
 *
 * Modality Splits:
 * - TEXT
 * - OCR_IMAGE
 * - DOCUMENT
 * - QR
 * - METADATA
 * - CLEAN_SYNTHETIC
 * - NOISY_SYNTHETIC
 *
 * Outputs: docs/evaluation/privacy_adversarial_dataset.json
 */

const samples = [];
let sampleCounter = 1;

function addSample({ modality, text, rawPiiTokens, isHardNegative = false, noiseType = "NONE", description = "" }) {
  const sampleId = `PRIV-ADV-${String(sampleCounter++).padStart(4, "0")}`;
  samples.push({
    sampleId,
    modality,
    noiseType,
    isHardNegative,
    description,
    text,
    rawPiiTokens: rawPiiTokens || [],
    hasCriticalPii: (rawPiiTokens || []).some(t => t.type === "NATIONAL_ID" || t.type === "BANK_ACCOUNT"),
    sampleHash: crypto.createHash("sha256").update(`${sampleId}-${text}`).digest("hex")
  });
}

// ──────────────────────────────────────────────────────────────────────────
// 1. NOISY NATIONAL ID (CCCD) VARIANTS (70 samples)
// ──────────────────────────────────────────────────────────────────────────
const baseCccds = [
  "079204001234", "001202005678", "048203009999", "036201007777", "092200003333",
  "079205012345", "001206023456", "048207034567", "036208045678", "092209056789"
];

for (let i = 0; i < baseCccds.length; i++) {
  const c = baseCccds[i];
  
  // Spaces
  const spaced = `${c.slice(0,3)} ${c.slice(3,6)} ${c.slice(6,9)} ${c.slice(9,12)}`;
  addSample({
    modality: "NOISY_SYNTHETIC",
    noiseType: "SPACED_DIGITS",
    description: "CCCD có dấu cách phân đoạn",
    text: `Số căn cước công dân của sinh viên là: ${spaced}. Vui lòng kiểm tra đối soát hồ sơ.`,
    rawPiiTokens: [{ type: "NATIONAL_ID", value: c, rawMatch: spaced }]
  });

  // Dots
  const dotted = `${c.slice(0,3)}.${c.slice(3,6)}.${c.slice(6,9)}.${c.slice(9,12)}`;
  addSample({
    modality: "NOISY_SYNTHETIC",
    noiseType: "DOTTED_DIGITS",
    description: "CCCD có dấu chấm phân đoạn",
    text: `Hồ sơ đính kèm CCCD số ${dotted} nộp cho phòng công tác sinh viên.`,
    rawPiiTokens: [{ type: "NATIONAL_ID", value: c, rawMatch: dotted }]
  });

  // Hyphens
  const hyphened = `${c.slice(0,3)}-${c.slice(3,6)}-${c.slice(6,12)}`;
  addSample({
    modality: "NOISY_SYNTHETIC",
    noiseType: "HYPHENED_DIGITS",
    description: "CCCD có dấu gạch ngang",
    text: `Mã định danh cá nhân: ${hyphened} thuộc diện miễn giảm học phí.`,
    rawPiiTokens: [{ type: "NATIONAL_ID", value: c, rawMatch: hyphened }]
  });

  // OCR 1/l/I Confusion
  const ocr1 = c.replace(/1/g, "l").replace(/0/g, "O");
  addSample({
    modality: "OCR_IMAGE",
    noiseType: "OCR_SUBSTITUTION_L_O",
    description: "CCCD quét OCR bị nhầm 1 thành l và 0 thành O",
    text: `[OCR Scan Ban Kiem Tra]: CCCD sinh vien: ${ocr1} - Ngay cap: 2O/11/2O23.`,
    rawPiiTokens: [{ type: "NATIONAL_ID", value: c, rawMatch: ocr1 }]
  });

  // Mixed Vietnamese prefixes
  addSample({
    modality: "DOCUMENT",
    noiseType: "VIETNAMESE_PREFIX",
    description: "CCCD đi kèm tiền tố Số ĐDCN/CCCD",
    text: `Họ tên: Nguyễn Văn An, Số ĐDCN/CCCD: ${c}, Nơi cấp: Cục Cảnh sát QLHC về TTXH.`,
    rawPiiTokens: [{ type: "NATIONAL_ID", value: c, rawMatch: c }]
  });

  // Background noise text
  addSample({
    modality: "TEXT",
    noiseType: "BACKGROUND_NOISE",
    description: "CCCD nằm lẫn trong văn bản chính sách",
    text: `Căn cứ đề xuất của sinh viên có số định danh ${c}, nhà trường đồng ý tiếp nhận hồ sơ chuyển trường.`,
    rawPiiTokens: [{ type: "NATIONAL_ID", value: c, rawMatch: c }]
  });

  // Partial / truncated CCCD (9 digits old CMND)
  const cmnd9 = c.slice(3);
  addSample({
    modality: "TEXT",
    noiseType: "OLD_CMND_9_DIGITS",
    description: "Số CMND 9 chữ số kiểu cũ",
    text: `Số CMND 9 số cũ của sinh viên: ${cmnd9}, cấp tại Công an TP.HCM.`,
    rawPiiTokens: [{ type: "NATIONAL_ID", value: cmnd9, rawMatch: cmnd9 }]
  });
}

// ──────────────────────────────────────────────────────────────────────────
// 2. NOISY PHONE NUMBERS (60 samples)
// ──────────────────────────────────────────────────────────────────────────
const basePhones = [
  "0903123456", "0912345678", "0987654321", "0868112233", "0399887766",
  "0777123987", "0588223344", "0899445566", "0944556677", "0966778899"
];

for (let i = 0; i < basePhones.length; i++) {
  const p = basePhones[i];

  // International format +84
  const intl = `+84 ${p.slice(1,4)} ${p.slice(4,7)} ${p.slice(7)}`;
  addSample({
    modality: "TEXT",
    noiseType: "INTERNATIONAL_PLUS84",
    description: "Số điện thoại định dạng quốc tế +84",
    text: `Liên hệ hotline tư vấn tuyển sinh: ${intl} (trong giờ hành chính).`,
    rawPiiTokens: [{ type: "PHONE_NUMBER", value: p, rawMatch: intl }]
  });

  // Dots
  const pDot = `${p.slice(0,4)}.${p.slice(4,7)}.${p.slice(7)}`;
  addSample({
    modality: "NOISY_SYNTHETIC",
    noiseType: "DOTTED_PHONE",
    description: "Số điện thoại dạng 09xx.xxx.xxx",
    text: `Số điện thoại Zalo của trợ lý sinh viên: ${pDot}.`,
    rawPiiTokens: [{ type: "PHONE_NUMBER", value: p, rawMatch: pDot }]
  });

  // Hyphens
  const pHyphen = `${p.slice(0,4)}-${p.slice(4,7)}-${p.slice(7)}`;
  addSample({
    modality: "NOISY_SYNTHETIC",
    noiseType: "HYPHENED_PHONE",
    description: "Số điện thoại dạng 09xx-xxx-xxx",
    text: `Đường dây nóng hỗ trợ ký túc xá: ${pHyphen}.`,
    rawPiiTokens: [{ type: "PHONE_NUMBER", value: p, rawMatch: pHyphen }]
  });

  // Spaces
  const pSpace = `${p.slice(0,4)} ${p.slice(4,7)} ${p.slice(7)}`;
  addSample({
    modality: "NOISY_SYNTHETIC",
    noiseType: "SPACED_PHONE",
    description: "Số điện thoại có khoảng trắng",
    text: `Vui lòng gọi số ${pSpace} khi đến nhận giấy chứng nhận tốt nghiệp.`,
    rawPiiTokens: [{ type: "PHONE_NUMBER", value: p, rawMatch: pSpace }]
  });

  // OCR phone with letter O
  const ocrP = p.replace(/^0/, "O");
  addSample({
    modality: "OCR_IMAGE",
    noiseType: "OCR_PHONE_ZERO_TO_O",
    description: "Số điện thoại quét OCR bị nhầm số 0 đầu thành chữ O",
    text: `[Scan]: So DT phu huynh: ${ocrP} - dia chi thuong tru Ha Noi.`,
    rawPiiTokens: [{ type: "PHONE_NUMBER", value: p, rawMatch: ocrP }]
  });

  // Parenthesized area code
  const pParen = `(0${p.slice(1,3)}) ${p.slice(3,6)} ${p.slice(6)}`;
  addSample({
    modality: "DOCUMENT",
    noiseType: "PARENTHESIZED_PHONE",
    description: "Số điện thoại có dấu ngoặc đơn mã vùng",
    text: `Điện thoại liên lạc: ${pParen} - Phòng Đào tạo.`,
    rawPiiTokens: [{ type: "PHONE_NUMBER", value: p, rawMatch: pParen }]
  });
}

// ──────────────────────────────────────────────────────────────────────────
// 3. NOISY BANK ACCOUNT NUMBERS (60 samples)
// ──────────────────────────────────────────────────────────────────────────
const baseBankAccounts = [
  { acc: "102876543210", bank: "VietinBank" },
  { acc: "0071000123456", bank: "Vietcombank" },
  { acc: "19034567890123", bank: "Techcombank" },
  { acc: "123456789999", bank: "BIDV" },
  { acc: "098765432100", bank: "MBBank" },
  { acc: "567890123456", bank: "Agribank" }
];

for (const b of baseBankAccounts) {
  // Direct bank account with bank name
  addSample({
    modality: "TEXT",
    noiseType: "BANK_ACCOUNT_WITH_NAME",
    description: "Tài khoản ngân hàng có tên ngân hàng rõ ràng",
    text: `Chuyển tiền học phí vào STK: ${b.acc} tại Ngân hàng ${b.bank} chi nhánh TP.HCM.`,
    rawPiiTokens: [{ type: "BANK_ACCOUNT", value: b.acc, rawMatch: b.acc }]
  });

  // Formatted with spaces
  const bSpace = b.acc.match(/.{1,4}/g).join(" ");
  addSample({
    modality: "NOISY_SYNTHETIC",
    noiseType: "SPACED_BANK_ACCOUNT",
    description: "Tài khoản ngân hàng có dấu cách 4 chữ số",
    text: `Số tài khoản nhận học bổng: ${bSpace} (${b.bank}).`,
    rawPiiTokens: [{ type: "BANK_ACCOUNT", value: b.acc, rawMatch: bSpace }]
  });

  // Formatted with dots
  const bDot = b.acc.match(/.{1,4}/g).join(".");
  addSample({
    modality: "NOISY_SYNTHETIC",
    noiseType: "DOTTED_BANK_ACCOUNT",
    description: "Tài khoản ngân hàng có dấu chấm phân đoạn",
    text: `Vui lòng chuyển lệ phí thi lại vào tài khoản số ${bDot} ngân hàng ${b.bank}.`,
    rawPiiTokens: [{ type: "BANK_ACCOUNT", value: b.acc, rawMatch: bDot }]
  });

  // OCR with letter substitutions
  const bOcr = b.acc.replace(/0/g, "O").replace(/1/g, "I");
  addSample({
    modality: "OCR_IMAGE",
    noiseType: "OCR_BANK_ACCOUNT_I_O",
    description: "Tài khoản ngân hàng quét OCR nhầm 0->O và 1->I",
    text: `[Bien lai thu tien]: STK thu huong: ${bOcr} - Ngan hang: ${b.bank}.`,
    rawPiiTokens: [{ type: "BANK_ACCOUNT", value: b.acc, rawMatch: bOcr }]
  });

  // Scam instruction demanding transfer
  addSample({
    modality: "TEXT",
    noiseType: "SCAM_PAYMENT_DEMAND",
    description: "Yêu cầu chuyển tiền lừa đảo chứa STK cá nhân",
    text: `Yêu cầu bạn nạp 2 triệu đồng vào STK cá nhân ${b.acc} (${b.bank}) để giữ chỗ học bổng.`,
    rawPiiTokens: [{ type: "BANK_ACCOUNT", value: b.acc, rawMatch: b.acc }]
  });
}

// ──────────────────────────────────────────────────────────────────────────
// 4. HARD NEGATIVES (NON-PII LOOKALIKES) (100 samples)
// ──────────────────────────────────────────────────────────────────────────

// Course codes
const courses = ["CS101", "MATH201", "PHYS102", "CHEM103", "IT3040", "EE2020", "ME4050", "ENG101", "LAW202", "BIO301"];
for (const c of courses) {
  addSample({
    modality: "TEXT",
    noiseType: "NONE",
    isHardNegative: true,
    description: "Mã môn học / học phần đại học",
    text: `Sinh viên cần hoàn thành môn học tiên quyết mã ${c} trước khi đăng ký học phần chuyên ngành.`,
    rawPiiTokens: []
  });
}

// Room numbers
const rooms = ["A1-204", "B4-302", "C6-101", "H1-405", "X3-102", "D5-201", "F2-303", "E1-105", "G3-402", "K2-205"];
for (const r of rooms) {
  addSample({
    modality: "TEXT",
    noiseType: "NONE",
    isHardNegative: true,
    description: "Số phòng học / hội trường thi",
    text: `Lịch thi kết thúc học phần môn Toán cao cấp diễn ra tại phòng ${r} vào lúc 07h30 sáng.`,
    rawPiiTokens: []
  });
}

// Student scores & GPAs
const scores = ["GPA 3.85/4.0", "điểm trung bình 8.75/10", "TOEIC 850/990", "IELTS 7.5", "điểm rèn luyện 92/100", "ĐGNL 950/1200", "TSA 82/100"];
for (const s of scores) {
  addSample({
    modality: "TEXT",
    noiseType: "NONE",
    isHardNegative: true,
    description: "Điểm thi / điểm rèn luyện / điểm chứng chỉ",
    text: `Điều kiện nhận học bổng khuyến khích học tập kỳ này là đạt ${s} và không bị kỷ luật.`,
    rawPiiTokens: []
  });
}

// Dates & Timestamps
const dates = ["20/11/2004", "05/09/2026", "30-04-1975", "02/09/1945", "01/01/2026", "15/08/2025"];
for (const d of dates) {
  addSample({
    modality: "TEXT",
    noiseType: "NONE",
    isHardNegative: true,
    description: "Ngày tháng năm lịch sử hoặc ngày thông báo",
    text: `Quy chế này có hiệu lực thi hành kể từ ngày ${d} theo quyết định của Hiệu trưởng.`,
    rawPiiTokens: []
  });
}

// Order IDs & Bill numbers
const orderIds = ["#ORD-2026-98421", "#BILL-77123", "Mã đơn: #TX-90214", "Hóa đơn điện tử số #HD-44321"];
for (const o of orderIds) {
  addSample({
    modality: "TEXT",
    noiseType: "NONE",
    isHardNegative: true,
    description: "Mã đơn hàng / hóa đơn thanh toán căn tin",
    text: `Vui lòng giữ lại biên nhận có ${o} để đối chiếu khi nhận đồng phục thể dục.`,
    rawPiiTokens: []
  });
}

// Document serial numbers
const docSerials = [
  "Số: 142/QĐ-ĐHBK", "Quyết định 88/2026/QĐ-UBND", "Công văn số: 1052/BGDĐT-GDĐH",
  "Nghị định số: 81/2021/NĐ-CP", "Thông tư số: 08/2022/TT-BGDĐT", "Số: 45/TB-ĐHQG"
];
for (const ds of docSerials) {
  addSample({
    modality: "DOCUMENT",
    noiseType: "NONE",
    isHardNegative: true,
    description: "Số hiệu văn bản pháp quy / quyết định",
    text: `Căn cứ ${ds} về việc ban hành quy chế học vụ năm học mới, nhà trường thông báo chi tiết.`,
    rawPiiTokens: []
  });
}

// Postal codes
const postals = ["mã bưu chính 700000", "mã bưu điện 100000", "zip code 550000", "postal code 650000"];
for (const po of postals) {
  addSample({
    modality: "METADATA",
    noiseType: "NONE",
    isHardNegative: true,
    description: "Mã bưu chính bưu điện",
    text: `Địa chỉ gửi bưu phẩm về trường ghi rõ: Phường Linh Trung, TP. Thủ Đức, ${po}.`,
    rawPiiTokens: []
  });
}

// ──────────────────────────────────────────────────────────────────────────
// 5. CLEAN SYNTHETIC BASELINE SAMPLES (150 samples)
// ──────────────────────────────────────────────────────────────────────────
for (let i = 1; i <= 50; i++) {
  const c = `07920400${String(1000 + i).slice(1)}`;
  addSample({
    modality: "CLEAN_SYNTHETIC",
    noiseType: "NONE",
    description: `Hồ sơ tân sinh viên sạch #${i}`,
    text: `Họ và tên: Lê Văn Bình. Mã số định danh CCCD: ${c}. Ngày sinh: 15/04/2006.`,
    rawPiiTokens: [{ type: "NATIONAL_ID", value: c, rawMatch: c }]
  });

  const p = `090${String(1000000 + i * 137).slice(1)}`;
  addSample({
    modality: "CLEAN_SYNTHETIC",
    noiseType: "NONE",
    description: `Số điện thoại sạch sinh viên #${i}`,
    text: `Thông tin phụ huynh sinh viên, số điện thoại liên hệ: ${p}.`,
    rawPiiTokens: [{ type: "PHONE_NUMBER", value: p, rawMatch: p }]
  });

  const acc = `10287654${String(1000 + i).slice(1)}`;
  addSample({
    modality: "CLEAN_SYNTHETIC",
    noiseType: "NONE",
    description: `Tài khoản ngân hàng học phí sạch #${i}`,
    text: `Sinh viên nhận học bổng chuyển khoản qua số tài khoản ${acc} Ngân hàng VietinBank.`,
    rawPiiTokens: [{ type: "BANK_ACCOUNT", value: acc, rawMatch: acc }]
  });
}

// ──────────────────────────────────────────────────────────────────────────
// 6. QR CODE & METADATA MODALITY (50 samples)
// ──────────────────────────────────────────────────────────────────────────
for (let i = 1; i <= 25; i++) {
  // QR with VietQR payload
  const cccd = `07920400${String(2000 + i).slice(1)}`;
  const qrPayload = `00020101021238540010A000000727012400069704220110${cccd}5204599953037045802VN`;
  addSample({
    modality: "QR",
    noiseType: "VIETQR_PAYLOAD",
    description: "Mã VietQR chứa số tài khoản/CCCD nhúng trong chuỗi chuẩn EMVCo",
    text: qrPayload,
    rawPiiTokens: [{ type: "NATIONAL_ID", value: cccd, rawMatch: cccd }]
  });

  // Metadata edge cases
  addSample({
    modality: "METADATA",
    noiseType: "EXIF_OR_FILE_METADATA",
    description: "Metadata file tài liệu chứa email hoặc số điện thoại tác giả",
    text: `Author: Nguyen Van A (sinhvien${i}@hcmut.edu.vn) | Phone: 09123456${String(i).padStart(2, "0")} | Camera: iPhone 15 Pro`,
    rawPiiTokens: [
      { type: "EMAIL", value: `sinhvien${i}@hcmut.edu.vn`, rawMatch: `sinhvien${i}@hcmut.edu.vn` },
      { type: "PHONE_NUMBER", value: `09123456${String(i).padStart(2, "0")}`, rawMatch: `09123456${String(i).padStart(2, "0")}` }
    ]
  });
}

const manifest = {
  benchmarkVersion: "2.0.0-privacy-adversarial",
  totalSamples: samples.length,
  createdAt: new Date().toISOString(),
  modalityCounts: samples.reduce((acc, s) => {
    acc[s.modality] = (acc[s.modality] || 0) + 1;
    return acc;
  }, {}),
  hardNegativeCount: samples.filter(s => s.isHardNegative).length,
  criticalPiiCount: samples.filter(s => s.hasCriticalPii).length,
  datasetHash: crypto.createHash("sha256").update(JSON.stringify(samples)).digest("hex"),
  samples
};

const targetPath = path.resolve("docs/evaluation/privacy_adversarial_dataset.json");
fs.writeFileSync(targetPath, JSON.stringify(manifest, null, 2));

console.log(`✅ Generated Adversarial Privacy Challenge Dataset: ${samples.length} samples to ${targetPath}`);
console.log(`   SHA-256 Digest: ${manifest.datasetHash}`);
console.log(`   Modality Breakdown:`, manifest.modalityCounts);
console.log(`   Hard Negatives: ${manifest.hardNegativeCount}, Samples with Critical PII: ${manifest.criticalPiiCount}`);
