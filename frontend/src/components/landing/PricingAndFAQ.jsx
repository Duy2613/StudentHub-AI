"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Check, 
  Sparkles, 
  HelpCircle, 
  ChevronDown, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Users
} from "lucide-react";

export default function PricingAndFAQ() {
  const [openFaq, setOpenFaq] = useState(null);

  const PLANS = [
    {
      name: "Sinh Viên Miễn Phí",
      price: "0đ",
      period: "trọn đời",
      desc: "Trải nghiệm đầy đủ các công cụ học tập cơ bản hàng ngày.",
      highlight: false,
      badge: "Gói Khởi Động",
      features: [
        "50 truy vấn AI Copilot mỗi ngày",
        "Tóm tắt giáo trình & tài liệu PDF < 50 trang",
        "Truy cập thư viện tài liệu cộng đồng",
        "Tạo tối đa 5 bộ Flashcards thông minh",
        "Hỗ trợ cộng đồng 24/7",
      ],
      ctaText: "Bắt Đầu Miễn Phí",
      ctaHref: "/register",
      buttonClass: "bg-white/10 hover:bg-white/15 text-white border border-white/10",
    },
    {
      name: "Pro Scholar",
      price: "69.000đ",
      period: "mỗi tháng (chỉ bằng 2 ly trà sữa)",
      desc: "Lựa chọn tối ưu để bứt phá điểm số và làm chủ kỳ thi.",
      highlight: true,
      badge: "⭐ Được Chọn Nhiều Nhất",
      features: [
        "Truy vấn AI không giới hạn (Mô hình suy luận cao cấp)",
        "Tóm tắt tài liệu & sách giáo trình không giới hạn dung lượng",
        "5 lượt kết nối phản biện 1:1 với Cố vấn / Tháng",
        "Trợ lý Review CV & Đối chiếu kỹ năng chuẩn JD",
        "Tạo Flashcards & Mindmap tự động không giới hạn",
        "Ưu tiên tốc độ xử lý hàng đầu (Ultra-fast latency)",
      ],
      ctaText: "Nâng Cấp Pro Scholar",
      ctaHref: "/register",
      buttonClass: "bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-600 text-white shadow-neon-primary hover:brightness-110",
    },
    {
      name: "Campus & Lab Nhóm",
      price: "189.000đ",
      period: "mỗi tháng cho nhóm 5 sinh viên",
      desc: "Dành cho nhóm làm đồ án tốt nghiệp hoặc CLB nghiên cứu.",
      highlight: false,
      badge: "Dành Cho Nhóm Đồ Án",
      features: [
        "Toàn bộ quyền lợi Pro Scholar cho 5 thành viên",
        "Không gian làm việc & chia sẻ tài liệu chung",
        "15 lượt cố vấn đồ án tốt nghiệp cùng Giảng viên cao cấp",
        "Xuất báo cáo tiến độ học tập và phân công nhiệm vụ",
        "Kênh hỗ trợ riêng với đội ngũ phát triển",
      ],
      ctaText: "Đăng Ký Gói Nhóm",
      ctaHref: "/register",
      buttonClass: "bg-white/10 hover:bg-white/15 text-white border border-white/10",
    },
  ];

  const FAQS = [
    {
      q: "StudentHub AI có gì khác biệt so với ChatGPT hay các chatbot AI thông thường?",
      a: "StudentHub AI được đào tạo chuyên sâu về phương pháp học Socratic, trích dẫn chính xác giáo trình đại học tại Việt Nam, giải toán chuẩn LaTeX và đặc biệt tích hợp mạng lưới Chuyên gia/Giảng viên uy tín có điểm Trust Score để phản biện các bài toán chuyên sâu.",
    },
    {
      q: "Tài liệu học tập và câu hỏi của tôi có được bảo mật không?",
      a: "Hoàn toàn bảo mật. Dữ liệu tài liệu bạn tải lên chỉ phục vụ cho ngữ cảnh học tập cá nhân của bạn và được mã hóa chuẩn đầu cuối, không bao giờ chia sẻ công khai cho bên thứ ba.",
    },
    {
      q: "Làm thế nào để kết nối và nhận phản biện từ Chuyên gia / Giảng viên?",
      a: "Ngay trên giao diện hỏi đáp, bạn có thể chọn gắn nhãn 'Yêu cầu Cố vấn phản biện'. Hệ thống sẽ tự động chuyển câu hỏi đến Chuyên gia phù hợp nhất theo chuyên môn (AI, Kinh tế, Y khoa...) để giải đáp chi tiết trong vòng vài giờ.",
    },
    {
      q: "Tôi là sinh viên chưa có thẻ quốc tế thì có nâng cấp được không?",
      a: "Bạn hoàn toàn có thể thanh toán qua mã VietQR, MoMo, ZaloPay hoặc chuyển khoản ngân hàng nội địa một cách nhanh chóng chỉ trong 10 giây.",
    },
    {
      q: "Gói miễn phí có bị giới hạn thời gian sử dụng không?",
      a: "Không. Gói Sinh Viên Miễn Phí có giá trị sử dụng trọn đời, đủ để phục vụ nhu cầu học tập và ôn bài cơ bản của bạn.",
    },
  ];

  return (
    <section id="pricing" className="py-20 md:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Pricing Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Chi Phí Minh Bạch, Phù Hợp Với{" "}
            <span className="text-gradient-primary">Túi Tiền Sinh Viên</span>
          </h2>
          <p className="mt-3 text-base text-gray-400">
            Đầu tư cho tri thức với mức giá chỉ bằng một bữa sáng, mở ra cơ hội bứt phá toàn diện.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-24 items-stretch">
          {PLANS.map((plan, idx) => (
            <div
              key={idx}
              className={`relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 ${
                plan.highlight
                  ? "bg-gradient-to-b from-indigo-950/60 via-space-950 to-space-950 border-2 border-indigo-500 shadow-neon-primary scale-100 lg:-translate-y-2"
                  : "bg-space-950/80 border border-white/10 hover:border-white/20 shadow-glass-deep"
              }`}
            >
              <div>
                {/* Badge Header */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    plan.highlight 
                      ? "bg-indigo-500 text-white" 
                      : "bg-white/10 text-gray-300 border border-white/10"
                  }`}>
                    {plan.badge}
                  </span>
                  {plan.highlight && (
                    <Sparkles className="w-5 h-5 text-amber-400" />
                  )}
                </div>

                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-xs text-gray-400 mb-6">{plan.desc}</p>

                {/* Price Display */}
                <div className="mb-6 pb-6 border-b border-white/10">
                  <span className="text-4xl font-extrabold text-white font-mono tracking-tight">
                    {plan.price}
                  </span>
                  <span className="text-xs text-gray-400 block mt-1">/ {plan.period}</span>
                </div>

                {/* Features List */}
                <div className="space-y-3 mb-8">
                  <span className="text-xs font-semibold text-gray-300 block uppercase tracking-wider">
                    Quyền lợi bao gồm:
                  </span>
                  {plan.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-2.5 text-xs text-gray-200">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA Action */}
              <Link
                href={plan.ctaHref}
                className={`w-full py-3 rounded-xl text-center text-sm font-bold transition-all ${plan.buttonClass}`}
              >
                {plan.ctaText}
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ Accordion Section */}
        <div id="faq" className="max-w-3xl mx-auto pt-8 border-t border-white/10">
          <div className="text-center mb-12">
            <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Câu Hỏi Thường Gặp (FAQ)
            </h3>
            <p className="text-xs text-gray-400 mt-2">
              Giải đáp nhanh các thắc mắc về nền tảng và dịch vụ cố vấn.
            </p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-space-950/80 border border-white/10 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 text-sm font-bold text-gray-100 hover:text-indigo-300 transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>{faq.q}</span>
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${
                      openFaq === idx ? "rotate-180 text-indigo-400" : ""
                    }`}
                  />
                </button>

                {openFaq === idx && (
                  <div className="px-5 pb-5 pt-1 text-xs text-gray-300 leading-relaxed border-t border-white/5 animate-fadeIn">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
