import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
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
import { AboutPage } from '@/pages/AboutPage';
import { StatusPage } from '@/pages/StatusPage';
import { DocsPage } from '@/pages/DocsPage';
import { BlogPage } from '@/pages/BlogPage';
import { BlogTopicPage } from '@/pages/BlogTopicPage';
import { CartPage } from '@/pages/CartPage';
import { ReferralLandingPage } from '@/pages/ReferralLandingPage';
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
import { MemberEarnPage } from '@/pages/member/MemberEarnPage';

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
 * /blog/<topic> → /blog/<topic>/1 (topic feeds always start at page 1).
 */
const BlogTopicRedirect: React.FC = () => {
  const { tagSlug } = useParams<{ tagSlug: string }>();
  return <Navigate to={`/blog/${tagSlug || ''}/1`} replace />;
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
            
<BrowserRouter basename={import.meta.env.BASE_URL}>
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
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/status" element={<StatusPage />} />
                  <Route path="/docs" element={<DocsPage />} />
                  <Route path="/blog" element={<BlogPage />} />
                  {/* Legacy archive alias from the PostgreSQL era — the blog is
                      now the MongoDB freeCodeCamp archive at /blog. */}
                  <Route path="/blog/archive" element={<Navigate to="/blog" replace />} />
                  {/* /blog/<topic> redirects to its first page; pages are
                      crawlable URLs: /blog/<topic>/<page> (20 posts each). */}
                  <Route path="/blog/:tagSlug" element={<BlogTopicRedirect />} />
                  <Route path="/blog/:tagSlug/:page" element={<BlogTopicPage />} />
                </Route>

              {/* Authentication Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Distraction-Free Customer Checkout Corridor */}
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/order/success/:orderId" element={<DeliveryPage />} />

              {/* Invite Landing — destination of every personal referral link /r/:CODE */}
              <Route path="/r/:code" element={<ReferralLandingPage />} />

              {/* Dedicated Member Portal (Separate interface for Members) */}
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
                <Route path="earn" element={<MemberEarnPage />} />
                <Route path="profile" element={<MemberProfilePage />} />
              </Route>

              {/* Dedicated Admin Portal (Separate interface for Administrators) */}
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
