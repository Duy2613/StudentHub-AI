# P27 External Blind QA Corpus Manifest

**QA Corpus Seed**: `20260919`
**Generated At**: `2026-09-18T18:15:00Z`

## 1. Corpus Summary Metrics

- **External Text Cases Total**: 12
- **External URL Cases Total**: 15
- **Real-World Image Cases**: 12
- **AI-Generated Image Cases**: 12
- **Transformed Image Cases**: 12
- **Screenshot Image Cases**: 12
- **Total Image Corpus**: 48
- **Defined QR Cases Total**: 44

## 2. Objectivity Guardrail

The Trust runtime does **NOT** receive expected verdicts, ground-truth labels, or test fixture categories.
All tests execute via standard browser intake and server-side analysis pathways.

## 3. QR Matrix Breakdown

| Case ID | Category | Content Type / Payload | Security Expected |
|---|---|---|---|
| `QR-01-HTTPS` | CONTENT_TYPE | https://hust.edu.vn/vi/tuyen-sinh | `SAFE` |
| `QR-02-HTTP` | CONTENT_TYPE | http://info.cern.ch/hypertext/WWW/The... | `SAFE` |
| `QR-03-PLAIN-TEXT` | CONTENT_TYPE | StudentHub AI Blind Review Case Verif... | `SAFE` |
| `QR-04-VN-UNICODE` | CONTENT_TYPE | Học bổng Tài năng Khoa học Công nghệ ... | `SAFE` |
| `QR-05-EN-TEXT` | CONTENT_TYPE | Official Notice: Fall 2026 Academic R... | `SAFE` |
| `QR-06-MIXED-UNICODE` | CONTENT_TYPE | Thông báo học bổng trao đổi SV / Glob... | `SAFE` |
| `QR-07-LONG-TEXT` | CONTENT_TYPE | Nghị định số 84/2020/NĐ-CP của Chính ... | `SAFE` |
| `QR-08-MAILTO` | CONTENT_TYPE | mailto:scholarships@vnu.edu.vn?subjec... | `SAFE` |
| `QR-09-TEL` | CONTENT_TYPE | tel:+842438692120 | `SAFE` |
| `QR-10-SMS` | CONTENT_TYPE | sms:+84988123456?body=CONFIRM_ENROLLM... | `SAFE` |
| `QR-11-GEO` | CONTENT_TYPE | geo:21.0049,105.8431;u=25 | `SAFE` |
| `QR-12-VCARD` | CONTENT_TYPE | BEGIN:VCARD
VERSION:3.0
N:Tran;Van B;... | `SAFE` |
| `QR-13-MECARD` | CONTENT_TYPE | MECARD:N:Le,Thi C;TEL:0903123456;EMAI... | `SAFE` |
| `QR-14-WIFI-DUMMY` | CONTENT_TYPE | WIFI:S:Campus-Guest-QA;T:WPA;P:DemoPa... | `SAFE` |
| `QR-15-CALENDAR` | CONTENT_TYPE | BEGIN:VEVENT
SUMMARY:Le khai giang na... | `SAFE` |
| `QR-16-DEEPLINK` | CONTENT_TYPE | studenthub://trust/verify?caseId=CASE... | `SAFE` |
| `QR-17-QUERY-URL` | CONTENT_TYPE | https://moet.gov.vn/tintuc?category=g... | `SAFE` |
| `QR-18-FRAGMENT-URL` | CONTENT_TYPE | https://vnexpress.net/giao-duc#muc-ho... | `SAFE` |
| `QR-19-PUNYCODE-URL` | CONTENT_TYPE | https://xn--bchkhoa-hwa.vn/thong-bao | `SAFE` |
| `QR-20-SHORTENER` | CONTENT_TYPE | https://tinyurl.com/studenthub-qa-2026 | `SAFE` |
| `QR-21-ROT-0` | VISUAL_VARIANT | https://moet.gov.vn/chuong-trinh-hoc-... | `SAFE` |
| `QR-22-ROT-90` | VISUAL_VARIANT | https://moet.gov.vn/chuong-trinh-hoc-... | `SAFE` |
| `QR-23-ROT-180` | VISUAL_VARIANT | https://moet.gov.vn/chuong-trinh-hoc-... | `SAFE` |
| `QR-24-ROT-270` | VISUAL_VARIANT | https://moet.gov.vn/chuong-trinh-hoc-... | `SAFE` |
| `QR-25-SMALL` | VISUAL_VARIANT | https://vnu.edu.vn/portal/scholarship | `SAFE` |
| `QR-26-LARGE` | VISUAL_VARIANT | https://vnu.edu.vn/portal/scholarship | `SAFE` |
| `QR-27-BLUR` | VISUAL_VARIANT | https://hust.edu.vn/thong-tin-sinh-vien | `SAFE` |
| `QR-28-JPEG-COMPRESSED` | VISUAL_VARIANT | https://hust.edu.vn/thong-tin-sinh-vien | `SAFE` |
| `QR-29-LOW-CONTRAST` | VISUAL_VARIANT | https://chinhphu.vn/van-ban-chi-dao | `SAFE` |
| `QR-30-INVERTED` | VISUAL_VARIANT | https://chinhphu.vn/van-ban-chi-dao | `SAFE` |
| `QR-31-COLORED` | VISUAL_VARIANT | https://tuoitre.vn/giao-duc.htm | `SAFE` |
| `QR-32-GRADIENT-LIGHT` | VISUAL_VARIANT | https://tuoitre.vn/giao-duc.htm | `SAFE` |
| `QR-33-SEC-LOCALHOST` | SECURITY | http://localhost:3000/api/admin/keys | `BLOCKED` |
| `QR-34-SEC-127` | SECURITY | http://127.0.0.1:8080/internal/system | `BLOCKED` |
| `QR-35-SEC-IPV6-LOOPBACK` | SECURITY | http://[::1]:3000/metrics | `BLOCKED` |
| `QR-36-SEC-RFC1918-10` | SECURITY | http://10.0.0.1/router/config | `BLOCKED` |
| `QR-37-SEC-RFC1918-192` | SECURITY | http://192.168.1.1/setup | `BLOCKED` |
| `QR-38-SEC-METADATA` | SECURITY | http://169.254.169.254/latest/meta-data/ | `BLOCKED` |
| `QR-39-SEC-JAVASCRIPT` | SECURITY | javascript:alert('XSS_ATTACK_VECTOR') | `BLOCKED` |
| `QR-40-SEC-CREDENTIALS` | SECURITY | https://admin:super_secret_token@phis... | `SUSPICIOUS` |
| `QR-41-MULTI-2SAFE` | MULTI_CODE | https://hust.edu.vn, https://vnu.edu.vn | `SAFE` |
| `QR-42-MULTI-SAFE-UNSAFE` | MULTI_CODE | https://moet.gov.vn, http://127.0.0.1... | `SAFE` |
| `QR-43-MULTI-3QR` | MULTI_CODE | https://hust.edu.vn, https://vnu.edu.... | `SAFE` |
| `QR-44-COMPOSITE-OCR-URL` | COMPOSITE | https://hust.edu.vn/xac-thuc | `SAFE` |

## 4. External Text Cases

| Case ID | Category | Claim | Expected Ref Truth | Source Origin |
|---|---|---|---|---|
| `TEXT-01-SCIENCE-FACT` | SCIENTIFIC_FACT | Tốc độ của ánh sáng trong chân không là chính... | `SUPPORTED` | NIST / BIPM Official Reference |
| `TEXT-02-FALSE-CLAIM` | FALSE_POPULAR_MYTH | Vạn Lý Trường Thành là công trình nhân tạo du... | `CONTRADICTED` | NASA Human Spaceflight FAQ |
| `TEXT-03-MISLEADING-CLAIM` | MISLEADING_HEALTH | Uống nước chanh ấm vào buổi sáng có khả năng ... | `CONTRADICTED` | American Institute for Cancer Research |
| `TEXT-04-TEMPORAL-FACT` | GOVERNMENT_DATA | Tính đến năm 2026, Việt Nam có 63 đơn vị hành... | `SUPPORTED` | Cổng Thông tin Điện tử Chính phủ |
| `TEXT-05-AMBIGUOUS-TECH` | AMBIGUOUS_PREDICTION | Trí tuệ nhân tạo sẽ thay thế 100% lập trình v... | `INSUFFICIENT_EVIDENCE` | ACM / IEEE Spectrum Report |
| `TEXT-06-SCHOLARSHIP-OFFICIAL` | STUDENT_SCHOLARSHIP | Đại học Quốc gia Hà Nội công bố chương trình ... | `SUPPORTED` | ĐHQGHN Portal Đào tạo |
| `TEXT-07-JOB-SCAM-TEXT` | STUDENT_RECRUITMENT_SCAM | Tuyển sinh viên làm nhiệm vụ gõ capcha nhận 5... | `CONTRADICTED` | Bộ Công an Cảnh báo Lừa đảo Trực tuyến |
| `TEXT-08-PHISHING-CREDENTIAL` | CREDENTIAL_THEFT | Cảnh báo khẩn cấp từ phòng Công tác sinh viên... | `CONTRADICTED` | Trung tâm Ứng cứu Khẩn cấp Không gian mạng VNCERT |
| `TEXT-09-EN-SCIENTIFIC` | SCIENTIFIC_FACT | The James Webb Space Telescope operates at th... | `SUPPORTED` | NASA JWST Orbit Mission Profile |
| `TEXT-10-EN-FALSE-CLAIM` | FALSE_BIOLOGY_MYTH | Human blood turns blue inside the veins befor... | `CONTRADICTED` | Library of Congress Everyday Mysteries |
| `TEXT-11-MIXED-LANG` | STUDENT_INTERNATIONAL_PROGRAM | Sinh viên HUST nộp đơn tham gia Google Summer... | `SUPPORTED` | Google Summer of Code Official Guide |
| `TEXT-12-BENIGN-NOTICE` | ORDINARY_BENIGN | Thời khóa biểu các lớp học trực tiếp tại giản... | `SUPPORTED` | Thông báo nội bộ đào tạo |
