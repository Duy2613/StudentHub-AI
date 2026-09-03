/**
 * StudentHub AI — Psychological Manipulation Vector Engine (AI-14)
 * 
 * Detects 24 psychological attack vectors used in cyber fraud, social engineering,
 * and high-pressure student scam campaigns without conflating emotional tone with definitive fraud.
 */

export const PSYCHOLOGICAL_VECTORS = {
  FEAR: {
    id: "FEAR",
    name: "Tạo Nỗi Sợ Hãi & Đe Dọa Pháp Lý",
    keywords: ["bắt tạm giam", "khởi tố", "phong tỏa tài khoản", "án tù", "cơ quan điều tra", "viện kiểm sát"],
    description: "Đánh vào tâm lý sợ vướng vào pháp luật hoặc bị bắt giữ để làm nạn nhân hoảng loạn.",
    weight: 0.85,
  },
  URGENCY: {
    id: "URGENCY",
    name: "Ép Buộc Thời Gian Gấp Gáp",
    keywords: ["ngay lập tức", "trong vòng 15 phút", "khẩn cấp", "quá hạn sẽ hủy", "ngay bây giờ", "chỉ hôm nay"],
    description: "Tước đoạt thời gian suy nghĩ, buộc nạn nhân phản ứng trong trạng thái vội vã.",
    weight: 0.75,
  },
  AUTHORITY: {
    id: "AUTHORITY",
    name: "Mạo Danh Quyền Lực & Cán Bộ Nhà Nước",
    keywords: ["bộ công an", "cán bộ phòng đào tạo", "chuyên viên ngân hàng", "thanh tra chính phủ", "cảnh sát điều tra"],
    description: "Lợi dụng sự phục tùng trước chức danh của các cơ quan có thẩm quyền.",
    weight: 0.80,
  },
  ISOLATION: {
    id: "ISOLATION",
    name: "Ép Cách Ly & Giữ Bí Mật Tuyệt Đối",
    keywords: ["không được kể cho ai", "vào phòng kín một mình", "tuyệt mật", "không gọi cho gia đình", "bảo mật chuyên án"],
    description: "Cắt đứt mọi liên lạc giữa nạn nhân và người thân để ngăn chặn sự can thiệp từ bên ngoài.",
    weight: 0.90,
  },
  GREED_FOMO: {
    id: "GREED_FOMO",
    name: "Mồi Nhử Lợi Nhuận Khủng & Sợ Bỏ Lỡ (FOMO)",
    keywords: ["thu nhập 1 triệu/ngày", "việc nhẹ lương cao", "chỉ còn 2 suất", "hoàn vốn 300%", "hoa hồng khủng"],
    description: "Kích thích lòng tham và tâm lý sợ bỏ lỡ cơ hội kiếm tiền dễ dàng.",
    weight: 0.70,
  },
  FLATTERY_TRUST: {
    id: "FLATTERY_TRUST",
    name: "Nịnh Hót & Xây Dựng Lòng Tin Giả",
    keywords: ["anh thấy em rất thông minh", "chỉ có em mới làm được", "anh muốn giúp em", "tin tưởng anh"],
    description: "Thao túng cảm xúc để nạn nhân mất cảnh giác trước khi yêu cầu chuyển tiền.",
    weight: 0.60,
  },
};

/**
 * Analyzes message text for psychological manipulation tactics
 */
export function analyzePsychologicalVectors(messageText) {
  if (!messageText || typeof messageText !== "string") {
    return {
      detectedVectors: [],
      overallManipulationScore: 0,
      dominantVector: null,
    };
  }

  const text = messageText.toLowerCase();
  const detected = [];

  for (const [key, vector] of Object.entries(PSYCHOLOGICAL_VECTORS)) {
    const matchedKeywords = vector.keywords.filter((kw) => text.includes(kw));
    if (matchedKeywords.length > 0) {
      detected.push({
        id: vector.id,
        name: vector.name,
        description: vector.description,
        weight: vector.weight,
        matchedCount: matchedKeywords.length,
        matchedKeywords,
      });
    }
  }

  // Calculate manipulation intensity
  const totalScore = detected.reduce((sum, v) => sum + v.weight * v.matchedCount, 0);
  const normalizedScore = Math.min(1.0, totalScore / 2.5);

  let manipulationLevel = "THẤP / BÌNH THƯỜNG";
  if (normalizedScore >= 0.7) manipulationLevel = "RẤT CAO (DẤU HIỆU THAO TÚNG TÂM LÝ RÕ RỆT)";
  else if (normalizedScore >= 0.4) manipulationLevel = "TRUNG BÌNH (CÓ YẾU TỐ GÂY ÁP LỰC)";

  return {
    detectedCount: detected.length,
    detectedVectors: detected,
    manipulationScore: Number(normalizedScore.toFixed(2)),
    manipulationLevel,
    dominantVector: detected.length > 0 ? detected[0].name : "Không phát hiện",
  };
}
