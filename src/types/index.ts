export type Currency = 'VND' | 'USD';

export type ProductCategory =
  | 'all'
  | 'coding'
  | 'llm'
  | 'search'
  | 'design'
  | 'creative'
  | 'enterprise'
  | 'api-credit';

/** Nhà cung cấp model AI lớn (OpenAI, Anthropic, Google, DeepSeek, ...) */
export type AiProviderId =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'deepseek'
  | 'xai'
  | 'mistral'
  | 'cohere'
  | 'perplexity';

/** Gói tài khoản API kèm số dư credit $ sử dụng model của các nhà cung cấp lớn */
export interface ApiCreditAccount {
  id: string;
  slug: string;
  provider: AiProviderId;
  providerName: string;
  brandLogo: string;
  /** Mã giảm giá áp dụng cho hóa đơn API chính thức của nhà cung cấp */
  discountPercent: number;
  /** Số dư credit $ có sẵn trong tài khoản */
  creditAmountUSD: number;
  /** Giá bán ra (VNĐ) */
  priceVND: number;
  /** Số lượng tài khoản còn hàng */
  stockCount: number;
  instantDelivery: boolean;
  badge?: string;
  description: string;
  /** Các model có thể truy cập qua API key của tài khoản */
  includedModels: string[];
  /** Hạn sử dụng credit (tháng) */
  validityMonths: number;
  features: string[];
}

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

export type PaymentMethod = 'vietqr' | 'stripe_card' | 'crypto_usdt' | 'paypal';

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


