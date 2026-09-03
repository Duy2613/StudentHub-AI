# 🌐 StudentHub AI — Recalibrated Research Coverage & Source Reality Report

> **Document ID**: `RES-COV-002` | **Audit Version**: 2.0.0 | **Audit Date**: 2026-08-25 | **Zero-Fabrication Standard**

---

## 1. Bảng Khảo Sát Tái Thẩm Định Độ Bao Phủ Nguồn Dữ Liệu (Recalibrated Source Reality Table)

| Domain (Lĩnh Vực) | Source (Nguồn Thực Tế) | Type (Phân Tầng) | Access (Phương Thức) | Public / Authorized | Freshness | Reality Status | Confidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **HCMUTE University OS** | `online.hcmute.edu.vn` | `TIER_A_OFFICIAL` | Web Portal (Session Cookie) | Authorized Student | `STALE_WITHOUT_AUTH` | `AUTH_REQUIRED` | **0.65** |
| **Academic Affairs (PĐT)** | `daotao.hcmute.edu.vn` | `TIER_A_OFFICIAL` | Web / Email / Tel | Public | `PERIODIC_MANUAL` | `ACCESSIBLE` | **0.75** |
| **Student Affairs (CTSV)** | `ctsv.hcmute.edu.vn` | `TIER_A_OFFICIAL` | Web / Public Notices | Public | `PERIODIC_MANUAL` | `ACCESSIBLE` | **0.72** |
| **Course & Faculty Structure** | `fit.hcmute.edu.vn` | `TIER_A_OFFICIAL` | In-Memory Static KG | Public | `STATIC_CURATED` | `READABLE_STATIC_REGISTRY` | **0.90** |
| **Tuition Banking Portals** | BIDV / VietinBank Gateways | `TIER_A_OFFICIAL` | Listed Institution / Text Guide | Public | `STATIC_VERIFIED` | `NOT_INTEGRATED` | **0.60** |
| **Housing Legal Framework** | Bộ luật Dân sự 2015 (Điều 472-482) | `TIER_A_OFFICIAL` | Legal Statute Text | Public | `ACTIVE_ENFORCED` | `READABLE_STATIC_REGISTRY` | **0.95** |
| **Labor Legal Framework** | Bộ luật Lao động 2019 (Điều 20) | `TIER_A_OFFICIAL` | Legal Statute Text | Public | `ACTIVE_ENFORCED` | `READABLE_STATIC_REGISTRY` | **0.95** |
| **Electricity Price Standards** | Thông tư 09/2023/TT-BCT | `TIER_A_OFFICIAL` | Circular Regulation | Public | `ACTIVE_ENFORCED` | `READABLE_STATIC_REGISTRY` | **0.95** |
| **Geospatial Safety Nodes** | Công An P. Linh Chiểu (`028.38966882`)| `TIER_A_OFFICIAL` | Centroid GPS / Hotline | Public | `STATIC_VERIFIED` | `READABLE_STATIC_REGISTRY` | **0.90** |
| **Google Maps Platform** | Google Maps Routing | `TIER_B_SECONDARY` | Web Deep-Link (`maps.google.com`) | Public | `CLIENT_SIDE_LIVE` | `MAP_URL_DEEPLINK_AVAILABLE` | **0.70** |
| **National Emergency Hotlines** | Đầu số 112, 113, 114, 115 | `TIER_A_OFFICIAL` | Client-side `tel:` trigger | Public | `ALWAYS_AVAILABLE` | `CALL_ACTION_AVAILABLE` | **0.85** |
| **Cyber Threat Intelligence** | NCSC (`tinnhiemmang.vn`) | `TIER_A_OFFICIAL` | In-Memory Curated Array | Public | `MANUAL_UPDATE` | `READABLE_MANUAL_REGISTRY` | **0.70** |
| **Student Community Q&A** | UTE Thắc Mắc Học Tập (FB Group)| `TIER_C_COMMUNITY` | Public Web Group | Public | `UNSYNCHRONIZED` | `DISCOVERED / ACCESS_LIMITED` | **0.40** |
| **Private Social Groups** | Tin nhắn riêng tư / Group kín | `TIER_D_UNVERIFIED`| Private | **PROHIBITED** | N/A | `ACCESS_LIMITED` | **0.00** |
| **Live CCTV Traffic Cameras** | Camera Giao Thông TP.HCM | `TIER_A_OFFICIAL` | Web Snapshot | Public | `EXTERNAL_REFRESH` | `PUBLIC_VISIBLE / PROG_UNCONF` | **0.50** |
| **Weather Radar & Satellites** | Radar Nhà Bè (`nchmf.gov.vn`) | `TIER_A_OFFICIAL` | Web Portal Image | Public | `MANUAL_FETCH` | `DISCOVERED / VISUAL_PORTAL` | **0.55** |

---

## 2. Thống Kê Tổng Hợp Độ Bao Phủ Sau Kiểm Toán (Recalculated Coverage Metrics)

* **Tổng nguồn đã khảo sát**: $16$ nguồn.
* **Nguồn có thể truy cập / Khám phá công khai**: $14$ nguồn ($87.5\%$).
* **Nguồn đã tích hợp mô hình hóa dữ liệu (Static KG / Fixture)**: $6$ nguồn ($37.5\%$).
* **Nguồn có thể kích hoạt qua Client-side action (Deep-link / Tel)**: $2$ nguồn ($12.5\%$).
* **Nguồn yêu cầu xác thực hoặc giới hạn truy cập (Auth Required / Access Limited)**: $3$ nguồn ($18.75\%$).
* **Nguồn có Live Backend Network API Stream**: **0 nguồn** (Hệ thống hiện chạy trên cơ chế client-side deep links, static knowledge graphs và deterministic rule engines).
