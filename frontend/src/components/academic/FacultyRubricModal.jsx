'use client';

import React, { useEffect } from 'react';

/**
 * FacultyRubricModal: Merged professor evaluation & teaching rubric modal.
 * Absorbed from /prof-rating into /academic per F00 and F01 Part J.
 */
export default function FacultyRubricModal({
  faculty,
  isOpen,
  onClose,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !faculty) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Hồ sơ đánh giá: ${faculty.name}`}
    >
      <div className="bg-[var(--surface-primary)] border border-[var(--border-subtle)] max-w-lg w-full rounded-lg p-6 shadow-2xl">
        <div className="flex items-start justify-between pb-4 border-b border-[var(--border-subtle)] mb-4">
          <div>
            <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--text-primary)] vn-heading-safe">
              {faculty.name}
            </h3>
            <p className="text-xs font-[family-name:var(--font-ui)] text-[var(--text-secondary)] mt-0.5">
              Khoa: {faculty.department} • Mã môn: {faculty.courseCode}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] px-2 py-1 border border-[var(--border-subtle)] rounded transition-colors"
          >
            Đóng [✕]
          </button>
        </div>

        {/* 4-Axis Rubric Histograms */}
        <div className="space-y-4 my-6">
          {faculty.rubrics?.map((r, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-xs font-[family-name:var(--font-ui)]">
                <span className="text-[var(--text-primary)]">{r.axis}</span>
                <span className="font-[family-name:var(--font-technical)] text-[var(--accent-human)] font-semibold">
                  {r.score}/100
                </span>
              </div>
              <div className="w-full h-1.5 bg-[var(--surface-quiet)] rounded overflow-hidden">
                <div
                  className="h-full bg-[var(--accent-human)] transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, r.score))}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-[var(--border-subtle)] text-xs text-[var(--text-muted)] flex justify-between items-center">
          <span>Dữ liệu đối soát từ {faculty.totalReviews || 0} sinh viên thực tế</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-[var(--surface-elevated)] text-[var(--text-primary)] rounded hover:bg-[var(--surface-quiet)] border border-[var(--border-subtle)] transition-colors"
          >
            Xong
          </button>
        </div>
      </div>
    </div>
  );
}
