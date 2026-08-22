"use client";

// app/ai-mentor/page.jsx
// AI Mentor Space: Trợ lý học tập thông minh đa chuyên ngành

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  Sparkles,
  Bot,
  Send,
  User,
  BookOpen,
  Code2,
  Brain,
  Cpu,
  GraduationCap,
  RotateCcw,
  Copy,
  Check,
  Zap,
  ChevronRight,
  Lightbulb,
  ArrowLeft,
  Share2,
  Trash2,
  FileText,
  Sliders,
  Award,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import UserDropdownMenu from "@/components/auth/UserDropdownMenu";
import { AmbientBackground, NoiseOverlay } from "@/components/auth/AuthUI";
import { motion, AnimatePresence } from "motion/react";

import { BorderBeam } from "@/components/ui/border-beam";
import { Badge } from "@/components/ui/badge";
import { Spotlight } from "@/components/ui/spotlight";

const SUBJECT_MODES = [
  { id: "cs", name: "CNTT & Trí Tuệ Nhân Tạo", icon: Code2, color: "text-indigo-400 border-indigo-500/30 bg-indigo-500/10" },
  { id: "math", name: "Toán & Kỹ Thuật Tối Ưu", icon: Brain, color: "text-purple-400 border-purple-500/30 bg-purple-500/10" },
  { id: "econ", name: "Kinh Tế & Quản Trị", icon: Award, color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
  { id: "med", name: "Y - Dược & Sinh Học", icon: Zap, color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10" },
  { id: "general", name: "Học Thuật Đại Cương", icon: BookOpen, color: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
];

const PROMPT_SUGGESTIONS = [
  "Giải thích định lý Master Theorem trong phân tích thuật toán",
  "Lộ trình 6 tháng thực tập AI/ML Engineer cho sinh viên",
  "Tối ưu hàm mục tiêu lợi nhuận trong thị trường cạnh tranh",
  "So sánh kiến trúc RAG với Long-context Window trong LLMs",
];

export default function AIMentorPage() {
  const router = useRouter();
  const { session, profile, isLoading } = useAuth();
  
  const [selectedSubject, setSelectedSubject] = useState("cs");
  const [reasoningMode, setReasoningMode] = useState(true);
  const [inputMessage, setInputMessage] = useState("");
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const [messages, setMessages] = useState([
    {
      id: "msg-0",
      role: "assistant",
      content: `👋 Xin chào ${profile?.fullName || "bạn"}! Tôi là **StudentHub AI Mentor** — Cố vấn học thuật AI của bạn.\n\nTôi có thể giúp bạn:\n* 📐 Giải và diễn giải các bài toán phức tạp theo từng bước suy luận logic.\n* 💻 Review mã nguồn, tối ưu giải thuật và thiết kế kiến trúc hệ thống.\n* 📄 Tóm tắt bài báo khoa học và định dạng trích dẫn chuẩn quốc tế.\n\n*Hãy nhập câu hỏi học tập của bạn hoặc chọn các chủ đề gợi ý phía dưới!*`,
      timestamp: "Vừa xong",
    },
  ]);

  const messagesEndRef = useRef(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  const handleSendMessage = async (customText = null) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || isGenerating) return;

    const userMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputMessage("");
    setIsGenerating(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          subject: selectedSubject,
          reasoningMode: reasoningMode,
        }),
      });

      if (!res.ok) {
        throw new Error("Lỗi khi kết nối với máy chủ AI Mentor.");
      }

      const data = await res.json();
      const assistantMessage = {
        id: `ast-${Date.now()}`,
        role: "assistant",
        content: data.content || "Không có phản hồi từ máy chủ.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: `⚠️ **Thông báo kết nối**: ${err.message || "Đã xảy ra sự cố mạng. Vui lòng thử lại sau giây lát."}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyMessage = (content, idx) => {
    navigator.clipboard?.writeText(content);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleClearChat = () => {
    if (confirm("Bạn có chắc chắn muốn làm mới toàn bộ cuộc trò chuyện?")) {
      setMessages([
        {
          id: `msg-${Date.now()}`,
          role: "assistant",
          content: "Cuộc trò chuyện đã được làm mới. Hãy đặt câu hỏi bất kỳ cho AI Mentor!",
          timestamp: "Vừa xong",
        },
      ]);
    }
  };

  return (
    <div className="min-h-screen bg-space-950 text-gray-100 flex flex-col relative overflow-hidden font-sans">
      <AmbientBackground />
      <NoiseOverlay />
      
      {/* Top Spotlight */}
      <Spotlight className="-top-36 left-1/3" fill="rgba(99, 102, 241, 0.25)" />

      {/* Top App Header */}
      <header className="h-16 border-b border-white/10 bg-space-900/60 backdrop-blur-xl sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5 transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> Bảng điều khiển
          </button>
          
          <div className="h-4 w-[1px] bg-white/10" />

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white flex items-center gap-1.5">
                AI Mentor Space <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">PRO VIP</span>
              </h1>
              <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Socratic Engine 2.0 Sẵn sàng
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Quick links to Workspace & Whiteboard */}
          <button
            onClick={() => router.push("/workspace")}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-medium border border-white/10 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-purple-400" /> Workspace
          </button>

          <button
            onClick={() => router.push("/whiteboard")}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-medium border border-white/10 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" /> Whiteboard
          </button>

          <button
            onClick={handleClearChat}
            className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-gray-400 hover:text-rose-300 border border-white/5 transition-colors"
            title="Xóa đoạn chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <div className="h-4 w-[1px] bg-white/10 mx-1" />

          {/* User Profile Popover */}
          <UserDropdownMenu />
        </div>
      </header>


      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col max-w-5xl w-full mx-auto p-4 sm:p-6 overflow-hidden">
        
        {/* Subject Mode Selector Bar */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-space-900/60 border border-white/10 backdrop-blur-xl">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="text-xs text-gray-400 font-medium mr-1.5 flex items-center gap-1">
              <Brain className="w-3.5 h-3.5 text-indigo-400" /> Chuyên ngành:
            </span>
            {SUBJECT_MODES.map((sub) => {
              const Icon = sub.icon;
              const isSelected = selectedSubject === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubject(sub.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30 border border-indigo-400/40"
                      : "bg-white/5 text-gray-400 hover:text-gray-200 hover:bg-white/10 border border-transparent"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {sub.name}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={reasoningMode}
                onChange={(e) => setReasoningMode(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 accent-indigo-600"
              />
              <span>Giải trình chi tiết</span>
            </label>
          </div>
        </div>

        {/* Chat Message Stream */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-white/10">
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => {
              const isAssistant = msg.role === "assistant";
              return (
                <motion.div
                  key={msg.id || idx}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  className={`flex gap-3 ${isAssistant ? "justify-start" : "justify-end"}`}
                >
                  {isAssistant && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm border border-white/20 mt-1">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}

                  <div
                    className={`max-w-2xl sm:max-w-3xl rounded-2xl p-4 sm:p-5 relative group text-sm leading-relaxed shadow-lg ${
                      isAssistant
                        ? "bg-space-900/90 border border-white/10 text-gray-200 backdrop-blur-xl"
                        : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-tr-xs"
                    }`}
                  >
                    {/* Message Header */}
                    <div className="flex items-center justify-between gap-4 mb-2 pb-1.5 border-b border-white/5 text-[11px] text-gray-400">
                      <span className="font-semibold text-gray-300">
                        {isAssistant ? "StudentHub AI Mentor" : (profile?.fullName || "Bạn")}
                      </span>
                      <div className="flex items-center gap-2">
                        <span>{msg.timestamp}</span>
                        {isAssistant && (
                          <button
                            onClick={() => handleCopyMessage(msg.content, idx)}
                            className="text-gray-400 hover:text-white p-1 rounded hover:bg-white/5 transition-colors"
                            title="Sao chép nội dung"
                          >
                            {copiedIdx === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="whitespace-pre-wrap font-sans text-sm space-y-2">
                      {msg.content}
                    </div>
                  </div>

                  {!isAssistant && (
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="w-4 h-4 text-indigo-300" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Typing Indicator */}
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 items-center text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 w-fit px-4 py-2.5 rounded-2xl"
            >
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <span className="font-semibold">AI Mentor đang suy luận và phân tích bài toán...</span>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Prompt Suggestions */}
        <div className="mt-3 mb-2 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] text-gray-500 whitespace-nowrap flex items-center gap-1">
            <Lightbulb className="w-3 h-3 text-amber-400" /> Gợi ý:
          </span>
          {PROMPT_SUGGESTIONS.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(item)}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-indigo-600/20 border border-white/10 hover:border-indigo-500/30 text-gray-400 hover:text-indigo-300 text-xs whitespace-nowrap transition-colors"
            >
              {item}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="relative mt-2">
          <div className="relative rounded-2xl p-[1px] bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-cyan-500/30 shadow-glass-deep">
            <div className="bg-space-900/90 rounded-[15px] p-2 flex items-center gap-2 backdrop-blur-2xl">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Nhập câu hỏi học tập, công thức toán hoặc yêu cầu giải thuật..."
                disabled={isGenerating}
                className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isGenerating}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                <Send className="w-3.5 h-3.5" /> Gửi
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
