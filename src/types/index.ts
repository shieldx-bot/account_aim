// Single-currency app: all monetary values are US Dollars.
// 'VND' is kept in the union only for backward compatibility with previously
// persisted localStorage values / legacy API payloads — it always renders as USD.
export type Currency = 'USD' | 'VND';

/** Fixed conversion rate used to derive legacy VND fields from USD prices. */
export const VND_PER_USD = 25000;

/** Derive a legacy *_VND value from a USD amount. */
export const usdToVnd = (usd: number): number => Math.round(usd * VND_PER_USD);

export type ProductCategory = 'all' | 'coding' | 'llm' | 'search' | 'design' | 'creative' | 'enterprise' | 'education';

export interface ProductPlan {
  id: string;
  slug: string;
  name: string;
  brand: string;
  brandLogo: string;
  category: ProductCategory;
  originalPriceVND: number;
  currentPriceVND: number;
  originalPriceUSD: number;
  currentPriceUSD: number;
  discountPercent: number;
  instantDelivery: boolean;
  stockCount: number;
  badge?: string;
  quotaFeatures: string[];
  platformSubtext: string;
  specs: {
    fastQuota: string;
    contextWindow: string;
    models: string;
    multiDevice: string;
  };
  outOfStockInvite?: boolean;
}

export type ProvisioningType = 'invite_email' | 'pre_created';

export interface DurationOption {
  months: number;
  label: string;
  discountPercent: number;
  monthlyEquivalentVND: number;
  monthlyEquivalentUSD: number;
  isGiftExtraMonth?: boolean;
}

export interface ConfigurationState {
  product: ProductPlan;
  provisioningType: ProvisioningType;
  targetEmail: string;
  duration: DurationOption;
  guestEmail: string;
}

export type PaymentMethod = 'vietqr' | 'card_via_paypal' | 'crypto_usdt' | 'paypal';

export interface VietQRData {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  amount: number;
  transferMemo: string;
  qrCodeUrl: string;
}

export type OrderStatus = 'pending' | 'processing' | 'paid' | 'dispatched' | 'refunded' | 'expired';

export interface OrderCredentials {
  email: string;
  password?: string;
  accessToken?: string;
  recoveryCode2FA?: string;
  inviteLink?: string;
  expiresAt: string;
  warrantyDaysLeft: number;
}

export interface OrderItem {
  orderId: string;
  productSlug: string;
  productName: string;
  planDurationMonths: number;
  provisioningType: ProvisioningType;
  guestEmail: string;
  targetEmail?: string;
  totalUSD?: number;
  totalAmount: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  credentials?: OrderCredentials;
  warrantyExpireDate: string;
  createdAt: string;
}

export type WarrantyReason = 'out_of_pro' | 'wrong_password' | 'device_limit' | 'other';

export interface ReplacementRecord {
  timestamp: string;
  previousEmail: string;
  newEmail: string;
  reason: WarrantyReason;
}

export interface ServiceHealthComponent {
  id?: string;
  name: string;
  category: 'ai_providers' | 'payment_gateways' | 'fulfillment_bot' | 'core_infrastructure';
  status: 'operational' | 'degraded_performance' | 'partial_outage' | 'major_outage';
  uptimePercent: number;
  history90Days?: number[];
  description?: string;
  metadata?: Record<string, any>;
  latency_ms?: number;
  error_rate?: number;
  requests_per_second?: number;
  updated_at?: string;
}

export type UserRole = 'member' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  balanceVND: number;
  balanceUSD: number;
  tier: 'Standard' | 'VIP Dev' | 'Enterprise';
  createdAt: string;
  phone?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface MemberSubscription {
  id: string;
  productSlug: string;
  productName: string;
  brand: string;
  provisioningType: ProvisioningType;
  accountEmail: string;
  accountPassword?: string;
  accessToken?: string;
  startDate: string;
  expiresAt: string;
  daysRemaining: number;
  status: 'active' | 'expiring_soon' | 'expired' | 'revoked';
  autoRenew: boolean;
}

export interface CartItem {
  id: string;
  product: ProductPlan;
  duration: DurationOption;
  provisioningType: ProvisioningType;
  targetEmail: string;
  quantity: number;
  unitPriceVND: number;
  unitPriceUSD: number;
}


