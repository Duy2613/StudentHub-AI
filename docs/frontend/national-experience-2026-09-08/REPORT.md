# Báo cáo đánh giá StudentHub AI và hướng nâng năng lực dự thi

Ngày: 08/09/2026 · Trạng thái: `DESIGN_AUDIT_DOCUMENTED` · Kết luận thiết kế: cần thống nhất hệ thống thị giác trước khi tăng số lượng hiệu ứng.

## 0. Điểm hiện tại và khả năng đạt giải

**Điểm tổng hợp tạm thời: 6,3/10.** Đây là nhận định chuyên môn từ source, phản hồi chủ dự án và evidence lịch sử; không phải kết quả audit chạy lại toàn hệ thống. Khoảng diễn giải hợp lý là 6–6,5, không xem chữ số thập phân là độ chính xác thống kê.

| Tiêu chí nội bộ | Trọng số | Điểm /10 | Căn cứ và phần còn thiếu |
| --- | ---: | ---: | --- |
| Giá trị vấn đề và tiềm năng khác biệt | 20% | 7,5 | Kiểm chứng thông tin có nguồn, bất đồng và next action có giá trị; chưa có thử nghiệm đối chứng chứng minh hơn phương án thay thế |
| Tập trung sản phẩm / câu chuyện | 15% | 6,0 | Trust/Community/Expert đã rõ về kiến trúc; landing/nav còn kéo sang catalog, full-stack, course và nhiều công cụ |
| Frontend / khả năng sử dụng | 20% | 5,5 | Có primitives và fallback; chủ dự án chưa hài lòng, chữ nhỏ và nhiều lớp hình thức; chưa có usability/device pass mới |
| Kiến trúc backend / kiểm soát | 20% | 7,5 | Session, repository, revision, outbox, quyền và tests có chiều sâu; durable jobs, nhiều instance, RLS hiệu lực và recovery còn cần bằng chứng |
| Chất lượng AI / dữ liệu / kiểm chứng thực tế | 15% | 4,5 | Có rule baseline và contract tests; corpus trùng, provenance của model/holdout chưa đầy đủ, chưa có đối chứng blind evaluation được gắn candidate |
| Khả năng tái lập / hồ sơ / demo | 10% | 6,0 | Có fixture và báo cáo chi tiết; README cũ, nhiều checkpoint khác nhau, chưa có gói thống nhất đúng thể lệ và commit |
| Tổng có trọng số | 100% | **6,275 → 6,3** | Công thức: tổng(trọng số × điểm). Không phải rubric chính thức |

**Xác suất giải Nhất: chưa đủ dữ liệu để ước lượng.** Thiếu danh sách/chất lượng đối thủ, rubric đúng bảng, kết quả chấm thử độc lập và điều kiện vòng thi. Không biến 6,3/10 thành 63% cơ hội thắng, cũng không đặt một khoảng phần trăm tùy ý. Hiện có tiềm năng làm bài thi đáng chú ý, nhưng chưa đủ bằng chứng để xếp vào nhóm ứng viên giải Nhất.

`FINAL-FRONTEND-AUDIT.md` từng ghi 8,9/10 cho frontend trong demo có kiểm soát. Đó là phạm vi hẹp và checkpoint khác; không phải điểm toàn dự án hay dự báo giải thưởng. Đánh giá hiện tại đặt trọng số vào độ tập trung, AI được kiểm chứng và độ tin cậy chạy thật.

Mục tiêu nâng cấp: đủ bằng chứng để được hội đồng nội bộ đánh giá lại ở mức **8–8,5/10**, rồi mới thử rubric và phản biện độc lập. Đây là đích đề xuất, không phải số điểm được hứa sau khi viết thêm code.

### Khoảng trống backend và bằng chứng

| ID | Bằng chứng đã đọc | Kết luận hiện tại | Ưu tiên |
| --- | --- | --- | --- |
| BE-A01 | Auth closure ghi `AUTH_IDENTITY_VERIFIED_LOCAL`; chưa có đầy đủ positive provider/RLS bằng test identities được duyệt | Phân biệt auth local contract với login/session/revocation trên môi trường thật | P0 trước claim chạy thật |
| BE-A02 | Realtime report 07/09 ghi `REALTIME_DURABLE_LOCAL_VERIFIED`; two-instance/reconnect/recovery còn mở | Event log đã có; chưa chứng minh được fan-out/private isolation qua nhiều instance | P0 cho scope realtime |
| BE-A03 | Labbe closure ghi `VERIFIED_SHADOW` và `LABBE_STAGING_BLOCKED_BY_ENV` | Không cần mở rộng Labbe để làm đẹp demo; outage không được làm Trust thất bại | Giữ boundary, staging tùy scope |
| BE-A04 | Audit corpus 06/09: 6.982 dòng/3.231 text riêng; 23.455 dòng/2.784 text riêng, theo normalization đã mô tả | Tỉ lệ trùng dư lịch sử 53,72% và 88,13%; cần hash/split/evaluate lại trước mọi claim model | P0 về AI evidence |
| BE-A05 | Audit cũ chưa gắn được artifact model với dataset hash và locked holdout; runtime L2C công khai là rule baseline | Test logic không tương đương năng lực học máy; không dùng metric viết sẵn làm kết quả benchmark | P0 về AI evidence |
| BE-A06 | Trust service/route hiện có các trường case/run/revision/persisted; báo cáo release vẫn thiếu staging persistence/rollback | Chứng minh submit → commit → đọc lại → restart trên DB dành cho test | P0 về golden flow |
| BE-A07 | Root README trước phiên này mô tả `develop`/checkpoint cũ và badge test tĩnh; branch hiện tại đã khác | Tách đề án mới, kiểm chứng lịch sử và release claim; một evidence manifest cho candidate | P0 về hồ sơ |

Các finding CORE-01…CORE-12 trong audit 06/09 có thể đã được sửa ở checkpoint sau. Bảng trên chỉ giữ những **khoảng trống bằng chứng** còn thể hiện trong tài liệu mới hơn; không khẳng định tất cả bug cũ vẫn tồn tại.

### Năm thay đổi có tác động lớn nhất

1. Bỏ khóa học khỏi sản phẩm đích, cắt quảng bá full-stack/practice; giữ một hành trình kiểm chứng có đầu-cuối.
2. Làm Trust result dễ hiểu: điều đã biết, căn cứ, mâu thuẫn, điều chưa biết, phạm vi và bước tiếp theo; source drill-down nằm ngay cạnh kết luận.
3. Dùng một tập dữ liệu độc lập, nhãn được phân xử và đánh giá cùng baseline để chứng minh giá trị AI; báo cáo cả lỗi và abstention.
4. Chứng minh quyền, commit/idempotency, restart, outage và recovery trên môi trường test được sở hữu.
5. Hoàn thiện typography và hero tĩnh; chỉ thêm motion khi tăng khả năng hiểu và qua ngân sách hiệu năng.

### Khung tài liệu được áp dụng

Đề án kết hợp PRD (người dùng/vấn đề/phạm vi), SRS (yêu cầu có ID/invariant), ADR (quyết định/đánh đổi), WBS (task/owner/phụ thuộc), ma trận traceability và evidence. Không có một template duy nhất được coi là “chuẩn nhất” cho mọi cuộc thi.

Tham khảo phạm vi công khai của [ISO/IEC/IEEE 29148:2018](https://www.iso.org/standard/72089.html) cho requirements engineering, [ISO/IEC 25010:2023](https://www.iso.org/standard/78176.html) cho chất lượng sản phẩm, [OWASP ASVS 5.0.0](https://github.com/OWASP/ASVS/tree/v5.0.0) cho kiểm chứng security và [NIST AI RMF Playbook](https://www.nist.gov/itl/ai-risk-management-framework/nist-ai-rmf-playbook) cho Govern/Map/Measure/Manage. Chỉ dùng những phần liên quan, không tuyên bố chứng nhận hoặc đã kiểm toán toàn tiêu chuẩn; toàn văn ISO không được kiểm tra trong phiên này.

Mọi tiêu chí chính thức của cuộc thi được quản lý riêng tại [COMPETITION-FIT](COMPETITION-FIT.md); không trộn rubric nội bộ ở trên với điểm ban giám khảo.

## 1. Kết luận và giới hạn bằng chứng

Frontend có nền tảng đáng giữ: lời hứa “Hiểu đúng. Đi xa.”, CTA tới `/trust`, bố cục hero hai vùng, font có hỗ trợ tiếng Việt, SVG trước WebGL, khả năng giảm chuyển động ở một số component và bộ kiểm thử đã có. Khó khăn nằm ở việc nhiều ngôn ngữ thiết kế đang cùng tồn tại: studio học thuật, bảng điều khiển kỹ thuật, mạng tri thức lập trình và phim nền điện ảnh.

Nhận định “chưa đẹp, khó nhìn” là phản hồi trực tiếp của chủ dự án. Những nguyên nhân dưới đây được đối chiếu từ source và asset. Không gán điểm UX, tỉ lệ chuyển đổi hay kết luận WCAG cho giao diện hiện tại khi chưa đo.

Đã thực hiện trong phiên này:

- Đọc Vault, design contracts, entry point `/`, root layout, hero, font/token CSS, background provider, video renderer, progressive 3D và các báo cáo liên quan.
- Xem trực tiếp poster `film01_campus_atlas.jpg` và snapshot Trust desktop có sẵn trong repository. Snapshot là tư liệu lịch sử, không phải ảnh chụp bản đang chạy ngày 08/09.
- Kiểm kê kích thước 16 file MP4/WebP, đối chiếu nguồn font và hướng dẫn W3C/web.dev; tính tương phản cho palette **đề xuất**.
- Chưa khởi chạy app, chụp lại browser, chạy Lighthouse, đo frame time, phỏng vấn người dùng hoặc tạo asset. Kế hoạch kiểm tra trực tiếp nằm trong [PLAN](PLAN.md).

Baseline tham chiếu: branch `design/academic-cinematic-product-evolution`, snapshot đã push `4b8f9fd1`, cộng worktree hiện tại có thay đổi realtime chưa commit. Sáu file dirty lúc bắt đầu phiên được giữ nguyên; báo cáo này không chứng nhận toàn bộ snapshot đó.

Ghi nhận khi kiểm tra cuối: worktree phát sinh thêm các chỉnh sửa frontend ngoài tác giả của pass tài liệu, gồm fonts/CSS, hero, atlas, background và `TrustEngineShowcase.jsx`. Phần frontend được rà soát ban đầu là snapshot `4b8f9fd1`; điểm 6,3/10 và AUD-01…12 không tự chứng nhận hoặc phủ nhận những sửa đổi song song về sau. Cần review lại candidate khi chúng hoàn tất. Kiểm tra cuối vẫn thấy course imports/CTA/nav trong `page.jsx`, hero và `AcademicNavbar.jsx`; chưa thể claim khóa học đã được gỡ.

## 2. Vấn đề và quyết định đề xuất

Đường dẫn trong bảng tính từ root repository. Số dòng là vị trí lúc đọc, có thể đổi khi triển khai.

| ID / ưu tiên | Bằng chứng | Ảnh hưởng cần xử lý | Đề xuất / nghiệm thu |
| --- | --- | --- | --- |
| AUD-01 / P1 | `frontend/src/app/layout.tsx` khai báo Be Vietnam Pro, Lora, JetBrains Mono. `globals.css:210–214` còn alias Plus Jakarta và serif hệ thống; `:2632` ghi lại human font | Có drift giữa font tải, token và cách dùng. Chưa xác nhận computed font của từng route | Kiểm tra computed style và rendered font; lập một mapping canonical. SPEC `TYP-01` |
| AUD-02 / P1 | Hero dùng `text-[11px]` cho giải thích Nguồn/Bối cảnh/Bước tiếp tại `AcademicHeroSection.jsx:74,79,84`; nhiều label mono/uppercase | Thông tin có ý nghĩa bị hạ quá nhỏ so với headline; cần tăng cỡ và giảm mật độ | Nội dung quan trọng ≥14px, body ≥16px tại root mặc định; kiểm tra zoom/diacritics. `TYP-02` |
| AUD-03 / P1 | Layout chỉ nạp Be Vietnam Pro 400/700; component dùng medium/semibold, có nơi yêu cầu 900. Lora chỉ cấu hình normal | Weight/style yêu cầu chưa khớp face được tải; matching/fallback có thể làm thứ bậc khác dự kiến | Proof weights/styles thực, kiểm tra network và DevTools. Không kết luận mọi weight đều được browser tổng hợp. `TYP-03` |
| AUD-04 / P1 | `globals.css` chứa nhiều họ token Aether, Academic, Guardian; hero có indigo/cyan aura, accent primary/knowledge/success | Nhiều tín hiệu nhấn cạnh tranh; brand và trạng thái nghiệp vụ cần tách vai trò | Một accent chủ đạo, bảng màu ngữ nghĩa riêng và đối chiếu tương phản. `COL-01` |
| AUD-05 / P1 | `page.jsx` đưa 10 section sau hero: atlas, domains, full-stack layers, courses, tutor, practice, outcomes… | Cần kiểm tra xem người mới hiểu StudentHub là công cụ Trust hay catalog học lập trình | Rút landing thành câu chuyện 5 section sau hero, giữ tính năng ở route hiện hữu. `IA-01` |
| AUD-06 / P1 | Hero gắn `KNOWLEDGE_DOMAINS`: Frontend, Backend, Database, DevOps…; CTA chính lại là kiểm tra trước khi tin | Đối tượng 3D chưa giải thích rõ giá trị trung tâm của lời hứa | Hero mới dùng một không gian tri thức; minh họa nguồn/bối cảnh/đối chiếu, không giả lập verdict. `HERO-01` |
| AUD-07 / P1 | `BackgroundProvider` gắn `UniversalCinematicBackground` và dock trên toàn root; mapping film gồm Trust, Community, Expert, Lesson, Settings | Media có thể chạy ở màn đọc/nhập liệu, kể cả khi lớp trang che phần lớn nền; cần đo runtime | Xác định chính sách media theo loại màn; nền đọc ổn định, hero có vùng cinematic riêng. `MED-01` |
| AUD-08 / P1 | `UniversalCinematicBackground` fallback sang WebP động; pause handler chỉ điều khiển `<video>`. Component không đọc reduced-motion context | Pause cho nhánh WebP không được thể hiện trong source; CSS giảm animation không tự dừng media động | Fallback lỗi/giảm motion phải là ảnh tĩnh; chứng minh pause ở mọi nhánh. `MED-02` |
| AUD-09 / P1 | Comment renderer nói veil “Guarantees 100% WCAG AAA”; không có bằng chứng đối chiếu mọi frame trong phiên này | Overlay không phải bằng chứng đạt chuẩn; frame sáng có thể làm đổi tương phản | Text trên nền opaque xác định được; đo các trạng thái và frame sáng nhất. `A11Y-01` |
| AUD-10 / P2 | Root layout mount `KnowledgeCursor`, `RealtimeLiveConsole`, toast và background dock; console có text 10–11px | Có nguy cơ nhiều phần tử fixed cạnh tranh ở mobile; cần kiểm tra va chạm thực | Phân tầng overlay; đưa lựa chọn hình thức vào điểm điều khiển hiện có. `LAY-02` |
| AUD-11 / P2 | Bộ 8 MP4 + 8 WebP động chiếm **88,183,090 bytes** trên đĩa; một MP4 khoảng 14.36 MB | Chi phí asset cần kế hoạch phân phối; dung lượng trên đĩa không đồng nghĩa tải mỗi trang | Chỉ phát đúng một rendition khi đủ điều kiện; budget theo request. `PERF-01` |
| AUD-12 / P2 | Poster campus là mô hình kiến trúc có nhiều chi tiết, dải mặt giấy rất sáng ở bên trái | Ảnh đẹp độc lập nhưng vùng chèn chữ cần bố cục riêng; chưa đủ bản sắc Việt Nam từ asset này | Art direction cho bóng râm, vật liệu, sinh hoạt học thuật và vùng trống xác định. `ART-01` |

P1/P2 là mức ưu tiên cho dự án thiết kế, không phải phân loại lỗ hổng bảo mật. AUD-01, AUD-03, AUD-07 và AUD-10 cần browser evidence trước khi chốt sửa cụ thể.

## 3. Những gì nên giữ

| Giữ lại | Lý do / điều kiện |
| --- | --- |
| Next.js/React/Tailwind và các primitives hiện hữu | Bài toán là trải nghiệm; chưa có lý do đổi framework hoặc thêm motion library |
| Lời hứa “Hiểu đúng. Đi xa.”, CTA `/trust` | Đã có tính liên tục về sản phẩm và destination rõ |
| Be Vietnam Pro, Lora dưới dạng ứng viên | Đã có trong project; trước hết proof cỡ, weight, nhịp và glyph thay vì tăng family |
| Semantic SVG fallback và lazy 3D | Là nền tảng hợp lý; cần thống nhất policy điều kiện tải |
| Truthful state contracts | Unknown, unavailable, conflict và demo vẫn phải đọc ra được bằng chữ |
| Asset gốc và route showcase hiện hữu | Giữ làm kho tham chiếu; không xóa hoặc đưa mọi showcase lên trang chính |
| Auth/session/realtime/Labbe authority | Không nằm trong đề án thay đổi quyết định nghiệp vụ |

Skill `redesign-existing-projects` được dùng cho cách rà soát typography/layout/motion. Gợi ý thêm hiệu ứng của skill được chọn lọc theo bài toán đọc và thao tác. Skill `spec-driven-development` dẫn tới các ma trận trạng thái và điều kiện nghiệm thu trong SPEC; không triển khai code ở phiên này.

## 4. Các hướng mỹ thuật để quyết định

| Hướng | Đặc trưng | Điểm mạnh | Đánh đổi | Vai trò |
| --- | --- | --- | --- | --- |
| **A — Khai Minh** | Nền tối khoáng, chữ ngà, jade tiết chế, typography biên tập, một không gian tri thức 3D | Giữ nhận diện tối hiện tại; tạo tương phản chữ và cảm giác học thuật | Phải giảm lớp glow/glass và kiểm tra hiệu quả ngoài trời | Hướng khuyến nghị để làm proof đầu tiên |
| B — Học đường sáng | Giấy ngà, mực xanh đen, hình ảnh đời sống, bề mặt phẳng | Phù hợp đọc lâu và thử nghiệm trong ánh sáng mạnh | Thay đổi theme nhiều hơn; không làm kèm A như một dự án thứ hai | Mẫu đối chứng nếu A chưa đạt khả năng đọc |
| C — Phòng thí nghiệm không gian | Tương phản mạnh, mono và chuyển động đồ thị nổi bật | Hợp showcase kỹ thuật hoặc phần trải nghiệm tự chọn | Dễ lặp lại mật độ và nhiễu hiện tại | Giữ ở trải nghiệm riêng, không chọn làm nền chung |

Khuyến nghị là quyết định mỹ thuật để đem đi kiểm chứng, không phải kết luận A đã được người dùng ưa thích hơn.

## 5. Bằng chứng hiệu năng trước đây cần đọc đúng

[PERFORMANCE.md](../PERFORMANCE.md) ghi nhận ở checkpoint 06/09: landing initial JS 204,993 bytes; Lighthouse mobile LCP 2,771.6ms, CLS 0, TBT 76.8ms, n=1; shared CSS 408,895 raw bytes / 53,278 gzip bytes. Đây là số liệu lịch sử theo điều kiện của báo cáo, không phải phép đo lại ngày 08/09.

Vì sample lịch sử chỉ n=1 và chưa có RUM/device evidence toàn diện, đề án không dùng nó để tuyên bố production readiness hoặc tốc độ trên phạm vi toàn quốc. Mỗi đợt tích hợp tương lai phải đo lại đúng commit và điều kiện.

## 6. Những quyết định chưa được chốt

- Chủ dự án chưa duyệt mỹ thuật A, B hay một biến thể; A chỉ là đề xuất có thông số để đánh giá.
- Chưa chọn ảnh người thật, nguồn bản quyền, nhà cung cấp tạo video, đơn vị chế tác font hoặc ngân sách trả phí.
- Chưa đo khả năng hiểu thông điệp, đọc trong ánh sáng mạnh, hiệu năng trên máy thật và mức chóng mặt do motion.
- Chưa tạo font, hình, video, model 3D hoặc prototype mới. Không có thay đổi chạy thật, commit, push hay deploy từ đề án này.

## 7. Cơ sở tham khảo

- Font metadata: [Be Vietnam Pro](https://github.com/google/fonts/blob/main/ofl/bevietnampro/METADATA.pb), [Lora](https://github.com/google/fonts/blob/main/ofl/lora/METADATA.pb). Cả hai khai báo Vietnamese và OFL; quyền dùng/đóng gói phải đi theo đúng file font được chọn.
- Các ngưỡng chữ và motion được đối chiếu với [W3C Contrast Minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) và [Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html); áp dụng cụ thể trong SPEC.
- Các mục tiêu hiệu năng dựa trên [Core Web Vitals](https://web.dev/articles/vitals); cách tổ chức tải media tham khảo [Lazy loading video](https://web.dev/articles/lazy-loading-video).

Nguồn ngoài được kiểm tra ngày 08/09/2026. Số liệu màu, ngân sách asset, lịch và điểm nghiệm thu trong đề án là tính toán/đề xuất của dự án, không phải số liệu do các nguồn đó cung cấp.

## 8. Kiểm tra bộ tài liệu trong phiên này

- Hoàn thiện 8 file trong thư mục đề án; cập nhật README root và link điều hướng Vault Index.
- Kiểm tra liên kết local và cân bằng code fences; không có link thiếu hoặc trailing whitespace trong tập Markdown đã kiểm tra.
- 44 requirement ID trong SPEC được ánh xạ vào kế hoạch nghiệm thu; T-01…T-21 vẫn là test dự kiến, không phải test đã chạy.
- Công thức rubric nội bộ cho kết quả 6,275, làm tròn 6,3/10.
- SHA-256 của cả sáu file dirty có sẵn lúc bắt đầu trùng trước/sau pass. Các thay đổi frontend phát sinh song song được giữ nguyên, không sửa hoặc stage.
- Không chạy build/runtime test, không tạo asset, không commit/push/deploy và không thực hiện thao tác dữ liệu từ pass tài liệu.

Kết luận của riêng bộ tài liệu: `DOCUMENTATION_COMPLETE`. Implementation, staged runtime evidence, xác nhận bảng thi và quyết định giải thưởng vẫn là các công việc riêng.
