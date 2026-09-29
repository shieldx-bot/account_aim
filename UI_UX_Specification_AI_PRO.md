# TÀI LIỆU ĐẶC TẢ THIẾT KẾ GIAO DIỆN & TRẢI NGHIỆM NGƯỜI DÙNG (UI/UX SPECIFICATION DOCUMENT)
## DỰ ÁN: NỀN TẢNG THƯƠNG MẠI ĐIỆN TỬ TÀI KHOẢN AI PRO CHUYÊN BIỆT CHO DEVELOPERS
*Mã tài liệu: SPEC-UIUX-AIPRO-2026*  
*Phiên bản: 1.0.0 (Release Candidate)*  
*Chịu trách nhiệm: Lead UI/UX Designer & Senior Business Analyst*  
*Áp dụng nghiên cứu: Chiến lược UX/UI Tối giản Giảm Ma Sát Số & Tối Ưu Tỷ Lệ Chuyển Đổi Toàn Cầu*

---

## MỤC LỤC
1. [TỔNG QUAN DỰ ÁN & DESIGN SYSTEM CỐT LÕI](#1-tổng-quan-dự-án--design-system-cốt-lõi)
   - 1.1. Mục tiêu kinh doanh & Chân dung người dùng (User Persona)
   - 1.2. Design System Tokens (Color Palette, Typography, Spacing, Elevation, Breakpoints)
   - 1.3. Nguyên tắc thiết kế: "Máy bơm xăng tốc độ cao" (High-speed Fuel Pump Flow)
2. [ĐẶC TẢ CHI TIẾT TỪNG TRANG (PAGE-BY-PAGE SPECIFICATIONS)](#2-đặc-tả-chi-tiết-từng-trang)
   - [TRANG 1: Trang Chủ & Danh Mục Chuyển Đổi Nhanh (Landing & Fast Catalog Page)](#trang-1-trang-chủ--danh-mục-chuyển-đổi-nhanh-landing--fast-catalog-page)
   - [TRANG 2: Trang Chi Tiết & Tùy Biến Gói Dịch Vụ (Product Configuration Page / Modal)](#trang-2-trang-chi-tiết--tùy-biến-gói-dịch-vụ-product-configuration-page--modal)
   - [TRANG 3: Trang Thanh Toán Siêu Tốc (Ultra-Fast Guest Checkout Page)](#trang-3-trang-thanh-toán-siêu-tốc-ultra-fast-guest-checkout-page)
   - [TRANG 4: Trang Bàn Giao Tức Thì & Quản Lý License (Instant Delivery & Fulfillment Page)](#trang-4-trang-bàn-giao-tức-thì--quản-lý-license-instant-delivery--fulfillment-page)
   - [TRANG 5: Trang Tra Cứu Đơn Hàng & Tự Phục Vụ Bảo Hành (Self-Service Warranty & Order Lookup Page)](#trang-5-trang-tra-cứu-đơn-hàng--tự-phục-vụ-bảo-hành-self-service-warranty--order-lookup-page)
3. [QUY CHUẨN TỐI ƯU HÓA THIẾT BỊ DI ĐỘNG (MOBILE OPTIMIZATION & THUMB ZONE)](#3-quy-chuẩn-tối-ưu-hóa-thiết-bị-di-động)
4. [KỊCH BẢN XỬ LÝ LỖI TOÀN HỆ THỐNG & TRẠNG THÁI BIÊN (GLOBAL SYSTEM EDGE CASES)](#4-kịch-bản-xử-lý-lỗi-toàn-hệ-thống--trạng-thái-biên)

---

## 1. TỔNG QUAN DỰ ÁN & DESIGN SYSTEM CỐT LÕI

### 1.1. Mục tiêu kinh doanh & Chân dung người dùng (User Persona)
- **Tầm nhìn sản phẩm**: Cung cấp nền tảng phân phối tự động tài khoản AI cao cấp (ChatGPT Plus/Team, Claude Pro/Team, GitHub Copilot, Cursor Pro, Midjourney, Perplexity Pro, JetBrains AI...) với SLA bàn giao dưới 30 giây, loại bỏ hoàn toàn ma sát mua hàng và quy trình đăng ký phức tạp.
- **Đối tượng mục tiêu (Primary Persona - Alex "The 10x Engineer")**:
  - *Đặc điểm*: Kỹ sư phần mềm, AI researcher, DevOps, sinh viên CNTT; am hiểu công nghệ, cực kỳ ghét giao diện rườm rà, quảng cáo pop-up, quy trình tạo tài khoản nhiều bước hoặc bắt xác minh KYC không cần thiết.
  - *Kỳ vọng chính*: Tốc độ tải trang < 1.5s, giá minh bạch tuyệt đối (No Hidden Fees), thanh toán đa dạng (VietQR / Crypto / Credit Card), nhận tài khoản/license ngay lập tức và có cơ chế bảo hành tự động 1-đổi-1 khi có sự cố.

---

### 1.2. Design System Tokens

#### A. Bảng màu (Color Tokens) - Chuẩn Dark-Mode-First High-Tech Sleek
| Token Name | Hex Code | HSL / RGB | Mô tả mục đích sử dụng |
| :--- | :--- | :--- | :--- |
| `--bg-canvas` | `#08090C` | `225, 20%, 4%` | Nền trang tối chủ đạo (Deep Space Dark) |
| `--bg-surface` | `#101318` | `220, 19%, 8%` | Nền Card, Container, Bảng danh mục |
| `--bg-elevated` | `#181C24` | `220, 20%, 12%` | Modal, Dropdown, Hover card background |
| `--border-subtle` | `#232936` | `220, 21%, 18%` | Đường viền ngăn cách nhẹ, border mặc định |
| `--border-focus` | `#0066FF` | `216, 100%, 50%` | Border khi focus form, active element |
| `--primary-blue` | `#0066FF` | `216, 100%, 50%` | **Màu thương hiệu chủ đạo** (Electric Blue) |
| `--primary-hover` | `#257CFF` | `216, 100%, 57%` | Trạng thái hover của nút bấm chính |
| `--accent-cyan` | `#00F0FF` | `184, 100%, 50%` | Neon Cyan (Dùng cho Badge Pro, Icon highlight) |
| `--text-primary` | `#F3F4F6` | `220, 14%, 96%` | Chữ tiêu đề, nội dung quan trọng |
| `--text-secondary` | `#9CA3AF` | `220, 9%, 65%` | Chữ mô tả phụ, label trường nhập liệu |
| `--text-muted` | `#6B7280` | `220, 9%, 46%` | Chữ mờ, placeholder, timestamp |
| `--status-success` | `#10B981` | `160, 84%, 39%` | Thành công, tài khoản sẵn có, SLA active |
| `--status-warning` | `#F59E0B` | `38, 92%, 50%` | Cảnh báo tồn kho ít, sắp hết hạn bảo hành |
| `--status-error` | `#EF4444` | `0, 84%, 60%` | Lỗi validate, thanh toán thất bại |

#### B. Kiểu chữ (Typography)
- **Primary Body / UI**: `Inter`, `-apple-system`, `BlinkMacSystemFont`, `sans-serif` (Tối ưu khả năng đọc trên màn hình retina, clean, hiện đại).
- **Code / Token / License Key / Pricing**: `JetBrains Mono`, `Fira Code`, `monospace` (Tạo cảm giác Dev-native, số liệu thẳng hàng).
- **Thang kích thước (Type Scale)**:
  - `Display 1`: 44px / Line-height: 52px / Weight: 700 (Hero Heading)
  - `Heading 1`: 32px / Line-height: 40px / Weight: 700 (Section Title)
  - `Heading 2`: 24px / Line-height: 32px / Weight: 600 (Card Title, Modal Title)
  - `Heading 3`: 18px / Line-height: 26px / Weight: 600 (Sub-headers)
  - `Body Regular`: 15px / Line-height: 22px / Weight: 400 (Text paragraph)
  - `Body Medium`: 15px / Line-height: 22px / Weight: 500 (Labels, Navigation)
  - `Caption / Tag`: 12px / Line-height: 16px / Weight: 600 (Badges, Status tags)
  - `Code / Mono`: 14px / Line-height: 20px / Weight: 500 (License Key, API Token)

#### C. Hệ thống Spacing & Grid
- **Base Spacing Unit**: 8-point Grid System (`4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `48px`, `64px`, `96px`).
- **Desktop Grid**: 12 Cột, Container Max-width: `1200px`, Gutter: `24px`, Side Margin: `auto`.
- **Tablet Grid**: 8 Cột, Margin: `24px`, Gutter: `16px`.
- **Mobile Grid**: 4 Cột, Margin: `16px`, Gutter: `12px`.

---

### 1.3. Nguyên tắc thiết kế: "Hành lang chuyển đổi một chiều"
1. **Zero Mandatory Sign-up (Mua không cần đăng ký tài khoản)**: Chỉ cần 1 trường Email duy nhất để nhận License & Hóa đơn. Tránh giảm 19% khách hàng do rào cản tài khoản (Theo nghiên cứu thực nghiệm).
2. **Minh bạch chi phí (100% Transparent Pricing)**: Giá hiển thị trên thẻ sản phẩm là giá thanh toán cuối cùng. Tuyệt đối không cộng thêm phí xử lý cổng thanh toán ẩn ở bước thanh toán.
3. **One-Way Corridor UX**: Không quảng cáo chéo ngoài lề, không pop-up cookie banner cồng kềnh, tập trung mọi tương tác vào việc "Chọn gói -> Nhập Email -> Thanh toán -> Nhận tài khoản trong 30s".
4. **SLA & Trust Signals**: Mọi vị trí then chốt đều gắn cam kết hoàn tiền 100% nếu tài khoản lỗi, hiển thị số lượng tài khoản sẵn giao trong kho thời gian thực.

---

## 2. ĐẶC TẢ CHI TIẾT TỪNG TRANG

---

### TRANG 1: Trang Chủ & Danh Mục Chuyển Đổi Nhanh (Landing & Fast Catalog Page)

#### 1. THÔNG TIN CHUNG (General Info)
- **Tên trang**: Homepage & Instant Catalog (`/`)
- **Mục đích của trang**: 
  - Khẳng định giá trị cốt lõi (Tài khoản AI Pro chính hãng cho Lập trình viên, giá tiết kiệm tới 60%, giao tức thì trong 30 giây).
  - Trình bày toàn bộ danh mục tài khoản AI Pro hot nhất với cơ chế lọc nhanh (Filter Tabs) 1 chạm.
  - Tối ưu hóa chuyển đổi ngay tại màn hình đầu tiên (Above the fold).
- **Luồng người dùng (User Flow)**:
  - *Luồng vào*: Trực tiếp từ Google Search, GitHub Ads, diễn đàn lập trình (Voz, Reddit, Facebook Group), giới thiệu bạn bè.
  - *Luồng ra*: 
    - Click `Mua ngay (Buy Now)` -> Mở Drawer/Modal cấu hình nhanh hoặc chuyển đến Trang Thanh Toán Siêu Tốc (Trang 3).
    - Click `Chi tiết gói (View Specs)` -> Chuyển đến Trang Chi Tiết Sản Phẩm (Trang 2).
    - Click `Tra cứu đơn hàng (Lookup Order)` -> Chuyển đến Trang Tra Cứu (Trang 5).

---

#### 2. BỐ CỤC & KIẾN TRÚC THÔNG TIN (Layout & Wireframe Text)
Bố cục dạng 12 cột, Responsive toàn diện. Cấu trúc từ trên xuống dưới:

```text
+-------------------------------------------------------------------------------+
| HEADER (Sticky Top, 64px height, Backdrop Blur)                               |
| [Logo: AIPro.dev]           [Nav: AI Coding | LLMs | Design] [Tra cứu ĐH] [USD/VND]|
+-------------------------------------------------------------------------------+
| HERO SECTION (Above the Fold, High Impact)                                    |
| [Badge: ⚡ Auto Delivery < 30s | 100% Active Guarantee]                       |
| H1: "Tài Khoản AI Pro Chuẩn Cho Developers. Kích Hoạt Tức Thì."              |
| Subtitle: "Tiết kiệm đến 65% chi phí cho Cursor Pro, Claude 3.7 Sonnet,       |
|            ChatGPT Plus, GitHub Copilot. Bảo hành 1-đổi-1 trọn đời gói."      |
| [Quick Terminal Widget: $ npx install-ai-pro cursor-pro --instant]           |
| Social Proof Bar: "Hơn 12,450+ lập trình viên tin dùng | Trustpilot 4.9/5"    |
+-------------------------------------------------------------------------------+
| FILTER & QUICK SEARCH BAR                                                     |
| [All] [AI Code Assistants] [LLM & Reasoning] [Design & Creative] [API/Team]   |
+-------------------------------------------------------------------------------+
| PRODUCT GRID SECTION (3 Columns Desktop, 1 Column Mobile)                     |
| +-------------------+  +-------------------+  +-------------------+           |
| | Card: Cursor Pro  |  | Card: Claude Pro  |  | Card: ChatGPT +   |           |
| | [Best for Devs]   |  | [Sonnet 3.7 Ready]|  | [GPT-4.5 & Canvas]|           |
| | Specs comparison  |  | Specs comparison  |  | Specs comparison  |           |
| | Price: $9.9/tháng |  | Price: $11.5/tháng|  | Price: $10.9/tháng|           |
| | [Mua ngay - 30s]  |  | [Mua ngay - 30s]  |  | [Mua ngay - 30s]  |           |
| +-------------------+  +-------------------+  +-------------------+           |
+-------------------------------------------------------------------------------+
| REAL-TIME STOCK & GUARANTEE BANNER                                            |
| [Status Pulse: 🟢 42 Accounts Ready to Dispatch] [🛡️ Bảo hành 1-đổi-1 trong 5p] |
+-------------------------------------------------------------------------------+
| COMPARISON MATRIX (Bảng so sánh nhanh tính năng các gói AI Coding)            |
+-------------------------------------------------------------------------------+
| DEVELOPER FAQS (Accordion tối giản 5 câu hỏi cốt lõi)                         |
+-------------------------------------------------------------------------------+
| FOOTER (Tối giản, Link SLA, Chính sách bảo hành, API Status, Hỗ trợ Telegram) |
+-------------------------------------------------------------------------------+
```

---

#### 3. DANH SÁCH THÀNH PHẦN UI (UI Components Detail)

##### 3.1. Header Navigation Bar
- **Loại**: Sticky Navigation Bar, cố định đỉnh trang khi cuộn.
- **Kích thước**: Chiều cao `64px`, padding trái/phải `24px`, background `rgba(8, 9, 12, 0.85)` kết hợp `backdrop-filter: blur(12px)`.
- **Thành phần con**:
  1. *Logo*: Biểu tượng Terminal Prompt `>_` với viền gradient Neon Cyan to Electric Blue + Text `AIPro.dev` (Font `JetBrains Mono`, 18px, Bold).
  2. *Quick Nav Links*: `AI Coding`, `Claude & GPT`, `Team / Enterprise`. Text 14px, Color `--text-secondary`.
     - *Hover*: Đổi sang `--text-primary`, underline animation `200ms ease`.
  3. *Currency Toggle*: Dropdown chọn đơn vị hiển thị `VND (₫)` hoặc `USD ($)`.
  4. *Button "Tra cứu đơn hàng"*: Ghost Button, Icon kính lúp, dẫn thẳng tới Trang 5.

##### 3.2. Hero Interactive Terminal & CTA
- **Terminal Simulator Component**:
  - Hộp giao diện giả lập CLI để tăng tính kết nối với Lập trình viên.
  - Background `#0F1218`, viền `#232936`, 3 nút Mac tròn (Red, Yellow, Green).
  - Dòng text gõ tự động (Typewriter effect): `ai-pro buy --tool=cursor-pro --delivery=instant`
  - Nút `Copy Command` ở góc phải. Khi click: đổi text sang `Copied! ✓` trong 2 giây.

##### 3.3. Filter Pills Bar
- **Loại**: Horizontal Scrollable Tab Bar (cho Mobile) và Centered Buttons (cho Desktop).
- **Trạng thái**:
  - *Default*: Nền `--bg-surface`, viền `--border-subtle`, chữ `--text-secondary`.
  - *Hover*: Viền sáng hơn `--text-muted`, chữ `--text-primary`.
  - *Active (Selected)*: Nền `--primary-blue`, chữ `#FFFFFF`, viền `--primary-blue`, đổ bóng nhẹ `0 0 12px rgba(0,102,255,0.4)`.

##### 3.4. Thẻ Sản Phẩm (Product Card Component - "Card AI Pro")
- **Kích thước**: Width `100%`, Max-width `360px`, Border-radius `12px`, Border `1px solid --border-subtle`, Padding `24px`.
- **Trạng thái thẻ**:
  - *Default*: Nền `--bg-surface`.
  - *Hover*: Thẻ dịch chuyển lên `translateY(-4px)`, viền chuyển thành `--primary-blue`, đổ bóng `0 12px 24px rgba(0, 0, 0, 0.5)`.
- **Thành phần chi tiết trên mỗi Card**:
  1. *Badge Phân Loại*: Góc trên bên phải. Ví dụ: `[🔥 Khuyên Dùng Cho Dev]` (Cyan Badge) hoặc `[⚡ Sẵn Tài Khoản]`.
  2. *Product Header*:
     - Brand Icon: Logo SVG chính hãng sắc nét (Cursor, Anthropic, OpenAI, GitHub). Kích thước `40x40px`.
     - Product Name: 20px, Bold (Ví dụ: `Cursor Pro 1 Tháng`).
     - Sub-text: Nền tảng hỗ trợ (VS Code Fork, Windows/Mac/Linux).
  3. *Pricing Display*:
     - Giá bán hiện tại: `249.000 ₫` hoặc `$9.99` (Font `JetBrains Mono`, 28px, Bold, Màu `--text-primary`).
     - Giá niêm yết gốc: `500.000 ₫` hoặc `$20.00` (Gạch ngang `line-through`, màu `--text-muted`, 14px).
     - Badge Tiết Kiệm: `-50%` (Nền `--status-success` 15% opacity, chữ xanh lá, 12px Bold).
  4. *Feature Checklist (Tối đa 4 gạch đầu dòng then chốt)*:
     - Icon Checkmark xanh lá: `500 Fast Premium Requests/tháng`.
     - Icon Checkmark xanh lá: `Claude 3.7 Sonnet & GPT-4o không giới hạn`.
     - Icon Checkmark xanh lá: `Tùy chọn: Mail cấp sẵn hoặc Nâng chính chủ`.
     - Icon Checkmark xanh lá: `Bảo hành 1-đổi-1 tự động trong 30 ngày`.
  5. *Primary CTA Button*:
     - Text: `⚡ Mua Siêu Tốc (Giao 30s)`.
     - Chiều cao `44px`, Full-width, Nền `--primary-blue`, Chữ trắng, Bo góc `8px`.
     - Ràng buộc: Khi kho hết hàng -> Nút chuyển sang trạng thái *Disabled*, nền `#2A2E39`, chữ `#6B7280`, hiển thị text `Tạm hết hàng - Đặt trước`.

---

#### 4. HÀNH VI TƯƠNG TÁC & UX (Interactions & Edge Cases)

##### 4.1. Tương tác vi mô (Micro-interactions)
- Khi rê chuột vào Card: Badge giá nhấp nháy ánh sáng gradient nhẹ (Subtle shimmer effect).
- Khi nhấp chọn danh mục (Filter Tab): Grid sản phẩm fade-in mềm mại trong `150ms` mà không gây hiện tượng nhảy layout (Layout shift Cumulative Layout Shift CLS = 0).
- Khi nhấp `⚡ Mua Siêu Tốc`:
  - Không tải lại toàn trang.
  - Trượt mở nhanh một Drawer (bên phải trên Desktop / Bottom Sheet trên Mobile) hiển thị cấu hình gói và thanh toán trực tiếp, giúp người dùng không bị mất ngữ cảnh.

##### 4.2. Trạng thái lỗi và biên độ dữ liệu (Edge Cases)
- **Empty State (Không tìm thấy sản phẩm khi tìm kiếm/lọc)**:
  - Icon: Terminal trống với dấu nhấp nháy `_`.
  - Tiêu đề: `Không tìm thấy gói AI phù hợp với từ khóa`.
  - Hành động: Nút `Khôi phục bộ lọc` (Reset filter) và liên kết `Yêu cầu bổ sung tài khoản riêng qua Telegram`.
- **Mạng chập chờn / Offline Detection**:
  - Banner mỏng xuất hiện ở trên cùng màu vàng cam `--status-warning`: `Đang mất kết nối Internet. Dữ liệu kho có thể chưa được cập nhật mới nhất.`

---

### TRANG 2: Trang Chi Tiết & Tùy Biến Gói Dịch Vụ (Product Configuration Page / Modal)

#### 1. THÔNG TIN CHUNG (General Info)
- **Tên trang**: Product Detail & Plan Customizer (`/product/:slug`)
- **Mục đích của trang**:
  - Cho phép lập trình viên tùy biến cấu hình gói tài khoản theo đúng nhu cầu công việc (Loại tài khoản, thời hạn, số lượng thiết bị/slot).
  - Cung cấp đầy đủ thông số kỹ thuật (Context window size, Model limit, Quyền truy cập API token nếu có) để developer đưa ra quyết định mua hàng chính xác nhất.
- **Luồng người dùng (User Flow)**:
  - *Luồng vào*: Click từ Thẻ sản phẩm ở Trang 1 hoặc từ đường link chia sẻ trực tiếp.
  - *Luồng ra*: 
    - Click `Tiến hành thanh toán (Go to Checkout)` -> Chuyển sang Trang 3.
    - Click `Quay lại (Back)` -> Về lại Trang 1.

---

#### 2. BỐ CỤC & KIẾN TRÚC THÔNG TIN (Layout & Wireframe Text)
Bố cục 2 cột bất đối xứng (Desktop: 7 cột bên trái - 5 cột bên phải dính cố định):

```text
+-------------------------------------------------------------------------------+
| HEADER & BREADCRUMB: Trang chủ > AI Coding > Cursor Pro                       |
+-------------------------------------------------------------------------------+
| CỘT TRÁI (THÔNG SỐ & TÙY CHỌN - 7 COL)        | CỘT PHẢI (STICKY SUMMARY BOX) |
| [Product Title & Official Verified Icon]       | [Hộp tóm tắt đơn hàng]        |
|                                                | Cursor Pro - 3 Tháng          |
| 1. CHỌN LOẠI TÀI KHOẢN:                        | Gói: Nâng chính chủ Email     |
| (•) Nâng cấp trực tiếp trên Email cá nhân      |                               |
| ( ) Nhận tài khoản mới tạo sẵn (Cấp tức thì)   | Giá gốc: 1.500.000 ₫          |
|                                                | Giảm giá dev: -50%            |
| 2. CHỌN THỜI HẠN SỬ DỤNG:                      | TỔNG CỘNG: 749.000 ₫          |
| [ 1 Tháng ]  [ 3 Tháng - Tiết kiệm 15% ]       | (Giá trọn gói - Không phí ẩn) |
| [ 6 Tháng ]  [ 12 Tháng - Tặng 1 tháng ]       |                               |
|                                                | [ Ô nhập Email nhận hàng ]    |
| 3. THÔNG SỐ KỸ THUẬT (DEVELOPER SPECS):        | [dev.email@gmail.com        ] |
| - Quota: 500 Fast Requests/mo                  |                               |
| - Context Window: 200K tokens                  | [ NÚT: THANH TOÁN NGAY ]      |
| - Model: Claude 3.7, GPT-4.5, o3-mini          | (Chuyển sang quét mã QR/Thẻ)  |
| - Multi-device sync: Có                        |                               |
|                                                | [Cam kết an toàn]:            |
| 4. CHÍNH SÁCH BẢO HÀNH (SLA WIDGET):           | 🛡️ Hoàn tiền 100% nếu lỗi     |
| - Đổi mới tự động 1-click nếu phát sinh lỗi    | ⚡ Kích hoạt trong 60 giây     |
| - Không lưu trữ mật khẩu cá nhân               | 💬 Kỹ thuật viên hỗ trợ 24/7  |
+-------------------------------------------------------------------------------+
```

---

#### 3. DANH SÁCH THÀNH PHẦN UI (UI Components Detail)

##### 3.1. Option Selector: Loại tài khoản (Account Provisioning Type)
- **Kiểu giao diện**: Segmented Radio Card (2 thẻ nằm ngang).
- **Thẻ A - "Nâng cấp chính chủ (Invite to Team / Pro)"**:
  - Tiêu đề: *Nâng trên Email cá nhân*.
  - Mô tả: Không mất dữ liệu cũ, không cần đổi tài khoản, bảo mật tuyệt đối.
  - Phụ phí: `+ 0 ₫`.
- **Thẻ B - "Tài khoản cấp sẵn (Pre-created Private Account)"**:
  - Tiêu đề: *Tài khoản cấp sẵn (Giao ngay)*.
  - Mô tả: Nhận tài khoản độc quyền riêng biệt, bàn giao tức thì trong 10 giây.
  - Badge: `⚡ Sẵn giao ngay`.
- **Ràng buộc**: Khi chọn "Nâng trên email cá nhân", một trường nhập Email sẽ xuất hiện để người dùng cung cấp email cần nâng cấp. Validation định dạng RFC 5322.

##### 3.2. Duration Selector: Thời hạn sử dụng
- **Kiểu giao diện**: Grid 4 nút bấm chọn kỳ hạn: `1 Tháng`, `3 Tháng`, `6 Tháng`, `12 Tháng`.
- **Thành phần trên mỗi nút**:
  - Tên kỳ hạn (16px, Semi-bold).
  - Giá tương đương theo tháng (12px, font Mono).
  - Discount Tag (Ví dụ: `Save 20%` góc trên nút 12 tháng).
- **Trạng thái**:
  - *Active*: Viền xanh `--primary-blue`, background `--bg-elevated`, có icon checkmark nhỏ.

##### 3.3. Sticky Summary Checkout Box (Khung tính tiền dính theo màn hình)
- **Vị trí**: Cố định bên phải màn hình khi người dùng cuộn xem thông số kỹ thuật bên trái.
- **Thành phần**:
  - Hàng giá gốc (Strikethrough).
  - Hàng ưu đãi Dev Discount (Màu xanh lá).
  - Tổng số tiền cần thanh toán (Font `JetBrains Mono`, 32px, Bold).
  - Input Email Nhận Hàng (Fast Guest Input):
    - Placeholder: `your.email@company.com`.
    - Input Validation: Regex kiểm tra email chuẩn. Báo viền đỏ nếu sai định dạng.
  - CTA Button: `⚡ Thanh toán ngay & Kích hoạt`. Chiều cao `48px`, Font 16px Bold.

---

#### 4. HÀNH VI TƯƠNG TÁC & UX (Interactions & Edge Cases)

##### 4.1. Tương tác tính toán giá thời gian thực (Dynamic Price Calculation)
- Khi người dùng bấm chuyển giữa các kỳ hạn (1 tháng -> 12 tháng): Số tiền tổng cộng sẽ nhảy số animation lăn (Odometer / Number roll effect) mượt mà trong `250ms`, giúp người dùng cảm nhận rõ số tiền tiết kiệm được.

##### 4.2. Edge Cases & Xử lý ngoại lệ
- **Email công ty bị chặn nhận thư rác**: Hiển thị gợi ý nhỏ dưới ô email: *"Nên dùng Gmail cá nhân hoặc Email hỗ trợ nhận thư mời từ hệ thống quốc tế"*.
- **Tùy chọn tạm thời hết slot**: Nếu gói "Nâng cấp chính chủ" hết slot lời mời (Invite slot full), thẻ đó bị disable kèm nhãn `Tạm hết slot mời hôm nay - Vui lòng chọn Tài khoản cấp sẵn`.

---

### TRANG 3: Trang Thanh Toán Siêu Tốc (Ultra-Fast Guest Checkout Page)

#### 1. THÔNG TIN CHUNG (General Info)
- **Tên trang**: One-Step Frictionless Checkout (`/checkout`)
- **Mục đích của trang**:
  - Thực thi triết lý **"Máy bơm xăng tốc độ cao"**: Hoàn thành thanh toán trong vòng dưới 60 giây với số trường nhập tối thiểu.
  - **Không bắt buộc tạo tài khoản (100% Guest Checkout)**: Người dùng chỉ cần cung cấp Email để nhận tài khoản và hóa đơn.
  - Hỗ trợ thanh toán đa kênh phù hợp cho dev Việt Nam lẫn Quốc tế (VietQR chuyển khoản ngân hàng quét mã tự động, Thẻ tín dụng Stripe/Apple Pay, Ví Crypto USDT cho Dev Web3).
- **Luồng người dùng (User Flow)**:
  - *Luồng vào*: Từ nút "Thanh toán ngay" ở Trang 1 hoặc Trang 2.
  - *Luồng ra*:
    - Thanh toán thành công (Webhook xác nhận tự động) -> Chuyển ngay lập tức đến Trang 4 (Bàn Giao & Quản Lý).
    - Hủy giao dịch -> Quay lại Trang 1 kèm giỏ hàng được lưu trong LocalStorage.

---

#### 2. BỐ CỤC & KIẾN TRÚC THÔNG TIN (Layout & Wireframe Text)
Bố cục dạng 2 cột chia theo tỷ lệ 6:6 hoặc 7:5. Tập trung cao độ, loại bỏ thanh Navigation chính để tránh phân tâm (Loại bỏ link thoát trang):

```text
+-------------------------------------------------------------------------------+
| CHECKOUT HEADER TỐI GIẢN (Chỉ có Logo + Khóa bảo mật 256-bit SSL)             |
| [AIPro.dev]                                       [🔒 Thanh toán an toàn 100%]|
+-------------------------------------------------------------------------------+
| CỘT TRÁI: THÔNG TIN & PHƯƠNG THỨC THANH TOÁN   | CỘT PHẢI: CHI TIẾT THANH TOÁN|
|                                                |                               |
| BƯỚC 1: EMAIL NHẬN TÀI KHOẢN (BẮT BUỘC DUY NHẤT)| [Thẻ tóm tắt gói]             |
| [Input Email: alex.dev@gmail.com             ] | Cursor Pro (3 Tháng)          |
| ℹ️ Mật khẩu quản lý & tài khoản gửi về mail này | Bàn giao: Sau 30s             |
|                                                |                               |
| BƯỚC 2: CHỌN CỔNG THANH TOÁN (Tabs)            | Giá niêm yết:   1.500.000 ₫   |
| [ VietQR Tự Động ] [ Thẻ Quốc Tế ] [ Crypto ]  | Giảm giá dev:   - 751.000 ₫   |
|                                                | Thuế VAT & Phí:       + 0 ₫   |
| >> GIAO DIỆN VIETQR AUTO-VERIFY:               | ----------------------------- |
| [MÃ QR DYNAMIC]    Thông tin chuyển khoản:     | TỔNG THANH TOÁN: 749.000 ₫   |
| (Chứa sẵn số tiền  - Ngân hàng: MB Bank        |                               |
| & cú pháp bí mật)  - STK: 99998888AI           | [Đồng hồ đếm ngược: 09:59]    |
|                    - Nội dung: AIPRO 84920     |                               |
|                    [Nút: Copy STK] [Copy ND]   | 🛡️ Cam kết:                   |
|                                                | - Hoàn tiền 100% nếu tài      |
| [Pulse Bar: Đang chờ ngân hàng xác nhận...]     |   khoản không hoạt động       |
| ⚡ Hệ thống tự động chuyển trang khi nhận tiền | - Bảo hành 1-đổi-1 90 ngày    |
+-------------------------------------------------------------------------------+
```

---

#### 3. DANH SÁCH THÀNH PHẦN UI (UI Components Detail)

##### 3.1. Guest Email Input Field (Trường nhập thông tin duy nhất)
- **Nhãn**: `Email nhận tài khoản & Bảo hành`.
- **Kích thước**: Chiều cao `48px`, Border `1px solid --border-subtle`, Nền `--bg-canvas`.
- **Ràng buộc dữ liệu**:
  - Max length: 120 ký tự.
  - Real-time Regex Validation: Bắt buộc chuẩn định dạng `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`.
  - Không cho phép bỏ trống.
- **Trạng thái**:
  - *Default*: Viền `--border-subtle`.
  - *Focus*: Viền sáng `--border-focus`, icon phong bì đổi sang màu xanh dương.
  - *Error*: Viền đỏ `--status-error`, thông báo text bên dưới: `"Vui lòng nhập địa chỉ email hợp lệ để nhận thông tin đăng nhập"`.
  - *Success (Valid)*: Icon checkmark xanh lá xuất hiện ở góc phải input.

##### 3.2. Payment Method Selector (Bộ chuyển đổi kênh thanh toán)
Gồm 3 Tab lớn, tối ưu hóa cho từng nhóm dev:
1. **Tab 1: VietQR Pro (Khuyên dùng tại Việt Nam - Miễn phí giao dịch)**:
   - Hiển thị Dynamic VietQR Code (Kích thước `220x220px`).
   - Tự động mã hóa chính xác số tiền và mã giao dịch duy nhất (Ví dụ: `AIPRO7782`).
   - Cung cấp 2 nút bấm tiện ích: `Sao chép STK` và `Sao chép Nội dung CK`.
   - Hiệu ứng Pulse Animation: Vòng tròn radar xanh quét liên tục thể hiện hệ thống đang lắng nghe Webhook ngân hàng (Polling/WebSocket).
2. **Tab 2: Thẻ Quốc Tế (Stripe Checkout - Visa/Mastercard/Apple Pay)**:
   - Nhúng Stripe Elements với giao diện Dark Mode đồng bộ.
   - Hỗ trợ 1-Click Apple Pay / Google Pay cho dev dùng MacBook/iPhone.
3. **Tab 3: Crypto Pay (USDT / USDC qua Solana / Arbitrum)**:
   - Dành cho dev quốc tế hoặc dev Web3 muốn bảo mật danh tính.
   - Hiển thị địa chỉ ví và mã QR tương ứng với tỷ giá USDT/VND cố định trong phiên.

##### 3.3. Order Timer Countdown Widget (Đồng hồ đếm ngược giữ slot)
- **Mục đích**: Giữ slot tài khoản và cố định tỷ giá thanh toán trong vòng 10 phút.
- **Giao diện**: Đồng hồ số `MM:SS` (Font `JetBrains Mono`, 18px, Bold, Màu `--status-warning`).
- **Thanh tiến trình (Progress Bar)**: Thu hẹp dần từ 100% về 0% theo thời gian thực.

---

#### 4. HÀNH VI TƯƠNG TÁC & UX (Interactions & Edge Cases)

##### 4.1. Auto-redirect khi giao dịch thành công (Zero Friction Hand-off)
- Khi người dùng chuyển tiền qua App Ngân hàng hoặc quét QR xong:
- Trong vòng `1.5 - 3 giây`, Webhook từ SePay/Casso/Stripe bắn tín hiệu về Backend -> Frontend nhận qua WebSocket.
- Giao diện phát âm thanh xác nhận nhẹ (Subtle chime), toàn bộ khung chuyển sang trạng thái Success với dấu tích xanh lớn `✓ ĐÃ NHẬN THANH TOÁN`, sau đó tự động chuyển hướng sang Trang 4 sau đúng `1.2 giây`.
- Người dùng **không cần nhấn bất kỳ nút xác nhận nào**.

##### 4.2. Xử lý trạng thái lỗi & Sự cố thanh toán (Edge Cases)
- **Người dùng chuyển sai số tiền hoặc sai cú pháp chuyển khoản**:
  - Hệ thống phát hiện số tiền chênh lệch (Ví dụ: Đơn 749k nhưng chuyển 700k).
  - Modal cảnh báo khẩn cấp xuất hiện: *"Đã nhận 700.000 ₫ (Thiếu 49.000 ₫ so với giá trị đơn hàng)"*. Cung cấp mã QR bổ sung phần tiền còn thiếu hoặc nút bấm `Kết nối hỗ trợ viên khẩn cấp (Telegram/Zalo)` với mã log đính kèm sẵn.
- **Hết thời gian đếm ngược 10 phút (Timer Expired)**:
  - Mã QR bị mờ đi (Overlay xám mờ).
  - Nút bấm `Tạo mã thanh toán mới` xuất hiện để cập nhật lại phiên mới mà không làm mất thông tin email người dùng đã điền.
- **Người dùng vô tình đóng trình duyệt khi vừa chuyển tiền xong**:
  - Hệ thống tự động gửi đường link truy cập thẳng đơn hàng vào Email của khách. Khách chỉ cần mở email và click link là vào thẳng Trang 4.

---

### TRANG 4: Trang Bàn Giao Tức Thì & Quản Lý License (Instant Delivery & Fulfillment Page)

#### 1. THÔNG TIN CHUNG (General Info)
- **Tên trang**: Instant Delivery & Account Vault (`/order/success/:orderId`)
- **Mục đích của trang**:
  - Bàn giao ngay lập tức tài khoản AI Pro (Email, Password, Token, License Key, Hướng dẫn kích hoạt) cho khách hàng.
  - Cho phép thao tác 1-Click Copy, tải file cấu hình `.env` hoặc file thông tin đăng nhập dạng JSON/TXT.
  - Cung cấp công cụ kiểm tra tự động trạng thái hoạt động của tài khoản (Self-test/Verify Button).
  - Khởi tạo mật khẩu tra cứu tài khoản khách hàng để sử dụng cho các lần sau.
- **Luồng người dùng (User Flow)**:
  - *Luồng vào*: Chuyển hướng tự động từ Trang 3 sau khi thanh toán thành công, hoặc từ đường link xác nhận gửi trong Email.
  - *Luồng ra*:
    - Click `Đến nền tảng gốc (Go to Claude/Cursor)` -> Mở tab mới dẫn thẳng tới trang chủ dịch vụ AI.
    - Click `Tải hóa đơn VAT/Biên lai` -> Tải PDF.
    - Click `Cần bảo hành/Hỗ trợ` -> Mở form bảo hành tự động tại Trang 5.

---

#### 2. BỐ CỤC & KIẾN TRÚC THÔNG TIN (Layout & Wireframe Text)
Bố cục dạng Card tập trung (Single-Column Focus, Max-width 840px, Căn giữa):

```text
+-------------------------------------------------------------------------------+
| HEADER TỐI GIẢN (Logo AIPro.dev + Trạng thái: Đơn Hàng Hoàn Tất)             |
+-------------------------------------------------------------------------------+
| SUCCESS BANNER (Hiệu ứng pháo hoa nhẹ / Confetti Animation)                   |
| [ Icon Checkmark Lớn Màu Xanh Lá ]                                            |
| H1: "Thanh Toán Thành Công! Tài Khoản Của Bạn Đã Sẵn Sàng."                  |
| Mã đơn hàng: #AIPRO-94820 | Thời gian bàn giao: 18 giây                      |
+-------------------------------------------------------------------------------+
| THE CREDENTIALS VAULT (HỘP LƯU TRỮ BẢO MẬT TÀI KHOẢN)                         |
| +---------------------------------------------------------------------------+ |
| | Loại gói: Cursor Pro (Bản quyền 3 Tháng)                                   | |
| | Hạn bảo hành đến: 22/06/2026 (Còn 90 ngày)                                | |
| | ------------------------------------------------------------------------- | |
| | [Trường 1] TÀI KHOẢN DỊCH VỤ / EMAIL:                                     | |
| | [ cursor.dev.pro92@gmail.com                           ] [📋 Sao chép]   | |
| |                                                                           | |
| | [Trường 2] MẬT KHẨU / ACCESS TOKEN:                                       | |
| | [ ••••••••••••••••••              ] [👁️ Xem]          [📋 Sao chép]   | |
| |                                                                           | |
| | [Trường 3] MÃ PHỤC HỒI / 2FA SECRET (NẾU CÓ):                             | |
| | [ JBSWY3DPEHPK3PXP                                     ] [📋 Sao chép]   | |
| +---------------------------------------------------------------------------+ |
| [ Nút 1: Mở Cursor & Đăng Nhập ]  [ Nút 2: Tải file Credentials (.json) ]    |
+-------------------------------------------------------------------------------+
| QUICK SETUP GUIDE (HƯỚNG DẪN KÍCH HOẠT DÀNH CHO DEVELOPER)                    |
| Bước 1: Đăng xuất tài khoản cũ trên Cursor/Claude                             |
| Bước 2: Đăng nhập bằng tài khoản và mật khẩu được cung cấp ở trên             |
| Bước 3: Kiểm tra Subscription Status trong phần Settings                      |
| [Widget Test Tự Động: 🟢 Kiểm tra tình trạng hoạt động của tài khoản này]     |
+-------------------------------------------------------------------------------+
| TỰ ĐỘNG THIẾT LẬP MẬT KHẨU QUẢN LÝ (KHÔNG CẦN FORM ĐĂNG KÝ)                  |
| "Chúng tôi đã tạo sẵn tài khoản quản lý bảo hành cho bạn với Email của bạn.   |
|  Đặt mật khẩu nhanh để lần sau tra cứu: [ Nhập mật khẩu ] [ Lưu ]"           |
+-------------------------------------------------------------------------------+
| CHÍNH SÁCH BẢO HÀNH & NÚT HỖ TRỢ KHẨN CẤP                                    |
| [🛡️ Bảo hành 1-đổi-1 tự động trong 90 ngày] [💬 Yêu cầu cấp lại tài khoản]   |
+-------------------------------------------------------------------------------+
```

---

#### 3. DANH SÁCH THÀNH PHẦN UI (UI Components Detail)

##### 3.1. Credentials Vault Card (Khung thông tin tài khoản bảo mật)
- **Đặc điểm giao diện**: Khung viền kép viền Cyan Neon, nền `--bg-surface`, bo góc `12px`, padding `32px`.
- **Thành phần chi tiết**:
  1. *Email/Account Input Display*:
     - Ô hiển thị dạng Read-Only với font `JetBrains Mono`, 15px.
     - Nút `Sao chép (Copy)` kèm icon clipboard. Khi click: Hiển thị tooltip `Đã sao chép! ✓` màu xanh lá trong 2s.
  2. *Password / Key Input Display*:
     - Mặc định che dưới dạng dấu chấm `••••••••••••`.
     - Nút `Xem (Eye Toggle)`: Chuyển đổi giữa ẩn và hiện chuỗi ký tự mật khẩu thực tế.
     - Nút `Sao chép mật khẩu`.
  3. *Action Button Row*:
     - Nút chính: `Mở Ứng Dụng Ngay (Open Tool)` (Chuyển trực tiếp sang Cursor/OpenAI/Anthropic).
     - Nút phụ: `Tải Credentials (.json / .env)`: Cho phép dev tải nhanh cấu hình để lưu vào kho bảo mật cá nhân (1Password/Bitwarden).

##### 3.2. Automated Account Health Check Widget (Công cụ tự test tài khoản)
- **Mục đích**: Xóa bỏ tâm lý hoài nghi của người dùng sau khi mua tài khoản.
- **Thành phần**:
  - Nút bấm: `Kiểm tra tình trạng tài khoản ngay (Verify Status)`.
  - Khi người dùng click: Vòng quay loading trong 2 giây gọi API backend kiểm tra cookie/token với dịch vụ gốc.
  - Kết quả trả về: Badge xanh lá `🟢 Tài khoản Active 100% - Hạn mức Pro đã sẵn sàng`.

##### 3.3. Instant Password Setup Widget (Tạo mật khẩu tra cứu không ma sát)
- **Bản chất UX**: Thay vì ép người dùng tạo tài khoản trước khi mua, hệ thống tạo sẵn tài khoản ngầm và cho phép đặt mật khẩu tùy ý ngay tại trang hoàn tất.
- **Giao diện**: Input mật khẩu tối giản `Đặt mật khẩu để quản lý cho các đơn sau` + Nút `Lưu`.
- Ràng buộc: Tối thiểu 8 ký tự.

---

#### 4. HÀNH VI TƯƠNG TÁC & UX (Interactions & Edge Cases)

##### 4.1. Tương tác sao chép thông minh
- Khi nhấn nút "Sao chép toàn bộ thông tin": Hệ thống gom cả Email, Mật khẩu, Mã 2FA và Ghi chú bảo hành vào định dạng Text Markdown gọn gàng để dev dán vào Notion hoặc Password Manager.

##### 4.2. Trạng thái lỗi và tình huống đặc biệt
- **Trường hợp tài khoản nâng cấp chính chủ đang chờ chấp nhận lời mời (Invite Pending)**:
  - Hiển thị thanh tiến trình: `Hệ thống đã gửi lời mời nâng cấp Pro đến Email: dev@domain.com`.
  - Nút bấm: `Mở Hộp Thư Để Chấp Nhận Lời Mời (Open Mailbox)`.
  - Hướng dẫn kèm ảnh GIF 10 giây mô phỏng thao tác bấm "Accept Invite".

---

### TRANG 5: Trang Tra Cứu Đơn Hàng & Tự Phục Vụ Bảo Hành (Self-Service Warranty & Order Lookup Page)

#### 1. THÔNG TIN CHUNG (General Info)
- **Tên trang**: Order Lookup & Self-Service Warranty (`/lookup` & `/warranty`)
- **Mục đích của trang**:
  - Cho phép người dùng tra cứu lại mọi thông tin tài khoản đã mua bằng Email hoặc Mã đơn hàng mà **không bắt buộc phải đăng nhập phức tạp**.
  - Cung cấp quy trình **Bảo hành tự động 1-Click (Self-Service Auto-Replacement)**: Nếu tài khoản bị lỗi session, out gói hoặc lỗi kỹ thuật, hệ thống tự động kiểm tra và cấp ngay tài khoản thay thế mới trong 60 giây mà không cần chờ nhân viên CSKH trả lời.
- **Luồng người dùng (User Flow)**:
  - *Luồng vào*: 
    - Click từ menu `Tra cứu đơn hàng` trên Header Trang 1.
    - Click từ link thông báo trong Email xác nhận mua hàng.
  - *Luồng ra*:
    - Tra cứu thành công -> Hiển thị chi tiết đơn hàng và giao diện bảo hành.
    - Cấp đổi tài khoản mới thành công -> Cập nhật thông tin tài khoản mới ngay trên màn hình.

---

#### 2. BỐ CỤC & KIẾN TRÚC THÔNG TIN (Layout & Wireframe Text)
Bố cục dạng Card tập trung, chia làm 2 giai đoạn: Giai đoạn tra cứu và Giai đoạn quản lý/bảo hành:

```text
+-------------------------------------------------------------------------------+
| HEADER (Logo + Quay lại trang chủ)                                            |
+-------------------------------------------------------------------------------+
| GIAI ĐOẠN 1: FORM TRA CỨU NHANH (FAST LOOKUP FORM)                            |
| H1: "Tra Cứu Đơn Hàng & Kích Hoạt Bảo Hành"                                   |
| Subtitle: "Nhập Email mua hàng hoặc Mã đơn hàng để quản lý bản quyền"         |
|                                                                               |
| [ Tab: Tra cứu theo Email ]       [ Tab: Tra cứu theo Mã đơn hàng ]           |
| [ Ô nhập Email: alex.dev@gmail.com                           ]                |
| [ Nút: Gửi mã OTP xác thực / Tra cứu tức thì ]                                |
+-------------------------------------------------------------------------------+
| GIAI ĐOẠN 2: BẢNG DANH SÁCH ĐƠN HÀNG & BẢO HÀNH (Sau khi xác thực)            |
|                                                                               |
| THẺ ĐƠN HÀNG #AIPRO-94820                                                     |
| Gói: Cursor Pro 3 Tháng | Ngày mua: 22/03/2026 | Bảo hành đến: 22/06/2026     |
| Trạng thái bảo hành: 🟢 Đang hoạt động (Còn 88 ngày bảo hành)                 |
|                                                                               |
| [ Khung xem lại thông tin đăng nhập ]                                         |
| Email: cursor.dev.pro92@gmail.com    [Sao chép]                               |
| Mật khẩu: ••••••••••••               [Hiện] [Sao chép]                        |
|                                                                               |
| TRUNG TÂM BẢO HÀNH TỰ ĐỘNG (SELF-SERVICE BOT):                                |
| Bạn gặp vấn đề với tài khoản này?                                             |
| [ (•) Bị mất gói Pro / Out gói ]   [ ( ) Sai mật khẩu ]  [ ( ) Lỗi khác ]     |
| [ NÚT: ⚡ KÍCH HOẠT ĐỔI MỚI TÀI KHOẢN TỰ ĐỘNG TRONG 60S ]                     |
|                                                                               |
| Lịch sử bảo hành của đơn:                                                     |
| - 22/03/2026 14:20: Bàn giao tài khoản gốc ban đầu                            |
| - Không có sự cố ghi nhận                                                     |
+-------------------------------------------------------------------------------+
| HỖ TRỢ KỸ THUẬT VIÊN TRỰC TIẾP (ESCALATION)                                   |
| Nếu bot tự động không giải quyết được: [ Kết nối Kỹ thuật viên Telegram 24/7 ]|
+-------------------------------------------------------------------------------+
```

---

#### 3. DANH SÁCH THÀNH PHẦN UI (UI Components Detail)

##### 3.1. Fast Lookup Tab & Inputs
- **Tabs**: `Tra cứu qua Email` và `Tra cứu qua Mã đơn hàng (#AIPRO-XXXX)`.
- **Cơ chế xác thực bảo mật không cần mật khẩu (Magic Link / OTP 6 số)**:
  - Khi nhập Email và nhấn `Tra cứu`: Hệ thống gửi mã OTP 6 số về email để chống việc người khác xem trộm thông tin tài khoản.
  - Ô nhập OTP: 6 ô vuông liền kề tự động nhảy con trỏ (Auto-focus next input), chỉ chấp nhận số `[0-9]`. Hỗ trợ Paste nguyên chuỗi 6 số từ clipboard.

##### 3.2. Order Status Badge & Timeline Component
- **Badge Trạng thái bảo hành**:
  - `🟢 Đang được bảo hành`: Xanh lá, hiển thị số ngày còn lại.
  - `🟡 Sắp hết hạn bảo hành`: Vàng (khi còn < 5 ngày). Kèm nút `Gia hạn thêm với ưu đãi 15%`.
  - `⚪ Đã hết hạn bảo hành`: Xám.

##### 3.3. Self-Service Auto-Replacement Button (Nút đổi mới tài khoản 1-click)
- **Thiết kế**: Nút bấm màu đỏ cam nổi bật hoặc tím công nghệ, có icon tia chớp.
- **Ràng buộc tương tác**:
  - Người dùng phải tick chọn 1 trong các lý do: `Bị out gói Pro`, `Sai thông tin đăng nhập`, `Bị giới hạn thiết bị`.
  - Hiển thị hộp xác nhận an toàn (Confirmation Modal): *"Hệ thống sẽ vô hiệu hóa tài khoản cũ và cấp 1 tài khoản Cursor Pro mới tinh ngay lập tức vào màn hình của bạn. Bạn có chắc chắn muốn thực hiện?"*.

---

#### 4. HÀNH VI TƯƠNG TÁC & UX (Interactions & Edge Cases)

##### 4.1. Quy trình đổi mới tài khoản tự động (Self-Service Recovery Flow)
1. Người dùng bấm `⚡ Kích hoạt đổi mới tài khoản tự động`.
2. Hệ thống chuyển sang màn hình Loading kèm thanh tiến trình động:
   - *[01s]*: Kiểm tra trạng thái tài khoản trên dịch vụ gốc.
   - *[03s]*: Xác nhận lỗi tài khoản hợp lệ với cam kết bảo hành.
   - *[06s]*: Trích xuất tài khoản dự phòng mới từ kho.
   - *[08s]*: Bàn giao tài khoản mới thành công lên màn hình và gửi bản sao qua email.
3. Người dùng nhận ngay tài khoản mới mà không cần chat với bất kỳ ai, gia tăng độ hài lòng lên mức tuyệt đối.

##### 4.2. Edge Cases (Xử lý giới hạn bảo hành)
- **Khách hàng cố tình lạm dụng nút đổi mới liên tục (Abuse Prevention)**:
  - Giới hạn: Mỗi đơn hàng chỉ được tự động đổi tối đa 2 lần trong 24 giờ.
  - Khi vượt quá hạn mức: Hiển thị thông báo thân thiện: *"Bạn đã thực hiện đổi tự động 2 lần hôm nay. Để bảo vệ an toàn cho đơn hàng của bạn, vui lòng liên hệ trực tiếp Kỹ thuật viên hỗ trợ qua Telegram để được kiểm tra chuyên sâu."* Kèm nút kết nối trực tiếp với nhân viên kỹ thuật.

---

## 3. QUY CHUẨN TỐI ƯU HÓA THIẾT BỊ DI ĐỘNG (MOBILE OPTIMIZATION & THUMB ZONE)

Căn cứ vào dữ liệu nghiên cứu từ tài liệu gốc (Thiết bị di động chiếm 60-65% truy cập nhưng tỷ lệ chuyển đổi thường chỉ đạt 2.8% so với 4.8% trên Desktop do ma sát ngón tay):

### 3.1. Thiết kế vùng chạm ngón cái (The Natural Thumb Zone)
```text
+-----------------------+
|  VÙNG KHÓ VỚI (HARD)  |  <- Đặt Brand Logo, Badge thông tin tĩnh
|                       |
+-----------------------+
|  VÙNG TỰ NHIÊN (NAT)  |  <- Đặt Thẻ chọn gói, Thông số kỹ thuật, Giá
|                       |
+-----------------------+
|  VÙNG DỄ CHẠM NHẤT    |  <- ĐẶT STICKY CTA BUTTON "MUA NGAY (30S)"
|  (EASY THUMB ZONE)    |     Kích thước tối thiểu 52px chiều cao
+-----------------------+
```

### 3.2. Sticky Bottom CTA Bar (Thanh hành động cố định chân trang)
- Trên mobile viewport (`width < 768px`), khi người dùng cuộn xem sản phẩm vượt quá màn hình đầu tiên, một thanh Bar cố định sẽ trượt lên từ chân trang (Slide-up 200ms):
  - Bên trái: Tên gói vắn tắt + Giá tiền (`Cursor Pro - 249.000 ₫`).
  - Bên phải: Nút bấm `⚡ Mua ngay` (Chiều cao `48px`, tap target `full-height`, màu `--primary-blue`).
  - Đã được chứng minh tăng **14% tỷ lệ chuyển đổi** trên thiết bị di động.

### 3.3. Quy chuẩn kích thước Tap Target & Bàn phím ảo
- **Tap Targets**: Tất cả các phần tử có thể click/chạm (Buttons, Links, Checkboxes, Tabs) phải có kích thước tối thiểu `44x44 pixel`, khoảng cách giữa các phần tử tối thiểu `8px` để chống chạm nhầm.
- **Tối ưu hóa bàn phím ảo (Virtual Keyboard UX)**:
  - Trường Email: Gắn thẻ HTML `type="email" inputmode="email" autocomplete="email"` để tự động bật bàn phím có sẵn ký tự `@` và `.com`.
  - Trường OTP / Mã PIN: Gắn thẻ `type="tel" inputmode="numeric" pattern="[0-9]*"` để chỉ kích hoạt bàn phím số lớn, tránh phiền hà chuyển phím.

---

## 4. KỊCH BẢN XỬ LÝ LỖI TOÀN HỆ THỐNG & TRẠNG THÁI BIÊN (GLOBAL SYSTEM EDGE CASES)

| Tình huống (Edge Case) | Trạng thái giao diện (UI State) | Hành vi tương tác & Giải pháp UX |
| :--- | :--- | :--- |
| **Mất kết nối mạng đột ngột (Network Offline)** | Toaster màu đỏ cam xuất hiện cố định đỉnh màn hình: `Mất kết nối mạng`. Nút CTA chuyển sang Disabled. | Tự động thử kết nối lại (Auto-reconnect) mỗi 3 giây. Lưu toàn bộ trạng thái form vào LocalStorage, khi có mạng trở lại tự phục hồi không bắt người dùng gõ lại. |
| **Hết hàng đột ngột khi đang ở màn Checkout (Race Condition)** | Modal thông báo khẩn: `Rất tiếc, tài khoản vừa được mua bởi khách khác`. | Đưa ra 2 lựa chọn ngay tại chỗ: (1) Đổi sang gói tương đương (như Claude Pro thay cho ChatGPT Plus) với voucher giảm thêm 10%, hoặc (2) Hoàn tiền tự động tức thì vào tài khoản nguồn trong 30 giây. |
| **Lỗi phản hồi từ Cổng thanh toán (Gateway 502/504 Timeout)** | Màn hình chờ chuyển sang trạng thái: `Đang kiểm tra giao dịch với Ngân hàng...` kèm spinner nhẹ. | Không hiển thị thông báo lỗi chung chung gây hoang mang. Cung cấp mã tra cứu giao dịch và nút `Tôi đã bị trừ tiền` để mở form hỗ trợ ưu tiên lập tức. |
| **Khách hàng nhập nhầm Email nhận hàng** | Tại Trang 4 (Bàn giao), dưới email hiển thị dòng link: `Nhập sai email? Nhấn để sửa và gửi lại`. | Cho phép sửa email 1 lần duy nhất trong vòng 15 phút đầu sau khi mua, yêu cầu xác thực bằng mã giao dịch ngân hàng để bảo mật. |
| **Độ trễ tải trang vượt quá 2.0s (Slow Connection)** | Hiển thị Skeleton Screen (Khung xương xám shimmer) thay vì màn hình trắng hoặc spinner quay tròn. | Duy trì cảm giác trang web đang hoạt động tích cực, giảm tỷ lệ thoát trang (Bounce rate) theo nghiên cứu của Google. |

---

## 5. BẢNG CHECKLIST BÀN GIAO CHO FRONTEND DEVELOPER

- [ ] **CSS Framework / Setup**: Khởi tạo biến CSS chuẩn 100% theo bảng Design System Tokens ở Mục 1.2.
- [ ] **Font Setup**: Tích hợp Google Fonts `Inter` (UI) và `JetBrains Mono` (Code/Price/Credentials).
- [ ] **Accessibility (A11y)**: Đảm bảo độ tương phản màu chữ/nền tối thiểu 4.5:1 (WCAG AA).
- [ ] **Performance Goal**:
  - First Contentful Paint (FCP) < 0.8s.
  - Largest Contentful Paint (LCP) < 1.5s.
  - Cumulative Layout Shift (CLS) = 0.
- [ ] **Responsive Breakpoints**:
  - Mobile: `< 768px` (Kích hoạt Sticky Bottom Bar & Thumb Zone).
  - Tablet: `768px - 1024px`.
  - Desktop: `> 1024px` (Kích hoạt 12-column Grid & Sticky Summary Box).
- [ ] **State Management**: Quản lý giỏ hàng/phiên thanh toán qua LocalStorage để chống mất dữ liệu khi F5.
