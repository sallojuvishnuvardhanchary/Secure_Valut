import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('securevault_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('securevault_token') || null);
  const [loading, setLoading] = useState(true);

  // Check session on initial app mount
  useEffect(() => {
    async function checkAuth() {
      const savedToken = localStorage.getItem('securevault_token');
      if (savedToken) {
        try {
          const res = await authApi.getMe();
          if (res.data?.success) {
            setUser(res.data.user);
            localStorage.setItem('securevault_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.warn('[Auth] Session validation failed or expired.');
          localStorage.removeItem('securevault_token');
          localStorage.removeItem('securevault_user');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    }
    checkAuth();
  }, []);

  /**
   * Step 1: Initiate Login Authentication (Triggers Gmail OTP send)
   */
  const login = async (email) => {
    const res = await authApi.login({ email });
    if (res.data?.success) {
      return res.data; // { success: true, requireOtp: true, purpose: 'login', email }
    }
    throw new Error(res.data?.message || 'Login failed');
  };

  /**
   * Step 2: Verify Login OTP & Issue Authenticated Session
   */
  const verifyLoginOtp = async (email, otp) => {
    const res = await authApi.verifyLoginOtp({ email, otp });
    if (res.data?.success) {
      const { token: newToken, user: newUser } = res.data;
      if (newToken && newUser) {
        localStorage.setItem('securevault_token', newToken);
        localStorage.setItem('securevault_user', JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
      }
      return res.data;
    }
    throw new Error(res.data?.message || 'OTP verification failed');
  };

  /**
   * Step 1: Initiate New User Registration (Email OTP-Only)
   */
  const register = async (email, name = '') => {
    const res = await authApi.register({ email, name });
    if (res.data?.success) {
      return res.data; // { success: true, requireOtp: true, purpose: 'register', email }
    }
    throw new Error(res.data?.message || 'Registration failed');
  };

  /**
   * Step 2: Verify Registration OTP, Activate Account & Auto-Authenticate
   */
  const verifyRegisterOtp = async (email, otp) => {
    const res = await authApi.verifyRegisterOtp({ email, otp });
    if (res.data?.success) {
      const { token: newToken, user: newUser } = res.data;
      if (newToken && newUser) {
        localStorage.setItem('securevault_token', newToken);
        localStorage.setItem('securevault_user', JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
      }
      return res.data;
    }
    throw new Error(res.data?.message || 'Registration OTP verification failed');
  };

  /**
   * Resend OTP with cooldown support
   */
  const resendOtp = async (email, purpose) => {
    const res = await authApi.resendOtp({ email, purpose });
    if (res.data?.success) {
      return res.data;
    }
    throw new Error(res.data?.message || 'Failed to resend verification code');
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('securevault_token');
      localStorage.removeItem('securevault_user');
      setToken(null);
      setUser(null);
    }
  };

  const updateUser = (updatedUser) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedUser };
      localStorage.setItem('securevault_user', JSON.stringify(merged));
      return merged;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        login,
        verifyLoginOtp,
        register,
        verifyRegisterOtp,
        resendOtp,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
