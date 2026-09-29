# TÀI LIỆU HƯỚNG DẪN SỬ DỤNG THƯ MỤC TÀI NGUYÊN (ASSET REPOSITORY)
## THƯ MỤC GỐC: `/assets`

Thư mục này chứa toàn bộ tài nguyên đồ họa đã được chuẩn hóa, nén tối ưu và đặt tên theo đúng tài liệu DesignOps `DesignOps_Asset_Checklist_AI_PRO.md`.

---

### 1. Cấu trúc thư mục:
```text
assets/
├── logos/          # Logo nhận diện thương hiệu & Logo cổng thanh toán (SVG)
├── icons/          # Biểu tượng chức năng hệ thống (SVG)
└── images/         # Hình nền, Empty states, Illustration & Avatar khách hàng (SVG, WebP)
```

---

### 2. Danh mục chi tiết các tệp:

#### A. `/assets/logos` (14 Brand & Payment SVG Logos)
- `logo_aipro_main_dark.svg`: Logo chính của trang web (Terminal `>_` Cyan/Blue + AIPro.dev).
- `logo_aipro_favicon.svg`: Icon 32x32px cho tab trình duyệt.
- `logo_brand_openai_chatgpt.svg`: Logo vector chính hãng OpenAI ChatGPT.
- `logo_brand_anthropic_claude.svg`: Logo vector chính hãng Anthropic Claude.
- `logo_brand_cursor.svg`: Logo vector chính hãng Cursor AI.
- `logo_brand_github_copilot.svg`: Logo vector chính hãng GitHub Copilot.
- `logo_brand_jetbrains.svg`: Logo vector chính hãng JetBrains AI.
- `logo_brand_google_gemini.svg`: Logo vector chính hãng Google Gemini.
- `logo_brand_midjourney.svg`: Logo vector con thuyền Midjourney.
- `logo_pay_vietqr.svg`: Logo nhận diện VietQR chuyển khoản ngân hàng.
- `logo_pay_stripe.svg`: Logo thanh toán Stripe thẻ quốc tế.
- `logo_pay_applepay.svg`: Logo Apple Pay.
- `logo_pay_visa.svg` & `logo_pay_mastercard.svg`: Logo thẻ Visa & Mastercard.
- `logo_pay_usdt_crypto.svg`: Logo Tether USDT cho thanh toán Crypto.

#### B. `/assets/icons` (18 UI System SVG Icons)
- `ic_terminal_prompt.svg`: Icon dòng lệnh `>_`.
- `ic_lightning_bolt.svg`: Icon tia chớp cho nút Mua Siêu Tốc 30s.
- `ic_shield_check.svg`: Icon khiên bảo vệ cho cam kết bảo hành 1-đổi-1.
- `ic_check_circle.svg`: Icon tích xanh cho danh sách tính năng.
- `ic_copy_default.svg` & `ic_copy_success.svg`: Icon sao chép STK/Mật khẩu và trạng thái đã chép `✓`.
- `ic_eye_show.svg` & `ic_eye_hide.svg`: Icon ẩn/hiện mật khẩu Vault.
- `ic_download_file.svg`: Icon tải file cấu hình `.env` / `.json`.
- `ic_clock_countdown.svg`: Icon đồng hồ đếm ngược giữ slot 10 phút.
- `ic_refresh_auto.svg`: Icon đổi mới tài khoản tự động 1-click.
- `ic_lock_ssl.svg`: Icon ổ khóa bảo mật 256-bit SSL.
- `ic_telegram_support.svg`: Icon hỗ trợ kỹ thuật Telegram 24/7.
- `ic_search.svg`, `ic_arrow_right.svg`, `ic_help_circle.svg`, `ic_alert_triangle.svg`, `ic_external_link.svg`.

#### C. `/assets/images` (Minh họa & Avatars)
- `img_hero_glow_radial.svg`: Quầng sáng Cyber Blue nền Hero Section.
- `img_empty_catalog.svg`: Minh họa Terminal rỗng khi tìm kiếm không có kết quả.
- `img_error_offline.svg`: Minh họa mất kết nối mạng.
- `img_qr_placeholder.svg`: Khung mã VietQR giữ chỗ khi đang tạo đơn.
- `img_dev_avatar_1.webp` -> `img_dev_avatar_5.webp`: 5 ảnh đại diện chân dung Developer thật từ Unsplash cho khu vực đánh giá uy tín (Social proof).

---

### 3. Cách sử dụng trong code HTML/CSS/React:

```html
<!-- Chèn Logo -->
<img src="./assets/logos/logo_aipro_main_dark.svg" alt="AIPro Logo" height="32" />

<!-- Chèn Icon -->
<img src="./assets/icons/ic_lightning_bolt.svg" alt="Instant Buy" width="16" height="16" />

<!-- Chèn Avatar -->
<img src="./assets/images/img_dev_avatar_1.webp" alt="Developer Avatar" class="avatar-round" />
```
