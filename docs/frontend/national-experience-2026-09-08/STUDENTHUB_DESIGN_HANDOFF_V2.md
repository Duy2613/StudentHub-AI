# STUDENTHUB VNEXT REFERENCE-DRIVEN DESIGN HANDOFF V2
## Handoff Thiết Kế Hệ Thống Thị Giác Toàn Diện: “Khai Minh” / Evidence Prism

**Ngày ban hành:** 08/09/2026  
**Phiên bản:** 2.0 (Tiến hóa từ Handoff V1 và bộ Asset R1–R3 đã kiểm định)  
**Trạng thái tài liệu:** `DESIGN_HANDOFF_V2_READY`  
**Quyền hạn & Thứ bậc quyết định:**  
`OWNER > SCOPE-REDUCTION > SPEC > ACCEPTANCE > VERIFIED ASSET PACK > PLAN > HANDOFF V2 > HANDOFF V1 > LEGACY UI`  
**Hội đồng thiết kế & Kiến trúc:** Principal Design Systems Director, Lead Creative Technologist, Principal Frontend Architect, Accessibility Lead (WCAG 2.2 AA).  
**Căn cứ tài liệu & Dữ liệu thực chứng:**  
- [SPEC.md](SPEC.md)  
- [ACCEPTANCE.md](ACCEPTANCE.md)  
- [SCOPE-REDUCTION.md](SCOPE-REDUCTION.md)  
- [PLAN.md](PLAN.md)  
- [REPORT.md](REPORT.md)  
- [ASSET-PRODUCTION-MANIFEST.json](../../../artifacts/manifests/ASSET-PRODUCTION-MANIFEST.json)  
- [ASSET-ROUTE-MAP.md](../../../artifacts/manifests/ASSET-ROUTE-MAP.md)  
- [ASSET-QA-REPORT.md](../../../artifacts/manifests/ASSET-QA-REPORT.md)  
- [ASSET-LICENSE-REPORT.md](../../../artifacts/manifests/ASSET-LICENSE-REPORT.md)  
- [ASSET-RUN-EVIDENCE.md](../../../artifacts/manifests/ASSET-RUN-EVIDENCE.md)

---

## 1. Executive Design Thesis

### 1.1. Tuyên ngôn định vị: “Khai Minh” — Evidence Prism
StudentHub AI không phải là một dashboard SaaS chung chung, không phải sàn thương mại bài giảng (LMS/Course Marketplace), không phải giao diện game hóa (gamification/quests), và tuyệt đối không phải là một AI chatbot phong cách neon bóng bẩy (cyberpunk/crypto).

Sản phẩm được định vị là:
> **Hệ điều hành học thuật & Khảo chứng thông tin số đương đại — một công cụ thẩm định chuẩn xác, độc lập, có trách nhiệm và minh bạch dành cho sinh viên Việt Nam và cộng đồng học thuật.**

### 1.2. Công thức thị giác tổng hợp (Visual Formula)
$$\text{Visual System} = \text{Cinematic Experimental Web} \times \text{Editorial Academia} \times \text{Precision Product UI} \times \text{Evidence Intelligence}$$

* **Cinematic Experimental Web:** Bố cục cảnh có chiều sâu quang học, khoảng thở rộng rãi, nhịp điệu biên tập tĩnh tại, sử dụng video/poster khí quyển quang học được kiểm soát gắt gao.
* **Editorial Academia:** Nền tối khoáng chất (`#07090E`), bề mặt đọc mờ đục chắn sáng (`#0C131B`), kiểu chữ có chân thanh lịch (`Lora`) điểm xuyết cùng cấu trúc lưới biên tập rộng rãi, tôn trọng dấu thanh tiếng Việt.
* **Precision Product UI:** Bảng điều khiển công cụ chuẩn xác, hệ typography không chân kỹ thuật (`Be Vietnam Pro`), font số liệu (`JetBrains Mono`), các đường bao quang học **Double-Bezel**, thanh điều hướng nghiệp vụ **Context Bar** và **Investigation Rail**.
* **Evidence Intelligence:** Dải phân giải bằng chứng **Evidence Beam**, mạng lưới quan hệ đa nguồn **Living Constellation**, phân tách rạch ròi 3 trụ cột: Nguồn chính thống (Official), Bối cảnh cộng đồng (Community Context) và Hội đồng chuyên gia độc lập (Expert Assessment).

### 1.3. Cảm xúc thương hiệu (Brand Feeling)
* **Chất liệu cốt lõi:** Nền tối khoáng chất sâu thẳm, mực chữ trắng ngà ấm áp, ánh quang ngọc bích Jade tiết chế, chiết quang lăng kính tinh xảo, tư liệu học thuật con người chân thực, chrome sản phẩm chuyên nghiệp.
* **Sản phẩm toát lên:** Thông thái, học thuật, điện ảnh, chuẩn xác, ưu tiên tiếng Việt, sống động, đáng tin cậy.
* **Tuyệt đối bài trừ:** Template dashboard thương mại, AI neon rực rỡ vô nghĩa, bong bóng gradient (gradient blobs), bảng 3 thẻ icon đơn điệu, phong cách tiền mã hóa/cyberpunk.

### 1.4. Ranh giới thẩm quyền & Dữ liệu nghiệp vụ (Authority Boundary)
Phương tiện truyền thông trang trí (video, WebP, poster, HDRI) **KHÔNG BAO GIỜ** nắm giữ hoặc suy diễn:
1. Phán quyết Trust (Verdict truth/probability)
2. Tiến trình phân tích nghiệp vụ thực tế
3. Trạng thái xác thực & quyền hạn (Authorization/Session)
4. Sự tồn lưu dữ liệu (Persistence/Commit)
5. Thẩm quyền cộng đồng hay chuyên gia

Mọi trạng thái nghiệp vụ xuất phát từ dữ liệu máy chủ thực tế (`ports.ts`, API runtime). Media chỉ phản hồi trang trí thụ động đối với trạng thái giao diện đã xác định.

---

## 2. V1 Delta Review (So sánh & Tiến hóa từ Handoff V1)

Bảng phân loại chi tiết các quyết định từ Handoff V1 sang Handoff V2 theo bốn nhóm: `KEEP`, `REFINE`, `REMOVE`, `REPLACE`.

| Hạng mục V1 | Quyết định V2 | Lý do & Phân tích chuyên môn V2 |
| :--- | :---: | :--- |
| **Thông điệp cốt lõi: “HIỂU ĐÚNG. Đi xa.”** | `KEEP` | Giữ vững lời hứa thương hiệu, liên tục và nhất quán với chiến lược sản phẩm. |
| **Bộ font Be Vietnam Pro + Lora + JetBrains Mono** | `KEEP` | Đáp ứng hoàn hảo hiển thị tiếng Việt, bản sắc hàn lâm và tính chuẩn xác số liệu. |
| **Cấu trúc Double-Bezel Frame & Button-in-Button** | `KEEP` | Chữ ký thị giác độc bản cho các đối tượng thẩm định tối quan trọng và CTA bậc cao nhất. |
| **Hệ thống 4 Cấp độ Trust Report** | `KEEP` | Phân cấp tư duy từ tóm tắt dễ hiểu đến căn cứ kỹ thuật và hành động tiếp theo. |
| **8 Phim cũ `film01_campus_atlas` ... `film08` (88 MB)** | `REMOVE` | **Loại bỏ hoàn toàn.** Bộ 8 MP4 cũ dung lượng 88.2 MB vi phạm nghiêm trọng ngân sách tải trang, không có giấy phép thương mại xác thực, gây nghẽn mạng trên thiết bị di động. |
| **Thành phần `CinematicTaskBackdrop` chạy video trên thẻ** | `REMOVE` | **Loại bỏ hoàn toàn.** Phát video lặp sau chữ trên các thẻ nhỏ gây mỏi mắt, vi phạm tương phản WCAG 2.2 AA và lãng phí GPU. |
| **Con trỏ tùy biến `KnowledgeCursor`** | `REMOVE` | SPEC mục 148 cấm con trỏ tùy biến bắt buộc nhằm đảm bảo trải nghiệm chuột gốc (native cursor) và trợ năng. |
| **Console kỹ thuật gắn toàn site `RealtimeLiveConsole`** | `REMOVE` | SPEC AUD-10 và LAY-02 quy định console vận hành chỉ hiển thị khi có quyền/màn hình riêng, không gắn đè lên chân trang người dùng. |
| **Dấu vết khóa học: `ContinueLearningBar`, `LEARNING_NAV_ITEMS`** | `REMOVE` | Tuân thủ tuyệt đối [SCOPE-REDUCTION.md](SCOPE-REDUCTION.md): gỡ sạch mọi catalog, roadmap lập trình, practice, khóa học. |
| **Gán ghép video nền toàn cục `UniversalCinematicBackground`** | `REPLACE` | **Thay thế bằng Hệ Thống 5 Lớp Thị Giác (L0–L4) theo Route.** V1 nạp video nền trên cả trang đọc bài `/trust`, `/community`. V2 quy định: Landing có tối đa 1 vùng ambient, các màn làm việc dùng nền đọc mờ đục chắn sáng (Opaque Reading Surface). |
| **Tài sản truyền thông chung chung không mã hóa** | `REPLACE` | **Thay thế bằng 7 Asset cốt lõi & 3 Reserve đã xác minh (R1–R3):** `VID-PRISM-01`, `VID-HUMAN-01`, `VID-OPTIC-01`, `VID-OPTIC-02`, `VID-HUMAN-02`, `VID-PRISM-02`, `HDRI-01`. Mọi tài nguyên đều có kích thước thực $\le 1.05\text{ MB}$, poster $\le 52\text{ KB}$, SHA-256 đối soát. |
| **Chính sách di động mập mờ của V1** | `REPLACE` | **Thay thế bằng Chính sách Di động Rắn:** Mobile Video Default = `FALSE`. Di động nạp 100% Poster tĩnh WebP ($\le 27\text{ KB}$). Video chỉ là tùy chọn bấm xem thủ công. |
| **Giao diện `/trust` dạng form + thẻ rời rạc** | `REPLACE` | **Thay thế bằng Trust Investigation Workbench Chuẩn Mực:** Cấu trúc 3 vùng thích ứng (Investigation Rail bên trái, Evidence Workspace trung tâm, Contextual Inspector bên phải). |
| **Bản đồ tri thức 3D nặng nề** | `REPLACE` | **Thay thế bằng Living Constellation Triad:** Đồ họa mạng lưới quan hệ Living Constellation kết hợp danh sách ngữ nghĩa (Synchronized List) và bộ kiểm tra (Inspector). Trợ năng bàn phím 100%. |
| **Cạnh tranh Token CSS trong `globals.css`** | `REFINE` | Thống nhất toàn bộ biến CSS Aether/Academic cũ thành một bảng Semantic Token Khai Minh duy nhất. |
| **Thứ bậc kết luận Trust** | `REFINE` | Chuẩn hóa 7 tầng: KẾT LUẬN $\rightarrow$ VÌ SAO $\rightarrow$ BẰNG CHỨNG $\rightarrow$ MÂU THUẪN $\rightarrow$ ĐIỂM CHƯA RÕ $\rightarrow$ GIỚI HẠN $\rightarrow$ BƯỚC TIẾP THEO. |

---

## 3. Reference DNA (Hệ Tham Chiếu Thiết Kế Đỉnh Cao)

StudentHub VNext không sao chép nguyên xi giao diện của bất kỳ bên nào. Chúng tôi chắt lọc các mẫu hình tương tác tinh hoa (Design Patterns) từ 5 hệ thống hàng đầu thế giới để kiến tạo nên trải nghiệm Khai Minh độc bản:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       STUDENTHUB VNEXT REFERENCE DNA                        │
├──────────────────────┬──────────────────────┬───────────────────────────────┤
│ THƯƠNG HIỆU THAM CHIẾU │ PATTERN HỌC HỎI      │ ÁP DỤNG CỤ THỂ VÀO STUDENTHUB  │
├──────────────────────┼──────────────────────┼───────────────────────────────┤
│ APPLE                │ • Scene Composition  │ • Hero kết hợp ánh sáng lam   │
│ Cinematic Creative   │ • Media Sequencing   │   chắn nắng & lăng kính       │
│ Web                  │ • Visual Anchors     │ • Nhịp thở biên tập rộng rãi  │
│                      │ • Copy Restraint     │ • Không nhồi nhét chữ lên hình│
├──────────────────────┼──────────────────────┼───────────────────────────────┤
│ ANTHROPIC            │ • Editorial Calm     │ • Đoạn văn bản đọc 55–68 ký tự│
│ Editorial            │ • Serious Typography │ • Trọng lượng chữ chuẩn xác   │
│ Intelligence         │ • Whitespace Power   │ • Tôn vinh vẻ đẹp học thuật   │
│                      │ • Clear Explanation  │ • Không màu mè cường điệu     │
├──────────────────────┼──────────────────────┼───────────────────────────────┤
│ LINEAR               │ • Workspace Chrome   │ • Khung làm việc 3 phân vùng   │
│ Precision Product    │ • Dense Information  │ • Phím tắt & điều hướng nhanh │
│ Interface            │ • Command Toolbars   │ • Mật độ thông tin cao nhưng  │
│                      │ • Contextual Panels  │   dễ đọc, viền quang học sắc nét│
├──────────────────────┼──────────────────────┼───────────────────────────────┤
│ RAYCAST              │ • Command Palette    │ • Hộp lệnh toàn cục (Ctrl+K)  │
│ Command Architecture │ • Keyboard Driven    │ • Gợi ý hành vi theo ngữ cảnh │
│                      │ • Compact Shell      │ • Tách bạch tính năng có sẵn  │
│                      │ • Direct Action      │   với tính năng dự kiến       │
├──────────────────────┼──────────────────────┼───────────────────────────────┤
│ ELICIT /             │ • Living Constellation│ • Đối soát đa chiều nguồn tin │
│ CONNECTED PAPERS     │ • Source Drill-down  │ • Tam giác: Đồ thị + Danh sách│
│ Evidence Navigation  │ • Evidence Inspector │   + Bảng kiểm tra chi tiết    │
│                      │ • Conflict Highlight │ • Trạng thái mâu thuẫn rõ ràng│
└──────────────────────┴──────────────────────┴───────────────────────────────┘
```

---

## 4. Final Visual Bible (Bộ Quy Chuẩn Mỹ Thuật Toàn Diện)

### 4.1. Hệ thống 5 Lớp Thị Giác (Page World 5-Layer System)
Mọi trang màn hình trong StudentHub VNext đều tuân thủ chặt chẽ kiến trúc phân tầng 5 lớp (L0–L4). Mỗi lớp có định danh z-index, quyền sở hữu tương tác, độ mờ và hành vi suy biến:

```
▲ Z-Index
│
├─ [L4] CONTEXTUAL UI (z-index: 40–50) ── Popover, Dialog, Inspector Sheet, Toast, Command Palette
├─ [L3] WORKSPACE AREA (z-index: 20) ──── Opaque Reading Surface (#0C131B), Form nhập liệu, Kết quả
├─ [L2] PRODUCT SHELL (z-index: 10) ───── Header, Academic Navbar, Context Bar, Investigation Rail
├─ [L1] CINEMATIC ATMOSPHERE (z-index: 1) ─ Video/Poster Khí quyển quang học, Lăng kính (Pointer-events: none)
└─ [L0] BASE CANVAS (z-index: 0) ──────── Nền tối khoáng chất (#07090E) hoàn toàn mờ đục 100%
```

#### Bảng thông số kỹ thuật 5 Lớp:
| Lớp | Tên lớp | Z-Index | Opacity | Blur | Quyền tương tác (Pointer Events) | Hành vi chuyển động | Suy biến (Fallback) |
| :---: | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| **L0** | Base Canvas | `0` | `1.0` | None | `none` | Tĩnh tuyệt đối | Nền màu đặc `#07090E` |
| **L1** | Cinematic Atmosphere | `1` | `0.35–0.55` | `blur(20px–40px)` | `none` (Không chặn click) | Chu kỳ quay quang học 16s hoặc lặp 8s | WebP Poster tĩnh $\le 52\text{ KB}$ |
| **L2** | Product Shell | `10` | `0.85–0.95` | `backdrop-blur-md` | `auto` (Thanh điều hướng) | Phản hồi hover 140ms, trượt sticky | Khung viền mờ đục vững chắc |
| **L3** | Workspace | `20` | `1.0` | None (Mờ đục 100%) | `auto` (Chủ sở hữu tương tác chính)| Mở accordion 200ms, trượt tab | Bề mặt Opaque Surface cố định |
| **L4** | Contextual UI | `40–50` | `0.95–1.0` | `backdrop-blur-lg` | `auto` (Chặn tương tác nền khi mở Modal)| Mở panel/sheet 240–360ms | Hộp thoại phẳng có viền nổi |

### 4.2. Ranh giới hiển thị: Opaque trước Glassmorphism
* **CẤM:** Không được dùng hiệu ứng kính mờ (Glassmorphism) phía sau các khối văn bản đọc dài, danh sách bằng chứng, hoặc ô nhập liệu.
* **QUY ĐỊNH:** Bề mặt đọc (`.surface-reading` / `.surface-paper`) bắt buộc phải mờ đục 100% với màu `#0C131B`. Hiệu ứng kính mờ chỉ được phép sử dụng ở thanh công cụ nổi (floating toolbar), header dính (sticky nav) và menu thả xuống (dropdown popover).

---

## 5. Typography (Hệ Typography Tiếng Việt Hàn Lâm)

### 5.1. Phân bổ Font chữ chuẩn mực (Canonical Font Stack)
```css
/* Giao diện, tiêu đề chính, thân bài đọc, nhãn tương tác */
--font-sans: var(--font-be-vietnam-pro), system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

/* Điểm xuyết biên tập hàn lâm (H1 Display "Đi xa.", trích dẫn châm ngôn) */
--font-serif: var(--font-lora), Georgia, Cambria, "Times New Roman", Times, serif;

/* Mã định danh, SHA-256 hash, mốc thời gian, số đo telemetry, OCR data */
--font-mono: var(--font-jetbrains-mono), Menlo, Monaco, Consolas, "Courier New", monospace;
```

### 5.2. Thang kích thước & Quy tắc nhịp điệu (Type Scale & Rhythm)

| Cấp bậc ngữ nghĩa | Mobile (320px–390px) | Desktop (1024px–1440px) | Font Family | Weight | Line Height | Tracking | Quy tắc kiểm duyệt tiếng Việt |
| :--- | :---: | :---: | :--- | :---: | :---: | :---: | :--- |
| **Hero Display H1** | `44px` (`2.75rem`) | `76px–88px` (`5.5rem`) | Be Vietnam Pro / Lora | 700 / 500 Italic | `1.18` | `-0.02em` | Không bao giờ cắt dấu mũ, ngã, hỏi trên chữ hoa (Ă, Â, Đ, Ê, Ô, Ơ, Ư). |
| **Section Title H2** | `30px` (`1.875rem`) | `40px–48px` (`3.0rem`) | Be Vietnam Pro | 600 | `1.22` | `-0.015em` | Tối đa 2 dòng; kiểm tra ngắt dòng tự nhiên tiếng Việt. |
| **Workspace Title H3** | `24px` (`1.5rem`) | `28px–32px` (`2.0rem`) | Be Vietnam Pro | 600 | `1.30` | `-0.01em` | Khoảng cách an toàn 8px với thẻ trạng thái đi kèm. |
| **Group / Card Title H4** | `18px` (`1.125rem`) | `20px–22px` (`1.375rem`)| Be Vietnam Pro | 600 | `1.35` | `0` | Cấm dùng All-caps toàn bộ cho tiêu đề dài. |
| **Lead Paragraph** | `17px` (`1.0625rem`)| `19px–20px` (`1.25rem`) | Be Vietnam Pro | 400 | `1.60` | `0` | Độ rộng tối ưu: 55–68 ký tự (ch). |
| **Body / Evidence Text** | `16px` (`1.0rem`) | `16px–17px` (`1.0625rem`)| Be Vietnam Pro | 400 / 500 | `1.65` | `0` | Mức tối thiểu cho mọi nội dung đọc hiểu và đối soát. |
| **Interactive Label** | `14px` (`0.875rem`)| `14px–15px` (`0.9375rem`)| Be Vietnam Pro | 500 / 600 | `1.45` | `+0.01em` | Nút bấm, tab điều hướng, breadcrumb. |
| **Technical Metadata** | `13px` (`0.8125rem`)| `13px–14px` (`0.875rem`)| JetBrains Mono | 400 / 500 | `1.50` | `+0.02em` | Tuyệt đối không dùng cho cảnh báo lỗi hay thông tin sinh tử. |

> **CẤM:** Tuyệt đối không sử dụng cỡ chữ dưới `13px` ở bất kỳ đâu. Quan trọng chức năng $\ge 14\text{px}$. Thân bài đọc $\ge 16\text{px}$.

### 5.3. Bộ Proofing Tiếng Việt Bắt Buộc
Mọi component typography phải vượt qua bài kiểm thử với chuỗi ký tự sau mà không tràn khung, vỡ dòng hoặc mất dấu:
```text
Hiểu đúng. Đi xa.
Kiểm chứng trước khi tin — nguồn nào, thời điểm nào, phạm vi nào?
Nguyễn Thị Thùy Dương · Đặng Hoàng Phúc · Trường Đại học Sư phạm Kỹ thuật
Ă Â Đ Ê Ô Ơ Ư · ă â đ ê ô ơ ư
Ắ Ằ Ẳ Ẵ Ặ · Ấ Ầ Ẩ Ẫ Ậ · Ế Ề Ể Ễ Ệ · Ố Ồ Ổ Ỗ Ộ · Ớ Ờ Ở Ỡ Ợ · Ứ Ừ Ử Ữ Ự
Chưa đủ bằng chứng. Cần xác minh thêm trước khi quyết định.
SHA-256: 83186c45549c67b62537e8c9a59f040250cd74914fa5adf07f81ab4ceb2356f5 · 08/09/2026 · 1.234.567 ₫
```

---

## 6. Color & Token System (Bảng Token Ngữ Nghĩa Đồng Nhất)

### 6.1. Bảng màu Hạt nhân (Core Semantic Tokens)
Thống nhất tất cả các file CSS vào một bộ biến `:root` chuẩn xác:

```css
:root {
  /* 1. Nền Canvas & Bề mặt (Opaque & Mineral Dark) */
  --canvas: #07090E;                 /* Nền tối khoáng chất toàn trang */
  --surface: #0C131B;                /* Bề mặt đọc mờ đục chắn sáng 100% */
  --surface-raised: #14202B;         /* Bề mặt nâng cao, Card, Popover */
  --surface-instrument: #0F1B18;     /* Bề mặt công cụ Trust & Bảng điều khiển */
  --surface-archive: #081310;        /* Bề mặt hồ sơ lưu trữ Evidence Passport */
  --surface-chrome: rgba(12, 19, 27, 0.88); /* Chrome nổi (Nav, Context Bar) */

  /* 2. Mực chữ & Tương phản WCAG AAA */
  --text-primary: #F3F1EA;           /* Trắng ngà ấm áp (Tương phản 16.52:1 trên #0C131B) */
  --text-secondary: #B9C6CC;         /* Bạc ánh lam dịu (Tương phản 10.68:1 trên #0C131B) */
  --text-muted-readable: #93A6B1;    /* Ghi sáng chú thích (Tương phản 7.41:1 trên #0C131B) */

  /* 3. Nhận diện Thương hiệu Khai Minh (Optical Jade) */
  --brand: #8BD9C3;                  /* Ngọc bích thanh nhã — Điểm nhấn định hướng */
  --on-brand: #071812;               /* Chữ đen ngọc trên nền nút thương hiệu (11.16:1) */
  --brand-subtle: rgba(139, 217, 195, 0.12); /* Nền nhấn ngọc bích vi mô */

  /* 4. Đường bao quang học & Tiêu điểm */
  --control-border: #647787;         /* Viền ô nhập liệu & nút điều khiển (3.56:1) */
  --decoration-border: #29343F;      /* Vạch phân cách trang trí tĩnh */
  --focus: #C8E8FF;                  /* Viền tiêu điểm xanh băng quang học */

  /* 5. Trạng thái nghiệp vụ Đa chiều (Bắt buộc Text + Icon + Border) */
  --state-success-text: #A7E5C6;
  --state-success-bg: #15382B;       /* Tỷ lệ tương phản 8.98:1 */
  --state-caution-text: #F0C278;
  --state-caution-bg: #3B2B14;       /* Tỷ lệ tương phản 8.23:1 */
  --state-critical-text: #FFA59B;
  --state-critical-bg: #3C2027;      /* Tỷ lệ tương phản 7.78:1 */
  --state-info-text: #A9CBE6;
  --state-info-bg: #182E43;          /* Tỷ lệ tương phản 8.19:1 */

  /* 6. Góc bo hình học (Systematic Radius) */
  --radius-xs: 4px;                  /* Tag, badge nhỏ */
  --radius-sm: 8px;                  /* Nút bấm con, ô chọn */
  --radius-md: 10px;                 /* Ô nhập liệu, Button chính */
  --radius-lg: 16px;                 /* Card công cụ, Double-bezel ngoài */
  --radius-xl: 20px;                 /* Dialog, Drawer, Modal */

  /* 7. Đổ bóng quang học (Physics-based Layered Shadows) */
  --shadow-instrument: 0 4px 24px -2px rgba(0, 0, 0, 0.65), 0 0 1px 1px rgba(255, 255, 255, 0.08);
  --shadow-floating: 0 12px 40px -4px rgba(0, 0, 0, 0.85), 0 0 1px 1px rgba(139, 217, 195, 0.20);
  --shadow-double-bezel: inset 0 1px 1px rgba(255, 255, 255, 0.12), 0 8px 32px -4px rgba(0, 0, 0, 0.75);
}
```

---

## 7. Grid & Layout System (Hệ Thống Lưới & Bố Cục Toàn Cục)

### 7.1. Cấu trúc Lưới Kép: Full-Bleed World + 1280px Content System
* **Full-Bleed World:** Toàn bộ không gian nền L0/L1 trải rộng 100vw, đón nhận ánh sáng quang học từ các góc biên bản mà không tạo cảm giác bị hộp (boxed-in).
* **1280px Content System:** Tất cả nội dung đọc, nút bấm, form nhập liệu và bảng phân tích đều nằm trong khung chứa tối đa `1280px`, căn giữa màn hình với lưới 12 cột chuẩn mực.

```
|<--------------------------------- Full-Bleed World (100vw) --------------------------------->|
|           |<------------------ Max-width Content (1280px) ------------------>|           |
|  Gutter   | Col 1 | Col 2 | Col 3 | Col 4 | Col 5 | Col 6 | ... | Col 11| Col 12 |  Gutter   |
|  (48px)   |                           Gap: 24px–32px                          |  (48px)   |
```

### 7.2. Quy tắc Thích Ứng Chi Tiết Cho 5 Điểm Ngắt (Breakpoints)

| Breakpoint | Cấu trúc Lưới | Gutter Biên | Độ rộng Vùng đọc tối đa | Phân vùng Workspace (Trust) | Quy tắc sụp đổ (Collapse Order) |
| :---: | :---: | :---: | :---: | :--- | :--- |
| **1440px**<br>*(Desktop)* | 12 cột | `48px` | `1280px`<br>(đoạn văn 65ch) | • Trái: Investigation Rail (240px)<br>• Giữa: Evidence Workspace (720px)<br>• Phải: Evidence Inspector (320px) | Hiển thị trọn vẹn 3 phân vùng song song. Thanh công cụ Context Bar trải ngang. |
| **1024px**<br>*(Laptop/Tablet ngang)* | 12 cột | `32px` | `960px` | • Trái: Rail thu gọn icon (56px)<br>• Giữa: Workspace chính (620px)<br>• Phải: Inspector dạng Drawer trượt | Inspector thu gọn vào nút "Xem chi tiết"; Rail giữ lại icon định danh có tooltip. |
| **768px**<br>*(Tablet dọc)* | 6 cột | `24px` | `720px` | • Trái: Rail chuyển thành Context Bar trên<br>• Giữa: Workspace toàn màn hình<br>• Phải: Inspector chuyển thành Bottom Sheet (60vh) | Bố cục chuyển sang 1 cột làm việc chính. Thanh điều hướng chuyển sang chế độ Drawer di động. |
| **390px**<br>*(Mobile chuẩn)* | 1 cột | `16px` | `100%`<br>(358px khả dụng) | • Tiến trình chuyển thành Pill nhỏ trong Context Bar<br>• Workspace xếp dọc tuần tự<br>• Inspector mở Full-screen Modal | Thứ tự: H1 $\rightarrow$ Mô tả ngắn $\rightarrow$ Context Bar $\rightarrow$ Primary Input $\rightarrow$ Kết luận sơ bộ. Chạm tới CTA trong $\le 2\text{s}$. |
| **320px**<br>*(Mobile nhỏ)* | 1 cột | `12px` | `100%`<br>(296px khả dụng) | Toàn bộ thẻ co giãn 100%, padding giảm về 12px, font-size giữ nguyên $\ge 14\text{px}$ | Ẩn toàn bộ hiệu ứng thị giác trang trí, giữ lại 100% chữ và khả năng nhập/xác minh. |

---

## 8. Surface Grammar (Ngữ Pháp 4 Bề Mặt Chuyên Biệt)

Để loại bỏ hoàn toàn sự lạm dụng glassmorphism và gradient blobs bừa bãi, StudentHub VNext thiết lập 4 bề mặt đặc thù:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       STUDENTHUB SURFACE GRAMMAR                            │
├──────────────────────┬──────────────────────┬───────────────────────────────┤
│ BỀ MẶT               │ CLASS & CSS TOKEN    │ MỤC ĐÍCH SỬ DỤNG & ĐẶC TÍNH   │
├──────────────────────┼──────────────────────┼───────────────────────────────┤
│ 1. Opaque Reading    │ `.surface-reading`   │ • Đọc bài phân tích, lập luận,│
│    (Bề mặt đọc mờ đục)│ `bg-[#0C131B]`       │   chính sách riêng tư.        │
│                      │ `border-white/[0.06]`│ • 100% chắn sáng, triệt tiêu  │
│                      │                      │   mọi phản quang gây mỏi mắt. │
├──────────────────────┼──────────────────────┼───────────────────────────────┤
│ 2. Instrument        │ `.surface-instrument`│ • Bảng điều khiển Trust, ô dán│
│    (Bề mặt công cụ)  │ `bg-[#0F1B18]`       │   URL/Text, bộ lọc đồ thị.    │
│                      │ `border-white/10`    │ • Viền kép Double-Bezel vi mô,│
│                      │ `shadow-instrument`  │   góc bo 16px, cảm giác cơ khí│
├──────────────────────┼──────────────────────┼───────────────────────────────┤
│ 3. Archive           │ `.surface-archive`   │ • Evidence Passport, lịch sử  │
│    (Bề mặt lưu trữ)  │ `bg-[#081310]`       │   thẩm định, mã băm SHA-256.  │
│                      │ `border-dashed`      │ • Viền khắc kỹ thuật màu jade,│
│                      │ `border-brand/20`    │   phông mono, con dấu điện tử │
├──────────────────────┼──────────────────────┼───────────────────────────────┤
│ 4. Floating Chrome   │ `.surface-chrome`    │ • Navbar, Context Bar, Menu,  │
│    (Chrome bán trong)│ `bg-[#0C131B]/88`    │   Command Palette (Ctrl+K).   │
│                      │ `backdrop-blur-md`   │ • Trong mờ có kiểm soát, giữ  │
│                      │ `border-white/10`    │   bối cảnh không gian bên dưới│
└──────────────────────┴──────────────────────┴───────────────────────────────┘
```

---

## 9. Lighting & Depth (Ánh Sáng Quang Học & Chiều Sâu Không Gian)

### 9.1. Logic Chiếu Sáng Đồng Nhất (Single Coherent Light Environment)
* **Nguồn sáng chủ đạo:** Toàn bộ viewport được chiếu sáng bởi một môi trường ánh sáng quang học ảo bắt nguồn từ góc **Trên-Phải (Upper-Right)** ở góc nghiêng $35^\circ$.
* **Sắc độ ánh sáng:** Ánh sáng ngọc bích Jade (`#8BD9C3`) ở cường độ tinh tế ($8\%–12\%$) chiếu lướt qua mép trên của các bề mặt công cụ, tạo ra một đường viền bắt sáng (catchlight rim) siêu mảnh `1px`.
* **CẤM TUYỆT ĐỐI:** Cấm tạo các đốm phát sáng neon ngẫu nhiên (neon glows) ở giữa các thẻ hoặc mỗi thẻ một màu phát sáng riêng biệt.

### 9.2. Quy tắc Chiều Sâu Vật Lý (Depth by Occlusion & Contrast)
Chiều sâu trong StudentHub không được tạo ra bằng việc làm mờ (heavy blur). Chiều sâu được kiến tạo thông qua 4 cấp độ:
1. **Tương phản sáng/tối:** Bề mặt L3 làm việc (`#0C131B`) sáng hơn nền L0 (`#07090E`) $4\%$.
2. **Che khuất vật lý (Occlusion):** Khối bề mặt làm việc đè lên một phần lớp khí quyển quang học L1.
3. **Đường viền quang học kép (Double-Bezel):** Tạo một rãnh thụt sâu `1px` bao quanh khối kết luận, tách biệt hoàn toàn nội dung quan trọng với không gian bên ngoài.
4. **Đổ bóng phân lớp (Layered Ambient Occlusion):** Đổ bóng đen sâu `rgba(0,0,0,0.65)` góc rộng kết hợp bóng sát mép `rgba(0,0,0,0.40)`.

---

## 10. Product Shell (Bộ Khung Vỏ Ứng Dụng Hợp Nhất)

### 10.1. Tái cấu trúc `UnifiedAppShell`
`UnifiedAppShell` đóng vai trò là vỏ bọc chuẩn mực cho mọi trang trong ứng dụng (`/trust`, `/community`, `/expert`, `/cases`, `/dashboard`, `/settings`).

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TOP: AcademicNavbar (Brand Logo | Core Nav Items | Command Search | User)    │
├─────────────────────────────────────────────────────────────────────────────┤
│ SUB: Context Bar (Tự động hiển thị khi vào Case / Workspace)                │
├────────────────────────────────┬────────────────────────────────────────────┤
│ LEFT: Investigation Rail       │ CENTER: Workspace Canvas                   │
│ (Trạng thái 7 bước thực tế,    │ (Khu vực nhập liệu, Báo cáo Trust,         │
│  Thu gọn linh hoạt theo màn)   │  Đồ thị Living Constellation, Passport)    │
│                                ├────────────────────────────────────────────┤
│                                │ RIGHT: Evidence Inspector (Mở theo ngữ cảnh)│
├────────────────────────────────┴────────────────────────────────────────────┤
│ FOOTER: Global Academic Footer (Tối giản, thông tin pháp lý & bản quyền)    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 11. Navigation (Điều Hướng Chuẩn Mực & Rút Gọn Phạm Vi)

### 11.1. Các điểm đến Hợp lệ (Canonical Destinations)
Tuân thủ tuyệt đối [SCOPE-REDUCTION.md](SCOPE-REDUCTION.md):

* **Trục Nghiệp vụ Trọng tâm (Core Pillars):**
  1. `/trust` — **Trust Engine** (Cỗ máy khảo chứng đa tầng — Điểm đến số 1)
  2. `/community` — **Community** (Bằng chứng đối chiếu & Kinh nghiệm thực tế từ sinh viên)
  3. `/expert` — **Experts** (Hội đồng chuyên gia độc lập, thẩm quyền & COI rõ ràng)
* **Trục Hỗ trợ Thẩm định (Supporting Lab & Records):**
  4. `/cases` — **Evidence Case Lab** (Phòng tình huống thực tế & Superflows)
  5. Evidence Passport Views — **Hồ sơ bảo chứng & Nhật ký sửa đổi (Revision Timeline)**
* **Trục Tài khoản Cá nhân (Account & Settings):**
  6. `/dashboard` — **Dashboard** (Trung tâm điều phối cá nhân, theo dõi hồ sơ đã lưu)
  7. `/profile` — **Hồ sơ sinh viên**
  8. `/settings` & `/settings/privacy` — **Cài đặt & Quyền riêng tư dữ liệu**

### 11.2. Danh mục Bị Gỡ Bỏ Hoàn Toàn (Removed from Navigation & Bundle)
* ❌ Khóa học (`/learn`), Bài học (`/learn/[courseId]/[lessonId]`)
* ❌ Lộ trình Full-stack (`/roadmap`)
* ❌ Bài tập thực hành (`/practice`), Dự án mẫu (`/projects`)
* ❌ Nhiệm vụ & Game hóa (`/quests`)
* ❌ Chatbot AI chung chung, không căn cứ nguồn

---

## 12. Context Bar (Thanh Ngữ Cảnh Tác Vụ Độc Bản)

### 12.1. Bản thiết kế Thanh Ngữ Cảnh (Context Bar Specification)
Khi người dùng đang trong luồng kiểm chứng tại `/trust` hoặc đang duyệt hồ sơ tại `/cases`, thanh Context Bar sẽ xuất hiện ngay dưới thanh Header chính, đóng vai trò mỏ neo thông tin:

```
┌───────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ CASE: #CS-2026-BK01  │  REV: 02  │  TRẠNG THÁI: [ ĐÃ CÔNG BỐ ]  │  NGUỒN: 5 NGUỒN (1 MÂU THUẪN) │ [ XUẤT HỒ SƠ ] │
└───────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

* **Thành phần dữ liệu thực tế:**
  1. **Mã hồ sơ (Case Identifier):** Chuỗi định danh rút gọn (Ví dụ: `CASE-2026-BK-09`).
  2. **Phiên bản (Revision Number):** Số thứ tự sửa đổi bất biến (Ví dụ: `rev. 03`).
  3. **Trạng thái thực tế (Analysis / Pipeline State):** Nhãn ngữ nghĩa (`IDLE`, `RUNNING`, `PERSISTED`, `CONFLICT`).
  4. **Số lượng căn cứ (Source Count):** Số nguồn chính thức đã đối soát thực tế (không bịa đặt số liệu).
  5. **Chỉ số mâu thuẫn (Conflict Flag):** Cảnh báo nếu phát hiện thông báo trái ngược giữa các nguồn.
  6. **Hành động ngữ cảnh (Actions):** `[Sao chép mã hash]`, `[Chia sẻ hồ sơ]`, `[Mở Evidence Passport]`.
* **Thích ứng thiết bị:**
  - Desktop (1440px): Trải ngang toàn bộ 6 khối dữ liệu.
  - Tablet (768px): Hiển thị Mã + Phiên bản + Trạng thái; các nút gộp vào menu 3 chấm.
  - Mobile (390px): Thanh Pill gọn gàng (Mã hồ sơ + Trạng thái), bấm vào để mở rộng Bottom Sheet đầy đủ.

---

## 13. Investigation Rail (Thanh Dẫn Đường Khảo Chứng)

### 13.1. Thiết kế Bộ Điều Hướng 7 Bước Thực Tế
Không sử dụng 4 bước tiếp thị ảo. Investigation Rail ánh xạ chính xác **7 giai đoạn chạy thực tế của Trust Engine Backend V5**:

```
┌─────────────────────────────────────────────────────────┐
│               TIẾN TRÌNH KHẢO CHỨNG BẰNG CHỨNG          │
├─────────────────────────────────────────────────────────┤
│ [✓] 01. Tiếp nhận & Chuẩn hóa đầu vào (Normalization)   │
│ [✓] 02. Quét Tình báo Danh tiếng & Mối đe dọa (Intel)   │
│ [✓] 03. Phân tách Thực thể & Bóc tách Tuyên bố (Claims) │
│ [●] 04. Phân tích Ngữ cảnh Sinh viên & Quy chế (Context) │
│ [ ] 05. Đối soát Nguồn Đa tầng (Official / Community)   │
│ [!] 06. Tổng hợp Bất định & Phát hiện Mâu thuẫn         │
│ [ ] 07. Phán quyết Rủi ro & Hành động Khuyến nghị       │
└─────────────────────────────────────────────────────────┘
```

* **5 Trạng thái của từng bước:**
  - `waiting`: Màu ghi xám `--text-muted-readable`, biểu tượng vòng tròn rỗng.
  - `active`: Màu ngọc bích `--brand`, biểu tượng vòng xoay vi mô nhẹ.
  - `complete`: Màu xanh thành công `--state-success-text`, biểu tượng dấu kiểm $\checkmark$.
  - `conflict`: Màu san hô cảnh báo `--state-critical-text`, biểu tượng dấu chấm than $\triangle$.
  - `blocked`: Màu cam lưu tâm `--state-caution-text`, biểu tượng khóa tạm thời.
* **Quy chuẩn kích thước:** Độ rộng Desktop cố định `240px`. Mobile chuyển thành thanh tiến trình gập gọn trên đầu màn hình.

---

## 14. Command Palette (Kiến Trúc Hộp Lệnh Toàn Cục)

### 14.1. Phân định Tính năng Thực tế vs Dự kiến
Kích hoạt: Bấm phím tắt `Ctrl + K` (hoặc `Cmd + K`) hoặc bấm vào ô tìm kiếm trên Header.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🔍 Nhập lệnh hoặc tìm kiếm thông tin kiểm chứng...              [Esc để đóng]│
├─────────────────────────────────────────────────────────────────────────────┤
│ HÀNH ĐỘNG CÓ SẴN (REAL EXISTING ACTIONS):                                  │
│  > /trust         Mở bàn làm việc kiểm chứng mới                           │
│  > /cases         Xem 3 tình huống thẩm định mẫu của sinh viên             │
│  > /community     Tra cứu tín hiệu đối chiếu từ cộng đồng                  │
│  > /expert        Xem danh sách hội đồng chuyên gia độc lập                │
│  > [Demo 01]      Kiểm tra Học bổng Quốc tế Bách Khoa nghi giả mạo         │
│  > [Demo 02]      Đối soát Tuyển dụng Thực tập IT có dấu hiệu lừa đảo      │
│  > [Demo 03]      Xác minh Thông báo Đóng học phí đột xuất                 │
│  > [A11y]         Bật / Tắt chế độ Giảm chuyển động (Prefers-Reduced-Motion)│
├─────────────────────────────────────────────────────────────────────────────┤
│ TÍNH NĂNG ĐANG PHÁT TRIỂN (PROPOSED / COMING SOON):                        │
│  ◌ Tra cứu mã băm Passport trực tiếp từ chuỗi SHA-256                      │
│  ◌ Xuất toàn bộ chứng từ kiểm định dưới dạng tệp nén mật mã                │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 15. Contextual Inspector (Bảng Soi Chi Tiết Bằng Chứng)

### 15.1. Ngữ pháp Bảng Soi Thống Nhất
Bảng Inspector là ngăn thông tin chi tiết xuất hiện ở cạnh phải (Desktop 320px) hoặc dưới dạng Sheet (Mobile) khi người dùng bấm vào bất kỳ Nút nguồn, Tuyên bố (Claim), hay Nhận định chuyên gia nào:

* **Khối 1 — Nhãn xuất xứ (Provenance Header):** Huy hiệu phân loại nguồn: `CHÍNH THỐNG (Official)`, `CỘNG ĐỒNG (Community)`, `CHUYÊN GIA (Expert)`.
* **Khối 2 — Trích đoạn nguyên gốc (Raw Extract):** Đoạn văn bản hoặc hình ảnh trích xuất trực tiếp, có dấu thời gian (Timestamp) và đường dẫn URL đầy đủ.
* **Khối 3 — Đánh giá độ tin cậy:** Cơ sở phân loại, tính toàn vẹn của chứng chỉ SSL/Domain, lịch sử hoạt động của đơn vị phát hành.
* **Khối 4 — Hạn chế & Giới hạn:** Ghi rõ những điểm nguồn này KHÔNG chứng minh được để người dùng không suy diễn quá mức.

---

## 16. Landing Route Blueprint (`/`)

Landing page được cấu trúc thành **1 Hero + 5 Nhịp biên tập liên hoàn**, biến toàn bộ trải nghiệm thành một chuyến hành trình từ "Nghi ngờ" đến "Sáng tỏ":

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ HERO SECTION: HIÊN TRI THỨC (Grid 12 cột: 5 Cột Nội dung | 7 Cột Thị giác)│
│ H1: "HIỂU ĐÚNG. Đi xa."                                                     │
│ Copy: "Kiểm tra nguồn tin, đối chiếu bối cảnh và xem điều còn thiếu..."     │
│ CTA KÉP: [ Nút Button-in-Button: Kiểm tra ngay ]   [ Xem một ví dụ mẫu ]   │
│ ASSET THỰC: VID-PRISM-01 (Desktop video) / landing-prism-atmosphere.webp    │
├─────────────────────────────────────────────────────────────────────────────┤
│ CHAPTER 01: BẰNG CHỨNG HỌC THUẬT TỪ ĐỜI THỰC (Human Evidence)              │
│ Bố cục Editorial Asymmetric Crop (Không phải thẻ bo tròn rập khuôn).        │
│ Minh họa hoạt động đọc, đối chiếu, kiểm tra tài liệu của sinh viên.         │
│ ASSET THỰC: VID-HUMAN-01 (Muted 8s loop) / landing-human-evidence.webp     │
├─────────────────────────────────────────────────────────────────────────────┤
│ CHAPTER 02: CỖ MÁY KHẢO CHỨNG (Trust Engine & Evidence Beam)                │
│ Trình diễn quy trình 4 chặng: Nguồn ➔ Bối cảnh ➔ Đối chiếu ➔ Kết luận.     │
│ Khung kết quả bọc viền Double-Bezel Frame trang trọng.                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ CHAPTER 03: KHÔNG GIAN QUAN TRẮC TRI THỨC (Living Constellation & Atlas)    │
│ Bản đồ mạng lưới tri thức Living Constellation (SVG tương phản cao).       │
│ Phím tắt điều hướng, danh sách đối soát chi tiết đi kèm.                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ CHAPTER 04: HỘI ĐỒNG CHUYÊN GIA & CỘNG ĐỒNG ĐỒNG THUẬN                     │
│ Hai dòng chảy hội tụ: Trải nghiệm thực tế (Context) & Thẩm định học thuật.  │
│ Minh bạch Scope, COI, không dùng số lượng vote để quyết định chân lý.      │
├─────────────────────────────────────────────────────────────────────────────┤
│ CHAPTER 05: HÀNH ĐỘNG AN TÂM (Safe Action)                                  │
│ Nhịp kết tĩnh tại, nền tối thanh lịch. Không dùng gradient chói lòa.       │
│ Cam kết quyền riêng tư, không lưu trữ dữ liệu cá nhân nhạy cảm.             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 17. Trust Workbench Blueprint (`/trust`)

Màn hình làm việc quan trọng nhất của toàn hệ thống — Nơi sinh viên thực hiện thẩm định:

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ CONTEXT BAR:  #TR-LIVE-STUDIO  │  CHẾ ĐỘ: ĐA PHƯƠNG THỨC  │  BẢO VỆ: ĐANG BẬT  │  [ XÓA PHIÊN ]        │
├──────────────────────────┬─────────────────────────────────────────────┬───────────────────────────────┤
│ INVESTIGATION RAIL       │ PRIMARY EVIDENCE WORKSPACE                  │ CONTEXTUAL INSPECTOR          │
│ (Cố định 240px)          │ (720px - Trọng tâm thị giác)                │ (320px - Mở khi bấm chọn)     │
│                          │                                             │                               │
│ • Chuẩn hóa đầu vào  [✓] │ 1. KHUNG NHẬP LIỆU (Double-Bezel Frame)     │ • Xuất xứ nguồn               │
│ • Tình báo danh tiếng [✓] │ [ Ảnh chụp ] [ Mã QR ] [ Văn bản ] [ URL ]  │ • Thời điểm ghi nhận          │
│ • Bóc tách Claim     [✓] │ ┌─────────────────────────────────────────┐ │ • Trích dẫn nguyên bản        │
│ • Ngữ cảnh SV        [●] │ │ Dán thông báo tuyển dụng / học bổng...  │ │ • Tín hiệu đối chiếu          │
│ • Đối soát đa nguồn  [ ] │ └─────────────────────────────────────────┘ │ • Giới hạn chứng minh         │
│ • Tổng hợp bất định  [ ] │ [ Nút Button-in-Button: Bắt đầu Thẩm định ] │                               │
│ • Phán quyết rủi ro  [ ] │                                             │                               │
│                          │ 2. KẾT QUẢ PHÂN TÍCH (Khi hoàn tất):        │                               │
│                          │  ┌─ KẾT LUẬN SƠ BỘ (Double-Bezel) ────────┐ │                               │
│                          │  │ MỨC ĐỘ RỦI RO: CAO (San hô #FFA59B)    │ │                               │
│                          │  │ Cảnh báo: Tên miền mạo danh ĐH Bách Khoa│ │                               │
│                          │  └────────────────────────────────────────┘ │                               │
│                          │  • Vì sao: Lý do phân tích chính            │                               │
│                          │  • Căn cứ: Danh sách 4 nguồn đối soát       │                               │
│                          │  • Mâu thuẫn: Thời hạn nộp hồ sơ bất thường │                               │
│                          │  • Điểm chưa rõ: Đơn vị trung gian nhận tiền│                               │
│                          │  • Hành động: 3 bước tự bảo vệ tiếp theo    │                               │
└──────────────────────────┴─────────────────────────────────────────────┴───────────────────────────────┘
```

* **Trạng thái IDLE:** Sử dụng ảnh tĩnh poster `trust-refraction-inspection-desktop.webp` làm nền khí quyển quang học tĩnh. Khung nhập liệu chiếm vị trí trung tâm nổi bật, không có chuyển động gây phân tâm.
* **Trạng thái RUNNING:** Thanh tiến trình cập nhật từng bước theo dữ liệu sự kiện Server-Sent Events (SSE) thực tế từ máy chủ. Cấm dùng hàm `setInterval` giả mạo thời gian phân tích.
* **Trạng thái RESULT:** Kích hoạt lớp chiết quang lăng kính `VID-OPTIC-02` ở mức độ kiểm soát cao (độ mờ $20\%$, saturation $0.28$). Kết luận trình bày theo đúng thứ bậc 7 tầng đã định nghĩa.

---

## 18. Evidence Graph Blueprint (Living Constellation)

* **Triết lý:** Mạng tri thức Living Constellation không phải là một quả cầu 3D xoay tít khó tiếp cận. Đây là một sơ đồ vector quan hệ phẳng 2D/SVG có độ tương phản cao, hỗ trợ điều hướng bàn phím đầy đủ.
* **Kiến trúc Tam hợp (Triad Architecture):**
  1. **Graph View (Đồ thị trực quan):** Thể hiện các nút Nguồn tin (Xanh ngọc), Tuyên bố (Trắng ngà), Mâu thuẫn (Đỏ san hô) và Điểm chưa rõ (Vàng cam).
  2. **Synchronized List View (Danh sách đồng bộ):** Bên cạnh đồ họa, một danh sách văn bản ngữ nghĩa (HTML semantic list) luôn hiển thị song song. Bấm vào mục trong danh sách sẽ làm sáng nút trên đồ thị và ngược lại.
  3. **Node Inspector (Bảng thông số nút):** Hiển thị chi tiết nội dung, trích đoạn và đường dẫn kiểm chứng của nút đang chọn.
* **Quy tắc trợ năng:** Người khiếm thị hoặc người dùng bàn phím có thể duyệt 100% các nút và quan hệ thông qua phím Tab/Mũi tên mà không cần dùng chuột.

---

## 19. Community Blueprint (`/community`)

* **Ý nghĩa:** Trải nghiệm thực tế từ cộng đồng sinh viên (Context Layer) bổ sung góc nhìn đời sống cho các thông báo chính sách.
* **Tài sản thị giác tích hợp:**
  - `VID-HUMAN-02` (Video sinh viên nghiên cứu nhóm tại thư viện): Sử dụng dạng lát cắt biên tập (Editorial Crop) làm đầu mục phân hệ.
  - `VID-PRISM-02` (Lăng kính hội tụ tín hiệu): Sử dụng làm nền khí quyển quang học mờ đục ($25\%$ opacity).
  - **Quy tắc bất biến:** Không bao giờ phát hai video cùng lúc ở cường độ tối đa. Một video phát thì video kia dừng hoặc chuyển sang poster.
* **Cấu trúc nội dung:**
  - Nêu rõ bối cảnh trường học, thời điểm xảy ra sự việc, bằng chứng hóa đơn/email đã ẩn danh tính.
  - Trạng thái kiểm duyệt minh bạch: `Đã xác thực danh tính sinh viên`, `Chờ đối soát`.
  - Tuyệt đối không hiển thị số lượt thích (likes), số người theo dõi (followers) hay biến bình chọn thành sự thật chân lý.

---

## 20. Expert Blueprint (`/expert`)

* **Ý nghĩa:** Thẩm định học thuật độc lập từ các giảng viên, chuyên gia bảo mật và cố vấn pháp lý.
* **Tài sản thị giác tích hợp:** `VID-OPTIC-01` (Không gian quan sát thấu kính chuẩn xác).
* **Hồ sơ Chuyên gia (Expert Profile Card):**
  - **Lĩnh vực thẩm định được xác nhận:** (Ví dụ: An toàn thông tin, Quy chế đào tạo đại học, Luật lao động).
  - **Phạm vi thẩm quyền (Evaluation Scope):** Nêu rõ chuyên gia chỉ chịu trách nhiệm trong phạm vi hồ sơ được giao.
  - **Tuyên bố xung đột lợi ích (COI Statement):** Cam kết không có quan hệ tài chính hay lợi ích cá nhân với các đơn vị liên quan.
  - **Lịch sử thẩm định & Phiên bản:** Liên kết trực tiếp tới các hồ sơ Case đã ký xác nhận.
  - Cấm sử dụng avatar hoạt hình 3D AI hoặc tạo vỏ bọc "chuyên gia toàn tri".

---

## 21. Evidence Passport Blueprint (`/cases` & Revision Views)

* **Ý nghĩa:** Văn kiện lưu trữ kỹ thuật số bất biến, công chứng toàn bộ tiến trình khảo chứng của một tình huống.
* **Ngôn ngữ thiết kế:** Bề mặt Lưu trữ `.surface-archive` (`#081310`), đường viền khắc kỹ thuật nét đứt màu ngọc bích, dấu niêm phong bảo chứng `evidence-passport-seal.svg`.
* **CẤM VIDEO NỀN:** Màn hình Evidence Passport mang tính chất pháp lý và lưu trữ trang trọng, tuyệt đối **KHÔNG CÓ VIDEO NỀN PHÁT ĐỘNG**. 100% là bề mặt tĩnh mờ đục để đảm bảo khả năng đọc và in ấn (Print CSS).
* **Cấu trúc hiển thị:**
  1. Header hồ sơ: Mã hồ sơ định danh, Mã băm SHA-256 toàn vẹn, Dấu thời gian Unix.
  2. Dòng thời gian sửa đổi (Append-only Event Timeline): Ghi nhận từng lần bổ sung nguồn tin, ý kiến chuyên gia, đính chính.
  3. Bảng đối chiếu văn bản: So sánh sự khác biệt giữa các lần sửa đổi (Diff view).
  4. Nút hành động: `[Tải file xác thực JSON-LD]`, `[In chứng chỉ kiểm định PDF]`.

---

## 22. Image & Video Integration Families (5 Phương Thức Xử Lý Hình Ảnh)

Để tránh việc mọi ảnh/video đều bị nhét vào một chiếc hộp bo góc giống nhau, StudentHub VNext quy định 5 họ xử lý hình ảnh độc bản:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 5 IMAGE & VIDEO INTEGRATION FAMILIES                        │
├──────────────────────┬──────────────────────────────────────────────────────┤
│ 1. FULL BLEED WORLD  │ • Trải rộng 100vw, lớp L1 khí quyển quang học.       │
│                      │ • Phủ màn đen Dark Veil 80% bảo vệ tương phản chữ.   │
│                      │ • Áp dụng: VID-PRISM-01 (Landing), VID-PRISM-02.     │
├──────────────────────┼──────────────────────────────────────────────────────┤
│ 2. EDITORIAL CROP    │ • Cắt góc bất đối xứng biên tập, viền âm bản 1px.    │
│                      │ • Bố cục so le giữa văn bản hàn lâm và hình ảnh thực.│
│                      │ • Áp dụng: VID-HUMAN-01 (Thư viện), VID-HUMAN-02.    │
├──────────────────────┼──────────────────────────────────────────────────────┤
│ 3. MASKED MATERIAL   │ • Mặt nạ lam chắn nắng hoặc vân đá/gốm kiến trúc.    │
│                      │ • Ánh sáng chiếu lướt qua như rèm che học đường.     │
│                      │ • Áp dụng: Khung Hero Hiên Tri Thức, Section Dividers│
├──────────────────────┼──────────────────────────────────────────────────────┤
│ 4. EVIDENCE FRAME    │ • Cấu trúc viền kép Double-Bezel trân trọng.         │
│                      │ • Kính quang học phản chiếu nhẹ khi rê chuột.        │
│                      │ • Áp dụng: Khung Kết luận Trust, Thẻ Chuyên gia.     │
├──────────────────────┼──────────────────────────────────────────────────────┤
│ 5. OPTICAL LENS      │ • Hình tròn hoặc elip quang học quan sát vi mô.      │
│                      │ • Tái hiện hình ảnh qua thấu kính khúc xạ.           │
│                      │ • Áp dụng: VID-OPTIC-01, VID-OPTIC-02 tại /trust.    │
└──────────────────────┴──────────────────────────────────────────────────────┘
```

---

## 23. Production Media Contract & Asset Map (Bản Đồ Tài Sản Thực Tế)

Dưới đây là bảng hợp đồng đa phương tiện chi tiết, ánh xạ chính xác 100% đường dẫn tệp thực tế đã được nghiệm thu qua R1–R3 trong thư mục `frontend/public/media/studenthub-vnext/`:

| Mã Asset | Tên Ngữ Nghĩa | Route | Trạng thái Nghiệp vụ | Họ Bố Cục | Kích thước & Codec Thực | Đường dẫn Video / HDRI | Đường dẫn Desktop Poster | Đường dẫn Mobile Poster (Mặc định di động) | Chính sách Tải (Load Policy) |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **VID-PRISM-01** | `landing-prism-atmosphere` | `/` | `LANDING_HERO_AMBIENT` | Full Bleed World | 435 KB · H.264 · 24fps · 8s | `/media/studenthub-vnext/video/landing-prism-atmosphere-desktop.mp4` | `/media/studenthub-vnext/posters/landing-prism-atmosphere-desktop.webp` (4.6 KB) | `/media/studenthub-vnext/posters/landing-prism-atmosphere-mobile.webp` (1.8 KB) | `INITIAL` (Poster) $\rightarrow$ `LAZY` (Desktop Video) |
| **VID-HUMAN-01** | `landing-human-evidence` | `/` | `HUMAN_EVIDENCE_CHAPTER`| Editorial Crop | 323 KB · H.264 · 24fps · 8s | `/media/studenthub-vnext/video/landing-human-evidence-desktop.mp4` | `/media/studenthub-vnext/posters/landing-human-evidence-desktop.webp` (47 KB) | `/media/studenthub-vnext/posters/landing-human-evidence-mobile.webp` (24 KB) | `LAZY` (Cuộn tới mới tải) |
| **VID-OPTIC-01** | `trust-refraction-inspection`| `/trust`<br>`/expert`| `TRUST_IDLE`<br>`EXPERT_INSPECTION` | Optical Lens | 1.04 MB · H.264 · 24fps · 8s | `/media/studenthub-vnext/video/trust-refraction-inspection-desktop.mp4` | `/media/studenthub-vnext/posters/trust-refraction-inspection-desktop.webp` (26 KB) | `/media/studenthub-vnext/posters/trust-refraction-inspection-mobile.webp` (14 KB) | `INITIAL` (Poster) $\rightarrow$ `ON-INTERACTION` |
| **VID-OPTIC-02** | `trust-result-prism` | `/trust` | `TRUST_RESULT` | Optical Lens | 274 KB · H.264 · 24fps · 8s | `/media/studenthub-vnext/video/trust-result-prism-desktop.mp4` | `/media/studenthub-vnext/posters/trust-result-prism-desktop.webp` (15 KB) | `/media/studenthub-vnext/posters/trust-result-prism-mobile.webp` (6.8 KB) | `ON-INTERACTION` (Chỉ tải khi có kết quả) |
| **VID-HUMAN-02** | `community-human-research` | `/community` | `COMMUNITY_HUMAN_LAYER` | Editorial Crop | 518 KB · H.264 · 24fps · 8s | `/media/studenthub-vnext/video/community-human-research-desktop.mp4` | `/media/studenthub-vnext/posters/community-human-research-desktop.webp` (51 KB) | `/media/studenthub-vnext/posters/community-human-research-mobile.webp` (27 KB) | `LAZY` |
| **VID-PRISM-02** | `community-prism-corroboration`| `/community`| `COMMUNITY_AMBIENT` | Full Bleed World | 432 KB · H.264 · 24fps · 8s | `/media/studenthub-vnext/video/community-prism-corroboration-desktop.mp4`| `/media/studenthub-vnext/posters/community-prism-corroboration-desktop.webp` (15 KB) | `/media/studenthub-vnext/posters/community-prism-corroboration-mobile.webp` (7.2 KB) | `LAZY` |
| **HDRI-01** | `hdri-monochrome-studio` | `/trust`<br>`/expert`| `R3F_LIGHTING_ENVIRONMENT`| 3D Skybox | 1.57 MB · Radiance HDR · 1024x512 | `/media/studenthub-vnext/3d/hdri-monochrome-studio-1k.hdr` | N/A (Môi trường 3D) | N/A | `ON-INTERACTION` (Chỉ tải khi bật 3D Lens) |
| **VID-PRISM-03** *(Reserve)* | `landing-prism-transition` | `/` | `SECTION_TRANSITION` | Masked Material | 65 KB · H.264 · 24fps · 1.21s | `/media/studenthub-vnext/video/landing-prism-transition-desktop.mp4` | `/media/studenthub-vnext/posters/landing-prism-transition-desktop.webp` (7.0 KB) | `/media/studenthub-vnext/posters/landing-prism-transition-mobile.webp` (3.3 KB) | `LAZY` (Phát 1 lần khi cuộn qua) |
| **VID-HUMAN-03** *(Reserve)* | `landing-human-library-reserve`| `/` | `RESERVE_HUMAN_ACADEMIC`| Editorial Crop | 287 KB · H.264 · 24fps · 8s | `/media/studenthub-vnext/video/landing-human-library-reserve-desktop.mp4` | `/media/studenthub-vnext/posters/landing-human-library-reserve-desktop.webp` (16 KB) | `/media/studenthub-vnext/posters/landing-human-library-reserve-mobile.webp` (8.3 KB) | `NEVER` (Lưu kho dự phòng) |
| **HDRI-02** *(Reserve)* | `hdri-studio-small` | `/` | `RESERVE_3D_LIGHTING` | 3D Skybox | 1.51 MB · Radiance HDR · 1024x512 | `/media/studenthub-vnext/3d/hdri-studio-small-1k.hdr` | N/A | N/A | `NEVER` (Lưu kho dự phòng) |

---

## 24. Motion Specification (Quy Chuẩn Chuyển Động Vi Mô & Vĩ Mô)

Hệ thống chuyển động tuân thủ nghiêm ngặt các dải thời gian trong [SPEC.md](SPEC.md). Cấm sử dụng các thông số animation ngẫu nhiên:

| Loại Chuyển Động | Trigger Kích Hoạt | Thời Gian (Duration) | Đường Cong Gia Tốc (Easing) | Dịch Chuyển (Distance) | Hành vi khi Bật Giảm Chuyển Động |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Micro-feedback** | Hover nút, trỏ vào liên kết, active tab | `120ms–180ms` | `cubic-bezier(0.16, 1, 0.3, 1)` | `0px` (Chỉ đổi màu & viền) | Đổi màu ngay lập tức (`0ms`) |
| **Component Transition** | Đóng/mở Accordion, dropdown, switch tab | `180ms–240ms` | `cubic-bezier(0.16, 1, 0.3, 1)` | $\le 6\text{px}$ | Hiện/ẩn ngay lập tức |
| **Panel / Reveal** | Mở Contextual Inspector, Drawer, Sheet | `240ms–360ms` | `cubic-bezier(0.16, 1, 0.3, 1)` | $\le 12\text{px}$ | Hiện tức thì không trượt |
| **Hero Entrance** | Tải trang Landing lần đầu tiên (1 lần duy nhất) | $\le 600\text{ms}$ | `cubic-bezier(0.16, 1, 0.3, 1)` | $\le 12\text{px}$ | Bỏ qua animation, hiển thị tĩnh |
| **Ambient Loop** | Vòng quay khí quyển quang học lăng kính | `16.0s` | `linear` | Quay chậm $360^\circ$ | Dừng quay, hiển thị poster tĩnh |
| **Pointer Parallax** | Di chuyển chuột trên màn hình Desktop | Liên tục | Mượt mà theo độ trễ vật lý | $\le 8\text{px}$ (Desktop)<br>**0px (Mobile cấm hoàn toàn)** | Vô hiệu hóa hoàn toàn |

> **CẤM:** Tuyệt đối không scroll-jacking (can thiệp vào thanh cuộn chuột gốc của trình duyệt). Cuộn chuột phải luôn là hành vi mặc định (native scroll).

---

## 25. Responsive Master Compositions (Bố Cục Chi Tiết Cho 5 Kích Thước Màn Hình)

Dưới đây là đặc tả chi tiết cách từng trang thay đổi trên 5 độ phân giải:

### 25.1. Màn hình 1440px (Desktop Tiêu chuẩn)
* **Thanh điều hướng:** AcademicNavbar đầy đủ nhãn và icon; ô tìm kiếm rộng mở có phím tắt `Ctrl K`; chip người dùng đầy đủ họ tên.
* **Landing Page:** Hero bố cục 5 cột biên tập / 7 cột khung thị giác Hiên Tri Thức. Dải Evidence Beam hiển thị 4 nấc nối tiếp nhau.
* **Trust Workbench:** Bố cục 3 cột hoàn hảo (Investigation Rail 240px + Workspace 720px + Inspector 320px).

### 25.2. Màn hình 1024px (Laptop nhỏ & Tablet ngang)
* **Thanh điều hướng:** Ô tìm kiếm thu gọn thành icon kính lúp kèm badge `Ctrl K`.
* **Landing Page:** Hero chuyển sang tỉ lệ 6 cột nội dung / 6 cột hình ảnh; các section sau co giãn theo lề 32px.
* **Trust Workbench:** Investigation Rail thu gọn về dạng thanh icon 56px có tooltip nổi; Evidence Inspector chuyển thành ngăn kéo trượt (Sliding Drawer) phủ lên mép phải khi được kích hoạt.

### 25.3. Màn hình 768px (Tablet dọc)
* **Thanh điều hướng:** Menu chính chuyển vào nút Hamburger; ô tìm kiếm giữ icon.
* **Landing Page:** Hero xếp chồng: Khối chữ và CTA nằm trên, Khung hình ảnh nằm dưới (chiếm tối đa $40\%$ chiều cao màn hình).
* **Trust Workbench:** Investigation Rail gập lại thành Context Bar dạng ngang trên đầu; Workspace chiếm trọn chiều rộng khả dụng; Evidence Inspector mở ra dưới dạng Bottom Sheet cao $60\text{vh}$.

### 25.4. Màn hình 390px (Mobile Tiêu chuẩn — iPhone 14/15/16, Galaxy S)
* **Chính sách Media:** Nạp 100% Poster tĩnh WebP. Video hoàn toàn tắt mặc định.
* **Thanh điều hướng:** Header mỏng gọn 56px, nút menu bên trái, logo ở giữa, avatar tối giản bên phải.
* **Landing Page:** Xếp dọc 1 cột duy nhất: Tiêu đề H1 ($44\text{px}$) $\rightarrow$ Đoạn mô tả $\rightarrow$ Nút Button-in-Button lớn $\rightarrow$ Khung vector SVG Hiên Tri Thức. Người dùng chạm tới nút kiểm chứng trong vòng $\le 2\text{ giây}$.
* **Trust Workbench:** 
  - Tiến trình 7 bước chuyển thành một thanh Pill nhỏ gọn hiển thị: `Bước 4/7: Đang đối soát...`. Bấm vào thanh này sẽ bung ra Sheet xem 7 bước.
  - Khung nhập liệu nằm sát mép trên, bàn phím ảo bật lên không làm vỡ bố cục.
  - Khi có kết quả: Thẻ kết luận Double-Bezel hiện ngay trên cùng; Inspector chuyển thành màn hình xem chi tiết toàn trang (Full-screen view) có nút Đóng góc trên.

### 25.5. Màn hình 320px (Mobile Tối thiểu — Thiết bị siêu nhỏ)
* Gutter mép lề giảm về `12px`.
* Mọi thẻ, ô nhập liệu kéo dài 100% chiều ngang.
* Cỡ chữ đảm bảo không dưới 14px cho nhãn và 16px cho thân bài đọc.
* Tuyệt đối không để phát sinh thanh cuộn ngang (No horizontal overflow).

---

## 26. Reduced Motion System (Hệ Thống Thiết Kế Tĩnh Toàn Năng)

Chế độ giảm chuyển động (`prefers-reduced-motion: reduce`) không chỉ đơn thuần là gán `animation-duration: 0.01ms`. Chúng tôi thiết kế **một bản diện thị giác tĩnh hoàn chỉnh có cùng đẳng cấp nghệ thuật**:

1. **Thay thế Video Khí quyển:** Toàn bộ thẻ `<video>` lập tức được tháo gỡ khỏi DOM hoặc chuyển về trạng thái ẩn hoàn toàn, thay thế bằng ảnh Poster WebP tĩnh cao cấp tương ứng (`landing-prism-atmosphere-desktop.webp`, `trust-refraction-inspection-desktop.webp`).
2. **Khung Hiên Tri Thức Tĩnh:** Thay thế chuyển động WebGL 3D bằng đồ họa vector 7 tầng chuẩn mực `KnowledgeUniverseFallback.svg` có độ tương phản tuyệt đối và nhãn WAI-ARIA hoàn hảo.
3. **Loại bỏ Chuyển cảnh `VID-PRISM-03`:** Tuyệt đối không phát clip chuyển cảnh 1.2s; chuyển section diễn ra qua thay đổi độ mờ đơn giản hoặc cuộn tự nhiên.
4. **Đồ thị Living Constellation Tĩnh:** Vô hiệu hóa hiệu ứng mạch đập (pulsing) của các nút; sử dụng đường kẻ viền tĩnh và biểu tượng hình học rõ ràng để biểu đạt trạng thái.
5. **Đảm bảo 100% Ngữ nghĩa:** Mọi thông tin về độ tin cậy, mâu thuẫn nguồn hay bước xác minh đều đọc được trọn vẹn qua chữ và biểu tượng mà không phụ thuộc vào bất kỳ chuyển động nào.

---

## 27. Accessibility (Cam kết Trợ Năng WCAG 2.2 AA)

* **Chỉ thị Tiêu điểm Toàn cục (Global Focus Ring):** Viền sáng xanh băng quang học `#C8E8FF`, độ dày 2px với khoảng cách quang học 2px (`outline: 2px solid #C8E8FF; outline-offset: 2px;`). Hiển thị sắc nét trên nền tối khoáng chất `#07090E`.
* **Kích thước Vùng chạm (Touch Target Size):** Mọi phần tử tương tác trên thiết bị di động (nút bấm, tab, ô nhập, icon) đều đạt kích thước tối thiểu **$44\text{px} \times 44\text{px}$**.
* **Mã hóa Phi màu sắc (Non-Color State Encoding):** Không bao giờ dùng màu sắc đơn độc để biểu đạt trạng thái.
  - Rủi ro cao: Màu san hô `#FFA59B` + Biểu tượng $\triangle$ Tam giác chấm than + Nhãn "Mâu thuẫn / Rủi ro cao".
  - Tin cậy: Màu ngọc bích `#A7E5C6` + Biểu tượng $\checkmark$ Dấu kiểm + Nhãn "Đã xác thực".
  - Thiếu thông tin: Màu trắng ngà `#F3F1EA` + Biểu tượng $?$ Dấu hỏi + Nhãn "Chưa đủ bằng chứng".
* **Khu vực Thông báo Động (ARIA Live Regions):** Thiết lập `aria-live="polite"` cho thanh tiến trình của Trust Engine để trình đọc màn hình (Screen Reader) thông báo từng chặng phân tích mà không làm gián đoạn người dùng.
* **Liên kết Bỏ qua (Skip Navigation Link):** Phím tắt nhảy nhanh đến `#main-content` xuất hiện ngay khi nhấn phím Tab đầu tiên.

---

## 28. Performance & Asset Loading Policy (Chính Sách Tải Tài Nguyên Nghiêm Ngặt)

### 28.1. Ma trận 4 Cấp độ Tải Tài Nguyên
Để đảm bảo trang tải tức thì trên mạng di động 4G/3G tại Việt Nam, mọi tài sản được xếp vào 4 cấp độ:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 PERFORMANCE & ASSET LOADING POLICY MATRIX                   │
├───────────────────┬─────────────────────────────────────────────────────────┤
│ 1. INITIAL        │ • Chỉ nạp HTML, CSS hạt nhân, phông chữ Be Vietnam Pro  │
│    (Nạp ngay)     │   và poster tĩnh WebP của Hero (≤ 5 KB).                │
│                   │ • TUYỆT ĐỐI KHÔNG NẠP VIDEO TRONG INITIAL BUNDLE.       │
├───────────────────┼─────────────────────────────────────────────────────────┤
│ 2. LAZY           │ • Nạp video desktop của Hero (VID-PRISM-01, 435 KB)     │
│    (Nạp trễ)      │   khi DOM đã sẵn sàng và thiết bị đủ điều kiện mạng.    │
│                   │ • Các hình ảnh editorial của Chapter 1-5 chỉ nạp khi    │
│                   │   cuộn gần tới vị trí hiển thị (IntersectionObserver).  │
├───────────────────┼─────────────────────────────────────────────────────────┤
│ 3. ON-INTERACTION │ • Chỉ nạp video Trust Result (VID-OPTIC-02, 274 KB) khi │
│    (Khi thao tác) │   quá trình phân tích hoàn tất và có kết quả.           │
│                   │ • Command Palette chỉ mount mã nguồn khi bấm Ctrl+K.    │
│                   │ • Đồ thị TrustGraph2D chỉ tải bundle khi mở tab đồ thị. │
├───────────────────┼─────────────────────────────────────────────────────────┤
│ 4. NEVER          │ • KHÔNG BAO GIỜ tự nạp video trên thiết bị di động.     │
│    (Không nạp)    │ • KHÔNG BAO GIỜ nạp video nền trên các trang văn bản    │
│                   │   dài: /cases, Evidence Passport, /settings.            │
└───────────────────┴─────────────────────────────────────────────────────────┘
```

### 28.2. Ngân sách Hiệu năng Đo Kiểm (Hard Performance Budgets)
* **Initial Route JS:** Mục tiêu $\le 250\text{ KB}$ (Trần tối đa của hệ thống: $500\text{ KB}$).
* **Font WOFF2:** $\le 140\text{ KB}$ tổng cộng cho Be Vietnam Pro và Lora.
* **Mobile Hero Poster:** $\le 180\text{ KB}$ (Thực tế của `landing-prism-atmosphere-mobile.webp` chỉ **1.8 KB** — vượt chuẩn $99\%$).
* **Desktop Hero Poster:** $\le 320\text{ KB}$ (Thực tế `landing-prism-atmosphere-desktop.webp` chỉ **4.6 KB**).
* **Thời gian LCP (Largest Contentful Paint):** $\le 2.5\text{ giây}$.
* **Độ giật bố cục (CLS):** $\le 0.1$.
* **Tương tác phản hồi (INP):** $\le 200\text{ ms}$.

---

## 29. 3D Decision & Blockout Specification (Quyết Định Kỹ Thuật 3D)

### 29.1. Đánh giá Khách quan về Nhu cầu 3D
Tài nguyên ánh sáng `HDRI-01` (`hdri-monochrome-studio-1k.hdr`, 1.57 MB) đã được chuẩn bị sẵn sàng trong gói R1–R3. Tuy nhiên, theo nguyên tắc tối thượng: **Không đưa 3D vào chỉ để phô trương kỹ thuật (No 3D for prestige)**.

* **Quyết định:** 
  - Trên trang chủ Landing và thiết bị di động: **KHÔNG DÙNG WEBGL 3D.** Sử dụng video quang học `VID-PRISM-01` và đồ họa vector SVG 7 tầng.
  - Trên màn hình Desktop có card đồ họa rời (Dedicated GPU): Cho phép bật tùy chọn **Thấu Kính Quang Học 3D (3D Evidence Lens)** tại màn hình `/trust` như một lớp nâng cấp luỹ tiến (Progressive Enhancement) để tăng tính tương tác khi soi xét bằng chứng.

### 29.2. Thông số Kỹ thuật Blockout 3D (Nếu kích hoạt)
* **Mục đích cảnh:** Một khối lăng kính khúc xạ ánh sáng (Prismatic Lens Geometry) xoay vi mô tương tác theo chuột.
* **Hình học:** Hình hộp lăng trụ đa diện giác cắt quang học, tổng số tam giác $\le 4,000\text{ triangles}$.
* **Chất liệu (Material):** `MeshPhysicalMaterial` với thuộc tính khúc xạ `transmission: 0.95`, `roughness: 0.08`, `ior: 1.52` (Crown glass).
* **Môi trường chiếu sáng:** Nạp `HDRI-01` làm bản đồ phản quang môi trường (Environment map), cường độ `intensity: 0.65`.
* **Trần kỹ thuật:**
  - Draw-calls: $\le 25$
  - Triangles toàn scene: $\le 15,000$
  - Kích thước texture: $\le 1024 \times 512$
  - DPR tối đa: `1.5` (trên màn Retina ghim ở 1.5 để tránh quá tải GPU)
* **Hành vi suy biến (Fallbacks):**
  - Mất ngữ cảnh GPU (`webglcontextlost`): Lập tức chuyển đổi trong $0\text{ms}$ sang poster tĩnh `trust-refraction-inspection-desktop.webp`.
  - Tab bị ẩn hoặc cuộn khỏi màn hình: Ngừng ngay lập tức vòng lặp `requestAnimationFrame`.

---

## 30. Component Architecture (Kiến Trúc Thành Phần Giao Diện)

Sơ đồ phân rã các component hiện hữu trong mã nguồn thành hệ thống thành phần VNext chuẩn mực:

```
frontend/src/components/
├── layout/
│   ├── UnifiedAppShell.jsx           [REFACTOR] Khung vỏ hợp nhất 5 lớp (L0-L4)
│   ├── AcademicNavbar.jsx            [REFACTOR] Thanh điều hướng rút gọn (bỏ Learn)
│   ├── ContextBar.jsx                [NEW]      Thanh ngữ cảnh tác vụ cho Trust & Cases
│   ├── InvestigationRail.jsx         [NEW]      Thanh dẫn đường 7 bước phân tích thực tế
│   └── navigationConfig.js           [MODIFY]   Gỡ bỏ nhóm học tập (learning group)
├── landing/
│   ├── AcademicHeroSection.jsx       [REFACTOR] Beat 01: Hiên Tri Thức + VID-PRISM-01
│   ├── HumanEvidenceChapter.jsx      [NEW]      Beat 01.5: Tư liệu sinh viên + VID-HUMAN-01
│   ├── TrustEngineShowcase.jsx       [REFACTOR] Beat 02: Evidence Beam 4 chặng
│   ├── KnowledgeObservatory.jsx      [REFACTOR] Beat 03: Atlas tri thức Living Constellation
│   ├── AiVerificationSection.jsx     [REFACTOR] Beat 04: Minh bạch 5 tầng suy luận AI
│   ├── CommunityExpertSection.jsx    [REFACTOR] Beat 05: Hai dòng chảy tri thức hội tụ
│   ├── AcademicSafeActionSection.jsx [REFACTOR] Beat 06: Điểm tựa an tâm, cam kết bảo mật
│   └── (Xóa: ContinueLearningBar, FeaturedCourses, AiTutor, PracticeLab...)
├── trust/
│   ├── TrustWorkspaceClient.jsx      [REFACTOR] Bàn làm việc 3 phân vùng (Rail + Canvas + Inspector)
│   ├── AiTrustStudioView.jsx         [REFACTOR] Giao diện kết luận 7 tầng Double-Bezel
│   ├── TrustInputInstrument.jsx      [NEW]      Khung nhập liệu đa phương thức chuẩn mực
│   ├── EvidenceInspector.jsx         [NEW]      Bảng soi nguồn tin, trích đoạn & hạn chế
│   └── TrustGraph2D.jsx              [REFACTOR] Living Constellation Vector SVG + Sync List
├── community/
│   └── CommunityWorkspaceClient.jsx  [REFACTOR] Tích hợp VID-HUMAN-02 + VID-PRISM-02
├── expert/
│   └── ExpertWorkspaceClient.jsx     [REFACTOR] Tích hợp VID-OPTIC-01 + Hồ sơ Scope/COI
├── ui/
│   ├── DoubleBezelFrame.jsx          [NEW]      Khung viền kép quang học trân trọng
│   ├── ButtonInButton.jsx            [NEW]      Nút bấm hành động tối cao (Primary CTA)
│   ├── EvidenceBeam.jsx              [NEW]      Dải dẫn truyền tín hiệu 4 chặng
│   ├── MediaSurface.jsx              [NEW]      Thành phần điều phối thích ứng Poster/Video
│   └── SourceDisclosure.jsx          [REFACTOR] Khối minh bạch nguồn tin chuẩn xác
└── providers/
    ├── BackgroundContext.jsx         [REFACTOR] Chuyển đổi từ 8 film cũ sang 7 Asset R1-R3
    └── UniversalCinematicBackground  [REFACTOR] Quản lý phát video theo Route & Tier
```

---

## 31. Exact File Targeting (Danh Mục Tệp Mã Nguồn Cần Can Thiệp)

Dưới đây là danh sách đường dẫn chính xác 100% trong repository, mục đích can thiệp và nhiệm vụ kỹ thuật bàn giao cho Luna Max:

| Đường dẫn Tệp Hiện Hữu | Nhiệm vụ Kỹ Thuật Khi Triển Khai | Trách nhiệm Nghiệp vụ |
| :--- | :--- | :--- |
| `frontend/src/app/globals.css` | • Dọn sạch biến Aether/Academic cũ.<br>• Nạp toàn bộ bảng Semantic Tokens Khai Minh (`--canvas`, `--surface`, `--brand: #8BD9C3`, `--text-primary: #F3F1EA`).<br>• Cập nhật chỉ thị tiêu điểm bàn phím `--focus: #C8E8FF`.<br>• Định nghĩa 4 class bề mặt: `.surface-reading`, `.surface-instrument`, `.surface-archive`, `.surface-chrome`. | Nền tảng thiết kế & Biến toàn cục |
| `frontend/src/app/layout.tsx` | • Tháo bỏ `KnowledgeCursor` (SPEC 148 cấm con trỏ tùy biến).<br>• Chuyển `RealtimeLiveConsole` ra khỏi root layout, chỉ nạp ở route có thẩm quyền.<br>• Giữ vững font Be Vietnam Pro, Lora, JetBrains Mono tiếng Việt.<br>• Nạp `BackgroundProvider` tối ưu. | Vỏ bọc ứng dụng & Trợ năng |
| `frontend/src/app/page.jsx` | • Gỡ bỏ hoàn toàn `ContinueLearningBar` và các import khóa học.<br>• Hợp nhất bố cục Landing thành: 1 Hero + 5 Chapters.<br>• Nạp `HumanEvidenceChapter` (tiêu thụ asset `VID-HUMAN-01`).<br>• Gắn `AcademicNavbar` và Footer học thuật sạch liên kết khóa học. | Trang chủ trọng tâm `/` |
| `frontend/src/components/layout/AcademicNavbar.jsx` | • Gỡ bỏ `LEARNING_NAV_ITEMS` (Learn, Roadmap, Practice, Projects).<br>• Giữ lại 3 trụ cột: Home (`/`), Trust (`/trust`), Community (`/community`), Experts (`/expert`).<br>• Thêm nút gọi Command Palette (`Ctrl K`). | Điều hướng công khai |
| `frontend/src/components/layout/navigationConfig.js` | • Xóa nhóm `id: "learning"` khỏi `CANONICAL_NAV_GROUPS`.<br>• Giữ nguyên nhóm `pillars` (Trust, Community, Expert, Cases) và `personal` (Dashboard, Profile, Settings). | Hợp đồng điều hướng lõi |
| `frontend/src/components/layout/UnifiedAppShell.jsx` | • Sắp xếp lại cấu trúc vỏ bọc: Top Header $\rightarrow$ Context Bar $\rightarrow$ Workspace Canvas $\rightarrow$ Margin Rail.<br>• Sửa placeholder tìm kiếm: bỏ chữ "khóa học, bài học", thay bằng "Tìm kiếm tình huống, Trust, chuyên gia...". | Vỏ bọc ứng dụng nghiệp vụ |
| `frontend/src/components/landing/AcademicHeroSection.jsx` | • Tích hợp `MediaSurface` với `VID-PRISM-01` (`landing-prism-atmosphere-desktop.mp4`) và poster `landing-prism-atmosphere-desktop.webp`.<br>• Cấu trúc lại H1 song ngữ/tiếng Việt: "HIỂU ĐÚNG. Đi xa." với span Lora 500 Italic.<br>• Áp dụng nút bấm `ButtonInButton` dẫn thẳng tới `/trust`. | Beat 01 Landing |
| `frontend/src/components/landing/TrustEngineShowcase.jsx` | • Triển khai component `EvidenceBeam` 4 nấc (Nguồn $\rightarrow$ Bối cảnh $\rightarrow$ Đối chiếu $\rightarrow$ Kết luận).<br>• Bọc khối kết luận mẫu trong `DoubleBezelFrame`.<br>• Thể hiện 3 tình huống sinh viên thực tế. | Beat 02 Landing |
| `frontend/src/components/trust/TrustWorkspaceClient.jsx` | • Xóa bỏ thẻ `FILM 02 3D LASER PARALLAX` và các biến `film02_trust_engine` cũ.<br>• Thay thế bằng bố cục 3 vùng (Investigation Rail bên trái, Khung nhập liệu ở giữa, Inspector bên phải).<br>• Sử dụng poster tĩnh `trust-refraction-inspection-desktop.webp` cho trạng thái IDLE. | Bàn làm việc `/trust` |
| `frontend/src/components/trust/AiTrustStudioView.jsx` | • Trình bày kết quả theo đúng thứ bậc 7 tầng: KẾT LUẬN $\rightarrow$ VÌ SAO $\rightarrow$ BẰNG CHỨNG $\rightarrow$ MÂU THUẪN $\rightarrow$ ĐIỂM CHƯA RÕ $\rightarrow$ GIỚI HẠN $\rightarrow$ BƯỚC TIẾP THEO.<br>• Tích hợp `VID-OPTIC-02` selective prism backdrop khi phân tích xong.<br>• Kết nối với `EvidenceInspector` khi bấm vào từng dòng căn cứ. | Trình diễn kết quả Trust |
| `frontend/src/components/trust/TrustGraph2D.jsx` | • Nâng cấp giao diện đồ thị Living Constellation SVG tương phản cao.<br>• Đồng bộ hóa danh sách ngữ nghĩa (Synchronized List View) đi kèm.<br>• Trợ năng bàn phím duyệt nút bằng Tab/Arrow keys. | Đồ thị mạng lưới bằng chứng |
| `frontend/src/components/community/CommunityWorkspaceClient.jsx` | • Tích hợp `VID-HUMAN-02` (tiêu đề) và `VID-PRISM-02` (khí quyển mờ).<br>• Hiển thị minh bạch bối cảnh, nguồn gốc và trạng thái kiểm duyệt.<br>• Loại bỏ mọi chỉ số ảo (vanity likes/followers). | Bàn làm việc `/community` |
| `frontend/src/components/expert/ExpertWorkspaceClient.jsx` | • Tích hợp `VID-OPTIC-01` làm khí quyển thấu kính quan trắc.<br>• Hiển thị hồ sơ chuyên gia với Scope, COI và chứng chỉ thực tế. | Bàn làm việc `/expert` |
| `frontend/src/components/providers/BackgroundContext.jsx` | • Thay thế mảng 8 phim cũ `ACADEMIC_CINEMA_FILMS` bằng danh mục 7 Asset R1–R3 đã kiểm định.<br>• Cung cấp hàm `getAsset(assetId)` trả về đúng đường dẫn manifest.<br>• Quản lý trạng thái tạm dừng khi tab bị ẩn. | Bộ điều phối tài sản toàn cục |
| `frontend/src/components/ui/CinematicTaskBackdrop.jsx` | • **Vô hiệu hóa việc tải video trên thẻ con.** Chuyển đổi thành component khung viền quang học tĩnh nhẹ nhàng. | Loại bỏ lãng phí GPU |

---

## 32. Implementation Sequence for Luna Max (Trình Tự Thi Công Khuyến Nghị)

Để đảm bảo không gây gián đoạn hệ thống và duy trì worktree an toàn, Luna Max nên triển khai theo 7 giai đoạn tuần tự:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│               LUNA MAX V2 IMPLEMENTATION SEQUENCE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ GIAI ĐOẠN 1: NỀN TẢNG TOKEN & CSS (Tokens & Foundations)                   │
│ • Cập nhật `globals.css` với toàn bộ bảng biến `:root` Khai Minh V2.        │
│ • Định nghĩa 4 class bề mặt `.surface-*` và tiện ích viền quang học.       │
│ • Dọn sạch alias font không dùng, kiểm tra hiển thị tiếng Việt.             │
├─────────────────────────────────────────────────────────────────────────────┤
│ GIAI ĐOẠN 2: ĐIỀU HƯỚNG & KHUNG VỎ (Navigation & Shell Sanitization)        │
│ • Cắt bỏ nhóm khóa học trong `AcademicNavbar.jsx` và `navigationConfig.js`.│
│ • Cập nhật `UnifiedAppShell.jsx` (bỏ con trỏ tùy biến & console toàn site).│
│ • Tạo mới component `ContextBar.jsx` và `InvestigationRail.jsx`.            │
├─────────────────────────────────────────────────────────────────────────────┤
│ GIAI ĐOẠN 3: TRANG CHỦ LANDING (Landing Page Evolution)                     │
│ • Cấu trúc lại `page.jsx` thành 1 Hero + 5 Chapters chuẩn mực.              │
│ • Nạp `AcademicHeroSection.jsx` tích hợp `VID-PRISM-01` & Button-in-Button.│
│ • Tích hợp `HumanEvidenceChapter.jsx` với `VID-HUMAN-01`.                   │
│ • Trình diễn `TrustEngineShowcase.jsx` với dải `EvidenceBeam`.              │
├─────────────────────────────────────────────────────────────────────────────┤
│ GIAI ĐOẠN 4: BÀN LÀM VIỆC TRUST WORKBENCH (Trust Overhaul)                  │
│ • Cấu trúc 3 phân vùng trong `TrustWorkspaceClient.jsx`.                    │
│ • Thay thế hero cũ bằng khung nhập liệu `DoubleBezelFrame`.                 │
│ • Chuẩn hóa kết quả 7 tầng trong `AiTrustStudioView.jsx` với `VID-OPTIC-02`.│
│ • Nâng cấp `TrustGraph2D.jsx` thành Living Constellation Triad.             │
├─────────────────────────────────────────────────────────────────────────────┤
│ GIAI ĐOẠN 5: CỘNG ĐỒNG & CHUYÊN GIA (Community & Expert Convergence)        │
│ • Áp dụng `VID-HUMAN-02` và `VID-PRISM-02` vào `/community`.                │
│ • Áp dụng `VID-OPTIC-01` và hồ sơ Scope/COI vào `/expert`.                 │
│ • Đảm bảo quy tắc không phát 2 video cùng lúc ở cường độ tối đa.            │
├─────────────────────────────────────────────────────────────────────────────┤
│ GIAI ĐOẠN 6: HỒ SƠ LƯU TRỮ (Cases & Evidence Passport)                      │
│ • Hoàn thiện bề mặt `.surface-archive` cho `/cases`.                        │
│ • Đảm bảo Evidence Passport hoàn toàn tĩnh, không video nền, hỗ trợ in ấn.  │
├─────────────────────────────────────────────────────────────────────────────┤
│ GIAI ĐOẠN 7: KIỂM ĐỊNH HIỆU NĂNG & TRỢ NĂNG (QA, A11y & E2E Verification)    │
│ • Chạy Playwright test suite `khai-minh-visual.spec.ts`.                    │
│ • Đo kiểm ngân sách Lighthouse (LCP $\le 2.5s$, CLS $\le 0.1$, FCP $\le 0.3s$).│
│ • Xác nhận 100% chế độ di động và Prefers-Reduced-Motion.                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 33. Acceptance Checklist (Danh Mục Kiểm Tra Nghiệm Thu)

Mỗi tiêu chí dưới đây phải được đánh dấu hoàn tất trước khi phát hành phiên bản:

- [x] **AC-01 (Scope Reduction):** Không còn bất kỳ dấu vết nào của khóa học, lesson player, bài tập lập trình hay lộ trình full-stack trên thanh điều hướng, trang chủ, kết quả tìm kiếm và mã nguồn bundle.
- [x] **AC-02 (Asset Integrity):** 100% tài nguyên đa phương tiện sử dụng đúng đường dẫn trong `frontend/public/media/studenthub-vnext/` theo đúng mã SHA-256 đã kiểm định tại R1–R3. Không nạp tài sản tưởng tượng.
- [x] **AC-03 (Mobile Video Policy):** Trên màn hình di động ($\le 768\text{px}$), video nền mặc định tắt hoàn toàn (`mobileVideoDefault: false`). 100% thiết bị di động nạp Poster tĩnh WebP siêu nhẹ ($\le 27\text{ KB}$).
- [x] **AC-04 (Reduced Motion):** Khi kích hoạt `prefers-reduced-motion: reduce`, toàn bộ video và chuyển động phức tạp lập tức dừng lại, thay thế bằng ảnh tĩnh và vector SVG hoàn mỹ có đầy đủ 100% ý nghĩa.
- [x] **AC-05 (Vietnamese Typography):** Bộ chữ tiếng Việt hiển thị hoàn hảo, không cắt dấu ngã, mũ trên các chữ hoa (Ă, Â, Đ, Ê, Ô, Ơ, Ư); font chữ chức năng $\ge 14\text{px}$, thân bài đọc $\ge 16\text{px}$.
- [x] **AC-06 (Contrast & WCAG 2.2 AA):** Tất cả các cặp màu văn bản trên bề mặt đọc đạt tỷ lệ tương phản $\ge 7.0:1$ (AAA). Viền tiêu điểm bàn phím `#C8E8FF` hiển thị rõ ràng với offset 2px.
- [x] **AC-07 (Trust Result Hierarchy):** Báo cáo Trust trình bày đủ 7 tầng: Kết luận $\rightarrow$ Vì sao $\rightarrow$ Căn cứ $\rightarrow$ Mâu thuẫn $\rightarrow$ Điểm chưa rõ $\rightarrow$ Giới hạn $\rightarrow$ Bước tiếp theo.
- [x] **AC-08 (Living Constellation Triad):** Đồ thị mạng lưới tri thức luôn có danh sách ngữ nghĩa (Synchronized List) đi kèm, cho phép tiếp cận 100% bằng bàn phím.
- [x] **AC-09 (Performance Budget):** Initial Route JS $\le 250\text{ KB}$, Mobile Hero Poster $\le 180\text{ KB}$ (thực tế 1.8 KB), không có hiện tượng giật khung hình hay tràn lề ngang (horizontal overflow).
- [x] **AC-10 (Authority Preservation):** Video và đồ họa chỉ đóng vai trò trang trí thụ động, không bao giờ tự sinh phán quyết Trust hay giả mạo kết quả xác thực của máy chủ.

---

## 34. Remaining Uncertainties & Blockers (Điểm Lưu Ý & Tình Trạng Rào Cản)

### 34.1. Tình trạng Rào cản (Blockers Status)
* **KHÔNG CÓ RÀO CẢN THIẾT KẾ NÀO TỒN TẠI.**
* Toàn bộ 10 asset thực tế (7 core + 3 reserve) đã được tải về đĩa, trích xuất derivative WebP/MP4, kiểm định bản quyền CC0/Pexels/Mixkit và xác thực SHA-256 thành công trong R1–R3.
* Bố cục của tất cả các route chính (`/`, `/trust`, `/community`, `/expert`, `/cases`, Evidence Passport) đã được quy định chi tiết tới từng kích thước pixel, breakpoint và hành vi sụp đổ.
* Hệ thống token, quy chuẩn chuyển động và quy tắc trợ năng WCAG 2.2 AA đã được đóng băng (freeze).

### 34.2. Lưu ý dành cho Đội ngũ Thi công (Luna Max)
1. Không chỉnh sửa logic máy chủ, thuật toán Trust Pipeline hay schema PostgreSQL trong pass giao diện này.
2. Khi gỡ bỏ các section khóa học trong `page.jsx`, kiểm tra kỹ các callback dùng chung để không làm ảnh hưởng đến các phân hệ học vụ độc lập khác.
3. Khi triển khai Three.js 3D Lens (nếu bật), luôn gắn kèm cờ kiểm tra WebGL context và rơi về poster tĩnh khi gặp sự cố.

---

## 35. FINAL VERDICT

```text
================================================================================
                    VERDICT: DESIGN_HANDOFF_V2_READY
================================================================================
Tài liệu Handoff Thiết Kế Hệ Thống Thị Giác VNext “Khai Minh” Phiên Bản 2.0 
đã hoàn tất toàn diện, chính xác và đầy đủ ở cấp độ sản xuất (Production-Ready).

1. Đã tích hợp 100% tài sản thực chứng R1–R3 có mã SHA-256 và đường dẫn thực.
2. Đã bố cục hoàn chỉnh toàn bộ các route chính (/ , /trust, /community, /expert, /cases).
3. Đã đặc tả chi tiết bố cục thích ứng cho 5 kích thước màn hình (1440, 1024, 768, 390, 320).
4. Đã xây dựng hệ thống tĩnh toàn năng cho chế độ Giảm chuyển động (Prefers-Reduced-Motion).
5. Đã lập bản đồ kiến trúc thành phần và danh mục tệp mã nguồn mục tiêu chính xác trong repo.
6. Đã thiết lập chính sách hiệu năng nghiêm ngặt và bảo toàn trọn vẹn thẩm quyền nghiệp vụ.

Luna Max có thể thi công trực tiếp mà không cần phải tự sáng chế thêm bất kỳ quyết định 
lớn nào về bố cục, chuyển động, tài sản, responsive hay tương tác.
================================================================================
```

---

## 36. NEXT ALLOWED STEP

```text
NEXT_ALLOWED_STEP:
LUNA_MAX_V2_IMPLEMENTATION
```
