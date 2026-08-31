"use client";

import React, { useMemo, useState } from "react";
import { List, Network, Search, ZoomIn, ZoomOut } from "lucide-react";

const nodeTone = {
  INPUT: "var(--accent-primary)",
  CLAIM: "var(--ai)",
  SOURCE: "var(--info)",
  COMMUNITY: "var(--community)",
  EXPERT: "var(--expert)",
};

const positions = [
  [50, 50], [23, 24], [76, 22], [19, 73], [79, 71], [50, 13], [49, 86], [10, 46], [90, 47],
];

const relationshipLabel = {
  contains: "chứa luận điểm",
  supported_by: "được hỗ trợ bởi",
  reported_by: "được báo cáo bởi",
  reviewed_by: "được rà soát bởi",
  related_case: "case liên quan",
};

export default function TrustGraph2D({ graph }) {
  const [mode, setMode] = useState("graph");
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("ALL");
  const [selectedId, setSelectedId] = useState(graph.nodes[0]?.id || null);
  const [zoom, setZoom] = useState(1);
  const nodes = useMemo(() => graph.nodes.map((node, index) => ({ ...node, position: positions[index % positions.length] })), [graph.nodes]);
  const visible = nodes.filter((node) => (kind === "ALL" || node.kind === kind) && node.label.toLowerCase().includes(query.toLowerCase()));
  const visibleIds = new Set(visible.map((node) => node.id));
  const selected = visible.find((node) => node.id === selectedId) || visible[0];
  const connectedIds = (() => {
    if (!selected?.id) return new Set();
    const ids = new Set([selected.id]);
    graph.edges.forEach((edge) => {
      if (edge.from === selected.id) ids.add(edge.to);
      if (edge.to === selected.id) ids.add(edge.from);
    });
    return ids;
  })();
  const visibleKinds = [...new Set(visible.map((node) => node.kind))];

  return (
    <section className="intelligence-panel overflow-hidden" aria-labelledby="trustgraph-title">
      <div className="panel-heading flex-wrap gap-3">
        <div>
          <p className="product-kicker">Visual signature</p>
          <h2 id="trustgraph-title" className="product-section-title">StudentHub TrustGraph</h2>
          <p className="product-copy mt-1">Quan hệ chỉ xuất hiện khi pipeline trả về dữ liệu tương ứng.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className={`icon-button ${mode === "graph" ? "is-selected" : ""}`} onClick={() => setMode("graph")} aria-pressed={mode === "graph"} aria-label="Xem đồ thị"><Network size={16} /></button>
          <button type="button" className={`icon-button ${mode === "list" ? "is-selected" : ""}`} onClick={() => setMode("list")} aria-pressed={mode === "list"} aria-label="Xem danh sách"><List size={16} /></button>
        </div>
      </div>
      <div className="graph-toolbar">
        <label className="graph-search"><Search size={15} /><span className="sr-only">Tìm node</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm claim hoặc nguồn" /></label>
        <div className="flex gap-2 overflow-x-auto">
          {["ALL", "INPUT", "CLAIM", "SOURCE"].map((item) => <button type="button" key={item} aria-pressed={kind === item} onClick={() => setKind(item)} className={`filter-chip ${kind === item ? "is-active" : ""}`}>{item === "ALL" ? "Tất cả" : item}</button>)}
        </div>
      </div>
      <div className="graph-legend" aria-label="Chú giải loại node">{visibleKinds.map((item) => <span key={item}><i style={{ "--node-color": nodeTone[item] || "var(--text-muted)" }} />{item}</span>)}</div>
      {mode === "graph" ? (
        <div className="graph-layout">
          <div className="trust-graph-canvas" aria-label="Đồ thị quan hệ bằng chứng">
            <div className="graph-zoom-controls"><button type="button" onClick={() => setZoom((value) => Math.min(1.4, value + .1))} aria-label="Phóng to"><ZoomIn size={15} /></button><button type="button" onClick={() => setZoom((value) => Math.max(.75, value - .1))} aria-label="Thu nhỏ"><ZoomOut size={15} /></button></div>
            <div className="graph-stage" style={{ transform: `scale(${zoom})` }}>
              <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
                {graph.edges.filter((edge) => visibleIds.has(edge.from) && visibleIds.has(edge.to)).map((edge) => {
                  const from = nodes.find((node) => node.id === edge.from)?.position;
                  const to = nodes.find((node) => node.id === edge.to)?.position;
                  const related = !selected || edge.from === selected.id || edge.to === selected.id;
                  return from && to ? <g key={`${edge.from}-${edge.to}`} className={related ? "is-related" : "is-dimmed"}><title>{relationshipLabel[edge.label] || edge.label}</title><line x1={`${from[0]}%`} y1={`${from[1]}%`} x2={`${to[0]}%`} y2={`${to[1]}%`} className="graph-edge" /></g> : null;
                })}
              </svg>
              {visible.map((node) => <button type="button" key={node.id} aria-pressed={selectedId === node.id} onClick={() => setSelectedId(node.id)} className={`graph-node ${selectedId === node.id ? "is-selected" : ""} ${selected && !connectedIds.has(node.id) ? "is-dimmed" : ""}`} style={{ left: `${node.position[0]}%`, top: `${node.position[1]}%`, "--node-color": nodeTone[node.kind] || "var(--text-muted)" }}><span>{node.kind}</span><strong>{node.label}</strong></button>)}
            </div>
          </div>
          <aside className="node-inspector" aria-live="polite">
            <p className="product-kicker">Node inspector</p>
            {selected ? <><span className="signal-badge mt-3">{selected.kind}</span><h3 className="mt-4 text-base font-bold text-app-primary">{selected.label}</h3><p className="product-copy mt-2">{selected.detail || "Không có mô tả bổ sung."}</p><div className="mt-5 border-t border-white/8 pt-4"><span className="data-label">Quan hệ trực tiếp</span><p className="mt-2 text-xs text-app-muted">{graph.edges.filter((edge) => edge.from === selected.id || edge.to === selected.id).map((edge) => relationshipLabel[edge.label] || edge.label).join(" · ") || "Chưa có"}</p></div></> : <p className="product-copy mt-3">Không tìm thấy node phù hợp.</p>}
          </aside>
        </div>
      ) : (
        <div className="divide-y divide-white/8" role="list">{visible.length ? visible.map((node) => { const relationships = graph.edges.filter((edge) => edge.from === node.id || edge.to === node.id).map((edge) => edge.label); return <div role="listitem" key={node.id}><button type="button" aria-pressed={selectedId === node.id} onClick={() => setSelectedId(node.id)} className="graph-list-row"><span className="signal-badge">{node.kind}</span><span><strong>{node.label}</strong><small>{node.detail}</small><small>Quan hệ: {relationships.join(" · ") || "Chưa có"}</small></span></button></div>; }) : <div className="empty-state m-4">Không tìm thấy node phù hợp.</div>}</div>
      )}
    </section>
  );
}
