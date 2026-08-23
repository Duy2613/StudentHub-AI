# 🎨 Creative Web & 3D Engineering Showcases
> **Vault Node**: `Creative-Engine-Showcases` | **Tags**: `#creative-tech` `#webgl` `#threejs` `#threejs-shaders` `#showcases`

---

## 1. Giới Thiệu (Overview)
Hệ sinh thái **StudentHub AI** tích hợp 4 tác phẩm web sáng tạo và công nghệ mô phỏng đồ họa 3D WebGL / GLSL tiên tiến, phục vụ học tập, khám phá kỹ thuật lập trình sáng tạo (Creative Coding) và nâng tầm trải nghiệm thị giác cho sinh viên ngành Công nghệ thông tin & Thiết kế số.

---

## 2. Danh Mục 4 Showcases & Kiến Trúc Kỹ Thuật

### 🏛️ 1. Lumora — Design & Engineering Studio
- **Đường dẫn**: `frontend/public/showcases/lumora/index.html` | `/showcase/lumora`
- **Công nghệ**: Single-file HTML/CSS/JS, CDN Importmap Lenis `v1.3.23`, Google Font Onest.
- **Tính năng nổi bật**:
  - **Adaptive Rem Grid**: Tự động scale font-size theo `vw` trên các mốc 1920, 1440, 1024, 640 và thuật toán mở rộng runtime JS cho màn hình siêu lớn (>1920px).
  - **Dark Intro Loader**: Đếm số từ `000` đến `100` với đường cong `easeInOutCubic` trong 1300ms rồi trượt panel lên trên với lò xo spring physics.
  - **Liquid Cursor Reveal**: Vẽ cọ mờ radial mask trên canvas để bóc tách hiển thị 2 lớp ảnh trước/sau mượt mà theo chuyển động chuột.
  - **Component Ecosystem**: Watermark chữ lớn, carousel thẻ sản phẩm, lưới đối tác, portfolio 4 thẻ tối, danh mục dịch vụ hover-fill accordion, counter thống kê tự tăng khi cuộn tới và modal gửi yêu cầu dự án.

### 🥤 2. Soda — Pure Zero 3D Interactive Beverage Landing
- **Đường dẫn**: `frontend/public/showcases/soda/index.html` | `/showcase/soda`
- **Công nghệ**: Google `<model-viewer>`, GSAP 3.12, Cursive typography (`Galada`), Glassmorphism.
- **Tính năng nổi bật**:
  - **Realtime 3D Tilt**: Mô hình lon 3D trung tâm tự động nghiêng theo tọa độ chuột trong không gian 3 chiều.
  - **Berry & Leaves Repel Force Field**: Hàng chục quả mọng 3D và lá cây tầng sâu/tầng nông bị đẩy dạt ra khi con trỏ chuột di chuyển tới gần.
  - **Flavor Switching Choreography**: Chuyển đổi hương vị (Classic Teal ↔ Blue Zero Lime), lon nước xoay 720 độ tạo vệt mờ chuyển động, các quả mọng co cụm lại rồi phát nổ tỏa ra vị trí ngẫu nhiên mới.
  - **Bubbles Container**: Bong bóng mờ nổi lên liên tục từ đáy màn hình.

### 🌊 3. Flow Wave — Three.js Procedural Shader Sea
- **Đường dẫn**: `frontend/public/showcases/flow-wave/index.html` | `/showcase/flow-wave`
- **Công nghệ**: Three.js r0.143.0, GLSL 3D Simplex Noise, UnrealBloomPass, Multi-Composer Pipeline.
- **Tính năng nổi bật**:
  - **Procedural Vertex Shader**: Biến đổi `SphereGeometry(4.2, 200, 600)` thành mặt biển sóng cuộn ngọc lục bảo phát sáng additive.
  - **Camera Flight Dive**: Cuộn trang theo độ cao 620vh để camera lượn từ trên cao `(0, 7, 16)` hạ sát mặt nước `(0, 0.8, -2)`.
  - **Vertex Repulsion**: Con trỏ chuột chiếu xuống mặt phẳng `z=0` trong world space và đẩy dạt các đỉnh hạt tạo sóng gợn.
  - **Corner Flames**: Shader `FinalPass` tạo ngọn lửa viền góc với hàm biến dạng `warp3d`.

### ✨ 4. Cosmic Dust — Three.js Floating Particle Universe
- **Đường dẫn**: `frontend/public/showcases/cosmic-dust/index.html` | `/showcase/cosmic-dust`
- **Công nghệ**: Three.js r0.143.0, Warp3D vertex displacement, fract-wrapping stream.
- **Tính năng nổi bật**:
  - **Ember & Amber Motes**: 940 hạt bụi than hồng và hổ phách lướt vô tận về phía camera với hàm bao bọc `fract()`.
  - **Multi-Stage Bloom**: 3 composer độc lập kết hợp GammaCorrection, UnrealBloomPass và CopyShader.
  - **Smootherstep Fade-in**: Quá trình khởi động 2200ms với easing bậc 5 mượt mà.

---

## 3. Bản Đồ Truy Cập (Navigation Hub)
- **Showcase Hub (Next.js)**: `/showcase`
- **Showcases Directory (Static HTML)**: `public/showcases/index.html`
- **Menu Header & Floating Dock**: Nút "Creative Lab" dẫn trực tiếp tới trung tâm trải nghiệm.
