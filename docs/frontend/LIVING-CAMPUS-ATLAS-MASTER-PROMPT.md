# StudentHub AI — Living Campus Atlas Master Prompt

## Mục đích

Prompt này dùng để tái tạo hoặc nâng cấp landing page StudentHub AI trong Codex, Claude Code, Cursor hoặc một coding agent tương đương. Nó chuyển các bài học thị giác từ OpenHero, Hyliox và các demo Hyliox trong video thành một hệ thiết kế riêng; không sao chép logo, nội dung, asset hay nhận diện của các website tham khảo.

## Visual DNA đã kiểm tra

- OpenHero: video là lớp khí quyển full-screen; headline vẫn là nội dung HTML độc lập; một hiệu ứng chrome trên chữ/logo tạo điểm nhớ; UI còn lại rất ít.
- Hyliox: Nimbus Sans với headline khoảng `118px`, line-height gần `0.88`; preloader có tiến độ; vật thể 3D đi xuyên lớp chữ; section dài nhưng thay đổi nhịp liên tục; màu neon chỉ dùng làm tín hiệu.
- Rive Noire demo: xe và dải sáng là một sân khấu; typography serif tạo cảm giác gallery; chuyển collection bằng ánh sáng, mask và camera chứ không bằng card carousel.
- Villa Maravilla demo: ảnh kiến trúc full-bleed, serif editorial, text/image transition theo chương và nhịp cuộn chậm.

## Master prompt

```text
Bạn là một Creative Director, Interaction Designer và Senior Frontend Engineer chuyên xây website Awwwards/FWA. Hãy thiết kế và triển khai landing page StudentHub AI mang tên “The Living Campus Atlas”.

MỤC TIÊU
Tạo một website học thuật điện ảnh, có cảm giác như một triển lãm kiến trúc sống. Website phải truyền tải ba năng lực thật của sản phẩm: Trust Intelligence, Community Intelligence và Scoped Expert Knowledge. Không được biến nó thành dashboard marketing, trang SaaS card-grid hoặc một bản sao của website tham khảo.

CREATIVE DIRECTION
- Theme: deep dark cinematic architecture.
- Palette duy nhất: off-black #07090E, warm ivory #F1EEE6, mineral mint #79D8BD, graphite concrete.
- Typography: wide neo-grotesk cho statement; high-contrast Didone italic cho từ cảm xúc; mono chỉ dùng cho chapter index và evidence labels.
- Headline tối đa 2 dòng, line-height 0.82–0.9, tracking âm mạnh nhưng dấu tiếng Việt phải hoàn chỉnh.
- Hero là một cảnh mở phim: thư viện brutalist ban đêm, nền ảnh/video full-bleed, chữ HTML phía trước và một ribbon giấy–kính đi xuyên giữa các lớp chữ.
- Không purple/blue AI gradient, không glow quanh mọi thứ, không pill spam, không badge giả, không icon rocket/shield sáo rỗng, không card trong card.

CẤU TRÚC 5 CHƯƠNG
1. Opening sequence: preloader 1.2–1.5 giây với Trust / Context / Clarity, progress line và curtain reveal. Bỏ qua ngay khi prefers-reduced-motion.
2. Hero: “HIỂU ĐÚNG. / ĐI XA.”; CTA “MỞ STUDENTHUB”; parallax background; kinetic line-mask reveal; pointer aura; knowledge ribbon có chiều sâu.
3. Trust: đảo nền warm ivory / off-black; bốn lớp Sàng lọc → Ngữ cảnh → Đối chứng → Kết luận; mỗi lớp phản hồi hover, focus và click; kết quả luôn nêu nguồn, giới hạn và bước tiếp theo.
4. Perspective transition: pinned paper-fold scene; headline outline “MỘT SỰ THẬT / BA GÓC NHÌN.” được fill theo scroll; ba ảnh Official / Community / Expert trồi lên sau đường seam xanh khoáng.
5. Intelligence gallery + closing: ba vertical slices co giãn theo hover/focus; CTA cuối “BẠN KHÔNG CẦN TỰ ĐOÁN / MỘT MÌNH.” trên cảnh campus threshold lúc bình minh.

MOTION SYSTEM
- Easing chuẩn: cubic-bezier(0.16, 1, 0.3, 1).
- Page entrance: opacity 0→1, blur 6px→0, duration 0.35–0.5s.
- Text reveal: mỗi line nằm trong overflow:hidden; translateY(108%)→0; stagger 80–140ms.
- Parallax: background y 0→18%, scale 1.04→1.16; chỉ animate transform và opacity.
- Paper fold: sticky section 160–180svh; hai sheet rotateY tối đa ±20deg; seam có mineral-mint glow hạn chế.
- Outline-to-fill: giữ một outline text bên dưới và một solid duplicate phía trên; animate clip-path theo scroll progress.
- Accordion gallery: flex ratio 0.72→1.65 trong 650–850ms; ảnh scale 1.08→1; mô tả xuất hiện sau width transition.
- Cursor: fine pointer mới bật; follower dùng spring stiffness 300–320, damping 28; tắt hoàn toàn trên touch.
- Reduced motion: bỏ preloader delay, parallax, sticky fold và continuous ribbon animation.

ENGINEERING GUARDRAILS
- Next.js App Router + React + CSS Modules + Framer Motion/GSAP hiện có; không đổi framework.
- Semantic HTML, skip link, focus-visible, keyboard parity cho mọi hover interaction.
- Dùng poster WebP/AVIF làm LCP. Video nếu có phải muted, autoplay, loop, playsInline, pause bằng IntersectionObserver và không chứa thông tin thiết yếu.
- Không animate top/left/width/height trong scroll loop. Không tạo React state trên mỗi mousemove; cập nhật transform qua ref hoặc motion value.
- Mỗi asset có crop cố định, alt phù hợp nếu mang nội dung; decorative visual phải aria-hidden.
- Mobile là một composition riêng: ribbon mờ hơn, gallery xếp dọc, paper fold không sticky, headline không quá 3 dòng.
- Kết thúc bằng ESLint, production build, kiểm tra 1440×900 và 390×844, zero horizontal overflow, prefers-reduced-motion và keyboard focus.

TIÊU CHÍ THẤT BẠI
Kết quả thất bại nếu: trông như template AI gradient; hero có quá nhiều badge; typography chỉ là font-size lớn mà không có line choreography; hiệu ứng làm giảm khả năng đọc; mobile chỉ là desktop bị thu nhỏ; hoặc nội dung Trust/Community/Expert bị thay bằng claim hư cấu.
```

## Prompt tạo asset hình ảnh

```text
Photoreal cinematic brutalist university architecture for StudentHub AI, off-black concrete, warm ivory library light, mineral-mint reflection on wet stone, restrained volumetric haze, premium editorial film grain, strong negative space for HTML typography, realistic materials, no readable text, no logo, no UI, no purple, no generic galaxy, no watermark.
```

## Mapping triển khai hiện tại

- React: `frontend/src/components/landing/LivingCampusAtlas.jsx`
- CSS motion/design system: `frontend/src/components/landing/living-campus-atlas.module.css`
- Generated optimized assets: `frontend/public/images/atlas/`

## Reference synthesis v2 — 2026-08-28

Phân tích trực tiếp `robinpayot.com`, `sendoso.com`, `meermohsin.me`, `lucerra.co`, `usavionix.com`, `edolus.com` và hai video người dùng:

- Robin Payot: coi WebGL như một hành trình camera, không phải vật trang trí.
- Sendoso: product UI sáng, typography thân thiện và vật thể 3D giúp giải thích sản phẩm.
- Meer Mohsin: staging táo bạo, canvas có chiều sâu và chuyển chương có chủ đích.
- Lucerra / Edolus: mở cảnh tối giản như phim, âm thanh là tùy chọn chứ không bắt buộc.
- USAvionix: boot sequence và telemetry tạo cảm giác hệ thống sống; chỉ giữ mức thông tin thật sự hữu ích cho StudentHub.

Nâng cấp triển khai:

1. Hero dùng một knowledge monolith xuyên qua typography, với lõi năng lượng chuyển ember-orange sang mineral-mint.
2. Knowledge core dùng ba tấm kính đồng trục: Official / Expert / Student reality.
3. Trust pipeline dùng bốn cổng không gian tương tác; data stream thay đổi theo lớp người dùng hover, focus hoặc click.
4. Collective Intelligence có product window thực dụng và sáu công cụ học vụ quay theo quỹ đạo nhẹ trên nền warm ivory.
5. Closing dùng thông điệp ngắn “BỚT ĐOÁN. BẮT ĐẦU BIẾT.”, tránh CTA dài và mơ hồ.

Không sao chép logo, nội dung thương hiệu, mô hình 3D hay bố cục nguyên bản của nguồn tham chiếu.
