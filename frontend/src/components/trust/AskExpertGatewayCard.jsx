"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck, UserCheck, Users } from "lucide-react";

/**
 * AskExpertGatewayCard — Post-Result Human Review Gateway.
 *
 * This is a post-result gateway (NOT Layer 6).
 * Uses public/media/v3/trust/human-review.mp4 with static poster fallback.
 */
export default function AskExpertGatewayCard({
  claim = "",
  trustVerdict = "",
  onRequestExpert,
}) {
  const [requested, setRequested] = useState(false);

  const handleRequest = () => {
    setRequested(true);
    onRequestExpert?.({ claim, trustVerdict });
  };

  return (
    <div className="optical-reticle-box p-5 mt-6 border border-cyan-500/20 bg-[#121720] rounded-lg">
      <div className="crosshair-corner crosshair-tl" />
      <div className="crosshair-corner crosshair-tr" />
      <div className="crosshair-corner crosshair-bl" />
      <div className="crosshair-corner crosshair-br" />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        <div className="md:col-span-5 relative rounded-md overflow-hidden border border-white/10 aspect-video bg-black/40">
          <video
            autoPlay
            loop
            muted
            playsInline
            poster="/media/v3/trust/human-review-poster.webp"
            src="/media/v3/trust/human-review.mp4"
            className="w-full h-full object-cover"
          />
          <img
            src="/media/v3/trust/human-review-poster.webp"
            alt="Human review preview"
            className="video-fallback-poster hidden w-full h-full object-cover"
          />
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm border border-cyan-500/30 text-[10px] font-mono text-cyan-300">
            POST-RESULT GATEWAY
          </div>
        </div>

        <div className="md:col-span-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-1 rounded bg-cyan-500/10 text-cyan-400">
                <Users size={15} />
              </span>
              <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-semibold">
                YÊU CẦU GIÁM ĐỊNH CHUYÊN GIA
              </span>
            </div>

            <h3 className="font-serif text-lg text-slate-100 font-normal">
              Cần đối soát chuyên môn độc lập từ Hội đồng?
            </h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Trường hợp bằng chứng còn mâu thuẫn hoặc chưa đủ tài liệu số, bạn có thể chuyển tiếp hồ sơ Trust này tới các chuyên gia đã xác minh đúng chuyên ngành.
            </p>

            {claim && (
              <div className="mt-2.5 p-2 rounded bg-[#1A2230] border border-white/5 text-xs text-slate-300 truncate">
                <span className="text-slate-400 font-mono">Hồ sơ: </span>
                <span className="italic">"{claim}"</span>
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {requested ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                <CheckCircle2 size={14} /> Đã gửi yêu cầu giám định tới Hội đồng Chuyên gia
              </div>
            ) : (
              <button
                type="button"
                onClick={handleRequest}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 text-xs font-semibold tracking-wide transition-all cursor-pointer"
              >
                <UserCheck size={14} /> Gửi yêu cầu thẩm định <ArrowRight size={13} />
              </button>
            )}

            <Link
              href="/expert"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 font-mono transition-colors"
            >
              <ShieldCheck size={13} /> Tra cứu thẩm quyền Hội đồng
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
