"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Compass,
  FileClock,
  Search,
  ShieldCheck,
  UserRoundCheck,
  Users,
  X,
} from "lucide-react";
import { searchCanonicalProduct, STATIC_SEARCH_INDEX } from "@/lib/search/searchProviders";
import { markAssurance, measureAssurance } from "@/lib/performance/assurance";

const CATEGORY_ICONS = {
  Cases: FileClock,
  Trust: ShieldCheck,
  Community: Users,
  Experts: UserRoundCheck,
  Navigation: Compass,
};

export default function AcademicCommandPalette({ isOpen, onClose, restoreFocusRef = null }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [asyncResults, setAsyncResults] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const dialogRef = useRef(null);
  const previousActiveElement = useRef(null);

  const defaultResults = useMemo(() => ({
    Navigation: STATIC_SEARCH_INDEX.filter((item) => item.category === "Navigation").slice(0, 3),
    Cases: STATIC_SEARCH_INDEX.filter((item) => item.category === "Cases").slice(0, 2),
    Trust: STATIC_SEARCH_INDEX.filter((item) => item.category === "Trust").slice(0, 2),
  }), []);
  const results = useMemo(
    () => (query.trim() ? (asyncResults || {}) : defaultResults),
    [asyncResults, defaultResults, query],
  );

  // Flattened list for keyboard up/down navigation
  const flatResults = useMemo(() => {
    return Object.entries(results).flatMap(([category, items]) =>
      items.map((item) => ({ ...item, category }))
    );
  }, [results]);

  useEffect(() => {
    if (isOpen) {
      markAssurance("command-palette-request");
      // The palette is mounted lazily. On WebKit, the click that opened it can
      // finish before this effect runs, leaving document.activeElement on the
      // body. Prefer the trigger ref captured by the owning shell so Escape
      // always returns focus to the control that opened the dialog.
      previousActiveElement.current = restoreFocusRef?.current || document.activeElement;
      const resetTimer = setTimeout(() => {
        inputRef.current?.focus();
        setQuery("");
        setAsyncResults(null);
        setSelectedIndex(0);
        markAssurance("command-palette-interactive");
        measureAssurance("command-palette-open-duration", "command-palette-request", "command-palette-interactive");
      }, 50);
      return () => clearTimeout(resetTimer);
    } else if (previousActiveElement.current) {
      if (previousActiveElement.current.isConnected !== false) {
        previousActiveElement.current.focus?.({ preventScroll: true });
      }
    }
  }, [isOpen, restoreFocusRef]);

  // Perform search
  useEffect(() => {
    if (!query.trim()) {
      return;
    }

    let active = true;
    searchCanonicalProduct(query).then((res) => {
      if (active) {
        setAsyncResults(res);
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
            placeholder="Tìm kiếm tình huống, bằng chứng, chuyên gia..."
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
