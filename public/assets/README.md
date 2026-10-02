# ASSET REPOSITORY USAGE GUIDE
## ROOT DIRECTORY: `/assets`

This folder contains all standardized, optimized graphic assets, named according to the DesignOps document `DesignOps_Asset_Checklist_AI_PRO.md`.

---

### 1. Folder structure:
```text
assets/
├── logos/          # Brand identity & payment gateway logos (SVG)
├── icons/          # System UI icons (SVG)
└── images/         # Backgrounds, empty states, illustrations & customer avatars (SVG, WebP)
```

---

### 2. Detailed file catalog:

#### A. `/assets/logos` (14 Brand & Payment SVG Logos)
- `logo_aipro_main_dark.svg`: Main site logo (Cyan/Blue terminal `>_` + AgentLab).
- `logo_aipro_favicon.svg`: 32x32px browser tab icon.
- `logo_brand_openai_chatgpt.svg`: Official OpenAI ChatGPT vector logo.
- `logo_brand_anthropic_claude.svg`: Official Anthropic Claude vector logo.
- `logo_brand_cursor.svg`: Official Cursor AI vector logo.
- `logo_brand_github_copilot.svg`: Official GitHub Copilot vector logo.
- `logo_brand_jetbrains.svg`: Official JetBrains AI vector logo.
- `logo_brand_google_gemini.svg`: Official Google Gemini vector logo.
- `logo_brand_midjourney.svg`: Official Midjourney sailboat vector logo.
- `logo_pay_vietqr.svg`: VietQR bank transfer identity logo.
- `logo_pay_stripe.svg`: Stripe international card payment logo.
- `logo_pay_applepay.svg`: Logo Apple Pay.
- `logo_pay_visa.svg` & `logo_pay_mastercard.svg`: Visa & Mastercard card logos.
- `logo_pay_usdt_crypto.svg`: Tether USDT crypto payment logo.

#### B. `/assets/icons` (18 UI System SVG Icons)
- `ic_terminal_prompt.svg`: Terminal prompt `>_` icon.
- `ic_lightning_bolt.svg`: Lightning bolt icon for the 30s instant-buy button.
- `ic_shield_check.svg`: Shield icon for the 1-for-1 warranty commitment.
- `ic_check_circle.svg`: Green checkmark icon for feature lists.
- `ic_copy_default.svg` & `ic_copy_success.svg`: Copy account-number/password icons and the copied `✓` state.
- `ic_eye_show.svg` & `ic_eye_hide.svg`: Vault password show/hide icons.
- `ic_download_file.svg`: Download icon for `.env` / `.json` config files.
- `ic_clock_countdown.svg`: Countdown clock icon for the 10-minute slot hold.
- `ic_refresh_auto.svg`: 1-click automatic account renewal icon.
- `ic_lock_ssl.svg`: 256-bit SSL security padlock icon.
- `ic_telegram_support.svg`: 24/7 Telegram technical support icon.
- `ic_search.svg`, `ic_arrow_right.svg`, `ic_help_circle.svg`, `ic_alert_triangle.svg`, `ic_external_link.svg`.

#### C. `/assets/images` (Illustrations & avatars)
- `img_hero_glow_radial.svg`: Cyber Blue glow behind the hero section.
- `img_empty_catalog.svg`: Empty-terminal illustration for searches with no results.
- `img_error_offline.svg`: Network-offline illustration.
- `img_qr_placeholder.svg`: VietQR placeholder frame while an order is being created.
- `img_dev_avatar_1.webp` -> `img_dev_avatar_5.webp`: 5 real developer portrait avatars from Unsplash for the testimonials section (social proof).

---

### 3. Usage in HTML/CSS/React code:

```html
<!-- Insert a logo -->
<img src="./assets/logos/logo_aipro_main_dark.svg" alt="AgentLab Logo" height="32" />

<!-- Insert an icon -->
<img src="./assets/icons/ic_lightning_bolt.svg" alt="Instant Buy" width="16" height="16" />

<!-- Insert an avatar -->
<img src="./assets/images/img_dev_avatar_1.webp" alt="Developer Avatar" class="avatar-round" />
```
