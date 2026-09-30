import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, AuthState } from '@/types';
import { trackEvent } from '@/utils/telemetry';
import { authApi } from '@/services/api';

interface AuthContextType extends AuthState {
  token: string | null;
  login: (email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  register: (
    name: string,
    email: string,
    pass: string,
    role?: UserRole,
    adminCode?: string
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateUser: (patch: Partial<User>) => void;
  addBalance: (vnd: number, usd: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'aipro_auth_session';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(AUTH_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            user: parsed.user,
            token: parsed.token,
            isAuthenticated: !!parsed.user && !!parsed.token,
            isLoading: true,
          };
        }
      } catch {
        // Fallback
      }
    }
    return {
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    };
  });

  // Verify token with backend PostgreSQL on mount
  useEffect(() => {
    const verifySession = async () => {
      if (authState.token) {
        try {
          const res = await authApi.getMe(authState.token);
          if (res.success && res.user) {
            setAuthState((prev) => ({
              ...prev,
              user: res.user!,
              isAuthenticated: true,
              isLoading: false,
            }));
            localStorage.setItem(
              AUTH_STORAGE_KEY,
              JSON.stringify({ user: res.user, token: authState.token })
            );
            return;
          }
        } catch {
          // If token expired or server error, retain cached user or clear
        }
      }
      setAuthState((prev) => ({ ...prev, isLoading: false }));
    };

    verifySession();
  }, []);

  const saveSession = (user: User | null, token: string | null) => {
    if (user && token) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, token }));
      setAuthState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  const login = async (email: string, pass: string): Promise<{ success: boolean; message?: string }> => {
    try {
      // Call Backend PostgreSQL API
      const res = await authApi.login(email, pass);
      if (res.success && res.user && res.token) {
        saveSession(res.user, res.token);
        trackEvent('user_login', { role: res.user.role, email: res.user.email });
        return { success: true };
      }
      return { success: false, message: res.message || 'Đăng nhập không thành công.' };
    } catch (err: any) {
      // No demo fallback in production — return the real error
      console.error('[Auth] Backend API login failed:', err.message);
      return {
        success: false,
        message: 'Không thể kết nối máy chủ. Vui lòng thử lại sau.',
      };
    }
  };

  const register = async (
    name: string,
    email: string,
    pass: string,
    role: UserRole = 'member',
    adminCode?: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await authApi.register({
        name,
        email,
        password: pass,
        role,
        adminCode,
      });

      if (res.success && res.user && res.token) {
        saveSession(res.user, res.token);
        trackEvent('user_registered', { role, email: res.user.email });
        return { success: true, message: res.message };
      }
      return { success: false, message: res.message || 'Đăng ký không thành công.' };
    } catch (err: any) {
      console.warn('[Auth] Backend API register failed:', err.message);
      return { success: false, message: err.message || 'Có lỗi xảy ra khi kết nối máy chủ.' };
    }
  };

  const logout = () => {
    trackEvent('user_logout', { email: authState.user?.email });
    saveSession(null, null);
  };

  const updateUser = (patch: Partial<User>) => {
    if (!authState.user) return;
    const updated = { ...authState.user, ...patch };
    saveSession(updated, authState.token);
  };

  const addBalance = (vnd: number, usd: number) => {
    if (!authState.user) return;
    const updated: User = {
      ...authState.user,
      balanceVND: authState.user.balanceVND + vnd,
      balanceUSD: authState.user.balanceUSD + usd,
    };
    saveSession(updated, authState.token);
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        register,
        logout,
        updateUser,
        addBalance,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
