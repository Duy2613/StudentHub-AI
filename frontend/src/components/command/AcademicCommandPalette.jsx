"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  Compass,
  FileCode2,
  FolderKanban,
  Search,
  ShieldCheck,
  UserRoundCheck,
  Users,
  X,
} from "lucide-react";
import { searchCanonicalProduct, STATIC_SEARCH_INDEX } from "@/lib/search/searchProviders";

const CATEGORY_ICONS = {
  Courses: BookOpen,
  Lessons: FileCode2,
  Practice: BrainCircuit,
  Projects: FolderKanban,
  Trust: ShieldCheck,
  Community: Users,
  Experts: UserRoundCheck,
  Navigation: Compass,
};

export default function AcademicCommandPalette({ isOpen, onClose }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({});
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const dialogRef = useRef(null);
  const previousActiveElement = useRef(null);

  // Flattened list for keyboard up/down navigation
  const flatResults = useMemo(() => {
    return Object.entries(results).flatMap(([category, items]) =>
      items.map((item) => ({ ...item, category }))
    );
  }, [results]);

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement;
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setSelectedIndex(0);
    } else if (previousActiveElement.current) {
      previousActiveElement.current.focus?.({ preventScroll: true });
    }
  }, [isOpen]);

  // Perform search
  useEffect(() => {
    if (!query.trim()) {
      // Default grouped suggestions
      const defaultGroups = {
        Navigation: STATIC_SEARCH_INDEX.filter((i) => i.category === "Navigation").slice(0, 3),
        Courses: STATIC_SEARCH_INDEX.filter((i) => i.category === "Courses").slice(0, 2),
        Trust: STATIC_SEARCH_INDEX.filter((i) => i.category === "Trust").slice(0, 2),
      };
      setResults(defaultGroups);
      return;
    }

    let active = true;
    searchCanonicalProduct(query).then((res) => {
      if (active) {
        setResults(res);
        setSelectedIndex(0);
      }
    });

    return () => {
      active = false;
    };
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }

    if (flatResults.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % flatResults.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + flatResults.length) % flatResults.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = flatResults[selectedIndex];
      if (target) {
        onClose();
        router.push(target.href);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="command-palette-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        onKeyDown={handleKeyDown}
        className="w-full max-w-2xl bg-surface-primary border border-border-strong rounded-2xl shadow-2xl overflow-hidden text-text-primary"
      >
        <h2 id="command-palette-title" className="sr-only">
          Tìm kiếm toàn hệ thống StudentHub AI
        </h2>

        {/* Input Bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border-subtle bg-surface-elevated/40">
          <Search size={18} className="text-text-muted flex-shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm kiếm môn học, bài giảng, thử thách, bằng chứng, chuyên gia..."
            className="w-full bg-transparent text-sm sm:text-base text-text-primary placeholder:text-text-muted focus:outline-none"
            aria-autocomplete="list"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng bảng tìm kiếm"
            className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-elevated focus:outline-none focus:ring-2 focus:ring-accent-primary"
          >
            <X size={18} />
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-5">
          {flatResults.length > 0 ? (
            Object.entries(results).map(([category, items]) => {
              const Icon = CATEGORY_ICONS[category] || Search;
              return (
                <div key={category}>
                  <div className="text-xs font-mono uppercase tracking-wider text-text-muted px-3 mb-2 flex items-center gap-2">
                    <Icon size={13} className="text-accent-knowledge" />
                    <span>{category}</span>
                  </div>
                  <div className="space-y-1">
                    {items.map((item) => {
                      const overallIndex = flatResults.findIndex((r) => r.id === item.id);
                      const isSelected = overallIndex === selectedIndex;
                      return (
                        <Link
                          key={item.id}
                          href={item.href}
                          onClick={onClose}
                          className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                            isSelected
                              ? "bg-surface-elevated border border-accent-primary text-text-primary"
                              : "hover:bg-surface-elevated/50 text-text-secondary hover:text-text-primary"
                          }`}
                        >
                          <div>
                            <div className="text-sm font-medium text-text-primary">
                              {item.title}
                            </div>
                            <div className="text-xs text-text-muted line-clamp-1 mt-0.5">
                              {item.description}
                            </div>
                          </div>
                          <ArrowRight
                            size={14}
                            className={`flex-shrink-0 ml-3 transition-transform ${
                              isSelected
                                ? "text-accent-primary translate-x-1"
                                : "text-text-muted"
                            }`}
                          />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-sm text-text-muted">
              Không tìm thấy kết quả phù hợp với &quot;{query}&quot;.
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-5 py-3 border-t border-border-subtle bg-surface-elevated/20 flex items-center justify-between text-xs text-text-muted font-mono">
          <div className="flex items-center gap-4">
            <span><kbd className="px-1.5 py-0.5 rounded bg-surface-primary border border-border-subtle">↑↓</kbd> Di chuyển</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-surface-primary border border-border-subtle">Enter</kbd> Chọn</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-surface-primary border border-border-subtle">Esc</kbd> Đóng</span>
          </div>
          <span className="hidden sm:inline">StudentHub Command Palette</span>
        </div>
      </div>
    </div>
  );
}
