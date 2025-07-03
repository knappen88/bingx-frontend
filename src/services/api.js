import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Обновите authAPI - добавьте register:
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData), // Старый (для админов)
  registerPublic: (userData) => api.post('/auth/register-public', userData), // Новый (публичный)
  getCurrentUser: () => api.get('/auth/me')
};

// BingX API
export const bingxAPI = {
  saveData: (data) => api.post('/bingx/data', data),
  getData: () => api.get('/bingx/data'),
  getAllData: () => api.get('/bingx/all-data')
};

// VIP API
export const vipAPI = {
  addMember: (memberData) => api.post('/vip/members', memberData),
  getMembers: () => api.get('/vip/members'),
  deleteMember: (id) => api.delete(`/vip/members/${id}`),
  getAllMembers: () => api.get('/vip/all-members'),
  getPlans: () => api.get('/vip/plans')
};

// Trading API
export const tradingAPI = {
  setDeposit: (initialDeposit) => api.post('/trading/deposit', { initialDeposit }),
  addOperation: (operationData) => api.post('/trading/operations', operationData),
  getAccount: () => api.get('/trading/account'),
  deleteOperation: (id) => api.delete(`/trading/operations/${id}`),
  getAllData: () => api.get('/trading/all-data')
};

// Admin API
export const adminAPI = {
  // Получить всю статистику
  getAllStats: async () => {
    const [bingxData, vipData, tradingData] = await Promise.all([
      bingxAPI.getAllData(),
      vipAPI.getAllMembers(), 
      tradingAPI.getAllData()
    ]);
    
    return {
      bingx: bingxData.data,
      vip: vipData.data,
      trading: tradingData.data
    };
  },
  
  // Получить всех пользователей
  getAllUsers: () => api.get('/auth/users') // Этот endpoint нужно создать
};

export const trafferAPI = {
  savePlatforms: (platforms) => api.post('/traffer/platforms', { selectedPlatforms: platforms }),
  getActivity: () => api.get('/traffer/activity'),
  addDailyReport: (reportData) => api.post('/traffer/daily-report', reportData),
  getAllData: () => api.get('/traffer/all-data')
};

export default api;