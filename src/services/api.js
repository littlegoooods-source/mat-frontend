import axios from 'axios';

// Backend API URL
const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : import.meta.env.PROD 
    ? 'https://mat-backend-r9iw.onrender.com/api'  // Production backend
    : '/api';  // Development proxy

console.log('API Base URL:', API_BASE_URL, 'Mode:', import.meta.env.MODE);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// ==================== AUTH TOKEN MANAGEMENT ====================

// Get token from localStorage
const getToken = () => localStorage.getItem('accessToken');
const getRefreshToken = () => localStorage.getItem('refreshToken');

// Set tokens in localStorage
const setTokens = (accessToken, refreshToken) => {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
};

// Clear tokens
const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  localStorage.removeItem('organizations');
};

// Request interceptor - add auth header
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401 and refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle network errors
    if (!error.response) {
      console.error('Network Error:', error.message);
      if (error.message === 'Network Error') {
        console.error('Possible CORS issue or server unreachable');
      }
      return Promise.reject(error);
    }
    
    // Handle 401 - try to refresh token
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken
          });
          
          const { accessToken, refreshToken: newRefreshToken } = response.data;
          setTokens(accessToken, newRefreshToken);
          
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          clearTokens();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        clearTokens();
        window.location.href = '/login';
      }
    }
    
    const message = error.response?.data?.message || error.response?.data?.title || 'Произошла ошибка';
    console.error('API Error:', error.response.status, message);
    return Promise.reject(error);
  }
);

// ============ AUTH API ============
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout', { refreshToken: getRefreshToken() }),
  refresh: () => api.post('/auth/refresh', { refreshToken: getRefreshToken() }),
  me: () => api.get('/auth/me'),
  getOrganizations: () => api.get('/auth/organizations'),
  switchOrganization: (organizationId) => api.post('/auth/switch-organization', { organizationId }),
};

// ============ ORGANIZATIONS API ============
export const organizationsApi = {
  getAll: () => api.get('/organizations'),
  getById: (id) => api.get(`/organizations/${id}`),
  create: (data) => api.post('/organizations', data),
  update: (id, data) => api.put(`/organizations/${id}`, data),
  delete: (id) => api.delete(`/organizations/${id}`),
  regenerateCode: (id) => api.post(`/organizations/${id}/regenerate-code`),
  // Members
  getMembers: (id) => api.get(`/organizations/${id}/members`),
  removeMember: (orgId, memberId) => api.delete(`/organizations/${orgId}/members/${memberId}`),
  leave: (id) => api.post(`/organizations/${id}/leave`),
  transferOwnership: (id, newOwnerId) => api.post(`/organizations/${id}/transfer-ownership`, { newOwnerId }),
  // Invitations
  invite: (id, email) => api.post(`/organizations/${id}/invite`, { email }),
  getInvitations: (id) => api.get(`/organizations/${id}/invitations`),
};

// ============ INVITATIONS API ============
export const invitationsApi = {
  getMyInvitations: () => api.get('/invitations'),
  accept: (token) => api.post(`/invitations/${token}/accept`),
  reject: (token) => api.post(`/invitations/${token}/reject`),
  cancel: (id) => api.delete(`/invitations/${id}`),
};

// ============ MATERIALS ============
export const materialsApi = {
  getAll: (params) => api.get('/materials', { params }),
  getById: (id) => api.get(`/materials/${id}`),
  create: (data) => api.post('/materials', data),
  update: (id, data) => api.put(`/materials/${id}`, data),
  delete: (id) => api.delete(`/materials/${id}`),
  archive: (id) => api.post(`/materials/${id}/archive`),
  unarchive: (id) => api.post(`/materials/${id}/unarchive`),
  getCategories: () => api.get('/materials/categories'),
  getBalances: (includeZeroStock = false) => api.get('/materials/balances', { params: { includeZeroStock } }),
  getBalance: (id) => api.get(`/materials/${id}/balance`),
  getProductsUsing: (id) => api.get(`/materials/${id}/products`),
};

// ============ MATERIAL RECEIPTS ============
export const receiptsApi = {
  getAll: (params) => api.get('/materialreceipts', { params }),
  getById: (id) => api.get(`/materialreceipts/${id}`),
  create: (data) => api.post('/materialreceipts', data),
  update: (id, data) => api.put(`/materialreceipts/${id}`, data),
  delete: (id, force = false) => api.delete(`/materialreceipts/${id}`, { params: { force } }),
};

// ============ PRODUCTS (Recipes) ============
export const productsApi = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  copy: (id, data) => api.post(`/products/${id}/copy`, data),
  archive: (id) => api.post(`/products/${id}/archive`),
  unarchive: (id) => api.post(`/products/${id}/unarchive`),
  getCategories: () => api.get('/products/categories'),
  recalculateWeight: (id) => api.post(`/products/${id}/recalculate-weight`),
};

// ============ PRODUCTIONS ============
export const productionsApi = {
  getAll: (params) => api.get('/productions', { params }),
  getById: (id) => api.get(`/productions/${id}`),
  checkAvailability: (productId, quantity) => 
    api.get('/productions/check-availability', { params: { productId, quantity } }),
  create: (data) => api.post('/productions', data),
  cancel: (id) => api.post(`/productions/${id}/cancel`),
  delete: (id) => api.delete(`/productions/${id}`),
};

// ============ FINISHED PRODUCTS ============
export const finishedProductsApi = {
  getAll: (params) => api.get('/finishedproducts', { params }),
  getById: (id) => api.get(`/finishedproducts/${id}`),
  sell: (id, data) => api.post(`/finishedproducts/${id}/sell`, data),
  writeOff: (id, data) => api.post(`/finishedproducts/${id}/write-off`, data),
  returnToStock: (id) => api.post(`/finishedproducts/${id}/return-to-stock`),
  update: (id, data) => api.put(`/finishedproducts/${id}`, data),
  getSummary: () => api.get('/finishedproducts/summary'),
  getStatuses: () => api.get('/finishedproducts/statuses'),
};

// ============ REPORTS ============
export const reportsApi = {
  getDashboard: () => api.get('/reports/dashboard'),
  getMaterialMovement: (materialId, params) => 
    api.get(`/reports/material-movement/${materialId}`, { params }),
  getProduction: (params) => api.get('/reports/production', { params }),
  getSales: (params) => api.get('/reports/sales', { params }),
  getFinancialSummary: (params) => api.get('/reports/financial-summary', { params }),
};

// ============ HISTORY ============
export const historyApi = {
  getAll: (params) => api.get('/history', { params }),
  getRecent: (count = 10) => api.get('/history/recent', { params: { count } }),
};

// Export helper functions
export { getToken, setTokens, clearTokens };

export default api;
