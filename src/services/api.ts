import { User, UserRole, ProductPlan, ServiceHealthComponent } from '@/types';

/**
 * Single source of truth for the backend URL.
 * - Dev: unset → relative '/api' (Vite proxy → localhost:5000)
 * - Prod: VITE_API_BASE = https://api.your-domain.com/api
 */
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE ?? '/api';

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  token?: string;
  user?: User;
}

export const authApi = {
  /**
   * Register a new member (public registration never creates admin accounts)
   */
  async register(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<{ success: boolean; token?: string; user?: User; message?: string }> {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.message || 'Registration failed.');
    }
    return body;
  },

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<{ success: boolean; token?: string; user?: User; message?: string }> {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.message || 'Login failed.');
    }
    return body;
  },

  /**
   * Verify token and fetch current user profile
   */
  async getMe(token: string): Promise<{ success: boolean; user?: User; message?: string }> {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.message || 'Invalid or expired session.');
    }
    return body;
  },
};

export const productsApi = {
  /**
   * Fetch all products from PostgreSQL (all=true for admin to view inactive as well)
   */
  async getAll(params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    sort?: string;
    all?: boolean;
  }): Promise<ProductPlan[]> {
    const qs = new URLSearchParams();
    if (params?.all) qs.set('all', 'true');
    if (params) Object.entries(params).forEach(([k, v]) => k !== 'all' && v !== undefined && qs.set(k, String(v)));
    const res = await fetch(`${API_BASE_URL}/products${qs.toString() ? `?${qs}` : ''}`);
    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.message || 'Unable to load the product list.');
    }
    return body.data || [];
  },

  /**
   * Fetch a single product by slug
   */
  async getBySlug(slug: string): Promise<ProductPlan> {
    const res = await fetch(`${API_BASE_URL}/products/${slug}`);
    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.message || `Product ${slug} not found.`);
    }
    return body.data;
  },

  /**
   * Create a new product (Admin only)
   */
  async create(token: string, productData: Partial<ProductPlan>): Promise<ProductPlan> {
    const res = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(productData),
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.message || 'Failed to create the product.');
    }
    return body.data;
  },

  /**
   * Update an existing product (Admin only)
   */
  async update(token: string, id: string, productData: Partial<ProductPlan>): Promise<ProductPlan> {
    const res = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(productData),
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.message || 'Failed to update the product.');
    }
    return body.data;
  },

  /**
   * Delete a product (Admin only)
   */
  async delete(token: string, id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.message || 'Failed to delete the product.');
    }
  },
};

export const statusApi = {
  /**
   * Get complete status page data
   */
  async getStatusPage(): Promise<{
    overall: { status: string; uptimePercent: number; lastUpdated: string };
    components: Record<string, ServiceHealthComponent[]>;
    incidents: any[];
    maintenance: any[];
  }> {
    const res = await fetch(`${API_BASE_URL}/status`);
    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.message || 'Unable to load the status page.');
    }
    return body.data;
  },

  /**
   * Get all components
   */
  async getComponents(): Promise<ServiceHealthComponent[]> {
    const res = await fetch(`${API_BASE_URL}/status/components`);
    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.message || 'Unable to load service components.');
    }
    return body.data;
  },

  /**
   * Get component metrics
   */
  async getComponentMetrics(id: string, hours: number = 24): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/status/components/${id}/metrics?hours=${hours}`);
    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.message || 'Unable to load metrics.');
    }
    return body.data;
  },

  /**
   * Get incidents
   */
  async getIncidents(status?: string, limit: number = 50): Promise<any[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('limit', limit.toString());
    
    const res = await fetch(`${API_BASE_URL}/status/incidents?${params}`);
    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.message || 'Unable to load incidents.');
    }
    return body.data;
  },

  /**
   * Get maintenance windows
   */
  async getMaintenance(status?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    
    const res = await fetch(`${API_BASE_URL}/status/maintenance?${params}`);
    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.message || 'Unable to load maintenance windows.');
    }
    return body.data;
  },

  /**
   * Subscribe to real-time updates via SSE
   */
  subscribe(onMessage: (data: any) => void, onError?: (err: Event) => void): EventSource {
    const es = new EventSource(`${API_BASE_URL}/status/subscribe`);
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (e) {
        console.warn('Failed to parse SSE message:', e);
      }
    };
    es.onerror = (err) => {
      console.error('SSE connection error:', err);
      onError?.(err);
    };
    return es;
  },

  /**
   * Track page view
   */
  async trackView(path: string): Promise<void> {
    await fetch(`${API_BASE_URL}/status/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
    });
  },

  /**
   * Get analytics
   */
  async getAnalytics(days: number = 30): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/status/analytics?days=${days}`);
    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.message || 'Unable to load analytics.');
    }
    return body.data;
  },
};

export const ordersApi = {
  /**
   * Issue (idempotent) a personal referral invite code from the backend.
   * Auth optional — anonymous callers must provide an email to claim later.
   */
  async issueCode(email?: string, token?: string): Promise<{ code: string; reused: boolean }> {
    const res = await fetch(`${API_BASE_URL}/referral/code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ email }),
    });
    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.message || 'Unable to generate an invite code.');
    }
    return body.data;
  },

  /**
   * Validate an invite code exists (used by the /r/:code landing route).
   */
  async validateCode(code: string): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/referral/validate/${encodeURIComponent(code)}`);
    const body = await res.json().catch(() => null);
    return Boolean(res.ok && body?.data?.valid);
  },

  /**
   * Record an invite click → server-side 30-day last-click attribution.
   */
  async recordClick(code: string, visitorId: string): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/referral/click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, visitorId }),
    });
    return res.ok;
  },

  /**
   * Referrer stats for the member dashboard (clicks, FABs, rewards).
   */
  async getMyStats(token: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/referral/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.message || 'Unable to load your referral stats.');
    }
    return body.data;
  },

  /**
   * Create a new pending order. Prices are computed server-side — the client
   * only describes WHAT it wants (product, duration, provisioning), never the amount.
   */
  async create(token: string, orderData: {
    productId: string;
    planDurationMonths: number;
    provisioningType?: string;
    targetEmail?: string;
    guestEmail: string;
    quantity?: number;
    couponCode?: string;
    referralCode?: string;
  }): Promise<{ success: boolean; data?: any; message?: string }> {
    const res = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(orderData),
    });
    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.message || 'Unable to create the order.');
    }
    return body;
  },

  /**
   * Get my orders (authenticated)
   */
  async getMyOrders(token: string): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/orders/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.message || 'Unable to load orders.');
    }
    return body.data || [];
  },

  /**
   * Get specific order by ID
   */
  async getById(token: string, orderId: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.message || 'Order not found.');
    }
    return body.data;
  },

  /**
   * Public lookup (Warranty page): find order + subscription by email or orderId
   */
  async lookup(params: { email?: string; orderId?: string }): Promise<{ order: any; subscription: any }> {
    const query = new URLSearchParams();
    if (params.email) query.append('email', params.email);
    if (params.orderId) query.append('orderId', params.orderId);
    const res = await fetch(`${API_BASE_URL}/orders/lookup?${query}`);
    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.message || 'No order found matching the lookup information.');
    }
    return body.data;
  },

  /**
   * Request a server-issued OTP for the warranty self-service lookup.
   * Returns devCode only when backend runs outside NODE_ENV=production.
   */
  async requestLookupOtp(email: string, orderId: string): Promise<{ message: string; devCode?: string }> {
    const res = await fetch(`${API_BASE_URL}/orders/lookup/otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, orderId }),
    });
    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.message || 'Unable to send the OTP code.');
    }
    return { message: body.message, devCode: body.devCode };
  },

  /**
   * Verify the OTP server-side; on success returns full order + subscription.
   */
  async verifyLookupOtp(email: string, orderId: string, code: string): Promise<{ order: any; subscription: any }> {
    const res = await fetch(`${API_BASE_URL}/orders/lookup/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, orderId, code }),
    });
    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.message || 'The OTP code is invalid or has expired.');
    }
    return body.data;
  },
};

export const paymentsApi = {
  /**
   * Pre-payment PayPal health check: is PayPal configured and reachable?
   */
  async getPaypalStatus(): Promise<{ configured: boolean; connected: boolean; env: string; clientId: string | null }> {
    const res = await fetch(`${API_BASE_URL}/payments/paypal/status`);
    const body = await res.json();
    if (!res.ok) return { configured: false, connected: false, env: 'unknown', clientId: null };
    return body.data;
  },

  /**
   * Create a PayPal Order for a pending order and return the approval URL.
   */
  async createPaypalOrder(token: string, orderId: string): Promise<{ approveUrl: string; paypalOrderId: string }> {
    const res = await fetch(`${API_BASE_URL}/payments/paypal/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ orderId }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.message || 'Unable to create the PayPal payment.');
    return body.data;
  },

  /**
   * Capture an approved PayPal Order (called after the PayPal redirect back).
   */
  async capturePaypalOrder(token: string, paypalOrderId: string): Promise<{ orderId: string }> {
    const res = await fetch(`${API_BASE_URL}/payments/paypal/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ paypalOrderId }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.message || 'Unable to capture the PayPal payment.');
    return body.data;
  },

  /**
   * Dev-only: mark a pending order paid without a real PayPal capture (dev testing).
   */
  async devSimulate(token: string, orderId: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/payments/dev-simulate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ orderId }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.message || 'Payment simulation failed.');
  },
};

export const couponsApi = {
  /**
   * Server-side coupon validation — returns the discount percent the backend
   * will actually honor at order creation time, plus `expiresAt` when the code
   * has a lifetime (drives the checkout countdown). Failures carry a `reason`
   * ('expired' | 'inactive' | 'unknown') so the UI can react precisely.
   */
  async validate(token: string, code: string): Promise<{ code: string; discountPercent: number; expiresAt?: string | null }> {
    const res = await fetch(`${API_BASE_URL}/coupons/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ code }),
    });
    const body = await res.json();
    const fail = (fallback: string) => {
      const err = new Error(body.message || fallback) as Error & { reason?: string };
      err.reason = body.reason;
      throw err;
    };
    if (!res.ok) fail('Unable to verify the coupon code.');
    if (!body.success) fail('Invalid coupon code.');
    return body.data;
  },
};

export const subscriptionsApi = {
  /**
   * Get my subscriptions (authenticated)
   */
  async getMySubscriptions(token: string): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/subscriptions/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.message || 'Unable to load subscriptions.');
    }
    return body.data || [];
  },

  /**
   * Toggle auto-renew on a subscription (PostgreSQL persisted)
   */
  async updateAutoRenew(token: string, subscriptionId: string, autoRenew: boolean): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/subscriptions/${subscriptionId}/auto-renew`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ autoRenew }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.message || 'Failed to update auto-renew.');
    return body.data;
  },
};

export const warrantyApi = {
  /**
   * Customer: file a warranty/dispute ticket against an order
   */
  async createTicket(data: { orderId: string; customerEmail: string; tool: string; reason: string }): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/warranty`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.message || 'Unable to submit the warranty ticket.');
    return body.data;
  },

  /**
   * Customer: daily replacement quota derived from warranty_tickets (DB source of truth)
   */
  async getQuota(email: string): Promise<{ usedToday: number; maxPerDay: number; remaining: number }> {
    const res = await fetch(`${API_BASE_URL}/warranty/quota?email=${encodeURIComponent(email)}`);
    const body = await res.json();
    if (!res.ok) throw new Error(body.message || 'Unable to load the warranty quota.');
    return body.data;
  },

  /**
   * Admin: list dispute tickets from PostgreSQL
   */
  async getTickets(token: string, status?: string): Promise<any[]> {
    const query = status ? `?status=${status}` : '';
    const res = await fetch(`${API_BASE_URL}/admin/warranty${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.message || 'Unable to load warranty tickets.');
    return body.data || [];
  },

  /**
   * Admin: approve override — issue replacement account from buffer pool
   */
  async resolveTicket(token: string, ticketId: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/admin/warranty/${ticketId}/resolve`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.message || 'Unable to approve the ticket.');
    return body;
  },
};

export const inventoryApi = {
  /**
   * Admin: list warehouse accounts + per-tool stock summary
   */
  async getAccounts(token: string, params?: { pool?: string; status?: string }): Promise<{ accounts: any[]; stockSummary: any[] }> {
    const query = new URLSearchParams();
    if (params?.pool) query.append('pool', params.pool);
    if (params?.status) query.append('status', params.status);
    const res = await fetch(`${API_BASE_URL}/admin/inventory?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.message || 'Unable to load the account inventory.');
    return { accounts: body.data || [], stockSummary: body.stockSummary || [] };
  },

  /**
   * Admin: bulk import accounts into a pool
   */
  async bulkImport(token: string, items: { tool: string; email: string; pass: string }[], pool: 'active' | 'buffer'): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/admin/inventory/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ items, pool }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.message || 'Bulk import failed.');
    return body;
  },

  /**
   * Admin: toggle account pool (Sale pool <-> Buffer pool)
   */
  async movePool(token: string, accountId: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/admin/inventory/${accountId}/pool`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.message || 'Unable to move the account between pools.');
    return body.data;
  },

  /**
   * Admin: delete an account from the warehouse
   */
  async deleteAccount(token: string, accountId: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/admin/inventory/${accountId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.message || 'Unable to delete the account.');
  },
};

export const adminApi = {
  /**
   * Get admin dashboard stats
   */
  async getStats(token: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.message || 'Unable to load statistics.');
    return body.data;
  },

  /**
   * Get all orders (admin)
   */
  async getAllOrders(token: string, params?: { status?: string; search?: string; limit?: number }): Promise<any> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    if (params?.limit) query.append('limit', String(params.limit));

    const res = await fetch(`${API_BASE_URL}/admin/orders?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.message || 'Unable to load admin orders.');
    return body;
  },

  /**
   * Update order status (admin)
   */
  async updateOrderStatus(token: string, orderId: string, status: string, notes?: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status, notes }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.message || 'Unable to update the order status.');
    return body;
  },

  /**
   * Get all users (admin)
   */
  async getAllUsers(token: string, params?: { role?: string; search?: string }): Promise<any[]> {
    const query = new URLSearchParams();
    if (params?.role) query.append('role', params.role);
    if (params?.search) query.append('search', params.search);

    const res = await fetch(`${API_BASE_URL}/admin/users?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.message || 'Unable to load the user list.');
    return body.data || [];
  },

  /**
   * Update user role (admin)
   */
  async updateUserRole(token: string, userId: string, role: 'member' | 'admin'): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ role }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.message || 'Unable to update the role.');
    return body;
  },

  /**
   * Lock / unlock a user account (admin)
   */
  async updateUserStatus(token: string, userId: string, status: 'active' | 'banned'): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.message || 'Unable to update the user status.');
    return body;
  },

  /**
   * Add balance to user (admin)
   */
  async addUserBalance(token: string, userId: string, amountUSD: number): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/balance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amountUSD }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.message || 'Unable to add balance.');
    return body;
  },
};
