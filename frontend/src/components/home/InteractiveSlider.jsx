"use client";

// components/home/InteractiveSlider.jsx
// Thanh trượt Trạng thái Học thuật & Phát triển Nghề nghiệp Glassmorphism
// Tương tác thời gian thực: Điều chỉnh từ Sinh viên năm nhất đến Chuyên gia đóng góp

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  GraduationCap, 
  BookOpen, 
  Code2, 
  Award, 
  Star, 
  Zap, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  Cpu,
  Users
} from "lucide-react";
import Link from "next/link";

const TIERS = [
  {
    level: 1,
    title: "Sinh viên Năm Nhất (Freshman)",
    badge: "Khám Phá & Nền Tảng",
    icon: GraduationCap,
    color: "#38bdf8",
    glowColor: "rgba(56, 189, 248, 0.35)",
    reputationScore: 50,
    bonusEdu: "+30 pts",
    copilotSpeed: "Tiêu chuẩn (1.0x)",
    features: [
      "Giải bài tập Toán cao cấp, Vật lý đại cương & Triết học",
      "Tự động tóm tắt Slide bài giảng và sinh Flashcards ôn thi",
      "Cộng 30 điểm uy tín khi xác minh email trường .edu",
    ],
    highlight: "Tự tin vượt qua mọi môn đại cương với GPA 3.6+",
    recommendedPlan: "Miễn phí Trọn đời",
  },
  {
    level: 2,
    title: "Sinh viên Chuyên Ngành (Junior)",
    badge: "Đồ Án & Tối Ưu Giải Thuật",
    icon: Code2,
    color: "#818cf8",
    glowColor: "rgba(129, 140, 248, 0.35)",
    reputationScore: 65,
    bonusEdu: "+30 pts",
    copilotSpeed: "Nhanh (2.5x)",
    features: [
      "AI Socratic Code Review: C++, Java, Python, SQL, React",
      "Phân tích độ phức tạp thuật toán Big-O và tối ưu bộ nhớ",
      "Bảng vẽ Whiteboard & Notion Workspace nghiên cứu đồ án nhóm",
    ],
    highlight: "Hoàn thành đồ án môn học chuẩn kiến trúc doanh nghiệp",
    recommendedPlan: "Học Thuật Pro",
  },
  {
    level: 3,
    title: "Nghiên Cứu Sinh / Khóa Luận (Senior)",
    badge: "Khóa Luận & Bài Báo",
    icon: BookOpen,
    color: "#a855f7",
    glowColor: "rgba(168, 85, 247, 0.35)",
    reputationScore: 78,
    bonusEdu: "+30 pts",
    copilotSpeed: "Siêu tốc (4.0x)",
    features: [
      "Hỗ trợ viết luận văn: Định dạng trích dẫn IEEE/APA, LaTeX, Mermaid",
      "Phân tích bài báo khoa học từ arXiv, IEEE Xplore, PubMed",
      "Truy vấn Hybrid RAG trên tập dữ liệu PDF giáo trình cá nhân",
    ],
    highlight: "Sở hữu công trình nghiên cứu và báo cáo khoa học chất lượng cao",
    recommendedPlan: "Research Suite",
  },
  {
    level: 4,
    title: "Kỹ Sư AI & Thực Tập Sinh (Fresher)",
    badge: "Phỏng Vấn & Production",
    icon: Zap,
    color: "#34e7c4",
    glowColor: "rgba(52, 231, 196, 0.35)",
    reputationScore: 88,
    bonusEdu: "+30 pts",
    copilotSpeed: "Thời gian thực (Real-time)",
    features: [
      "Lộ trình 6 tháng thực chiến AI/ML, DevOps & Cloud Native",
      "Mock Interview 1:1 kỹ thuật thuật toán & System Design",
      "Đóng gói Microservices Docker, FastAPI & Vector Databases",
    ],
    highlight: "Chinh phục mức offer mơ ước tại các tập đoàn công nghệ",
    recommendedPlan: "Career Accelerator",
  },
  {
    level: 5,
    title: "Chuyên Gia Đóng Góp (Expert Mentor)",
    badge: "⭐ Cố Vấn Uy Tín & GitHub Leader",
    icon: Star,
    color: "#f59e0b",
    glowColor: "rgba(245, 158, 11, 0.45)",
    reputationScore: 98,
    bonusEdu: "Cấp Huy Hiệu Vàng",
    copilotSpeed: "Priority Unlimited",
    features: [
      "Tự động kéo Top 3 dự án GitHub nổi bật và cấp huy hiệu Chuyên Gia Uy Tín",
      "Nhận câu hỏi ưu tiên và thu nhập cố vấn học thuật từ cộng đồng",
      "Mở khóa công cụ giảng dạy, tạo khóa học và workshop độc quyền",
    ],
    highlight: "Định vị thương hiệu cá nhân và dẫn dắt thế hệ sinh viên kế cận",
    recommendedPlan: "Verified Expert Partner",
  },
];

export default function InteractiveSlider() {
  const [levelIndex, setLevelIndex] = useState(1); // Mặc định ở level 2 (Junior)
  const currentTier = TIERS[levelIndex];
  const IconComponent = currentTier.icon;

  return (
    <section className="py-20 bg-space-950 text-white relative overflow-hidden border-t border-white/10">
      {/* Dynamic Ambient Glow adapting to current level color */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] blur-[160px] pointer-events-none rounded-full transition-all duration-700 opacity-30"
        style={{ backgroundColor: currentTier.color }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Title */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-indigo-300 uppercase tracking-wider mb-4">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
            Lộ Trình Nâng Cấp Bản Thân Cùng AI
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Thanh Trượt Trạng Thái Học Thuật <br className="hidden sm:inline" />
            <span className="text-gradient-primary">Cá Nhân Hóa Trải Nghiệm</span>
          </h2>
          <p className="mt-3 text-sm sm:text-base text-gray-400">
            Kéo thanh trượt để xem StudentHub AI đồng hành và khai phóng tiềm năng của bạn ở từng chặng đường
          </p>
        </div>

        {/* Interactive Slider Control Bar */}
        <div className="p-6 sm:p-8 rounded-3xl bg-space-900/80 border border-white/10 backdrop-blur-2xl shadow-glass-deep mb-8">
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500"
                style={{
                  backgroundColor: `${currentTier.color}25`,
                  color: currentTier.color,
                  boxShadow: `0 0 25px ${currentTier.glowColor}`,
                }}
              >
                <IconComponent className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Cấp độ mục tiêu hiện tại ({levelIndex + 1}/5):
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white transition-colors duration-300">
                  {currentTier.title}
                </h3>
              </div>
            </div>

            <div
              className="px-4 py-1.5 rounded-full border text-xs font-extrabold backdrop-blur-md transition-all duration-500 flex items-center gap-1.5 shadow-md"
              style={{
                backgroundColor: `${currentTier.color}15`,
                borderColor: `${currentTier.color}50`,
                color: currentTier.color,
              }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{currentTier.badge}</span>
            </div>
          </div>

          {/* Range Slider Track */}
          <div className="relative py-4">
            <input
              type="range"
              min="0"
              max="4"
              step="1"
              value={levelIndex}
              onChange={(e) => setLevelIndex(Number(e.target.value))}
              className="w-full h-3 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500 transition-all focus:outline-none"
              style={{
                background: `linear-gradient(to right, ${currentTier.color} ${(levelIndex / 4) * 100}%, rgba(255,255,255,0.1) ${(levelIndex / 4) * 100}%)`,
              }}
            />

            {/* Stepper Markers */}
            <div className="flex justify-between items-center mt-3 px-1">
              {TIERS.map((tier, idx) => (
                <button
                  key={tier.level}
                  onClick={() => setLevelIndex(idx)}
                  className={`flex flex-col items-center gap-1 transition-all ${
                    levelIndex === idx
                      ? "text-white font-bold scale-110"
                      : "text-gray-500 hover:text-gray-300 font-medium"
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full border transition-all ${
                      levelIndex === idx
                        ? "bg-white border-indigo-400 ring-4 ring-indigo-500/40"
                        : "bg-white/20 border-transparent"
                    }`}
                  />
                  <span className="text-[10px] sm:text-xs hidden sm:inline">
                    Năm {tier.level === 5 ? "⭐ Expert" : tier.level}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Telemetry Matrix */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTier.level}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {/* Box 1: Reputation & Power Metrics */}
            <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl shadow-glass-deep space-y-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-indigo-400" /> Chỉ Số Năng Lực Học Thuật
              </p>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">Điểm Uy Tín Hệ Thống:</span>
                  <span className="text-lg font-black text-white flex items-center gap-1">
                    <span style={{ color: currentTier.color }}>{currentTier.reputationScore}</span> pts
                  </span>
                </div>
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(currentTier.reputationScore / 100) * 100}%`,
                      backgroundColor: currentTier.color,
                    }}
                  />
                </div>
                <div className="flex justify-between items-center text-[11px] text-gray-400">
                  <span>Edu Bonus: {currentTier.bonusEdu}</span>
                  <span>Tốc độ: {currentTier.copilotSpeed}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200">
                💡 <strong>Mục tiêu:</strong> {currentTier.highlight}
              </div>
            </div>

            {/* Box 2: Unlocked Features */}
            <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl shadow-glass-deep space-y-3 md:col-span-2 flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                  <Sparkles className="w-4 h-4 text-teal-400" /> Tính Năng Mở Khóa Cho Cấp Độ Này
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentTier.features.map((feat, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-2xl bg-black/30 border border-white/5 flex items-start gap-2.5"
                    >
                      <CheckCircle2
                        className="w-4 h-4 mt-0.5 flex-shrink-0"
                        style={{ color: currentTier.color }}
                      />
                      <span className="text-xs text-gray-200 leading-relaxed">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-gray-400">
                  Gói dịch vụ đề xuất: <strong className="text-white">{currentTier.recommendedPlan}</strong>
                </div>

                <Link
                  href="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-indigo-500 to-purple-600 hover:brightness-110 text-white shadow-lg transition-all"
                >
                  <span>Bắt Đầu Hành Trình Của Bạn</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

          </motion.div>
        </AnimatePresence>

      </div>
    </section>
  );
}
