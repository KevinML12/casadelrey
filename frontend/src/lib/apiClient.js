import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 5_000,
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
