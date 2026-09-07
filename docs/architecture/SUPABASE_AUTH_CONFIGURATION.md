# Cấu hình Supabase Google OAuth cho StudentHub AI

Tài liệu này hướng dẫn chi tiết quy trình kích hoạt và cấu hình **Google OAuth** trên **Supabase Dashboard** và đồng bộ an toàn với StudentHub AI.

---

## 1. Nguyên nhân lỗi `validation_failed: Unsupported provider`

Khi sinh viên hoặc nhà phát triển nhấn vào nút **Continue with Google**, Supabase Client gửi request:
```http
POST https://<project-ref>.supabase.co/auth/v1/authorize?provider=google
```
Nếu provider Google **chưa được kích hoạt** trong Supabase Dashboard, Supabase trả về mã lỗi HTTP 400:
```json
{
  "code": 400,
  "error_code": "validation_failed",
  "msg": "Unsupported provider: provider is not enabled"
}
```

StudentHub AI bảo vệ trải nghiệm người dùng bằng cách:
1. **Kiểm tra Capability State (`AuthCapabilityState`)**: Nếu Google OAuth chưa được bật (`google: 'DISABLED'`), giao diện hiển thị nhãn `Chưa kích hoạt` và không gửi request rác đến máy chủ.
2. **Thông báo thân thiện**: Không hiển thị popup JSON hay lỗi kỹ thuật thô. Hiển thị thông báo tiếng Việt rõ ràng hướng dẫn sử dụng Email/Mật khẩu hoặc yêu cầu quản trị viên cấu hình.

Cờ `NEXT_PUBLIC_SUPABASE_GOOGLE_AUTH=true` chỉ là tín hiệu vận hành ở frontend. Provider chỉ được coi là `READY` khi đồng thời có `NEXT_PUBLIC_SUPABASE_GOOGLE_AUTH_VERIFIED=true`, sau khi người vận hành đã kiểm tra provider, Client ID, Client Secret và redirect trong Dashboard. Client ID/Secret không được đưa vào frontend; chúng luôn nằm ở cấu hình provider của Supabase.

---

## 2. Quy trình cấu hình Google OAuth trong Supabase

### Bước 1: Tạo OAuth Client trên Google Cloud Console
1. Truy cập [Google Cloud Console](https://console.cloud.google.com/).
2. Chọn project hoặc tạo project mới (ví dụ: `StudentHub-AI`).
3. Điều hướng tới **APIs & Services** $\rightarrow$ **OAuth consent screen**:
   - Chọn User Type: **External**.
   - Điền App name: `StudentHub AI`, User support email, Developer contact email.
   - Lưu lại (Save and Continue).
4. Điều hướng tới **APIs & Services** $\rightarrow$ **Credentials**:
   - Nhấn **Create Credentials** $\rightarrow$ **OAuth client ID**.
   - Application type: **Web application**.
   - Name: `StudentHub Supabase Auth Client`.
   - **Authorized redirect URIs** (Quan trọng):
     ```
     https://<YOUR-SUPABASE-PROJECT-REF>.supabase.co/auth/v1/callback
     ```
     *(Lấy `<YOUR-SUPABASE-PROJECT-REF>` từ Supabase URL của dự án, ví dụ: `dsvbxyi...`)*.
   - Nhấn **Create** và sao chép **Client ID** cùng **Client Secret**.

---

### Bước 2: Kích hoạt Provider trên Supabase Dashboard
1. Truy cập [Supabase Dashboard](https://supabase.com/dashboard).
2. Mở project của bạn $\rightarrow$ Điều hướng tới mục **Authentication** $\rightarrow$ **Providers**.
3. Tìm mục **Google** và bật công tắc **Enable Google provider**.
4. Dán thông tin vừa lấy từ Google Cloud:
   - **Client ID**: Dán Client ID của bạn.
   - **Client Secret**: Dán Client Secret của bạn.
5. Nhấn **Save**.

---

### Bước 3: Cấu hình Redirect URLs trên Supabase
1. Trong mục **Authentication** $\rightarrow$ chọn **URL Configuration**.
2. **Site URL**:
   - Môi trường phát triển cục bộ: `http://localhost:3000`
   - Môi trường production: `https://studenthub.ai` (hoặc tên miền của bạn)
3. **Redirect URLs** (Thêm đầy đủ danh sách):
   - `http://localhost:3000/callback`
   - `http://localhost:3000/auth/callback`
   - `https://studenthub-ai.vercel.app/callback` (nếu deploy Vercel)
   - `https://studenthub-ai.vercel.app/auth/callback`
4. Nhấn **Save**.

---

### Bước 4: Kích hoạt trên Frontend StudentHub AI
Sau khi Supabase Dashboard đã được cấu hình xong, mở tệp `.env.local` ở thư mục `frontend/` và bật cờ:
```bash
NEXT_PUBLIC_SUPABASE_GOOGLE_AUTH="true"
NEXT_PUBLIC_SUPABASE_GOOGLE_AUTH_VERIFIED="true"
NEXT_PUBLIC_SUPABASE_AUTH_REDIRECT_URL="http://localhost:3000/callback"
```
Giao diện chỉ nhận diện `google: 'READY'` khi cả hai cờ được bật và Supabase URL hợp lệ. Projection audit chỉ hiển thị URI callback dự kiến (`https://<project-ref>.supabase.co/auth/v1/callback`), redirect của ứng dụng và trạng thái attestation; không hiển thị credential.

---

## 3. Kiểm thử luồng xác thực

1. **Email / Password**: Luôn là phương thức đăng nhập chính và hoạt động 100% độc lập với OAuth.
2. **Google OAuth (khi Disabled)**:
   - Nút có nhãn `Chưa kích hoạt`.
   - Nhấp vào nút hiển thị thông báo hướng dẫn rõ ràng, không làm gián đoạn ứng dụng.
3. **Google OAuth (khi Enabled)**:
   - Chuyển hướng người dùng tới màn hình đăng nhập tài khoản Google của trường hoặc cá nhân.
   - Callback xử lý tại `/callback`, giải mã session và tự động điều hướng về `next` hoặc `/dashboard`.
