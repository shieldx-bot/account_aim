import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem, ProductPlan, DurationOption, ProvisioningType } from '@/types';
import { useAuth } from './AuthContext';
import { trackEvent } from '@/utils/telemetry';

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  couponCode: string | null;
  couponDiscountPercent: number;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  totalCount: number;
  subtotalVND: number;
  subtotalUSD: number;
  discountVND: number;
  discountUSD: number;
  finalTotalVND: number;
  finalTotalUSD: number;
  tierDiscountPercent: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'aipro_cart_items';

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [couponDiscountPercent, setCouponDiscountPercent] = useState(0);

  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(CART_STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      } catch {
        // Fallback
      }
    }
    return [];
  });

  // Sync with localStorage
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  // Calculate Member Tier Discount
  const tierDiscountPercent = user?.tier === 'VIP Dev' ? 5 : user?.tier === 'Enterprise' ? 10 : 0;

  const addItem = (newItem: Omit<CartItem, 'id'>) => {
    setItems((prev) => {
      // Check if identical config exists
      const existingIdx = prev.findIndex(
        (i) =>
          i.product.id === newItem.product.id &&
          i.duration.months === newItem.duration.months &&
          i.provisioningType === newItem.provisioningType &&
          i.targetEmail === newItem.targetEmail
      );

      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += newItem.quantity;
        return updated;
      }

      const created: CartItem = {
        ...newItem,
        id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      };
      return [...prev, created];
    });

    trackEvent('add_to_cart', {
      product: newItem.product.name,
      months: newItem.duration.months,
    });
    setIsOpen(true);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    trackEvent('remove_from_cart', { id });
  };

  const updateQuantity = (id: string, qty: number) => {
    if (qty <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: qty } : item))
    );
  };

  const clearCart = () => {
    setItems([]);
    setCouponCode(null);
    setCouponDiscountPercent(0);
  };

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);
  const toggleCart = () => setIsOpen((prev) => !prev);

  const applyCoupon = (code: string): { success: boolean; message: string } => {
    const normalized = code.trim().toUpperCase();
    if (normalized === 'DEVVIP10') {
      setCouponCode(normalized);
      setCouponDiscountPercent(10);
      return { success: true, message: 'Áp dụng mã DEVVIP10 thành công: Giảm thêm 10%!' };
    }
    if (normalized === 'AI2025') {
      setCouponCode(normalized);
      setCouponDiscountPercent(5);
      return { success: true, message: 'Áp dụng mã AI2025 thành công: Giảm thêm 5%!' };
    }
    return { success: false, message: 'Mã giảm giá không hợp lệ hoặc đã hết hạn.' };
  };

  const removeCoupon = () => {
    setCouponCode(null);
    setCouponDiscountPercent(0);
  };

  // Calculations
  const totalCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const subtotalVND = items.reduce(
    (acc, item) => acc + item.unitPriceVND * item.quantity,
    0
  );

  const subtotalUSD = items.reduce(
    (acc, item) => acc + item.unitPriceUSD * item.quantity,
    0
  );

  const totalDiscountRate = (tierDiscountPercent + couponDiscountPercent) / 100;
  const discountVND = Math.round(subtotalVND * totalDiscountRate);
  const discountUSD = Number((subtotalUSD * totalDiscountRate).toFixed(2));

  const finalTotalVND = Math.max(0, subtotalVND - discountVND);
  const finalTotalUSD = Math.max(0, Number((subtotalUSD - discountUSD).toFixed(2)));

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isOpen,
        openCart,
        closeCart,
        toggleCart,
        couponCode,
        couponDiscountPercent,
        applyCoupon,
        removeCoupon,
        totalCount,
        subtotalVND,
        subtotalUSD,
        discountVND,
        discountUSD,
        finalTotalVND,
        finalTotalUSD,
        tierDiscountPercent,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
