import fs from "node:fs";
import path from "node:path";

const samples = [];
let sampleId = 1;

function addSample(category, content, hasPii, expectedToken = null, metadata = {}) {
  samples.push({
    id: `PII-${String(sampleId++).padStart(4, "0")}`,
    category,
    content,
    hasPii,
    expectedToken,
    metadata
  });
}

// 1. PHONE (150 samples)
const phonePrefixes = ["090", "091", "098", "097", "086", "088", "070", "079", "032", "038", "+8490", "+8498"];
for (let i = 0; i < 150; i++) {
  const prefix = phonePrefixes[i % phonePrefixes.length];
  const rest = String(1000000 + i * 47).slice(0, 7);
  const phone = `${prefix}${rest}`;
  addSample(
    "PHONE",
    `Vui lòng liên hệ hỗ trợ sinh viên qua số hotline ${phone} để được giải đáp thắc mắc về hồ sơ.`,
    true,
    phone
  );
}

// 2. EMAIL (150 samples)
const domains = ["gmail.com", "hcmut.edu.vn", "hcmute.edu.vn", "ueh.edu.vn", "outlook.com", "vnu.edu.vn"];
for (let i = 0; i < 150; i++) {
  const dom = domains[i % domains.length];
  const user = `sinhvien_${i}_${100 + i}`;
  const email = `${user}@${dom}`;
  addSample(
    "EMAIL",
    `Gửi biên lai nộp tiền hoặc minh chứng học bổng về địa chỉ hòm thư ${email} trước 17h00.`,
    true,
    email
  );
}

// 3. STUDENT_ID (150 samples)
for (let i = 0; i < 150; i++) {
  const year = 19 + (i % 8);
  const idNum = `${year}11${String(i).padStart(4, "0")}`;
  const label = i % 2 === 0 ? `MSSV: ${idNum}` : `STUDENT-ID-${idNum}`;
  addSample(
    "STUDENT_ID",
    `Thí sinh trúng tuyển có mã số sinh viên ${label} vui lòng kiểm tra danh sách phòng thi.`,
    true,
    idNum
  );
}

// 4. NATIONAL_ID (150 samples - CCCD/CMND)
for (let i = 0; i < 150; i++) {
  const cccd = `079${String(100000000 + i * 31).slice(0, 9)}`;
  const label = i % 2 === 0 ? `CCCD số ${cccd}` : `CMND/CCCD: ${cccd}`;
  addSample(
    "NATIONAL_ID",
    `Xuất trình giấy tờ tùy thân gồm ${label} khi làm thủ tục nhập học tại bàn tiếp đón.`,
    true,
    cccd
  );
}

// 5. BANK_ACCOUNT (150 samples)
for (let i = 0; i < 150; i++) {
  const stk = `10${String(20000000 + i * 53).slice(0, 8)}`;
  const bank = i % 3 === 0 ? "Vietcombank" : (i % 3 === 1 ? "MB Bank" : "Techcombank");
  const label = `Số tài khoản ${stk} tại ngân hàng ${bank}`;
  addSample(
    "BANK_ACCOUNT",
    `Chuyển khoản học phí giữ chỗ vào ${label} với cú pháp HOCPHI_2026.`,
    true,
    stk
  );
}

// 6. ADDRESS (150 samples)
const streets = ["Nguyễn Văn Cừ", "Lý Thường Kiệt", "Võ Văn Ngân", "Xa lộ Hà Nội", "Điện Biên Phủ", "Trần Hưng Đạo"];
for (let i = 0; i < 150; i++) {
  const num = (i % 200) + 1;
  const street = streets[i % streets.length];
  const addr = `Số ${num} đường ${street}, Quận ${(i % 12) + 1}, TP.HCM`;
  addSample(
    "ADDRESS",
    `Địa chỉ nhận hồ sơ trực tiếp tại ${addr} trong giờ hành chính.`,
    true,
    addr
  );
}

// 7. QR (100 samples)
for (let i = 0; i < 100; i++) {
  const qrData = `00020101021238540010A000000727012400069704${i}520449005303704`;
  addSample(
    "QR",
    `Quét mã thanh toán trực tiếp để hoàn tất: QR=${qrData}`,
    true,
    qrData
  );
}

// 8. LOCATION_METADATA (100 samples)
for (let i = 0; i < 100; i++) {
  addSample(
    "LOCATION_METADATA",
    `Ảnh chụp tài liệu tại phòng tuyển sinh đại học cơ sở 2.`,
    true,
    "GPS_COORDINATES",
    { exifGps: true, latitude: 10.776 + (i * 0.001), longitude: 106.66 + (i * 0.001) }
  );
}

// 9. NON_PII_CONTROL (200 samples)
const controlTexts = [
  "Trường Đại học Bách khoa công bố chuẩn đầu ra ngoại ngữ áp dụng cho toàn bộ sinh viên khóa 2026.",
  "Thời khóa biểu học kỳ 1 năm học mới sẽ chính thức được đăng tải trên cổng thông tin đào tạo vào tuần tới.",
  "Đoàn trường tổ chức chiến dịch tình nguyện Mùa Hè Xanh nhằm hỗ trợ bà con vùng sâu vùng xa.",
  "Quy định mới về nghiên cứu khoa học sinh viên khuyến khích các đề tài ứng dụng trí tuệ nhân tạo.",
  "Hội đồng tuyển sinh thông báo điểm sàn xét tuyển các ngành khối kỹ thuật và công nghệ thông tin.",
  "Thư viện trung tâm mở cửa phục vụ 24/7 trong suốt tuần thi kết thúc học phần để hỗ trợ ôn tập.",
  "Chương trình giao lưu hướng nghiệp thu hút hơn 50 doanh nghiệp công nghệ hàng đầu tham gia tuyển dụng.",
  "Kế hoạch thực tập tốt nghiệp yêu cầu sinh viên hoàn thành tối thiểu 300 giờ làm việc thực tế tại doanh nghiệp."
];

for (let i = 0; i < 200; i++) {
  const baseText = controlTexts[i % controlTexts.length];
  addSample(
    "NON_PII",
    `${baseText} (Thông tư số ${i + 1}/2026/TT-BGDĐT hướng dẫn chi tiết).`,
    false,
    null
  );
}

const outputPath = path.resolve("docs/evaluation/pii_benchmark_dataset.json");
fs.writeFileSync(outputPath, JSON.stringify({
  version: "1.0.0-gold",
  totalSamples: samples.length,
  categoriesCount: 9,
  createdAt: new Date().toISOString(),
  description: "Gold dataset for PII detection, redaction, post-redaction verification, and privacy benchmark",
  samples
}, null, 2));

console.log(`✅ Generated ${samples.length} PII evaluation samples to ${outputPath}`);
