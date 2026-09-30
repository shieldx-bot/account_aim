import { User, UserRole, ProductPlan, ServiceHealthComponent } from '@/types';

const API_BASE_URL = '/api';

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  token?: string;
  user?: User;
}

export const authApi = {
  /**
   * Register a new member or admin
   */
  async register(data: {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
    adminCode?: string;
    phone?: string;
  }): Promise<{ success: boolean; token?: string; user?: User; message?: string }> {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.message || 'Đăng ký không thành công.');
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
      throw new Error(body.message || 'Đăng nhập không thành công.');
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
      throw new Error(body.message || 'Phiên đăng nhập không hợp lệ.');
    }
    return body;
  },
};

export const productsApi = {
  /**
   * Fetch all products from PostgreSQL (all=true for admin to view inactive as well)
   */
  async getAll(all: boolean = false): Promise<ProductPlan[]> {
    const res = await fetch(`${API_BASE_URL}/products${all ? '?all=true' : ''}`);
    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.message || 'Không thể tải danh sách sản phẩm.');
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
      throw new Error(body.message || `Không tìm thấy sản phẩm ${slug}.`);
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
      throw new Error(body.message || 'Lỗi khi tạo sản phẩm.');
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
      throw new Error(body.message || 'Lỗi khi cập nhật sản phẩm.');
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
      throw new Error(body.message || 'Lỗi khi xóa sản phẩm.');
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
      throw new Error(body.message || 'Không thể tải trang trạng thái.');
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
      throw new Error(body.message || 'Không thể tải thành phần dịch vụ.');
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
      throw new Error(body.message || 'Không thể tải metrics.');
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
      throw new Error(body.message || 'Không thể tải sự cố.');
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
      throw new Error(body.message || 'Không thể tải bảo trì.');
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
      throw new Error(body.message || 'Không thể tải analytics.');
    }
    return body.data;
  },
};

export const ordersApi = {
  /**
   * Create a new order after payment confirmed
   */
  async create(token: string, orderData: {
    productId: string;
    productName: string;
    productSlug: string;
    planDurationMonths: number;
    provisioningType: string;
    targetEmail?: string;
    guestEmail: string;
    quantity: number;
    unitPriceVND: number;
    unitPriceUSD: number;
    discountVND?: number;
    discountUSD?: number;
    totalVND: number;
    totalUSD: number;
    currency: string;
    paymentMethod: string;
    paymentGatewayRef?: string;
    couponCode?: string;
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
      throw new Error(body.message || 'Không thể tạo đơn hàng.');
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
      throw new Error(body.message || 'Không thể tải đơn hàng.');
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
      throw new Error(body.message || 'Không tìm thấy đơn hàng.');
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
      throw new Error(body.message || 'Không tìm thấy đơn hàng khớp với thông tin tra cứu.');
    }
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
      throw new Error(body.message || 'Không thể tải danh sách đăng ký.');
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
    if (!res.ok) throw new Error(body.message || 'Không thể cập nhật tự động gia hạn.');
    return body.data;
  },
};

export const warrantyApi = {
  /**
   * Customer: file a warranty/dispute ticket against an order
   */
  async createTicket(data: { orderId: string; customerEmail: string; tool: string; reason: string; attempts?: number }): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/warranty`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.message || 'Không thể ghi nhận khiếu nại bảo hành.');
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
    if (!res.ok) throw new Error(body.message || 'Không thể tải danh sách khiếu nại.');
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
    if (!res.ok) throw new Error(body.message || 'Không thể duyệt khiếu nại.');
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
    if (!res.ok) throw new Error(body.message || 'Không thể tải kho tài khoản.');
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
    if (!res.ok) throw new Error(body.message || 'Nhập kho thất bại.');
    return body;
  },

  /**
   * Admin: toggle account pool (Kho bán <-> Kho dự phòng)
   */
  async movePool(token: string, accountId: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/admin/inventory/${accountId}/pool`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.message || 'Không thể chuyển kho.');
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
    if (!res.ok) throw new Error(body.message || 'Không thể xóa tài khoản.');
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
    if (!res.ok) throw new Error(body.message || 'Không thể tải thống kê.');
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
    if (!res.ok) throw new Error(body.message || 'Không thể tải đơn hàng admin.');
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
    if (!res.ok) throw new Error(body.message || 'Không thể cập nhật trạng thái đơn.');
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
    if (!res.ok) throw new Error(body.message || 'Không thể tải danh sách người dùng.');
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
    if (!res.ok) throw new Error(body.message || 'Không thể cập nhật role.');
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
    if (!res.ok) throw new Error(body.message || 'Không thể cập nhật trạng thái người dùng.');
    return body;
  },

  /**
   * Add balance to user (admin)
   */
  async addUserBalance(token: string, userId: string, amountVND: number): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/balance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amountVND }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.message || 'Không thể nạp tiền.');
    return body;
  },
};
