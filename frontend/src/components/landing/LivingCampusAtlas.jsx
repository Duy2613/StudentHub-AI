"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import {
  ArrowDownRight,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  CalendarDays,
  Check,
  Compass,
  FileCheck2,
  Menu,
  MessagesSquare,
  ScanSearch,
  X,
} from "lucide-react";
import styles from "./living-campus-atlas.module.css";

const EASE = [0.16, 1, 0.3, 1];

const evidenceLayers = [
  { number: "01", title: "Sàng lọc", copy: "Loại bỏ trùng lặp, tín hiệu yếu và những nguồn không thể kiểm tra.", opticalStage: "SCANNING" },
  { number: "02", title: "Ngữ cảnh", copy: "Đặt nội dung vào đúng thời gian, địa điểm, đối tượng và mục đích.", opticalStage: "TRACING" },
  { number: "03", title: "Đối chứng", copy: "So sánh nguồn độc lập, tài liệu gốc và những điểm đang mâu thuẫn.", opticalStage: "ALIGNING" },
  { number: "04", title: "Kết luận", copy: "Nói rõ điều có cơ sở, mức rủi ro và phần bằng chứng còn thiếu.", opticalStage: "ALIGNED_TRUTH" },
];

const intelligenceSources = [
  {
    number: "01",
    title: "Chính thức",
    eyebrow: "Quy định · biểu mẫu · thời hạn",
    copy: "Nguồn gốc để biết điều gì đang có hiệu lực — không dựa vào bản chụp đã lỗi thời.",
    href: "/trust",
    image: "/images/atlas/atlas-official-archive.webp",
  },
  {
    number: "02",
    title: "Cộng đồng",
    eyebrow: "Trải nghiệm · ma sát · ngoại lệ",
    copy: "Những gì sinh viên thật sự gặp phải, được gom theo bối cảnh và kiểm tra dấu hiệu thao túng.",
    href: "/community",
    image: "/images/atlas/atlas-community-commons.webp",
  },
  {
    number: "03",
    title: "Chuyên gia",
    eyebrow: "Phạm vi · điều kiện · diễn giải",
    copy: "Ý kiến đi kèm chuyên môn, giới hạn thẩm quyền và bằng chứng liên quan — không phải bảng xếp hạng nổi tiếng.",
    href: "/expert",
    image: "/images/atlas/atlas-expert-corridor.webp",
  },
];

function BrandMark() {
  return (
    <span className={styles.brand} aria-label="StudentHub AI">
      <span className={styles.brandGlyph} aria-hidden="true"><i /><i /><i /><i /></span>
      <span>StudentHub AI</span>
    </span>
  );
}

function Reveal({ children, className = "", delay = 0 }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.9, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

function OpeningSequence({ onComplete }) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const timer = window.setTimeout(onComplete, reduceMotion ? 80 : 1450);
    return () => window.clearTimeout(timer);
  }, [onComplete, reduceMotion]);

  return (
    <motion.div
      className={styles.openingSequence}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, filter: "blur(8px)" }}
      transition={{ duration: reduceMotion ? 0.01 : 0.5, ease: EASE }}
      aria-hidden="true"
    >
      <div className={styles.openingBrand}><BrandMark /><span>AI-native campus intelligence</span></div>
      <div className={styles.openingCenter}>
        <span>Trust</span><i />
        <span>Context</span><i />
        <span>Clarity</span>
      </div>
      <div className={styles.openingProgress}>
        <motion.i initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: reduceMotion ? 0.01 : 1.15, ease: EASE }} />
        <span>Preparing the atlas</span><strong>100%</strong>
      </div>
      <motion.div className={styles.openingCurtain} initial={{ scaleY: 1 }} animate={{ scaleY: 0 }} transition={{ delay: reduceMotion ? 0 : 1.08, duration: reduceMotion ? 0.01 : 0.52, ease: EASE }} />
    </motion.div>
  );
}

function HeroMonolith() {
  return (
    <div className={styles.heroMonolith} aria-hidden="true">
      <div className={styles.monolithHalo} />
      <div className={styles.monolithSlab}>
        <span className={styles.monolithFace} />
        <span className={styles.monolithEdge} />
        <span className={styles.monolithCore} />
        <span className={styles.monolithTrace} />
        <div className={styles.monolithWords}><span>Evidence first</span><i /><span>Think further</span><i /><span>Move clearly</span></div>
      </div>
      <span className={styles.monolithDatum}>37.4419° N · KNOWLEDGE DATUM</span>
    </div>
  );
}

function TriLensCore() {
  const layers = [
    { number: "01", title: "Bằng chứng chính thống", copy: "Quy định · biểu mẫu · thời hạn", image: "/images/atlas/atlas-official-archive.webp" },
    { number: "02", title: "Diễn giải chuyên gia", copy: "Phạm vi · điều kiện · giới hạn", image: "/images/atlas/atlas-expert-corridor.webp" },
    { number: "03", title: "Trải nghiệm người học", copy: "Ma sát · ngoại lệ · thực tế", image: "/images/atlas/atlas-community-commons.webp" },
  ];

  return (
    <div className={styles.triLensCore}>
      <div className={styles.lensStage} aria-hidden="true">
        <span className={styles.lensBeam} />
        {layers.map((layer, index) => (
          <motion.div
            key={layer.number}
            className={styles.lensSlab}
            style={{ "--lens-index": index, backgroundImage: `linear-gradient(rgba(7,9,14,.42),rgba(7,9,14,.72)),url(${layer.image})` }}
            initial={{ opacity: 0, x: 80, rotateY: -22 }}
            whileInView={{ opacity: 1, x: 0, rotateY: -10 + index * 8 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 1, delay: index * 0.12, ease: EASE }}
          ><span>{layer.number}</span><strong>{layer.title}</strong></motion.div>
        ))}
      </div>
      <ol className={styles.lensLegend}>
        {layers.map((layer) => <li key={layer.number}><span>{layer.number}</span><strong>{layer.title}</strong><p>{layer.copy}</p></li>)}
      </ol>
    </div>
  );
}

function EvidenceGateScene({ activeLayer }) {
  return (
    <div className={styles.gateScene} aria-hidden="true">
      <div className={styles.gateFloor} />
      <div className={styles.dataStream} style={{ "--gate-progress": activeLayer }}><i /><i /><i /></div>
      <div className={styles.gateRow}>
        {evidenceLayers.map((layer, index) => (
          <div key={layer.number} className={`${styles.energyGate} ${index <= activeLayer ? styles.gatePassed : ""} ${index === activeLayer ? styles.gateActive : ""}`}>
            <span>{layer.number}</span><strong>{layer.title}</strong><i />
          </div>
        ))}
      </div>
      <span className={styles.gateCaption}>{activeLayer === 3 ? "EVIDENCE ALIGNED" : `LAYER ${activeLayer + 1} IN REVIEW`}</span>
    </div>
  );
}

const orbitTools = [
  { label: "Nguồn", Icon: FileCheck2 },
  { label: "Giáo trình", Icon: BookOpen },
  { label: "Cộng đồng", Icon: MessagesSquare },
  { label: "Kế hoạch", Icon: CalendarDays },
  { label: "Định hướng", Icon: Compass },
  { label: "Xác thực", Icon: BadgeCheck },
];

function CampusOrbit() {
  return (
    <div className={styles.campusOrbit}>
      <div className={styles.orbitCopy}>
        <p className={styles.kicker}>The connected campus</p>
        <h3>Mọi nguồn.<br /><em>Đúng bối cảnh.</em></h3>
        <p>StudentHub đặt dữ liệu chính thống, trải nghiệm cộng đồng và chuyên môn học thuật vào cùng một hành trình có thể kiểm tra.</p>
        <Link href="/dashboard" className={styles.orbitAction}>Mở không gian của bạn <ArrowRight aria-hidden="true" /></Link>
      </div>
      <div className={styles.orbitStage} aria-label="Mô phỏng không gian điều hành StudentHub">
        <span className={`${styles.orbitRing} ${styles.orbitRingOne}`} aria-hidden="true" />
        <span className={`${styles.orbitRing} ${styles.orbitRingTwo}`} aria-hidden="true" />
        {orbitTools.map(({ label, Icon }, index) => (
          <div key={label} className={styles.orbitTool} style={{ "--tool-index": index }} aria-hidden="true"><Icon /><span>{label}</span></div>
        ))}
        <div className={styles.productWindow}>
          <div className={styles.productTop}><BrandMark /><span>Hôm nay · 28.08</span></div>
          <div className={styles.productGreeting}><small>Chào Duy,</small><strong>Bạn muốn hiểu rõ điều gì?</strong></div>
          <div className={styles.productQuery}><span>Hỏi về học vụ, nguồn tin hoặc kế hoạch…</span><ArrowRight /></div>
          <div className={styles.productColumns}>
            <article><span>01</span><strong>Nguồn chính thống</strong><p>Dữ liệu có thời điểm và xuất xứ.</p></article>
            <article><span>02</span><strong>Thực tế cộng đồng</strong><p>Kinh nghiệm có đúng bối cảnh.</p></article>
            <article><span>03</span><strong>Kế hoạch của bạn</strong><p>Bước tiếp theo có thể hành động.</p></article>
          </div>
        </div>
      </div>
    </div>
  );
}

function PerspectiveChapter() {
  const chapterRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: chapterRef, offset: ["start end", "end start"] });
  const fillClip = useTransform(scrollYProgress, [0.18, 0.7], ["inset(0 100% 0 0)", "inset(0 0% 0 0)"]);
  const leftRotate = useTransform(scrollYProgress, [0.08, 0.54, 0.9], [0, -7, -20]);
  const rightRotate = useTransform(scrollYProgress, [0.08, 0.54, 0.9], [0, 7, 20]);
  const galleryY = useTransform(scrollYProgress, [0.2, 0.78], [120, 0]);

  return (
    <section ref={chapterRef} className={styles.perspectiveChapter} aria-labelledby="perspective-title">
      <div className={styles.perspectiveSticky}>
        <motion.div className={`${styles.foldSheet} ${styles.foldLeft}`} style={{ rotateY: leftRotate }} />
        <motion.div className={`${styles.foldSheet} ${styles.foldRight}`} style={{ rotateY: rightRotate }} />
        <div className={styles.foldSeam} aria-hidden="true" />
        <p className={styles.perspectiveKicker}>03 — Collective intelligence</p>
        <div className={styles.perspectiveTitleWrap}>
          <h2 id="perspective-title" className={styles.perspectiveOutline}>Một sự thật<br />ba góc nhìn.</h2>
          <motion.p className={styles.perspectiveFill} style={{ clipPath: fillClip }} aria-hidden="true">Một sự thật<br />ba góc nhìn.</motion.p>
        </div>
        <p className={styles.perspectiveCopy}>Cùng nhìn một việc, <em>hiểu toàn diện hơn.</em></p>
        <motion.div className={styles.perspectiveImages} style={{ y: galleryY }} aria-hidden="true">
          <span style={{ backgroundImage: "url(/images/atlas/atlas-official-archive.webp)" }} />
          <span style={{ backgroundImage: "url(/images/atlas/atlas-community-commons.webp)" }} />
          <span style={{ backgroundImage: "url(/images/atlas/atlas-expert-corridor.webp)" }} />
        </motion.div>
      </div>
    </section>
  );
}

export default function LivingCampusAtlas() {
  const [showOpening, setShowOpening] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeLayer, setActiveLayer] = useState(0);
  const [activeSource, setActiveSource] = useState(1);
  const { scrollYProgress } = useScroll();
  const heroImageY = useTransform(scrollYProgress, [0, 0.24], ["0%", "18%"]);
  const heroImageScale = useTransform(scrollYProgress, [0, 0.24], [1.04, 1.16]);
  const heroCopyY = useTransform(scrollYProgress, [0, 0.2], [0, -90]);
  const heroCopyOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);

  // High-performance rAF-throttled pointer aura
  const heroAuraRef = useRef(null);
  const auraRafRef = useRef(null);

  const moveHeroAura = useCallback((event) => {
    const clientX = event.clientX;
    const clientY = event.clientY;
    const currentTarget = event.currentTarget;

    if (auraRafRef.current) {
      cancelAnimationFrame(auraRafRef.current);
    }

    auraRafRef.current = requestAnimationFrame(() => {
      const aura = heroAuraRef.current;
      if (!aura || !currentTarget) return;
      const bounds = currentTarget.getBoundingClientRect();
      aura.style.opacity = "1";
      aura.style.transform = `translate3d(${clientX - bounds.left - 190}px, ${clientY - bounds.top - 190}px, 0)`;
    });
  }, []);

  return (
    <div className={styles.page}>
      <AnimatePresence>{showOpening && <OpeningSequence onComplete={() => setShowOpening(false)} />}</AnimatePresence>
      <a className={styles.skipLink} href="#main-content">Bỏ qua điều hướng</a>
      <motion.div className={styles.progress} style={{ scaleX: scrollYProgress }} aria-hidden="true" />

      <header className={styles.header}>
        <Link href="/" className={styles.logoLink} data-cursor-text="Home"><BrandMark /></Link>
        <nav className={styles.desktopNav} aria-label="Điều hướng chính">
          <a href="#trust">Kiểm chứng</a>
          <a href="#knowledge-core">Lăng kính quang học</a>
          <a href="#intelligence">Cộng đồng</a>
          <Link href="/expert">Chuyên gia</Link>
          <Link href="/dashboard">Dashboard</Link>
        </nav>
        <div className={styles.headerActions}>
          <Link href="/login" className={styles.loginLink}>Đăng nhập</Link>
          <Link href="/trust" className={styles.headerCta}>Mở Trust Engine <ArrowRight aria-hidden="true" /></Link>
          <button
            type="button"
            className={styles.menuButton}
            aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((current) => !current)}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
        {menuOpen && (
          <motion.nav
            className={styles.mobileNav}
            aria-label="Điều hướng di động"
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            <a href="#trust" onClick={() => setMenuOpen(false)}>Kiểm chứng</a>
            <a href="#knowledge-core" onClick={() => setMenuOpen(false)}>Lăng kính quang học</a>
            <a href="#intelligence" onClick={() => setMenuOpen(false)}>Cộng đồng</a>
            <Link href="/expert">Chuyên gia</Link>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/trust">Mở Trust Engine</Link>
          </motion.nav>
        )}
      </header>

      <main id="main-content">
        {/* ========================================================================= */}
        {/* CHAPTER 1: LIVING CAMPUS HERO */}
        {/* ========================================================================= */}
        <section className={styles.hero} aria-labelledby="hero-title" onPointerMove={moveHeroAura} onPointerLeave={() => { if (heroAuraRef.current) heroAuraRef.current.style.opacity = "0"; }}>
          <motion.div className={styles.heroMedia} style={{ y: heroImageY, scale: heroImageScale }} aria-hidden="true">
            <div className={styles.heroImage} />
            <div className={styles.heroVeil} />
            <div className={styles.atlasOrbit}><i /><i /><i /></div>
          </motion.div>
          <div ref={heroAuraRef} className={styles.pointerAura} aria-hidden="true" />
          <HeroMonolith />
          <motion.div className={styles.heroContent} style={{ y: heroCopyY, opacity: heroCopyOpacity }}>
            <p className={styles.chapter}>The Living Campus Atlas — 2026</p>
            <h1 id="hero-title" className={styles.heroTitle}>
              <span className={styles.titleClip}><motion.span initial={{ y: "108%" }} animate={{ y: 0 }} transition={{ delay: 1.02, duration: 0.92, ease: EASE }}>Hiểu đúng.</motion.span></span>
              <span className={styles.titleClip}><motion.em initial={{ y: "115%", rotate: 2 }} animate={{ y: 0, rotate: 0 }} transition={{ delay: 1.14, duration: 1.02, ease: EASE }}>Đi xa.</motion.em></span>
            </h1>
            <p className={styles.heroCopy}>Một hệ điều hành học tập biết kiểm chứng trước khi khuyên bạn.</p>
            <div className={styles.heroActions}>
              <Link href="/trust" className={styles.primaryAction} data-cursor-text="Mở"><ArrowDownRight aria-hidden="true" />Kiểm tra trước khi tin</Link>
              <a href="#knowledge-core" className={styles.textAction}>Khám phá lăng kính quang học <ArrowRight aria-hidden="true" /></a>
            </div>
          </motion.div>
          <div className={styles.heroIndex} aria-hidden="true"><span>01</span><span>02</span><span>03</span><span>04</span></div>
          <div className={styles.scrollCue} aria-hidden="true"><span>Cuộn để mở bản đồ</span><i /></div>
        </section>

        {/* ========================================================================= */}
        {/* CHAPTER 2: LIVING KNOWLEDGE CORE (ARCHITECTURAL OPTICAL ARRAY) */}
        {/* ========================================================================= */}
        <section className={styles.knowledgeCoreSection} id="knowledge-core" aria-labelledby="core-title">
          <div className={styles.coreHeadingWrap}>
            <Reveal>
              <p className={styles.kickerDark}>Architectural optical array</p>
              <h2 id="core-title" className={styles.darkTitle}>Lăng kính quang học<em>chân lý.</em></h2>
            </Reveal>
            <Reveal className={styles.coreSubcopy} delay={0.1}>
              <p>
                Kiểm chứng chân lý bằng sự đồng trục quang học. Khi thông tin có cơ sở chính thức và đối soát đa nguồn, các tầng bản vẽ sẽ khóa khớp chính xác.
              </p>
            </Reveal>
          </div>

          <Reveal delay={0.15} className={styles.coreVisualWrap}>
            <TriLensCore />
          </Reveal>
        </section>

        {/* ========================================================================= */}
        {/* CHAPTER 3: TRUST PIPELINE & 4-LAYER EVIDENCE SEQUENCE */}
        {/* ========================================================================= */}
        <section className={styles.trustSection} id="trust" aria-labelledby="trust-title">
          <div className={styles.trustIntro}>
            <Reveal>
              <p className={styles.kicker}>Trust intelligence</p>
              <h2 id="trust-title" className={styles.lightTitle}><span>Đừng tin</span><em>vội.</em></h2>
              <p className={styles.lightCopy}>Đưa ảnh, đường dẫn hoặc lời nhắn. Nhận kết luận có nguồn, mức rủi ro và điều còn chưa biết.</p>
              <Link href="/trust" className={styles.underlinedAction}><ScanSearch aria-hidden="true" />Kiểm tra một nội dung<ArrowRight aria-hidden="true" /></Link>
            </Reveal>
            <div className={styles.mineralForm} aria-hidden="true"><span /><span /><span /><span /></div>
          </div>

          <div className={styles.evidencePanel}>
            <p className={styles.panelKicker}>Kiểm tra qua 4 lớp bằng chứng</p>
            <EvidenceGateScene activeLayer={activeLayer} />
            <div className={styles.evidenceRail} aria-hidden="true"><span style={{ transform: `translateY(${activeLayer * 100}%)` }} /></div>
            <ol className={styles.evidenceList}>
              {evidenceLayers.map((layer, index) => (
                <li key={layer.number}>
                  <button
                    type="button"
                    className={index === activeLayer ? styles.activeLayer : ""}
                    onMouseEnter={() => setActiveLayer(index)}
                    onFocus={() => setActiveLayer(index)}
                    onClick={() => setActiveLayer(index)}
                    aria-pressed={index === activeLayer}
                  >
                    <span>{layer.number}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <strong>{layer.title}</strong>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-teal-300">{layer.opticalStage}</span>
                      </div>
                      <p>{layer.copy}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ol>
            <motion.div key={activeLayer} className={styles.verdict} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: EASE }}>
              <span className={styles.verdictIcon}><Check aria-hidden="true" /></span>
              <span><small>Kết luận có giải trình</small><strong>{evidenceLayers[activeLayer].title} đang được soi rõ</strong></span>
              <span className={styles.verdictMeta}>Nguồn · giới hạn · bước tiếp theo</span>
            </motion.div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* CHAPTER 4: PERSPECTIVE CHAPTER */}
        {/* ========================================================================= */}
        <PerspectiveChapter />

        {/* ========================================================================= */}
        {/* CHAPTER 5: COLLECTIVE INTELLIGENCE */}
        {/* ========================================================================= */}
        <section className={styles.intelligenceSection} id="intelligence" aria-labelledby="intelligence-title">
          <CampusOrbit />
          <div className={styles.intelligenceHeading}>
            <Reveal>
              <p className={styles.kickerDark}>Collective intelligence</p>
              <h2 id="intelligence-title" className={styles.darkTitle}>Không một nguồn nào<em>đủ cả.</em></h2>
            </Reveal>
            <Reveal className={styles.intelligenceCopy} delay={0.12}>
              <p>Quy định cho bạn <strong>sự thật chính thức.</strong> Cộng đồng cho bạn<strong> thực tế vận hành.</strong> Chuyên gia cho bạn<strong> phạm vi áp dụng.</strong></p>
            </Reveal>
          </div>
          <div className={styles.sourceGallery}>
            {intelligenceSources.map((source, index) => (
              <article
                key={source.number}
                className={`${styles.sourcePanel} ${index === activeSource ? styles.sourceActive : ""}`}
                onMouseEnter={() => setActiveSource(index)}
                onFocusCapture={() => setActiveSource(index)}
              >
                <div className={styles.sourceImage} style={{ backgroundImage: `url(${source.image})` }} aria-hidden="true" />
                <div className={styles.sourceShade} aria-hidden="true" />
                <div className={styles.sourceContent}>
                  <span className={styles.sourceNumber}>{source.number}</span>
                  <h3>{source.title}</h3>
                  <p className={styles.sourceEyebrow}>{source.eyebrow}</p>
                  <div className={styles.sourceDetail} aria-hidden={index !== activeSource}>
                    <p>{source.copy}</p>
                    <Link href={source.href} aria-label={`Đọc bối cảnh ${source.title}`}>Đọc bối cảnh <ArrowRight aria-hidden="true" /></Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* CHAPTER 6: CLOSING THRESHOLD */}
        {/* ========================================================================= */}
        <section className={styles.closing} aria-labelledby="closing-title">
          <div className={styles.closingMedia} aria-hidden="true" /><div className={styles.closingShade} aria-hidden="true" />
          <Reveal className={styles.closingContent}>
            <p className={styles.chapter}>Your next clear move</p>
            <h2 id="closing-title">Bớt đoán.<em>Bắt đầu biết.</em></h2>
            <div className={styles.closingActions}>
              <Link href="/register" className={styles.primaryAction}>Bắt đầu với StudentHub <ArrowRight aria-hidden="true" /></Link>
              <Link href="/login" className={styles.closingLogin}>Đã có tài khoản — Đăng nhập</Link>
            </div>
          </Reveal>
          <footer className={styles.footer}>
            <BrandMark />
            <nav aria-label="Điều hướng cuối trang"><Link href="/trust">Trust</Link><Link href="/community">Community</Link><Link href="/expert">Experts</Link><Link href="/cases">Case Lab (Demo)</Link></nav>
            <div className={styles.legalLinks}><Link href="/settings/privacy">Quyền riêng tư</Link><Link href="/settings/privacy#terms">Điều khoản</Link></div>
          </footer>
        </section>
      </main>
    </div>
  );
}
