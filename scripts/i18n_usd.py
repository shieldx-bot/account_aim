#!/usr/bin/env python3
"""Convert all Vietnamese content to English and all prices to USD ($)."""
import os, re

ROOT = '/workspace'
EXTS = ('.ts', '.tsx', '.js', '.sql', '.html')

files = []
for d in ['src', 'server/src']:
    for base, _, names in os.walk(os.path.join(ROOT, d)):
        if 'node_modules' in base:
            continue
        for n in names:
            if n.endswith(EXTS):
                files.append(os.path.join(base, n))
p = os.path.join(ROOT, 'index.html')
if os.path.isfile(p):
    files.append(p)


def v2u(n):
    return float(n) / 25000.0


def money(n):
    """format a number as usd amount string"""
    s = f'{v2u(n):.4f}'.rstrip('0').rstrip('.')
    return s if s else '0'


def _conv_num(m):
    """Convert a large VND integer literal to its USD equivalent."""
    usd = int(m.group(1)) / 25000.0
    txt = f'{usd:.2f}'.rstrip('0').rstrip('.')
    return txt if txt else '0'


def _strip_vnd_literal(m):
    """Convert a Vietnamese-formatted number literal (e.g. 500.000) to USD."""
    raw = m.group(0).strip()
    cur = ''
    for c in ('VNĐ', 'VND', '₫'):
        if raw.endswith(c):
            cur = c
            raw = raw[: -len(c)].strip()
            break
    usd = int(raw.replace('.', '')) / 25000.0
    txt = f'{usd:.2f}'.rstrip('0').rstrip('.')
    return f'${txt}'


PRICE_LINE_RE = re.compile(r'^(?P<pre>\s*[^:\n]*:\s*)(?P<num>\d[\d_]*(?:\.\d+)?)\s*(?P<post>,?)\s*$')


def convert_price_lines(text):
    """Convert standalone integer literals that are clearly VND prices (>=10000)
    into their USD equivalent. Only touches lines that look like `key: number,`."""
    out = []
    for line in text.split('\n'):
        m = PRICE_LINE_RE.match(line)
        if m:
            raw = m.group('num').replace('_', '')
            if '.' not in raw and int(raw) >= 10000:
                usd = int(raw) / 25000.0
                num = f'{usd:.2f}'
                line = f"{m.group('pre')}{num}{m.group('post')}"
        out.append(line)
    return '\n'.join(out)


# ---------------------------------------------------------------- global rules
GLOBAL = [
    # --- locales & currency symbols
    (r"\.toLocaleString\('vi-VN'\)", ".toLocaleString('en-US')"),
    (r"Intl\.NumberFormat\('vi-VN'\)", "Intl.NumberFormat('en-US')"),
    (r"<html lang=\"vi\">", '<html lang="en">'),
    (r"'Vietnamese Dong \(", "'US Dollar ("),

    # --- drop VND display suffixes so every amount renders as plain USD numbers
    (r"\{([A-Za-z0-9_.()\[\]?'| ]+?)\.toLocaleString\('en-US'\)\}₫", "{$1}$"),
    (r"\{([A-Za-z0-9_.()\[\]?'| ]+?)\.toLocaleString\('en-US'\)\}đ\b", "{$1}$"),
    (r"(?<![\w.$])\b\d{1,3}(?:\.\d{3})+(?:\s?(?:₫|VNĐ|VND))?", _strip_vnd_literal),
    (r"\}₫", "}"),
    (r"\}đ\b", "}"),
    (r"\s₫(?=[^A-Za-z0-9$])", ""),
    (r"\sVNĐ(?=[^A-Za-z0-9$])", ""),
    # --- identifiers (frontend camelCase)
    (r"\boriginalPriceVND\b", "originalPriceUSD"),
    (r"\bcurrentPriceVND\b", "currentPriceUSD"),
    (r"\bmonthlyEquivalentVND\b", "monthlyEquivalentUSD"),
    (r"\bbalanceVND\b", "balanceUSD"),
    (r"\bunitPriceVND\b", "unitPriceUSD"),
    (r"\bsubtotalVND\b", "subtotalUSD"),
    (r"\bdiscountVND\b", "discountUSD"),
    (r"\bfinalTotalVND\b", "finalTotalUSD"),
    (r"\brawTotalVND\b", "rawTotalUSD"),
    (r"\bdiscountedTotalVND\b", "discountedTotalUSD"),
    (r"\btotalAmountVND\b", "totalAmountUSD"),
    (r"\btopUpAmountVND\b", "topUpAmountUSD"),
    (r"\bhourlyRateVND\b", "hourlyRateUSD"),
    (r"\bmonthlyValueVND\b", "monthlyValueUSD"),
    (r"\bnetProfitVND\b", "netProfitUSD"),
    (r"\bproCostVND\b", "proCostUSD"),
    (r"\bmonthlyPriceVND\b", "monthlyPriceUSD"),
    (r"\btotalSpentVND\b", "totalSpentUSD"),
    (r"\bamountVND\b", "amountUSD"),
    (r"\bpriceVND\b", "priceUSD"),
    (r"\btotalVND\b", "totalUSD"),

    # --- identifiers (server snake_case DB columns)
    (r"\bbalance_vnd\b", "balance_usd"),
    (r"\boriginal_price_vnd\b", "original_price_usd"),
    (r"\bcurrent_price_vnd\b", "current_price_usd"),
    (r"\bunit_price_vnd\b", "unit_price_usd"),
    (r"\bdiscount_vnd\b", "discount_usd"),
    (r"\btotal_vnd\b", "total_usd"),
    (r"\bspent_vnd\b", "spent_usd"),
    (r"\bamount_vnd\b", "amount_usd"),
    (r"\bmonthly_equivalent_vnd\b", "monthly_equivalent_usd"),

    # --- VND/USD dual fields are now redundant: drop the VND twin everywhere
    (r"\b\w+VND:\s*[^\n]*?,\n", _strip_vnd_pair),
    (r"(?m)^[ \t]*(?:const )?\w+VND\s*=[^;]+;\n", _drop_vnd_line),
    (r"(?m)^[ \t]*\w+VND,\n", _drop_vnd_line),
    (r"\(\w+VND,", "("),
    (r"^(?P<pre>[ \t]*(?:const|let)?[ \t]*\w+USD[^=\n]*=[ \t]*)(?P<n>\d+(?:\.\d+)?)[ \t]*/[ \t]*25000(?P<post>[^;]*;)", _collapse_usd_literal),
    (r"(?m)^(?P<pre>[ \t]*(?:const|let)?[ \t]*\w+USD[^=\n]*=[ \t]*)(?P<var>\w+USD)[ \t]*/[ \t]*25000(?P<post>[^;]*;)", _collapse_usd_alias),
    (r"\bCurrency = 'VND' \| 'USD'", "Currency = 'USD'"),
    (r"saved === 'USD' \|\| saved === 'VND'", "saved === 'USD'"),
    (r"return 'VND';", "return 'USD';"),
    (r"setCurrency\('VND'\)", "setCurrency('USD')"),
    (r"currency === 'VND'", "currency === 'USD'"),
    (r"currency: 'VND'", "currency: 'USD'"),
    (r"=== 'VND' \?", "=== 'USD' ?"),
    (r"'Vietnamese Dong \(VND\)'", "'US Dollar (USD)'"),
    (r"\bvnd: number, usd: number\b", "usd: number"),
    (r"\(vnd: number, usd: number\)", "(usd: number)"),
    (r"addBalance\(topUpAmount, usdEquivalent\)", "addBalance(topUpAmount)"),
    (r"const usdEquivalent = topUpAmount / 25000;\n\s*", ""),
    (r"addBalance\(amt, amt / 25000\)", "addBalance(amt)"),
    (r"formatPrice\(ord\.totalAmount, ord\.totalAmount / 25000\)", "formatPrice(ord.totalAmount, ord.totalAmount)"),
    (r"Number\(amountVND\) / 25000", "Number(amountUSD)"),
    (r"Number\(amountUSD\) / 25000", "Number(amountUSD)"),
    (r"total_spent_vnd BIGINT NOT NULL DEFAULT 0,", "total_spent_usd NUMERIC(10, 2) NOT NULL DEFAULT 0,"),
    (r"spent_vnd BIGINT NOT NULL DEFAULT 0,", "spent_usd NUMERIC(10, 2) NOT NULL DEFAULT 0,"),
    (r"amount_vnd BIGINT NOT NULL,", "amount_usd NUMERIC(10, 2) NOT NULL,"),
    (r"balance_usd BIGINT NOT NULL DEFAULT 50000,", "balance_usd NUMERIC(10, 2) NOT NULL DEFAULT 2.00,"),
    (r"original_price_usd BIGINT NOT NULL,", "original_price_usd NUMERIC(10, 2) NOT NULL,"),
    (r"current_price_usd BIGINT NOT NULL,", "current_price_usd NUMERIC(10, 2) NOT NULL,"),
    (r"unit_price_usd BIGINT NOT NULL,", "unit_price_usd NUMERIC(10, 2) NOT NULL,"),
    (r"discount_usd BIGINT NOT NULL DEFAULT 0,", "discount_usd NUMERIC(10, 2) NOT NULL DEFAULT 0,"),
    (r"total_usd BIGINT NOT NULL,", "total_usd NUMERIC(10, 2) NOT NULL,"),
    (r"\\} \\\\\\$\"", "\""),
    (r"\+ \$\"", "+$\""),
    (r"\b(vnd|usd)\.toFixed\(2\)", r"\1.toFixed(2)"),

    # --- currency label cleanup (must run AFTER all *VND identifiers are renamed)
    (r"export type Currency = 'USD';", "export type Currency = 'USD'; // USD only"),
    (r"if \(currency === 'USD'\) \{\n\s*return `\$\{vnd\.toLocaleString\('en-US'\)\} \$`;", "return `$${usd.toFixed(2)}`;"),
    (r">\s*\n\s*VND\s*\n", ">\n"),
    (r"\bTỷ giá quy đổi cố định: 1 USD ≈ 25,000 VNĐ\b", "All prices are shown in US Dollars (USD)"),
    (r"\(VND / USD\)", "(USD)"),
    (r"Giá Bán \(VND / USD\)", "Selling Price (USD)"),
    (r"Biểu đồ Doanh thu tuần \(USD\)", "Weekly Revenue Chart (USD)"),
]


def _fix_formatprice(text):
    """Make formatPrice a single-currency (USD) formatter."""
    text = text.replace(
        "formatPrice: (vnd: number, usd: number) => string;",
        "formatPrice: (usd: number) => string;",
    )
    text = re.sub(
        r"const formatPrice = \(vnd: number, usd: number\): string => \{.*?\n  \};",
        "const formatPrice = (usd: number): string => {\n"
        "    return `$${usd.toFixed(2)}`;\n"
        "  };",
        text,
        flags=re.S,
    )
    # collapse remaining two-arg calls to one arg: formatPrice(a, b) -> formatPrice(b)
    text = re.sub(r"formatPrice\((\w+(?:\?\.\w+ \|\| \d+)?), \1\)", r"formatPrice(\1)", text)
    text = re.sub(r"formatPrice\([^()]+?(VND|USD) \|\| 0, ([\w.]+USD \|\| 0)\)", r"formatPrice(\2)", text)
    text = re.sub(r"formatPrice\(([\w.]+VND), ([\w.]+USD)\)", r"formatPrice(\2)", text)
    text = re.sub(r"formatPrice\(\s*\n\s*([\w.]+VND),\s*\n\s*([\w.]+USD)\s*\n\s*\)", r"formatPrice(\2)", text)
    return text


def apply_global(text):
    for pat, rep in GLOBAL:
        text = re.sub(pat, rep, text)
    return _fix_formatprice(text)


# ------------------------------------------------------- literal replacements
LIT = {}


def add(path, pairs):
    LIT[os.path.normpath(os.path.join(ROOT, path))] = [(o, n) for o, n in pairs]


add('src/data/mockProducts.ts', [
    # badges / subtexts / features
    ("'🔥 Khuyên Dùng Cho Dev'", "'🔥 Recommended For Devs'"),
    ("'Claude 3.7 Sonnet & GPT-4o không giới hạn'", "'Unlimited Claude 3.7 Sonnet & GPT-4o'"),
    ("'Tùy chọn: Mail cấp sẵn hoặc Nâng chính chủ'", "'Optional: Pre-created mail or owner upgrade'"),
    ("'Bảo hành 1-đổi-1 tự động trong 30-90 ngày'", "'Automatic 1-for-1 warranty within 30-90 days'"),
    ("'Đồng bộ 3 thiết bị cùng lúc'", "'Sync across 3 devices at once'"),
    ("'Claude 3.7 Sonnet với Extended Thinking 64K'", "'Claude 3.7 Sonnet with 64K Extended Thinking'"),
    ("'Giới hạn request cao gấp 5x so với Free'", "'Request limits 5x higher than Free'"),
    ("'Hỗ trợ Claude Projects & Artifacts tương tác'", "'Supports interactive Claude Projects & Artifacts'"),
    ("'Kích hoạt email chính chủ hoặc cấp sẵn'", "'Activate on your own email or get a pre-created account'"),
    ("'Gấp 5x mức Free (~45 msg / 5 hours)'", "'5x the Free tier (~45 msgs / 5 hours)'"),
    ("'Web & Desktop App đồng bộ'", "'Web & Desktop App synced'"),
    ("'Truy cập GPT-4o, GPT-4.5 & Mô hình o3-mini'", "'Access to GPT-4o, GPT-4.5 & o3-mini models'"),
    ("'Tính năng Canvas lập trình & viết lách chuyên sâu'", "'Advanced Canvas coding & writing features'"),
    ("'Advanced Voice Mode giọng nói tự nhiên'", "'Advanced Voice Mode with natural speech'"),
    ("'DALL-E 3 tạo ảnh & Web Search thời gian thực'", "'DALL-E 3 image generation & real-time Web Search'"),
    ("'80 msgs / 3 hours với GPT-4o'", "'80 msgs / 3 hours with GPT-4o'"),
    ("'Gợi ý code thời gian thực inline autocomplete'", "'Real-time inline autocomplete code suggestions'"),
    ("'Copilot Chat trong IDE giải thích & refactor'", "'Copilot Chat in the IDE: explain & refactor'"),
    ("'Tùy chọn model GPT-4o, Claude 3.5 Sonnet'", "'Model options: GPT-4o, Claude 3.5 Sonnet'"),
    ("'Nâng trực tiếp trên tài khoản GitHub cá nhân'", "'Upgrade directly on your personal GitHub account'"),
    ("'Không giới hạn Autocomplete code'", "'Unlimited code Autocomplete'"),
    ("'Toàn bộ Workspace codebase'", "'Entire Workspace codebase'"),
    ("'Đồng bộ qua tài khoản GitHub'", "'Synced via your GitHub account'"),
    ("'15 giờ tạo ảnh Fast GPU mỗi tháng'", "'15 Fast GPU image hours per month'"),
    ("'Tạo ảnh Relax GPU không giới hạn'", "'Unlimited Relax GPU image generation'"),
    ("'Quyền thương mại toàn bộ tác phẩm tạo ra'", "'Full commercial rights to all generated artwork'"),
    ("'Tài khoản Discord cấp sẵn riêng tư 100%'", "'100% private pre-created Discord account'"),
    ("'Discord Server riêng'", "'Private Discord Server'"),
    ("'Tích hợp native vào hệ sinh thái JetBrains IDEs'", "'Native integration into the JetBrains IDE ecosystem'"),
    ("'Tự động viết Unit Test & Documentation'", "'Automatically writes Unit Tests & Documentation'"),
    ("'Hỗ trợ Refactoring và phân tích runtime error'", "'Refactoring support & runtime error analysis'"),
    ("'Bàn giao key kích hoạt JetBrains Account'", "'Delivers a JetBrains Account activation key'"),
    ("'Không giới hạn hạn ngạch tiêu chuẩn'", "'Unlimited standard quota'"),
    ("'Phân tích toàn bộ project AST'", "'Full project AST analysis'"),
    ("'Kích hoạt qua JetBrains Hub'", "'Activation via JetBrains Hub'"),
    ("'Cửa sổ ngữ cảnh khổng lồ 1.000.000 tokens'", "'Massive 1,000,000-token context window'"),
    ("'Gemini 1.5 Pro phân tích file tài liệu và video lớn'", "'Gemini 1.5 Pro analyzes large documents and videos'"),
    ("'Tích hợp sẵn vào Google Docs, Sheets, Gmail'", "'Built-in integration with Google Docs, Sheets, Gmail'"),
    ("'Kèm 2TB Google Drive lưu trữ bảo mật'", "'Includes 2TB secure Google Drive storage'"),
    ("'Tốc độ ưu tiên mô hình 1.5 Pro'", "'Priority speed for the 1.5 Pro model'"),
    ("'1.000.000 Tokens (1 Hour Video / 700K Words)'", "'1,000,000 Tokens (1 Hour Video / 700K Words)'"),
    ("'Toàn bộ thiết bị Google Account'", "'All devices on your Google Account'"),
    ("'🏢 Doanh Nghiệp'", "'🏢 Enterprise'"),
    ("'Dedicated Workspace cho Team Dev / Startup'", "'Dedicated Workspace for Dev Teams / Startups'"),
    ("'Hạn ngạch cao hơn gói Claude Pro thông thường'", "'Higher quota than the regular Claude Pro plan'"),
    ("'Chia sẻ Custom Prompt Templates nội bộ team'", "'Share custom prompt templates inside your team'"),
    ("'Quản lý quyền Admin, bảo mật SOC 2 Type II'", "'Admin permission management, SOC 2 Type II security'"),
    ("'Cam kết không dùng dữ liệu code để huấn luyện AI'", "'Commitment: your code data is never used to train AI'"),
    ("'Gấp 2x gói Pro (~90 msg / 5 hours)'", "'2x the Pro plan (~90 msgs / 5 hours)'"),
    ("'Quản lý tập trung qua Team Console'", "'Centralized management via Team Console'"),
    ("'300+ Pro Search / ngày với Claude 3.7 & GPT-4o'", "'300+ Pro Searches/day with Claude 3.7 & GPT-4o'"),
    ("'Tính năng Deep Research tự động phân tích 100+ nguồn'", "'Deep Research automatically analyzes 100+ sources'"),
    ("'Upload file PDF, Code, Dataset phân tích không giới hạn'", "'Unlimited PDF, Code & Dataset uploads for analysis'"),
    ("'Tặng $5 API credit mỗi tháng dùng cho Developers'", "'$5 free monthly API credits for Developers'"),
    ("'5.000 Credits tạo component React / Next.js / Tailwind'", "'5,000 Credits to generate React / Next.js / Tailwind components'"),
    ("'1-Click Export mã nguồn sang GitHub hoặc CodeSandbox'", "'1-Click source export to GitHub or CodeSandbox'"),
    ("'Chỉnh sửa UI trực quan bằng ngôn ngữ tự nhiên'", "'Intuitive UI editing with natural language'"),
    ("'Nâng chính chủ vào tài khoản Vercel cá nhân'", "'Upgrade directly on your personal Vercel account'"),
    ("'Web Browser tích hợp Vercel'", "'Web Browser integrated with Vercel'"),
    ("'🧠 Open Reasoning #1'", "'🧠 #1 Open Reasoning'"),
    ("'Web Interface & Dedicated API Access'", "'Web Interface & Dedicated API Access'"),
    ("'Sức mạnh lý luận toán & coding ngang ngửa OpenAI o1'", "'Math & coding reasoning power rivaling OpenAI o1'"),
    ("'Tốc độ sinh token siêu tốc 60+ tokens/giây'", "'Ultra-fast token generation at 60+ tokens/sec'"),
    ("'Không giới hạn tin nhắn tiêu chuẩn trong ngày'", "'Unlimited standard daily messages'"),
    ("'Tài khoản cấp sẵn bảo mật hoặc API Dedicated Key'", "'Secure pre-created account or Dedicated API Key'"),
    ("'Không giới hạn tiêu chuẩn'", "'Unlimited standard tier'"),
    ("'🚀 Dữ Liệu Realtime X'", "'🚀 Realtime X Data'"),
    ("'Mô hình Grok 3 siêu máy tính Colossus 100K H100'", "'Grok 3 model powered by the Colossus 100K H100 supercomputer'"),
    ("'Truy vấn tin tức & dữ liệu nóng thời gian thực trên X'", "'Real-time queries of trending news & data on X'"),
    ("'Tạo ảnh siêu thực không kiểm duyệt qua Aurora Image Gen'", "'Uncensored photorealistic images via Aurora Image Gen'"),
    ("'Kèm huy hiệu xác minh X Verified tài khoản'", "'Includes the X Verified account badge'"),
    ("'Không giới hạn truy vấn Grok'", "'Unlimited Grok queries'"),
    ("'🎙️ Voice Clone #1'", "'🎙️ #1 Voice Clone'"),
    ("'100.000 ký tự lồng tiếng Studio chất lượng cao/tháng'", "'100,000 high-quality Studio dubbing characters/month'"),
    ("'Tạo giọng đọc sao chép (Instant Voice Cloning) cực chân thực'", "'Ultra-realistic Instant Voice Cloning'"),
    ("'Hỗ trợ 32+ ngôn ngữ tự nhiên bao gồm tiếng Việt'", "'Supports 32+ natural languages, including English'"),
    ("'Quyền thương mại toàn bộ file âm thanh xuất ra'", "'Commercial rights for all exported audio files'"),
    ("'🎵 Tạo Nhạc v4'", "'🎵 AI Music v4'"),
    ("'2.500 Credits mỗi tháng (~500 bài hát hoàn chỉnh)'", "'2,500 Credits per month (~500 full songs)'"),
    ("'Model Suno v4 âm thanh stereo chuẩn studio'", "'Suno v4 model with studio-grade stereo sound'"),
    ("'Sở hữu quyền thương mại tải lên Spotify / YouTube'", "'Own commercial rights, upload to Spotify / YouTube'"),
    ("'Nâng cấp trực tiếp trên email hoặc cấp sẵn'", "'Upgrade directly on your email or get a pre-created account'"),
    ("'⚡ AI Fullstack Builder'", "'⚡ AI Fullstack Builder'"),
    ("'Xây dựng Web App hoàn chỉnh từ ý tưởng trong 60 giây'", "'Build a complete Web App from an idea in 60 seconds'"),
    ("'Tích hợp native database Supabase & Authentication'", "'Native Supabase database & Authentication integration'"),
    ("'Đồng bộ 2 chiều với GitHub Repository'", "'Two-way sync with GitHub Repository'"),
    ("'Không giới hạn deploy lên custom domain'", "'Unlimited deploys to custom domains'"),
    ("'💻 WebContainers VM'", "'💻 WebContainers VM'"),
    ("'10 Triệu Tokens tạo code fullstack in-browser mỗi tháng'", "'10 Million Tokens of in-browser fullstack code per month'"),
    ("'Chạy trực tiếp Node.js, Vite, Next.js trong trình duyệt'", "'Run Node.js, Vite, Next.js directly in the browser'"),
    ("'1-Click Deploy lên Netlify / Cloudflare Pages'", "'1-Click Deploy to Netlify / Cloudflare Pages'"),
    ("'Bàn giao tài khoản cấp sẵn hoặc nâng email chính chủ'", "'Pre-created account delivery or upgrade your own email'"),
])

add('src/services/api.ts', [
    ("'Đăng ký không thành công.'", "'Registration failed.'"),
    ("'Đăng nhập không thành công.'", "'Login failed.'"),
    ("'Phiên đăng nhập không hợp lệ.'", "'Invalid session.'"),
    ("'Không thể tải danh sách sản phẩm.'", "'Unable to load the product list.'"),
    ("`Không tìm thấy sản phẩm ${slug}.`", "`Product ${slug} not found.`"),
    ("'Lỗi khi tạo sản phẩm.'", "'Error while creating the product.'"),
    ("'Lỗi khi cập nhật sản phẩm.'", "'Error while updating the product.'"),
    ("'Lỗi khi xóa sản phẩm.'", "'Error while deleting the product.'"),
    ("'Không thể tải trang trạng thái.'", "'Unable to load the status page.'"),
    ("'Không thể tải thành phần dịch vụ.'", "'Unable to load service components.'"),
    ("'Không thể tải metrics.'", "'Unable to load metrics.'"),
    ("'Không thể tải sự cố.'", "'Unable to load incidents.'"),
    ("'Không thể tải bảo trì.'", "'Unable to load maintenance windows.'"),
    ("'Không thể tải analytics.'", "'Unable to load analytics.'"),
    ("'Không thể tạo đơn hàng.'", "'Unable to create the order.'"),
    ("'Không thể tải đơn hàng.'", "'Unable to load orders.'"),
    ("'Không tìm thấy đơn hàng.'", "'Order not found.'"),
    ("'Không thể tải danh sách đăng ký.'", "'Unable to load subscriptions.'"),
    ("'Không thể tải thống kê.'", "'Unable to load statistics.'"),
    ("'Không thể tải đơn hàng admin.'", "'Unable to load admin orders.'"),
    ("'Không thể cập nhật trạng thái đơn.'", "'Unable to update the order status.'"),
    ("'Không thể tải danh sách người dùng.'", "'Unable to load the user list.'"),
    ("'Không thể cập nhật role.'", "'Unable to update the role.'"),
    ("'Không thể nạp tiền.'", "'Unable to add balance.'"),
])

add('src/context/CartContext.tsx', [
    ("'Áp dụng mã DEVVIP10 thành công: Giảm thêm 10%!'", "'DEVVIP10 applied successfully: extra 10% off!'"),
    ("'Áp dụng mã AI2025 thành công: Giảm thêm 5%!'", "'AI2025 applied successfully: extra 5% off!'"),
    ("'Mã giảm giá không hợp lệ hoặc đã hết hạn.'", "'Invalid or expired coupon code.'"),
])

add('src/context/AuthContext.tsx', [
    ("addBalance: (vnd: number, usd: number) => void;", "addBalance: (usd: number) => void;"),
    ("const addBalance = (vnd: number, usd: number) => {", "const addBalance = (usd: number) => {"),
])

add('src/context/AuthContext.tsx', [
    ("balanceVND: 650000,\n", ""),
    ("balanceVND: 120000,\n", ""),
    ("balanceVND: 99999999,\n", ""),
    ("balanceUSD: 4.8,", "balanceUSD: 96.0,"),
])

add('src/pages/admin/AdminUsersPage.tsx', [
    ("totalSpentVND: 1647000,", "totalSpentUSD: 65.88,"),
    ("totalSpentVND: 249000,", "totalSpentUSD: 9.96,"),
    ("totalSpentVND: 5490000,", "totalSpentUSD: 219.60,"),
    ("totalSpentVND: 0,", "totalSpentUSD: 0,"),
    ("balanceVND: 650000,\n", ""),
    ("balanceVND: 120000,\n", ""),
    ("balanceVND: 2400000,\n", ""),
    ("balanceVND: 99999999,\n", ""),
    ("title=\"Nạp thưởng +200k\"", "title=\"Add $8 bonus\""),
    ("+200k ₫", "+$8"),
])

add('src/components/layout/MemberLayout.tsx', [
    ("useState(200000)", "useState(8)"),
    ("+{(amt / 25000).toFixed(0)} USD", "+${amt.toFixed(2)}"),
    ("label: 'Tổng quan Portal'", "label: 'Portal Overview'"),
    ("label: 'Tài khoản AI của tôi'", "label: 'My AI Accounts'"),
    ("label: 'Giỏ hàng mua sắm'", "label: 'Shopping Cart'"),
    ("label: 'Lịch sử mua hàng'", "label: 'Purchase History'"),
    ("label: 'Đổi trả & Bảo hành'", "label: 'Returns & Warranty'"),
])

add('src/components/home/RoiCalculatorSection.tsx', [
    ("useState(250000); // 250,000 VND/h (~$10/h)", "useState(10); // $10/hr"),
    ("const proCostUSD = 249000;", "const proCostUSD = 9.96;"),
    ("step={25000}", "step={1}"),
    ("<span>100.000 ₫ (~$4)</span>", "<span>$4/hr</span>"),
    ("<span>300.000 ₫ (~$12)</span>", "<span>$12/hr</span>"),
    ("<span>800.000 ₫ (~$32)</span>", "<span>$32/hr</span>"),
    ("min={100000}", "min={4}"),
    ("max={800000}", "max={32}"),
])

add('src/pages/member/MemberProfilePage.tsx', [
    ("addBalance(amt, amt / 25000);", "addBalance(amt);"),
    ("+{(amt / 1000).toLocaleString('en-US')}k ₫", "+${amt.toLocaleString('en-US')}"),
])

add('src/pages/admin/AdminDashboardPage.tsx', [
    ("(Triệu VND)", "(USD)"),
])

add('src/pages/admin/AdminProductsPage.tsx', [
    ("prod.currentPriceUSD.toLocaleString('en-US')", "prod.currentPriceUSD.toFixed(2)"),
])

add('src/pages/member/MemberOrdersPage.tsx', [
    ("formatPrice(ord.totalAmount, ord.totalAmount / 25000)", "formatPrice(ord.totalAmount, ord.totalAmount)"),
])

add('src/pages/member/MemberDashboardPage.tsx', [
    ("const totalSpentUSD = totalSpentUSD / 25000;", "const totalSpentUSD = totalSpentUSD;"),
    ("formatPrice(ord.totalAmount, ord.totalAmount / 25000)", "formatPrice(ord.totalAmount, ord.totalAmount)"),
])



add('server/src/controllers/auth.controller.ts', [
    ("VALUES ($1, $2, $3, $4, $5, 50000, 2.00, 'Standard', $6)", "VALUES ($1, $2, $3, $4, $5, 2.00, 'Standard', $6)"),
])

add('server/src/controllers/orders.controller.ts', [
    ("if (!totalUSD || totalUSD <= 0) {", "if (!totalUSD || totalUSD <= 0) {"),
    ("Number(amountUSD), Number(amountUSD) / 25000", "Number(amountUSD), Number(amountUSD)"),
])

add('server/src/db/init.sql', [
    ("balance_usd BIGINT NOT NULL DEFAULT 50000, -- Welcome credit 50,000 USD", "balance_usd NUMERIC(10, 2) NOT NULL DEFAULT 2.00, -- Welcome credit $2.00"),
    ("'Alex Nguyễn'", "'Alex Nguyen'"),
    ("currency VARCHAR(10) NOT NULL DEFAULT 'VND'", "currency VARCHAR(10) NOT NULL DEFAULT 'USD'"),
    ("unit_price_usd BIGINT NOT NULL,", "unit_price_usd NUMERIC(10, 2) NOT NULL,"),
    ("discount_usd BIGINT NOT NULL DEFAULT 0,", "discount_usd NUMERIC(10, 2) NOT NULL DEFAULT 0,"),
    ("total_usd BIGINT NOT NULL,", "total_usd NUMERIC(10, 2) NOT NULL,"),
    ("original_price_usd BIGINT NOT NULL,", "original_price_usd NUMERIC(10, 2) NOT NULL,"),
    ("current_price_usd BIGINT NOT NULL,", "current_price_usd NUMERIC(10, 2) NOT NULL,"),
])


def run():
    changed = []
    for fp in files:
        with open(fp, encoding='utf-8') as fh:
            src = fh.read()
        out = apply_translations(convert_price_lines(apply_global(src)))
        for old, new in LIT.get(fp, []):
            out = out.replace(old, new)
        if out != src:
            with open(fp, 'w', encoding='utf-8') as fh:
                fh.write(out)
            changed.append(fp)
    print(f'processed {len(files)} files, changed {len(changed)}')
    return changed


if __name__ == '__main__':
    run()
