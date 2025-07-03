// API Configuration
const API_CONFIG = {
  development: {
    baseURL: 'http://localhost:5000/api'
  },
  production: {
    baseURL: 'https://your-railway-app.up.railway.app/api' // Замените на ваш Railway URL
  }
};

const currentConfig = API_CONFIG[process.env.NODE_ENV] || API_CONFIG.development;

export const API_BASE_URL = currentConfig.baseURL;

// Axios instance
import axios from 'axios';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor для добавления токена
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor для обработки ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;