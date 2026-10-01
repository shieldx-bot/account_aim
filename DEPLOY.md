# AgentLab — Production Deployment Guide

Tài liệu chuyển hệ thống từ môi trường thử nghiệm sang production.

## Kiến trúc

```
[Vercel/Netlify]  →  [Railway backend (Docker)]  →  [PostgreSQL (Railway)]
  frontend static        Express API + PayPal           dữ liệu
  (VITE_API_BASE)        webhook /api/payments/webhook
```

## 1. Rotate secrets (BẮT BUỘC trước khi go-live)

Các secret sau **đã lộ trong git history** và phải thay bằng giá trị mới:

- Mật khẩu Postgres (hiện đang dùng Railway DB)
- `JWT_SECRET`
- `ADMIN_ROOT_KEY`

Generate giá trị mới:

```bash
# JWT_SECRET / ADMIN_ROOT_KEY
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
# ENCRYPTION_KEY (đúng 64 hex = 32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Đổi mật khẩu DB trên Railway, rồi tạo file `server/.env` từ `server/.env.example` (file `.env` đã được gitignore, không commit nữa).

## 2. Backend — Railway

1. Railway → New Service → **Deploy from repo**, root directory = `server/` (Railway dùng `server/Dockerfile`).
2. Set biến môi trường (xem `server/.env.example`):
   - `NODE_ENV=production`, `PORT=5000`
   - `DB_*` — trỏ tới Railway Postgres (dùng internal URL nếu cùng project)
   - `JWT_SECRET`, `JWT_EXPIRES_IN`, `ADMIN_ROOT_KEY`, `ENCRYPTION_KEY`
   - `CORS_ORIGIN=https://<frontend-domain>` (không có dấu `/` cuối)
   - `APP_URL=https://<frontend-domain>` (dùng làm return/cancel URL của PayPal)
   - `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `RESEND_API_KEY`, `MAIL_FROM`
3. Generate domain → `https://<api-domain>`.

### Mã hoá mật khẩu kho tài khoản hiện có (chạy 1 lần)

```bash
cd server
ENCRYPTION_KEY=<key-mới> node scripts/encrypt-existing-passwords.mjs
```

## 3. PayPal (cổng thanh toán duy nhất)

1. [developer.paypal.com](https://developer.paypal.com) → Apps & Credentials → tạo app kiểu **Merchant** → lấy `PAYPAL_CLIENT_ID` + `PAYPAL_CLIENT_SECRET` (sandbox trước, live khi go-live).
2. Thêm vào env backend: `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_ENV=sandbox` (đổi thành `live` khi go-live) và `APP_URL` (URL frontend).
3. **Không cần webhook** — PayPal dùng flow redirect: server tạo PayPal Order → người dùng duyệt trên PayPal → quay lại `/checkout?paypal_return=1` → server capture + verify số tiền khớp order → fulfil. Capture là idempotent.
4. Endpoint `GET /api/payments/paypal/status` là health-check cho badge "PayPal is available" trên trang Checkout.

1. [developer.paypal.com](https://developer.paypal.com) → Apps & Credentials → tạo app kiểu **Merchant** → lấy `PAYPAL_CLIENT_ID` + `PAYPAL_CLIENT_SECRET` (sandbox trước, live khi go-live).
2. Thêm vào env backend: `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_ENV=sandbox` (đổi thành `live` khi go-live).
3. **Không cần webhook** — PayPal dùng flow redirect: server tạo PayPal Order → người dùng duyệt trên PayPal → quay lại `/checkout?paypal_return=1` → server capture + verify số tiền khớp order → fulfil. Capture là idempotent.

## 4. Resend (email OTP + xác nhận đơn)

1. Tài khoản Resend → verify domain → DKIM/SPF.
2. `RESEND_API_KEY` + `MAIL_FROM=AgentLab <no-reply@<domain-đã-verify>>`.

## 5. Frontend — Vercel

1. Import repo vào Vercel (framework: Vite, root = thư mục gốc).
2. Environment variable: `VITE_API_BASE=https://<api-domain>/api`.
3. Deploy — SPA rewrite đã có trong `vercel.json`.
4. Cập nhật `CORS_ORIGIN` phía backend với domain Vercel (kể cả preview domains nếu cần).

## 6. Dev local

```bash
docker compose up -d postgres   # chỉ Postgres, credentials từ .env / mặc định dev
cd server && npm install && npm run dev        # backend :5000
cd . && npm install && npm run dev             # frontend :5173 (proxy /api → :5000)
```

- Dev không cần PayPal keys: checkout tự fallback qua `/api/payments/dev-simulate` (chỉ tồn tại khi backend chạy ngoài production).
- OTP trả `devCode` trong response khi backend ngoài production; production gửi email thật.

## 6b. Chế độ database nhúng (SQLite-style, PGlite)

Không muốn chạy server PostgreSQL? Backend hỗ trợ **PGlite** — PostgreSQL thật (WASM)
chạy in-process, dữ liệu lưu thành file cục bộ. Toàn bộ SQL, migration, transaction,
JSONB hoạt động nguyên bản, KHÔNG phải sửa query nào.

```bash
# Local (không Docker): DB_DRIVER=pglite và bỏ DB_HOST trong server/.env
cd server && DB_DRIVER=pglite npm run dev

# Docker self-contained (backend + web, KHÔNG cần postgres):
docker compose -f docker-compose.sqlite.yml --env-file server/.env up -d --build
# → storefront tại http://localhost:8080, dữ liệu lưu trong volume aipro_embedded_data
```

Chọn engine qua biến môi trường:
- `DB_DRIVER=pglite` → embedded, dữ liệu tại `PGDATA_DIR` (mặc định `./data/pglite`, mount `/data` trong container)
- `DB_DRIVER=postgres` hoặc để `DB_HOST` trong env → PostgreSQL ngoài (Railway), hành vi như cũ
- Không set gì: có `DB_HOST` → postgres; không có → pglite

Lưu ý: PGlite là single-connection — phù hợp standalone/small VPS; production traffic cao
vẫn nên dùng PostgreSQL ngoài (mode 2).

## 7. Checklist trước go-live

- [ ] Secrets đã rotate (DB password, JWT_SECRET, ADMIN_ROOT_KEY, ENCRYPTION_KEY mới)
- [ ] `server/.env` KHÔNG còn trong git history được dùng; `.gitignore` đã chặn (đã làm — cân nhắc purge history bằng `git filter-repo`)
- [ ] Chạy `node scripts/encrypt-existing-passwords.mjs` để mã hoá mật khẩu kho cũ
- [ ] PayPal sandbox payment hoàn tất end-to-end (duyệt → capture → order `paid`)
- [ ] Resend domain verified, gửi OTP thật tới mailbox cá nhân OK
- [ ] Flow thử nghiệm với thẻ test `4242 4242 4242 4242` → webhook → đơn `paid` → tài khoản bàn giao
- [ ] Đổi `PAYPAL_ENV=live`, test 1 giao dịch thật nhỏ
- [ ] `GET /api/health` trả `postgres: connected` từ domain production

## Những gì đã thay đổi so với bản thử nghiệm

| Khu vực | Trước | Sau |
|---|---|---|
| Thanh toán | Giả lập, order gán cứng `paid` | PayPal Orders API: redirect duyệt → server capture, idempotent |
| Giá | Client gửi số tiền, server tin theo | Server tính lại từ catalog + duration/tier/coupon |
| Coupon | Hardcode `DEVVIP10`, `AI2025` phía client | Bảng `coupons` + `POST /api/coupons/validate` |
| OTP email | Stub, trả mã trong response (prod luôn) | Resend gửi thật; `devCode` chỉ khi dev |
| Mật khẩu kho | Plaintext trong DB | AES-256-GCM (`ENCRYPTION_KEY`), giải mã chỉ khi bàn giao |
| Build prod | `tsc` không copy SQL → server prod không tạo schema | `tsc && cp -r src/db dist/db`; migration lỗi = fail-fast |
| Secrets | `.env` commit vào git, JWT fallback cứng | `.gitignore`, env schema bắt buộc khi production |
| Deploy | Chỉ compose Postgres | `server/Dockerfile` + compose backend + `vercel.json` |
| Health | Báo `connected` cứng | `SELECT 1` thật |
| Khác | Swagger + seed user bật mọi nơi; `require('crypto')` crash ESM; SQL interpolate `INTERVAL` | Swagger/seed chỉ khi dev; bug đã sửa; query parameterized |
