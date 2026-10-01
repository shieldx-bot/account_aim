import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Currency, ProductPlan, ConfigurationState, DurationOption, ProvisioningType } from '@/types';
import { productsApi } from '@/services/api';
import { trackEvent } from '@/utils/telemetry';

export interface FeatureFlags {
  isVietQREnabled: boolean;
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
  label: '1 Month',
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
    // Single-currency app: always USD. Any legacy persisted value is ignored.
    if (typeof window !== 'undefined') {
      localStorage.setItem('agentlab_currency', 'USD');
    }
    return 'USD';
  });

  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  const [featureFlags, setFeatureFlags] = useState<FeatureFlags>({
    isVietQREnabled: true,
    isCryptoEnabled: true,
    isPayPalEnabled: true,
    announcementBanner: null,
  });

  const [activeConfig, setActiveConfig] = useState<ConfigurationState | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('agentlab_active_config');
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
        throw new Error('Invalid data returned from the server.');
      }
      setProducts(data);
    } catch (err) {
      console.error('[AppContext] Failed to load products from PostgreSQL:', err);
      setProducts([]);
      setProductsError(
        err instanceof Error ? err.message : 'Could not load the product catalog from the server.'
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
    localStorage.setItem('agentlab_currency', c);
    trackEvent('currency_toggled', { currency: c });
  };

  const formatPrice = (_vnd: number, usd: number): string => {
    // All prices are displayed in US Dollars.
    return `$${usd.toFixed(2)}`;
  };

  const updateConfig = (patch: Partial<ConfigurationState>) => {
    setActiveConfig((prev) => {
      // Quick-buy entry points (e.g. "Buy Now" on the landing page) land here
      // with no prior config — seed one from the product in the patch instead
      // of silently no-op'ing (which made CheckoutPage bounce back home).
      const base = prev ?? (patch.product ? buildConfigForProduct(patch.product) : null);
      if (!base) return prev;
      const next = { ...base, ...patch };
      sessionStorage.setItem('agentlab_active_config', JSON.stringify(next));
      return next;
    });
  };

  const initConfigForProduct = (product: ProductPlan) => {
    const next = buildConfigForProduct(product);
    sessionStorage.setItem('agentlab_active_config', JSON.stringify(next));
    setActiveConfig(next);
  };

  const clearConfig = () => {
    setActiveConfig(null);
    sessionStorage.removeItem('agentlab_active_config');
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
