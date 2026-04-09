import axios from 'axios';

// Get backend URL from environment
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
export const API_BASE_URL = `${BACKEND_URL}/api`;

/**
 * Create axios instance with authentication
 */
export const createAuthAxios = (token) => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });

  // Add response interceptor for token expiration
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401 && token) {
        // Token expired - clear auth and redirect
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

/**
 * Auth Services
 */
export const authService = {
  login: async (email, password) => {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
    return response.data;
  },

  register: async (email, password, name) => {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, { email, password, name });
    return response.data;
  },

  me: async (token) => {
    const response = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
};

/**
 * Shifts Services
 */
export const shiftsService = {
  getAll: async (authAxios, companyId, month, year) => {
    const response = await authAxios.get(`/shifts?company_id=${companyId}&month=${month}&year=${year}`);
    return response.data;
  },

  create: async (authAxios, shiftData) => {
    const response = await authAxios.post('/shifts', shiftData);
    return response.data;
  },

  update: async (authAxios, shiftId, shiftData) => {
    const response = await authAxios.put(`/shifts/${shiftId}`, shiftData);
    return response.data;
  },

  delete: async (authAxios, shiftId) => {
    const response = await authAxios.delete(`/shifts/${shiftId}`);
    return response.data;
  }
};

/**
 * Payroll Services
 */
export const payrollService = {
  calculate: async (authAxios, companyId, month, year) => {
    const response = await authAxios.get(`/calculate-payroll?company_id=${companyId}&month=${month}&year=${year}`);
    return response.data;
  }
};

/**
 * Stats Services
 */
export const statsService = {
  getMonthlyStats: async (authAxios, year, companyId) => {
    const response = await authAxios.get(`/stats/monthly/${year}?company_id=${companyId}`);
    return response.data;
  }
};

/**
 * Templates Services
 */
export const templatesService = {
  getAll: async (authAxios) => {
    const response = await authAxios.get('/templates');
    return response.data;
  },

  create: async (authAxios, templateData) => {
    const response = await authAxios.post('/templates', templateData);
    return response.data;
  },

  update: async (authAxios, templateId, templateData) => {
    const response = await authAxios.put(`/templates/${templateId}`, templateData);
    return response.data;
  },

  delete: async (authAxios, templateId) => {
    const response = await authAxios.delete(`/templates/${templateId}`);
    return response.data;
  }
};

/**
 * Settings Services
 */
export const settingsService = {
  get: async (authAxios) => {
    const response = await authAxios.get('/settings');
    return response.data;
  },

  update: async (authAxios, settingsData) => {
    const response = await authAxios.put('/settings', settingsData);
    return response.data;
  }
};

/**
 * Categories Services
 */
export const categoriesService = {
  getAll: async () => {
    const response = await axios.get(`${API_BASE_URL}/categories`);
    return response.data;
  }
};

/**
 * Holidays Services
 */
export const holidaysService = {
  get: async (authAxios, year) => {
    const response = await authAxios.get(`/holidays/${year}`);
    return response.data;
  },

  addLocal: async (authAxios, date, name) => {
    const response = await authAxios.post('/holidays/local', { date, name });
    return response.data;
  },

  deleteLocal: async (authAxios, date) => {
    const response = await authAxios.delete(`/holidays/local/${date}`);
    return response.data;
  }
};

/**
 * Companies Services
 */
export const companiesService = {
  getNames: async (authAxios) => {
    const response = await authAxios.get('/companies');
    return response.data;
  },

  updateName: async (authAxios, companyId, name) => {
    const response = await authAxios.put(`/companies/${companyId}`, { name });
    return response.data;
  }
};

export default {
  authService,
  shiftsService,
  payrollService,
  statsService,
  templatesService,
  settingsService,
  categoriesService,
  holidaysService,
  companiesService
};
