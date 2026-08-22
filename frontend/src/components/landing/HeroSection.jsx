"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Sparkles, 
  ArrowRight, 
  Bot, 
  Terminal, 
  CheckCircle2, 
  Code2, 
  BookOpen, 
  GraduationCap, 
  Flame, 
  Copy, 
  Check, 
  ChevronRight,
  UserCheck,
  Zap,
  Play
} from "lucide-react";

export default function HeroSection() {
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);

  const DEMO_PROMPTS = [
    {
      id: 0,
      title: "Giải thuật Dijkstra",
      icon: Code2,
      badge: "Khoa Học Máy Tính",
      prompt: "Giải thích trực quan thuật toán Dijkstra tìm đường đi ngắn nhất và sinh mã Python tối ưu bằng heap.",
      reasoning: [
        "Khởi tạo mảng khoảng cách dist[] = vô cùng, dist[start] = 0",
        "Sử dụng Priority Queue (min-heap) để lấy đỉnh có chi phí nhỏ nhất",
        "Duyệt các cạnh kề và thực hiện relaxation: nếu dist[u] + w < dist[v] thì cập nhật dist[v]",
      ],
      output: `import heapq

def dijkstra(graph, start):
    distances = {node: float('inf') for node in graph}
    distances[start] = 0
    pq = [(0, start)]
    
    while pq:
        curr_dist, curr_node = heapq.heappop(pq)
        if curr_dist > distances[curr_node]:
            continue
            
        for neighbor, weight in graph[curr_node].items():
            dist = curr_dist + weight
            if dist < distances[neighbor]:
                distances[neighbor] = dist
                heapq.heappush(pq, (dist, neighbor))
                
    return distances # Độ phức tạp: O((V + E) log V)`,
      expertNote: "💡 Gợi ý từ Cố vấn TS. Nguyễn Minh Đức: Hãy lưu ý trường hợp trọng số âm (dùng Bellman-Ford) và ứng dụng thực tế trong định tuyến mạng OSPF.",
    },
    {
      id: 1,
      title: "Đề cương Triết học",
      icon: BookOpen,
      badge: "Lý Luận Chính Trị",
      prompt: "Tóm tắt 3 quy luật cơ bản của phép biện chứng duy vật và liên hệ thực tiễn phát triển công nghệ AI.",
      reasoning: [
        "Quy luật thống nhất và đấu tranh của các mặt đối lập (nguồn gốc, động lực)",
        "Quy luật chuyển hóa từ những thay đổi về lượng dẫn đến thay đổi về chất (cách thức)",
        "Quy luật phủ định của phủ định (khuynh hướng phát triển dạng xoáy ốc)",
      ],
      output: `📌 3 QUY LUẬT CỐT LÕI & LIÊN HỆ ĐỘT PHÁ CÔNG NGHỆ:

1. Lượng đổi - Chất đổi:
   • Lượng: Tích lũy dữ liệu lớn (Big Data) và năng lực tính toán GPU qua hàng thập kỷ.
   • Chất: Bước nhảy vọt sang Trí tuệ Nhân tạo Tạo sinh (Generative AI & LLM).

2. Thống nhất & Đấu tranh mặt đối lập:
   • Mâu thuẫn giữa tự động hóa hiệu suất cao và yêu cầu bảo vệ quyền riêng tư / đạo đức dữ liệu.

3. Phủ định của phủ định:
   • Từ lập trình thủ công (Rule-based) -> Học máy (Machine Learning) -> Tác tử tự trị (Autonomous Agents).`,
      expertNote: "💡 Cố vấn ThS. Trần Hoàng Nam lưu ý: Khi làm bài thi, cần dẫn chứng ví dụ thực tế ngành CNTT để đạt điểm tuyệt đối.",
    },
    {
      id: 2,
      title: "Review CV & Roadmap AI",
      icon: GraduationCap,
      badge: "Định Hướng Nghề Nghiệp",
      prompt: "Đánh giá hồ sơ thực tập sinh AI Engineer và lập lộ trình bứt phá trong 6 tháng.",
      reasoning: [
        "Phân tích kỹ năng cốt lõi: PyTorch, Vector DBs, RAG Architecture, LangChain",
        "Điểm cộng dự án thực tế: Triển khai mô hình production với FastAPI + Docker",
        "Chiến lược tạo lợi thế: Đóng góp Open Source và bài toán Domain-specific Fine-tuning",
      ],
      output: `🚀 ROADMAP 6 THÁNG CHINH PHỤC VỊ TRÍ AI/ML INTERN:

• Tháng 1-2: Làm chủ Toán tối ưu (Linear Algebra, Calculus) & PyTorch Deep Dive
• Tháng 3: Xây dựng RAG nâng cao (Hybrid Search, Re-ranking, Context Compression)
• Tháng 4: Tinh chỉnh mô hình (LoRA/QLoRA) trên Unsloth & Đánh giá benchmarks
• Tháng 5: Đóng gói Microservices (FastAPI, Docker, Triton Inference Server)
• Tháng 6: Mock Interview 1:1 với Tech Lead tại StudentHub AI`,
      expertNote: "💡 Đã có 142 sinh viên nhận offer kỳ vừa qua qua mạng lưới kết nối Cố vấn của StudentHub.",
    },
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(DEMO_PROMPTS[activeTab].output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden">
      {/* Dynamic Glow Spotlight Background */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] md:w-[900px] h-[400px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/20 to-cyan-500/10 blur-[130px] rounded-full pointer-events-none -z-10" />
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Eyebrow Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-md shadow-neon-primary hover:border-indigo-500/40 transition-colors">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-gray-200 tracking-wide">
              THẾ HỆ AI 2026: COPILOT &verified MENTOR NETWORK
            </span>
          </div>
        </div>

        {/* Main Headline & Punchy Subtext */}
        <div className="text-center max-w-4xl mx-auto mb-10">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1] mb-6">
            Bứt Phá Điểm Số & Sự Nghiệp Cùng{" "}
            <span className="text-gradient-primary">Trí Tuệ Nhân Tạo Sinh Viên</span>
          </h1>
          
          <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Hỏi đáp bài tập, tóm tắt tài liệu học thuật và nhận cố vấn 1:1 từ mạng lưới chuyên gia uy tín. Tăng tốc hiệu suất học tập lên 300%.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-base font-bold bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-600 text-white shadow-neon-primary hover:brightness-110 active:scale-95 transition-all"
            >
              <span>Bắt Đầu Miễn Phí Ngay</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            
            <a
              href="#copilot"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-base font-medium text-gray-200 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition-all backdrop-blur-md"
            >
              <Play className="w-4 h-4 text-indigo-400 fill-indigo-400" />
              <span>Xem Trải Nghiệm Thực Tế</span>
            </a>
          </div>

          <div className="mt-4 flex items-center justify-center gap-6 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Miễn phí trọn đời
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Đăng nhập tức thì với Edu / Google
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Không cần thẻ tín dụng
            </span>
          </div>
        </div>

        {/* Interactive Live AI Copilot Terminal Preview */}
        <div id="copilot" className="mt-12 max-w-5xl mx-auto">
          <div className="relative rounded-2xl p-[1px] bg-gradient-to-b from-white/20 via-indigo-500/20 to-transparent shadow-glass-deep">
            <div className="bg-space-900/90 backdrop-blur-2xl rounded-[15px] border border-white/10 overflow-hidden">
              
              {/* Terminal Window Header */}
              <div className="px-4 py-3 bg-space-950/80 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <div className="h-4 w-[1px] bg-white/10 mx-2" />
                  <div className="flex items-center gap-1.5 text-xs text-gray-300 font-mono">
                    <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                    <span>StudentHub-Copilot-v2.6 // Academic-Engine</span>
                  </div>
                </div>

                {/* Prompt Selector Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {DEMO_PROMPTS.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(idx)}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                          activeTab === idx
                            ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm"
                            : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{item.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Terminal Body Content */}
              <div className="p-4 sm:p-6 space-y-4">
                {/* User Input Prompt Simulation */}
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-indigo-300">SV</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-200">Sinh Viên Yêu Cầu</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
                        {DEMO_PROMPTS[activeTab].badge}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 font-normal">
                      {DEMO_PROMPTS[activeTab].prompt}
                    </p>
                  </div>
                </div>

                {/* AI Multi-Step Reasoning Preview */}
                <div className="p-3.5 rounded-xl bg-space-950/60 border border-white/5 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-indigo-400">
                    <Bot className="w-4 h-4 animate-pulse" />
                    <span>Quá trình suy luận học thuật (Multi-Step Reasoning):</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
                    {DEMO_PROMPTS[activeTab].reasoning.map((step, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/5 text-[11px] text-gray-300"
                      >
                        <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 text-[10px] font-bold">
                          {idx + 1}
                        </span>
                        <span className="leading-snug">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Structured Output Box */}
                <div className="relative rounded-xl bg-black/50 border border-white/10 p-4 font-mono text-xs text-gray-200 overflow-x-auto">
                  <div className="flex items-center justify-between pb-2 border-b border-white/5 mb-3">
                    <span className="text-[11px] text-gray-400 font-sans font-medium flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      Kết quả xử lý theo thời gian thực (Real-time Stream)
                    </span>
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition-colors font-sans"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Đã sao chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>
                  </div>

                  <pre className="whitespace-pre-wrap leading-relaxed font-mono text-indigo-100">
                    {DEMO_PROMPTS[activeTab].output}
                  </pre>
                </div>

                {/* Verified Mentor Note & CTA Trigger */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-gradient-to-r from-purple-950/40 via-indigo-950/40 to-space-950 border border-purple-500/20">
                  <div className="flex items-center gap-2.5">
                    <UserCheck className="w-5 h-5 text-purple-400 shrink-0" />
                    <span className="text-xs text-gray-200">
                      {DEMO_PROMPTS[activeTab].expertNote}
                    </span>
                  </div>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-purple-600/30 text-purple-300 hover:bg-purple-600/50 border border-purple-500/30 transition-all shrink-0"
                  >
                    <span>Trải nghiệm ngay</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
