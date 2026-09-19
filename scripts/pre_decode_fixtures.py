import os
import sys
import cv2
import numpy as np
from pathlib import Path

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

FIXTURES_DIR = Path("fixtures/trust-multimodal")

expected_map = {
    "01-https.png": "https://example.com/",
    "02-text.png": "StudentHub Trust QR test",
    "03-vietnamese-text.png": "Thông báo học bổng sinh viên",
    "04-http.png": "http://example.com/scholarship",
    "05-rotated-90.png": "https://example.com/rotated-qr",
    "06-rotated-180.png": "https://example.com/rotated-qr",
    "07-rotated-270.png": "https://example.com/rotated-qr",
    "08-inverted.png": "https://example.com/rotated-qr",
    "09-low-resolution.png": "https://example.com/rotated-qr",
    "10-blurred-but-readable.png": "https://example.com/rotated-qr",
    "11-multi-qr.png": "https://studenthub.vn/code-a | https://studenthub.vn/code-b",
    "12-localhost.png": "http://127.0.0.1:3000",
    "13-metadata.png": "http://169.254.169.254/",
    "14-private-ip.png": "http://192.168.1.1/",
    "15-javascript.png": "javascript:alert(1)",
    "16-data.png": "data:text/html,<script>alert(1)</script>",
    "17-file.png": "file:///etc/passwd",
    "18-credentials.png": "https://user:password@example.com/",
    "19-punycode.png": "https://xn--e1afmkfd.xn--p1ai/",
    "20-malformed-image.png": "CORRUPTED",
}

def decode_image(img):
    detector = cv2.QRCodeDetector()
    val, points, _ = detector.detectAndDecode(img)
    if val:
        return [val]
    # Try inverted
    inv = cv2.bitwise_not(img)
    val, points, _ = detector.detectAndDecode(inv)
    if val:
        return [val]
    # Try sub-regions (multi QR)
    h, w = img.shape[:2]
    half_w = w // 2
    left = img[:, :half_w]
    right = img[:, half_w:]
    val_l, _, _ = detector.detectAndDecode(left)
    val_r, _, _ = detector.detectAndDecode(right)
    res = []
    if val_l: res.append(val_l)
    if val_r: res.append(val_r)
    if res:
        return res
    return []

def main():
    print("========================================================")
    print("INDEPENDENT PRE-DECODE VERIFICATION REPORT")
    print("========================================================")
    pass_count = 0
    total_count = len(expected_map)

    for filename, expected in expected_map.items():
        filepath = FIXTURES_DIR / filename
        if not filepath.exists():
            print(f"❌ {filename:<25} | FILE NOT FOUND")
            continue

        if filename == "20-malformed-image.png":
            img = cv2.imread(str(filepath))
            if img is None:
                print(f"✔ {filename:<25} | Expected: CORRUPTED | Decoded: [UNREADABLE_IMAGE] | PRE_DECODE = PASS")
                pass_count += 1
            else:
                print(f"❌ {filename:<25} | Expected: CORRUPTED | Decoded: READABLE | PRE_DECODE = FAIL")
            continue

        img = cv2.imread(str(filepath))
        if img is None:
            print(f"❌ {filename:<25} | FAILED TO LOAD IMAGE")
            continue

        decoded_list = decode_image(img)
        decoded_str = " | ".join(decoded_list) if decoded_list else ""

        if filename == "11-multi-qr.png":
            is_pass = len(decoded_list) >= 2
        else:
            is_pass = decoded_str == expected

        status = "PASS" if is_pass else "FAIL"
        icon = "[PASS]" if is_pass else "[FAIL]"
        print(f"{icon:<6} {filename:<25} | Expected: {expected:<40} | Decoded: {decoded_str:<40} | PRE_DECODE = {status}")
        if is_pass:
            pass_count += 1

    print("========================================================")
    print(f"SUMMARY: {pass_count}/{total_count} FIXTURES INDEPENDENTLY VERIFIED")
    if pass_count == total_count:
        print("QR_FIXTURE_PRE_DECODE = PASS (100% PRE-VALIDATED)")
    print("========================================================")

if __name__ == "__main__":
    main()
