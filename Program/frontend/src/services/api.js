import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('securevault_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle session expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect on login, register, or OTP endpoints
      const isAuthUrl =
        error.config.url.includes('/auth/login') ||
        error.config.url.includes('/auth/register') ||
        error.config.url.includes('/auth/verify-') ||
        error.config.url.includes('/auth/resend-otp');
      if (!isAuthUrl) {
        localStorage.removeItem('securevault_token');
        localStorage.removeItem('securevault_user');
        if (
          window.location.pathname !== '/login' &&
          window.location.pathname !== '/register' &&
          window.location.pathname !== '/verify-otp'
        ) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authApi = {
  register: (userData) => api.post('/auth/register', userData),
  verifyRegisterOtp: (data) => api.post('/auth/verify-register-otp', data),
  login: (credentials) => api.post('/auth/login', credentials),
  verifyLoginOtp: (data) => api.post('/auth/verify-login-otp', data),
  resendOtp: (data) => api.post('/auth/resend-otp', data),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// Credential endpoints
export const credentialApi = {
  getAll: (params) => api.get('/credentials', { params }),
  getById: (id) => api.get(`/credentials/${id}`),
  create: (data) => api.post('/credentials', data),
  update: (id, data) => api.patch(`/credentials/${id}`, data),
  toggleFavorite: (id) => api.patch(`/credentials/${id}/favorite`),
  delete: (id) => api.delete(`/credentials/${id}`),
  getStats: () => api.get('/credentials/stats'),
  getSecurityAnalysis: () => api.get('/credentials/security-analysis'),
};

// User/Settings endpoints
export const userApi = {
  updateProfile: (data) => api.patch('/users/profile', data),
  changePassword: (data) => api.patch('/users/change-password', data),
};

export default api;
