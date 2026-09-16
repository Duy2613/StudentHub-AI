"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, MessageCircle, Network, ShieldCheck } from "lucide-react";
import V3_MEDIA from "@/lib/media/v3MediaRegistry";

function evidenceCount(post) {
  const mediaCount = Array.isArray(post?.media) ? post.media.length : 0;
  const sourceCount = Array.isArray(post?.sources) ? post.sources.length : Number(post?.sourceCount || 0);
  return mediaCount + sourceCount;
}

function trustHref(post) {
  const scope = post?.trustCase || post?.caseScope || null;
  if (!scope?.caseId) return null;
  const revision = Number.isInteger(Number(scope.caseRevision)) ? Number(scope.caseRevision) : null;
  return revision === null
    ? `/trust?caseId=${encodeURIComponent(scope.caseId)}`
    : `/trust?caseId=${encodeURIComponent(scope.caseId)}&caseRevision=${revision}`;
}

function postHref(post) {
  return post?.postId ? `/community/${encodeURIComponent(post.postId)}` : "/community";
}

function readableNumber(value) {
  return Number.isFinite(Number(value)) ? String(Math.max(0, Number(value))) : "Chưa có dữ liệu";
}

function EvidenceMetric({ label, value, detail }) {
  return (
    <div className="community-evidence-metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}

export function CommunityEditorialStory({ posts = [], signals = null }) {
  const featured = posts[0] || null;
  const related = posts.slice(1, 3);
  const trustLink = trustHref(featured);
  const sourceCount = featured ? (Array.isArray(featured.sources) ? featured.sources.length : Number(featured.sourceCount || 0)) : 0;
  const commentCount = featured ? Number(featured.commentCount || featured.comments?.length || 0) : 0;
  const evidence = featured ? evidenceCount(featured) : 0;
  const hasExpertResponse = Boolean(featured?.expertResponse);
  const trustProjection = featured?.trustCase || featured?.caseScope || null;
  const trustLayers = Array.isArray(trustProjection?.layers) ? trustProjection.layers : [];

  return (
    <section className="community-story" id="community-story" aria-labelledby="community-story-title">
      <div className="community-story-heading">
        <div>
          <span className="community-kicker">Featured discussion</span>
          <h2 id="community-story-title">Một câu hỏi, nhiều lớp đối soát</h2>
          <p>Community giữ lại câu hỏi, bối cảnh và nguồn để mọi người đọc được cách một hiểu biết chung hình thành.</p>
        </div>
        <div className="community-story-signal" aria-label="Tín hiệu dữ liệu hiện tại">
          <Network size={16} aria-hidden="true" />
          <span>{signals?.questions ? `${signals.questions} câu hỏi đang hiển thị` : "Đang chờ dữ liệu công khai"}</span>
        </div>
      </div>

      {!featured ? (
        <div className="community-story-empty">
          {/* This is a real v3 asset. It is used as the calm visual surface for a truthful empty state. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={V3_MEDIA.shared.emptyCommunity} alt="Không gian trống dành cho cuộc thảo luận đầu tiên" loading="lazy" />
          <div>
            <span className="community-kicker">Featured discussion</span>
            <h3>Không có cuộc thảo luận nào ở đây, chưa thôi.</h3>
            <p>Dữ liệu bài đăng công khai chưa trả về. Khi có bài mới, câu hỏi đầu tiên sẽ xuất hiện ở đây.</p>
          </div>
        </div>
      ) : (
        <div className="community-featured-grid">
          <article className="community-featured-post">
            <figure className="community-featured-media">
              {/* The asset is a visual entry point for the evidence layer, not evidence for this post. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={V3_MEDIA.community.evidencePost} alt="Minh họa một bài đăng cộng đồng có lớp bằng chứng" loading="lazy" />
              <figcaption>Không gian minh họa cho lớp bằng chứng đính kèm</figcaption>
            </figure>
            <div className="community-featured-copy">
              <div className="community-post-context">
                <span>{featured.topic || "Cộng đồng"}</span>
                {featured.location && <span>{featured.location}</span>}
                {featured.status && <span>{featured.status}</span>}
              </div>
              <h3><Link href={postHref(featured)}>{featured.title || "Câu hỏi từ cộng đồng"}</Link></h3>
              <p>{featured.content || "Bài đăng chưa có nội dung công khai."}</p>
              <div className="community-evidence-metrics" aria-label="Các tín hiệu của bài đăng">
                <EvidenceMetric label="Evidence attached" value={readableNumber(evidence)} detail={evidence > 0 ? "tệp hoặc nguồn đã gắn" : "chưa có đính kèm"} />
                <EvidenceMetric label="Discussion depth" value={readableNumber(commentCount)} detail="bình luận công khai" />
                <EvidenceMetric label="Source count" value={readableNumber(sourceCount)} detail={sourceCount > 0 ? "nguồn được công bố" : "chưa có nguồn"} />
                <EvidenceMetric label="Expert response" value={hasExpertResponse ? "Có" : "Chưa có"} detail={hasExpertResponse ? "dữ liệu phản hồi công khai" : "chưa có projection"} />
              </div>
              {trustLink && <div className="community-trust-projection"><span>Trust verdict projection</span><strong>{trustProjection?.verdict || trustProjection?.status || "Verdict chưa công bố"}</strong>{trustLayers.length ? <div>{trustLayers.slice(0, 5).map((layer, index) => <small key={layer.id || layer.layer || index}>{layer.id || layer.layer || `L${index + 1}`}: {layer.status || "Chưa công bố"}</small>)}</div> : <small>L1 đến L5 chưa được trả về trong projection này.</small>}</div>}
              <div className="community-featured-actions">
                <Link href={postHref(featured)} className="primary-action">Đọc luồng thảo luận <ArrowRight size={15} /></Link>
                {trustLink && <Link href={trustLink} className="text-link"><ShieldCheck size={15} /> Mở Trust case</Link>}
              </div>
            </div>
          </article>

          <aside className="community-live-signals" aria-labelledby="community-live-signals-title">
            <div className="community-panel-heading">
              <span className="community-kicker">Live signals</span>
              <h3 id="community-live-signals-title">Tín hiệu đang mở</h3>
            </div>
            <dl className="community-signal-list">
              <div><dt><MessageCircle size={14} /> Câu hỏi đang đọc</dt><dd>{readableNumber(signals?.questions || posts.length)}</dd></div>
              <div><dt><BookOpen size={14} /> Bài có evidence</dt><dd>{readableNumber(signals?.evidence)}</dd></div>
              <div><dt><ShieldCheck size={14} /> Phản hồi chuyên gia</dt><dd>{readableNumber(signals?.expert)}</dd></div>
            </dl>
            <div className="community-signal-note">
              <span>Không có dữ liệu live</span>
              <p>Các con số chỉ xuất hiện khi API trả về projection tương ứng.</p>
            </div>
            {related.length > 0 && (
              <div className="community-related-mini">
                <span className="community-kicker">More from the feed</span>
                {related.map((post) => (
                  <Link href={postHref(post)} key={post.postId}>
                    <span>{post.topic || "Cộng đồng"}</span>
                    <strong>{post.title || "Bài đăng cộng đồng"}</strong>
                  </Link>
                ))}
              </div>
            )}
          </aside>
        </div>
      )}
    </section>
  );
}

export function CommunityLiveQuestions({ posts = [] }) {
  const questions = posts.filter((post) => ["OPEN", "UNRESOLVED", "PENDING"].includes(String(post?.status || "").toUpperCase())).slice(0, 4);
  return (
    <section className="community-live-questions" aria-labelledby="community-live-questions-title">
      <div className="community-live-questions-heading">
        <div>
          <span className="community-kicker">Live academic questions</span>
          <h2 id="community-live-questions-title">Những câu hỏi chưa khép lại</h2>
          <p>Chỉ những bài có trạng thái mở do server trả về mới xuất hiện trong lớp này.</p>
        </div>
        <Link href="/expert" className="text-link">Tìm chuyên gia <ArrowRight size={15} /></Link>
      </div>
      {questions.length > 0 ? (
        <div className="community-question-grid">
          {questions.map((post) => (
            <Link href={postHref(post)} className="community-question-card" key={post.postId}>
              <span>{post.topic || "Cộng đồng"}</span>
              <strong>{post.title || "Câu hỏi chưa có tiêu đề"}</strong>
              <small>{Number(post.commentCount || 0)} bình luận công khai</small>
            </Link>
          ))}
        </div>
      ) : (
        <div className="community-question-empty">
          <div>
            <span className="community-kicker">Open questions</span>
            <strong>Chưa có trạng thái câu hỏi mở trong dữ liệu hiện tại.</strong>
            <p>Không suy ra trạng thái từ số lượt thích hoặc số bình luận.</p>
          </div>
          <Link href="/community" className="text-link">Xem toàn bộ Community <ArrowRight size={15} /></Link>
        </div>
      )}
      <div className="community-cross-pillar-note">
        <img src={V3_MEDIA.community.expertResponse} alt="Minh họa khu vực phản hồi chuyên gia" loading="lazy" />
        <div>
          <span className="community-kicker">Qualified context</span>
          <strong>Phản hồi chuyên gia là một lớp dữ liệu riêng.</strong>
          <p>{questions.some((post) => post?.expertResponse) ? "Một số câu hỏi đã có projection phản hồi công khai." : "Chưa có projection phản hồi chuyên gia cho dữ liệu đang hiển thị."}</p>
        </div>
        <Link href="/expert" aria-label="Mở danh bạ chuyên gia"><ArrowRight size={18} /></Link>
      </div>
    </section>
  );
}

export default CommunityEditorialStory;
