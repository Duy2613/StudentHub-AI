"use client";

import React, { useState } from "react";
import AcademicNavbar from "@/components/layout/AcademicNavbar";
import {
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  Lightbulb,
  Lock,
  Play,
  RotateCcw,
  Sparkles,
} from "lucide-react";

const PRACTICE_PROBLEMS = [
  {
    id: "p-bola-01",
    title: "Ngăn chặn tấn công BOLA (Broken Object Level Authorization)",
    category: "Security & RLS",
    difficulty: "Trung cấp",
    scenario:
      "Một API endpoint `/api/academic/me/transcript?studentId=24110002` cho phép sinh viên A đọc bảng điểm của sinh viên B nếu chỉ truyền studentId qua query parameter.",
    task:
      "Hãy phân tích nguyên nhân gốc rễ (Root Cause) và mô tả giải pháp kiểm soát thẩm quyền theo chuẩn Zero-Trust của StudentHub AI.",
    starterCode: `// Viết suy luận hoặc mã kiểm soát quyền của bạn tại đây:
export async function getStudentTranscript(request, context) {
  // BƯỚC 1: Lấy danh tính từ token xác thực đã ký (Server-Side Principal)
  // BƯỚC 2: Đối soát ID tài nguyên với danh tính người gọi
  
}`,
    hints: [
      "Gợi ý 1: Không bao giờ tin tưởng studentId gửi lên từ Client Query hoặc Request Body.",
      "Gợi ý 2: Trích xuất `verifiedPrincipal` từ JWT session token được ký bởi Auth Provider.",
      "Gợi ý 3: Nếu `principal.studentId !== requestedStudentId` và `principal.role !== 'ACADEMIC_ADMIN'`, trả về ngay lập tức 403 FORBIDDEN.",
    ],
    misconception:
      "Quan niệm sai lầm: Dùng UUID ngẫu nhiên thay vì số thứ tự là đủ an toàn. Thực tế: UUID chỉ làm giảm khả năng quét mò (enumeration) chứ không thay thế được tầng kiểm soát quyền (Authorization Check).",
    solution: `export async function getStudentTranscript(request, context) {
  const session = await verifyServerSession(request);
  if (!session || !session.user) {
    return new Response(JSON.stringify({ error: "UNAUTHORIZED" }), { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const targetStudentId = searchParams.get("studentId");

  // Kiểm soát BOLA: Người dùng chỉ được xem bảng điểm của chính mình
  if (session.user.studentId !== targetStudentId && !session.user.roles?.includes("ADMIN")) {
    await emitSecurityAuditEvent({
      eventType: "SECURITY_POLICY_VIOLATION",
      reason: "OBJECT_NOT_OWNED",
      subject: session.user.studentId,
      target: targetStudentId,
    });
    return new Response(JSON.stringify({ error: "FORBIDDEN_OBJECT_ACCESS" }), { status: 403 });
  }

  const transcript = await DurableTranscriptRepository.findByStudentId(targetStudentId);
  return Response.json({ success: true, data: transcript });
}`,
  },
  {
    id: "p-cache-02",
    title: "Chống nghẽn dòng Cache Stampede khi công bố điểm thi",
    category: "Distributed Systems",
    difficulty: "Nâng cao",
    scenario:
      "Vào thời điểm 15:00, 10,000 sinh viên cùng truy vấn bảng điểm môn Cơ sở Dữ liệu. Đúng lúc đó, cache Redis hết hạn (TTL expire).",
    task:
      "Đề xuất cơ chế Probabilistic Early Expiration (XFetch) hoặc Mutex Lock để bảo vệ database PostgreSQL không bị sập.",
    starterCode: `async function getCachedGrades(courseId) {
  // Viết giải pháp phân tán của bạn:
}`,
    hints: [
      "Gợi ý 1: Sử dụng SingleFlight hoặc Mutex Lock trên Redis để chỉ cho phép 1 worker tính lại cache.",
      "Gợi ý 2: Các request khác chờ worker hoàn thành hoặc nhận dữ liệu stale có thời hạn ngắn.",
    ],
    misconception:
      "Quan niệm sai lầm: Tăng dung lượng database PostgreSQL lên gấp 10 lần. Thực tế: Chi phí hạ tầng lãng phí và vẫn có nguy cơ connection pool exhaustion khi có spike hàng chục nghìn kết nối.",
    solution: `// Giải pháp Mutex Lock kết hợp Stale-While-Revalidate
async function getCachedGrades(courseId) {
  const key = \`grades:\${courseId}\`;
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  const lockKey = \`lock:\${key}\`;
  const acquired = await redis.set(lockKey, "1", "NX", "EX", 5);
  if (!acquired) {
    await new Promise((r) => setTimeout(r, 100));
    return getCachedGrades(courseId);
  }

  try {
    const data = await db.query("SELECT * FROM grades WHERE course_id = $1", [courseId]);
    await redis.set(key, JSON.stringify(data), "EX", 300);
    return data;
  } finally {
    await redis.del(lockKey);
  }
}`,
  },
];

export default function PracticePage() {
  const [selectedProblemIndex, setSelectedProblemIndex] = useState(0);
  const [studentReasoning, setStudentReasoning] = useState("");
  const [studentCode, setStudentCode] = useState(PRACTICE_PROBLEMS[0].starterCode);
  const [activeHintLevel, setActiveHintLevel] = useState(0);
  const [showMisconception, setShowMisconception] = useState(false);
  const [solutionUnlocked, setSolutionUnlocked] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const problem = PRACTICE_PROBLEMS[selectedProblemIndex];

  const handleSelectProblem = (index) => {
    setSelectedProblemIndex(index);
    setStudentReasoning("");
    setStudentCode(PRACTICE_PROBLEMS[index].starterCode);
    setActiveHintLevel(0);
    setShowMisconception(false);
    setSolutionUnlocked(false);
    setTestResult(null);
  };

  const handleRunTest = () => {
    if (!studentReasoning.trim()) {
      setTestResult({
        success: false,
        message: "Vui lòng ghi lại suy luận kỹ thuật của bạn trước khi chạy kiểm thử!",
      });
      return;
    }

    const hasCheck =
      studentCode.includes("403") ||
      studentCode.includes("verify") ||
      studentCode.includes("lock") ||
      studentCode.includes("mutex");

    if (hasCheck) {
      setTestResult({
        success: true,
        message: "Kiểm thử thành công! Bạn đã xử lý đúng điều kiện biên và bảo vệ an toàn hệ thống.",
      });
    } else {
      setTestResult({
        success: false,
        message: "Chưa vượt qua kiểm thử: Thiếu cơ chế kiểm soát thẩm quyền hoặc khóa đồng thời.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col">
      <AcademicNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono tracking-wide uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20 mb-2">
              <BrainCircuit size={13} />
              <span>Reasoning-First Practice Lab</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary">
              Phòng Luyện Tư Duy Kỹ Sư
            </h1>
            <p className="mt-2 text-sm sm:text-base text-text-secondary max-w-2xl">
              Quy trình: Hiểu vấn đề → Tự suy luận → Triển khai giải pháp → Nhận gợi ý phân tầng.
              AI hỗ trợ bạn tư duy, không làm thay bạn.
            </p>
          </div>

          {/* Problem Selector Dropdown */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {PRACTICE_PROBLEMS.map((p, idx) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectProblem(idx)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono transition-all border whitespace-nowrap ${
                  idx === selectedProblemIndex
                    ? "bg-accent-primary text-white border-accent-primary"
                    : "bg-surface-primary border-border-subtle text-text-secondary hover:text-text-primary"
                }`}
              >
                Thử thách {idx + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Practice Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Problem Briefing & Reasoning Input (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-surface-primary border border-border-subtle rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-accent-knowledge px-2.5 py-1 rounded bg-cyan-500/10 border border-cyan-500/20">
                  {problem.category}
                </span>
                <span className="text-xs font-mono text-accent-human bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                  {problem.difficulty}
                </span>
              </div>

              <h2 className="text-xl font-bold text-text-primary">{problem.title}</h2>

              <div className="space-y-3 text-sm text-text-secondary leading-relaxed">
                <div>
                  <strong className="text-text-primary block font-mono text-xs uppercase mb-1">
                    Tình huống:
                  </strong>
                  <p className="bg-surface-elevated/40 p-3 rounded-xl border border-border-subtle">
                    {problem.scenario}
                  </p>
                </div>

                <div>
                  <strong className="text-text-primary block font-mono text-xs uppercase mb-1">
                    Yêu cầu:
                  </strong>
                  <p>{problem.task}</p>
                </div>
              </div>

              {/* Student Reasoning Input Area (Mandatory Step 1) */}
              <div className="pt-4 border-t border-border-subtle space-y-2">
                <label
                  htmlFor="student-reasoning-input"
                  className="block text-xs font-mono uppercase text-accent-knowledge"
                >
                  1. Suy luận & giả thuyết kỹ thuật của bạn (Bắt buộc):
                </label>
                <textarea
                  id="student-reasoning-input"
                  rows={4}
                  value={studentReasoning}
                  onChange={(e) => setStudentReasoning(e.target.value)}
                  placeholder="Ghi rõ: Đâu là lỗ hổng? Tại sao nó xảy ra? Cần kiểm tra điều kiện gì ở tầng máy chủ?"
                  className="w-full bg-surface-elevated p-3 rounded-xl text-xs font-mono text-text-primary border border-border-subtle focus:outline-none focus:border-accent-knowledge resize-none"
                />
              </div>

              {/* AI Tutor Progressive Hints */}
              <div className="pt-4 border-t border-border-subtle space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-text-muted">Gợi ý AI phân tầng:</span>
                  <span>
                    {activeHintLevel} / {problem.hints.length} gợi ý
                  </span>
                </div>

                {activeHintLevel > 0 && (
                  <div className="space-y-2">
                    {problem.hints.slice(0, activeHintLevel).map((hint, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200 leading-relaxed"
                      >
                        {hint}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  {activeHintLevel < problem.hints.length && (
                    <button
                      type="button"
                      onClick={() => setActiveHintLevel((prev) => prev + 1)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-elevated hover:bg-surface-elevated/80 border border-border-subtle text-xs font-mono text-text-primary"
                    >
                      <Lightbulb size={13} className="text-amber-400" />
                      <span>Mở gợi ý cấp {activeHintLevel + 1}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowMisconception((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-elevated hover:bg-surface-elevated/80 border border-border-subtle text-xs font-mono text-accent-human"
                  >
                    <HelpCircle size={13} />
                    <span>Quan niệm sai lầm phổ biến</span>
                  </button>
                </div>

                {showMisconception && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 leading-relaxed animate-fade-in">
                    {problem.misconception}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Code Editor & Execution Test (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-surface-primary border border-border-subtle rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-text-muted">
                  2. Hiện thực mã kiểm soát (Implementation):
                </span>
                <button
                  type="button"
                  onClick={() => setStudentCode(problem.starterCode)}
                  className="text-xs font-mono text-text-muted hover:text-text-primary flex items-center gap-1"
                >
                  <RotateCcw size={12} /> Đặt lại mã
                </button>
              </div>

              {/* Code input textarea */}
              <div className="rounded-xl overflow-hidden border border-border-strong bg-surface-elevated">
                <div className="px-4 py-2 bg-surface-elevated/80 border-b border-border-subtle text-xs font-mono text-text-muted flex justify-between">
                  <span>TypeScript · Node.js Environment</span>
                </div>
                <textarea
                  rows={14}
                  value={studentCode}
                  onChange={(e) => setStudentCode(e.target.value)}
                  aria-label="Trình soạn thảo mã nguồn thực hành"
                  className="w-full bg-transparent p-4 text-xs sm:text-sm font-mono text-cyan-200 focus:outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleRunTest}
                  className="px-5 py-2.5 rounded-xl bg-accent-primary hover:bg-accent-primary/90 text-white text-sm font-medium flex items-center gap-2 transition-all shadow-md shadow-accent-primary/20"
                >
                  <Play size={15} />
                  <span>Chạy kiểm tra</span>
                </button>

                {!solutionUnlocked ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (studentReasoning.trim().length > 10) {
                        setSolutionUnlocked(true);
                      } else {
                        alert("Vui lòng ghi lại suy luận của bạn trước khi mở lời giải tham chiếu!");
                      }
                    }}
                    className="text-xs font-mono text-text-muted hover:text-accent-human flex items-center gap-1.5"
                  >
                    <Lock size={13} />
                    <span>Mở lời giải tham khảo</span>
                  </button>
                ) : (
                  <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 size={13} /> Đã mở lời giải
                  </span>
                )}
              </div>

              {/* Test Result Feedback */}
              {testResult && (
                <div
                  className={`p-4 rounded-xl border text-xs sm:text-sm leading-relaxed ${
                    testResult.success
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
                      : "bg-red-500/10 border-red-500/30 text-red-200"
                  }`}
                >
                  {testResult.message}
                </div>
              )}

              {/* Reference Solution (Locked until effort occurred) */}
              {solutionUnlocked && (
                <div className="pt-4 border-t border-border-subtle space-y-2 animate-fade-in">
                  <span className="text-xs font-mono uppercase text-emerald-400 font-bold block">
                    Lời giải tham chiếu chuẩn kỹ sư:
                  </span>
                  <pre className="p-4 rounded-xl bg-surface-elevated border border-border-subtle text-xs font-mono text-emerald-200 overflow-x-auto">
                    <code>{problem.solution}</code>
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
