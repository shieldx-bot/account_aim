import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider } from '@/context/AppContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

// Layouts
import { MainLayout } from '@/components/layout/MainLayout';
import { MemberLayout } from '@/components/layout/MemberLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';

// Public Pages
import { HomePage } from '@/pages/HomePage';
import { ProductsPage } from '@/pages/ProductsPage';
import { ProductPage } from '@/pages/ProductPage';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { DeliveryPage } from '@/pages/DeliveryPage';
import { LookupPage } from '@/pages/LookupPage';
import { LegalPage } from '@/pages/LegalPage';
import { StatusPage } from '@/pages/StatusPage';
import { DocsPage } from '@/pages/DocsPage';
import { CartPage } from '@/pages/CartPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { CartProvider } from '@/context/CartContext';

// Auth Pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';

// Member Portal Pages
import { MemberDashboardPage } from '@/pages/member/MemberDashboardPage';
import { MemberSubscriptionsPage } from '@/pages/member/MemberSubscriptionsPage';
import { MemberOrdersPage } from '@/pages/member/MemberOrdersPage';
import { MemberWarrantyPage } from '@/pages/member/MemberWarrantyPage';
import { MemberProfilePage } from '@/pages/member/MemberProfilePage';

// Admin Operator Pages
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { AdminProductsPage } from '@/pages/admin/AdminProductsPage';
import { AdminOrdersPage } from '@/pages/admin/AdminOrdersPage';
import { AdminInventoryPage } from '@/pages/admin/AdminInventoryPage';
import { AdminWarrantyPage } from '@/pages/admin/AdminWarrantyPage';
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage';

/**
 * ScrollToTop helper component
 */
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
};

/**
 * Protected Route for logged-in users (Members or Admins)
 */
const ProtectedMemberRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

/**
 * Protected Route specifically requiring Administrator role
 */
const ProtectedAdminRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/member/dashboard" replace />;
  }

  return children;
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary contextName="Root_App_Boundary">
      <AuthProvider>
        <AppProvider>
          <CartProvider>
            <BrowserRouter>
              <ScrollToTop />
              <Routes>
                {/* Public Storefront Layout Routes */}
                <Route element={<MainLayout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/product/:slug" element={<ProductPage />} />
                  <Route path="/products/:slug" element={<ProductPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/lookup" element={<LookupPage />} />
                  <Route path="/terms" element={<LegalPage />} />
                  <Route path="/status" element={<StatusPage />} />
                  <Route path="/docs" element={<DocsPage />} />
                </Route>

              {/* Authentication Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Distraction-Free Customer Checkout Corridor */}
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/order/success/:orderId" element={<DeliveryPage />} />

              {/* Dedicated Member Portal (Giao diện riêng của Thành viên) */}
              <Route
                path="/member"
                element={
                  <ProtectedMemberRoute>
                    <MemberLayout />
                  </ProtectedMemberRoute>
                }
              >
                <Route index element={<Navigate to="/member/dashboard" replace />} />
                <Route path="dashboard" element={<MemberDashboardPage />} />
                <Route path="subscriptions" element={<MemberSubscriptionsPage />} />
                <Route path="orders" element={<MemberOrdersPage />} />
                <Route path="warranty" element={<MemberWarrantyPage />} />
                <Route path="profile" element={<MemberProfilePage />} />
              </Route>

              {/* Dedicated Admin Portal (Giao diện riêng của Quản trị viên) */}
              <Route
                path="/admin"
                element={
                  <ProtectedAdminRoute>
                    <AdminLayout />
                  </ProtectedAdminRoute>
                }
              >
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboardPage />} />
                <Route path="products" element={<AdminProductsPage />} />
                <Route path="orders" element={<AdminOrdersPage />} />
                <Route path="inventory" element={<AdminInventoryPage />} />
                <Route path="warranty" element={<AdminWarrantyPage />} />
                <Route path="users" element={<AdminUsersPage />} />
              </Route>

              {/* Fallback 404 Developer CLI */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AppProvider>
    </AuthProvider>
  </ErrorBoundary>
  );
};

export default App;
