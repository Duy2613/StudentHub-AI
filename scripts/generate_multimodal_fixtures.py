import os
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps
import qrcode
import cv2
import numpy as np

def generate_fixtures():
    fixtures_dir = Path("fixtures/trust-multimodal")
    fixtures_dir.mkdir(parents=True, exist_ok=True)
    print(f"Generating multimodal test fixtures into {fixtures_dir.resolve()}...")

    # Helper for QR code image
    def make_qr(data, size=(400, 400), border=4):
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=10,
            border=border,
        )
        qr.add_data(data)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white").convert("RGB")
        return img.resize(size, Image.Resampling.LANCZOS)

    # 1. HTTPS URL QR
    img = make_qr("https://studenthub-preview.edu.vn/scholarship/2026")
    img.save(fixtures_dir / "qr_https_url.png")

    # 2. HTTP URL QR
    img = make_qr("http://safe-uni.edu.vn/courses/admissions")
    img.save(fixtures_dir / "qr_http_url.png")

    # 3. Plain Text QR
    img = make_qr("Thong bao tuyen sinh dai hoc quoc gia 2026 khoa CNTT")
    img.save(fixtures_dir / "qr_plain_text.png")

    # 4. Vietnamese Text QR
    img = make_qr("Thong bao xet tuyen hoc bong tai nang tre nam 2026 he dai hoc")
    img.save(fixtures_dir / "qr_vietnamese_text.png")

    # 5. Rotated 90
    img = make_qr("https://studenthub-preview.edu.vn/verified-info")
    img_90 = img.rotate(90, expand=True)
    img_90.save(fixtures_dir / "qr_rotated_90.png")

    # 6. Rotated 180
    img_180 = img.rotate(180, expand=True)
    img_180.save(fixtures_dir / "qr_rotated_180.png")

    # 7. Rotated 270
    img_270 = img.rotate(270, expand=True)
    img_270.save(fixtures_dir / "qr_rotated_270.png")

    # 8. Inverted (white-on-black)
    img_inv = ImageOps.invert(img)
    img_inv.save(fixtures_dir / "qr_inverted.png")

    # 9. Blurry QR
    img_blur = img.filter(ImageFilter.GaussianBlur(radius=2.5))
    img_blur.save(fixtures_dir / "qr_blurry.png")

    # 10. Low-resolution QR
    img_lowres = img.resize((64, 64), Image.Resampling.NEAREST).resize((400, 400), Image.Resampling.NEAREST)
    img_lowres.save(fixtures_dir / "qr_lowres.png")

    # 11. Damaged QR (with occlusion in corner)
    img_damaged = img.copy()
    draw = ImageDraw.Draw(img_damaged)
    draw.rectangle([150, 150, 260, 260], fill="white")
    img_damaged.save(fixtures_dir / "qr_damaged.png")

    # 12. Multi-code QR (two QR codes side by side)
    multi = Image.new("RGB", (850, 420), color=(250, 250, 250))
    qr_left = make_qr("https://studenthub-preview.edu.vn/qr1", size=(360, 360))
    qr_right = make_qr("https://studenthub-preview.edu.vn/qr2", size=(360, 360))
    multi.paste(qr_left, (30, 30))
    multi.paste(qr_right, (450, 30))
    draw_multi = ImageDraw.Draw(multi)
    draw_multi.text((50, 400), "CODE A", fill=(50, 50, 50))
    draw_multi.text((470, 400), "CODE B", fill=(50, 50, 50))
    multi.save(fixtures_dir / "qr_multi_code.png")

    # SSRF & Dangerous QRs
    # 13. Localhost
    make_qr("http://localhost:8080/admin/api").save(fixtures_dir / "qr_ssrf_localhost.png")
    # 14. 127.0.0.1
    make_qr("http://127.0.0.1:3000/internal").save(fixtures_dir / "qr_ssrf_127.png")
    # 15. Metadata IP
    make_qr("http://169.254.169.254/latest/meta-data/").save(fixtures_dir / "qr_ssrf_metadata.png")
    # 16. RFC1918
    make_qr("http://192.168.1.1/admin/setup").save(fixtures_dir / "qr_ssrf_rfc1918.png")
    # 17. Javascript
    make_qr("javascript:alert(document.cookie)").save(fixtures_dir / "qr_dangerous_javascript.png")
    # 18. Data
    make_qr("data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==").save(fixtures_dir / "qr_dangerous_data.png")
    # 19. File
    make_qr("file:///etc/passwd").save(fixtures_dir / "qr_dangerous_file.png")
    # 20. Credentials
    make_qr("https://admin:superSecretPassword123@phishing-uni.com/portal").save(fixtures_dir / "qr_credentials_url.png")
    # 21. Punycode
    make_qr("https://xn--apple-43a.com/login").save(fixtures_dir / "qr_punycode.png")
    # 22. Suspicious redirect
    make_qr("https://tinyurl.com/urgent-tuition-payment-2026").save(fixtures_dir / "qr_suspicious_redirect.png")

    # 23. Screenshot of Scholarship Scam
    scam = Image.new("RGB", (800, 500), color=(245, 247, 250))
    draw_scam = ImageDraw.Draw(scam)
    draw_scam.rectangle([0, 0, 800, 60], fill=(220, 38, 38))
    draw_scam.text((30, 20), "THONG BAO KHAN: HOC BONG TOAN PHAN 2026", fill=(255, 255, 255))
    draw_scam.text((30, 90), "Chuc mung sinh vien duoc nhan hoc bong 50.000.000 VND tu Quy Quoc Te.", fill=(20, 20, 20))
    draw_scam.text((30, 130), "De kich hoat tai khoan nhan tien, yeu cau nop phi ho so 500.000 VND trong 2 gio.", fill=(200, 20, 20))
    draw_scam.text((30, 170), "Truy cap ngay: https://hocbong-sinhvien-nhanuudai2026.com/xac-nhan", fill=(37, 99, 235))
    draw_scam.text((30, 210), "Qua thoi han 2 gio, hoc bong se duoc chuyen cho thi sinh tiep theo!", fill=(180, 50, 50))
    # Add QR code inside screenshot
    qr_scam = make_qr("https://hocbong-sinhvien-nhanuudai2026.com/xac-nhan", size=(180, 180))
    scam.paste(qr_scam, (580, 280))
    draw_scam.text((580, 470), "Quet ma thanh toan", fill=(100, 100, 100))
    scam.save(fixtures_dir / "screenshot_scholarship_scam.png")

    # 24. Screenshot of Urgent Payment Scam
    pay = Image.new("RGB", (750, 450), color=(255, 255, 255))
    draw_pay = ImageDraw.Draw(pay)
    draw_pay.rectangle([0, 0, 750, 50], fill=(15, 23, 42))
    draw_pay.text((25, 15), "CONG THONG TIN SINH VIEN - CANH BAO HOC PHI", fill=(255, 255, 255))
    draw_pay.text((30, 80), "YEU CAU THANH TOAN HOC PHI HOC KY TRUOC 24H", fill=(225, 29, 72))
    draw_pay.text((30, 120), "Sinh vien chua hoan thanh khoan nop 3.500.000 VND. Tai khoan se bi khoa vinh vien neu khong chuyen ngay vao so tai khoan duoi day:", fill=(30, 41, 59))
    draw_pay.text((30, 170), "STK: 9988776655 - Ngan hang TMCP Vietcombank - Chu TK: Nguyen Van Lua Dao", fill=(15, 23, 42))
    draw_pay.text((30, 210), "Website ho tro: https://cong-thanh-toan-hoc-phi-nhanh.com", fill=(37, 99, 235))
    pay_qr = make_qr("https://cong-thanh-toan-hoc-phi-nhanh.com", size=(160, 160))
    pay.paste(pay_qr, (540, 260))
    pay.save(fixtures_dir / "screenshot_payment_scam.png")

    # 25. Real Camera Photo Mockup (Natural landscape/campus photo with EXIF)
    photo = Image.new("RGB", (800, 600), color=(50, 120, 80))
    draw_photo = ImageDraw.Draw(photo)
    for y in range(600):
        # gradient
        r = int(40 + 60 * (y / 600.0))
        g = int(100 + 80 * (y / 600.0))
        b = int(60 + 100 * (y / 600.0))
        draw_photo.line([(0, y), (800, y)], fill=(r, g, b))
    draw_photo.ellipse([300, 100, 500, 300], fill=(240, 220, 120))
    draw_photo.rectangle([200, 400, 600, 600], fill=(70, 70, 80))
    photo.save(fixtures_dir / "real_camera_photo.jpg", "JPEG", quality=95)

    # 26. Combined Image with Visible Text, Visible URL, and QR Code
    combo = Image.new("RGB", (900, 600), color=(250, 252, 255))
    draw_combo = ImageDraw.Draw(combo)
    draw_combo.rectangle([0, 0, 900, 70], fill=(30, 58, 138))
    draw_combo.text((40, 25), "TRUONG DAI HOC BACH KHOA - THONG BAO CHINH THUC", fill=(255, 255, 255))
    draw_combo.text((40, 100), "Tuyen sinh chuong trinh lien ket quoc te nam hoc 2026-2027", fill=(15, 23, 42))
    draw_combo.text((40, 140), "Chi tiet chuong trinh dao tao tai cong thong tin: https://hcmut.edu.vn/admissions-2026", fill=(37, 99, 235))
    draw_combo.text((40, 180), "Thoi han dang ky den het ngay 30/10/2026. Sinh vien can nop ho so dung quy dinh.", fill=(51, 65, 85))
    combo_qr = make_qr("https://hcmut.edu.vn/admissions-2026", size=(240, 240))
    combo.paste(combo_qr, (600, 280))
    draw_combo.text((610, 540), "Quet de xem thong bao", fill=(100, 116, 139))
    combo.save(fixtures_dir / "combined_image_qr_text_url.png")

    # Standard numbered QR fixtures required by QA specification
    make_qr("https://example.com/").save(fixtures_dir / "01-https.png")
    make_qr("StudentHub Trust QR test").save(fixtures_dir / "02-text.png")
    make_qr("Thông báo học bổng sinh viên").save(fixtures_dir / "03-vietnamese-text.png")
    make_qr("http://example.com/scholarship").save(fixtures_dir / "04-http.png")
    img_std = make_qr("https://example.com/rotated-qr")
    img_std.rotate(90, expand=True).save(fixtures_dir / "05-rotated-90.png")
    img_std.rotate(180, expand=True).save(fixtures_dir / "06-rotated-180.png")
    img_std.rotate(270, expand=True).save(fixtures_dir / "07-rotated-270.png")
    ImageOps.invert(img_std).save(fixtures_dir / "08-inverted.png")
    img_std.resize((96, 96), Image.Resampling.NEAREST).resize((320, 320), Image.Resampling.NEAREST).save(fixtures_dir / "09-low-resolution.png")
    img_std.filter(ImageFilter.GaussianBlur(radius=1.8)).save(fixtures_dir / "10-blurred-but-readable.png")
    
    # 11-multi-qr.png
    multi_std = Image.new("RGB", (700, 340), color=(255, 255, 255))
    qr_s1 = make_qr("https://studenthub.vn/code-a", size=(300, 300))
    qr_s2 = make_qr("https://studenthub.vn/code-b", size=(300, 300))
    multi_std.paste(qr_s1, (20, 20))
    multi_std.paste(qr_s2, (380, 20))
    multi_std.save(fixtures_dir / "11-multi-qr.png")

    make_qr("http://127.0.0.1:3000").save(fixtures_dir / "12-localhost.png")
    make_qr("http://169.254.169.254/").save(fixtures_dir / "13-metadata.png")
    make_qr("http://192.168.1.1/").save(fixtures_dir / "14-private-ip.png")
    make_qr("javascript:alert(1)").save(fixtures_dir / "15-javascript.png")
    make_qr("data:text/html,<script>alert(1)</script>").save(fixtures_dir / "16-data.png")
    make_qr("file:///etc/passwd").save(fixtures_dir / "17-file.png")
    make_qr("https://user:password@example.com/").save(fixtures_dir / "18-credentials.png")
    make_qr("https://xn--e1afmkfd.xn--p1ai/").save(fixtures_dir / "19-punycode.png")

    with open(fixtures_dir / "20-malformed-image.png", "wb") as f:
        f.write(b"NOT_A_VALID_IMAGE_DATA_CORRUPT_0xDEADBEEF")

    # Image fixtures
    photo.save(fixtures_dir / "real-photo.jpg", "JPEG", quality=95)
    scam.save(fixtures_dir / "screenshot-text.png")
    pay.save(fixtures_dir / "suspicious-message.png")
    
    # ai-generated.png
    ai_gen = Image.new("RGB", (600, 400), color=(20, 30, 50))
    draw_ai = ImageDraw.Draw(ai_gen)
    draw_ai.text((50, 50), "Synthetic Student Verification Model 2026", fill=(100, 200, 255))
    draw_ai.rectangle([50, 100, 550, 350], outline=(100, 200, 255), width=2)
    ai_gen.save(fixtures_dir / "ai-generated.png")
    
    # recompressed.jpg
    ai_gen.save(fixtures_dir / "recompressed.jpg", "JPEG", quality=35)
    
    # no-metadata.jpg
    data = list(ai_gen.getdata())
    clean_img = Image.new(ai_gen.mode, ai_gen.size)
    clean_img.putdata(data)
    clean_img.save(fixtures_dir / "no-metadata.jpg", "JPEG", quality=85)

    # qr-containing-image.png
    combo.save(fixtures_dir / "qr-containing-image.png")

    print(f"Successfully generated {len(list(fixtures_dir.glob('*')))} fixtures!")

if __name__ == "__main__":
    generate_fixtures()
