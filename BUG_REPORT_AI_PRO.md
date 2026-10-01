# 📋 BÁO CÁO TỔNG HỢP KIỂM TRA BUG — HỆ THỐNG WEBSITE AI PRO

**Ngày kiểm tra:** 01/10/2026
**Phạm vi:** Frontend (React + Vite + TS, `/src`) và Backend (Express + PostgreSQL + TS, `/server/src`)
**Phương pháp:** Build/compile tĩnh (`tsc`), đọc mã nguồn toàn bộ routes/controllers/middleware/context/pages, đối chiếu hợp đồng API FE↔BE, rà soát bảo mật logic.

---

## 🔴 MỨC ĐỘ NGHIÊM TRỌNG (Critical)

### C1. Backend KHÔNG build được — 3 lỗi biên dịch TypeScript
`npm run build` trong `/server` **thất bại**:

| File | Lỗi | Nguyên nhân |
|---|---|---|
| `src/index.ts:22` | `TS1470: 'import.meta' not allowed in CommonJS output` | `tsconfig.json` đặt `"module": "NodeNext"` nhưng `package.json` backend **không có** `"type": "module"` → TS biên dịch ra CommonJS trong khi code dùng cú pháp ESM (`import.meta.url`, import `.js`). Toàn bộ source dùng ESM-style. |
| `src/middleware/error.middleware.ts:25` | `TS2339: Property 'errors' does not exist on type 'ZodError'` | Dự án dùng **Zod v4**, accessor là `err.issues`, không còn `err.errors`. |
| `src/middleware/error.middleware.ts:25` | `TS7006: Parameter 'e' implicitly has an 'any' type` | Hệ quả của lỗi trên. |

**Cách sửa:** thêm `"type": "module"` vào `server/package.json` (hoặc đổi module sang ESNext+Bundler); thay `err.errors.map(...)` bằng `err.issues.map((e) => ...)`.

### C2. Lệch secret JWT giữa nơi KÝ và nơi XÁC thực token → mọi request xác thực fail nếu thiếu `JWT_SECRET` env
- `auth.controller.ts` ký token bằng `env.JWT_SECRET` (bắt buộc qua zod schema).
- `auth.middleware.ts:18` xác thực bằng `process.env.JWT_SECRET || 'aipro_super_secret_jwt_encryption_key_2025_prod'` — một **hardcoded fallback khác**.
- Nếu server chạy với env chưa load đúng (dotenv path sai, deploy thiếu biến), token ký xong verify không khớp → **toàn bộ tính năng đăng nhập/admin/order liệt** (403 "Phiên đăng nhập đã hết hạn").
- Ngoài ra hardcoded secret dạng này trong repo là lỗ hổng bảo mật nghiêm trọng (ai có source đều forge được admin token).
**Cách sửa:** middleware phải dùng chung `env.JWT_SECRET`; xóa fallback; xoay vòng secret đang lộ.

### C3. Bỏ qua số dư ví khi thanh toán — khách không cần trả tiền vẫn tạo đơn `status='paid'`
- Frontend `CheckoutPage.tsx` chỉ kiểm tra `/api/health` rồi gọi `POST /api/orders` — **không trừ balance** của user ở bất kỳ đâu.
- Backend `orders.controller.ts` luôn ghi `status: 'paid'` với bình luận *"PayPal confirms payment before we create order"* — nhưng **không tồn tại bước xác thực thanh toán PayPal nào** (paymentGatewayRef chỉ là chuỗi bịa `PAYPAL-${Date.now()}`).
→ Bất kỳ ai đã đăng nhập có thể đặt hàng "đã thanh toán" mà không mất xu nào. Rò rỉ doanh thu & kho tài khoản.
**Cách sửa:** tích hợp PayPal capture + verify server-side, hoặc trừ `balance_usd` trong transaction khi tạo đơn.

### C4. Giá đơn hàng hoàn toàn do client gửi lên — server không đối chiếu giá DB
`createOrder` nhận `unitPriceVND/unitPriceUSD/totalVND/...` từ request body và chỉ kiểm tra `totalVND > 0`, dù đã SELECT `current_price_vnd/current_price_usd` từ bảng `products` nhưng **không dùng để verify**. Kẻ tấn công gọi API trực tiếp với `totalVND: 1000` sẽ mua gói 599k với 1k, và referral reward cũng tính theo giá giả.
**Cách sửa:** server tự tính giá từ DB (product price × quantity − discount đã kiểm duyệt), bỏ mọi trường giá trị từ client.

---

## 🟠 MỨC ĐỘ CAO (High)

### H1. `FOR UPDATE SKIP LOCKED` vô hiệu — race condition cấp trùng tài khoản kho
`orders.controller.ts:210-217`: câu `SELECT ... FOR UPDATE SKIP LOCKED` chạy **ngoài transaction** (mỗi `pool.query` là 1 giao dịch riêng, lock nhả ngay) → 2 đơn song song cùng chọn 1 account, cả 2 UPDATE đè `assigned_order_id` → **cùng một tài khoản bán cho 2 khách**. (Tương tự, phần fallback match-by-tool không có lock nào.)
**Cách sửa:** bọc entire allocation trong `BEGIN ... COMMIT` với cùng một `client` connection (như `resolveWarrantyTicket` đã làm đúng).

### H2. Tài khoản bị BAN vẫn đăng nhập và dùng được bình thường
- Migration 003 thêm cột `users.status ('active'|'banned')` và admin có endpoint `PATCH /api/admin/users/:id/status` để khóa tài khoản.
- Nhưng `login()` và `getMe()` trong `auth.controller.ts` **không hề kiểm tra `status = 'banned'`** → chức năng khóa tài khoản là "trang trí", không có tác dụng.
**Cách sửa:** thêm `AND status = 'active'` vào query login (và chặn trong middleware auth).

### H3. Mật khẩu kho tài khoản lưu plaintext và trả về qua nhiều API
- `inventory_accounts.password` lưu thô; `formatSubscriptionRow` chú thích *"should be decrypted in real system"* nhưng thực tế `account_password_encrypted` chứa plaintext.
- Bị lộ qua: `GET /api/subscriptions/me` (member), `POST /api/orders/lookup/verify-otp`, và **`GET /api/admin/inventory` trả toàn bộ kho** (email + pass + pool).
- Thêm vào đó `ensureSeedUsers` **reset mật khẩu admin/member về `admin123`/`123456` mỗi lần khởi động** (ON CONFLICT DO UPDATE password_hash) kể cả khi đã đổi → backdoor vĩnh viễn; seed product chạy cả trong production.
**Cách sửa:** mã hóa at-rest (KMS/AES với secret env), dừng upsert đè mật khẩu seed, tắt seed khi `NODE_ENV=production`.

### H4. OTP lookup bị "đánh cắp" bởi attacker biết orderId (enumeration)
`requestLookupOtp` yêu cầu email khớp owner của order — nhưng `orderId` format `AIPRO-<5 số>` (10k khả năng, dò dễ dàng qua `GET /api/orders/lookup?orderId=`). Attacker dò được orderId → xin OTP → **response trả `devCode` công khai vì backend dev chạy `NODE_ENV=development`** → verify-OTP trả full credentials. Chuỗi này bypass được toàn bộ "redaction gate".
Ngoài ra route `/api/orders/lookup*` **không có rate limit riêng** (chỉ limiter 100 req/15p toàn `/api`) → enumeration thoải mái.
**Cách sửa:** giới hạn OTP request theo IP+orderId, tăng entropy orderId (UUID), không bao giờ echo `devCode` ra ngoài môi trường local thật sự.

### H5. `pool.on('error')` gọi `process.exit(-1)` — 1 lỗi idle client làm sập cả server
`config/db.ts:20-23`: bất kỳ connection lỗi nền (DB restart, network flap) → toàn bộ API chết. Should log & tái tạo pool, không kill process.

---

## 🟡 MỨC ĐỘ TRUNG BÌNH (Medium)

### M1. Số học giá trên frontend sai bản chất
`CheckoutPage.tsx` (single-product mode):
```
unitPriceVND = monthlyEquivalentVND * months   // ← đơn giá bị thành tổng
totalVND     = monthlyEquivalentVND * months
```
Đơn giá lưu vào DB nhân đôi/triple theo chu kỳ (12 tháng → unit price = giá 12 tháng). Admin xem đơn sẽ thấy giá sai. Tương tự `discountVND` của cart được tính trên toàn subtotal nhưng chỉ gắn cho đơn của item đầu tiên.

### M2. Giỏ hàng nhiều món chỉ tạo đơn cho 1 sản phẩm
Cart mode lấy `items[0]` tạo đơn rồi `clearCart()` — **các item còn lại mất không**, khách trả tiền cả giỏ (`finalTotalVND`) nhưng chỉ nhận 1 sản phẩm.

### M3. Trang cảm ơn điều hướng tới route không tồn tại
`/order/success/:orderId` render `DeliveryPage`, nhưng `DeliveryPage` gọi `GET /api/orders/:orderId` **yêu cầu Bearer token**; nếu session hết hạn/khác máy, trang báo lỗi không tải được dữ liệu bàn giao. Lookup email-only không hoạt động: controller comment nói *"find by Email + guestEmail"* nhưng query chỉ so khớp `guest_email/target_email`, còn flow checkout luôn gửi `guestEmail = user.email` — nhất quán may mắn, nhưng đơn guest (nếu mở lại) sẽ không tra được bằng email đăng ký.

### M4. CORS cấu hình `credentials: true` nhưng frontend không dùng cookie; allowlist cứng
Không chí mạng, nhưng `origin: env.corsOrigins` trả `[]` nếu `CORS_ORIGIN=''` (chuỗi rỗng split/filter ra []) → **chặn mọi origin hợp lệ** thay vì fallback dev như ý định code (`??` chỉ bắt `undefined`, không bắt `''`).

### M5. Referral reward tự quy đổi 10% `orderTotalVND` vào `balance_vnd`
Vì C4 (giá do client quyết), attacker tự đặt mã mời của email khác + giá khổng lồ/nhỏ tùy ý để farm reward. Đồng thời frontend `captureRefFromUrl` regex `^APX-[A-Z0-9]{4,8}$` trong khi server sinh `APX-` + **đúng 5 ký tự** — hiện khớp, nhưng nếu đổi độ dài code phía server sẽ âm thầm break attribution.

### M6. `addUserBalance` cộng cả hai ví lệch tỉ giá
Nạp `$X` USD → cộng `X×25000` VND **cứng** (+ `balance_vnd` kiểu BIGINT trong khi `NUMERIC(10,2)` USD) — sau các bản "single-currency app" vẫn giữ 2 ví kép khiến thống kê `total_spent` và hiển thị admin (`totalVND/25000`) phụ thuộc tỉ giá giả định.

### M7. Health check báo `postgres: 'connected'` hằng số
`/api/health` không ping DB thật, nhưng CheckoutPage coi `health.postgres === 'connected'` như điều kiện sẵn sàng thanh toán → check vô nghĩa, che giấu DB down (lỗi thật sẽ nổ ở bước create order sau khi user đã bấm trả tiền).

---

## 🔵 MỨC ĐỘ THẤP (Low) / Ghi chú kỹ thuật

- **L1.** `updateOrderStatus` cho phép chuyển trạng thái tùy tiện (vd. `refunded → paid`) — không có state machine.
- **L2.** `generateOrderId` dùng `Math.random()` (không crypto-safe) + vòng lặp thử 5 lần nhưng không atomic insert → vẫn có thể va chạm dưới tải cao.
- **L3.** `getAllOrdersAdmin`: điều kiện `search` trong count-query thiếu `product_name ILIKE` trong khi list-query có → phân trang total lệch khi search theo tên sản phẩm.
- **L4.** `bulkImportInventory`: `ON CONFLICT (email) DO UPDATE` làm mất `password` cũ nhưng cũng **resets pool của account đã assigned**? (không guard `status='available'`) — account đang gán cho đơn có thể bị đổi kho.
- **L5.** `deleteProduct`/`updateProduct` (product.controller) dùng try/catch thủ công thay vì `catchAsync` + error middleware — thông lệ không nhất quán; message 404 chèn thẳng `slug` người dùng vào response (reflect content nhỏ).
- **L6.** Frontend: JWT lưu trong `localStorage` (`aipro_auth_session`) — dễ bị ăn qua XSS; cân nhắc httpOnly cookie.
- **L7.** `AuthContext.verifySession` nuốt mọi lỗi network khi verify token → giữ phiên cache cả khi server nói token hỏng (kể cả khi server trả 401 cũng không clear session).
- **L8.** `status.routes.ts` dùng key `success` trong khi toàn bộ error middleware trả `{status:'error'}` — hai envelope phản hồi khác nhau trong cùng API.
- **L9.** `docker-compose.yml` mount `init.sql` vào entrypoint **và** app tự chạy migration lúc boot — init.sql chứa INSERT seed với bcrypt hash **giả** ("Placeholder") gây hiểu nhầm dữ liệu ban đầu (được `ensureSeedUsers` sửa lại sau boot, nhưng nếu DB đã tồn tại volume thì placeholder sống mãi tới lần upsert kế tiếp).
- **L10.** `express-rate-limit` v8 dùng option `max/windowMs` — deprecated (v8 khuyến nghị `limit`); vẫn chạy nhưng cảnh báo. `@types/express: ^5` với `express: ^4` — lệch version types, tiềm ẩn lỗi overload `errorMiddleware` (4 tham số) sau này.

---

## ✅ NHỮNG MẢNG ĐÃ LÀM ĐÚNG (để đối chiếu)
- Parameterized queries xuyên suốt (không phát hiện SQL injection trực tiếp; dynamic WHERE trong admin queries dùng `$n` đúng cách).
- `helmet`, JSON body limit 10kb, rate limiting cơ bản có bật.
- Warranty resolve (`resolveWarrantyTicket`) và bulk import dùng transaction + `FOR UPDATE` **đúng chuẩn** — chứng tỏ pattern đã biết, chỉ thiếu áp dụng ở createOrder.
- OTP lookup băm bcrypt, có expiry 5 phút, cap 5 lần đoán, consume-once.
- Redemption quota bảo hành là server-side (`warranty_tickets` là source of truth), không tin localStorage.
- ErrorBoundary React, idempotent seeding products, redact credentials trước OTP.

---

## 🛠️ THỨ TỰ XỬ LÝ ĐỀ XUẤT
1. **Sửa build backend (C1)** — blocker deploy: thêm `"type":"module"`, đổi `err.errors` → `err.issues`.
2. **Thống nhất JWT secret + xóa hardcoded (C2)**, xoay secret.
3. **Server-authoritative pricing + xác thực thanh toán thật (C3, C4)**.
4. **Bọc allocation kho trong transaction (H1)** và **chặn login khi banned (H2)**.
5. Mã hóa credentials kho, bỏ seed reset mật khẩu (H3); chống enumeration OTP (H4).
6. Sửa giỏ hàng multi-item (M2), số học unit price (M1), health check thật (M7).
7. Dọn các issue Low còn lại theo sprint.

*Báo cáo được tạo từ phân tích tĩnh toàn bộ mã nguồn trong `/workspace` (frontend `src/`, backend `server/src/`, migrations, docker-compose, config).*
