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
  Copy, 
  Check, 
  ChevronRight,
  UserCheck,
  Zap,
  Play,
  Layers,
  ShieldCheck,
  Star,
  Cpu
} from "lucide-react";
import { Spotlight } from "@/components/ui/spotlight";
import { Meteors } from "@/components/ui/meteors";
import { BorderBeam } from "@/components/ui/border-beam";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { WordRotate } from "@/components/ui/word-rotate";

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
                
    return distances # Độ phức tạp tối ưu: O((V + E) log V)`,
      expertNote: "💡 Gợi ý từ Cố vấn TS. Nguyễn Minh Đức (HUST): Lưu ý trường hợp trọng số âm (dùng Bellman-Ford) và ứng dụng thực tế trong định tuyến mạng OSPF.",
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
      expertNote: "💡 Cố vấn ThS. Trần Hoàng Nam lưu ý: Khi làm bài thi, cần dẫn chứng ví dụ thực tế ngành CNTT để đạt điểm tối đa.",
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
    <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden select-none">
      {/* Lightweight Aceternity Spotlight Effect */}
      <Spotlight
        className="-top-40 left-0 md:left-60 md:-top-20"
        fill="rgba(99, 102, 241, 0.35)"
      />
      
      {/* Subtle Meteors Effect */}
      <Meteors number={16} />

      {/* Pure Hardware-Accelerated Ambient Glow Blobs (0% WebGL Overhead) */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] md:w-[900px] h-[450px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/15 to-cyan-400/10 blur-[130px] rounded-full pointer-events-none -z-10 animate-blob-slow" />
      <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-indigo-500/15 blur-[90px] rounded-full pointer-events-none -z-10 animate-blob-medium" />
      <div className="absolute top-1/2 right-1/4 w-72 h-72 bg-purple-600/15 blur-[100px] rounded-full pointer-events-none -z-10 animate-blob-slow animation-delay-4000" />
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Top Eyebrow Badge */}
        <div className="flex justify-center mb-6">
          <AnimatedGradientText>
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse mr-2" />
            <span className="text-xs font-semibold text-gray-200 tracking-wide">
              THẾ HỆ AI 2026: COPILOT & VERIFIED MENTOR NETWORK
            </span>
          </AnimatedGradientText>
        </div>

        {/* Main Headline & Punchy Subtext */}
        <div className="text-center max-w-4xl mx-auto mb-10">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.2] mb-6">
            Bứt Phá Điểm Số & Sự Nghiệp Cùng{" "}
            <br className="hidden sm:inline" />
            <WordRotate
              words={[
                "Trí Tuệ Nhân Tạo Sinh Viên",
                "Cố Vấn Chuyên Gia 1:1",
                "Học Thuật Chuẩn Quốc Tế",
                "Tối Ưu Điểm Số & Sự Nghiệp",
              ]}
              className="text-gradient-primary"
            />
          </h1>
          
          <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Hỏi đáp bài tập, tóm tắt tài liệu học thuật và nhận cố vấn 1:1 từ mạng lưới chuyên gia uy tín. Tăng tốc hiệu suất học tập lên 300%.
          </p>

          {/* Kinetic Value Indicators */}
          <div className="my-6 flex flex-wrap items-center justify-center gap-2.5">
            <span className="px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs font-medium text-slate-300 backdrop-blur-md hover:bg-white/10 transition-all cursor-default flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" /> Socratic Reasoning 2.0
            </span>
            <span className="px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-xs font-medium text-indigo-300 backdrop-blur-md hover:bg-indigo-500/20 transition-all cursor-default flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> Cố Vấn Chuyên Gia 1:1
            </span>
            <span className="px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-300 backdrop-blur-md hover:bg-emerald-500/20 transition-all cursor-default flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> +30 Uy Tín (.EDU)
            </span>
          </div>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-base font-bold bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-600 text-white shadow-neon-primary hover:brightness-110 active:scale-95 transition-all"
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

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Miễn phí trọn đời
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Đăng nhập tức thì Edu / Google / GitHub
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Không cần thẻ tín dụng
            </span>
          </div>
        </div>

        {/* 3 Core Interactive Pillar Hubs (Double-Bezel Architecture) */}
        <div className="my-10 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-1.5 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl shadow-glass-deep hover:border-indigo-500/40 transition-all group">
            <div className="p-5 rounded-[22px] bg-space-950/80 border border-white/[0.06] h-full flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Bot className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">AI Mentor Socratic 2.0</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Phân tích bài toán đa bước, dẫn dắt tư duy khoa học, không đưa ngay đáp án rập khuôn.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-indigo-300">
                <span>120K+ bài giải thực chứng</span>
                <span className="text-emerald-400 font-semibold">● Hoạt động 24/7</span>
              </div>
            </div>
          </div>

          <div className="p-1.5 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl shadow-glass-deep hover:border-amber-500/40 transition-all group">
            <div className="p-5 rounded-[22px] bg-space-950/80 border border-white/[0.06] h-full flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Star className="w-5 h-5 fill-amber-400" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">Cố Vấn Thực Chứng 1:1</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Mạng lưới TS., ThS. và Kỹ sư Tech Lead từ các trường đại học & doanh nghiệp đầu ngành.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-amber-300">
                <span>Top 1% Chuyên gia</span>
                <span className="font-semibold">★ 4.98/5.0</span>
              </div>
            </div>
          </div>

          <div className="p-1.5 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl shadow-glass-deep hover:border-teal-500/40 transition-all group">
            <div className="p-5 rounded-[22px] bg-space-950/80 border border-white/[0.06] h-full flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Code2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">Code Sandbox & Notion</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Soạn thảo Markdown, bảng vẽ vô tận Tldraw và trình thực thi code trực tiếp trên trình duyệt.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-teal-300">
                <span>Python, JS, LaTeX</span>
                <span className="text-cyan-400 font-semibold">⚡ Instant Sync</span>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Live AI Copilot Terminal Preview with BorderBeam */}
        <div id="copilot" className="mt-12 max-w-5xl mx-auto">
          <div className="relative rounded-2xl p-[1px] bg-gradient-to-b from-white/20 via-indigo-500/20 to-transparent shadow-glass-deep overflow-hidden">
            <BorderBeam size={300} duration={12} colorFrom="#6366f1" colorTo="#a855f7" />
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
                    <span>StudentHub-Copilot-v2.8 // Academic-Engine</span>
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
