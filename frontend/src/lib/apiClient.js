import axios from 'axios';

// Base URL del backend. Debe terminar en /api/v1 para que las rutas coincidan.
const raw = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const BASE_URL = raw.endsWith('/api/v1') ? raw : raw.replace(/\/?$/, '') + '/api/v1';

const apiClient = axios.create({
  baseURL: BASE_URL,
  // Railway free tier tiene cold starts que pueden tardar hasta 10-15 segundos
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

// Agrega el token JWT a cada request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;

    if (err.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = 'Bearer ' + token;
          return apiClient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;
      
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post(`${BASE_URL}/auth/refresh`, { refresh_token: refreshToken });
          const { token, refresh_token: newRefreshToken } = res.data;
          
          localStorage.setItem('token', token);
          localStorage.setItem('refresh_token', newRefreshToken);
          
          apiClient.defaults.headers.common.Authorization = 'Bearer ' + token;
          originalRequest.headers.Authorization = 'Bearer ' + token;
          
          processQueue(null, token);
          return apiClient(originalRequest);
        } catch (refreshErr) {
          processQueue(refreshErr, null);
          localStorage.removeItem('token');
          localStorage.removeItem('refresh_token');
          window.dispatchEvent(new Event('auth:unauthorized'));
          return Promise.reject(refreshErr);
        } finally {
          isRefreshing = false;
        }
      } else {
        isRefreshing = false;
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }

    return Promise.reject(err);
  },
);

export default apiClient;
