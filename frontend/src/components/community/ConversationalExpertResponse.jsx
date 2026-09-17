"use client";

import React from "react";
import { Award, MessageSquare, ShieldCheck } from "lucide-react";

/**
 * ConversationalExpertResponse — Informal, signed perspective within Community threads.
 *
 * CRITICAL SAFETY RULES:
 * - This is an informal community comment by a verified expert, NOT a Formal Expert Assessment.
 * - Must display the clear disclaimer: "Ý kiến thảo luận - Không phải Giám định Chính thức."
 */
export default function ConversationalExpertResponse({
  authorName = "Chuyên gia Hội đồng",
  authorTitle = "",
  domain = "Quy chế Học thuật",
  content = "",
  createdAt = "Vừa xong",
}) {
  return (
    <article className="community-expert-response-card" aria-label={`Phản hồi thảo luận từ ${authorName}`}>
      <div className="expert-response-header">
        <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 font-semibold text-xs">
          {authorName.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <strong className="text-xs text-slate-100 font-medium">{authorName}</strong>
            {authorTitle && <span className="text-[11px] text-slate-400">({authorTitle})</span>}
            <span className="expert-response-badge">
              <ShieldCheck size={12} /> {domain}
            </span>
          </div>
          <small className="text-[10px] text-slate-500 font-mono">{createdAt}</small>
        </div>
      </div>

      <div className="text-xs text-slate-200 leading-relaxed pl-10 pr-2">
        <p>{content}</p>
      </div>

      <div className="pl-10">
        <span className="expert-response-disclaimer flex items-center gap-1 text-[11px] text-slate-400 font-mono">
          <MessageSquare size={11} /> Bình luận thảo luận chuyên gia — Không thay thế cho Văn bản Giám định chính thức từ Hội đồng.
        </span>
      </div>
    </article>
  );
}
