"use client";

// app/workspace/page.jsx
// Notion-style Academic Workspace & Study Notes Editor

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  FileText,
  Save,
  Download,
  Share2,
  Bold,
  Italic,
  Code,
  List,
  CheckSquare,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Table,
  ArrowLeft,
  Eye,
  Edit3,
  Trash2,
  Calendar,
  Clock,
  BookOpen,
  Bot,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import UserDropdownMenu from "@/components/auth/UserDropdownMenu";
import { AmbientBackground, NoiseOverlay } from "@/components/auth/AuthUI";
import { Spotlight } from "@/components/ui/spotlight";


export default function WorkspacePage() {
  const router = useRouter();
  const { session, profile, isLoading } = useAuth();

  const [title, setTitle] = useState("Đồ Án & Ghi Chú Nghiên Cứu: RAG vs Long Context trong LLMs");
  const [tags, setTags] = useState(["Trí tuệ nhân tạo", "RAG Architecture", "Học kỳ 2"]);
  const [activeTab, setActiveTab] = useState("edit"); // edit, preview
  const [isSaved, setIsSaved] = useState(true);

  const [content, setContent] = useState(
`# 📚 BÁO CÁO NGHIÊN CỨU: TỐI ƯU HÓA HỆ THỐNG RAG CHO HỌC THUẬT

## 1. Đặt Vấn Đề & Mục Tiêu Nghiên Cứu
Khi xây dựng trợ lý AI cho sinh viên, mô hình ngôn ngữ lớn (LLM) thường gặp hiện tượng **Hallucination** (Ảo tưởng thông tin). Phương pháp **Retrieval-Augmented Generation (RAG)** giải quyết bài toán này bằng cách kết nối mô hình với cơ sở tri thức giáo trình chuẩn xác.

---

## 2. Kiến Trúc Hệ Thống Đề Xuất

\`\`\`mermaid
flowchart LR
    A[Tài liệu PDF] --> B[Chunking & Embedding]
    B --> C[Vector DB: pgvector]
    C --> D[Hybrid Search + Cohere Rerank]
    D --> E[LLM Prompt Context]
\`\`\`

### Các Bước Triển Khai:
- [x] Thu thập giáo trình và tài liệu tham khảo dạng PDF/Markdown
- [x] Thiết lập Embedding Model: \`text-embedding-3-small\` (1536 chiều)
- [ ] Tích hợp giải thuật Re-ranking nâng cao độ chính xác
- [ ] Đánh giá độ phủ kiến thức trên tập dữ liệu Benchmark

---

## 3. Công Thức Đánh Giá Độ Tương Đồng (Cosine Similarity)

$$\\text{Cosine Similarity}(A, B) = \\frac{A \\cdot B}{\\|A\\| \\|B\\|} = \\frac{\\sum_{i=1}^n A_i B_i}{\\sqrt{\\sum_{i=1}^n A_i^2} \\sqrt{\\sum_{i=1}^n B_i^2}}$$

> **💡 Ghi chú quan trọng:** Luôn áp dụng ngưỡng *Similarity Threshold >= 0.78* để loại bỏ các đoạn văn bản nhiễu trước khi đưa vào context của LLM.

---

## 4. Bảng So Sánh Hiệu Năng

| Phương Pháp | Latency (ms) | Recall@5 | Chi Phí Token ($/1K req) |
| :--- | :--- | :--- | :--- |
| Naive RAG | 180ms | 68.2% | $0.002 |
| **Hybrid RAG (BM25 + Dense)** | **240ms** | **89.5%** | **$0.003** |
| Long-Context (128K window) | 1250ms | 84.1% | $0.045 |

---

*Biên soạn bởi:* **${profile?.fullName || "Sinh viên Nghiên cứu StudentHub"}** - ${new Date().toLocaleDateString("vi-VN")}`
  );

  // Autosave logic
  useEffect(() => {
    setIsSaved(false);
    const timer = setTimeout(() => {
      if (typeof window !== "undefined") {
        localStorage.setItem("studenthub_workspace_draft", content);
      }
      setIsSaved(true);
    }, 800);
    return () => clearTimeout(timer);
  }, [content, title]);

  // Calculate statistics
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const charCount = content.length;
  const readTime = Math.ceil(wordCount / 200);

  const handleExportMarkdown = () => {
    const element = document.createElement("a");
    const file = new Blob([content], { type: "text/markdown" });
    element.href = URL.createObjectURL(file);
    element.download = `${title.toLowerCase().replace(/[^a-z0-9]/gi, "_")}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleInsertSnippet = (snippet) => {
    setContent((prev) => prev + "\n" + snippet);
  };

  return (
    <div className="min-h-screen bg-space-950 text-gray-100 flex flex-col relative overflow-hidden font-sans">
      <AmbientBackground />
      <NoiseOverlay />
      
      <Spotlight className="-top-40 right-1/4" fill="rgba(168, 85, 247, 0.25)" />

      {/* Top Header */}
      <header className="h-16 border-b border-white/10 bg-space-900/70 backdrop-blur-xl sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5 transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> Bảng điều khiển
          </button>
          
          <div className="h-4 w-[1px] bg-white/10" />

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center shadow-md shadow-purple-500/20">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white flex items-center gap-1.5">
                Notion Workspace <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">EDITOR PRO</span>
              </h1>
              <p className="text-[11px] text-gray-400 flex items-center gap-1">
                {isSaved ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Đã tự động lưu
                  </span>
                ) : (
                  <span className="text-amber-400">Đang lưu...</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Quick links to AI Mentor & Whiteboard */}
          <button
            onClick={() => router.push("/ai-mentor")}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-medium border border-white/10 transition-colors"
          >
            <Bot className="w-3.5 h-3.5 text-indigo-400" /> AI Mentor
          </button>

          <button
            onClick={() => router.push("/whiteboard")}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-medium border border-white/10 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Whiteboard
          </button>

          <button
            onClick={handleExportMarkdown}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-500/30 transition-all"
          >
            <Download className="w-3.5 h-3.5" /> Xuất Markdown (.md)
          </button>

          <div className="h-4 w-[1px] bg-white/10 mx-1" />

          {/* User Profile Popover */}
          <UserDropdownMenu />
        </div>
      </header>


      {/* Editor Body Area */}
      <div className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8 flex flex-col">
        
        {/* Document Metadata Bar */}
        <div className="space-y-4 mb-6">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Tiêu đề tài liệu / nghiên cứu..."
            className="w-full text-2xl sm:text-3xl font-extrabold text-white bg-transparent border-none focus:outline-none placeholder-gray-600"
          />

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {tags.map((tag, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-indigo-300 font-medium"
              >
                #{tag}
              </span>
            ))}
            <div className="flex items-center gap-3 text-gray-400 ml-auto text-[11px]">
              <span>📊 {wordCount} từ</span>
              <span>•</span>
              <span>⏱️ ~{readTime} phút đọc</span>
            </div>
          </div>
        </div>

        {/* Notion Markdown Formatting Toolbar */}
        <div className="flex flex-wrap items-center gap-1 p-2 rounded-2xl bg-space-900/80 border border-white/10 backdrop-blur-xl mb-4">
          <button
            onClick={() => handleInsertSnippet("## Tiêu Đề Mới")}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
            title="Thêm Heading"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleInsertSnippet("**Đoạn văn bản in đậm**")}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
            title="In đậm"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleInsertSnippet("*Đoạn văn bản in nghiêng*")}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
            title="In nghiêng"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleInsertSnippet("```python\n# Mã nguồn code\ndef solve_equation():\n    pass\n```")}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
            title="Khối mã Code"
          >
            <Code className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleInsertSnippet("- [ ] Nhiệm vụ học tập cần hoàn thành")}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
            title="Checklist"
          >
            <CheckSquare className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleInsertSnippet("$$f(x) = \\int_{-\\infty}^\\infty e^{-x^2} dx = \\sqrt{\\pi}$$")}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors text-xs font-mono font-bold"
            title="Công thức LaTeX"
          >
            LaTeX
          </button>
          <button
            onClick={() => handleInsertSnippet("| Cột 1 | Cột 2 | Cột 3 |\n| :--- | :--- | :--- |\n| Dữ liệu A | Dữ liệu B | Dữ liệu C |")}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
            title="Bảng biểu"
          >
            <Table className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleInsertSnippet("> 💡 Trích dẫn lời khuyên học thuật từ Cố vấn")}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
            title="Trích dẫn"
          >
            <Quote className="w-4 h-4" />
          </button>

          <div className="ml-auto flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setActiveTab("edit")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                activeTab === "edit" ? "bg-purple-600 text-white shadow-sm" : "text-gray-400 hover:text-white"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5 inline mr-1" /> Chỉnh sửa
            </button>
            <button
              onClick={() => setActiveTab("preview")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                activeTab === "preview" ? "bg-purple-600 text-white shadow-sm" : "text-gray-400 hover:text-white"
              }`}
            >
              <Eye className="w-3.5 h-3.5 inline mr-1" /> Xem trước
            </button>
          </div>
        </div>

        {/* Editor Main Content */}
        <div className="flex-1 rounded-3xl p-6 sm:p-8 bg-space-900/60 border border-white/10 backdrop-blur-2xl shadow-glass-deep flex flex-col">
          {activeTab === "edit" ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Bắt đầu viết ghi chú học tập hoặc gõ Markdown..."
              className="flex-1 w-full bg-transparent text-gray-200 font-mono text-sm leading-relaxed focus:outline-none resize-none scrollbar-thin scrollbar-thumb-white/10"
              rows={20}
            />
          ) : (
            <div className="flex-1 overflow-y-auto whitespace-pre-wrap font-sans text-sm text-gray-200 leading-relaxed space-y-4 prose prose-invert max-w-none">
              {content}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
