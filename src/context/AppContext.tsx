import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Currency, ProductPlan, ConfigurationState, DurationOption, ProvisioningType } from '@/types';
import { productsApi } from '@/services/api';
import { trackEvent } from '@/utils/telemetry';

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
  activeConfig: ConfigurationState | null;
  updateConfig: (patch: Partial<ConfigurationState>) => void;
  clearConfig: () => void;
  initConfigForProduct: (product: ProductPlan) => void;
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

/**
 * Build an initial configuration from a product loaded from PostgreSQL.
 * No mock products are bundled into production anymore — the catalog
 * (and therefore any active config) always originates from the database.
 */
const buildConfigForProduct = (product: ProductPlan): ConfigurationState => ({
  product,
  provisioningType: product.outOfStockInvite ? 'invite_email' : 'pre_created',
  targetEmail: '',
  duration: {
    ...DEFAULT_DURATION,
    monthlyEquivalentVND: product.currentPriceVND,
    monthlyEquivalentUSD: product.currentPriceUSD,
  },
  guestEmail: '',
});

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

  const [activeConfig, setActiveConfig] = useState<ConfigurationState | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('aipro_active_config');
        if (saved) return JSON.parse(saved);
      } catch {
        // Ignore corrupted session config
      }
    }
    return null;
  });

  // Production source of truth: PostgreSQL catalog only — no bundled mock data.
  const [products, setProducts] = useState<ProductPlan[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  const refreshProducts = useCallback(async () => {
    try {
      setIsLoadingProducts(true);
      setProductsError(null);
      const data = await productsApi.getAll();
      if (!Array.isArray(data)) {
        throw new Error('Dữ liệu trả về không hợp lệ.');
      }
      setProducts(data);
    } catch (err) {
      console.error('[AppContext] Failed to load products from PostgreSQL:', err);
      setProducts([]);
      setProductsError(
        err instanceof Error ? err.message : 'Không thể tải danh mục sản phẩm từ máy chủ.'
      );
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
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      sessionStorage.setItem('aipro_active_config', JSON.stringify(next));
      return next;
    });
  };

  const initConfigForProduct = (product: ProductPlan) => {
    const next = buildConfigForProduct(product);
    sessionStorage.setItem('aipro_active_config', JSON.stringify(next));
    setActiveConfig(next);
  };

  const clearConfig = () => {
    setActiveConfig(null);
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
        initConfigForProduct,
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
