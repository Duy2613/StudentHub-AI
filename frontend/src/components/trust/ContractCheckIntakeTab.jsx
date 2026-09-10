'use client';

import React, { useState } from 'react';
import EvidenceStamp from '@/components/primitives/EvidenceStamp';

export default function ContractCheckIntakeTab({ onAnalyzeContract }) {
  const [contractText, setContractText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!contractText.trim()) return;
    setIsSubmitting(true);
    if (typeof onAnalyzeContract === 'function') {
      onAnalyzeContract(contractText);
    }
  };

  return (
    <div className="border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-6 rounded-lg my-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-[family-name:var(--font-ui)] text-lg font-bold text-[var(--text-primary)] vn-heading-safe">
            Phân tích Hợp đồng & Giấy tờ (Document X-Ray)
          </h3>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Đối soát điều khoản hợp đồng thuê trọ, thỏa thuận thực tập hoặc cam kết tài chính.
          </p>
        </div>
        <EvidenceStamp verdict="CONFIRMED" hash="INTAKE_SECURE_256" date="BẢO MẬT DỮ LIỆU" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="contract-text-input"
            className="block text-xs font-[family-name:var(--font-technical)] uppercase text-[var(--text-muted)] mb-2 tracking-wider"
          >
            Nội dung hợp đồng hoặc điều khoản cần rà soát:
          </label>
          <textarea
            id="contract-text-input"
            rows={6}
            value={contractText}
            onChange={(e) => setContractText(e.target.value)}
            placeholder="Dán toàn bộ điều khoản hợp đồng thuê trọ, tiền cọc, hoặc điều khoản bồi thường vào đây..."
            className="w-full bg-[var(--surface-quiet)] border border-[var(--border-subtle)] rounded p-3 text-sm text-[var(--text-primary)] font-[family-name:var(--font-ui)] focus:border-[var(--accent-trust)] focus:outline-none leading-relaxed resize-y"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-[var(--text-muted)]">
            Hệ thống tự động rà soát bẫy phạt cọc, phụ phí ngầm và điều khoản bất lợi.
          </span>
          <button
            type="submit"
            disabled={isSubmitting || !contractText.trim()}
            className="px-4 py-2 bg-[var(--accent-trust)] text-[var(--bg-primary)] font-bold text-sm font-[family-name:var(--font-ui)] rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {isSubmitting ? 'Đang phân tích điều khoản...' : 'Bắt đầu đối soát'}
          </button>
        </div>
      </form>
    </div>
  );
}
