/** Supplier catalog (2026-10-02) — 48 premium-account products harvested from the
 * supplier listing (tainguyensieure.com, pages 1-4), deduplicated, in English.
 * Price = the supplier's listed entry-tier monthly price converted to USD
 * (1 USD = 25,941.35 VND at crawl time); store VND at the standard 26,300/USD.
 * Logos are each brand's own official icon (provenance: supplier-catalog/logos
 * + logo_sources.json). Seeded via ensureSeedProducts (ON CONFLICT DO NOTHING).
 */
import type { SeedProduct } from './catalog-expansion.js';

export const SUPPLIER_PRODUCTS: SeedProduct[] = [
  {
    "id": "prod_sup_goi-nang-cap-tai-khoan-envato-elements",
    "slug": "goi-nang-cap-tai-khoan-envato-elements",
    "name": "Envato Elements —",
    "brand": "Envato Elements",
    "brandLogo": "/assets/logos/logo_brand_goi-nang-cap-tai-khoan-envato-elements.png",
    "category": "creative",
    "originalPriceVND": 537000,
    "currentPriceVND": 537000,
    "originalPriceUSD": 20.43,
    "currentPriceUSD": 20.43,
    "discountPercent": 0,
    "instantDelivery": true,
    "stockCount": 18,
    "badge": null,
    "platformSubtext": "Official-plan activation on your own email",
    "quotaFeatures": [
      "Entry plan: Core (1 month) — $20.43/month",
      "Single official plan tier",
      "Activated on your own account in 5–15 minutes",
      "1-for-1 warranty for the full subscription period"
    ],
    "specs": {
      "fastQuota": "Plan-based limits",
      "contextWindow": "—",
      "models": "Official plan lineup",
      "multiDevice": "Web & mobile"
    }
  },
  {
    "id": "prod_sup_goi-nang-cap-tai-khoan-make-com",
    "slug": "goi-nang-cap-tai-khoan-make-com",
    "name": "Make.com —",
    "brand": "Make.com",
    "brandLogo": "/assets/logos/logo_brand_goi-nang-cap-tai-khoan-make-com.png",
    "category": "enterprise",
    "originalPriceVND": 162000,
    "currentPriceVND": 162000,
    "originalPriceUSD": 6.17,
    "currentPriceUSD": 6.17,
    "discountPercent": 0,
    "instantDelivery": true,
    "stockCount": 25,
    "badge": null,
    "platformSubtext": "Official-plan activation on your own email",
    "quotaFeatures": [
      "Entry plan: Core (official $10.59/mo value) — $6.17/month",
      "Higher tiers: Pro (official $18.82/mo value), annual (contact us)",
      "Activated on your own account in 5–15 minutes",
      "1-for-1 warranty for the full subscription period"
    ],
    "specs": {
      "fastQuota": "Plan-based limits",
      "contextWindow": "—",
      "models": "Official plan lineup",
      "multiDevice": "Web & mobile"
    }
  },
  {
    "id": "prod_sup_mua-tai-khoan-studocu-gia-re",
    "slug": "mua-tai-khoan-studocu-gia-re",
    "name": "Studocu Premium",
    "brand": "Studocu",
    "brandLogo": "/assets/logos/logo_brand_mua-tai-khoan-studocu-gia-re.png",
    "category": "enterprise",
    "originalPriceVND": 70000,
    "currentPriceVND": 70000,
    "originalPriceUSD": 2.66,
    "currentPriceUSD": 2.66,
    "discountPercent": 0,
    "instantDelivery": true,
    "stockCount": 32,
    "badge": null,
    "platformSubtext": "Official-plan activation on your own email",
    "quotaFeatures": [
      "Entry plan: 1 month — $2.66/month",
      "Higher tiers: 3 months, 12 months",
      "Activated on your own account in 5–15 minutes",
      "1-for-1 warranty for the full subscription period"
    ],
    "specs": {
      "fastQuota": "Plan-based limits",
      "contextWindow": "—",
      "models": "Official plan lineup",
      "multiDevice": "Web & mobile"
    }
  },
  {
    "id": "prod_sup_nang-cap-canva-edu-pro",
    "slug": "nang-cap-canva-edu-pro",
    "name": "Canva EDU Pro",
    "brand": "Canva",
    "brandLogo": "/assets/logos/logo_brand_nang-cap-canva-edu-pro.png",
    "category": "design",
    "originalPriceVND": 29000,
    "currentPriceVND": 29000,
    "originalPriceUSD": 1.12,
    "currentPriceUSD": 1.12,
    "discountPercent": 0,
    "instantDelivery": true,
    "stockCount": 39,
    "badge": null,
    "platformSubtext": "Official-plan activation on your own email",
    "quotaFeatures": [
      "Entry plan: Canva pro 1 month — $1.12/month",
      "Higher tiers: Canva pro 1 year",
      "Activated on your own account in 5–15 minutes",
      "1-for-1 warranty for the full subscription period"
    ],
    "specs": {
      "fastQuota": "Plan-based limits",
      "contextWindow": "—",
      "models": "Official plan lineup",
      "multiDevice": "Web & mobile"
    }
  },
  {
    "id": "prod_sup_nang-cap-google-one-ai-pro-ultra-antigravity",
    "slug": "nang-cap-google-one-ai-pro-ultra-antigravity",
    "name": "Google One AI Pro/Ultra & Antigravity",
    "brand": "Google One",
    "brandLogo": "/assets/logos/logo_brand_nang-cap-google-one-ai-pro-ultra-antigravity.png",
    "category": "llm",
    "originalPriceVND": 1521000,
    "currentPriceVND": 1521000,
    "originalPriceUSD": 57.82,
    "currentPriceUSD": 57.82,
    "discountPercent": 0,
    "instantDelivery": true,
    "stockCount": 46,
    "badge": null,
    "platformSubtext": "Official-plan activation on your own email",
    "quotaFeatures": [
      "Entry plan: Google AI Ultra ×5 — 1 month — $57.82/month",
      "Higher tiers: Google AI Pro Slot — 1 year, Google AI Pro Family — 1 year, Google AI Ultra ×20 — 1 month",
      "Activated on your own account in 5–15 minutes",
      "1-for-1 warranty for the full subscription period"
    ],
    "specs": {
      "fastQuota": "Plan-based limits",
      "contextWindow": "—",
      "models": "Official plan lineup",
      "multiDevice": "Android, iOS & web"
    }
  },
  {
    "id": "prod_sup_nang-cap-tai-khoan-abacus-ai-chinh-chu",
    "slug": "nang-cap-tai-khoan-abacus-ai-chinh-chu",
    "name": "Abacus.AI",
    "brand": "Abacus.AI",
    "brandLogo": "/assets/logos/logo_brand_nang-cap-tai-khoan-abacus-ai-chinh-chu.png",
    "category": "llm",
    "originalPriceVND": 203000,
    "currentPriceVND": 203000,
    "originalPriceUSD": 7.71,
    "currentPriceUSD": 7.71,
    "discountPercent": 0,
    "instantDelivery": true,
    "stockCount": 53,
    "badge": null,
    "platformSubtext": "Official-plan activation on your own email",
    "quotaFeatures": [
      "Entry plan: Basic 1 month — $7.71/month",
      "Higher tiers: Pro 1 month",
      "Activated on your own account in 5–15 minutes",
      "1-for-1 warranty for the full subscription period"
    ],
    "specs": {
      "fastQuota": "Plan-based limits",
      "contextWindow": "—",
      "models": "Official plan lineup",
      "multiDevice": "Web & mobile"
    }
  },
  {
    "id": "prod_sup_nang-cap-tai-khoan-artistly-chinh-chu",
    "slug": "nang-cap-tai-khoan-artistly-chinh-chu",
    "name": "Artistly",
    "brand": "Artistly",
    "brandLogo": "/assets/logos/logo_brand_nang-cap-tai-khoan-artistly-chinh-chu.png",
    "category": "design",
    "originalPriceVND": 497000,
    "currentPriceVND": 497000,
    "originalPriceUSD": 18.89,
    "currentPriceUSD": 18.89,
    "discountPercent": 0,
    "instantDelivery": true,
    "stockCount": 20,
    "badge": null,
    "platformSubtext": "Official-plan activation on your own email",
    "quotaFeatures": [
      "Entry plan: Commercial — $18.89/month",
      "Higher tiers: Premium",
      "Activated on your own account in 5–15 minutes",
      "1-for-1 warranty for the full subscription period"
    ],
    "specs": {
      "fastQuota": "Plan-based limits",
      "contextWindow": "—",
      "models": "Official plan lineup",
      "multiDevice": "Web & mobile"
    }
  },
  {
    "id": "prod_sup_nang-cap-tai-khoan-captions-chinh-chu",
    "slug": "nang-cap-tai-khoan-captions-chinh-chu",
    "name": "Captions AI",
    "brand": "Captions",
    "brandLogo": "/assets/logos/logo_brand_nang-cap-tai-khoan-captions-chinh-chu.png",
    "category": "creative",
    "originalPriceVND": 380000,
    "currentPriceVND": 380000,
    "originalPriceUSD": 14.46,
    "currentPriceUSD": 14.46,
    "discountPercent": 0,
    "instantDelivery": true,
    "stockCount": 27,
    "badge": null,
    "platformSubtext": "Official-plan activation on your own email",
    "quotaFeatures": [
      "Entry plan: Max 1 month — $14.46/month",
      "Higher tiers: Scale 1 month",
      "Activated on your own account in 5–15 minutes",
      "1-for-1 warranty for the full subscription period"
    ],
    "specs": {
      "fastQuota": "Plan-based limits",
      "contextWindow": "—",
      "models": "Official plan lineup",
      "multiDevice": "Web & mobile"
    }
  },
  {
    "id": "prod_sup_nang-cap-tai-khoan-clicksites-chinh-chu",
    "slug": "nang-cap-tai-khoan-clicksites-chinh-chu",
    "name": "ClickSites",
    "brand": "ClickSites",
    "brandLogo": "/assets/logos/logo_brand_nang-cap-tai-khoan-clicksites-chinh-chu.png",
    "category": "design",
    "originalPriceVND": 497000,
    "currentPriceVND": 497000,
    "originalPriceUSD": 18.89,
    "currentPriceUSD": 18.89,
    "discountPercent": 0,
    "instantDelivery": true,
    "stockCount": 34,
    "badge": null,
    "platformSubtext": "Official-plan activation on your own email",
    "quotaFeatures": [
      "Entry plan: Basic — $18.89/month",
      "Higher tiers: All-Access",
      "Activated on your own account in 5–15 minutes",
      "1-for-1 warranty for the full subscription period"
    ],
    "specs": {
      "fastQuota": "Plan-based limits",
      "contextWindow": "—",
      "models": "Official plan lineup",
      "multiDevice": "Web & mobile"
    }
  },
  {
    "id": "prod_sup_nang-cap-tai-khoan-clickup-chinh-chu",
    "slug": "nang-cap-tai-khoan-clickup-chinh-chu",
    "name": "ClickUp — Unlimited & Business",
    "brand": "ClickUp",
    "brandLogo": "/assets/logos/logo_brand_nang-cap-tai-khoan-clickup-chinh-chu.png",
    "category": "enterprise",
    "originalPriceVND": 152000,
    "currentPriceVND": 152000,
    "originalPriceUSD": 5.78,
    "currentPriceUSD": 5.78,
    "discountPercent": 0,
    "instantDelivery": true,
    "stockCount": 41,
    "badge": null,
    "platformSubtext": "Official-plan activation on your own email",
    "quotaFeatures": [
      "Entry plan: Unlimited 1 month — $5.78/month",
      "Higher tiers: Business 1 month",
      "Activated on your own account in 5–15 minutes",
      "1-for-1 warranty for the full subscription period"
    ],
    "specs": {
      "fastQuota": "Plan-based limits",
      "contextWindow": "—",
      "models": "Official plan lineup",
      "multiDevice": "Web & mobile"
    }
  },
  {
    "id": "prod_sup_nang-cap-tai-khoan-comfy-cloud",
    "slug": "nang-cap-tai-khoan-comfy-cloud",
    "name": "Comfy Cloud (ComfyUI)",
    "brand": "Comfy Cloud",
    "brandLogo": "/assets/logos/logo_brand_nang-cap-tai-khoan-comfy-cloud.png",
    "category": "creative",
    "originalPriceVND": 406000,
    "currentPriceVND": 406000,
    "originalPriceUSD": 15.42,
    "currentPriceUSD": 15.42,
    "discountPercent": 0,
    "instantDelivery": true,
    "stockCount": 48,
    "badge": null,
    "platformSubtext": "Official-plan activation on your own email",
    "quotaFeatures": [
      "Entry plan: STANDARD (1 month) — $15.42/month",
      "Higher tiers: CREATOR (1 month)",
      "Activated on your own account in 5–15 minutes",
      "1-for-1 warranty for the full subscription period"
    ],
    "specs": {
      "fastQuota": "Plan-based limits",
      "contextWindow": "—",
      "models": "Official plan lineup",
      "multiDevice": "Web & mobile"
    }
  },
  {
    "id": "prod_sup_nang-cap-tai-khoan-consensus-chinh-chu",
    "slug": "nang-cap-tai-khoan-consensus-chinh-chu",
    "name": "Consensus Pro",
    "brand": "Consensus",
    "brandLogo": "/assets/logos/logo_brand_nang-cap-tai-khoan-consensus-chinh-chu.png",
    "category": "search",
    "originalPriceVND": 406000,
    "currentPriceVND": 406000,
    "originalPriceUSD": 15.42,
    "currentPriceUSD": 15.42,
    "discountPercent": 0,
    "instantDelivery": true,
    "stockCount": 55,
    "badge": null,
    "platformSubtext": "Official-plan activation on your own email",
    "quotaFeatures": [
      "Entry plan: Full access (single plan) — $15.42/month",
      "Single official plan tier",
      "Activated on your own account in 5–15 minutes",
      "1-for-1 warranty for the full subscription period"
    ],
    "specs": {
      "fastQuota": "Plan-based limits",
      "contextWindow": "—",
      "models": "Official plan lineup",
      "multiDevice": "Web & mobile"
    }
  },
  {
    "id": "prod_sup_nang-cap-tai-khoan-elicit-ai-chinh-chu",
    "slug": "nang-cap-tai-khoan-elicit-ai-chinh-chu",
    "name": "Elicit AI",
    "brand": "Elicit",
    "brandLogo": "/assets/logos/logo_brand_nang-cap-tai-khoan-elicit-ai-chinh-chu.png",
    "category": "search",
    "originalPriceVND": 203000,
    "currentPriceVND": 203000,
    "originalPriceUSD": 7.71,
    "currentPriceUSD": 7.71,
    "discountPercent": 0,
    "instantDelivery": true,
    "stockCount": 22,
    "badge": null,
    "platformSubtext": "Official-plan activation on your own email",
    "quotaFeatures": [
      "Entry plan: Elicit Plus 1 month own-account — $7.71/month",
      "Higher tiers: Elicit Pro 1 month own-account",
      "Activated on your own account in 5–15 minutes",
      "1-for-1 warranty for the full subscription period"
    ],
    "specs": {
      "fastQuota": "Plan-based limits",
      "contextWindow": "—",
      "models": "Official plan lineup",
      "multiDevice": "Web & mobile"
    }
  },
  {
    "id": "prod_sup_nang-cap-tai-khoan-enhancor-chinh-chu",
    "slug": "nang-cap-tai-khoan-enhancor-chinh-chu",
    "name": "Enhancor AI",
    "brand": "Enhancor",
    "brandLogo": "/assets/logos/logo_brand_nang-cap-tai-khoan-enhancor-chinh-chu.png",
    "category": "creative",
    "originalPriceVND": 223000,
    "currentPriceVND": 223000,
    "originalPriceUSD": 8.48,
    "currentPriceUSD": 8.48,
    "discountPercent": 0,
    "instantDelivery": true,
    "stockCount": 29,
    "badge": null,
    "platformSubtext": "Official-plan activation on your own email",
    "quotaFeatures": [
      "Entry plan: Basic 1 month — $8.48/month",
      "Higher tiers: Creator 1 month",
      "Activated on your own account in 5–15 minutes",
      "1-for-1 warranty for the full subscription period"
    ],
    "specs": {
      "fastQuota": "Plan-based limits",
      "contextWindow": "—",
      "models": "Official plan lineup",
      "multiDevice": "Web & mobile"
    }
  },
  {
    "id": "prod_sup_nang-cap-tai-khoan-heygen-chinh-chu-gia-re",
    "slug": "nang-cap-tai-khoan-heygen-chinh-chu-gia-re",
    "name": "HeyGen — Creator",
    "brand": "HeyGen",
    "brandLogo": "/assets/logos/logo_brand_nang-cap-tai-khoan-heygen-chinh-chu-gia-re.png",
    "category": "creative",
    "originalPriceVND": 608000,
    "currentPriceVND": 608000,
    "originalPriceUSD": 23.13,
    "currentPriceUSD": 23.13,
    "discountPercent": 0,
    "instantDelivery": true,
    "stockCount": 36,
    "badge": null,
    "platformSubtext": "Official-plan activation on your own email",
    "quotaFeatures": [
      "Entry plan: Creator 1 month — $23.13/month",
      "Single official plan tier",
      "Activated on your own account in 5–15 minutes",
      "1-for-1 warranty for the full subscription period"
    ],
    "specs": {
      "fastQuota": "Plan-based limits",
      "contextWindow": "—",
      "models": "Official plan lineup",
      "multiDevice": "Web & mobile"
    }
  },
  {
    "id": "prod_sup_nang-cap-tai-khoan-kits-ai-chinh-chu",
    "slug": "nang-cap-tai-khoan-kits-ai-chinh-chu",
    "name": "Kits.ai",
    "brand": "Kits.ai",
    "brandLogo": "/assets/logos/logo_brand_nang-cap-tai-khoan-kits-ai-chinh-chu.png",
    "category": "creative",
    "originalPriceVND": 152000,
    "currentPriceVND": 152000,
    "originalPriceUSD": 5.78,
    "currentPriceUSD": 5.78,
    "discountPercent": 0,
    "instantDelivery": true,
    "stockCount": 43,
    "badge": null,
    "platformSubtext": "Official-plan activation on your own email",
    "quotaFeatures": [
      "Entry plan: Starter 1 month — $5.78/month",
      "Higher tiers: Producer 1 month, Professional 1 month",
      "Activated on your own account in 5–15 minutes",
      "1-for-1 warranty for the full subscription period"
    ],
    "specs": {
      "fastQuota": "Plan-based limits",
      "contextWindow": "—",
      "models": "Official plan lineup",
      "multiDevice": "Web & mobile"
    }
  },
  {
    "id": "prod_sup_nang-cap-tai-khoan-magiclight-ai-chinh-chu",
    "slug": "nang-cap-tai-khoan-magiclight-ai-chinh-chu",
    "name": "MagicLight AI",
    "brand": "MagicLight AI",
    "brandLogo": "/assets/logos/logo_brand_nang-cap-tai-khoan-magiclight-ai-chinh-chu.png",
    "category": "creative",
    "originalPriceVND": 233000,
    "currentPriceVND": 233000,
    "originalPriceUSD": 8.87,
    "currentPriceUSD": 8.87,
    "discountPercent": 0,
    "instantDelivery": true,
    "stockCount": 50,
    "badge": null,
    "platformSubtext": "Official-plan activation on your own email",
    "quotaFeatures": [
      "Entry plan: Standard 1 month — $8.87/month",
      "Higher tiers: Plus 1 month, Pro 1 month",
      "Activated on your own account in 5–15 minutes",
      "1-for-1 warranty for the full subscription period"
    ],
    "specs": {
      "fastQuota": "Plan-based limits",
      "contextWindow": "—",
      "models": "Official plan lineup",
      "multiDevice": "Web & mobile"
    }
  },
  {
    "id": "prod_sup_nang-cap-tai-khoan-meshy-ai-chinh-chu",
    "slug": "nang-cap-tai-khoan-meshy-ai-chinh-chu",
    "name": "Meshy AI",
    "brand": "Meshy AI",
    "brandLogo": "/assets/logos/logo_brand_nang-cap-tai-khoan-meshy-ai-chinh-chu.png",
    "category": "creative",
    "originalPriceVND": 161000,
    "currentPriceVND": 161000,
    "originalPriceUSD": 6.13,
    "currentPriceUSD": 6.13,
    "discountPercent": 0,
    "instantDelivery": true,
    "stockCount": 57,
    "badge": null,
    "platformSubtext": "Official-plan activation on your own email",
    "quotaFeatures": [
      "Entry plan: Pro 1 month — $6.13/month",
      "Higher tiers: Premium 1 month, Studio 1 month",
      "Activated on your own account in 5–15 minutes",
      "1-for-1 warranty for the full subscription period"
    ],
    "specs": {
      "fastQuota": "Plan-based limits",
      "contextWindow": "—",
      "models": "Official plan lineup",
      "multiDevice": "Web & mobile"
    }
  },
  {
    "id": "prod_sup_nang-cap-tai-khoan-openart-ai-chinh-chu-gia-re",
    "slug": "nang-cap-tai-khoan-openart-ai-chinh-chu-gia-re",
    "name": "OpenArt AI",
    "brand": "OpenArt AI",
    "brandLogo": "/assets/logos/logo_brand_nang-cap-tai-khoan-openart-ai-chinh-chu-gia-re.png",
    "category": "creative",
    "originalPriceVND": 254000,
    "currentPriceVND": 254000,
    "originalPriceUSD": 9.64,
    "currentPriceUSD": 9.64,
    "discountPercent": 0,
    "instantDelivery": true,
    "stockCount": 24,
    "badge": null,
    "platformSubtext": "Official-plan activation on your own email",
    "quotaFeatures": [
      "Entry plan: Essential 1 month — $9.64/month",
      "Higher tiers: Advanced 1 month, Infinite 1 month",
      "Activated on your own account in 5–15 minutes",
      "1-for-1 warranty for the full subscription period"
    ],
    "specs": {
      "fastQuota": "Plan-based limits",
      "contextWindow": "—",
      "models": "Official plan lineup",
      "multiDevice": "Web & mobile"
    }
  },
  {
    "id": "prod_sup_nang-cap-tai-khoan-opusclip-chinh-chu",
    "slug": "nang-cap-tai-khoan-opusclip-chinh-chu",
    "name": "OpusClip",
    "brand": "OpusClip",
    "brandLogo": "/assets/logos/logo_brand_nang-cap-tai-khoan-opusclip-chinh-chu.png",
    "category": "creative",
    "originalPriceVND": 122000,
    "currentPriceVND": 122000,
    "originalPriceUSD": 4.63,
    "currentPriceUSD": 4.63,
    "discountPercent": 0,
    "instantDelivery": true,
    "stockCount": 31,
    "badge": null,
    "platformSubtext": "Official-plan activation on your own email",
    "quotaFeatures": [
      "Entry plan: Starter (promo) — $4.63/month",
      "Higher tiers: Pro (promo), Starter 1 month, Pro 1 month",
      "Activated on your own account in 5–15 minutes",
      "1-for-1 warranty for the full subscription period"
    ],
    "specs": {
      "fastQuota": "Plan-based limits",
      "contextWindow": "—",
      "models": "Official plan lineup",
      "multiDevice": "Web & mobile"
    }
  },
  {
    "id": "prod_sup_nang-cap-tai-khoan-originality-ai-chinh-chu",
    "slug": "nang-cap-tai-khoan-originality-ai-chinh-chu",
    "name": "Originality.ai",
    "brand": "Originality.ai",
    "brandLogo": "/assets/logos/logo_brand_nang-cap-tai-khoan-originality-ai-chinh-chu.png",
    "category": "enterprise",
    "originalPriceVND": 228000,
    "currentPriceVND": 228000,
    "originalPriceUSD": 8.67,
    "currentPriceUSD": 8.67,
    "discountPercent": 0,
    "instantDelivery": true,
    "stockCount": 38,
    "badge": null,
    "platformSubtext": "Official-plan activation on your own email",
    "quotaFeatures": [
      "Entry plan: Pro 1 month — $8.67/month",
      "Higher tiers: Pay as you go, Enterprise 1 month",
      "Activated on your own account in 5–15 minutes",
      "1-for-1 warranty for the full subscription period"
    ],
    "specs": {
      "fastQuota": "Plan-based limits",
      "contextWindow": "—",
      "models": "Official plan lineup",
      "multiDevice": "Web & mobile"
    }
  },
  {
    "id": "prod_sup_nang-cap-tai-khoan-pacdora",
    "slug": "nang-cap-tai-khoan-pacdora",
    "name": "Pacdora 3D",
    "brand": "Pacdora",
    "brandLogo": "/assets/logos/logo_brand_nang-cap-tai-khoan-pacdora.png",
    "category": "design",
    "originalPriceVND": 203000,
    "currentPriceVND": 203000,
    "originalPriceUSD": 7.71,
    "currentPriceUSD": 7.71,
    "discountPercent": 0,
    "instantDelivery": true,
    "stockCount": 45,
    "badge": null,
    "platformSubtext": "Official-plan activation on your own email",
    "quotaFeatures": [
      "Entry plan: Lite (1 month) — $7.71/month",
      "Higher tiers: Pro (1 month)",
      "Activated on your own account in 5–15 minutes",
      "1-for-1 warranty for the full subscription period"
    ],
    "specs": {
      "fastQuota": "Plan-based limits",
      "contextWindow": "—",
      "models": "Official plan lineup",
      "multiDevice": "Web & mobile"
    }
  },
  {
    "id": "prod_sup_nang-cap-tai-khoan-scribd",
    "slug": "nang-cap-tai-khoan-scribd",
    "name": "Scribd Premium",
    "brand": "Scribd",
    "brandLogo": "/assets/logos/logo_brand_nang-cap-tai-khoan-scribd.png",
    "category": "enterprise",
    "originalPriceVND": 152000,
    "currentPriceVND": 152000,
    "originalPriceUSD": 5.78,
    "currentPriceUSD": 5.78,
    "discountPercent": 0,
    "instantDelivery": true,
    "stockCount": 52,
    "badge": null,
    "platformSubtext": "Official-plan activation on your own email",
    "quotaFeatures": [
      "Entry plan: Premium (official $10/mo value) — $5.78/month",
      "Higher tiers: Premium (official $85/yr value)",
      "Activated on your own account in 5–15 minutes",
      "1-for-1 warranty for the full subscription period"
    ],
    "specs": {
      "fastQuota": "Plan-based limits",
      "contextWindow": "—",
      "models": "Official plan lineup",
      "multiDevice": "Web & mobile"
    }
  },
  {
    "id": "prod_sup_nang-cap-tai-khoan-topmediai-chinh-chu",
    "slug": "nang-cap-tai-khoan-topmediai-chinh-chu",
    "name": "TopMediai",
    "brand": "TopMediai",
    "brandLogo": "/assets/logos/logo_brand_nang-cap-tai-khoan-topmediai-chinh-chu.png",
    "category": "creative",
    "originalPriceVND": 203000,
    "currentPriceVND": 203000,
    "originalPriceUSD": 7.71,
    "currentPriceUSD": 7.71,
    "discountPercent": 0,
    "instantDelivery": true,
    "stockCount": 19,
    "badge": null,
    "platformSubtext": "Official-plan activation on your own email",
    "quotaFeatures": [
      "Entry plan: AI Music SVIP 1 month — $7.71/month",
      "Higher tiers: Voiceover SVIP 1 month, All-in-one SVIP 1 month",
      "Activated on your own account in 5–15 minutes",
      "1-for-1 warranty for the full subscription period"
    ],
    "specs": {
      "fastQuota": "Plan-based limits",
      "contextWindow": "—",
      "models": "Official plan lineup",
      "multiDevice": "Web & mobile"
    }
  },
  {
    "id": "prod_sup_nang-cap-tai-khoan-tripo-studio-chinh-chu",
    "slug": "nang-cap-tai-khoan-tripo-studio-chinh-chu",
    "name": "Tripo Studio",
    "brand": "Tripo Studio",
    "brandLogo": "/assets/logos/logo_brand_nang-cap-tai-khoan-tripo-studio-chinh-chu.png",
    "category": "creative",
    "originalPriceVND": 203000,
    "currentPriceVND": 203000,
    "originalPriceUSD": 7.71,
    "currentPriceUSD": 7.71,
    "discountPercent": 0,
    "instantDelivery": true,
    "stockCount": 26,
    "badge": null,
    "platformSubtext": "Official-plan activation on your own email",
    "quotaFeatures": [
      "Entry plan: Professional 1 month — $7.71/month",
      "Higher tiers: Max 1 month",
      "Activated on your own account in 5–15 minutes",
      "1-for-1 warranty for the full subscription period"
    ],
    "specs": {
      "fastQuota": "Plan-based limits",
      "contextWindow": "—",
      "models": "Official plan lineup",
      "multiDevice": "Web & mobile"
    }
  },
  {
    "id": "prod_sup_nang-cap-tai-khoan-uxpilot-ai-chinh-chu",
    "slug": "nang-cap-tai-khoan-uxpilot-ai-chinh-chu",
    "name": "UX Pilot AI — Standard & Pro",
    "brand": "UX Pilot",
    "brandLogo": "/assets/logos/logo_brand_nang-cap-tai-khoan-uxpilot-ai-chinh-chu.png",
    "category": "design",
    "originalPriceVND": 304000,
    "currentPriceVND": 304000,
    "originalPriceUSD": 11.56,
    "currentPriceUSD": 11.56,
    "discountPercent": 0,
    "instantDelivery": true,
    "stockCount": 33,
    "badge": null,
    "platformSubtext": "Official-plan activation on your own email",
    "quotaFeatures": [
      "Entry plan: Standard 1 month — $11.56/month",
      "Higher tiers: Pro 1 month",
      "Activated on your own account in 5–15 minutes",
      "1-for-1 warranty for the full subscription period"
    ],
    "specs": {
      "fastQuota": "Plan-based limits",
      "contextWindow": "—",
      "models": "Official plan lineup",
      "multiDevice": "Web & mobile"
    }
  },
  {
    "id": "prod_sup_nang-cap-tai-khoan-videocreator-chinh-chu",
    "slug": "nang-cap-tai-khoan-videocreator-chinh-chu",
    "name": "VideoCreator",
    "brand": "VideoCreator",
    "brandLogo": "/assets/logos/logo_brand_nang-cap-tai-khoan-videocreator-chinh-chu.png",
    "category": "creative",
    "originalPriceVND": 497000,
    "currentPriceVND": 497000,
    "originalPriceUSD": 18.89,
    "currentPriceUSD": 18.89,
    "discountPercent": 0,
    "instantDelivery": true,
    "stockCount": 40,
    "badge": null,
    "platformSubtext": "Official-plan activation on your own email",
    "quotaFeatures": [
      "Entry plan: Full access (single plan) — $18.89/month",
      "Single official plan tier",
      "Activated on your own account in 5–15 minutes",
      "1-for-1 warranty for the full subscription period"
    ],
    "specs": {
      "fastQuota": "Plan-based limits",
      "contextWindow": "—",
      "models": "Official plan lineup",
      "multiDevice": "Web & mobile"
    }
  },
  {
    "id": "prod_sup_nang-cap-tai-khoan-videoexpress-chinh-chu",
    "slug": "nang-cap-tai-khoan-videoexpress-chinh-chu",
    "name": "VideoExpress",
    "brand": "VideoExpress",
    "brandLogo": "/assets/logos/logo_brand_nang-cap-tai-khoan-videoexpress-chinh-chu.png",
    "category": "creative",
    "originalPriceVND": 811000,
    "currentPriceVND": 811000,
    "originalPriceUSD": 30.84,
    "currentPriceUSD": 30.84,
    "discountPercent": 0,
    "instantDelivery": true,
    "stockCount": 47,
    "badge": null,
    "platformSubtext": "Official-plan activation on your own email",
    "quotaFeatures": [
      "Entry plan: Foundation plan — $30.84/month",
      "Higher tiers: All-Access plan",
      "Activated on your own account in 5–15 minutes",
      "1-for-1 warranty for the full subscription period"
    ],
    "specs": {
      "fastQuota": "Plan-based limits",
      "contextWindow": "—",
      "models": "Official plan lineup",
      "multiDevice": "Web & mobile"
    }
  },
  {
    "id": "prod_sup_nang-cap-tai-khoan-vidiq-chinh-chu",
    "slug": "nang-cap-tai-khoan-vidiq-chinh-chu",
    "name": "VidIQ — Boost & Max",
    "brand": "VidIQ",
    "brandLogo": "/assets/logos/logo_brand_nang-cap-tai-khoan-vidiq-chinh-chu.png",
    "category": "creative",
    "originalPriceVND": 131000,
    "currentPriceVND": 131000,
    "originalPriceUSD": 4.97,
    "currentPriceUSD": 4.97,
    "discountPercent": 0,
    "instantDelivery": true,
    "stockCount": 54,
    "badge": null,
    "platformSubtext": "Official-plan activation on your own email",
    "quotaFeatures": [
      "Entry plan: Boost 1 month — $4.97/month",
      "Higher tiers: Max 1 month",
      "Activated on your own account in 5–15 minutes",
      "1-for-1 warranty for the full subscription period"
    ],
    "specs": {
      "fastQuota": "Plan-based limits",
      "contextWindow": "—",
      "models": "Official plan lineup",
      "multiDevice": "Web & mobile"
    }
  },
  {
    "id": "prod_sup_nang-cap-tai-khoan-vizard-chinh-chu",
    "slug": "nang-cap-tai-khoan-vizard-chinh-chu",
    "name": "Vizard",
    "brand": "Vizard",
    "brandLogo": "/assets/logos/logo_brand_nang-cap-tai-khoan-vizard-chinh-chu.png",
    "category": "creative",
    "originalPriceVND": 441000,
    "currentPriceVND": 441000,
    "originalPriceUSD": 16.77,
    "currentPriceUSD": 16.77,
    "discountPercent": 0,
    "instantDelivery": true,
    "stockCount": 21,
    "badge": null,
    "platformSubtext": "Official-plan activation on your own email",
    "quotaFeatures": [
      "Entry plan: Creator 1 month — $16.77/month",
      "Higher tiers: Business 1 month",
      "Activated on your own account in 5–15 minutes",
      "1-for-1 warranty for the full subscription period"
    ],
    "specs": {
      "fastQuota": "Plan-based limits",
      "contextWindow": "—",
      "models": "Official plan lineup",
      "multiDevice": "Web & mobile"
    }
  },
  {
    "id": "prod_sup_nang-cap-tai-khoan-vmake-ai-chinh-chu-gia-re",
    "slug": "nang-cap-tai-khoan-vmake-ai-chinh-chu-gia-re",
    "name": "Vmake AI",
    "brand": "Vmake AI",
    "brandLogo": "/assets/logos/logo_brand_nang-cap-tai-khoan-vmake-ai-chinh-chu-gia-re.png",
    "category": "creative",
    "originalPriceVND": 152000,
    "currentPriceVND": 152000,
    "originalPriceUSD": 5.78,
    "currentPriceUSD": 5.78,
    "discountPercent": 0,
    "instantDelivery": true,
    "stockCount": 28,
    "badge": null,
    "platformSubtext": "Official-plan activation on your own email",
    "quotaFeatures": [
      "Entry plan: Plus 1 month — $5.78/month",
      "Higher tiers: plus 1 year, Pro 1 month",
      "Activated on your own account in 5–15 minutes",
      "1-for-1 warranty for the full subscription period"
    ],
    "specs": {
      "fastQuota": "Plan-based limits",
      "contextWindow": "—",
      "models": "Official plan lineup",
      "multiDevice": "Web & mobile"
    }
  },
  {
    "id": "prod_sup_nang-cap-tai-khoan-weshop-ai-chinh-chu-gia-re",
    "slug": "nang-cap-tai-khoan-weshop-ai-chinh-chu-gia-re",
    "name": "WeShop AI",
    "brand": "WeShop AI",
    "brandLogo": "/assets/logos/logo_brand_nang-cap-tai-khoan-weshop-ai-chinh-chu-gia-re.png",
    "category": "creative",
    "originalPriceVND": 254000,
    "currentPriceVND": 254000,
    "originalPriceUSD": 9.64,
    "currentPriceUSD": 9.64,
    "discountPercent": 0,
    "instantDelivery": true,
    "stockCount": 35,
    "badge": null,
    "platformSubtext": "Official-plan activation on your own email",
    "quotaFeatures": [
      "Entry plan: Monthly 1 month — $9.64/month",
      "Higher tiers: Point pack $58, Point pack $118, Point pack $488",
      "Activated on your own account in 5–15 minutes",
      "1-for-1 warranty for the full subscription period"
    ],
    "specs": {
      "fastQuota": "Plan-based limits",
      "contextWindow": "—",
      "models": "Official plan lineup",
      "multiDevice": "Web & mobile"
    }
  },
  {
    "id": "prod_sup_nang-cap-tai-khoan-zapier-automation",
    "slug": "nang-cap-tai-khoan-zapier-automation",
    "name": "Zapier Automation",
    "brand": "Zapier",
    "brandLogo": "/assets/logos/logo_brand_nang-cap-tai-khoan-zapier-automation.png",
    "category": "enterprise",
    "originalPriceVND": 456000,
    "currentPriceVND": 456000,
    "originalPriceUSD": 17.35,
    "currentPriceUSD": 17.35,
    "discountPercent": 0,
    "instantDelivery": true,
    "stockCount": 42,
    "badge": null,
    "platformSubtext": "Official-plan activation on your own email",
    "quotaFeatures": [
      "Entry plan: Professional (official $29/mo value) — $17.35/month",
      "Higher tiers: Professional (official $240/yr value)",
      "Activated on your own account in 5–15 minutes",
      "1-for-1 warranty for the full subscription period"
    ],
    "specs": {
      "fastQuota": "Plan-based limits",
      "contextWindow": "—",
      "models": "Official plan lineup",
      "multiDevice": "Web & mobile"
    }
  },
  {
    "id": "prod_sup_tai-khoan-base44-chinh-chu",
    "slug": "tai-khoan-base44-chinh-chu",
    "name": "Base44",
    "brand": "Base44",
    "brandLogo": "/assets/logos/logo_brand_tai-khoan-base44-chinh-chu.png",
    "category": "coding",
    "originalPriceVND": 304000,
    "currentPriceVND": 304000,
    "originalPriceUSD": 11.56,
    "currentPriceUSD": 11.56,
    "discountPercent": 0,
    "instantDelivery": true,
    "stockCount": 49,
    "badge": null,
    "platformSubtext": "Official-plan activation on your own email",
    "quotaFeatures": [
      "Entry plan: Starter (1 month) — $11.56/month",
      "Higher tiers: Builder (1 month)",
      "Activated on your own account in 5–15 minutes",
      "1-for-1 warranty for the full subscription period"
    ],
    "specs": {
      "fastQuota": "Plan-based limits",
      "contextWindow": "—",
      "models": "Official plan lineup",
      "multiDevice": "Web & mobile"
    }
  },
  {
    "id": "prod_sup_tai-khoan-beeble-ai",
    "slug": "tai-khoan-beeble-ai",
    "name": "Beeble AI",
    "brand": "Beeble AI",
    "brandLogo": "/assets/logos/logo_brand_tai-khoan-beeble-ai.png",
    "category": "creative",
    "originalPriceVND": 304000,
    "currentPriceVND": 304000,
    "originalPriceUSD": 11.56,
    "currentPriceUSD": 11.56,
    "discountPercent": 0,
    "instantDelivery": true,
    "stockCount": 56,
    "badge": null,
    "platformSubtext": "Official-plan activation on your own email",
    "quotaFeatures": [
      "Entry plan: CREATOR (1 month) — $11.56/month",
      "Higher tiers: PROFESSIONAL (1 month)",
      "Activated on your own account in 5–15 minutes",
      "1-for-1 warranty for the full subscription period"
    ],
    "specs": {
      "fastQuota": "Plan-based limits",
      "contextWindow": "—",
      "models": "Official plan lineup",
      "multiDevice": "Web & mobile"
    }
  },
  {
    "id": "prod_sup_tai-khoan-coursera-plus-business",
    "slug": "tai-khoan-coursera-plus-business",
    "name": "Coursera Plus & Business",
    "brand": "Coursera",
    "brandLogo": "/assets/logos/logo_brand_tai-khoan-coursera-plus-business.png",
    "category": "enterprise",
    "originalPriceVND": 202000,
    "currentPriceVND": 202000,
    "originalPriceUSD": 7.67,
    "currentPriceUSD": 7.67,
    "discountPercent": 0,
    "instantDelivery": true,
    "stockCount": 23,
    "badge": null,
    "platformSubtext": "Official-plan activation on your own email",
    "quotaFeatures": [
      "Entry plan: Coursera Plus (own-account) — $7.67/month",
      "Higher tiers: Coursera Business (own-account), Coursera Business (own-account) — option 2, Shared account",
      "Activated on your own account in 5–15 minutes",
      "1-for-1 warranty for the full subscription period"
    ],
    "specs": {
      "fastQuota": "Plan-based limits",
      "contextWindow": "—",
      "models": "Official plan lineup",
      "multiDevice": "Web & mobile"
    }
  },
  {
    "id": "prod_sup_tai-khoan-d5-render-pro",
    "slug": "tai-khoan-d5-render-pro",
    "name": "D5 Render PRO",
    "brand": "D5 Render",
    "brandLogo": "/assets/logos/logo_brand_tai-khoan-d5-render-pro.png",
    "category": "design",
    "originalPriceVND": 608000,
    "currentPriceVND": 608000,
    "originalPriceUSD": 23.13,
    "currentPriceUSD": 23.13,
    "discountPercent": 0,
    "instantDelivery": true,
    "stockCount": 30,
    "badge": null,
    "platformSubtext": "Official-plan activation on your own email",
    "quotaFeatures": [
      "Entry plan: own-account upgrade — $23.13/month",
      "Higher tiers: account upgrade",
      "Activated on your own account in 5–15 minutes",
      "1-for-1 warranty for the full subscription period"
    ],
    "specs": {
      "fastQuota": "Plan-based limits",
      "contextWindow": "—",
      "models": "Official plan lineup",
      "multiDevice": "Web & mobile"
    }
  },
  {
    "id": "prod_sup_tai-khoan-dzine-ai",
    "slug": "tai-khoan-dzine-ai",
    "name": "Dzine AI",
    "brand": "Dzine AI",
    "brandLogo": "/assets/logos/logo_brand_tai-khoan-dzine-ai.png",
    "category": "design",
    "originalPriceVND": 203000,
    "currentPriceVND": 203000,
    "originalPriceUSD": 7.71,
    "currentPriceUSD": 7.71,
    "discountPercent": 0,
    "instantDelivery": true,
    "stockCount": 37,
    "badge": null,
    "platformSubtext": "Official-plan activation on your own email",
    "quotaFeatures": [
      "Entry plan: Creator (1 month) — $7.71/month",
      "Higher tiers: Master (1 month)",
      "Activated on your own account in 5–15 minutes",
      "1-for-1 warranty for the full subscription period"
    ],
    "specs": {
      "fastQuota": "Plan-based limits",
      "contextWindow": "—",
      "models": "Official plan lineup",
      "multiDevice": "Web & mobile"
    }
  },
  {
    "id": "prod_sup_tai-khoan-fangcode-ai",
    "slug": "tai-khoan-fangcode-ai",
    "name": "FangCode AI — Go (1 Month)",
    "brand": "FangCode AI",
    "brandLogo": "/assets/logos/logo_brand_tai-khoan-fangcode-ai.png",
    "category": "coding",
    "originalPriceVND": 152000,
    "currentPriceVND": 152000,
    "originalPriceUSD": 5.78,
    "currentPriceUSD": 5.78,
    "discountPercent": 0,
    "instantDelivery": true,
    "stockCount": 44,
    "badge": null,
    "platformSubtext": "Official-plan activation on your own email",
    "quotaFeatures": [
      "Entry plan: Full access (single plan) — $5.78/month",
      "Single official plan tier",
      "Activated on your own account in 5–15 minutes",
      "1-for-1 warranty for the full subscription period"
    ],
    "specs": {
      "fastQuota": "Plan-based limits",
      "contextWindow": "—",
      "models": "Official plan lineup",
      "multiDevice": "Web & mobile"
    }
  },
  {
    "id": "prod_sup_tai-khoan-figma-pro",
    "slug": "tai-khoan-figma-pro",
    "name": "Figma Pro (Own Account)",
    "brand": "Figma",
    "brandLogo": "/assets/logos/logo_brand_tai-khoan-figma-pro.png",
    "category": "design",
    "originalPriceVND": 406000,
    "currentPriceVND": 406000,
    "originalPriceUSD": 15.42,
    "currentPriceUSD": 15.42,
    "discountPercent": 0,
    "instantDelivery": true,
    "stockCount": 51,
    "badge": null,
    "platformSubtext": "Official-plan activation on your own email",
    "quotaFeatures": [
      "Entry plan: Professional 1 month — $15.42/month",
      "Higher tiers: Education 1 year",
      "Activated on your own account in 5–15 minutes",
      "1-for-1 warranty for the full subscription period"
    ],
    "specs": {
      "fastQuota": "Plan-based limits",
      "contextWindow": "—",
      "models": "Official plan lineup",
      "multiDevice": "Web & mobile"
    }
  },
  {
    "id": "prod_sup_tai-khoan-krea-ai",
    "slug": "tai-khoan-krea-ai",
    "name": "Krea AI — Basic, Pro & Max",
    "brand": "Krea AI",
    "brandLogo": "/assets/logos/logo_brand_tai-khoan-krea-ai.png",
    "category": "creative",
    "originalPriceVND": 152000,
    "currentPriceVND": 152000,
    "originalPriceUSD": 5.78,
    "currentPriceUSD": 5.78,
    "discountPercent": 0,
    "instantDelivery": true,
    "stockCount": 18,
    "badge": null,
    "platformSubtext": "Official-plan activation on your own email",
    "quotaFeatures": [
      "Entry plan: Basic 1 month — $5.78/month",
      "Higher tiers: Pro 1 month, Max 1 month",
      "Activated on your own account in 5–15 minutes",
      "1-for-1 warranty for the full subscription period"
    ],
    "specs": {
      "fastQuota": "Plan-based limits",
      "contextWindow": "—",
      "models": "Official plan lineup",
      "multiDevice": "Web & mobile"
    }
  },
  {
    "id": "prod_sup_tai-khoan-krisp-ai",
    "slug": "tai-khoan-krisp-ai",
    "name": "Krisp AI",
    "brand": "Krisp AI",
    "brandLogo": "/assets/logos/logo_brand_tai-khoan-krisp-ai.png",
    "category": "enterprise",
    "originalPriceVND": 243000,
    "currentPriceVND": 243000,
    "originalPriceUSD": 9.25,
    "currentPriceUSD": 9.25,
    "discountPercent": 0,
    "instantDelivery": true,
    "stockCount": 25,
    "badge": null,
    "platformSubtext": "Official-plan activation on your own email",
    "quotaFeatures": [
      "Entry plan: Core ((official $16/mo value)) — $9.25/month",
      "Higher tiers: Advanced ((official $30/mo value))",
      "Activated on your own account in 5–15 minutes",
      "1-for-1 warranty for the full subscription period"
    ],
    "specs": {
      "fastQuota": "Plan-based limits",
      "contextWindow": "—",
      "models": "Official plan lineup",
      "multiDevice": "Windows, macOS & mobile"
    }
  },
  {
    "id": "prod_sup_tai-khoan-obsidian-sync",
    "slug": "tai-khoan-obsidian-sync",
    "name": "Obsidian Sync",
    "brand": "Obsidian",
    "brandLogo": "/assets/logos/logo_brand_tai-khoan-obsidian-sync.png",
    "category": "enterprise",
    "originalPriceVND": 122000,
    "currentPriceVND": 122000,
    "originalPriceUSD": 4.63,
    "currentPriceUSD": 4.63,
    "discountPercent": 0,
    "instantDelivery": true,
    "stockCount": 32,
    "badge": null,
    "platformSubtext": "Official-plan activation on your own email",
    "quotaFeatures": [
      "Entry plan: Full access (single plan) — $4.63/month",
      "Single official plan tier",
      "Activated on your own account in 5–15 minutes",
      "1-for-1 warranty for the full subscription period"
    ],
    "specs": {
      "fastQuota": "Plan-based limits",
      "contextWindow": "—",
      "models": "Official plan lineup",
      "multiDevice": "Windows, macOS, iOS & Android"
    }
  },
  {
    "id": "prod_sup_tai-khoan-pika-ai",
    "slug": "tai-khoan-pika-ai",
    "name": "Pika AI",
    "brand": "Pika AI",
    "brandLogo": "/assets/logos/logo_brand_tai-khoan-pika-ai.png",
    "category": "creative",
    "originalPriceVND": 152000,
    "currentPriceVND": 152000,
    "originalPriceUSD": 5.78,
    "currentPriceUSD": 5.78,
    "discountPercent": 0,
    "instantDelivery": true,
    "stockCount": 39,
    "badge": null,
    "platformSubtext": "Official-plan activation on your own email",
    "quotaFeatures": [
      "Entry plan: Standard 1 month — $5.78/month",
      "Higher tiers: Pro 1 month, Fancy 1 month",
      "Activated on your own account in 5–15 minutes",
      "1-for-1 warranty for the full subscription period"
    ],
    "specs": {
      "fastQuota": "Plan-based limits",
      "contextWindow": "—",
      "models": "Official plan lineup",
      "multiDevice": "Web & mobile"
    }
  },
  {
    "id": "prod_sup_tai-khoan-rork-ai",
    "slug": "tai-khoan-rork-ai",
    "name": "Rork AI",
    "brand": "Rork AI",
    "brandLogo": "/assets/logos/logo_brand_tai-khoan-rork-ai.png",
    "category": "coding",
    "originalPriceVND": 355000,
    "currentPriceVND": 355000,
    "originalPriceUSD": 13.49,
    "currentPriceUSD": 13.49,
    "discountPercent": 0,
    "instantDelivery": true,
    "stockCount": 46,
    "badge": null,
    "platformSubtext": "Official-plan activation on your own email",
    "quotaFeatures": [
      "Entry plan: Full access (single plan) — $13.49/month",
      "Single official plan tier",
      "Activated on your own account in 5–15 minutes",
      "1-for-1 warranty for the full subscription period"
    ],
    "specs": {
      "fastQuota": "Plan-based limits",
      "contextWindow": "—",
      "models": "Official plan lineup",
      "multiDevice": "Web & mobile"
    }
  },
  {
    "id": "prod_sup_tai-khoan-sloyd-ai",
    "slug": "tai-khoan-sloyd-ai",
    "name": "Sloyd AI",
    "brand": "Sloyd AI",
    "brandLogo": "/assets/logos/logo_brand_tai-khoan-sloyd-ai.png",
    "category": "creative",
    "originalPriceVND": 122000,
    "currentPriceVND": 122000,
    "originalPriceUSD": 4.63,
    "currentPriceUSD": 4.63,
    "discountPercent": 0,
    "instantDelivery": true,
    "stockCount": 53,
    "badge": null,
    "platformSubtext": "Official-plan activation on your own email",
    "quotaFeatures": [
      "Entry plan: Plus (1 month) — $4.63/month",
      "Higher tiers: Pro (1 month)",
      "Activated on your own account in 5–15 minutes",
      "1-for-1 warranty for the full subscription period"
    ],
    "specs": {
      "fastQuota": "Plan-based limits",
      "contextWindow": "—",
      "models": "Official plan lineup",
      "multiDevice": "Web & mobile"
    }
  },
  {
    "id": "prod_sup_tai-khoan-storyblocks",
    "slug": "tai-khoan-storyblocks",
    "name": "Storyblocks — Essentials & All Access",
    "brand": "Storyblocks",
    "brandLogo": "/assets/logos/logo_brand_tai-khoan-storyblocks.png",
    "category": "creative",
    "originalPriceVND": 659000,
    "currentPriceVND": 659000,
    "originalPriceUSD": 25.06,
    "currentPriceUSD": 25.06,
    "discountPercent": 0,
    "instantDelivery": true,
    "stockCount": 20,
    "badge": null,
    "platformSubtext": "Official-plan activation on your own email",
    "quotaFeatures": [
      "Entry plan: Essentials 1 month — $25.06/month",
      "Higher tiers: Unlimited All Access 1 month",
      "Activated on your own account in 5–15 minutes",
      "1-for-1 warranty for the full subscription period"
    ],
    "specs": {
      "fastQuota": "Plan-based limits",
      "contextWindow": "—",
      "models": "Official plan lineup",
      "multiDevice": "Web & mobile"
    }
  },
  {
    "id": "prod_sup_tai-khoan-udemy-business",
    "slug": "tai-khoan-udemy-business",
    "name": "Udemy Business",
    "brand": "Udemy",
    "brandLogo": "/assets/logos/logo_brand_tai-khoan-udemy-business.png",
    "category": "enterprise",
    "originalPriceVND": 84000,
    "currentPriceVND": 84000,
    "originalPriceUSD": 3.2,
    "currentPriceUSD": 3.2,
    "discountPercent": 0,
    "instantDelivery": true,
    "stockCount": 27,
    "badge": null,
    "platformSubtext": "Official-plan activation on your own email",
    "quotaFeatures": [
      "Entry plan: Udemy Business 3 months — $3.20/month",
      "Higher tiers: Udemy Business 6 months, Udemy Business 12 months",
      "Activated on your own account in 5–15 minutes",
      "1-for-1 warranty for the full subscription period"
    ],
    "specs": {
      "fastQuota": "Plan-based limits",
      "contextWindow": "—",
      "models": "Official plan lineup",
      "multiDevice": "Web & mobile"
    }
  }
];
