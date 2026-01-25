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

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors
    if (!error.response) {
      console.error('Network Error:', error.message);
      if (error.message === 'Network Error') {
        console.error('Possible CORS issue or server unreachable');
      }
    } else {
      const message = error.response?.data?.message || error.response?.data?.title || 'Произошла ошибка';
      console.error('API Error:', error.response.status, message);
    }
    return Promise.reject(error);
  }
);

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

export default api;
