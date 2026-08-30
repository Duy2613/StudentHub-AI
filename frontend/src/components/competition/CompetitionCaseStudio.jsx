"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import {
  AlertTriangle,
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  CircleHelp,
  Clock3,
  FileClock,
  Landmark,
  Network,
  ShieldCheck,
  Sparkles,
  Users,
  UserRoundCheck,
} from "lucide-react";
import styles from "./competition-case-studio.module.css";

const provenanceCards = [
  { key: "officialEvidence", title: "Nguồn chính thức", icon: Landmark, tone: "official" },
  { key: "community", title: "Quan sát cộng đồng", icon: Users, tone: "community" },
  { key: "expert", title: "Phạm vi chuyên gia", icon: UserRoundCheck, tone: "expert" },
];

function readable(value) {
  return String(value || "UNKNOWN").replaceAll("_", " ");
}

function EvidenceArtifact({ status, revision }) {
  return (
    <div className={styles.artifactScene} aria-hidden="true">
      <div className={styles.artifactOrbitOne} />
      <div className={styles.artifactOrbitTwo} />
      <div className={styles.artifactCore}>
        <FileClock size={30} />
        <span>Evidence Passport</span>
        <strong>{readable(status)}</strong>
        <small>Revision {revision}</small>
      </div>
    </div>
  );
}

function ProvenanceCard({ config, data }) {
  const Icon = config.icon;
  return (
    <article className={styles.provenanceCard} data-tone={config.tone}>
      <div className={styles.cardTitle}>
        <span><Icon size={18} /></span>
        <div><p>{config.title}</p><strong>{readable(data.state)}</strong></div>
      </div>
      <h3>{data.title || data.scope || `${data.independentReports || 0} quan sát độc lập`}</h3>
      <p>{data.summary}</p>
      <code>{data.sourceRef}</code>
    </article>
  );
}

export function CompetitionCaseStudio({ flows }) {
  const reduceMotion = useReducedMotion();
  const [activeId, setActiveId] = useState(flows[0]?.id);
  const active = useMemo(() => flows.find((flow) => flow.id === activeId) || flows[0], [activeId, flows]);
  const recommended = active.decision.options.find((option) => option.id === active.decision.recommendedOptionId);

  useEffect(() => {
    const requestedId = new URLSearchParams(window.location.search).get("id");
    if (requestedId && flows.some((flow) => flow.id === requestedId)) {
      setActiveId(requestedId);
    }
  }, [flows]);

  function selectFlow(id) {
    setActiveId(id);
    const url = new URL(window.location.href);
    url.searchParams.set("id", id);
    window.history.replaceState(null, "", `${url.pathname}?${url.searchParams.toString()}${url.hash}`);
  }

  return (
    <div className={styles.workspace}>
      <header className={styles.hero}>
        <div>
          <div className={styles.heroLabel}><Sparkles size={14} /><span>COMPETITION DEMO · DEMO FIXTURE</span></div>
          <h1>Một case. Toàn bộ mạng lưới bằng chứng.</h1>
          <p>Trust, cộng đồng, chuyên gia, học vụ, Passport và Decision Twin cùng trả lời một câu hỏi: bước an toàn tiếp theo là gì?</p>
        </div>
        <EvidenceArtifact status={active.passport.currentStatus} revision={active.passport.revision} />
      </header>

      <div className={styles.demoNotice} role="note">
        <AlertTriangle size={18} />
        <div><strong>Dữ liệu trình diễn được gắn nhãn rõ ràng.</strong><p>{active.dataNotice}</p></div>
      </div>

      <div className={styles.caseTabs} role="tablist" aria-label="Chọn superflow trình diễn">
        {flows.map((flow) => (
          <button
            key={flow.id}
            type="button"
            role="tab"
            aria-selected={active.id === flow.id}
            onClick={() => selectFlow(flow.id)}
          >
            <span>{flow.navLabel}</span>
            <small>{readable(flow.currentRisk)}</small>
          </button>
        ))}
      </div>

      <motion.div
        key={active.id}
        // Keep content opaque during the entrance motion so contrast remains
        // valid while assistive technology evaluates the freshly mounted DOM.
        initial={reduceMotion ? false : { y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.45, ease: [0.16, 1, 0.3, 1] }}
        className={styles.caseBody}
      >
        <section className={styles.caseOverview} aria-labelledby="case-title">
          <div>
            <div className={styles.statusLine}><span data-risk={active.currentRisk}>{readable(active.currentRisk)}</span><span>{active.subjectType.replaceAll("_", " ")}</span></div>
            <h2 id="case-title">{active.title}</h2>
            <p>{active.claim}</p>
          </div>
          <div className={styles.checkedBlock}>
            <p>Hệ thống đã kiểm tra</p>
            <ul>{active.checked.map((item) => <li key={item}><CheckCircle2 size={15} />{item}</li>)}</ul>
          </div>
        </section>

        <section className={styles.triangleSection} aria-labelledby="triangle-title">
          <div className={styles.sectionHeading}><Network size={20} /><div><h2 id="triangle-title">Evidence Triangle</h2><p>Ba lớp nguồn không bị ép thành một điểm số duy nhất.</p></div></div>
          <div className={styles.provenanceGrid}>
            {provenanceCards.map((config) => <ProvenanceCard key={config.key} config={config} data={active[config.key]} />)}
          </div>
        </section>

        <section className={styles.knownUnknownGrid}>
          <article>
            <div className={styles.sectionHeading}><AlertTriangle size={19} /><div><h2>Xung đột đang mở</h2><p>Những điểm chưa thể hòa giải bằng nguồn hiện có.</p></div></div>
            <ul>{active.conflicts.map((item) => <li key={item}>{item}</li>)}</ul>
          </article>
          <article>
            <div className={styles.sectionHeading}><CircleHelp size={19} /><div><h2>Điều chưa biết</h2><p>Hệ thống giữ nguyên bất định thay vì tự điền câu trả lời.</p></div></div>
            <ul>{active.unknowns.map((item) => <li key={item}>{item}</li>)}</ul>
          </article>
        </section>

        <section className={styles.passportSection} aria-labelledby="passport-title">
          <div className={styles.sectionHeading}><FileClock size={20} /><div><h2 id="passport-title">Living Evidence Passport</h2><p>Kết quả cũ, kết quả mới và lý do thay đổi được giữ cùng nhau.</p></div></div>
          <ol className={styles.timeline}>
            {active.passport.events.map((event, index) => (
              <li key={event.id}>
                <div className={styles.timelineRail}><span>{index + 1}</span></div>
                <div>
                  <div className={styles.timelineMeta}><time>{new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }).format(new Date(event.occurredAt))} UTC</time><span>{event.provenanceClass}</span></div>
                  <h3>{event.summary}</h3>
                  {event.material && <p className={styles.materialChange}>{readable(event.previousStatus)} <ArrowRight size={13} /> {readable(event.newStatus)}</p>}
                  {event.changeReason && <p>{event.changeReason}</p>}
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.decisionSection} aria-labelledby="decision-title">
          <div className={styles.sectionHeading}><BookOpenCheck size={20} /><div><h2 id="decision-title">Student Decision Twin</h2><p>{active.decision.currentState}</p></div></div>
          <div className={styles.optionGrid}>
            {active.decision.options.map((option) => {
              const isRecommended = option.id === active.decision.recommendedOptionId;
              return (
                <article key={option.id} data-recommended={isRecommended}>
                  <div className={styles.optionHeader}><div><span>{isRecommended ? "ƯU TIÊN" : "LỰA CHỌN"}</span><h3>{option.label}</h3></div><strong>{option.score.total}</strong></div>
                  <p>{option.summary}</p>
                  <dl>
                    <div><dt>Rủi ro</dt><dd>{option.factors.risk}/5</dd></div>
                    <div><dt>Phụ thuộc</dt><dd>{option.factors.dependency}/5</dd></div>
                    <div><dt>Bất định</dt><dd>{option.factors.uncertainty}/5</dd></div>
                  </dl>
                  <ul>{option.consequences.map((item) => <li key={item.id}><span>{item.basis}</span><p>{item.statement}</p><small>{item.certainty}</small></li>)}</ul>
                </article>
              );
            })}
          </div>
          <div className={styles.nextAction}>
            <ShieldCheck size={24} />
            <div><span>Bước rõ ràng tiếp theo</span><h3>{recommended?.label || "Cần xác minh thêm"}</h3><p>{active.decision.nextAction}</p></div>
          </div>
        </section>

        <footer className={styles.caseFooter}>
          <div><Clock3 size={18} /><p style={{ color: "#b7c3bd" }}>Passport revision {active.passport.revision}. Trạng thái hiện tại: <strong>{readable(active.passport.currentStatus)}</strong>.</p></div>
          <nav aria-label="Mở các trụ cột liên quan">
            <Link href="/trust" style={{ color: "#f1eee6" }}>Trust <ArrowRight size={14} /></Link>
            <Link href="/community" style={{ color: "#f1eee6" }}>Community <ArrowRight size={14} /></Link>
            <Link href="/expert" style={{ color: "#f1eee6" }}>Expert <ArrowRight size={14} /></Link>
            <Link href="/academic" style={{ color: "#f1eee6" }}>Academic <ArrowRight size={14} /></Link>
          </nav>
        </footer>
      </motion.div>
    </div>
  );
}
