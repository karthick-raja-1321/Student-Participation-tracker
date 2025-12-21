import axios from 'axios';
import { toast } from 'react-toastify';

// Determine API URL based on environment
const getApiUrl = () => {
  // Prefer explicit VITE_API_URL, but avoid localhost in production
  const explicit = import.meta.env.VITE_API_URL;
  if (explicit) {
    try {
      const u = new URL(explicit);
      const isLocalTarget = ['localhost', '127.0.0.1'].includes(u.hostname);
      const isLocalHost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
      if (isLocalTarget && !isLocalHost) {
        // Ignore localhost target when not running on localhost
        // fall through to production default below
      } else {
        return explicit.endsWith('/api') ? explicit : `${explicit}/api`;
      }
    } catch {
      // If explicit is not a valid URL, ignore and fall through
    }
  }

  // For localhost development, use local backend
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:5000/api';
  }

  // For production (Netlify), use Render backend
  return 'https://student-participation-tracker.onrender.com/api';
};

const apiUrl = getApiUrl();
console.log('API URL:', apiUrl); // Debug log to verify URL

const api = axios.create({
  baseURL: apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');
      
      // If no refresh token, logout and redirect
      if (!refreshToken) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(
          `${apiUrl}/auth/refresh-token`,
          { refreshToken }
        );

        const { token } = response.data.data;
        localStorage.setItem('token', token);

        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token failed, logout user
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Don't show error toast for 401 errors (handled above)
    if (error.response?.status !== 401) {
      const message = error.response?.data?.message || 'An error occurred';
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default api;
