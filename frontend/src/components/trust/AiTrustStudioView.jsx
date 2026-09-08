"use client";

import React, { useCallback, useEffect, useReducer, useRef, useState } from "react";
import Image from "next/image";
import {
  ArrowRight,
  ClipboardPaste,
  FileImage,
  Globe2,
  Image as ImageIcon,
  LoaderCircle,
  ScanSearch,
  ShieldAlert,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import { ApiError, apiErrorMessage } from "@/lib/api/errors";
import { COMPETITION_DEMO_CASES } from "@/lib/trust/competitionDemoCases";
import { createWorkIdentity } from "@/lib/ui-state/model";
import StateBoundary from "@/components/ui/StateBoundary";
import SourceDisclosure from "@/components/ui/SourceDisclosure";
import { getRuntimeProviderBundle } from "@/lib/backend/runtimeProvider";
import SequentialFourLayerHUD from "./SequentialFourLayerHUD";
import {
  SEQUENTIAL_STATE,
  createInitialSequentialState,
  sequentialStateReducer,
} from "@/lib/ai-trust/sequential/SequentialTrustStateMachine";

function stageOperationStatus(pipeline, stageId) {
  return String(pipeline?.stages?.[stageId]?.operationStatus || "").toUpperCase();
}

function stageWasSkipped(pipeline, stageId) {
  const status = stageOperationStatus(pipeline, stageId);
  return status === "SKIPPED" || status === "BLOCKED";
}

const EMPTY_LAYERS = Object.freeze({ layer1: null, layer2: null, layer3: null, layer4: null });

export function AiTrustStudioView() {
  const demoEnabled = process.env.NEXT_PUBLIC_COMPETITION_DEMO === "true";
  const [mode, setMode] = useState("url");
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [ocr, setOcr] = useState(null);
  const [confirmedEntities, setConfirmedEntities] = useState([]);
  const [layers, setLayers] = useState(EMPTY_LAYERS);
  const [seqState, dispatchSeq] = useReducer(sequentialStateReducer, undefined, createInitialSequentialState);
  const [demoCaseId, setDemoCaseId] = useState(null);
  const [providerResult, setProviderResult] = useState(null);
  const [sourceProvenance, setSourceProvenance] = useState(null);

  const fileInput = useRef(null);
  const activeScan = useRef(null);
  const scanSequence = useRef(0);

  const acceptFile = useCallback((nextFile) => {
    setError(null);
    if (!nextFile || !["image/png", "image/jpeg", "image/webp"].includes(nextFile.type)) {
      return setError({ message: "Định dạng này chưa được hỗ trợ. Hãy chọn PNG, JPG hoặc WEBP.", code: "VALIDATION" });
    }
    if (nextFile.size > 8 * 1024 * 1024) {
      return setError({ message: "Ảnh vượt quá giới hạn 8 MB.", code: "PAYLOAD_TOO_LARGE" });
    }
    if (preview) URL.revokeObjectURL(preview);
    setFile(nextFile);
    setPreview(URL.createObjectURL(nextFile));
    setOcr(null);
    setConfirmedEntities([]);
  }, [preview]);

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);
  useEffect(() => () => activeScan.current?.abort("component-unmounted"), []);
  useEffect(() => {
    const onPaste = (event) => {
      const image = [...(event.clipboardData?.files || [])].find((item) => item.type.startsWith("image/"));
      if (image) acceptFile(image);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [acceptFile]);

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    scanSequence.current += 1;
    activeScan.current?.abort("reset");
    dispatchSeq({ type: "RESET" });
    setFile(null);
    setPreview(null);
    setContent("");
    setError(null);
    setOcr(null);
    setConfirmedEntities([]);
    setDemoCaseId(null);
    setProviderResult(null);
    setSourceProvenance(null);
    setLayers({ ...EMPTY_LAYERS });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const analyze = async () => {
    activeScan.current?.abort("superseded-by-new-scan");
    const controller = new AbortController();
    activeScan.current = controller;
    const scanId = ++scanSequence.current;
    setError(null);
    setProcessing(true);
    setProviderResult(null);
    setSourceProvenance(null);
    setLayers({ ...EMPTY_LAYERS });
    dispatchSeq({ type: "START", payload: { requestId: `scan-${scanId}` } });

    let extracted = content.trim();

    try {
      // 1. Demo Mode Fixtures
      const demoCase = demoEnabled ? COMPETITION_DEMO_CASES.find((item) => item.id === demoCaseId) : null;
      if (demoCase) {
        dispatchSeq({ type: "START", payload: { requestId: "demo-" + demoCase.id } });
        await new Promise((r) => setTimeout(r, 250));
        if (controller.signal.aborted || scanId !== scanSequence.current) return;

        dispatchSeq({ type: "L1_SUCCESS", payload: { result: demoCase.layers.layer1 } });
        await new Promise((r) => setTimeout(r, 350));
        if (controller.signal.aborted || scanId !== scanSequence.current) return;

        dispatchSeq({ type: "START_L2" });
        await new Promise((r) => setTimeout(r, 250));
        if (controller.signal.aborted || scanId !== scanSequence.current) return;

        const l2Result = demoCase.layers.layer2 || { finding: "NO_KNOWN_THREAT", status: "PASS" };
        dispatchSeq({ type: "L2_SUCCESS", payload: { result: l2Result } });
        await new Promise((r) => setTimeout(r, 350));
        if (controller.signal.aborted || scanId !== scanSequence.current) return;

        dispatchSeq({ type: "START_L3" });
        await new Promise((r) => setTimeout(r, 250));
        if (controller.signal.aborted || scanId !== scanSequence.current) return;

        dispatchSeq({ type: "L3_SUCCESS", payload: { result: demoCase.layers.layer3 } });
        await new Promise((r) => setTimeout(r, 350));
        if (controller.signal.aborted || scanId !== scanSequence.current) return;

        dispatchSeq({ type: "START_L4" });
        await new Promise((r) => setTimeout(r, 250));
        if (controller.signal.aborted || scanId !== scanSequence.current) return;

        dispatchSeq({ type: "L4_SUCCESS", payload: { result: demoCase.layers.layer4 } });
        dispatchSeq({ type: "FINAL_VERDICT", payload: { verdict: demoCase.layers.layer4 } });

        setLayers(demoCase.layers);
        setSourceProvenance({
          requestedMode: "DEMO",
          sourceMode: "DEMO",
          kind: "DEMO_FIXTURE",
          label: "Deterministic competition demo case",
          fixtureId: demoCase.id,
          fixtureVersion: "competition-v1",
          disclosure: "Case được chọn chủ động từ fixture trình diễn.",
        });
        return;
      }

      // 2. Input Validation & OCR Handling
      if (mode === "image" || mode === "qr") {
        if (!file) throw new ApiError("Hãy chọn hoặc dán một ảnh trước khi phân tích.", "VALIDATION", { status: 400 });
        const { OcrService } = await import("@/lib/ai-trust/vision/OcrService");
        const result = await OcrService.extract(file);
        if (controller.signal.aborted || scanId !== scanSequence.current) return;
        extracted = String(mode === "qr" ? result.qrContent || "" : result.text || result.qrContent || "").trim();
        setOcr({ ...result, authority: "CLIENT_OCR_HINT" });
        if (!extracted) {
          throw new ApiError(
            mode === "qr"
              ? "Không đọc được mã QR. Hãy dùng ảnh QR rõ hơn hoặc chuyển sang nhập URL/văn bản."
              : "OCR cục bộ không đọc được nội dung. Hãy dùng ảnh rõ hơn hoặc chuyển sang nhập văn bản.",
            "VALIDATION",
            { status: 422 }
          );
        }
      }

      if (mode === "url") {
        let parsedUrl;
        try {
          parsedUrl = new URL(extracted);
        } catch {
          throw new ApiError("URL không hợp lệ. Hãy nhập đầy đủ https://...", "VALIDATION", { status: 422 });
        }
        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
          throw new ApiError("Chỉ hỗ trợ URL HTTP hoặc HTTPS.", "VALIDATION", { status: 422 });
        }
      }

      if (controller.signal.aborted || scanId !== scanSequence.current) return;

      // 3. Execution via Runtime Provider (Friend Backend Sequential Stream)
      const identity = createWorkIdentity("trust");
      const input = {
        // QR is an image transport with a decoded text hint. The server route
        // accepts the canonical IMAGE type and keeps inputKind=QR in metadata.
        type: mode === "url" ? "URL" : mode === "image" || mode === "qr" ? "IMAGE" : "TEXT",
        content: extracted,
        metadata:
          mode === "image" || mode === "qr"
            ? { inputKind: mode === "qr" ? "QR" : "IMAGE", extractionAuthority: "CLIENT_OCR_HINT", fileType: file?.type, ...(mode === "qr" ? { qrContent: extracted } : {}) }
            : { inputKind: mode === "url" ? "URL" : "TEXT" },
        requestId: identity.requestId,
        runId: identity.runId,
        confirmedEntities,
      };

      const provider = getRuntimeProviderBundle();
      const response = await provider.trust.investigate(input, controller.signal, (event) => {
        if (scanId !== scanSequence.current || !event?.data) return;

        const eventPipeline = event.data;
        const eventSkipped = stageWasSkipped(eventPipeline, event.stageId);

        if (event.event === "STAGE_STARTED") {
          if (event.stageId === "l1") dispatchSeq({ type: "START", payload: { requestId: identity.requestId } });
          else if (event.stageId?.startsWith("l2")) dispatchSeq({ type: "START_L2" });
          else if (event.stageId === "l3") dispatchSeq({ type: "START_L3" });
          else if (event.stageId === "l4") dispatchSeq({ type: "START_L4" });
        }

        if (event.event === "STAGE_COMPLETED") {
          if (event.stageId === "l1") {
            if (eventSkipped) dispatchSeq({ type: "SKIP_LAYER", payload: { layer: 1 } });
            else if (event.data?.layerResults?.layer1) dispatchSeq({ type: "L1_SUCCESS", payload: { result: event.data.layerResults.layer1 } });
          } else if (event.stageId?.startsWith("l2") && !eventSkipped) {
            const layer2Result = event.data?.layerResults?.layer2 ?? event.data?.layerResults?.layer2B ?? event.data?.layerResults?.layer2A;
            if (layer2Result) dispatchSeq({ type: "L2_SUCCESS", payload: { result: layer2Result } });
          } else if (event.stageId === "l3") {
            if (eventSkipped) dispatchSeq({ type: "SKIP_LAYER", payload: { layer: 3 } });
            else if (event.data?.layerResults?.layer3) dispatchSeq({ type: "L3_SUCCESS", payload: { result: event.data.layerResults.layer3 } });
          } else if (event.stageId === "l4") {
            if (eventSkipped) dispatchSeq({ type: "SKIP_LAYER", payload: { layer: 4 } });
            else if (event.data?.layerResults?.layer4) dispatchSeq({ type: "L4_SUCCESS", payload: { result: event.data.layerResults.layer4 } });
          }
        }

        const eventLayers = event.data.layerResults;
        if (eventLayers) {
          setLayers({
            layer1: eventLayers.layer1 ?? null,
            layer2: eventLayers.layer2 ?? eventLayers.layer2B ?? eventLayers.layer2A ?? null,
            layer3: eventLayers.layer3 ?? null,
            layer4: eventLayers.layer4 ?? null,
          });
        }
      });

      if (scanId !== scanSequence.current) return;
      setProviderResult(response);
      setSourceProvenance(response.provenance);

      if (["ERROR", "UNAVAILABLE", "OFFLINE", "AUTH_REQUIRED", "FORBIDDEN", "CANCELLED"].includes(response.state)) {
        const safeMessage =
          response.error?.userMessage ||
          (response.state === "UNAVAILABLE"
            ? "Nguồn live chưa khả dụng; vui lòng kiểm tra kết nối."
            : response.state === "CANCELLED"
            ? "Yêu cầu đã được dừng."
            : "Trust Engine chưa trả về kết quả hợp lệ.");
        if (response.state !== "CANCELLED") {
          setError({ message: safeMessage, code: response.error?.code || response.state, traceId: response.error?.details?.traceId || response.error?.requestId || null });
        }
        if (response.state === "CANCELLED") {
          dispatchSeq({ type: "CANCEL" });
        } else {
          dispatchSeq({
            type: "FAIL_LAYER",
            payload: {
              layer: seqState.activeLayer || 2,
              code: response.error?.code || response.state,
              message: safeMessage,
            },
          });
        }
        return;
      }

      if (!response.data) {
        setError({ message: "Trust Engine chưa trả về dữ liệu đủ để hiển thị.", code: "INVALID_RESPONSE", traceId: response.requestId || null });
        dispatchSeq({ type: "FAIL_LAYER", payload: { layer: 4, code: "INVALID_RESPONSE", message: "Trust Engine chưa trả về dữ liệu đủ để hiển thị." } });
        return;
      }

      const displayPipeline = response.data;
      const resultLayers = displayPipeline?.layerResults || {};
      const layer1 = resultLayers.layer1 || null;
      const layer2 = resultLayers.layer2 || resultLayers.layer2B || resultLayers.layer2A || null;
      const layer3 = resultLayers.layer3 || null;
      const layer4 = resultLayers.layer4 || null;

      setLayers({ layer1, layer2, layer3, layer4 });

      // Hydrate the reducer for JSON responses and for hard-stop/continuation
      // paths where later layers are explicitly SKIPPED by the server.
      if (layer1) dispatchSeq({ type: "L1_SUCCESS", payload: { result: layer1 } });
      if (layer2) {
        dispatchSeq({ type: "START_L2" });
        dispatchSeq({ type: "L2_SUCCESS", payload: { result: layer2 } });
      }
      if (stageWasSkipped(displayPipeline, "l3")) {
        dispatchSeq({ type: "SKIP_LAYER", payload: { layer: 3 } });
      } else if (layer3) {
        dispatchSeq({ type: "START_L3" });
        dispatchSeq({ type: "L3_SUCCESS", payload: { result: layer3 } });
      }
      if (stageWasSkipped(displayPipeline, "l4")) {
        dispatchSeq({ type: "SKIP_LAYER", payload: { layer: 4 } });
      } else if (layer4) {
        dispatchSeq({ type: "START_L4" });
        dispatchSeq({ type: "L4_SUCCESS", payload: { result: layer4 } });
      }
      dispatchSeq({ type: "FINAL_VERDICT", payload: { verdict: displayPipeline?.finalDecision || response.data } });
    } catch (caught) {
      if (caught instanceof ApiError && caught.code === "ABORTED" && scanId !== scanSequence.current) {
        dispatchSeq({ type: "CANCEL" });
        return;
      }
      const message = caught instanceof ApiError ? apiErrorMessage(caught) : "Pipeline gặp sự cố ngoài dự kiến.";
      setError({ message, code: caught instanceof ApiError ? caught.code : "SERVER_ERROR", traceId: caught instanceof ApiError ? caught.traceId : null });
      dispatchSeq({
        type: "FAIL_LAYER",
        payload: {
          layer: seqState.activeLayer || 1,
          code: caught instanceof ApiError ? caught.code : "SERVER_ERROR",
          message,
        },
      });
    } finally {
      if (scanId === scanSequence.current) setProcessing(false);
    }
  };

  const handleTrustStateAction = (action) => {
    if (action.id === "RETRY") analyze();
    if (action.id === "START_OVER") reset();
  };

  return (
    <div className="product-workspace max-w-4xl mx-auto px-4 py-6 space-y-8">
      {/* 1. Modern Minimalist Header */}
      <header className="product-hero">
        <div>
          <p className="product-kicker">AI × Community × Human expertise</p>
          <h1>Kiểm tra trước khi bạn tin.</h1>
          <p>
            Đưa ảnh chụp, đường dẫn hoặc nội dung khả nghi vào luồng phân tích an toàn theo trình tự 4 lớp có thể truy vết.
          </p>
          <SourceDisclosure
            provenance={sourceProvenance}
            sourceMode={sourceProvenance?.sourceMode || (demoEnabled ? "DEMO" : "LIVE")}
          />
        </div>
        <div className="hero-seal">
          <ShieldCheck size={20} />
          <span>TRUST ENGINE</span>
          <strong>Sequential 4-Layer</strong>
        </div>
      </header>

      {/* 2. Focused Trust Input Deck */}
      <section className="intelligence-panel" aria-labelledby="trust-input-title">
        <div className="panel-heading">
          <div>
            <p className="product-kicker">01 · Input</p>
            <h2 id="trust-input-title" className="product-section-title">
              Bạn muốn kiểm tra gì?
            </h2>
          </div>
          {(file || content) && (
            <button className="text-link font-mono text-xs" onClick={reset}>
              Làm mới
            </button>
          )}
        </div>

        {demoEnabled && (
          <div className="demo-mode-panel mb-4" role="group" aria-label="Ba case trình diễn">
            <div>
              <span className="signal-badge">CHẾ ĐỘ TRÌNH DIỄN</span>
              <p className="text-xs text-white/60">Dữ liệu xác định từ cuộc thi; không gọi live backend.</p>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {COMPETITION_DEMO_CASES.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={`filter-chip ${demoCaseId === item.id ? "is-active" : ""}`}
                  aria-pressed={demoCaseId === item.id}
                  onClick={() => {
                    setDemoCaseId(item.id);
                    setMode("text");
                    setContent(item.input);
                    setFile(null);
                    setConfirmedEntities([]);
                    if (preview) URL.revokeObjectURL(preview);
                    setPreview(null);
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mode Switch Tabs */}
        <div className="mode-switch" role="tablist" aria-label="Loại đầu vào">
          <button role="tab" aria-selected={mode === "url"} onClick={() => { setDemoCaseId(null); setConfirmedEntities([]); setMode("url"); }}>
            <Globe2 size={15} /> URL
          </button>
          <button role="tab" aria-selected={mode === "text"} onClick={() => { setDemoCaseId(null); setConfirmedEntities([]); setMode("text"); }}>
            <ClipboardPaste size={15} /> Văn bản
          </button>
          <button role="tab" aria-selected={mode === "qr"} onClick={() => { setDemoCaseId(null); setConfirmedEntities([]); setMode("qr"); }}>
            <ScanSearch size={15} /> QR
          </button>
          <button role="tab" aria-selected={mode === "image"} onClick={() => { setDemoCaseId(null); setConfirmedEntities([]); setMode("image"); }}>
            <ImageIcon size={15} /> Ảnh chụp
          </button>
        </div>

        {/* Input Area */}
        {mode === "image" || mode === "qr" ? (
          <div
            className={`upload-zone ${dragging ? "is-dragging" : ""} ${preview ? "has-preview" : ""}`}
            onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              setDemoCaseId(null);
              acceptFile(event.dataTransfer.files[0]);
            }}
          >
            {preview ? (
              <>
                <div className="ocr-preview-wrap">
                  <Image
                    src={preview}
                    alt={mode === "qr" ? "Ảnh mã QR sẽ được phân tích" : "Ảnh sẽ được phân tích"}
                    width={1200}
                    height={800}
                    unoptimized
                  />
                  {ocr?.regions?.map((region) => (
                    <span
                      key={region.id}
                      className="ocr-region"
                      style={{ left: `${region.x}%`, top: `${region.y}%`, width: `${region.width}%`, height: `${region.height}%` }}
                      aria-label={`${region.label} overlay`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  className="remove-upload"
                  onClick={() => {
                    if (preview) URL.revokeObjectURL(preview);
                    setFile(null);
                    setPreview(null);
                    setOcr(null);
                  }}
                  aria-label="Xóa ảnh"
                >
                  <X size={16} />
                </button>
              </>
            ) : (
              <button type="button" className="upload-prompt" onClick={() => fileInput.current?.click()}>
                <span>{mode === "qr" ? <ScanSearch size={22} /> : <Upload size={22} />}</span>
                <strong>{mode === "qr" ? "Thả hoặc chọn ảnh mã QR" : "Thả hoặc chọn ảnh chụp"}</strong>
                <small>PNG, JPG, WEBP · tối đa 8 MB · có thể dán từ clipboard</small>
              </button>
            )}
            <input
              ref={fileInput}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              aria-label={mode === "qr" ? "Chọn ảnh mã QR cần phân tích" : "Chọn ảnh chụp cần phân tích"}
              className="sr-only"
              onChange={(event) => {
                setDemoCaseId(null);
                acceptFile(event.target.files?.[0]);
              }}
            />
          </div>
        ) : (
          <label className="trust-text-field">
            <span>{mode === "url" ? "Đường dẫn cần kiểm tra" : "Nội dung tin nhắn hoặc thông báo"}</span>
            <textarea
              value={content}
              onChange={(event) => {
                setDemoCaseId(null);
                setContent(event.target.value);
              }}
              rows={4}
              placeholder={mode === "url" ? "https://..." : "Dán nội dung khả nghi tại đây..."}
            />
          </label>
        )}

        {ocr && (
          <div className="ocr-readout mt-3">
            <div>
              <FileImage size={15} />
              <span>OCR trong trình duyệt</span>
              <strong>{ocr.authority}</strong>
            </div>
            <p>{String(ocr.text || ocr.qrContent || "").slice(0, 180)}</p>
          </div>
        )}

        {error && (
          <div className="error-callout mt-3" role="alert">
            <ShieldAlert size={17} />
            <span>
              {error.message}
              {error.traceId && <small className="block font-mono mt-0.5">Reference: {error.traceId}</small>}
            </span>
          </div>
        )}

        {/* Analyze Button */}
        <button
          type="button"
          className="primary-action trust-submit mt-4"
          disabled={((mode !== "image" && mode !== "qr") && !content.trim()) || ((mode === "image" || mode === "qr") && !file) || processing}
          onClick={analyze}
        >
          {processing ? <LoaderCircle className="animate-spin" size={17} /> : <ScanSearch size={17} />}
          {processing ? "Đang chạy phân tích trình tự..." : "Phân tích rủi ro"}
          <ArrowRight size={16} />
        </button>
      </section>

      {/* State boundary if provider level error */}
      {providerResult && providerResult.state !== "SUCCESS" && (
        <StateBoundary envelope={providerResult} onAction={handleTrustStateAction} />
      )}

      {/* 3. The 4-Layer Investigation Report HUD */}
      {seqState.state !== SEQUENTIAL_STATE.IDLE && (
        <div id="sequential-results-view" className="pt-2 animate-in fade-in duration-300">
          <SequentialFourLayerHUD
            sequentialState={seqState}
            layers={layers}
            inputType={mode}
            onRetry={() => {
              dispatchSeq({ type: "RETRY" });
              analyze();
            }}
            onReset={reset}
          />
        </div>
      )}
    </div>
  );
}
