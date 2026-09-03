/**
 * Layer 2 — ManipulationAnalyzer (v2.0)
 *
 * Detects psychological and social-engineering manipulation tactics.
 * Now covers the full 26-tactic taxonomy from ScamTaxonomy.
 *
 * CRITICAL DESIGN RULES:
 *   1. Emotion ≠ Scam. FEAR alone does not equal fraud.
 *   2. Each tactic returns confidence + evidence_span + explanation.
 *   3. Tactics are additive evidence — the Risk Engine weighs combinations.
 *   4. Hard negatives: scam-awareness content MUST NOT be flagged.
 *   5. LOSS_AVERSION framing ("bạn sắp mất") is often more powerful than
 *      positive framing ("bạn có thể nhận") — both must be detected.
 *
 * Output:
 *   {
 *     manipulationScore: number [0–1],
 *     detectedTactics: Array<{tactic, severity, confidence, evidence, description}>,
 *     emotionProfile: { primary, secondary, hasEmotionalHijacking },
 *     isManipulative: boolean,
 *     hardNegativeSignal: boolean  // true = likely educational/warning content
 *   }
 */

import { PSYCH_TACTICS, HARD_NEGATIVE_CONTEXTS } from "../../models/ScamTaxonomy.js";

// ─── Pattern Catalogs ──────────────────────────────────────────────────────────

const PATTERNS = {

  // ── 1. FEAR ─────────────────────────────────────────────────────────────────
  FEAR: {
    tactic: PSYCH_TACTICS.FEAR,
    severity: "high",
    weight: 0.35,
    patterns: [
      /bị\s+khóa|khóa\s+tài\s+khoản|tạm\s+dừng\s+dịch\s+vụ/gi,
      /khởi\s+tố|truy\s+tố|bị\s+bắt|bị\s+giam|bị\s+xử\s+phạt/gi,
      /phạt\s+tiền|mất\s+quyền\s+lợi|bị\s+vô\s+hiệu\s+hóa/gi,
      /account\s+suspended|immediate\s+legal\s+action|will\s+be\s+arrested/gi,
      /lộ\s+thông\s+tin|mất\s+việc|mất\s+học\s+bổng|bị\s+kiện/gi,
      /khóa\s+sim|phong\s+tỏa\s+tài\s+khoản|bị\s+truy\s+tìm/gi,
    ],
    description: "Đe dọa hậu quả pháp lý, tài khoản bị khóa hoặc mất quyền lợi để gây hoang mang.",
  },

  // ── 2. URGENCY ──────────────────────────────────────────────────────────────
  URGENCY: {
    tactic: PSYCH_TACTICS.URGENCY,
    severity: "high",
    weight: 0.30,
    patterns: [
      /trong\s+\d+\s*(phút|giờ|giây)|trong\s+vòng\s+\d+/gi,
      /hết\s+hạn\s+ngay|khẩn\s+cấp|ngay\s+lập\s+tức|act\s+now|urgent/gi,
      /chỉ\s+còn\s+\d+\s*(ngày|giờ|phút)|sắp\s+hết\s+hạn/gi,
      /immediately|right\s+now|within\s+\d+\s*(minutes?|hours?)/gi,
      /không\s+được\s+chậm\s+trễ|làm\s+ngay|xử\s+lý\s+ngay/gi,
      /deadline|hạn\s+cuối|hết\s+hiệu\s+lực/gi,
    ],
    description: "Tạo áp lực thời gian gấp rút để nạn nhân không kịp kiểm chứng nguồn tin.",
  },

  // ── 3. AUTHORITY ────────────────────────────────────────────────────────────
  AUTHORITY: {
    tactic: PSYCH_TACTICS.AUTHORITY,
    severity: "high",
    weight: 0.30,
    patterns: [
      /chỉ\s+đạo\s+khẩn|văn\s+bản\s+số|ban\s+giám\s+đốc/gi,
      /phòng\s+an\s+ninh|bộ\s+công\s+an\s+cảnh\s+báo|cơ\s+quan\s+điều\s+tra/gi,
      /official\s+directive|government\s+authority|law\s+enforcement/gi,
      /theo\s+lệnh|theo\s+chỉ\s+đạo|phán\s+quyết|lệnh\s+tòa/gi,
      /đơn\s+vị\s+điều\s+tra|phòng\s+nghiệp\s+vụ|ban\s+bảo\s+mật/gi,
      /cán\s+bộ\s+ngân\s+hàng|nhân\s+viên\s+phòng|gọi\s+từ\s+ngân\s+hàng/gi,
    ],
    description: "Mượn danh nghĩa cơ quan quyền lực để áp đặt sự phục tùng.",
  },

  // ── 4. ISOLATION ────────────────────────────────────────────────────────────
  ISOLATION: {
    tactic: PSYCH_TACTICS.ISOLATION,
    severity: "critical",
    weight: 0.40,
    patterns: [
      /không\s+được\s+(kể|nói|tiết\s+lộ)\s+với/gi,
      /đừng\s+(gọi|liên\s+hệ)\s+(ngân\s+hàng|cảnh\s+sát|gia\s+đình)/gi,
      /không\s+được\s+ngắt\s+máy|đừng\s+tắt\s+máy|ở\s+trên\s+đường\s+dây/gi,
      /giữ\s+bí\s+mật|keep\s+this\s+confidential|do\s+not\s+tell\s+anyone/gi,
      /không\s+hỏi\s+người\s+khác|tự\s+mình\s+xử\s+lý|đừng\s+hỏi\s+ai/gi,
      /không\s+được\s+tự\s+ý\s+thao\s+tác|làm\s+theo\s+hướng\s+dẫn\s+của\s+tôi/gi,
    ],
    description: "Cô lập nạn nhân khỏi người thân và nguồn kiểm chứng độc lập — dấu hiệu cực kỳ nguy hiểm.",
  },

  // ── 5. GREED ────────────────────────────────────────────────────────────────
  GREED: {
    tactic: PSYCH_TACTICS.GREED,
    severity: "medium",
    weight: 0.25,
    patterns: [
      /nhận\s+ngay\s+\d+|tặng\s+\d+\s*(triệu|nghìn|k)/gi,
      /hoa\s+hồng\s+(khủng|cao|lớn)|lợi\s+nhuận\s+\d+%/gi,
      /miễn\s+phí\s+100%|hoàn\s+toàn\s+miễn\s+phí|không\s+mất\s+tiền/gi,
      /trúng\s+thưởng|đã\s+trúng|phần\s+thưởng\s+(lớn|đặc\s+biệt)/gi,
      /đầu\s+tư\s+sinh\s+lời|lợi\s+nhuận\s+cam\s+kết|guaranteed\s+profit/gi,
      /airdrop|crypto\s+bonus|free\s+tokens?|claim\s+your\s+reward/gi,
    ],
    description: "Kích thích tâm lý ham lợi ích tài chính bất thường.",
  },

  // ── 6. LOSS AVERSION ────────────────────────────────────────────────────────
  LOSS_AVERSION: {
    tactic: PSYCH_TACTICS.LOSS_AVERSION,
    severity: "high",
    weight: 0.35,
    patterns: [
      /bạn\s+sắp\s+mất|sẽ\s+mất\s+(toàn\s+bộ|hết|vĩnh\s+viễn)/gi,
      /tài\s+sản\s+sẽ\s+bị\s+(tịch\s+thu|phong\s+tỏa|thu\s+hồi)/gi,
      /you\s+will\s+lose|your\s+account\s+will\s+be\s+(closed|terminated)/gi,
      /mất\s+quyền\s+truy\s+cập\s+vĩnh\s+viễn|không\s+thể\s+lấy\s+lại/gi,
      /nếu\s+không\s+(xác\s+nhận|thanh\s+toán|thực\s+hiện)/gi,
    ],
    description: "Khai thác tâm lý sợ mất mát — mạnh hơn động lực lợi ích thuần túy.",
  },

  // ── 7. FOMO ─────────────────────────────────────────────────────────────────
  FOMO: {
    tactic: PSYCH_TACTICS.FOMO,
    severity: "medium",
    weight: 0.20,
    patterns: [
      /chỉ\s+còn\s+\d+\s+suất|suất\s+cuối\s+cùng|đợt\s+cuối/gi,
      /chỉ\s+áp\s+dụng\s+hôm\s+nay|5\s+phút\s+cuối|thời\s+gian\s+có\s+hạn/gi,
      /không\s+đăng\s+ký\s+hôm\s+nay\s+sẽ\s+mất\s+quyền/gi,
      /limited\s+time\s+offer|only\s+\d+\s+spots?\s+left|last\s+chance/gi,
      /cơ\s+hội\s+(cuối|duy\s+nhất|vàng)|đừng\s+bỏ\s+lỡ/gi,
    ],
    description: "Tạo cảm giác cơ hội sắp biến mất để thúc đẩy quyết định thiếu suy nghĩ.",
  },

  // ── 8. SOCIAL PROOF ─────────────────────────────────────────────────────────
  SOCIAL_PROOF: {
    tactic: PSYCH_TACTICS.SOCIAL_PROOF,
    severity: "low",
    weight: 0.15,
    patterns: [
      /hàng\s+(nghìn|trăm|ngàn)\s+người\s+đã/gi,
      /đã\s+có\s+rất\s+nhiều\s+người\s+(nhận|tham\s+gia|thành\s+công)/gi,
      /khách\s+hàng\s+trước\s+đều\s+thành\s+công/gi,
      /\d{3,}\s+thành\s+viên\s+đã|(thousands?|hundreds?)\s+of\s+members/gi,
    ],
    description: "Tạo bằng chứng xã hội giả để tạo áp lực tuân theo.",
  },

  // ── 9. RECIPROCITY ───────────────────────────────────────────────────────────
  RECIPROCITY: {
    tactic: PSYCH_TACTICS.RECIPROCITY,
    severity: "medium",
    weight: 0.20,
    patterns: [
      /chỉ\s+cần\s+đặt\s+cọc|chỉ\s+thanh\s+toán\s+phí\s+xác\s+minh/gi,
      /miễn\s+phí\s+dùng\s+thử|tặng\s+trước|nhận\s+trước\s+trả\s+sau/gi,
      /không\s+cần\s+đầu\s+tư\s+ban\s+đầu|phí\s+nhỏ\s+để\s+nhận\s+lớn/gi,
      /free\s+trial\s+then|no\s+upfront\s+cost|just\s+pay\s+(shipping|handling)/gi,
    ],
    description: "Tặng lợi ích nhỏ để tạo nghĩa vụ trả lại lớn hơn.",
  },

  // ── 10. ADVANCE FEE / DEPOSIT TRAP ──────────────────────────────────────────
  ADVANCE_FEE: {
    tactic: "ADVANCE_FEE_TRAP", // custom — maps to RECIPROCITY + GREED combo
    severity: "critical",
    weight: 0.45,
    patterns: [
      /đóng\s+cọc\s+giữ\s+chỗ|cọc\s+giữ\s+chỗ|phí\s+giữ\s+chỗ/gi,
      /tiền\s+cọc|nộp\s+cọc|chuyển\s+cọc|đóng\s+phí\s+tham\s+gia/gi,
      /phí\s+(xác\s+minh|kích\s+hoạt|đăng\s+ký|mở\s+khóa|hải\s+quan|thuế)/gi,
      /advance\s+fee|processing\s+fee|verification\s+fee|activation\s+fee/gi,
      /nộp\s+phí\s+(trước|tạm\s+ứng)|đặt\s+cọc\s+\d+/gi,
    ],
    description: "Yêu cầu đóng tiền cọc / phí nhỏ trước khi nhận lợi ích lớn (advance fee pattern).",
  },

  // ── 11. PRESTIGE / HALO EFFECT ──────────────────────────────────────────────
  PRESTIGE_HALO: {
    tactic: "PRESTIGE_HALO_EFFECT",
    severity: "high",
    weight: 0.35,
    patterns: [
      /anh\s+là\s+sinh\s+viên\s+(năm\s+cuối|xuất\s+sắc|thủ\s+khoa)/gi,
      /nhóm\s+(rất\s+chuyên\s+nghiệp|quốc\s+tế|đỉnh\s+cao)/gi,
      /đoạt\s+giải\s+quốc\s+tế|trợ\s+lý\s+giáo\s+sư|dự\s+án\s+robocon/gi,
      /trưởng\s+nhóm\s+nghiên\s+cứu|phó\s+giáo\s+sư|tiến\s+sĩ\s+[A-Z]/gi,
    ],
    description: "Lợi dụng danh tiếng học thuật hoặc uy tín chuyên môn để tạo vỏ bọc tin cậy giả.",
  },

  // ── 12. SYMPATHY / EMOTIONAL HIJACKING ──────────────────────────────────────
  SYMPATHY: {
    tactic: PSYCH_TACTICS.SYMPATHY,
    severity: "medium",
    weight: 0.25,
    patterns: [
      /tôi\s+đang\s+bệnh\s+nặng|tai\s+nạn\s+(nghiêm\s+trọng|xe)/gi,
      /con\s+tôi\s+đang\s+ở\s+bệnh\s+viện|bố\s+\/\s+mẹ\s+tôi\s+cần/gi,
      /tôi\s+mất\s+việc|gia\s+đình\s+tôi\s+khó\s+khăn|rất\s+cần\s+giúp\s+đỡ/gi,
      /i'm\s+in\s+the\s+hospital|emergency\s+surgery\s+needed|please\s+help\s+me/gi,
      /quyên\s+góp|từ\s+thiện\s+cho\s+(trẻ\s+em|người\s+nghèo|bệnh\s+nhân)/gi,
    ],
    description: "Khai thác lòng trắc ẩn để tạo áp lực cho hành động tài chính.",
  },

  // ── 13. LOVE BOMBING ────────────────────────────────────────────────────────
  LOVE: {
    tactic: PSYCH_TACTICS.LOVE,
    severity: "medium",
    weight: 0.20,
    patterns: [
      /anh\/em\s+yêu\s+em\/anh|mình\s+thuộc\s+về\s+nhau/gi,
      /em\s+là\s+người\s+duy\s+nhất|anh\s+chưa\s+gặp\s+ai\s+như\s+em/gi,
      /i\s+love\s+you\s+so\s+much|you're\s+the\s+only\s+one/gi,
      /sau\s+khi\s+gặp\s+nhau\s+anh\s+sẽ|khi\s+anh\s+về\s+nước/gi,
    ],
    description: "Love bombing — tạo sự gắn kết tình cảm nhanh chóng để khai thác.",
  },

  // ── 14. COGNITIVE OVERLOAD ──────────────────────────────────────────────────
  COGNITIVE_OVERLOAD: {
    tactic: PSYCH_TACTICS.COGNITIVE_OVERLOAD,
    severity: "medium",
    weight: 0.20,
    patterns: [
      /bước\s+1.*bước\s+2.*bước\s+3.*bước\s+4/gi,
      /nhấn\s+vào\s+.*\s+sau\s+đó\s+.*\s+tiếp\s+theo\s+.*\s+rồi/gi,
      /theo\s+quy\s+định\s+số.*khoản\s+.*\s+điều\s+.*\s+mục/gi,
    ],
    description: "Chuỗi hướng dẫn phức tạp gây quá tải nhận thức, giảm khả năng kiểm chứng.",
  },

  // ── 15. SCARCITY ────────────────────────────────────────────────────────────
  SCARCITY: {
    tactic: PSYCH_TACTICS.SCARCITY,
    severity: "medium",
    weight: 0.20,
    patterns: [
      /chỉ\s+còn\s+\d+\s+(sản\s+phẩm|suất|vé|chỗ)/gi,
      /hết\s+hàng\s+nhanh|số\s+lượng\s+có\s+hạn|limited\s+stock/gi,
      /only\s+\d+\s+(items?|spots?|tickets?)\s+(left|remaining)/gi,
    ],
    description: "Tạo cảm giác khan hiếm giả tạo để thúc đẩy quyết định nhanh.",
  },

  // ── 16. FLATTERY ────────────────────────────────────────────────────────────
  FLATTERY: {
    tactic: PSYCH_TACTICS.FLATTERY,
    severity: "low",
    weight: 0.10,
    patterns: [
      /anh\/chị\s+rất\s+(thông\s+minh|sáng\s+suốt|xuất\s+sắc|đặc\s+biệt)/gi,
      /chúng\s+tôi\s+chọn\s+anh\/chị\s+vì|bạn\s+được\s+chọn\s+vì/gi,
      /you\s+(are|were)\s+specially\s+selected|you\s+have\s+been\s+chosen/gi,
    ],
    description: "Tâng bốc để tạo cảm giác đặc biệt và giảm cảnh giác.",
  },

  // ── 17. EXCLUSIVITY ─────────────────────────────────────────────────────────
  EXCLUSIVITY: {
    tactic: PSYCH_TACTICS.EXCLUSIVITY,
    severity: "low",
    weight: 0.15,
    patterns: [
      /chỉ\s+dành\s+(riêng|cho)\s+(bạn|anh\/chị|VIP)/gi,
      /ưu\s+đãi\s+độc\s+quyền|exclusive\s+offer|members?\s+only/gi,
      /không\s+phổ\s+biến\s+rộng\s+rãi|nội\s+bộ\s+thôi/gi,
    ],
    description: "Tạo cảm giác đặc quyền để giảm tư duy phân tích.",
  },

  // ── 18. GUILT ────────────────────────────────────────────────────────────────
  GUILT: {
    tactic: PSYCH_TACTICS.GUILT,
    severity: "medium",
    weight: 0.20,
    patterns: [
      /bạn\s+có\s+trách\s+nhiệm|đây\s+là\s+lỗi\s+của\s+bạn/gi,
      /vì\s+bạn\s+không\s+.*\s+nên|bạn\s+đã\s+gây\s+ra/gi,
      /you\s+caused\s+this|this\s+is\s+your\s+fault|you\s+owe/gi,
    ],
    description: "Gây cảm giác có lỗi để tạo nghĩa vụ hành động.",
  },

  // ── 19. SHAME ────────────────────────────────────────────────────────────────
  SHAME: {
    tactic: PSYCH_TACTICS.SHAME,
    severity: "critical",
    weight: 0.40,
    patterns: [
      /ảnh\s+(riêng\s+tư|nhạy\s+cảm|của\s+bạn)\s+sẽ\s+bị/gi,
      /sẽ\s+gửi\s+(ảnh|video)\s+cho\s+(gia\s+đình|bạn\s+bè|đồng\s+nghiệp)/gi,
      /i\s+have\s+(your\s+)?(photos?|videos?|images?)\s+of\s+you/gi,
      /nếu\s+không\s+trả\s+tiền\s+sẽ\s+đăng\s+lên|intimate\s+content/gi,
    ],
    description: "Sextortion — tống tiền bằng đe dọa phát tán nội dung riêng tư.",
  },

  // ── 20. CONFUSION ────────────────────────────────────────────────────────────
  CONFUSION: {
    tactic: PSYCH_TACTICS.CONFUSION,
    severity: "low",
    weight: 0.15,
    patterns: [
      /theo\s+quy\s+định\s+mới\s+nhất.*quyết\s+định\s+số/gi,
      /hệ\s+thống\s+nâng\s+cấp.*vui\s+lòng\s+xác\s+nhận\s+lại/gi,
    ],
    description: "Tạo rối loạn thông tin để giảm khả năng phân tích của nạn nhân.",
  },

  // ── 21. COMMITMENT PRESSURE ──────────────────────────────────────────────────
  COMMITMENT: {
    tactic: PSYCH_TACTICS.COMMITMENT,
    severity: "medium",
    weight: 0.20,
    patterns: [
      /bạn\s+đã\s+(đồng\s+ý|xác\s+nhận|ký\s+hợp\s+đồng)/gi,
      /theo\s+thỏa\s+thuận\s+trước\s+đó|như\s+bạn\s+đã\s+hứa/gi,
      /you\s+already\s+agreed|as\s+per\s+our\s+(agreement|conversation)/gi,
    ],
    description: "Khai thác tính nhất quán — ép nạn nhân tiếp tục vì đã 'cam kết' trước đó.",
  },

  // ── 22. STATUS / PRIDE ──────────────────────────────────────────────────────
  STATUS: {
    tactic: PSYCH_TACTICS.STATUS,
    severity: "low",
    weight: 0.10,
    patterns: [
      /khách\s+hàng\s+VIP|tài\s+khoản\s+hạng\s+(platinum|gold|diamond)/gi,
      /thành\s+viên\s+ưu\s+tú|nâng\s+cấp\s+miễn\s+phí\s+lên\s+VIP/gi,
    ],
    description: "Khai thác địa vị xã hội để tạo cảm giác đặc quyền.",
  },

  // ── 23. PANIC INDUCTION ─────────────────────────────────────────────────────
  PANIC: {
    tactic: PSYCH_TACTICS.PANIC,
    severity: "high",
    weight: 0.35,
    patterns: [
      /giao\s+dịch\s+bất\s+thường\s+phát\s+hiện|suspicious\s+activity\s+detected/gi,
      /tài\s+khoản\s+của\s+bạn\s+đã\s+bị\s+(xâm\s+nhập|hack|đăng\s+nhập\s+lạ)/gi,
      /someone\s+is\s+using\s+your\s+account|unauthorized\s+access\s+detected/gi,
      /cảnh\s+báo\s+khẩn\s+cấp.*giao\s+dịch/gi,
    ],
    description: "Gây hoảng loạn tức thời về bảo mật để khai thác phản xạ hành động.",
  },

  // ── 24. SECRECY ─────────────────────────────────────────────────────────────
  SECRECY: {
    tactic: "SECRECY",
    severity: "high",
    weight: 0.35,
    patterns: [
      /đây\s+là\s+thông\s+tin\s+(mật|bí\s+mật|nội\s+bộ)/gi,
      /không\s+được\s+tiết\s+lộ\s+(với\s+ai|thông\s+tin)/gi,
      /this\s+is\s+(classified|confidential|between\s+us)/gi,
    ],
    description: "Yêu cầu bảo mật thông tin — cắt đứt khả năng kiểm chứng bên ngoài.",
  },

  // ── 25. RECOVERY PROMISE ────────────────────────────────────────────────────
  RECOVERY_PROMISE: {
    tactic: "RECOVERY_PROMISE",
    severity: "critical",
    weight: 0.45,
    patterns: [
      /chúng\s+tôi\s+có\s+thể\s+(lấy\s+lại|thu\s+hồi|khôi\s+phục)\s+tiền/gi,
      /chuyên\s+gia\s+thu\s+hồi\s+tiền|hoàn\s+tiền\s+bị\s+lừa/gi,
      /we\s+can\s+recover\s+your\s+(money|funds|assets)/gi,
      /recovery\s+(specialist|service|agent|expert)/gi,
    ],
    description: "Hứa hẹn thu hồi tiền từ nạn nhân đã bị lừa — recovery scam (lừa lần 2).",
  },

  // ── 26. HELPLESSNESS ────────────────────────────────────────────────────────
  HELPLESSNESS: {
    tactic: PSYCH_TACTICS.HELPLESSNESS,
    severity: "medium",
    weight: 0.20,
    patterns: [
      /chỉ\s+có\s+chúng\s+tôi\s+mới\s+có\s+thể\s+giúp/gi,
      /không\s+ai\s+khác\s+có\s+thể\s+giải\s+quyết\s+ngoài/gi,
      /only\s+we\s+can\s+help|there's\s+nothing\s+else\s+you\s+can\s+do/gi,
    ],
    description: "Tạo cảm giác không thể tự giải quyết để nạn nhân phụ thuộc vào kẻ lừa đảo.",
  },
};

// ─── Hard Negative Contexts (Educational / Warning content) ───────────────────
const HARD_NEGATIVE_PATTERNS = [
  /đừng\s+(cung\s+cấp|chia\s+sẻ|đọc)\s+otp\s+cho\s+bất\s+kỳ\s+ai/gi,
  /ngân\s+hàng\s+không\s+bao\s+giờ\s+yêu\s+cầu\s+(otp|mật\s+khẩu)/gi,
  /cảnh\s+báo\s+lừa\s+đảo|phòng\s+chống\s+lừa\s+đảo/gi,
  /bài\s+học\s+về\s+phishing|cách\s+nhận\s+biết\s+lừa\s+đảo/gi,
  /tôi\s+muốn\s+học\s+cách|otp\s+là\s+gì|phishing\s+là\s+gì/gi,
];

export class ManipulationAnalyzer {
  /**
   * Detects psychological manipulation tactics from text.
   *
   * @param {string} text
   * @param {object} [options]
   * @param {string} [options.ocrText] - Additional OCR text to analyze
   * @returns {object} Analysis result
   */
  static analyze(text, options = {}) {
    if (!text || typeof text !== "string") {
      return {
        manipulationScore: 0,
        detectedTactics: [],
        emotionProfile: { primary: null, secondary: null, hasEmotionalHijacking: false },
        isManipulative: false,
        hardNegativeSignal: false,
      };
    }

    const combined = `${text} ${options.ocrText || ""}`.trim();

    // ── Hard Negative Check FIRST ──────────────────────────────────────────────
    // Scam-awareness content must NOT be flagged
    const hardNegativeSignal = HARD_NEGATIVE_PATTERNS.some((p) => {
      p.lastIndex = 0;
      return p.test(combined);
    });

    if (hardNegativeSignal) {
      return {
        manipulationScore: 0,
        detectedTactics: [],
        emotionProfile: { primary: null, secondary: null, hasEmotionalHijacking: false },
        isManipulative: false,
        hardNegativeSignal: true,
        hardNegativeContext: HARD_NEGATIVE_CONTEXTS.SCAM_AWARENESS_CONTENT,
      };
    }

    // ── Tactic Detection Loop ──────────────────────────────────────────────────
    const detectedTactics = [];
    let totalScore = 0;
    const detectedEmotions = [];

    for (const [key, config] of Object.entries(PATTERNS)) {
      const matchedPatterns = [];

      for (const pattern of config.patterns) {
        pattern.lastIndex = 0;
        const match = pattern.exec(combined);
        if (match) {
          matchedPatterns.push(match[0].slice(0, 100));
        }
      }

      if (matchedPatterns.length > 0) {
        const tactic = {
          tactic: config.tactic,
          severity: config.severity,
          confidence: Math.min(0.60 + matchedPatterns.length * 0.12, 0.97),
          evidence: matchedPatterns[0],
          evidenceSpans: matchedPatterns,
          description: config.description,
          weight: config.weight,
        };
        detectedTactics.push(tactic);
        totalScore += config.weight;

        // Track emotion profile
        const emotionTactics = [
          PSYCH_TACTICS.FEAR, PSYCH_TACTICS.GREED, PSYCH_TACTICS.LOVE,
          PSYCH_TACTICS.GUILT, PSYCH_TACTICS.SHAME, PSYCH_TACTICS.SYMPATHY,
          PSYCH_TACTICS.PANIC, PSYCH_TACTICS.ANGER,
        ];
        if (emotionTactics.includes(config.tactic)) {
          detectedEmotions.push(config.tactic);
        }
      }
    }

    // ── Emotion Profile ────────────────────────────────────────────────────────
    const emotionProfile = {
      primary: detectedEmotions[0] || null,
      secondary: detectedEmotions[1] || null,
      hasEmotionalHijacking: detectedEmotions.length >= 2,
      allEmotions: detectedEmotions,
    };

    // ── Interaction Score Boost (compound effects) ─────────────────────────────
    const hasAuthority = detectedTactics.some((t) => t.tactic === PSYCH_TACTICS.AUTHORITY);
    const hasUrgency = detectedTactics.some((t) => t.tactic === PSYCH_TACTICS.URGENCY);
    const hasIsolation = detectedTactics.some((t) => t.tactic === PSYCH_TACTICS.ISOLATION);
    const hasFear = detectedTactics.some((t) => t.tactic === PSYCH_TACTICS.FEAR);
    const hasLossAversion = detectedTactics.some((t) => t.tactic === PSYCH_TACTICS.LOSS_AVERSION);

    // Classic high-danger compound: Authority + Urgency + Isolation
    if (hasAuthority && hasUrgency && hasIsolation) {
      totalScore *= 1.5;
    } else if (hasAuthority && hasUrgency) {
      totalScore *= 1.3;
    }

    // Loss aversion + fear = panic spiral
    if (hasFear && hasLossAversion) {
      totalScore *= 1.2;
    }

    return {
      manipulationScore: Number(Math.min(1.0, totalScore).toFixed(2)),
      detectedTactics,
      emotionProfile,
      isManipulative: totalScore >= 0.35,
      hardNegativeSignal: false,
      totalTacticsDetected: detectedTactics.length,
      compoundRisk: hasAuthority && hasUrgency && hasIsolation,
    };
  }
}
