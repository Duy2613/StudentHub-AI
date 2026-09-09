import fs from "node:fs";
import path from "node:path";

const units = [
  // 1. TTXVN syndication across 4 media outlets (Same Origin)
  {
    unitId: "IND-01",
    scenario: "Chính sách học phí đại học mới năm 2026",
    expectedIndependentOriginsCount: 1,
    sources: [
      { sourceId: "s-01-a", domain: "baotintuc.vn", publisher: "Báo Tin Tức", content: "Theo TTXVN, Bộ GD&ĐT vừa ban hành quy chế khung học phí đại học mới áp dụng từ năm 2026 nhằm bảo đảm quyền lợi người học.", contentDigest: "hash-ttxvn-hocphi-2026" },
      { sourceId: "s-01-b", domain: "vietnamplus.vn", publisher: "VietnamPlus", content: "Theo TTXVN, Bộ GD&ĐT vừa ban hành quy chế khung học phí đại học mới áp dụng từ năm 2026 nhằm bảo đảm quyền lợi người học.", contentDigest: "hash-ttxvn-hocphi-2026" },
      { sourceId: "s-01-c", domain: "dantri.com.vn", publisher: "Dân Trí", content: "Theo Thông tấn xã Việt Nam (TTXVN), Bộ GD&ĐT vừa ban hành quy chế khung học phí đại học mới áp dụng từ năm 2026.", contentDigest: "hash-ttxvn-dantri-2026" },
      { sourceId: "s-01-d", domain: "vtv.vn", publisher: "VTV", content: "Nguồn tin từ TTXVN cho biết Bộ GD&ĐT đã hoàn tất quy chế khung học phí đại học mới cho năm học 2026.", contentDigest: "hash-ttxvn-vtv-2026" }
    ],
    goldClusters: [
      { clusterId: "gold-c1", memberSourceIds: ["s-01-a", "s-01-b", "s-01-c", "s-01-d"], originType: "NEWS_WIRE_SYNDICATE" }
    ]
  },

  // 2. Official Portal vs Independent Newspaper vs Student Forum (3 Independent Origins)
  {
    unitId: "IND-02",
    scenario: "Học bổng tài năng ĐH Bách khoa TP.HCM",
    expectedIndependentOriginsCount: 3,
    sources: [
      { sourceId: "s-02-a", domain: "hcmut.edu.vn", publisher: "ĐH Bách khoa ĐHQG-HCM", content: "Phòng Đào tạo thông báo chương trình học bổng tài năng OISP 2026 dành cho sinh viên xuất sắc, miễn giảm 100% học phí.", contentDigest: "hash-hcmut-oisp-official" },
      { sourceId: "s-02-b", domain: "tuoitre.vn", publisher: "Báo Tuổi Trẻ", content: "Phóng viên Tuổi Trẻ ghi nhận nhiều sinh viên Bách khoa hào hứng nộp hồ sơ xin học bổng OISP với tiêu chuẩn khắt khe về nghiên cứu khoa học.", contentDigest: "hash-tuoitre-oisp-report" },
      { sourceId: "s-02-c", domain: "facebook.com", publisher: "Diễn đàn Sinh viên Bách khoa", content: "Mọi người ơi cho mình hỏi điểm IELTS 7.5 có đủ điều kiện nộp học bổng OISP đợt này không nhỉ?", contentDigest: "hash-fb-oisp-discussion" }
    ],
    goldClusters: [
      { clusterId: "gold-c1", memberSourceIds: ["s-02-a"], originType: "OFFICIAL_PORTAL" },
      { clusterId: "gold-c2", memberSourceIds: ["s-02-b"], originType: "INDEPENDENT_JOURNALISM" },
      { clusterId: "gold-c3", memberSourceIds: ["s-02-c"], originType: "COMMUNITY" }
    ]
  },

  // 3. Scam Phishing Notice Mirrored across 3 Fake Job Sites (1 Same Origin)
  {
    unitId: "IND-03",
    scenario: "Tuyển dụng cộng tác viên online nạp tiền xử lý đơn hàng",
    expectedIndependentOriginsCount: 1,
    sources: [
      { sourceId: "s-03-a", domain: "vieclam24h-fake.net", publisher: "Tuyển dụng 24h", content: "Tuyển CTV xử lý đơn hàng Shopee tại nhà, lương 500k-1 triệu/ngày, liên hệ Telegram @tuyendungshopee2026 nạp tiền tạm ứng.", contentDigest: "hash-scam-ctv-shopee" },
      { sourceId: "s-03-b", domain: "timviecnhanh-scam.xyz", publisher: "Tìm Việc Nhanh", content: "Tuyển CTV xử lý đơn hàng Shopee tại nhà, lương 500k-1 triệu/ngày, liên hệ Telegram @tuyendungshopee2026 nạp tiền tạm ứng.", contentDigest: "hash-scam-ctv-shopee" },
      { sourceId: "s-03-c", domain: "jobvn-tuyendung.online", publisher: "Job VN", content: "Cần gấp 10 bạn CTV online xử lý đơn hàng Shopee lương 500k/ngày, liên hệ Telegram @tuyendungshopee2026 nạp tiền tạm ứng.", contentDigest: "hash-scam-ctv-shopee-variant" }
    ],
    goldClusters: [
      { clusterId: "gold-c1", memberSourceIds: ["s-03-a", "s-03-b", "s-03-c"], originType: "SCAM_CAMPAIGN" }
    ]
  },

  // 4. Two Distinct Universities (Strictly Independent - Must NOT false merge!)
  {
    unitId: "IND-04",
    scenario: "Quy định học phí của 2 trường khác nhau",
    expectedIndependentOriginsCount: 2,
    sources: [
      { sourceId: "s-04-a", domain: "hcmute.edu.vn", publisher: "HCMUTE", content: "Trường Đại học Sư phạm Kỹ thuật TP.HCM thông báo mức học phí khóa 2026 dao động từ 19.5 đến 22 triệu đồng/học kỳ.", contentDigest: "hash-hcmute-tuition" },
      { sourceId: "s-04-b", domain: "hust.edu.vn", publisher: "HUST", content: "Đại học Bách khoa Hà Nội công bố biểu mức học phí chương trình chuẩn năm học 2026 từ 24 đến 28 triệu đồng/năm.", contentDigest: "hash-hust-tuition" }
    ],
    goldClusters: [
      { clusterId: "gold-c1", memberSourceIds: ["s-04-a"], originType: "OFFICIAL_PORTAL" },
      { clusterId: "gold-c2", memberSourceIds: ["s-04-b"], originType: "OFFICIAL_PORTAL" }
    ]
  },

  // 5. Ministry of Public Security Warning Syndicated across Press + Police Portals (1 Origin)
  {
    unitId: "IND-05",
    scenario: "Cảnh báo thủ đoạn lừa đảo gọi điện giả danh công an",
    expectedIndependentOriginsCount: 1,
    sources: [
      { sourceId: "s-05-a", domain: "bocongan.gov.vn", publisher: "Bộ Công an", content: "Cục An ninh mạng Bộ Công an cảnh báo thủ đoạn giả danh điều tra viên yêu cầu chuyển tiền vào tài khoản an toàn để xác minh.", contentDigest: "hash-bca-scam-warning" },
      { sourceId: "s-05-b", domain: "congan.com.vn", publisher: "Báo Công an TP.HCM", content: "Theo Bộ Công an, cơ quan công an không bao giờ làm việc qua điện thoại hay yêu cầu người dân chuyển tiền vào tài khoản cá nhân.", contentDigest: "hash-catp-scam-warning" },
      { sourceId: "s-05-c", domain: "vnexpress.net", publisher: "VnExpress", content: "Nguồn từ Bộ Công an: Người dân tuyệt đối không cung cấp mã OTP hoặc chuyển tiền cho người tự xưng là cán bộ công an qua điện thoại.", contentDigest: "hash-vnexpress-bca-warning" }
    ],
    goldClusters: [
      { clusterId: "gold-c1", memberSourceIds: ["s-05-a", "s-05-b", "s-05-c"], originType: "MINISTRY_WARNING_SYNDICATION" }
    ]
  }
];

// Generate programmatically remaining units 6 through 60 to ensure high coverage
const mediaPool = ["thanhnien.vn", "tuoitre.vn", "vnexpress.net", "dantri.com.vn", "vietnamnet.vn", "tienphong.vn"];
const uniPool = [
  { domain: "ueh.edu.vn", pub: "ĐH Kinh tế TP.HCM", tag: "UEH" },
  { domain: "neu.edu.vn", pub: "ĐH Kinh tế Quốc dân", tag: "NEU" },
  { domain: "ftu.edu.vn", pub: "ĐH Ngoại thương", tag: "FTU" },
  { domain: "vnu.edu.vn", pub: "ĐHQG Hà Nội", tag: "VNUHN" },
  { domain: "vnuhcm.edu.vn", pub: "ĐHQG TP.HCM", tag: "VNUHCM" }
];

for (let i = 6; i <= 60; i++) {
  const isSyndicated = i % 2 === 0;
  if (isSyndicated) {
    const wire = i % 4 === 0 ? "TTXVN" : "VGP";
    const topic = `Thông cáo báo chí số ${i} về đổi mới giáo dục đại học`;
    units.push({
      unitId: `IND-${String(i).padStart(2, "0")}`,
      scenario: topic,
      expectedIndependentOriginsCount: 1,
      sources: [
        {
          sourceId: `s-${i}-1`,
          domain: mediaPool[i % mediaPool.length],
          publisher: mediaPool[i % mediaPool.length],
          content: `Theo ${wire}, chính phủ ban hành quy định mới số ${i}/2026/NĐ-CP về chính sách hỗ trợ tín dụng học tập cho sinh viên.`,
          contentDigest: `digest-wire-${wire}-${i}`
        },
        {
          sourceId: `s-${i}-2`,
          domain: mediaPool[(i + 1) % mediaPool.length],
          publisher: mediaPool[(i + 1) % mediaPool.length],
          content: `Theo ${wire}, chính phủ ban hành quy định mới số ${i}/2026/NĐ-CP về chính sách hỗ trợ tín dụng học tập cho sinh viên.`,
          contentDigest: `digest-wire-${wire}-${i}`
        },
        {
          sourceId: `s-${i}-3`,
          domain: mediaPool[(i + 2) % mediaPool.length],
          publisher: mediaPool[(i + 2) % mediaPool.length],
          content: `Nguồn tin từ ${wire} cho biết nghị định số ${i}/2026/NĐ-CP vừa được phê duyệt về tín dụng học sinh sinh viên.`,
          contentDigest: `digest-wire-${wire}-${i}-var`
        }
      ],
      goldClusters: [
        { clusterId: "gold-c1", memberSourceIds: [`s-${i}-1`, `s-${i}-2`, `s-${i}-3`], originType: "GOVERNMENT_WIRE_SYNDICATE" }
      ]
    });
  } else {
    // 2 Independent Universities or Portals
    const u1 = uniPool[i % uniPool.length];
    const u2 = uniPool[(i + 1) % uniPool.length];
    units.push({
      unitId: `IND-${String(i).padStart(2, "0")}`,
      scenario: `Thông báo tuyển sinh sau đại học giữa ${u1.tag} và ${u2.tag}`,
      expectedIndependentOriginsCount: 2,
      sources: [
        {
          sourceId: `s-${i}-1`,
          domain: u1.domain,
          publisher: u1.pub,
          content: `${u1.pub} công bố đề án tuyển sinh thạc sĩ và tiến sĩ năm học 2026 với 15 chuyên ngành đào tạo trọng điểm.`,
          contentDigest: `digest-uni-${u1.tag}-${i}`
        },
        {
          sourceId: `s-${i}-2`,
          domain: u2.domain,
          publisher: u2.pub,
          content: `${u2.pub} thông báo điều kiện ứng tuyển cao học chuyên ngành Quản trị và Kinh tế số đợt 2 năm 2026.`,
          contentDigest: `digest-uni-${u2.tag}-${i}`
        }
      ],
      goldClusters: [
        { clusterId: "gold-c1", memberSourceIds: [`s-${i}-1`], originType: "OFFICIAL_PORTAL" },
        { clusterId: "gold-c2", memberSourceIds: [`s-${i}-2`], originType: "OFFICIAL_PORTAL" }
      ]
    });
  }
}

const outputPath = path.resolve("docs/evaluation/source_independence_dataset.json");
fs.writeFileSync(outputPath, JSON.stringify({
  version: "1.0.0-gold",
  totalUnits: units.length,
  createdAt: new Date().toISOString(),
  description: "Gold dataset for source independence, same-origin detection, and syndication collapse benchmark",
  units
}, null, 2));

console.log(`✅ Generated ${units.length} Source Independence benchmark units to ${outputPath}`);
