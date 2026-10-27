import axios from 'axios';

// Base URL del backend. Debe terminar en /api/v1 para que las rutas coincidan.
const raw = (import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:8080')).replace(/\/+$/, '');
const BASE_URL = raw.endsWith('/api/v1') ? raw : raw.endsWith('/api') ? `${raw}/v1` : `${raw}/api/v1`;
const configuredTimeout = Number(import.meta.env.VITE_API_TIMEOUT_MS);
const timeout = Number.isInteger(configuredTimeout) && configuredTimeout >= 1000 && configuredTimeout <= 90000
  ? configuredTimeout : 15000;

const apiClient = axios.create({
  baseURL: BASE_URL,
  // El entorno gratuito de pruebas puede necesitar más tiempo para despertar.
  timeout,
  headers: { 'Content-Type': 'application/json' },
});

// Agrega el token JWT a cada request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  else delete config.headers.Authorization;
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
  (res) => {
    // A misconfigured SPA rewrite can return index.html with HTTP 200.
    // Reject that response before a feed tries to render HTML as an array.
    if (!res.config.responseType && typeof res.data === 'string' && /^\s*</.test(res.data)) {
      return Promise.reject(new Error('La API devolvió una respuesta inválida.'));
    }
    return res;
  },
  async (err) => {
    const originalRequest = err.config;

    if (err.response?.status === 401 && originalRequest && !originalRequest._retry && !originalRequest.url?.startsWith('/auth/')) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          originalRequest._retry = true;
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
          if (localStorage.getItem('refresh_token') !== refreshToken) {
            throw new Error('La sesión cambió durante la renovación');
          }
          
          localStorage.setItem('token', token);
          localStorage.setItem('refresh_token', newRefreshToken);
          
          window.dispatchEvent(new Event('auth:refreshed'));
          originalRequest.headers.Authorization = 'Bearer ' + token;
          
          processQueue(null, token);
          return apiClient(originalRequest);
        } catch (refreshErr) {
          processQueue(refreshErr, null);
          if (localStorage.getItem('refresh_token') !== refreshToken) return Promise.reject(refreshErr);
          delete apiClient.defaults.headers.common.Authorization;
          localStorage.removeItem('token');
          localStorage.removeItem('refresh_token');
          window.dispatchEvent(new Event('auth:unauthorized'));
          return Promise.reject(refreshErr);
        } finally {
          isRefreshing = false;
        }
      } else {
        isRefreshing = false;
        delete apiClient.defaults.headers.common.Authorization;
          localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }

    return Promise.reject(err);
  },
);

export default apiClient;
