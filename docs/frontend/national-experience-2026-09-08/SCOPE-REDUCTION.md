# Quyết định phạm vi và loại bỏ chức năng dư

Ngày: 08/09/2026 · Trạng thái: `TARGET_SCOPE_DEFINED_CODE_UNCHANGED`.

## 1. Quy tắc quyết định

Một tính năng được giữ trong sản phẩm trọng tâm nếu giúp hoàn tất hành trình **nhận thông tin → hiểu căn cứ → đối chiếu → lưu hồ sơ → quyết định bước tiếp theo**. Nếu không, nó phải có vai trò hỗ trợ rõ, hoặc rời navigation/public bundle của bản dự thi.

Quyết định bỏ khóa học là yêu cầu sản phẩm của chủ dự án. Lượt này tiếp tục làm đề án theo phạm vi tài liệu trước đó; chưa có tác vụ xóa code/dữ liệu. “Gỡ khỏi giao diện”, “ngừng endpoint” và “xóa dữ liệu” là ba việc khác nhau, có evidence và rollback riêng.

## 2. Ma trận giữ / gỡ / đóng băng

| Phân hệ | Quyết định đích | Lý do / cách xử lý |
| --- | --- | --- |
| `/trust` | KEEP_CORE | Một điểm vào kiểm chứng; giữ trạng thái, nguồn, hạn chế và next action |
| `/community` | KEEP_CORE | Bổ sung trải nghiệm/corroboration có xuất xứ; không biến vote thành truth |
| `/expert` | KEEP_CORE | Scope/credential/COI và review có con người chịu trách nhiệm |
| `/cases` | KEEP_SUPPORT | Chạy case mẫu có nhãn; không giả mạo hồ sơ live |
| Evidence Passport/report revision | KEEP_SUPPORT | Chứng minh kết quả có thể truy nguyên/đọc lại; không thêm trụ cột nav mới |
| Auth/profile/settings/privacy | KEEP_SUPPORT | Quyền, session và privacy là nền tảng; không hy sinh để rút scope |
| Dashboard | SIMPLIFY_SUPPORT | Ưu tiên hồ sơ và thông báo liên quan; chưa thiết kế lại mọi widget cá nhân |
| Catalog `/learn`, lesson `/learn/[courseId]/[lessonId]` | REMOVE_PRODUCT | Chủ dự án yêu cầu bỏ khóa học; không giữ dưới tên “academy” mới |
| Course cards, tutor bán khóa học, tiếp tục học, full-stack roadmap | REMOVE_PRODUCT | Cắt khỏi landing, search, command palette, onboarding và CTA |
| Practice, projects học lập trình, quests/gamification | REMOVE_FROM_COMPETITION | Không giúp case kiểm chứng. Trước khi ngừng API, phân tích caller/data riêng |
| Academic 360, GPA, timetable, semester planner | DEFER | Còn giá trị độc lập nhưng quá rộng cho bài thi này; giữ source/history, không đưa vào demo chính |
| Marketplace, radar học phí, safety-map, SOS, rating | DEFER | Không xóa theo tên hàng loạt; xác nhận dependency và phạm vi dữ liệu từng route |
| `/academic-showcase`, `/cinema`, `/c9` | SHOWCASE_ONLY | Không xuất hiện trong navigation/search/sitemap bản trọng tâm; không tự tải ở root |
| Knowledge Universe thiên về Frontend/Backend/DevOps | REPLACE_HERO_MEANING | Hero trình bày ý nghĩa Trust; không sửa ontology dùng chung nếu chưa phân tích caller |
| Realtime console/HUD kỹ thuật | OPERATOR_ONLY_PRESENTATION | Chỉ surface phù hợp/quyền phù hợp; dữ liệu private vẫn phải được chặn từ server |
| Labbe | KEEP_BACKEND_BOUNDARY | Quan sát/assurance tùy môi trường; không dùng để làm “AI phán quyết” trên landing |
| Expert qualification quiz | KEEP_SUPPORT | Đây là kiểm tra năng lực chuyên gia, không phải khóa học; không xóa nhầm theo từ `quiz` |
| Academic course records/transcript | KEEP_DATA | Dữ liệu học vụ không đồng nghĩa catalog bài học; không drop hoặc rewrite khi gỡ Learn |

## 3. Inventory khóa học đã xác nhận từ source

Đường dẫn tính từ root; danh sách này là điểm bắt đầu, không được coi là dependency graph hoàn chỉnh.

| Bề mặt | Nơi đã thấy | Việc phải hoàn tất khi triển khai |
| --- | --- | --- |
| Homepage composition | `frontend/src/app/page.jsx` | Bỏ import/render các chapter course; thay bằng bố cục Trust đã duyệt |
| Hero / CTA cuối / footer | `AcademicHeroSection.jsx`, `FinalCtaSection.jsx`, footer trong `page.jsx` | Không còn CTA chính/phụ hoặc footer dẫn tới Learn |
| Course sections | `ContinueLearningBar`, `LearningDomainsSection`, `FullStackLayersSection`, `FeaturedCoursesSection`, `AiTutorSection`, `PracticeProjectLabSection` | Đánh giá caller khác; không đưa vào landing/bundle; chỉ xóa module riêng khi graph xác nhận không dùng |
| Public navigation | `frontend/src/components/layout/AcademicNavbar.jsx` | Bỏ nhóm học tập và mục khóa học ở desktop/mobile |
| App navigation | `frontend/src/components/layout/navigationConfig.js` | Canonical nav không còn learning group của bản trọng tâm; giữ core/account |
| Search / command palette | `frontend/src/lib/search/searchProviders.js`, `AcademicCommandPalette.jsx` | Bỏ Categories Courses/Lessons và kết quả practice; không để link chết từ tìm kiếm |
| Atlas | `frontend/src/components/atlas/InteractiveKnowledgeAtlas.jsx` | Bỏ promotion/deep link `/learn?domain=...`; không đổi callback chung thiếu kiểm chứng |
| Route bài học | `frontend/src/app/learn/page.jsx`, dynamic lesson page | Áp dụng hành vi retired route dưới đây; không để player gọi tutor/notes |
| Background / side rail | `BackgroundContext.jsx`, `MarginRail.jsx` | Không tải film Learn trên route core; giữ file asset gốc cho archive |
| Tests / budgets / snapshots | E2E lesson, release assurance, bundle/Lighthouse route lists | Thay journey đã ngừng bằng case/report trọng tâm; giữ kết quả lịch sử đúng nhãn |
| Backend/data | Chưa xác nhận có course DB riêng; lesson content đang có local source | Kiểm kê requests, tables, storage và job thực; không phát minh database để xóa |

## 4. Hành vi sau khi ngừng khóa học

- Không còn catalog, lesson player, nút đăng ký/tiếp tục học, teaser “sắp ra mắt khóa học”, course search hoặc link onboarding từ sản phẩm trọng tâm.
- Deep link cũ hiển thị thông báo mục khóa học đã ngừng, với lựa chọn về trang chủ hoặc mở Trust; không tự chuyển người dùng sang một nghĩa khác mà không giải thích.
- Trang thông báo không index; ưu tiên HTTP 410 nếu hạ tầng route hiện hữu hỗ trợ và đã kiểm thử, hoặc trang 404 hữu ích. Không thêm route mới chỉ để giải thích việc ngừng.
- Endpoint chỉ phục vụ course, nếu thực sự tồn tại, phải ngừng nhận mutation sau khi kiểm kê caller. Endpoint dùng chung như mentor/notes/expert assessment không được vô hiệu hóa hàng loạt.
- Tài liệu, tiến độ, ghi chú và dữ liệu người dùng còn tồn tại phải có phương án bảo toàn/đọc/xuất trước bước xóa vật lý. Không xóa DB, storage, schema hay file raw trong pass gỡ giao diện.

## 5. Lát cắt triển khai và rollback tương lai

| Lát cắt | Thao tác | Evidence | Rollback |
| --- | --- | --- | --- |
| CUT-1 | Gỡ promotion/nav/search, giữ route cũ thông báo | Crawl mọi đường dẫn core ở desktop/mobile; không còn link course | Khôi phục riêng changeset presentation |
| CUT-2 | Ngừng route/player và các request độc quyền | Network trace không gọi course/tutor/notes từ retired page; deep link có thông báo | Khôi phục route adapter/chỉ thị presentation |
| CUT-3 | Bỏ import/asset fetch và test scope đã lỗi thời | Build/import graph/bundle diff; test mới chứng minh core đủ chức năng | Khôi phục module từ changeset, không chạm dữ liệu |
| CUT-4 | Dọn module chỉ dùng cho khóa học | Graph không còn consumer, không shared data dependency, review file list | Git history/changeset được ghi trong kế hoạch triển khai |
| CUT-5 | Xử lý dữ liệu nếu thật sự cần | Chính sách giữ/xuất/xóa được chủ dữ liệu xác định và thực thi kiểm tra | Không làm nếu chưa có phương án phục hồi hợp lệ |

CUT-1…4 là trình tự đề xuất, chưa được chạy. CUT-5 là công việc riêng; yêu cầu bỏ course không được dùng để suy ra quyền xóa mọi dữ liệu học tập.

## 6. Điều kiện chấp nhận

`SCOPE-01` đạt khi navigation, search, footer, hero và CTA core không quảng bá khóa học; không còn tải course chunk trên đường đi core; URL cũ có trạng thái rõ; role/API/dữ liệu dùng chung không thay đổi; testcase cũ được thay đúng scope chứ không bỏ assertion để có màu xanh. Fixture tài liệu/lịch sử có thể còn nhắc khóa học và phải được nhận diện là lịch sử.

Không chạy lệnh `rg course` rồi xóa tất cả kết quả. Những từ đó có thể nằm trong hồ sơ học vụ, model evaluation, expert qualification và evidence thật.
