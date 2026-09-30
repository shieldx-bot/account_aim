import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Currency, ProductPlan, ConfigurationState, DurationOption, ProvisioningType } from '@/types';
import { productsApi } from '@/services/api';
import { trackEvent } from '@/utils/telemetry';

const PRODUCTS_CACHE_KEY = 'aipro_products_cache';

export interface FeatureFlags {
  isVietQREnabled: boolean;
  isStripeEnabled: boolean;
  isCryptoEnabled: boolean;
  isPayPalEnabled: boolean;
  announcementBanner: string | null;
}

interface AppContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatPrice: (vnd: number, usd: number) => string;
  isOnline: boolean;
  featureFlags: FeatureFlags;
  setFeatureFlags: React.Dispatch<React.SetStateAction<FeatureFlags>>;
  activeConfig: ConfigurationState;
  updateConfig: (patch: Partial<ConfigurationState>) => void;
  clearConfig: () => void;
  products: ProductPlan[];
  isLoadingProducts: boolean;
  productsError: string | null;
  refreshProducts: () => Promise<void>;
}

const DEFAULT_DURATION: DurationOption = {
  months: 1,
  label: '1 Tháng',
  discountPercent: 0,
  monthlyEquivalentVND: 249000,
  monthlyEquivalentUSD: 9.99,
};

const DEFAULT_CONFIG: ConfigurationState = {
  product: null as unknown as ProductPlan,
  provisioningType: 'invite_email',
  targetEmail: '',
  duration: DEFAULT_DURATION,
  guestEmail: '',
};

/**
 * Read the last successful PostgreSQL catalog snapshot from localStorage
 * (offline resilience only — source of truth is always the database).
 */
const readProductsCache = (): ProductPlan[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PRODUCTS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore corrupted cache
  }
  return [];
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aipro_currency');
      if (saved === 'USD' || saved === 'VND') return saved;
    }
    return 'VND';
  });

  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  const [featureFlags, setFeatureFlags] = useState<FeatureFlags>({
    isVietQREnabled: true,
    isStripeEnabled: true,
    isCryptoEnabled: true,
    isPayPalEnabled: true,
    announcementBanner: null,
  });

  const [activeConfig, setActiveConfig] = useState<ConfigurationState>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('aipro_active_config');
        if (saved) return JSON.parse(saved);
      } catch {
        // Fallback to default
      }
    }
    return DEFAULT_CONFIG;
  });

  const [products, setProducts] = useState<ProductPlan[]>(readProductsCache);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  // Keep the default configuration product in sync with the database catalog
  useEffect(() => {
    if (products.length === 0) return;
    setActiveConfig((prev) => {
      if (!prev.product || !products.some((p) => p.id === prev.product?.id)) {
        const next = { ...prev, product: products[0] };
        sessionStorage.setItem('aipro_active_config', JSON.stringify(next));
        return next;
      }
      return prev;
    });
  }, [products]);

  const refreshProducts = useCallback(async () => {
    try {
      setIsLoadingProducts(true);
      const data = await productsApi.getAll();
      if (Array.isArray(data)) {
        setProducts(data);
        setProductsError(null);
        // Cache latest DB snapshot for offline resilience
        try {
          localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(data));
        } catch {
          // storage full — non critical
        }
      }
    } catch (err: any) {
      console.error('[AppContext] Failed to load products from PostgreSQL:', err);
      setProductsError(err.message || 'Không thể tải danh mục sản phẩm từ cơ sở dữ liệu.');
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  // Initial products fetch from PostgreSQL
  useEffect(() => {
    refreshProducts();
  }, [refreshProducts]);

  // Offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem('aipro_currency', c);
    trackEvent('currency_toggled', { currency: c });
  };

  const formatPrice = (vnd: number, usd: number): string => {
    if (currency === 'VND') {
      return `${vnd.toLocaleString('vi-VN')} ₫`;
    }
    return `$${usd.toFixed(2)}`;
  };

  const updateConfig = (patch: Partial<ConfigurationState>) => {
    setActiveConfig((prev) => {
      const next = { ...prev, ...patch };
      sessionStorage.setItem('aipro_active_config', JSON.stringify(next));
      return next;
    });
  };

  const clearConfig = () => {
    setActiveConfig(DEFAULT_CONFIG);
    sessionStorage.removeItem('aipro_active_config');
  };

  return (
    <AppContext.Provider
      value={{
        currency,
        setCurrency,
        formatPrice,
        isOnline,
        featureFlags,
        setFeatureFlags,
        activeConfig,
        updateConfig,
        clearConfig,
        products,
        isLoadingProducts,
        productsError,
        refreshProducts,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
