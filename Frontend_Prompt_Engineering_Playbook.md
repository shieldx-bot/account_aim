# FRONTEND PROMPT ENGINEERING PLAYBOOK
## DỰ ÁN: NỀN TẢNG THƯƠNG MẠI ĐIỆN TỬ TÀI KHOẢN AI PRO CHO DEVELOPERS (AIPRO.DEV)
*Standardized Prompt Architecture for High-Fidelity AI Generation (Claude 3.7 / ChatGPT-4o / Cursor)*

---

## 1. PHÂN TÍCH TÀI LIỆU & NỀN TẢNG KỸ THUẬT (ARCHITECTURAL FOUNDATION)

### 1.1. Mục Tiêu Hệ Thống & Triết Lý UX
- **Đối tượng cốt lõi**: Alex "The 10x Engineer" (Kỹ sư phần mềm, DevOps, AI researcher). Yêu cầu tốc độ cao (< 1.5s), giá minh bạch (No Hidden Fees), nhận license tức thì (< 30s).
- **Mô hình chuyển đổi**: "Hành lang chuyển đổi một chiều" (One-Way Corridor UX) kết hợp "Máy bơm xăng tốc độ cao" (High-speed Fuel Pump Flow) — **100% Guest Checkout** chỉ với 1 trường Email duy nhất, triệt tiêu hoàn toàn form đăng ký rườm rà.
- **Tự phục vụ khép kín (Self-Service)**: Bàn giao License Vault bảo mật, Self-test trạng thái tài khoản 1-click, và Đổi mới tài khoản tự động trong 60 giây khi có sự cố.

---

### 1.2. Trích Xuất Design System Tokens

#### A. Bảng màu (Color Tokens - Dark-Mode-First High-Tech Sleek)
```css
:root {
  /* Surface & Backgrounds */
  --bg-canvas: #08090C;       /* Nền trang tối chủ đạo (Deep Space Dark) */
  --bg-surface: #101318;      /* Nền Card, Container, Bảng danh mục */
  --bg-elevated: #181C24;     /* Modal, Dropdown, Hover card background */

  /* Borders */
  --border-subtle: #232936;   /* Đường viền ngăn cách nhẹ */
  --border-focus: #0066FF;    /* Viền khi focus/active */

  /* Brand & Accents */
  --primary-blue: #0066FF;    /* Electric Blue chủ đạo */
  --primary-hover: #257CFF;   /* Hover nút bấm chính */
  --accent-cyan: #00F0FF;     /* Neon Cyan (Badge Pro, Icon highlight) */

  /* Typography Colors */
  --text-primary: #F3F4F6;    /* Tiêu đề, số liệu chính (High contrast) */
  --text-secondary: #9CA3AF;  /* Nhãn form, mô tả phụ */
  --text-muted: #6B7280;      /* Chữ mờ, placeholder, timestamp */

  /* Semantic Feedback */
  --status-success: #10B981;  /* Thành công, sẵn sàng giao, SLA active */
  --status-warning: #F59E0B;  /* Cảnh báo ít hàng, đếm ngược giữ slot */
  --status-error: #EF4444;    /* Lỗi validate, thanh toán thất bại */
}
```

#### B. Kiểu chữ (Typography)
- **UI & Body**: `Inter`, `-apple-system`, `BlinkMacSystemFont`, `sans-serif` (Độ tương phản cao, tối ưu retina).
- **Code, Giá tiền, License Vault & CLI**: `JetBrains Mono`, `Fira Code`, `monospace` (Tạo cảm giác dev-native).
- **Type Scale**:
  - `Display 1`: 44px / 52px / 700 (Hero Title)
  - `Heading 1`: 32px / 40px / 700 (Section Title)
  - `Heading 2`: 24px / 32px / 600 (Card & Modal Title)
  - `Heading 3`: 18px / 26px / 600 (Sub-headers)
  - `Body Regular`: 15px / 22px / 400 | `Body Medium`: 15px / 22px / 500
  - `Code / Mono`: 14px / 20px / 500 | `Caption / Tag`: 12px / 16px / 600

#### C. Quy chuẩn Khoảng cách & Grid (Spacing & Thumb Zone)
- **Base Grid**: 8-point system (`4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `48px`, `64px`).
- **Breakpoints**: Mobile `< 768px` (Thumb Zone & Sticky Bottom CTA), Tablet `768px - 1024px`, Desktop `> 1024px` (12-column Grid, max 1200px).
- **Tap Targets**: Tối thiểu `44x44px` trên mobile; inputs có `inputmode` chuẩn (`email`, `numeric`).

---

### 1.3. Global Technical Constraints (Áp dụng cho mọi Prompt)
- **Tech Stack**: React 18+ (Vite) + TypeScript (Strict Mode) + Tailwind CSS + Lucide React Icons.
- **Coding Style**: Component hoá dạng Modular, phân tách rõ ràng Types, Mock Data, Presentation, Handlers và Observability Hooks. Tuyệt đối không dùng thư viện UI nặng (như Ant Design, MUI). Dùng pure Tailwind CSS classes kết hợp CSS variables.
- **Output Constraint**: Chỉ xuất các khối mã nguồn hoàn chỉnh, có comment chỉ dẫn logic then chốt, không kèm lời chào hỏi hay diễn giải đàm thoại rườm rà.
- **Production Standard**: Mọi component phải bao hàm cơ chế bắt lỗi (Error Boundary / Fallback), gắn mã sự kiện đo lường (Telemetry DataLayer), mã định danh giao dịch (Correlation ID / Idempotency Key) và chẩn đoán hỗ trợ vận hành (Support Diagnostics).

---

### 1.4. Phân Tích Khoảng Trống Code: Khách Hàng (Customer) vs Người Vận Hành (Operator)
Một trang web demo thông thường chỉ làm giao diện đẹp (Happy Path UI). Để trở thành sản phẩm thực tế chịu tải, bảo mật và vận hành trơn tru, prompt cần bổ sung các tầng mã nguồn sau:

| Trục Tính Năng | Góc Nhìn Khách Hàng (Customer UX & Security) | Góc Nhìn Người Vận Hành (DevOps, CSKH, Marketing) |
| :--- | :--- | :--- |
| **Chịu Lỗi & Phục Hồi (Resilience)** | - React Error Boundary (chống sập trắng trang).<br>- Tự phục hồi dữ liệu từ LocalStorage khi rớt mạng/F5.<br>- Khóa nút (Disable/Idempotency) chống trừ tiền 2 lần. | - Client-side Error Breadcrumbs (Sentry).<br>- Thống kê tỷ lệ lỗi API, timeout cổng thanh toán.<br>- Cơ chế Dead-letter queue cho các webhook thất bại. |
| **Bảo Mật & Chống Gian Lận (Security)** | - Che dấu mật khẩu, làm sạch clipboard sau 60s.<br>- XSS Sanitization cho mọi input và query parameters.<br>- Cảnh báo kết nối không an toàn hoặc phishing. | - Honeypot fields bẫy bot tự động cào quét.<br>- Rate-limiting & Throttling (chống spam OTP & đổi tài khoản).<br>- Audit log: Ghi nhận IP, User-Agent, Fingerprint nghi vấn. |
| **Theo Dõi Chuyển Đổi (Analytics)** | - Không bị giật lag bởi các script tracking rườm rà.<br>- Thông báo chính sách cookie/quyền riêng tư minh bạch. | - Chuẩn hóa DataLayer (GA4/GTM/PostHog): `view_item`, `begin_checkout`, `purchase`, `warranty_claimed`.<br>- Funnel drop-off analytics để tối ưu tỷ lệ chuyển đổi. |
| **Hỗ Trợ Kỹ Thuật (CSKH / Support)** | - 1-Click sao chép toàn bộ thông tin gói và mã lỗi.<br>- Nút chuyển hướng Telegram có sẵn nội dung mẫu. | - **Debug Diagnostic Bundle**: Xuất file JSON gồm Client Logs, OS/Browser, Failed Step để CSKH đọc ngay lập tức.<br>- Mã đơn hàng đi kèm `Correlation-ID` tra cứu log backend. |
| **Điều Khiển Từ Xa (Remote Ops)** | - Nhận thông báo bảo trì hoặc kênh thanh toán thay thế mượt mà, không bị hoang mang. | - **Feature Flags / Remote Kill-Switch**: Tắt khẩn cấp cổng VietQR nếu ngân hàng lỗi mà không cần redeploy code.<br>- Banner thông báo khẩn cấp đẩy từ CMS/Config. |

---

### 1.5. Danh Sách Các Màn Hình Triển Khai Toàn Diện (Full Production Page Inventory)

#### A. Phân Hệ Khách Hàng (Customer-Facing One-Way Corridor):
1. **Trang 1: Trang Chủ & Danh Mục Chuyển Đổi Nhanh (`/` - Landing & Fast Catalog Page)**
2. **Trang 2: Trang Chi Tiết & Tùy Biến Gói Dịch Vụ (`/product/:slug` - Product Configurator Page)**
3. **Trang 3: Trang Thanh Toán Siêu Tốc (`/checkout` - One-Step Frictionless Checkout Page)**
4. **Trang 4: Trang Bàn Giao Tức Thì & Quản Lý License (`/order/success/:orderId` - Fulfillment & Vault Page)**
5. **Trang 5: Trang Tra Cứu Đơn Hàng & Tự Phục Vụ Bảo Hành (`/lookup` & `/warranty` - Self-Service Warranty Page)**

#### B. Phân Hệ Quản Trị & Vận Hành Doanh Nghiệp (Back-Office & Operator Suite):
6. **Trang 6: Trung Tâm Quản Lý Đơn Hàng & Đối Soát Webhook Ngân Hàng (`/admin/orders` - Order Reconciliation Dashboard)**
7. **Trang 7: Quản Trị Kho Tài Khoản & Nhập Hàng Tự Động Batch Import (`/admin/inventory` - Inventory Management)**
8. **Trang 8: Trung Tâm Xử Lý Bảo Hành & Giám Sát Khiếu Nại SLA (`/admin/warranty` - SLA Escalation Center)**

#### C. Phân Hệ Pháp Lý, Tuân Thủ & Hỗ Trợ Kỹ Thuật (Compliance, System & Docs Suite):
9. **Trang 9: Trung Tâm Điều Khoản, Cam Kết SLA & Chính Sách Hoàn Tiền (`/terms`, `/sla`, `/refund-policy`, `/privacy` - Legal Compliance Hub)**
10. **Trang 10: Bảng Theo Dõi Trạng Thái Hệ Thống & Trang 404 Developer Terminal (`/status` & `/404` - Live Status & CLI 404)**
11. **Trang 11: Tài Liệu Kỹ Thuật & Hướng Dẫn Kích Hoạt IDE Cho Developer (`/docs` & `/guides/:slug` - Developer Setup Guides)**

---

## 2. PLAYBOOK PROMPT CHI TIẾT CHO TỪNG TRANG

```
================================================================================
BỘ PROMPT 0: GLOBAL LAYOUT, THEME CONFIG & SHARED CONTEXT
================================================================================
```

### [Global Setup] Core Prompt
> **Mục đích**: Thiết lập cấu hình Tailwind Design Tokens, Global Types, AppContext và Main Layout trước khi dựng từng trang.

```markdown
You are a Principal Frontend Architect. Generate the foundation layer for the developer-centric AI account e-commerce platform "AIPro.dev".

### Global Technical Constraints:
- Tech Stack: React 18+ + TypeScript + Tailwind CSS + Lucide React.
- Coding Style: Modular, type-safe, strict zero-dependency outside pure Tailwind & Lucide.
- Output Constraint: Return ONLY clean code blocks for the specified files without conversational filler.

### Required Implementations:
1. `tailwind.config.ts`: Extend the Tailwind theme with our exact Design System Tokens:
   - Colors: canvas (#08090C), surface (#101318), elevated (#181C24), border-subtle (#232936), border-focus (#0066FF), primary-blue (#0066FF), primary-hover (#257CFF), accent-cyan (#00F0FF), text-primary (#F3F4F6), text-secondary (#9CA3AF), text-muted (#6B7280), status-success (#10B981), status-warning (#F59E0B), status-error (#EF4444).
   - Fonts: sans: ['Inter', 'sans-serif'], mono: ['JetBrains Mono', 'monospace'].
2. `src/types/index.ts`: Export core interfaces:
   - `Currency` ('VND' | 'USD'), `ProductPlan` (id, slug, name, brand, category, originalPrice, currentPrice, discountPercent, instantDelivery, stockCount, quotaFeatures, specs).
   - `OrderItem` (orderId, productSlug, planDuration, provisioningType, guestEmail, totalAmount, currency, paymentMethod, status, credentials, warrantyExpireDate).
3. `src/context/AppContext.tsx`: React Context managing:
   - Currency toggle (`VND`/`USD`) with localStorage persistence and exchange rate math (1 USD = 25,000 VND).
   - Active Cart / Order configuration state.
   - Network offline detection banner state.
   - Remote feature flags state (e.g. `isVietQREnabled`, `isMaintenanceMode`).
4. `src/components/layout/Header.tsx` & `Footer.tsx`:
   - Header: Sticky 64px, `backdrop-blur-md bg-canvas/85`, Logo `>_ AIPro.dev`, navigation links, currency switcher, and Ghost Button "Tra cứu đơn hàng" leading to `/lookup`.
   - Footer: Dark minimalist developer links (API Status, SLA 99.9%, Telegram 24/7, Warranty terms).
5. `src/utils/telemetry.ts` (Analytics & Observability Layer):
   - `trackEvent(eventName: string, payload: Record<string, unknown>)`: Standardized E-commerce dataLayer dispatcher (GA4 / GTM / PostHog).
   - `logErrorBreadcrumb(context: string, error: unknown, metadata?: Record<string, unknown>)`: Centralized error logging with Sentry/Datadog breadcrumb format and client correlation ID.
6. `src/components/common/ErrorBoundary.tsx` (Chống sập toàn trang):
   - React Error Boundary wrapping isolated routes/widgets. Displays sleek tech fallback UI with "Thử lại phần này" and "Sao chép log kỹ thuật".
7. `src/utils/diagnostics.ts` (Hỗ trợ CSKH 1-Click):
   - `exportSupportBundle(contextData: Record<string, unknown>)`: Packages OS, browser fingerprint, timestamp, route, error buffer, and order snapshot into a compact JSON string for 1-click Telegram CSKH escalation.
```

---

```
================================================================================
BỘ PROMPT 1: TRANG CHỦ & DANH MỤC CHUYỂN ĐỔI NHANH (PAGE 1)
================================================================================
```

### [Trang 1: Homepage & Fast Catalog] Core Prompt

#### Phase 1: Component Architecture & Mock Data
```markdown
Role: Senior TypeScript Engineer.
Task: Create the component architecture, TypeScript interfaces, and realistic mock dataset for Page 1: Homepage & Fast Catalog (`/`) of AIPro.dev.

### Technical Constraints:
- Tech Stack: React 18+ + TypeScript + Tailwind CSS.
- Coding Style: Strict types, immutable mock fixtures.
- Output: Clean TypeScript code blocks only.

### Requirements:
1. Define interfaces:
   - `ProductCardProps`: Product metadata, brand logo SVG path, category ('all' | 'coding' | 'llm' | 'design' | 'enterprise'), prices (VND and USD), feature badges ('Best for Devs' | 'Instant Delivery' | 'Sonnet 3.7 Ready'), stock status (`in_stock` | `low_stock` | `out_of_stock`), quota bullets (4 bullet points).
   - `CatalogFilterState`: activeCategory, searchQuery, sortOption.
2. Provide a realistic production-ready Mock Array of 8 AI Pro accounts:
   - Cursor Pro (1 Month / 3 Months, 249.000 ₫ / $9.99, 500 fast requests, Claude 3.7 Sonnet & GPT-4o, 42 accounts left).
   - Claude Pro (Sonnet 3.7 & Extended Thinking, 289.000 ₫ / $11.50, 18 accounts left).
   - ChatGPT Plus (GPT-4.5 & Canvas, 275.000 ₫ / $10.90, 25 accounts left).
   - GitHub Copilot Pro (VS Code / JetBrains, 199.000 ₫ / $7.90).
   - Midjourney Pro (Relax & Fast GPU Hours, 399.000 ₫ / $15.90).
   - JetBrains AI Assistant (Annual license, 350.000 ₫ / $14.00).
   - Perplexity Pro (Pro Search & Multi-model, 220.000 ₫ / $8.90).
   - OpenAI Team Workspace (5 seats, 1.250.000 ₫ / $49.00).
3. Export custom hook `useCatalogFilter(products)` to handle real-time search, category filtering, and count calculations.
```

#### Phase 2: UI Structure & Semantic Layout
```markdown
Role: Senior Frontend UI Architect.
Task: Build the semantic HTML5 layout and responsive Tailwind CSS grid for Page 1 (`/`) using AIPro.dev Design Tokens.

### Technical Constraints:
- Tech Stack: React 18+ + Tailwind CSS.
- Token Mapping: `--bg-canvas` (`bg-canvas`), `--bg-surface` (`bg-surface`), `--border-subtle` (`border-border-subtle`), `--primary-blue` (`bg-primary-blue`), fonts `font-sans` and `font-mono`.
- Layout: 12-column container max-w-[1200px], fully responsive (1 col mobile, 2 col tablet, 3 col desktop).
- Accessibility: Semantic `<header>`, `<main>`, `<section>`, `<article>`, `<nav>`, ARIA tabs for category filters, screen-reader headings.

### Page Sections to Implement:
1. `HeroSection`:
   - Delivery SLA Badge: `⚡ Auto Delivery < 30s | 100% Active Guarantee` (Cyan neon pill badge).
   - H1: "Tài Khoản AI Pro Chuẩn Cho Developers. Kích Hoạt Tức Thì."
   - Subtitle with high-contrast text-secondary.
   - `TerminalSimulator`: CLI box with Mac window buttons (red/yellow/green), typewriter animated text `$ npx ai-pro buy --tool=cursor-pro --instant`, and "Copy Command" button.
   - Social Proof Bar: "12,450+ lập trình viên tin dùng | Trustpilot 4.9/5" with 5 avatar bubbles.
2. `FilterSection`:
   - Centered horizontal pills bar with categories: All, AI Coding, LLMs & Reasoning, Design & Creative, Team / Enterprise.
   - Search input field with search icon (`ic_search.svg`) and instant clear button.
3. `ProductGridSection`:
   - 3-column responsive grid rendering `<ProductCard>` components.
   - Product Card layout: Brand SVG Logo (40x40px), Product Title, Platform Subtext, Price in `font-mono` (Current price, Strikethrough original price, Discount -50% badge), 4 Feature Checklist items with green checkmarks (`ic_check_circle.svg`), Primary CTA Button `⚡ Mua Siêu Tốc (Giao 30s)`.
4. `LiveStockBanner`:
   - Green pulsing radar dot (`animate-ping`), text "42 Tài khoản sẵn giao trong kho | Bảo hành 1-đổi-1 tự động".
5. `ComparisonMatrix` & `FaqAccordion`:
   - Clean developer table comparing features.
   - 5 FAQ items with expandable chevron accordions.
```

#### Phase 3: Micro-interactions & Visual Polish
```markdown
Role: Creative Frontend Engineer & Motion Specialist.
Task: Implement micro-interactions, CSS transitions, hover animations, and edge-case views for Page 1 (`/`).

### Requirements:
1. Hover & Focus States:
   - Product Card Hover: Smooth `transition-all duration-200 hover:-translate-y-1 hover:border-primary-blue hover:shadow-[0_12px_24px_rgba(0,0,0,0.5)]`.
   - Subtle Shimmer Effect on price badge when hovering the card.
   - Primary CTA Button: `hover:bg-primary-hover active:scale-[0.98] transition-transform`.
2. Terminal Simulator Interactions:
   - Auto typing effect cycling through 3 commands:
     `ai-pro buy --tool=cursor-pro`
     `ai-pro buy --tool=claude-3-7-sonnet`
     `ai-pro check --order=AIPRO-94820`
   - Copy Command Button: When clicked, copies snippet to clipboard, changes icon to `✓` and text to "Copied!" for 2000ms.
3. Edge Cases & States:
   - `EmptySearchState`: When no products match query, render Terminal with blinking cursor `_`, title "Không tìm thấy gói AI phù hợp", action button "Khôi phục bộ lọc", and link "Yêu cầu tài khoản riêng qua Telegram".
   - `OutOfStockCard`: If stockCount === 0, render disabled button "Tạm hết hàng - Đặt trước" with dark muted style (`bg-surface text-text-muted cursor-not-allowed`).
   - `NetworkOfflineToast`: Top fixed alert when window is offline.
```

#### Phase 4: Component Integration & Actions
```markdown
Role: Full-Stack React Engineer.
Task: Integrate state, routing, props wiring, and event handlers for Page 1 (`/`).

### Requirements:
1. State Management:
   - Connect currency state from `AppContext` to display dynamic `₫` or `$` for all product prices.
   - Connect search query, category filter tab change, and sort dropdown.
2. User Actions & Routing:
   - Click `⚡ Mua Siêu Tốc (Giao 30s)`: Store selected item in `AppContext` / `localStorage` and trigger instant drawer or navigate directly to `/checkout?plan={slug}`.
   - Click card title or "Chi tiết gói": Navigate to `/product/:slug`.
   - Click "Tra cứu đơn hàng" in header: Navigate to `/lookup`.
3. Performance & Clean Code:
   - Memoize filtered product lists with `useMemo`.
   - Ensure zero layout shift (CLS = 0) when switching categories.
   - Return the complete, runnable `HomePage.tsx` file combining all sub-components.
```

#### Phase 5: Production Resilience, Telemetry & Operator Diagnostics
```markdown
Role: Lead DevOps & Reliability Engineer.
Task: Inject production-grade telemetry, business analytics, error isolation, and operational hooks into Page 1 (`HomePage.tsx`).

### Requirements:
1. Business Telemetry (E-commerce DataLayer Tracking):
   - On page mount, dispatch `trackEvent('view_item_list', { item_list_name: 'AI Pro Catalog', items: products.map(...) })`.
   - When user clicks a product category tab, dispatch `trackEvent('filter_category_selected', { category: activeCategory })`.
   - When user clicks "⚡ Mua Siêu Tốc", dispatch `trackEvent('select_item', { item_id: slug, item_name: name, price: currentPrice, currency })`.
   - When user copies CLI command from TerminalSimulator, dispatch `trackEvent('cli_command_copied', { command })`.
2. Error Boundary & Fault Isolation:
   - Wrap the `ProductGridSection` inside an `<ErrorBoundary>` so that if a single product card crashes (e.g. malformed SVG or pricing math error), the Hero Section and Header remain fully functional.
   - Log error breadcrumb using `logErrorBreadcrumb('HomePage_Catalog_Render', error)`.
3. Remote Operational Feature Flags:
   - Check `AppContext.featureFlags.announcementBanner`: If active from remote config, render top emergency announcement ("Bảo trì hệ thống thanh toán lúc 02:00 sáng") with dismiss action.
```

---

```
================================================================================
BỘ PROMPT 2: TRANG CHI TIẾT & TÙY BIẾN GÓI DỊCH VỤ (PAGE 2)
================================================================================
```

### [Trang 2: Product Detail & Plan Customizer] Core Prompt

#### Phase 1: Component Architecture & Mock Data
```markdown
Role: Senior TypeScript Engineer.
Task: Architect states, data models, and mock configurations for Page 2: Product Detail & Plan Customizer (`/product/:slug`).

### Technical Constraints:
- Tech Stack: React 18+ + TypeScript + Tailwind CSS.
- Coding Style: Strict typing, modular hooks.
- Output: TypeScript interfaces and configuration datasets.

### Requirements:
1. Define interfaces:
   - `ProvisioningType`: `'invite_email'` (Nâng cấp chính chủ) | `'pre_created'` (Tài khoản cấp sẵn).
   - `DurationOption`: `{ months: 1 | 3 | 6 | 12; label: string; discountPercent: number; monthlyEquivalent: number; isGiftExtraMonth?: boolean; }`.
   - `ProductDetail`: Product specs (Model limit, Context window, Fast quota, Multi-device, SLA terms, Provisioning stock status).
   - `ConfigurationState`: `{ provisioningType: ProvisioningType; targetEmail: string; duration: DurationOption; guestEmail: string; }`.
2. Provide full mock detail configurations for `cursor-pro` and `claude-pro`:
   - Feature specs list (Quota: 500 Fast Requests/mo, 200K Tokens Context, Sonnet 3.7 & GPT-4o, Multi-device sync).
   - SLA guarantees (1-to-1 replacement, Zero password retention, 24/7 priority Telegram).
   - Dynamic price calculation helper function that computes Base Price, Duration Discount, Dev Voucher, and Final Price.
```

#### Phase 2: UI Structure & Semantic Layout
```markdown
Role: Senior Frontend UI Architect.
Task: Build the 2-column asymmetric desktop and responsive mobile layout for Page 2 (`/product/:slug`).

### Layout Blueprint (Desktop: 7 Cols Left, 5 Cols Right Sticky):
- Breadcrumbs: `Trang chủ > AI Coding > [Tên Sản Phẩm]`.
- **Left Column (7 Columns - Product Specs & Options)**:
  1. Product Header: Brand Icon (48x48px), Verified Partner Badge, Heading 1, Short technical description.
  2. `ProvisioningSelector`: 2 horizontal Segmented Radio Cards:
     - Card A: "Nâng cấp trực tiếp trên Email cá nhân" (No chat history loss, 100% privacy).
     - Card B: "Tài khoản tạo sẵn" (Instant delivery in 10s, pre-activated).
     - Conditional Input Field: If Card A selected, expand an input for "Email cá nhân cần nâng cấp" with RFC 5322 regex validation.
  3. `DurationGrid`: 4-button selector (1 Tháng, 3 Tháng - Tiết kiệm 15%, 6 Tháng, 12 Tháng - Tặng 1 tháng) with monthly price breakdown.
  4. `DeveloperSpecsSheet`: Clean key-value spec table (Tokens, Models, Rate Limits).
  5. `SlaAccordion`: Warranty and refund guarantee details.
- **Right Column (5 Columns - Sticky Summary Box)**:
  - Fixed position (`sticky top-24`).
  - Order breakdown: Package Name, Provisioning Type, Duration, Original Price (strikethrough), Dev Discount (green text), Taxes & Fees (`+ 0 ₫`).
  - Total Price: Highlighted in `font-mono text-3xl font-bold text-text-primary`.
  - Guest Email Input Field (`your.email@company.com`) with instant RFC 5322 validation.
  - Primary CTA Button: `⚡ Thanh Toán Ngay (30s)`.
  - Trust Badges: 100% Refund SLA, 30s Delivery, No Password Storage.
- **Mobile View (`< 768px`)**:
  - Single column stack + `StickyBottomBar` (Slide-up 200ms when scrolled: Summary price on left, CTA "Mua ngay" on right).
```

#### Phase 3: Micro-interactions & Visual Polish
```markdown
Role: Motion & UX Specialist.
Task: Code smooth state transitions, animations, and edge-case behaviors for Page 2 (`/product/:slug`).

### Interactions:
1. Dynamic Price Odometer Animation:
   - When switching durations (e.g. 1 Month -> 12 Months), animate the total price number with a 250ms rolling odometer effect instead of an abrupt text swap.
2. Radio Card Expansion:
   - When choosing "Nâng cấp chính chủ Email", the personal email input field must slide down smoothly (`max-h-20 opacity-100 transition-all duration-300`).
3. Real-time Guest Email Validation Feedback:
   - Valid email: Right-hand checkmark icon (`ic_check_circle.svg`) with green outline.
   - Invalid email: Red outline (`border-status-error`) and subtext "Vui lòng nhập đúng email để nhận thông tin license".
4. Edge Case Handling:
   - If `out_of_stock_invite = true`: Disable Card A, show badge "Tạm hết slot mời hôm nay - Vui lòng chọn Tài khoản cấp sẵn".
   - Company email spam warning note: Small helper text "Nên dùng Gmail cá nhân để tránh bị bộ lọc spam của công ty chặn thư kích hoạt".
```

#### Phase 4: Component Integration & Actions
```markdown
Role: Full-Stack React Engineer.
Task: Integrate state handlers, URL parameter syncing, and navigation for Page 2 (`/product/:slug`).

### Logic & Wiring:
1. Hooks:
   - Read slug from `useParams()`. Fallback to 404 or default product if invalid.
   - Manage `configState` with `useReducer` or unified `useState`.
2. Button Handlers:
   - Radio buttons toggle provisioning mode and clear/retain custom email.
   - Duration button selection recalculates total amount.
   - Form Submission on CTA `⚡ Thanh Toán Ngay`:
     - Validate guest email. If empty or invalid, auto-focus input with shake animation.
     - If valid, write configuration to `AppContext` and navigate to `/checkout`.
3. Return the complete, modular `ProductPage.tsx` file ready to run.
```

#### Phase 5: Production Readiness, Telemetry & Anti-Abuse Hooks
```markdown
Role: Lead DevOps & Reliability Engineer.
Task: Integrate e-commerce funnel telemetry, form state persistence, bot protection, and error tracking into Page 2 (`ProductPage.tsx`).

### Requirements:
1. Business Telemetry (E-commerce Funnel Tracking):
   - On mount, dispatch `trackEvent('view_item', { item_id: product.slug, item_name: product.name, price: currentPrice, currency })`.
   - When duration is changed, dispatch `trackEvent('customize_plan_duration', { duration_months: duration.months, price: finalPrice })`.
   - On clicking CTA "⚡ Thanh Toán Ngay", dispatch `trackEvent('begin_checkout', { item_id: product.slug, provisioning_type: provisioningType, duration_months: duration.months, total_amount: finalPrice, guest_email: sanitizedEmail })`.
2. Form State Auto-Persistence (Frictionless Recovery):
   - Save active `configState` into `sessionStorage` keyed by `aipro_product_config_${slug}`.
   - On component mount, restore previously configured options so the user doesn't lose selections after page refresh.
3. Bot Protection & Anti-Spam:
   - Include a hidden Honeypot input field (`name="company_tax_id" style={{ display: 'none' }}`). If filled by a bot, silently reject submission.
4. Error Isolation:
   - Wrap the `StickySummaryBox` in `<ErrorBoundary>` to ensure payment button logic failures are isolated and logged via `logErrorBreadcrumb('ProductPage_Summary_Box', error)`.
```

---

```
================================================================================
BỘ PROMPT 3: TRANG THANH TOÁN SIÊU TỐC (PAGE 3)
================================================================================
```

### [Trang 3: Ultra-Fast Guest Checkout] Core Prompt

#### Phase 1: Component Architecture & Mock Data
```markdown
Role: Senior TypeScript Engineer.
Task: Build data contracts, payment interfaces, and mock transaction logic for Page 3: One-Step Frictionless Guest Checkout (`/checkout`).

### Technical Constraints:
- Tech Stack: React 18+ + TypeScript + Tailwind CSS.
- Output: Strict types, state models, and mock webhook simulator.

### Requirements:
1. TypeScript Interfaces:
   - `PaymentMethod`: `'vietqr'` | `'stripe_card'` | `'crypto_usdt'`.
   - `VietQRData`: `{ bankName: string; accountNumber: string; accountHolder: string; amount: number; transferMemo: string; qrCodeUrl: string; }`.
   - `CheckoutSession`: `{ sessionId: string; orderId: string; guestEmail: string; totalAmount: number; currency: 'VND' | 'USD'; expiresAt: number; paymentStatus: 'pending' | 'processing' | 'success' | 'failed' | 'expired'; }`.
2. Mock Payment Generator:
   - Function `generateVietQRData(orderId, amount)` returning bank details (MB Bank, STK: 99998888AI, Memo: `AIPRO` + 5 random digits).
   - Mock WebSocket / Polling simulator: Helper function that simulates bank payment success after 8 seconds or via a hidden "Simulate Success (Dev Mode)" trigger button.
```

#### Phase 2: UI Structure & Semantic Layout
```markdown
Role: Senior Frontend UI Architect.
Task: Code the distraction-free checkout layout for Page 3 (`/checkout`) using AIPro.dev Design Tokens.

### Structural Requirements (Zero Distraction / High-Speed Fuel Pump):
- **Minimalist Header**: Logo `>_ AIPro.dev` + 256-bit SSL Padlock Security Badge (`ic_lock_ssl.svg` + "Thanh toán bảo mật SSL 256-bit"). No general navigation links to prevent exit bounce.
- **2-Column Checkout Layout (6:6 or 7:5 Desktop, 1 Col Mobile)**:
  - **Left Column (Payment Information & Methods)**:
    - Step 1: `Guest Email Input` (Mandatory, 48px height, email icon, real-time validation).
    - Step 2: `PaymentMethodTabs` (3 Tabs: `VietQR Tự Động` with VietQR badge, `Thẻ Quốc Tế` with Visa/Mastercard/Stripe logos, `Crypto USDT` with Tether logo).
    - `VietQRContainer`:
      - Dynamic QR Code (220x220px) on clean white card container with rounded corners.
      - 3 Transfer Information Rows: Ngân hàng thụ hưởng, Số tài khoản, Số tiền chính xác, Nội dung chuyển khoản chứa mã đơn hàng (e.g. `AIPRO-84920`).
      - Copy Buttons beside each row (`ic_copy_default.svg`).
      - Radar Pulse Live Status: "Đang chờ ngân hàng xác nhận giao dịch... ⚡ Tự động chuyển trang khi nhận tiền".
    - `StripeCardContainer` & `CryptoContainer` views for alternative tabs.
  - **Right Column (Order Summary & Session Timer)**:
    - `OrderTimerCountdownWidget`: 10-Minute countdown clock (`09:59` -> `00:00`) in `font-mono text-status-warning` with real-time shrinking progress bar.
    - Package summary card (Name, duration, provisioning mode, SLA delivery < 30s).
    - Pricing breakdown (Subtotal, Dev Discount, VAT/Fees: 0 ₫, Total Amount in 32px font-mono).
    - Guarantee Checklist: 100% Refund Guarantee, 90-day 1-to-1 warranty, Instant License Vault.
```

#### Phase 3: Micro-interactions & Visual Polish
```markdown
Role: Motion & UX Specialist.
Task: Implement copy feedback, countdown mechanics, radar pulse animation, and webhook success transitions for Page 3 (`/checkout`).

### Micro-interactions & Polish:
1. Fast Copy Action:
   - Clicking "Copy STK" or "Copy Nội Dung" invokes `navigator.clipboard.writeText()`.
   - Button immediately transforms into green checkmark (`ic_copy_success.svg`) and displays "✓ Đã sao chép" for exactly 2000ms.
   - For amount, copy plain integer numbers without dots or currency symbols (e.g., `749000`).
2. Radar Pulse Effect:
   - Add expanding cyan/blue radar waves around the QR code container (`animate-ping opacity-25`) to signify live listening.
3. Timer Countdown & Expiration State:
   - When timer reaches `00:00`:
     - Apply `backdrop-blur-sm bg-canvas/80` overlay over the QR code.
     - Display warning icon and message: "Phiên thanh toán đã hết hạn để đảm bảo giữ đúng tỷ giá".
     - Render primary button "🔄 Tạo mã thanh toán mới".
4. Success Webhook Transition:
   - When payment succeeds:
     - Play subtle audio chime.
     - Display fullscreen or card scale animation with large green checkmark: "✓ ĐÃ NHẬN THANH TOÁN!".
     - Automatically redirect to `/order/success/:orderId` after 1200ms without requiring user clicks.
```

#### Phase 4: Component Integration & Actions
```markdown
Role: Full-Stack React Engineer.
Task: Wire checkout state, timer tick logic, clipboard helpers, and auto-redirect for Page 3 (`/checkout`).

### Integration Tasks:
1. Timer Hook:
   - Use `Date.now()` timestamp difference to prevent timer desync when user switches browser tabs.
2. Webhook Listener:
   - Simulate WebSocket / Polling every 2000ms checking payment status against mock backend.
   - Provide a small floating developer badge `[Dev: Simuler Payé]` for instant testing.
3. Edge Case:
   - Insufficient payment warning modal (e.g. customer transferred 700k instead of 749k): Display warning toast with missing amount (49k) and QR to pay difference.
4. Export the complete, production-ready `CheckoutPage.tsx` file.
```

#### Phase 5: Idempotency, Gateway Failover & Diagnostic Telemetry
```markdown
Role: Lead DevOps & Payments Reliability Engineer.
Task: Harden Page 3 (`CheckoutPage.tsx`) with payment idempotency, gateway failover kill-switches, audit logging, and CSKH escalation hooks.

### Requirements:
1. Payment Idempotency & Duplicate Prevention:
   - Generate an `idempotencyKey` (using `crypto.randomUUID()`) pinned to the `orderId`. Send this header with any payment creation or confirmation request to prevent race conditions and duplicate orders.
   - Disable payment generation buttons while a request is in flight (`isSubmitting === true`).
2. Remote Gateway Kill-Switch & Failover:
   - Check `AppContext.featureFlags.gateways`: If `vietqr` is marked inactive by remote config, automatically select `stripe_card` as default and show an informative badge: "Cổng VietQR đang bảo trì định kỳ - Vui lòng dùng Thẻ hoặc Crypto".
3. Polling Timeout & Diagnostic CSKH Escalation:
   - If polling reaches 60s without webhook confirmation: Display a calm diagnostic widget: "Hệ thống đang kiểm tra giao dịch với ngân hàng...".
   - Include button "Đã bị trừ tiền? [Báo Kỹ Thuật Viên Telegram]" which automatically calls `exportSupportBundle()` and generates a pre-formatted Telegram deep link containing `{ orderId, amount, transferMemo, timestamp }`.
4. Business Telemetry (Funnel Analytics):
   - Dispatch `trackEvent('checkout_viewed', { order_id: orderId, amount: totalAmount, currency })`.
   - Dispatch `trackEvent('payment_method_selected', { method: activeTab })`.
   - On timer expiration, dispatch `trackEvent('checkout_timer_expired', { order_id: orderId })`.
   - On successful webhook detection, dispatch `trackEvent('purchase', { transaction_id: orderId, value: totalAmount, currency, items: [...] })`.
```

---

```
================================================================================
BỘ PROMPT 4: TRANG BÀN GIAO TỨC THÌ & QUẢN LÝ LICENSE (PAGE 4)
================================================================================
```

### [Trang 4: Instant Delivery & Account Vault] Core Prompt

#### Phase 1: Component Architecture & Mock Data
```markdown
Role: Senior TypeScript Engineer.
Task: Architect credentials security models, export data formatters, and mock delivery states for Page 4: Instant Delivery & Account Vault (`/order/success/:orderId`).

### Technical Constraints:
- Tech Stack: React 18+ + TypeScript + Tailwind CSS.
- Output: Secure credential interfaces and mock fulfillment generators.

### Requirements:
1. Define interfaces:
   - `AccountCredential`: `{ email: string; password?: string; accessToken?: string; recoveryCode2FA?: string; inviteLink?: string; expiresAt: string; warrantyDaysLeft: number; orderId: string; productName: string; }`.
   - `AccountHealthStatus`: `'idle' | 'testing' | 'active' | 'flagged'`.
2. Mock Fulfillment Dataset:
   - Pre-created Account payload: Email (`cursor.dev.pro92@gmail.com`), Password (`a!9Xk#mP928Lq`), 2FA Secret (`JBSWY3DPEHPK3PXP`), Expire date (90 days from today).
   - JSON / `.env` export template formatter: Function returning downloadable file blobs for `.json` and `.env` format.
```

#### Phase 2: UI Structure & Semantic Layout
```markdown
Role: Senior Frontend UI Architect.
Task: Build the high-security Credentials Vault card and single-column centered layout for Page 4 (`/order/success/:orderId`).

### Layout Structure (Single-Column Focus, Max-width 840px, Centered):
1. `SuccessBanner`:
   - Celebration badge with soft confetti glow (`img_success_confetti.png`).
   - Large green checkmark circle (`ic_check_circle.svg`).
   - H1: "Thanh Toán Thành Công! Tài Khoản Của Bạn Đã Sẵn Sàng."
   - Sub-bar: Order ID `#AIPRO-94820` | Delivery SLA: 18 giây.
2. `CredentialsVaultCard`:
   - High-tech glowing card with dual cyan neon borders (`border border-accent-cyan/30 shadow-[0_0_30px_rgba(0,240,255,0.1)]`).
   - Row 1: Account Email / Service ID with individual 1-click Copy button.
   - Row 2: Password / Access Token masked as `••••••••••••••` with Eye Toggle button (Show/Hide) and Copy button.
   - Row 3: 2FA Backup Secret Key with Copy button.
   - Action Button Row:
     - Primary: "🚀 Mở Ứng Dụng Ngay (Open Tool)" (direct link to service).
     - Secondary: "💾 Tải file Credentials (.json / .env)".
     - Ghost: "📋 Sao chép toàn bộ định dạng Markdown".
3. `AutomatedHealthCheckWidget`:
   - "Kiểm tra tình trạng hoạt động tài khoản ngay" with live test runner.
4. `InstantPasswordSetupWidget`:
   - Frictionless password setup form: "Đặt mật khẩu nhanh để tra cứu đơn cho các lần sau" (Password input + Save button).
5. `DeveloperQuickSetupGuide`:
   - Step 1: Sign out existing account.
   - Step 2: Log in with credentials above.
   - Step 3: Verify subscription active in settings.
6. `WarrantyEscalationBanner`:
   - 90-Day 1-to-1 auto warranty notice + Telegram 24/7 technical hotline button.
```

#### Phase 3: Micro-interactions & Visual Polish
```markdown
Role: Motion & UX Specialist.
Task: Implement masked password reveal, copy toast, export triggers, and simulated health verification for Page 4 (`/order/success/:orderId`).

### Interactions & Polish:
1. Password Eye Toggle:
   - Clicking eye icon (`ic_eye_show.svg` / `ic_eye_hide.svg`) smoothly switches between masked bullets and monospace plaintext with zero jump.
2. Download Credentials Action:
   - Generates and triggers automatic browser download of `aipro-credentials-AIPRO-94820.json` containing JSON structured credentials.
3. Automated Health Verification Runner:
   - When user clicks "Kiểm tra tình trạng tài khoản":
     - Button displays spinner for 2000ms ("Đang kết nối API kiểm tra session...").
     - Resolves to bright green badge: "🟢 Tài khoản Active 100% - Hạn mức Pro đã kích hoạt".
4. Copy Entire Markdown Action:
   - Copies formatted Markdown block to clipboard ready for pasting into Notion or Password Manager.
```

#### Phase 4: Component Integration & Actions
```markdown
Role: Full-Stack React Engineer.
Task: Wire parameters, file download triggers, clipboard helpers, and state handlers for Page 4 (`/order/success/:orderId`).

### Integration Requirements:
1. URL Param & Data Retrieval:
   - Read `orderId` from URL. Load details from `AppContext` or localStorage.
2. Form Submissions:
   - Instant password setup: Validates >= 8 chars and saves lookup hash to localStorage.
3. Edge Case:
   - If provisioningType === 'invite_email': Replace credentials fields with "Thư mời đã gửi đến hòm thư của bạn" progress stepper and button "Mở hộp thư nhận lời mời".
4. Output the complete `DeliveryPage.tsx` file.
```

#### Phase 5: Security Hardening, Audit Trail & Support Bundle
```markdown
Role: Lead Security & CSKH Automation Engineer.
Task: Fortify Page 4 (`DeliveryPage.tsx`) with client-side credential security, clipboard auto-clear, audit telemetry, and 1-click CSKH Telegram diagnostics.

### Requirements:
1. Client-Side Sensitive Data Security:
   - Implement Secure Clipboard Auto-Clear: When user copies Password or 2FA Secret, start a 60-second timer. If clipboard still contains the secret after 60s, overwrite clipboard with empty string to prevent leakage on shared dev workstations.
   - Strict XSS Defense: Credentials must be strictly bound as text nodes with zero HTML evaluation.
2. Operator Telemetry & Product Delivery Audit:
   - On page mount, dispatch `trackEvent('fulfillment_viewed', { order_id: orderId, delivery_speed_seconds: 18 })`.
   - When user downloads JSON/ENV, dispatch `trackEvent('credentials_downloaded', { format: 'json', order_id: orderId })`.
   - When user clicks "Kiểm tra tình trạng tài khoản", dispatch `trackEvent('self_test_initiated', { order_id: orderId })`.
3. 1-Click CSKH Diagnostic Escalation:
   - When user clicks "Cần kỹ thuật viên hỗ trợ qua Telegram":
     - Automatically execute `exportSupportBundle({ orderId, status: healthStatus })`.
     - Construct a Telegram direct URI `https://t.me/aipro_support?text=...` with pre-filled Order ID, delivery timestamp, and error status so the operator receives all diagnostic info without asking repetitive questions.
```

---

```
================================================================================
BỘ PROMPT 5: TRANG TRA CỨU ĐƠN HÀNG & TỰ PHỤC VỤ BẢO HÀNH (PAGE 5)
================================================================================
```

### [Trang 5: Self-Service Warranty & Order Lookup] Core Prompt

#### Phase 1: Component Architecture & Mock Data
```markdown
Role: Senior TypeScript Engineer.
Task: Design the state machine, OTP authentication types, and warranty replacement data models for Page 5: Self-Service Warranty & Order Lookup (`/lookup` & `/warranty`).

### Technical Constraints:
- Tech Stack: React 18+ + TypeScript + Tailwind CSS.
- Output: Strict type definitions, lookup mock records, and replacement flow state machines.

### Requirements:
1. Define interfaces:
   - `LookupTab`: `'email_otp'` | `'order_id'`.
   - `WarrantyReason`: `'out_of_pro'` | `'wrong_password'` | `'device_limit'` | `'other'`.
   - `ReplacementStep`: `'idle'` | `'verifying_session'` | `'confirming_warranty'` | `'allocating_new_account'` | `'completed'` | `'limit_exceeded'`.
   - `OrderWarrantyRecord`: Order summary, purchase date, warranty expiration date, replacement history (timestamp, previous email, new email, reason).
2. Mock Lookup Database:
   - Mock store containing 2 existing orders with active warranty (88 days left) and 1 expired order for test coverage.
```

#### Phase 2: UI Structure & Semantic Layout
```markdown
Role: Senior Frontend UI Architect.
Task: Construct the 2-stage layout for Page 5 (`/lookup` & `/warranty`) using AIPro.dev Design Tokens.

### 2-Stage Layout:
- **STAGE 1: FAST LOOKUP GATE (Khi chưa xác thực)**:
  - Header: Logo + "Quay lại trang chủ".
  - H1: "Tra Cứu Đơn Hàng & Kích Hoạt Bảo Hành Tự Động".
  - Subtitle: "Nhập Email hoặc Mã đơn hàng để quản lý bản quyền mà không cần đăng nhập phức tạp".
  - Tabs: `Tra cứu theo Email (Mã OTP)` vs `Tra cứu theo Mã đơn hàng (#AIPRO-XXXX)`.
  - Tab Email: Email input + Button "Gửi mã OTP". Once sent, render 6 individual OTP square input boxes with auto-focus next.
  - Tab Order ID: Order ID input + Guest Email + Button "Tra cứu ngay".
- **STAGE 2: VERIFIED ORDER & WARRANTY DASHBOARD (Sau khi xác thực)**:
  - `OrderSummaryCard`: Order ID, Product Name, Purchase Date, Warranty Expiration Date.
  - `WarrantyStatusBadge`: 🟢 Đang được bảo hành (Còn 88 ngày) / 🟡 Sắp hết hạn / ⚪ Đã hết hạn.
  - `CredentialsVaultDisplay`: Review account credentials with copy buttons.
  - `SelfServiceBotCard` (Trung tâm bảo hành tự động):
    - Question: "Bạn gặp sự cố gì với tài khoản này?"
    - Radio options: `Bị mất gói Pro / Out gói`, `Sai mật khẩu`, `Bị giới hạn thiết bị`.
    - Prominent CTA Button: `⚡ Kích hoạt đổi mới tài khoản tự động trong 60s` (Gradient accent button).
    - `WarrantyHistoryTimeline`: Timestamped history of provisioning and previous replacements.
  - `HumanEscalation`: "Cần hỗ trợ sâu hơn? [Kết nối Kỹ thuật viên Telegram 24/7]".
```

#### Phase 3: Micro-interactions & Visual Polish
```markdown
Role: Motion & UX Specialist.
Task: Implement 6-digit OTP auto-focus, replacement modal confirmation, 4-step recovery progress bar, and rate limit guardrails for Page 5.

### Micro-interactions & Visual Effects:
1. 6-Digit OTP Input:
   - Typing in a digit automatically focuses the next input.
   - Pasting a full 6-digit code splits and populates all 6 inputs automatically.
   - Backspace automatically jumps back to the previous input.
2. Self-Service Auto-Replacement Flow (Modal & Stepper):
   - Clicking "Kích hoạt đổi mới tài khoản tự động" opens Confirmation Modal: "Hệ thống sẽ thu hồi tài khoản cũ và trích xuất tài khoản mới ngay lập tức".
   - Upon confirmation, render animated progress stepper with 4 phases:
     - `[01s]` Kiểm tra trạng thái tài khoản trên dịch vụ gốc (Spinner).
     - `[03s]` Xác nhận lỗi hợp lệ với cam kết SLA (Checkmark).
     - `[06s]` Trích xuất tài khoản dự phòng mới từ kho (Loading bar).
     - `[08s]` Bàn giao tài khoản mới thành công lên màn hình (Celebration checkmark).
   - Replaces credential fields on screen instantly without page reload.
3. Abuse Prevention Guardrail:
   - If user triggers replacement more than 2 times in 24 hours:
     - Disable button.
     - Show polite notice: "Bạn đã thực hiện đổi tự động 2 lần hôm nay. Để bảo vệ an toàn đơn hàng, vui lòng liên hệ trực tiếp Kỹ thuật viên Telegram" with Telegram link.
```

#### Phase 4: Component Integration & Actions
```markdown
Role: Full-Stack React Engineer.
Task: Connect OTP verification logic, warranty replacement state machine, and localStorage history for Page 5.

### Integration Requirements:
1. Lookup Verification:
   - Email Tab: Validate OTP matches mock code (`123456`). If valid, unlock Stage 2.
   - Order Tab: Validate order ID against mock database.
2. Replacement State Machine:
   - Handle step transitions and update order record in state/localStorage.
3. Return the complete, fully operational `LookupPage.tsx` file.
```

#### Phase 5: Rate Limiting, Abuse Detection & CSKH Escalation Bundle
```markdown
Role: Lead Security & CSKH Automation Engineer.
Task: Harden Page 5 (`LookupPage.tsx`) with OTP rate-limiting, abuse prevention guardrails, warranty audit telemetry, and Telegram escalation bundles.

### Requirements:
1. OTP Resend Cooldown & Brute-force Throttling:
   - When user clicks "Gửi mã OTP":
     - Start a 60-second countdown timer (`isResendCoolingDown === true`).
     - Disable the button and display "Gửi lại sau (59s)...".
   - Limit OTP failed attempts to 5 tries. If exceeded, lock lookup for 15 minutes and log warning: `logErrorBreadcrumb('OTP_BruteForce_Locked', { email })`.
2. Self-Service Warranty Abuse Guardrail:
   - Read replacement history from `localStorage` (`aipro_replacements_${orderId}`).
   - If count >= 2 within 24 hours: Lock the replacement button and render a high-priority CSKH bridge: "Bạn đã đổi tự động 2 lần trong 24h. Vui lòng bấm bên dưới để kỹ thuật viên hỗ trợ riêng".
3. Operational Telemetry & Analytics:
   - On successful lookup, dispatch `trackEvent('order_lookup_success', { lookup_method: activeTab, order_id: order.id })`.
   - On warranty claim start, dispatch `trackEvent('warranty_claim_initiated', { order_id: order.id, reason: selectedReason })`.
   - On replacement success, dispatch `trackEvent('warranty_claim_resolved', { order_id: order.id, new_account_type: 'pre_created' })`.
4. 1-Click CSKH Diagnostic Escalation:
   - If user chooses "Lỗi khác" or reaches replacement limit:
     - Generate support bundle via `exportSupportBundle({ orderId, reason: selectedReason, attempts: count })`.
     - Button "Kết nối Kỹ thuật viên Telegram" opens `https://t.me/aipro_support?text=...` with pre-filled Diagnostic JSON payload.
```

---

```
================================================================================
BỘ PROMPT 6: TRUNG TÂM QUẢN LÝ ĐƠN HÀNG & ĐỐI SOÁT THANH TOÁN (PAGE 6 - ADMIN)
================================================================================
```

### [Trang 6: Order Reconciliation Dashboard] Core Prompt (`/admin/orders`)

#### Phase 1: Component Architecture & Mock Data
```markdown
Role: Senior TypeScript & Data Architect.
Task: Design data structures, status enums, and realistic reconciliation mock fixtures for Page 6: Admin Order Management & Bank Webhook Reconciliation (`/admin/orders`).

### Technical Constraints:
- Tech Stack: React 18+ + TypeScript + Tailwind CSS.
- Output: Strict type definitions, filtering models, and mock transactional fixtures without conversational fluff.

### Requirements:
1. Define interfaces:
   - `AdminOrderStatus`: `'pending'` | `'paid_webhook'` | `'dispatched'` | `'mismatch_amount'` | `'missing_memo'` | `'refunded'`.
   - `PaymentGateway`: `'vietqr'` | `'stripe'` | `'crypto_usdt'`.
   - `AdminOrderRecord`: id, createdAt, guestEmail, productSlug, productName, durationMonths, amountExpected, amountReceived, currency, gateway, bankReferenceCode, memoText, status, dispatchedCredentials?: { email: string; pass: string; }, cskhNotes?: string.
2. Realistic Mock Dataset (10 diverse real-world orders):
   - 3 Auto-dispatched orders (completed in < 30s).
   - 2 Webhook Mismatch cases: Order #AIPRO-94821 (Expected 749.000 ₫, received 700.000 ₫; missing 49.000 ₫).
   - 1 Missing Memo case: Order #AIPRO-94825 (Received 249.000 ₫ but memo was empty/random).
   - 2 Pending payment orders (Active 10-minute timer).
   - 2 Refunded/Cancelled orders.
3. Export calculation helpers for KPI Metrics: Total Revenue Today, Pending Webhook Alerts, Auto-Dispatch SLA rate (%).
```

#### Phase 2: UI Structure & Semantic Layout
```markdown
Role: Senior Frontend UI Architect.
Task: Construct a high-density, dark-mode developer-centric admin layout for Page 6 (`/admin/orders`) using AIPro.dev Design Tokens.

### Structural Requirements (High-Density Professional Ops):
1. `AdminTopBar`: Breadcrumb `Admin > Orders`, Live Webhook Polling Status Pulse (`🟢 Webhook Socket Active`), Refresh Button, Export CSV Button.
2. `KpiSummaryMetricsRow` (4 Cards):
   - Total Revenue (Day/Week) in `font-mono`.
   - Pending Orders (Requiring human attention badge).
   - Dispatched SLA (< 30s) Gauge: 98.4%.
   - Active Customers Today.
3. `OrderFilterToolbar`:
   - Fast Search Bar (searches by Order ID, Guest Email, Bank Reference, Memo).
   - Status Tabs: `Tất cả`, `Cần xử lý gấp (Mismatch)` with Red counter badge, `Đã bàn giao`, `Đang chờ`.
   - Gateway selector dropdown.
4. `OrdersInteractiveTable`:
   - Columns: Mã đơn hàng (font-mono), Thời gian, Khách hàng (Email), Gói tài khoản, Cổng, Số tiền (Expected vs Received highlight), Trạng thái (Color Badge), Thao tác nhanh.
5. `OrderDetailSlideOver` (Drawer bên phải khi bấm vào 1 dòng đơn):
   - Full order timeline (Created -> Webhook Received -> Credentials Dispatched).
   - Bank transfer raw payload inspector (JSON formatted).
   - Manual Override Action Panel:
     - Nút: "⚡ Khớp lệnh thủ công & Kích hoạt bàn giao ngay" (cho đơn thiếu tiền hoặc lệch memo).
     - Nút: "📧 Gửi lại Email Bàn Giao".
     - Nút: "💸 Hoàn tiền 100%".
```

#### Phase 3: Micro-interactions & Visual Polish
```markdown
Role: Motion & UX Specialist.
Task: Implement filter animations, discrepancy row highlights, manual approval confirmation modals, and export feedbacks for Page 6.

### Micro-interactions & Visual Effects:
1. Discrepancy Row Glow:
   - Rows with `mismatch_amount` or `missing_memo` must have subtle amber/red warning borders with a pulsing indicator icon.
2. Manual Dispatch Confirmation Dialog:
   - Clicking "Khớp lệnh thủ công" opens Modal: "Bạn có chắc chắn muốn bỏ qua khoản chênh lệch và xuất kho tài khoản ngay lập tức cho email này?".
3. Slide-over Transition:
   - Order detail drawer slides in smoothly from the right (`translate-x-0 transition-transform duration-300`).
4. Toast Feedback:
   - "Đã gửi lại thông tin tài khoản qua email thành công ✓" (auto-dismiss 3s).
```

#### Phase 4: Component Integration & Actions
```markdown
Role: Full-Stack React Engineer.
Task: Wire filter states, pagination, search debounce, manual approval actions, and CSV export for Page 6 (`/admin/orders`).

### Integration Requirements:
1. Filter & Search Handlers:
   - Debounce search input (300ms).
   - Pagination (10/25/50 items per page).
2. Action Dispatchers:
   - Handle `onManualApprove(orderId)`: Updates state to `dispatched`, attaches credentials from inventory mock, triggers success notification.
   - Handle `onExportCSV()`: Formats active filtered orders to CSV string and triggers browser download.
3. Return the complete, modular `AdminOrdersPage.tsx` file.
```

#### Phase 5: Audit Trail, Role-Based Access & CSKH Action Logs
```markdown
Role: Lead Security & DevOps Engineer.
Task: Harden Page 6 with audit logging, sensitive data masking, and operator trace headers.

### Requirements:
1. Operator Audit Trail:
   - Every manual action (e.g. `onManualApprove`, `onRefund`) must record an audit entry: `{ operatorId: 'admin_alex', action: 'MANUAL_DISPATCH_OVERRIDE', orderId, timestamp, ip: '127.0.0.1' }`.
2. Customer Data Masking:
   - Include a toggle "Ẩn/Hiện thông tin cá nhân" (Privacy Shield): Mask emails (`a***x@gmail.com`) by default to prevent shoulder surfing or recording leaks.
3. Error Boundary:
   - Wrap the orders table in `<ErrorBoundary>` to isolate JSON parsing errors from bad webhook records.
```

---

```
================================================================================
BỘ PROMPT 7: QUẢN TRỊ KHO TÀI KHOẢN & BATCH IMPORT (PAGE 7 - ADMIN)
================================================================================
```

### [Trang 7: Inventory & Batch Provisioning] Core Prompt (`/admin/inventory`)

#### Phase 1: Component Architecture & Mock Data
```markdown
Role: Senior TypeScript Engineer.
Task: Architect inventory schemas, batch parsing models, and mock stock pools for Page 7: Inventory Management (`/admin/inventory`).

### Requirements:
1. Interfaces:
   - `PoolType`: `'active_sale'` (Bán trực tiếp) | `'warranty_buffer'` (Dự phòng 1-đổi-1).
   - `AccountItem`: id, productSlug, credentials: { email: string; pass: string; token2FA?: string; sessionCookie?: string; }, poolType: PoolType, status: 'available' | 'assigned' | 'compromised', addedAt: string, assignedToOrderId?: string.
   - `StockGauge`: productSlug, productName, totalActive, totalBuffer, lowStockThreshold: number.
2. Mock Inventory Dataset:
   - 30 Mock account items across Cursor Pro, Claude 3.7 Sonnet, ChatGPT Plus, Copilot Pro.
   - 2 accounts in `low_stock` alert state.
```

#### Phase 2: UI Structure & Semantic Layout
```markdown
Role: Senior Frontend UI Architect.
Task: Build the Inventory Management layout with bulk import drawer and stock health gauges for Page 7.

### Layout Elements:
1. `StockHealthGrid`:
   - Cards displaying stock level per product: Progress bar, Available count, Buffer count, and Low-stock indicator badge (`🔴 Cần nhập thêm`).
2. `BulkImportDrawer` (Drag-and-Drop Dropzone):
   - Supports CSV / JSON files.
   - Format preview table showing parsed rows (Email, Password, 2FA, Assigned Tool).
   - Selector: Import to `Kho Bán (Active Pool)` or `Kho Bảo Hành (Warranty Buffer)`.
3. `AccountInventoryTable`:
   - Search by account email or product. Filter by Pool Type and Status.
   - Masked password column with eye reveal toggle.
   - Bulk action toolbar: "Chuyển sang Kho Bảo Hành", "Xóa tài khoản lỗi".
```

#### Phase 3: Micro-interactions & Visual Polish
```markdown
Role: Motion & UX Specialist.
Task: Implement drag-and-drop animation, file upload validation feedback, and batch action toasts for Page 7.

### Interactions:
1. Drag & Drop Zone:
   - Highlights with cyan neon glow when a file is hovered over the upload area.
2. CSV Parsing Validation:
   - Shows real-time validation: "25 accounts valid ✓, 2 rows formatted incorrectly ⚠️".
3. Secret Reveal:
   - Eye icon toggles password visibility with temporary 10-second auto-mask timeout.
```

#### Phase 4: Component Integration & Actions
```markdown
Role: Full-Stack React Engineer.
Task: Implement CSV parser, inventory state manipulation, and account allocation logic for Page 7.

### Requirements:
1. File Reader Handler:
   - Read CSV/JSON file using `FileReader` API, validate required headers (`email,password,product_slug`).
2. Pool Migration Handler:
   - Move selected accounts between `active_sale` and `warranty_buffer`.
3. Export complete `AdminInventoryPage.tsx`.
```

#### Phase 5: Cryptographic Safety & Low-Stock Alerts
```markdown
Role: Lead Security & Systems Reliability Engineer.
Task: Implement credential security policies, audit logging, and Telegram webhook alerts for low stock.

### Requirements:
1. Zero Plaintext Export:
   - Prevent unauthorized batch copying of credentials. Require explicit confirmation before viewing passwords.
2. Automated Low-Stock Alert:
   - When available stock drops below threshold, dispatch webhook alert or display top banner: "⚠️ Cảnh báo: Cursor Pro chỉ còn 3 tài khoản trong kho!".
```

---

```
================================================================================
BỘ PROMPT 8: TRUNG TÂM XỬ LÝ BẢO HÀNH & KHIẾU NẠI SLA (PAGE 8 - ADMIN)
================================================================================
```

### [Trang 8: SLA Escalation Center] Core Prompt (`/admin/warranty`)

#### Phase 1: Component Architecture & Mock Data
```markdown
Role: Senior TypeScript Engineer.
Task: Model warranty disputes, SLA countdown timers, and escalation records for Page 8 (`/admin/warranty`).

### Requirements:
1. Interfaces:
   - `WarrantyDispute`: id, orderId, customerEmail, productSlug, purchaseDate, disputeReason: 'out_of_pro' | 'wrong_pass' | 'device_limit' | 'other', autoReplacementAttempts: number, status: 'bot_resolved' | 'agent_investigating' | 'approved_new_account' | 'refunded', createdAt: string, slaDeadlineMinutes: number.
2. Mock Dataset:
   - 4 bot-resolved cases (history log).
   - 3 escalated cases waiting for agent (1 case nearing 15-minute SLA breach).
```

#### Phase 2: UI Structure & Semantic Layout
```markdown
Role: Senior Frontend UI Architect.
Task: Design the SLA escalation board with urgency sorting and resolution controls for Page 8.

### Layout Requirements:
1. `SlaUrgencyBanner`: Alerts agent to tickets nearing SLA breach (< 10 minutes).
2. `DisputeQueuesGrid`:
   - Queue A: `Cần Kỹ Thuật Viên Xử Lý (Escalated Cases)` - High priority.
   - Queue B: `Bot Đã Đổi Tự Động (Audit Feed)` - Monitored for abuse patterns.
3. `DisputeDetailDrawer`:
   - Customer claim details & error logs bundle.
   - Fast Action Buttons:
     - `⚡ Duyệt cấp 1 tài khoản mới từ Buffer Pool (1-Click)`.
     - `💸 Hoàn tiền 100% về tài khoản gốc`.
     - `💬 Mở chat Telegram trực tiếp với khách`.
```

#### Phase 3: Micro-interactions & Visual Polish
```markdown
Role: Motion & UX Specialist.
Task: Implement pulsing countdown timers, dispute resolution animations, and status badge transitions.
```

#### Phase 4: Component Integration & Actions
```markdown
Role: Full-Stack React Engineer.
Task: Wire ticket status transitions, account allocation from buffer, and Telegram deep linking for Page 8.
```

#### Phase 5: MTTR Telemetry & Fraud Pattern Detection
```markdown
Role: DevOps & Anti-Fraud Specialist.
Task: Add MTTR (Mean Time to Resolution) analytics and flag suspicious customer emails or duplicate claims.
```

---

```
================================================================================
BỘ PROMPT 9: TRUNG TÂM ĐIỀU KHOẢN, SLA & PHÁP LÝ TUÂN THỦ (PAGE 9 - LEGAL)
================================================================================
```

### [Trang 9: Legal & Compliance Hub] Core Prompt (`/terms`, `/sla`, `/refund-policy`, `/privacy`)

#### Phase 1: Component Architecture & Mock Data
```markdown
Role: Senior Frontend Architect.
Task: Structure legal articles, table of contents schemas, and compliance meta-tags for Page 9: Legal & Compliance Hub.

### Requirements:
1. Define interfaces:
   - `LegalTab`: `'terms'` | `'sla'` | `'refund'` | `'privacy'`.
   - `LegalSection`: id, title, contentMarkdown, lastUpdated: string.
2. Full Vietnamese & English legal text data structures matching Payment Gateway requirements:
   - SLA 99.9% Uptime and 30-second fulfillment policy.
   - 100% Refund guarantee conditions within 30-90 days.
   - Data privacy: Zero credential logging and RFC privacy commitments.
```

#### Phase 2: UI Structure & Semantic Layout
```markdown
Role: Senior Frontend UI Architect.
Task: Build a typography-optimized, dual-column reading interface with sticky Table of Contents for Page 9.

### Layout Elements:
1. Sticky Left Sidebar: Table of Contents with scrollspy anchor links.
2. Legal Content Area: Clean prose typography (`prose-invert max-w-none text-text-secondary`).
3. Top Navigation Tabs: `Điều Khoản Dịch Vụ`, `Cam Kết SLA 99.9%`, `Chính Sách Hoàn Tiền`, `Bảo Mật Dữ Liệu`.
4. Quick Action Button: "In tài liệu / Tải PDF" and "Liên hệ Pháp chế".
```

#### Phase 3: Micro-interactions & Visual Polish
```markdown
Role: Motion & UX Specialist.
Task: Implement smooth anchor scrolling, active section highlight, and in-document text search with keyword highlighting.
```

#### Phase 4: Component Integration & Actions
```markdown
Role: Full-Stack React Engineer.
Task: Wire URL tab synchronization (`/terms?tab=refund`), version picker (v1.0 vs v1.1), and PDF print triggers.
```

#### Phase 5: Payment Gateway Compliance Meta-tags
```markdown
Role: Compliance & SEO Specialist.
Task: Inject meta-tags, OpenGraph headers, and structured JSON-LD data required by Stripe and Bank Merchant Review auditors.
```

---

```
================================================================================
BỘ PROMPT 10: TRẠNG THÁI HỆ THỐNG & 404 DEVELOPER TERMINAL (PAGE 10 - SYSTEM)
================================================================================
```

### [Trang 10: Live System Status & CLI 404] Core Prompt (`/status` & `/404`)

#### Phase 1: Component Architecture & Mock Data
```markdown
Role: Senior TypeScript Engineer.
Task: Design service uptime schemas, 90-day availability history, and interactive 404 terminal CLI command parser for Page 10 (`/status` & `/404`).

### Requirements:
1. Interfaces:
   - `ServiceComponent`: name, category: 'ai_providers' | 'payment_gateways' | 'fulfillment_bot', status: 'operational' | 'degraded_performance' | 'partial_outage' | 'major_outage', uptimePercent: number, history90Days: number[].
   - `SystemIncident`: id, title, status: 'investigating' | 'identified' | 'monitoring' | 'resolved', timestamp: string, updates: { time: string; text: string; }[];
2. Mock Datasets:
   - OpenAI API, Claude 3.7 Sonnet Cluster, Cursor Licensing Engine, VietQR Bank Gateway, Stripe Processing, Dispatch Bot.
```

#### Phase 2: UI Structure & Semantic Layout
```markdown
Role: Senior Frontend UI Architect.
Task: Build the Live Status Dashboard and the Interactive Developer 404 Terminal.

### Layout Requirements:
1. `/status` Layout:
   - Overall System Status Header: `🟢 Toàn bộ hệ thống đang hoạt động ổn định (99.98% Uptime)`.
   - Service Grid with 90-Day Uptime Bars (color-coded green/amber/red).
   - Past Incident Timeline.
2. `/404` Layout:
   - Fullscreen Dark Minimalist CLI:
     - `Error 404: Route Not Found`.
     - Interactive Prompt: `aipro:~$ [Type command: help, home, catalog, status, lookup]`.
```

#### Phase 3: Micro-interactions & Visual Polish
```markdown
Role: Motion & UX Specialist.
Task: Implement animated uptime bars on hover with date tooltip, blinking cursor terminal typing, and live pulse indicators.
```

#### Phase 4: Component Integration & Actions
```markdown
Role: Full-Stack React Engineer.
Task: Wire 30s auto-refresh polling on `/status` and command execution parser on `/404` (`home` -> navigate to `/`, `lookup` -> navigate to `/lookup`).
```

#### Phase 5: Uptime Alert Webhooks & Error Boundary Fallback
```markdown
Role: DevOps & Infrastructure Engineer.
Task: Connect client-side uptime subscription hook and bind this page as the Global Error Boundary fallback.
```

---

```
================================================================================
BỘ PROMPT 11: TÀI LIỆU KỸ THUẬT & HƯỚNG DẪN KÍCH HOẠT (PAGE 11 - DEV DOCS)
================================================================================
```

### [Trang 11: Developer Setup Guides] Core Prompt (`/docs` & `/guides/:slug`)

#### Phase 1: Component Architecture & Mock Data
```markdown
Role: Senior Developer Advocate & Technical Writer.
Task: Structure documentation schemas, code block snippet definitions, and step-by-step IDE setup guides for Page 11 (`/docs`).

### Requirements:
1. Guide Guides for:
   - Cursor Pro: Setup session tokens, configure custom models, troubleshoot quota.
   - Claude Pro: Accepting team invite, setting up browser cookie.
   - GitHub Copilot: VS Code extension login, JetBrains plugin configuration.
2. Provide step-by-step mock guide objects with code blocks and screenshots paths.
```

#### Phase 2: UI Structure & Semantic Layout
```markdown
Role: Senior Frontend UI Architect.
Task: Build technical documentation layout with sidebar menu, breadcrumbs, copyable terminal blocks, and troubleshooting checklists.
```

#### Phase 3: Micro-interactions & Visual Polish
```markdown
Role: Motion & UX Specialist.
Task: Implement 1-click code block copying with syntax highlighting, interactive step checkmarks, and "Was this helpful? 👍 👎" feedback widget.
```

#### Phase 4: Component Integration & Actions
```markdown
Role: Full-Stack React Engineer.
Task: Wire dynamic routing (`/docs/:toolSlug`), search filter for setup guides, and Telegram hotline link.
```

#### Phase 5: Documentation Telemetry & Ticket Deflection Metrics
```markdown
Role: Growth & Customer Experience Engineer.
Task: Track guide views and helpfulness ratings to measure ticket deflection rate and identify common developer setup hurdles.
```

---

## 3. CHECKLIST KIỂM ĐỊNH CHẤT LƯỢNG KHI COPY-PASTE VÀO AI
Trước khi paste các prompt trên vào AI (ChatGPT / Claude / Cursor), hãy đảm bảo:
- [x] Đã chạy **BỘ PROMPT 0 (Global Setup)** để AI hiểu toàn bộ Design Tokens và tiện ích nền tảng (`telemetry.ts`, `ErrorBoundary.tsx`, `diagnostics.ts`).
- [x] **Chọn phân hệ phù hợp**:
  - Khi làm giao diện Khách hàng: Dùng **Bộ Prompt 1 đến 5**.
  - Khi làm giao diện Quản trị & Vận hành: Dùng **Bộ Prompt 6, 7, 8**.
  - Khi làm trang Pháp lý, Hạ tầng & Hướng dẫn: Dùng **Bộ Prompt 9, 10, 11**.
- [x] Paste lần lượt từ **Phase 1 -> Phase 2 -> Phase 3 -> Phase 4 -> Phase 5** nếu muốn code cực kỳ chi tiết, hoặc paste trọn vẹn cả 5 Phase của 1 trang trong một lượt cho các model context lớn (như Claude 3.7 Sonnet).
- [x] Kiểm tra file xuất ra có ăn đúng các biến CSS `:root` và font `Inter` + `JetBrains Mono`.

