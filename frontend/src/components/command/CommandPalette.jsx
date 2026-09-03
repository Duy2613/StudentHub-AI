"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, BookOpen, Award, FileText, Sparkles, X, ShieldCheck } from "lucide-react";

export function CommandPalette({ isOpen, onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/personalization/search?q=${encodeURIComponent(query)}`);
        const json = await res.json();
        if (json.success) {
          setResults(json.data);
        }
      } catch (err) {
        console.error("Failed searching command palette:", err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl rounded-2xl bg-neutral-900 border border-neutral-700/80 shadow-2xl shadow-black/80 overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-neutral-800 space-x-3">
          <Search className="w-5 h-5 text-neutral-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tra cứu môn học, chuyên gia, quy chế học vụ, hoặc lệnh AI..."
            className="w-full bg-transparent text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-neutral-400 hover:text-neutral-200 p-1">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-800 text-neutral-400 border border-neutral-700">
            ESC
          </kbd>
        </div>

        {/* Results / Suggestions Container */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          {loading && (
            <div className="py-8 text-center text-neutral-400 flex items-center justify-center space-x-2">
              <Sparkles className="w-4 h-4 animate-spin text-cyan-400" />
              <span>Đang tra cứu trên toàn bộ mạng lưới tri thức học vụ...</span>
            </div>
          )}

          {!loading && results && results.totalMatches > 0 && (
            <div className="space-y-4">
              {/* Courses */}
              {results.categories.courses?.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 flex items-center space-x-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                    <span>Học Phần & Môn Học</span>
                  </span>
                  {results.categories.courses.map((item) => (
                    <a
                      key={item.id}
                      href={`/academic?search=${encodeURIComponent(item.id)}`}
                      onClick={onClose}
                      className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 hover:border-blue-500/40 flex items-center justify-between group transition-all block"
                    >
                      <div>
                        <div className="font-bold text-neutral-200 group-hover:text-blue-300">{item.title}</div>
                        <div className="text-[11px] text-neutral-400">{item.subtitle}</div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-400">{item.sourceLabel}</span>
                    </a>
                  ))}
                </div>
              )}

              {/* Experts */}
              {results.categories.experts?.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 flex items-center space-x-1.5">
                    <Award className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Giảng Viên & Chuyên Gia Kiểm Định</span>
                  </span>
                  {results.categories.experts.map((item) => (
                    <a
                      key={item.id}
                      href={`/intelligence/experts?topic=${encodeURIComponent(item.title)}`}
                      onClick={onClose}
                      className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 hover:border-indigo-500/40 flex items-center justify-between group transition-all block"
                    >
                      <div>
                        <div className="font-bold text-neutral-200 group-hover:text-indigo-300">{item.title}</div>
                        <div className="text-[11px] text-neutral-400">{item.subtitle}</div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {item.sourceLabel}
                      </span>
                    </a>
                  ))}
                </div>
              )}

              {/* Regulations */}
              {results.categories.regulations?.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 flex items-center space-x-1.5">
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Quy Chế & Quyết Định Đào Tạo</span>
                  </span>
                  {results.categories.regulations.map((item) => (
                    <a
                      key={item.id}
                      href={`/intelligence/evidence?claim=${encodeURIComponent(item.title)}`}
                      onClick={onClose}
                      className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 hover:border-cyan-500/40 flex items-center justify-between group transition-all block"
                    >
                      <div>
                        <div className="font-bold text-neutral-200 group-hover:text-cyan-300">{item.title}</div>
                        <div className="text-[11px] text-neutral-400">{item.subtitle}</div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-400">{item.sourceLabel}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {!loading && query && results?.totalMatches === 0 && (
            <div className="py-8 text-center text-neutral-500 text-xs">
              Không tìm thấy kết quả phù hợp với từ khóa '{query}'. Thử tra cứu tên môn học, giảng viên hoặc mã quy chế.
            </div>
          )}

          {!query && (
            <div className="space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">Tác Vụ Nhanh (Quick Actions)</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { label: "Lập Kế Hoạch Học Tập Kỳ Này", icon: BookOpen, href: "/academic" },
                  { label: "Tra Cứu Chuyên Gia AI & Xử Lý Ảnh", icon: Award, href: "/intelligence/experts" },
                  { label: "Kiểm Tra Chỉ Số Tin Cậy (T1 Trust)", icon: ShieldCheck, href: "/intelligence/trust" },
                  { label: "Xem Minh Chứng Quy Chế (T4 Evidence)", icon: FileText, href: "/intelligence/evidence" }
                ].map((act, i) => {
                  const Icon = act.icon;
                  return (
                    <a
                      key={i}
                      href={act.href}
                      onClick={onClose}
                      className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80 hover:border-neutral-700 hover:bg-neutral-800/40 flex items-center space-x-2.5 transition-all text-neutral-300 hover:text-white"
                    >
                      <Icon className="w-4 h-4 text-cyan-400" />
                      <span className="font-medium">{act.label}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
