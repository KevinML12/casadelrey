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

// Limpia el token si el servidor responde 401
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
    }
    return Promise.reject(err);
  },
);

export default apiClient;
