# Bộ prompt dự án — StudentHub AI

Ngày: 08/09/2026 · Trạng thái: `PROMPT_LIBRARY_NOT_EXECUTED`.

Đây là thư viện prompt cho những đợt công việc sau, không phải log tác vụ đã chạy. Chưa tạo font, ảnh, video, model 3D hoặc thay code bằng các prompt này. Kích hoạt đúng prompt khi giao đúng nhiệm vụ; không chạy cả thư viện một lần.

## 1. Quy ước dùng chung

Agent làm việc trong repository phải đọc AGENTS/Vault và bộ tài liệu `docs/frontend/national-experience-2026-09-08/`. Source of truth: scope ở SCOPE-REDUCTION, yêu cầu ở SPEC, kiểm chứng ở ACCEPTANCE. Nếu có chỉ đạo mới của chủ dự án, cập nhật traceability thay vì tự bảo vệ spec cũ.

Giữ stack hiện tại. Không đưa khóa học, LMS, practice/gamification hoặc chatbot tổng quát vào sản phẩm đích. Trust/Community/Expert có authority khác nhau; demo và live tách rõ. Không tự commit/push/deploy, gửi hồ sơ, bật CONTROLLED hoặc automatic writeback. Không dùng private evidence, OCR, token hay credential trong prompt.

Khi chạy công cụ tạo asset trả phí, công việc phải có scope và budget được giao trước. Lưu prompt thực tế, model/tool/version nếu có, reference, ngày, output hash và các bước sửa. Không bịa một Prompt Log lịch sử từ thư viện này.

## 2. P01 — Product charter và hồ sơ dự thi

Đầu ra: Markdown; phù hợp ngay trong giai đoạn lập tài liệu.

```text
Đóng vai principal product engineer cho StudentHub AI. Đọc bộ tài liệu ở
docs/frontend/national-experience-2026-09-08/ và source liên quan. Chỉ làm tài liệu.

Định vị: giúp sinh viên kiểm chứng thông tin trước khi quyết định, qua nguồn,
bối cảnh, Community, Expert và hồ sơ bằng chứng có phiên bản. Không có khóa học.
Bối cảnh người dùng: cuộc thi AI qua Thành đoàn TP.HCM năm 2026. Không tự xác
định tên/bảng thi nếu COMPETITION-FIT chưa đủ evidence.

Soạn: one-page charter, problem/JTBD, ba case trọng tâm, phạm vi/non-goals,
phần tự xây dựng và phần dùng công cụ ngoài, risk register, WBS có owner theo
vai trò/phụ thuộc, rubric mapping và claim ledger. Mỗi claim về AI, tốc độ,
quyền và impact phải có nguồn evidence hoặc ghi là giả thuyết/chưa kiểm chứng.
Đừng chấm cơ hội giải Nhất theo phần trăm khi không có dữ liệu đối thủ/rubric.

Mỗi mục đề xuất phải nêu đầu ra review được, điều kiện đạt, chi phí cơ hội và
lý do nó phục vụ case trọng tâm. Đưa feature không phục vụ case vào deferred.
Không thêm một trụ cột sản phẩm để làm báo cáo có vẻ lớn hơn.
```

## 3. P02 — Bố cục và typography desktop/mobile

Đầu ra: copy deck và hai phương án A1/A2; mỗi viewport xuất riêng, không ghép collage.

```text
Design a Vietnamese-first StudentHub AI landing and Trust workspace using
the direction “Khai Minh”: clear evidence, human judgment, quiet depth.
This is a focused information-verification product, not a course platform.

Use #07090E canvas, #0C131B solid reading surfaces, #F3F1EA primary text,
#B9C6CC secondary text and #8BD9C3 brand accent. Be Vietnam Pro is the UI font;
Lora may appear in one short display phrase. Monospace is for IDs/code only.

Produce separate 1440px desktop and 390px mobile layouts with real Vietnamese
copy: “Hiểu đúng. Đi xa.”; “Kiểm tra nguồn tin, đối chiếu bối cảnh và xem điều
còn thiếu trước khi bạn quyết định.” Primary CTA: “Kiểm tra thông tin”.
Secondary: “Xem một ví dụ”. Navigation: Kiểm chứng / Cộng đồng / Chuyên gia.

Desktop: 1280px max container, 12-column grid, copy 5 columns, hero art 7.
Mobile: copy and CTA before the static poster. Body 16–18px, important labels
at least 14px, H1 44–88px fluid with Vietnamese-safe line height. No course,
lesson, frontend/backend learning nodes, fabricated metrics or testimonial.

A1 uses Lora on “Đi xa.” only. A2 is entirely sans with identical composition
and content. Show header, hero, one case/source section, one result specimen,
footer, and a Trust empty/partial/unavailable state sheet. Label fabricated
specimens as illustrative. Do not generate business verdicts or credentials.

Provide spacing/type/color annotations, 320px and 200% text expansion notes,
keyboard/focus behavior, mobile CTA reachability and the reason for each major
hierarchy choice. No text baked into hero artwork, no full-screen intro.
```

## 4. P03 — Chế tác font StudentHub Display

Đầu ra: brief và font proof trước; binary font chỉ khi có workflow chế tác thật.

```text
You are a type designer working on an original StudentHub Display family.
The UI remains Be Vietnam Pro. This project replaces one display role, not
adds several global font families. Do not claim an alphabet image is a font.

Design a contemporary Vietnamese academic display face with open counters,
moderate contrast, clear I/l/1 and O/0, restrained personality and generous
space for stacked diacritics. It must read well at 44–88 CSS px on a dark
canvas and remain usable at 28–32px for selected short headings.

Start with a specimen containing:
Hiểu đúng. Đi xa.
Kiểm chứng trước khi tin — nguồn nào, thời điểm nào, phạm vi nào?
Nguyễn Thị Thùy Dương · Đặng Hoàng Phúc
Ă Â Đ Ê Ô Ơ Ư · ă â đ ê ô ơ ư
Ắ Ằ Ẳ Ẵ Ặ · Ấ Ầ Ẩ Ẫ Ậ · Ế Ề Ể Ễ Ệ
Ố Ồ Ổ Ỗ Ộ · Ớ Ờ Ở Ỡ Ợ · Ứ Ừ Ử Ữ Ự
0123456789 · 1.234.567 ₫ · 08/09/2026 · 95,5%

Deliver design rationale, glyph coverage plan, anchors/mark positioning,
kerning strategy, weight/style plan, NFC/NFD rendering proof, metric-compatible
fallback approach and licensing/provenance notes. If building a real font,
include editable glyph source, versioned OpenType/WOFF2 exports and browser
proof. Report missing glyphs explicitly. Do not invent source files or a
successful font validation. No imitation of a proprietary logo or typeface.

The first review is a static proof, not animated typography. This work must
not delay the core product: fall back to the existing approved display face
until the custom font meets coverage, legibility and transfer budgets.
```

## 5. P04 — Hero poster “Hiên tri thức”

Đầu ra: một ảnh desktop 16:9. Nội dung chữ được ghép bằng UI ở bước thiết kế, không có trong ảnh.

```text
Create one original 16:9 hero artwork for StudentHub AI, a Vietnamese student
information-verification product. Direction: “Hiên tri thức” — a contemporary
knowledge pavilion with quiet civic dignity and a human scale.

Compose a shaded university courtyard inspired by everyday Vietnamese
academic architecture: deep eaves, a restrained sun screen, mineral stone,
matte ceramic, warm wood, a few paper-like planes and a calm planted edge.
Use a plausible architectural model or crafted editorial 3D still, not a
fantasy palace. One coherent light direction. Matte materials and subtle jade
reflections against deep midnight; warm ivory highlights remain controlled.

Place the main pavilion in the right 55% of the frame. Keep the left 45%
visually quiet, dark and low-detail for HTML text; no bright window or beam
crosses this area. Three subtle material layers suggest source, context and
careful comparison without implying that their authority is equal.

Camera: architectural three-quarter view, moderate perspective, no fisheye.
Clear silhouette at thumbnail size, readable depth without bloom haze.
The still must look complete without animation. No words, letters, numbers,
logos, seals, flags, maps, identifiable university branding, floating HUD,
robot, code rain, circuit board, course tiles or fabricated data. Avoid neon
purple/cyan, excessive particles, fake glass dashboards and ornamental noise.
```

Biến thể HERO-01M cho một lần tạo riêng: giữ art direction/reference đã duyệt, xuất 4:5, đặt pavilion ở nửa dưới, giảm chi tiết nền; HTML copy/CTA nằm ngoài vùng ảnh. Không ghép bản desktop và mobile trong một output.

## 6. P05 — Video loop từ hero đã duyệt

Đầu ra: một clip và ghi chú kiểm tra loop. Chỉ dùng ảnh gốc/reference đã được chọn.

```text
Animate the approved StudentHub “Hiên tri thức” hero still into one restrained
8-second seamless ambient loop, 24 fps, 192 frames. Preserve the exact scene,
materials, architecture, light direction and desktop text-safe area.

Motion: a very small closed camera arc that returns to its starting position
and velocity, a faint leaf-shadow movement, and one subtle jade reflection
on a material edge. The architecture remains rigid. The left 45% stays quiet
and dark for text for the entire loop. No opening reveal that must finish
before the page is understandable. No audio.

No cuts, morphing buildings, new objects, orbit through text, focus pumping,
exposure flash, flicker, large particles, scanning HUD, labels or simulated
system status. Do not add a watermark or claim this is live product footage.

Return the master separately from the web delivery rendition. An encoder
must verify actual codec/MIME, duration, frame count and loop seam; target a
desktop web rendition at most 2.5MB. Do not pretend the generation prompt
guarantees file size or frame accuracy. If seamless motion cannot be achieved,
report the defect and retain the static poster as the usable alternative.
```

Bản mobile opt-in làm riêng theo crop mobile, budget ≤1.2MB; không tự tải cùng desktop. Xem animation tại tốc độ thật và slow playback; kiểm tra frame sáng nhất, first/last frame và browser pause. Không dùng animated WebP làm reduced-motion fallback.

## 7. P06 — Bộ ảnh Source / Community / Expert

Mỗi dòng là một asset độc lập; không tạo board nhiều ảnh để dùng làm ảnh web.

```text
Create one editorial still for StudentHub AI in the approved Khai Minh visual
system: mineral midnight, warm ivory, restrained jade, believable Vietnamese
academic context, one coherent light direction, space for nearby HTML copy.
This is illustrative product artwork, not proof of real users or institutions.
No rendered words, private documents, logos, badges, ratings or invented data.
```

Ghép prompt chung với đúng một shot:

| Asset | Shot prompt bổ sung | Crop / lưu ý |
| --- | --- | --- |
| SOURCE-01 | “A quiet comparison desk, two plain paper layers and one transparent separator, subtle difference in dates implied by shape only, rigorous and calm, no readable content.” | 4:3; minh họa thao tác đối chiếu, không làm giả screenshot evidence |
| COMMUNITY-01 | “A small group of Vietnamese young adults in a shaded campus common area comparing notes, candid collaborative body language, natural anatomy, documentary-inspired but clearly illustrative.” | 3:2; nếu cần proof người thật, dùng ảnh có consent thay vì AI |
| EXPERT-01 | “A close view of a careful annotation process at a mentor desk, hand and neutral notebook, thoughtful scholarly atmosphere, no identifiable expert, no diploma, no institutional endorsement.” | 4:3; không dùng làm avatar verified |
| OG-01 | “A reduced sculptural view of the same knowledge pavilion, strong silhouette on mineral midnight, reserved empty area for text added later, calm ivory and jade.” | 1200×630; title/logo ghép từ asset thật ở bước thiết kế |

Art director duyệt consistency, crop, giải phẫu, safe area và quyền sử dụng. Không dùng một ảnh minh họa người AI làm bằng chứng đã pilot.

## 8. P07 — Dựng hero 3D có giới hạn

Đầu ra: scene/blockout, poster tương đương, asset manifest và phép đo prototype. Chỉ triển khai khi được giao nhiệm vụ này.

```text
Use SPEC HERO-01/02, MED-01/02 and PERF-01 for StudentHub AI. Read the existing
ProgressiveKnowledgeUniverse and fallback before designing the replacement.
Build one knowledge-pavilion scene that explains the product's purpose.
Do not introduce a new course/IT ontology or an independent WebGL framework.

First deliver a blockout with a static poster and composition review. Then
optimize to the agreed asset/draw-call/triangle/texture budgets, with measured
runtime results. DOM owns every heading, action and accessible description.
Render only when allowed/visible; stop offscreen/hidden; context loss returns
the poster. Mobile is static by default, reduced-motion is static, and no
parallel background video runs behind the same scene.

No verdict, expert status or security state may come from scene timing.
Report actual asset sizes/frame timings, low-device behavior and limitations.
Do not claim 60fps, WCAG compliance or production readiness without evidence.
```

## 9. P08 — Gỡ khóa học theo phạm vi được giao

Đầu ra: changeset tương lai; **chỉ chạy khi chủ dự án yêu cầu gỡ code**.

```text
Implement the requested course removal in StudentHub AI using SCOPE-REDUCTION
CUT-1 through CUT-3 and SPEC SCOPE-01. Read the existing worktree and preserve
unrelated changes. Inventory navigation, homepage imports, hero/final/footer
CTAs, command search, atlas deep links, lesson routes, background mappings,
tests and build budgets before editing.

Remove course/lesson/practice promotion from the target core product. Retired
deep links must explain the removal and offer a useful destination. Do not
rename courses into an academy or leave a “coming soon” teaser. Keep shared
auth, transcript/course records, expert qualification quiz and review logic.

Do not delete databases, user notes, progress, storage objects or shared APIs.
If an endpoint is exclusive to retired functionality, document consumers and
data policy before retiring it. Verify no dead core links, no course chunk on
core paths, no changed authority and no broken deep-link behavior. Update
tests to the new scope with meaningful assertions; do not remove failures
just to get green. Report exact files and remaining cleanup separately.
No commit/push/deploy unless separately instructed.
```

## 10. P09 — Backend golden flow và recovery

Đầu ra: diagnosis, spec delta nếu cần, changeset và evidence khi được giao triển khai.

```text
Act as the backend owner for StudentHub AI. Read SPEC BE-01…04, REL-01/02,
SEC-01…03 and LAB-01/02, plus the actual Trust service/repository/routes,
session, realtime and outbox code. Keep the current stack and authority model.

Make the existing Trust golden flow verifiable: validate/authorize input,
bind run and owner, commit case/revision with the required integration event,
ack persisted only after commit, read back the correct snapshot. Ensure
same scoped idempotency key+digest deduplicates; different digest conflicts.
Separate a completed analysis, failed persistence and pending delivery.

For any claim of restart resilience, prove durable acceptance, lease/fencing,
worker death/restart, stale completion rejection and bounded retries on an
owned disposable test database. Prove private event isolation across two
instances and reconnect cursors. Do not claim that an in-memory mock proves
SKIP LOCKED, RLS or crash durability. Missing environment must remain blocked.

Labbe HTTP must never sit inside the Trust commit transaction. Keep minimal
events, HTTPS staging scope, no CONTROLLED/writeback, and read-only assurance
with its existing authorization/freshness. Do not redesign Labbe. Preserve
unrelated realtime work. Produce IDs/hashes/rows/attempts/recovery evidence
without credentials, raw screenshots, OCR or private evidence in logs.
```

## 11. P10 — AI/data evaluation có thể phản biện

Đầu ra: Markdown protocol/data/model cards, manifest và kết quả đo thật nếu có quyền chạy.

```text
Read SPEC AI-01…03 and the historical CORE-SYSTEM-AUDIT report. Verify the
current corpus and runtime model lineage; do not assume old duplicate counts
or registry metrics remain true. First document dataset ownership/provenance,
label definitions, exact/near duplicates and campaign/source/time leakage.

Define a locked evaluation protocol before tuning. Compare the rule baseline,
retrieval-enhanced baseline and full candidate on the same held-out cases.
Separate risk, factual validity, source quality and action appropriateness.
Use independent review/adjudication for difficult high-risk cases.

Report sample sizes, task precision/recall, false reassurance, abstention and
coverage, citation correctness, confidence intervals, latency and cost. Bind
results to predictions, labels, code, data split, model and prompt hashes.
Do not infer scientific model quality from contract-test pass counts.

If the full candidate does not improve over the baseline, preserve that
finding and recommend the simpler system. No hardcoded accuracy, copied
benchmark claim, hidden test tuning or automatic user-data training. Identify
exactly what the team built and what comes from a provider or open source.
```

## 12. P11 — Frontend implementation sau khi có hướng được chọn

```text
Implement only the assigned StudentHub presentation slice from SPEC. Read
the existing component, token and API adapter ownership. Keep Trust,
Community, Expert and case/report as the core; no course/LMS reinstatement.

Apply canonical fonts/type scale, readable solid surfaces and the chosen
A1/A2 layout first. Map UI states to existing typed contracts; never fabricate
progress or collapse partial/unknown/conflict/unavailable. Keep one current
stage panel, source drill-down and keyboard access to limitations.

Add the static hero before motion. Use the assigned original assets only.
Match mobile/reduced-motion/error/fallback behavior and transfer budgets.
Do not edit domain logic, server permissions, evidence authority or Labbe
to make a visual prototype appear complete. Missing data is an explicit UI
state, not permission to invent it.

Deliver scoped changes, viewport/state screenshots, actual rendered fonts,
keyboard/zoom/media checks and a concise gap report. Do not rebaseline visual
tests blindly. Leave production release claims to the evidence review.
```

## 13. P12 — Review như hội đồng độc lập

```text
Review StudentHub AI using REPORT, SPEC, ACCEPTANCE and the confirmed contest
rubric if available. Be an independent reviewer: do not reward the number of
routes, layers, models or visual effects. Do not edit the implementation.

For each proposed score, cite an artifact and state its date/candidate/scope.
Separate code presence, local tests, live staging, user evidence and unresolved
claims. Ask whether the system improves one concrete verification task over
the baseline, whether it admits missing evidence, and whether permissions,
commit/retry/recovery and Vietnamese readability survive the failure cases.

Produce findings ordered by impact, an internal weighted score with arithmetic,
five questions a judge is likely to ask, and the smallest prioritized actions
that would change the conclusion. Do not invent a winning probability.
Check attribution and real Prompt Log; the library here is not a historical log.
If a claim is unsupported, downgrade the claim, not the evidence standard.
```

## 14. Chốt đầu ra mỗi lần dùng prompt

Lưu brief/reference và phiên bản trước khi chạy; nhận đúng artifact đã giao; kiểm tra bằng người và công cụ phù hợp; ghi output hash và lỗi còn lại. Prompt viết hay không bảo đảm ảnh đẹp, font hoạt động, model tốt hoặc phần mềm an toàn. Giá trị của bộ prompt là làm rõ mục tiêu, giới hạn và cách biết kết quả đã đạt.
