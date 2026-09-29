# KẾ HOẠCH QUẢN TRỊ TÀI NGUYÊN & DANH MỤC ASSETS (DESIGN OPS & RESOURCE SCOUT)
## DỰ ÁN: NỀN TẢNG THƯƠNG MẠI ĐIỆN TỬ TÀI KHOẢN AI PRO CHO DEVELOPERS
*Mã tài liệu: `OPS-ASSET-AIPRO-2026` | Phiên bản: `1.0.0`*  
*Vai trò: UI Designer, DesignOps Manager & Design Resource Scout*  
*Dựa trên hệ thống 5 màn hình cốt lõi từ `UI_UX_Specification_AI_PRO.md`*

---

## PHẦN 1: QUY CHUẨN XUẤT FILE & CẤU TRÚC THƯ MỤC (EXPORT GUIDELINES)

### 1.1. Tiêu chuẩn lựa chọn định dạng tệp (Format Decision Matrix)
| Định dạng | Khi nào sử dụng? | Ưu điểm & Yêu cầu kỹ thuật |
| :--- | :--- | :--- |
| **SVG (Vector)** | **100% Icons hệ thống, Brand Logos (OpenAI, Anthropic, Cursor...), Biểu đồ vector.** | - Không vỡ nét ở mọi độ phân giải màn hình Retina/4K.<br>- Dung lượng siêu nhẹ (< 5KB/file).<br>- **Bắt buộc**: Outline stroke (chuyển viền thành shape), bỏ text (convert to path), chạy qua công cụ nén **SVGO** để loại bỏ metadata rác của Figma/Illustrator. |
| **PNG (24-bit Transparent)** | Ảnh minh họa phức tạp có đổ bóng trong suốt (Alpha Channel), Badge huy hiệu 3D, Mã QR dự phòng. | - Giữ độ trong suốt tuyệt đối trên nền tối `#08090C`.<br>- Xuất đủ 3 phiên bản: `@1x` (base), `@2x` (Retina), `@3x` (Mobile High-density). |
| **WebP (Lossy / Lossless)** | Banner Hero, Ảnh thumbnail sản phẩm, Ảnh chụp bàn làm việc Developer. | - Nhẹ hơn JPG từ 30-40% nhưng giữ chất lượng tương đương.<br>- Hỗ trợ tải nhanh dưới 1.0 giây theo khuyến nghị Google Core Web Vitals. |

### 1.2. Quy chuẩn đặt tên tệp (Naming Convention)
- Toàn bộ dùng chữ thường (`lowercase`), ngăn cách bằng dấu gạch dưới (`_`). Tuyệt đối không dùng dấu cách, ký tự đặc biệt hoặc chữ hoa.
- **Biểu tượng (Icons)**: `ic_[tên_phần_tử]_[trạng_thái/biến_thể].svg`  
  *Ví dụ: `ic_copy_default.svg`, `ic_copy_success.svg`, `ic_cart_active.svg`*
- **Logo thương hiệu**: `logo_[tên_brand]_[dark/light/mono].svg`  
  *Ví dụ: `logo_cursor_dark.svg`, `logo_claude_mono.svg`, `logo_vietqr_color.svg`*
- **Hình ảnh & Minh họa**: `img_[tên_nội_dung]_[kích_thước/viewport].[ext]`  
  *Ví dụ: `img_empty_state_desktop.webp`, `img_hero_glow_bg.png`*

---

## PHẦN 2: BẢNG DANH MỤC ASSETS CHI TIẾT (ASSET TRACKING TABLE)

### A. HỆ THỐNG LOGO THƯƠNG HIỆU & ĐỐI TÁC (BRAND LOGOS)
| ID | Tên File Quy Chuẩn | Format | Vị trí xuất hiện (Location) | Ghi chú kỹ thuật & Độ phân giải |
| :--- | :--- | :--- | :--- | :--- |
| **AST_L01** | `logo_aipro_main_dark.svg` | SVG | Header Trang 1, 2, 3, 4, 5 | Vector gốc, Text convert to path, size `140x32px`. |
| **AST_L02** | `logo_aipro_favicon.svg` | SVG | Browser Favicon / Tab Icon | Tối giản, hình vuông `32x32px`, padding 4px. |
| **AST_L03** | `logo_brand_cursor.svg` | SVG | Card Trang 1, Chi tiết Trang 2 | Logo chính thức Cursor AI, vector chuẩn `40x40px`. |
| **AST_L04** | `logo_brand_anthropic_claude.svg` | SVG | Card Claude Pro Trang 1, 2 | Logo ngôi sao hoa tuyết của Claude, vector `40x40px`. |
| **AST_L05** | `logo_brand_openai_chatgpt.svg` | SVG | Card ChatGPT Plus Trang 1, 2 | Logo vòng xoáy OpenAI, vector `40x40px`. |
| **AST_L06** | `logo_brand_github_copilot.svg` | SVG | Card Copilot Trang 1, 2 | Logo GitHub Octocat + Copilot, vector `40x40px`. |
| **AST_L07** | `logo_brand_midjourney.svg` | SVG | Card Midjourney Trang 1 | Logo con thuyền Midjourney, vector `40x40px`. |
| **AST_L08** | `logo_brand_jetbrains.svg` | SVG | Card JetBrains AI Trang 1 | Logo khối vuông JetBrains, vector `40x40px`. |
| **AST_L09** | `logo_pay_vietqr.svg` | SVG | Checkout Tabs Trang 3 | Logo VietQR chuẩn nhận diện quốc gia, vector `60x24px`. |
| **AST_L10** | `logo_pay_stripe.svg` | SVG | Checkout Tabs Trang 3 | Logo Stripe trắng/tím, vector `50x20px`. |
| **AST_L11** | `logo_pay_applepay.svg` | SVG | Checkout Tabs Trang 3 | Logo Apple Pay đơn sắc trắng, vector `44x20px`. |
| **AST_L12** | `logo_pay_usdt_crypto.svg` | SVG | Checkout Tabs Trang 3 | Logo Tether USDT xanh lục, vector `24x24px`. |

---

### B. HỆ THỐNG BIỂU TƯỢNG HỆ THỐNG (UI ICONS)
| ID | Tên File Quy Chuẩn | Format | Vị trí xuất hiện (Location) | Ghi chú kỹ thuật |
| :--- | :--- | :--- | :--- | :--- |
| **AST_I01** | `ic_terminal_prompt.svg` | SVG | Header Logo & Hero CLI Widget | Icon `>_`, stroke-width 2px, màu `#00F0FF`. |
| **AST_I02** | `ic_lightning_bolt.svg` | SVG | Nút Mua 30s & Badge Delivery | Icon tia chớp, fill `#00F0FF`, size `16x16px`. |
| **AST_I03** | `ic_shield_check.svg` | SVG | Badge Bảo Hành 1-đổi-1 (Trang 1, 2, 3) | Icon khiên bảo vệ, stroke `#10B981`, size `20x20px`. |
| **AST_I04** | `ic_check_circle.svg` | SVG | Feature List trong Card & Trang 4 | Icon tròn tích xanh thành công, size `16x16px`. |
| **AST_I05** | `ic_copy_default.svg` | SVG | Nút sao chép (Trang 3, 4, 5) | Icon 2 trang giấy chồng, stroke `#9CA3AF`. |
| **AST_I06** | `ic_copy_success.svg` | SVG | Nút sao chép khi active (Trang 3, 4) | Icon tích xanh `✓`, fill `#10B981`. |
| **AST_I07** | `ic_eye_show.svg` | SVG | Trường Password Vault (Trang 4, 5) | Icon con mắt mở, stroke `#9CA3AF`. |
| **AST_I08** | `ic_eye_hide.svg` | SVG | Trường Password Vault (Trang 4, 5) | Icon con mắt gạch chéo, stroke `#9CA3AF`. |
| **AST_I09** | `ic_download_file.svg` | SVG | Nút tải `.env` / `.json` (Trang 4) | Icon mũi tên tải xuống khay, size `18x18px`. |
| **AST_I10** | `ic_clock_countdown.svg` | SVG | Bộ đếm giờ giữ slot (Trang 3) | Icon đồng hồ cát hoặc đồng hồ tròn, stroke `#F59E0B`. |
| **AST_I11** | `ic_refresh_auto.svg` | SVG | Nút Bảo Hành 1-Click (Trang 5) | Icon mũi tên xoay tròn lặp lại, stroke `#0066FF`. |
| **AST_I12** | `ic_lock_ssl.svg` | SVG | Header Trang 3 (Checkout Security) | Icon ổ khóa đóng, stroke `#10B981`. |
| **AST_I13** | `ic_telegram_support.svg` | SVG | Footer & Hỗ trợ kỹ thuật 24/7 | Icon máy bay giấy Telegram, fill `#229ED9`. |
| **AST_I14** | `ic_arrow_right.svg` | SVG | Nút chuyển hướng & Accordion | Icon mũi tên sang phải, stroke-width 2px. |

---

### C. HỆ THỐNG HÌNH ẢNH CỐ ĐỊNH & MINH HỌA (STATIC IMAGES & ILLUSTRATIONS)
| ID | Tên File Quy Chuẩn | Format | Vị trí xuất hiện (Location) | Ghi chú kỹ thuật |
| :--- | :--- | :--- | :--- | :--- |
| **AST_M01** | `img_hero_glow_radial.png` | PNG | Nền sau Hero Section (Trang 1) | Gradient hình cầu màu xanh điện quang (#0066FF) mờ ảo, nền trong suốt, `1200x600px`, nén TinyPNG. |
| **AST_M02** | `img_empty_catalog.svg` | SVG | Empty State tìm kiếm (Trang 1) | Minh họa Terminal rỗng không có kết quả, phong cách Dark Minimalist. |
| **AST_M03** | `img_success_confetti.png` | PNG | Banner bàn giao tức thì (Trang 4) | Hạt pháo hoa công nghệ neon xanh - lục, trong suốt, `@2x` cho Retina. |
| **AST_M04** | `img_qr_placeholder.png` | PNG | Skeleton Loading mã VietQR (Trang 3) | Khung xám giả lập mã QR khi đang tạo đơn, `220x220px`. |
| **AST_M05** | `img_guide_cursor_invite.webp`| WebP| Hướng dẫn chấp nhận invite (Trang 4)| Ảnh GIF/WebP động 10s hướng dẫn bấm "Accept Invitation" từ hòm thư. |
| **AST_M06** | `img_error_network_offline.svg`| SVG | Toaster & Modal Offline mất mạng | Icon vệ tinh mất sóng hoặc dây cáp đứt, tông màu `#EF4444`. |
| **AST_M07** | `img_developer_avatar_social.webp`| WebP| Social Proof Testimonials (Trang 1)| 5 ảnh avatar developer phong cách GitHub/Dev thật, kích thước `48x48px` tròn. |

---

## PHẦN 3: TỔNG HỢP NGUỒN TÀI NGUYÊN MIỄN PHÍ DÙNG THƯƠNG MẠI (DESIGN RESOURCE SCOUT)

Dành cho dự án công nghệ / AI / Developer với phong cách **Tối giản, Dark Mode, Hiện đại (Tech Sleek)**:

### 3.1. HỆ THỐNG BIỂU TƯỢNG (ICONS & BRAND LOGOS VECTOR)
1. **Simple Icons (Kho Logo Công Nghệ & AI Số 1 Toàn Cầu)**
   - *Mô tả*: Cung cấp hơn 3.000+ logo chuẩn vector SVG của tất cả các hãng công nghệ, model AI (OpenAI, Anthropic, Cursor, GitHub, Google, JetBrains, Hugging Face, Telegram...).
   - *Bản quyền*: CC0 / Open-source (Miễn phí thương mại 100%).
   - *Link truy cập tải trực tiếp*: [https://simpleicons.org/](https://simpleicons.org/)
2. **Lucide Icons (Chuẩn Icon Giao Diện Tối Giản Cho Tech SaaS)**
   - *Mô tả*: Bộ icon chuẩn được Vercel, Supabase, shadcn/ui sử dụng; nét mảnh 2px, sắc sảo, tối giản, tối ưu hoàn hảo cho Dark Mode.
   - *Bản quyền*: ISC License (Tự do dùng thương mại không điều kiện).
   - *Link trang download*: [https://lucide.dev/icons/](https://lucide.dev/icons/)
3. **Tabler Icons (Hơn 5.200+ Vector Icons Sạch Sẽ)**
   - *Mô tả*: Rất mạnh về các icon thanh toán, thẻ tín dụng, ổ khóa bảo mật, terminal và server.
   - *Bản quyền*: MIT License.
   - *Link trang download*: [https://tabler.io/icons](https://tabler.io/icons)

---

### 3.2. HỆ THỐNG HÌNH ẢNH MINH HỌA (ILLUSTRATIONS CHO DARK MODE & DEV)
1. **Storyset by Freepik (Chủ đề Tech & Developer)**
   - *Mô tả*: Cho phép tùy chỉnh màu chủ đạo (nhập mã `#0066FF` hoặc `#00F0FF`) trực tiếp trên web trước khi tải về; có thể tắt/bật các layer để tạo phong cách tối giản; xuất định dạng SVG/PNG.
   - *Bản quyền*: Miễn phí sử dụng cá nhân và thương mại (Kèm ghi công tác giả hoặc dùng bản quyền mở).
   - *Link chủ đề Công nghệ*: [https://storyset.com/technology](https://storyset.com/technology)
2. **unDraw (Open-source Illustrations by Katerina Limpitsouni)**
   - *Mô tả*: Phong cách minh họa phẳng không gian phẳng (Flat minimalist); có công cụ chọn màu thương hiệu tức thì; chuyên các hình 404, Empty state, Setup success.
   - *Bản quyền*: MIT-equivalent (Hoàn toàn miễn phí thương mại, không cần ghi công).
   - *Link trang download*: [https://undraw.co/illustrations](https://undraw.co/illustrations)
3. **ManyPixels Open-source Illustrations**
   - *Mô tả*: Bộ ảnh chất lượng cao dạng Monochromatic (đơn sắc) hoặc Outline cực kỳ ăn khớp với giao diện nền tối của Lập trình viên.
   - *Bản quyền*: Free for commercial & personal projects.
   - *Link trang download*: [https://www.manypixels.co/gallery](https://www.manypixels.co/gallery)

---

### 3.3. HỆ THỐNG HÌNH ẢNH STOCK CHỤP THỰC TẾ (DARK TECH WORKSPACE & CODING)
1. **Unsplash - Developer & Cyberpunk Aesthetic Collection**
   - *Mô tả*: Kho ảnh chụp màn hình IDE (Visual Studio Code, Terminal), bàn làm việc đa màn hình công nghệ cao trong phòng tối (Dark setup, RGB ambient).
   - *Bản quyền*: Unsplash Free Commercial License.
   - *Link tìm kiếm trực tiếp*: [https://unsplash.com/s/photos/developer-workspace-dark](https://unsplash.com/s/photos/developer-workspace-dark)
2. **Pexels - AI & Futuristic Coding Photography**
   - *Mô tả*: Các hình ảnh về lập trình, máy chủ, server farm, vi mạch AI phù hợp làm hình minh họa nền mờ ảo (Blur background effect).
   - *Bản quyền*: Pexels License (Miễn phí thương mại 100%, không cần ghi công).
   - *Link trang download*: [https://www.pexels.com/search/coding/](https://www.pexels.com/search/coding/)
