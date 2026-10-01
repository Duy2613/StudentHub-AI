"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { History } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRealtime } from "@/components/providers/RealtimeContext";
import { trustApi } from "@/lib/api/trust";
import { trustV5ResponseSchema } from "@/lib/api/schemas/trust";
import { apiRequest } from "@/lib/api/runtimeClient";
import { createSecureId } from "@/lib/security/secureId";
import { advancesTrustSnapshot, hasFixtureMarker, isUuid, projectTrust, safeTrustUrl, sameTrustIdentity, trustFailure } from "@/lib/trust/trustV4Model";
import TrustV4Result, { TrustDate } from "./TrustV4Result";
import TrustMasterUltraJourney from "./TrustMasterUltraJourney";
import styles from "./trust-v4.module.css";

const LIMIT = 20000;
const MODES = ["text", "url", "image", "qr"];

function mark(name) {
  if (typeof window !== "undefined" && window.__trustV4Harness && !performance.getEntriesByName(`trust-v4:${name}`).length) performance.mark(`trust-v4:${name}`);
}

function projectSavedTrustResult(caseRecord) {
  const saved = caseRecord?.savedResult;
  if (saved?.schemaVersion !== "trust.case.snapshot.v2"
    || !saved.pipeline || typeof saved.pipeline !== "object"
    || !isUuid(caseRecord?.id) || !Number.isInteger(Number(saved.caseRevision))
    || Number(saved.caseRevision) < 1 || typeof saved.runId !== "string") return null;
  try {
    const requestId = typeof saved.pipeline.requestId === "string" && saved.pipeline.requestId
      ? saved.pipeline.requestId
      : "saved-" + caseRecord.id + "-" + saved.caseRevision;
    return projectTrust({
      requestId,
      data: saved.pipeline,
      caseId: caseRecord.id,
      caseRevision: Number(saved.caseRevision),
      runId: saved.runId,
      persistence: {
        persisted: true,
        caseId: caseRecord.id,
        caseRevision: Number(saved.caseRevision),
        runId: saved.runId,
      },
    });
  } catch {
    return null;
  }
}

function SavedCases({ initialId, revision, onClose }) {
  const [state, setState] = useState({ status: "loading", rows: [], detail: null });
  const [selected, setSelected] = useState(initialId || "");
  useEffect(() => {
    const controller = new AbortController();
    apiRequest("/api/v1/trust/cases?limit=50", { signal: controller.signal, cache: "no-store" })
      .then((payload) => { if (!controller.signal.aborted) setState((current) => ({ ...current, status: "ready", rows: Array.isArray(payload.cases) ? payload.cases : [] })); })
      .catch(() => { if (!controller.signal.aborted) setState({ status: "error", rows: [], detail: null }); });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (!isUuid(selected)) return;
    const controller = new AbortController();
    const revisionParam = selected === initialId && /^\d+$/.test(String(revision || ""))
      ? "?caseRevision=" + encodeURIComponent(revision)
      : "";
    apiRequest("/api/v1/trust/cases/" + encodeURIComponent(selected) + revisionParam, { signal: controller.signal, cache: "no-store" })
      .then((payload) => { if (!controller.signal.aborted) setState((s) => ({ ...s, detail: { id: selected, value: payload.case, failed: false } })); })
      .catch(() => { if (!controller.signal.aborted) setState((s) => ({ ...s, detail: { id: selected, value: null, failed: true } })); });
    return () => controller.abort();
  }, [selected, initialId, revision]);
  const metadata = state.rows.find((r) => r.id === selected);
  const detail = state.detail?.id === selected ? state.detail : null;
  const restoredModel = projectSavedTrustResult(detail?.value);
  const restoredRevision = detail?.value?.savedResult?.caseRevision;
  const restoredSnapshot = restoredModel ? {
    label: (metadata?.input_type || "Hồ sơ kiểm chứng") + " · phiên bản " + restoredRevision,
  } : null;
  return <section className={styles.section} aria-label="Hồ sơ kiểm chứng đã lưu"><div className={styles.sectionHeading}><h2>Hồ sơ đã lưu</h2><button type="button" className={styles.textButton} onClick={onClose}>Đóng hồ sơ</button></div>
    {state.status === "loading" && <p role="status">Đang đọc hồ sơ được phép xem…</p>}{state.status === "error" && <p role="alert">Không đọc được danh sách hồ sơ. Hãy kiểm tra phiên đăng nhập và quyền truy cập.</p>}
    {state.status === "ready" && !state.rows.length && <p>Chưa có hồ sơ trong danh sách được trả về.</p>}
    <div className={styles.caseList}>{state.rows.map((row) => <button key={row.id} type="button" aria-pressed={selected === row.id} onClick={() => setSelected(row.id)}>{row.input_type || "Hồ sơ kiểm chứng"} · Phiên bản {row.case_revision ?? "chưa rõ"}<TrustDate value={row.created_at} /></button>)}</div>
    {selected && !detail && <p role="status">Đang đọc chi tiết…</p>}{detail?.failed && <p role="alert">Hồ sơ không khả dụng hoặc bạn không có quyền xem.</p>}
    {detail?.value && <div className={styles.evidence}>{revision && metadata?.case_revision && Number(revision) < metadata.case_revision && <p className={styles.caution}>Liên kết mở phiên bản {revision}; hồ sơ hiện có phiên bản {metadata.case_revision}. Kết luận cũ không được trình bày như kết quả mới nhất.</p>}<h3>Nội dung được phép xem</h3>{restoredModel ? <><p className={styles.note}>Phiên bản {restoredRevision} · lần chạy {detail.value.savedResult.runId}</p><TrustV4Result model={restoredModel} snapshot={restoredSnapshot} stale={false} previous={false} authenticated={false} onEdit={() => {}} readOnly /></> : <>{(detail.value.claims || []).map((c, i) => <p key={`${c.id}-${i}`}>{c.statement}</p>)}<p className={styles.note}>Không có kết quả công khai đã lưu cho phiên bản này. Không tái dựng kết luận từ danh sách bằng chứng.</p></>}</div>}
  </section>;
}

function TrustSession({ authenticated }) {
  const query = useSearchParams();
  const initialMode = MODES.includes(query.get("mode")) ? query.get("mode") : "text";
  const routeCaseId = isUuid(query.get("caseId")) ? query.get("caseId") : null;
  const [mode, setMode] = useState(initialMode);
  const [content, setContent] = useState("");
  const [fileData, setFileData] = useState(null);
  const [filePending, setFilePending] = useState(false);
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);
  const [streamPayload, setStreamPayload] = useState(null);
  const [result, setResult] = useState(null);
  const [activeSnapshot, setActiveSnapshot] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [history, setHistory] = useState(Boolean(routeCaseId));
  const [freshness, setFreshness] = useState(null);
  const [cooldown, setCooldown] = useState(0);
  const controller = useRef(null);
  const sequence = useRef(0);
  const fileSequence = useRef(0);
  const fileInputRef = useRef(null);
  const retryIdentity = useRef(null);
  const resultRef = useRef(null);
  const { subscribe, connectionStatus } = useRealtime();

  useEffect(() => { mark("input-commit"); return () => { sequence.current += 1; fileSequence.current += 1; controller.current?.abort(); }; }, []);
  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => setCooldown(0), cooldown * 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);
  useEffect(() => {
    const caseId = result?.model.caseId;
    if (!caseId || !authenticated) return;
    const abort = new AbortController();
    let generation = 0;
    const refresh = async (event) => {
      const body = event?.data || event?.payload || event;
      if (body?.caseId && body.caseId !== caseId) return;
      const current = ++generation;
      try {
        const payload = await apiRequest("/api/v1/trust/cases?limit=50", { signal: abort.signal, cache: "no-store" });
        if (abort.signal.aborted || current !== generation) return;
        const row = payload.cases?.find((r) => r.id === caseId);
        setFreshness(row && Number.isInteger(row.case_revision) ? { caseId, revision: row.case_revision } : null);
      } catch { if (!abort.signal.aborted) setFreshness(null); }
    };
    const unsubscribe = subscribe("trust", "*", refresh);
    if (connectionStatus === "CONNECTED") void refresh();
    return () => { abort.abort(); unsubscribe(); };
  }, [result?.model.caseId, authenticated, subscribe, connectionStatus]);

  const chooseFile = async (file) => {
    const version = ++fileSequence.current;
    setError(null); setFileData(null); setFilePending(false);
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 8 * 1024 * 1024 || !file.size) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      setError({ message: "Chọn ảnh PNG, JPG hoặc WebP, có nội dung và không quá 8 MB." }); return;
    }
    setFilePending(true);
    try {
      const bytes = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); });
      if (version === fileSequence.current) setFileData({ name: file.name, type: file.type, size: file.size, bytes });
    } catch { if (version === fileSequence.current) setError({ message: "Không đọc được ảnh. Hãy chọn lại tập tin." }); }
    finally { if (version === fileSequence.current) setFilePending(false); }
  };

  const submit = async (event) => {
    event.preventDefault();
    if (controller.current || filePending || cooldown) return;
    const imageMode = mode === "image" || mode === "qr";
    const draft = content.trim();
    if ((!imageMode && !draft) || draft.length > LIMIT || (imageMode && !fileData)) { setError({ message: imageMode ? "Chọn một ảnh trước khi kiểm chứng." : `Nhập nội dung từ 1 đến ${LIMIT.toLocaleString("vi-VN")} ký tự.` }); return; }
    if (mode === "url" && !safeTrustUrl(draft)) { setError({ message: "Nhập đường dẫn HTTP hoặc HTTPS, không chứa thông tin đăng nhập hay mã bí mật." }); return; }
    const identityKey = `${mode}:${draft}:${imageMode ? fileData.bytes : ""}`;
    const idempotencyKey = retryIdentity.current?.key === identityKey ? retryIdentity.current.id : createSecureId("trust-v4");
    retryIdentity.current = { key: identityKey, id: idempotencyKey };
    const requestId = createSecureId("trust-request");
    const active = { requestId };
    const abort = new AbortController(); controller.current = abort;
    const current = ++sequence.current;
    const snapshot = { mode, content: draft, file: imageMode ? fileData.bytes : null, label: imageMode ? fileData.name : draft };
    setPending(true); setError(null); setStreamPayload(null); setActiveSnapshot(snapshot);
    let last = null;
    try {
      const response = await trustApi.sequential({ type: mode, content: draft, metadata: imageMode ? { inputKind: mode === "qr" ? "QR" : "IMAGE", bytes: fileData.bytes, mimeType: fileData.type, fileName: fileData.name, fileSize: fileData.size } : { inputKind: mode.toUpperCase() } }, abort.signal, (incoming) => {
        if (current !== sequence.current || abort.signal.aborted || !incoming?.data) return;
        if (!sameTrustIdentity(incoming, active) || hasFixtureMarker(incoming)) return;
        const parsed = trustV5ResponseSchema.safeParse({ success: true, contractVersion: "trust.v5", version: "v5", demo: false, ...incoming });
        if (!parsed.success || !advancesTrustSnapshot(parsed.data.data, last)) return;
        for (const key of ["caseId", "caseRevision", "runId"]) if (parsed.data[key] != null) active[key] = parsed.data[key];
        last = parsed.data.data;
        setStreamPayload(parsed.data.data); mark("processing-commit");
      }, requestId, idempotencyKey);
      if (current !== sequence.current || abort.signal.aborted) return;
      if (!sameTrustIdentity(response, active) || !advancesTrustSnapshot(response.data, last)) throw new Error("IDENTITY_MISMATCH");
      const model = projectTrust(response);
      if (["FAILED", "CANCELLED"].includes(model.state)) throw new Error("SERVER_ERROR");
      setResult({ model, payload: response.data, snapshot }); setFreshness(null);
      retryIdentity.current = null; mark("result-ready");
      requestAnimationFrame(() => resultRef.current?.focus());
    } catch (caught) {
      if (current !== sequence.current || abort.signal.aborted) return;
      const code = caught.code || caught.message;
      setError({ message: trustFailure(code), code });
      if (caught.retryAfter > 0) setCooldown(Math.min(caught.retryAfter, 3600));
    } finally { if (current === sequence.current) { controller.current = null; setPending(false); } }
  };
  const changeMode = (nextMode) => {
    if (mode !== nextMode && (mode === "image" || mode === "qr" || nextMode === "image" || nextMode === "qr")) {
      fileSequence.current += 1;
      setFileData(null);
      setFilePending(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
    setMode(nextMode);
    setDragging(false);
    setError(null);
  };
  const clearSelectedFile = () => {
    fileSequence.current += 1;
    setFileData(null);
    setFilePending(false);
    setDragging(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const startNewAnalysis = () => {
    setResult(null);
    setStreamPayload(null);
    setActiveSnapshot(null);
    setError(null);
    setFreshness(null);
  };
  const resetDraft = () => {
    if (pending) return;
    setContent("");
    clearSelectedFile();
    setError(null);
  };
  const runAnalysis = () => { void submit({ preventDefault() {} }); };
  const payload = result?.payload || streamPayload;
  const layers = payload?.layerResults || payload?.layers || {};
  const observedInput = result?.snapshot || activeSnapshot || {
    mode,
    content: mode === "image" || mode === "qr" ? fileData?.name || "" : content,
    label: mode === "image" || mode === "qr" ? fileData?.name || "" : content,
  };
  const summaryInput = result?.snapshot || activeSnapshot;
  const stale = Boolean(result && (result.snapshot.mode !== mode
    || result.snapshot.content !== content.trim()
    || result.snapshot.file !== ((mode === "image" || mode === "qr") ? fileData?.bytes || null : null)));
  return <div id="trust-main" className={styles.workspace} data-testid="trust-v4">
    <header className={styles.header}><div><p className={styles.eyebrow}>StudentHub · Kiểm chứng</p><h1>Hiểu rõ trước khi tin.</h1><p>Đặt câu hỏi. Đối chiếu nguồn. Nhìn thấy điều còn chưa rõ.</p></div><button type="button" className={styles.historyButton} aria-expanded={history} onClick={() => setHistory(!history)}><History size={17} />Hồ sơ đã lưu</button></header>
    {history && (authenticated ? <SavedCases key={`${routeCaseId || result?.model.caseId || "latest"}:${query.get("caseRevision") || ""}`} initialId={routeCaseId || result?.model.caseId} revision={query.get("caseRevision")} onClose={() => setHistory(false)} /> : <p className={styles.caution}>Đăng nhập để xem hồ sơ kiểm chứng đã lưu.</p>)}
    {freshness?.caseId === result?.model.caseId && freshness?.revision > result?.model.caseRevision && <p className={styles.caution}>Hồ sơ đã có phiên bản {freshness.revision}. Kết quả đang xem thuộc phiên bản {result.model.caseRevision}. <button type="button" className={styles.textButton} onClick={() => setHistory(true)}>Xem hồ sơ</button></p>}
    <div ref={resultRef} tabIndex={-1}>
      <TrustMasterUltraJourney
        key={result?.model.requestId || "trust-current-input"}
        mode={mode}
        content={content}
        file={fileData}
        preview={fileData?.bytes || null}
        dragging={dragging}
        processing={pending}
        error={error}
        ocr={layers.layer1?.metadata || layers.layer1 || null}
        hasResult={Boolean(result)}
        analysisSummary={summaryInput ? { type: String(summaryInput.mode || mode).toUpperCase(), label: summaryInput.label || summaryInput.content } : null}
        pipeline={payload}
        canonicalResult={payload?.canonicalResult || null}
        layers={layers}
        presentation={payload?.presentation || null}
        sourceProvenance={payload?.sourceProvenance || payload?.provenance || null}
        providers={payload?.providerObservations || []}
        input={{ type: String(observedInput.mode || mode).toUpperCase(), content: observedInput.label || observedInput.content || "" }}
        fileInputRef={fileInputRef}
        onModeChange={changeMode}
        onContentChange={setContent}
        onFileSelect={(file) => { void chooseFile(file); }}
        onDragStateChange={setDragging}
        onClearFile={clearSelectedFile}
        onAnalyze={runAnalysis}
        onReset={resetDraft}
        onNewAnalysis={startNewAnalysis}
        onPrint={() => window.print()}
        resultModel={result?.model || null}
        authenticated={authenticated}
        stale={stale}
      />
    </div>
  </div>;
}

export default function TrustV4Workspace() {
  const { session, ready, isAuthenticated } = useAuth();
  const query = useSearchParams();
  // Principal changes synchronously remount all private drafts, responses,
  // dialogs and in-flight work instead of leaving an old user's view visible.
  // Exact-case navigation inside the mounted Trust route refreshes the saved-case view.
  return <TrustSession key={`${ready ? session?.user?.id || "anonymous" : "resolving"}:${query.get("caseId") || ""}`} authenticated={Boolean(ready && isAuthenticated)} />;
}
