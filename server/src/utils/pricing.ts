/**
 * Server-side pricing model — the single source of truth for money math.
 * The client may compute prices for display, but every order is repriced here
 * before it touches the database, so tampered request bodies cannot change what
 * a customer is charged.
 *
 * Mirrors the frontend duration options in src/pages/ProductPage.tsx — keep in sync.
 */
export const DURATION_DISCOUNTS: Record<number, number> = {
  1: 0,
  3: 15,
  6: 25,
  12: 35,
};

export const TIER_DISCOUNTS: Record<string, number> = {
  'VIP Dev': 5,
  Enterprise: 10,
};

export const durationDiscountPercent = (months: number): number =>
  DURATION_DISCOUNTS[months] ?? 0;

export interface ServerPriceResult {
  unitPriceVND: number;
  unitPriceUSD: number;
  discountVND: number;
  discountUSD: number;
  totalVND: number;
  totalUSD: number;
  discountPercent: number;
}

/**
 * Reprice an order line: monthly catalog price x months x duration discount,
 * then x quantity, then apply the combined (tier + coupon) discount rate.
 */
export const computeOrderPrice = (
  monthlyPriceVND: number,
  monthlyPriceUSD: number,
  months: number,
  quantity: number,
  extraDiscountPercent: number
): ServerPriceResult => {
  const durPct = durationDiscountPercent(months);
  const unitVND = Math.round(monthlyPriceVND * months * (1 - durPct / 100));
  const unitUSD = Number((monthlyPriceUSD * months * (1 - durPct / 100)).toFixed(2));

  const subtotalVND = unitVND * quantity;
  const subtotalUSD = Number((unitUSD * quantity).toFixed(2));

  const totalPct = Math.min(durPct + extraDiscountPercent, 90);
  const discountVND = Math.round(subtotalVND * (totalPct / 100));
  const discountUSD = Number((subtotalUSD * (totalPct / 100)).toFixed(2));

  return {
    unitPriceVND: unitVND,
    unitPriceUSD: unitUSD,
    discountVND,
    discountUSD,
    totalVND: Math.max(0, subtotalVND - discountVND),
    totalUSD: Math.max(0, Number((subtotalUSD - discountUSD).toFixed(2))),
    discountPercent: totalPct,
  };
};
