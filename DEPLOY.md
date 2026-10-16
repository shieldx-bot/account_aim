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

## 5. Frontend — Cloudflare Pages (labagent.tech) — production hiện tại

Domain `labagent.tech` (và `apii.labagent.tech` cho API) nằm trong zone Cloudflare
của tài khoản. Frontend là static bundle, host trên **Cloudflare Pages** project
`agentlab`; backend chạy Railway tại `apii.labagent.tech`.

Deploy thủ công (không dùng git-connected build — direct upload):

```bash
# 1. Build với API base trỏ về backend Railway (bắt buộc — bỏ trống sẽ gọi /api
#    trên chính domain Pages và nhận 404)
VITE_API_BASE=https://apii.labagent.tech/api npm run build

# 2. Push dist/ lên Pages project 'agentlab', nhánh main = production
CLOUDFLARE_API_TOKEN=<token-có-quyền-Pages:Edit> \
  npx wrangler pages deploy dist --project-name=agentlab --branch=main --commit-dirty=true
```

Lưu ý vận hành:

- Token cần quyền **Cloudflare Pages: Edit**; quyền *Cache Purge* của zone là
  riêng (thiếu nó thì HTML cũ ở edge cache tự hết hạn sau vài phút, không cần purge).
- Pages **tự làm SPA fallback**: deep-link kiểu `/blog/javascript/1` trả 200
  `text/html` kèm `index.html`, không cần `_redirects`.
- `robots.txt` tĩnh nằm trong `dist/` (`public/robots.txt`); bản động do backend
  sinh chỉ dùng được khi self-host nginx.
- Backend phải set `CORS_ORIGIN=https://labagent.tech` (Pages origin khác domain
  API nên mọi request đều cross-origin).

## 5a. Frontend — GitHub Pages (labagent24.github.io)

Repo: `labagent24.github.io` (user site). Pipeline `.github/workflows/deploy-pages.yml`
tự build + deploy khi push nhánh `main`.

1. **Settings → Pages → Source = "GitHub Actions"** (không dùng "Deploy from branch").
2. **Settings → Secrets and variables → Actions → Variables** → thêm:
   - `VITE_API_BASE` = `https://<backend-của-bạn>/api` (vd: URL Railway). Bỏ trống workflow sẽ fail có chủ đích.
3. Workflow tự tạo `404.html` (SPA fallback cho deep-link như `/checkout`, `/order/success/...`) và `.nojekyll`.
4. Backend phải cho phép CORS từ Pages — trên Railway set:
   - `CORS_ORIGIN=https://labagent24.github.io`
   - `APP_URL=https://labagent24.github.io` (dùng làm return_url PayPal)

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

## 8. SEO cho blog

Blog được phục vụ **hoàn toàn từ MongoDB** (collection `fcc_news.posts` — lưu trữ
bài viết freeCodeCamp). Mỗi entry chỉ có metadata (tiêu đề, tác giả, ngày đăng,
ảnh bìa, tag) và link về bài gốc trên freeCodeCamp.org; bài viết không được
copy nội dung. Cấu trúc blog:

| URL | Nội dung |
|---|---|
| `/blog` | **Chủ đề bài viết** (topic index) — chỉ liệt kê 1.246 chủ đề, phân trang 60/trang (`?page=N`), KHÔNG load bài viết |
| `/blog/<chủ-đề>/1` | 20 bài viết của chủ đề đó, trang 1 |
| `/blog/<chủ-đề>/2` | Trang 2 (mỗi trang 20 bài; `/blog/javascript` có 55 trang) |
| `/blog/tat-ca/1` | Feed tất cả bài viết (mọi chủ đề) |
| `/blog/<chủ-đề>` | Redirect 301 nội bộ về `/blog/<chủ-đề>/1` |
| `/blog/archive` | Redirect 301 nội bộ về `/blog` (alias cũ) |

### Endpoint SEO (backend, đi qua nginx)

| Endpoint | Nội dung |
|---|---|
| `GET /robots.txt` | Crawl policy (`Disallow: /admin`, `/api/`) + dòng `Sitemap:` trỏ tới `APP_URL` |
| `GET /sitemap.xml` | Trang tĩnh storefront + `/blog` + trang 1 của mọi chủ đề có ≥5 bài viết (~370 URL) |
| `GET /blog/rss.xml` | RSS 2.0 (`vi-vn`, `atom:link`, tối đa 20 bài mới nhất, link về bài gốc kèm attribution) |
| `GET /api/blog/posts`, `/api/blog/tags`, `/api/blog/stats` | API công khai đọc archive từ MongoDB (phân trang chủ đề, phân trang bài viết theo chủ đề, tìm theo tiêu đề) |
| `GET /render` | **Chỉ dùng nội bộ**: nginx chỉ route crawler tới đây (xem bên dưới) |

Blog **không tải hàng loạt**: trang chủ blog chỉ gọi 1 API lấy danh sách chủ đề
(60 chủ đề/trang); bài viết chỉ được tải khi người dùng vào trang của một chủ
đề cụ thể, 20 bài mỗi trang qua URL crawlable `/blog/<chủ-đề>/<trang>`.

### Dynamic rendering cho crawler

SPA là React nên meta tag chỉ tồn tại phía client. Với các user-agent là bot
(Googlebot, Bingbot, facebookexternalhit, twitterbot, linkedinbot, discordbot, slackbot,
whatsapp, telegrambot, GPTBot, ...), nginx map `$blog_render_bot` phát hiện
crawler **và** đường dẫn `/blog`, rồi chuyển request nội bộ sang
backend `GET /render` (header `X-Original-URI` giữ đường dẫn gốc). Backend:

1. Fetch shell `index.html` của SPA rồi chèn `<title>`, `description`, `canonical`,
   `og:*`, `twitter:*` và JSON-LD (`Blog` cho trang chủ đề, `CollectionPage` cho
   trang bài viết của chủ đề) ngay trước `</head>`.
   Shell được cache 5 phút; bundle JS của React **giữ nguyên** để Googlebot
   vẫn render được SPA.
2. Chèn nội dung crawlable vào `<main>`:
   - `/blog`: danh sách 60 chủ đề (link tới `/blog/<chủ-đề>/1`)
   - `/blog/<chủ-đề>/<trang>`: 30 bài mới nhất của chủ đề, link về bài
     gốc trên freeCodeCamp.org (`rel="noopener noreferrer nofollow"`) + ghi chú
     nguồn/publisher. Canonical trỏ đúng `/blog/<chủ-đề>/<trang>`.
   - `/blog/archive` (alias cũ) trả canonical về `/blog`.

URL frontend để fetch shell lấy theo thứ tự: `WEB_ORIGIN` → `APP_URL` → host của request.
Trong docker-compose đã set sẵn `WEB_ORIGIN=http://web:80` cho backend.

**Lưu ý vận hành:** mọi thay đổi `nginx.conf` cần build lại image web
(`docker compose up -d --build web`) vì file được `COPY` trong `Dockerfile.web`.

### Phạm vi áp dụng

- **Self-hosted / nginx (docker-compose):** đầy đủ các cơ chế trên.
- **Vercel / GitHub Pages:** không proxy được `/render`, robot và trang tĩnh
  (404.html fallback) vẫn hoạt động; meta tag cho bot mạng xã hội trên các nền
  tảng này bị hạn chế so với bản nginx. File `public/robots.txt` là bản tĩnh
  dự phòng cho GitHub Pages (không thể rewrite động).
