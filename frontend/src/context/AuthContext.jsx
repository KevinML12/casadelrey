import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import apiClient from '../lib/apiClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const user = (() => {
    if (!token) return null;
    try { return jwtDecode(token); } catch { return null; }
  })();

  useEffect(() => { setLoading(false); }, []);

  // ── Guardar / limpiar token ──────────────────────────────────
  const saveToken = (t) => { localStorage.setItem('token', t); setToken(t); };
  const clearToken = () => { localStorage.removeItem('token'); setToken(null); };

  // ── Auth actions ─────────────────────────────────────────────

  const login = (newToken) => saveToken(newToken);

  const logout = () => clearToken();

  const register = async (email, password, name) => {
    try {
      const res = await apiClient.post('/auth/register', { email, password, name });
      if (res.data?.token) saveToken(res.data.token);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Error al registrarse' };
    }
  };

  const forgotPassword = async (email) => {
    try {
      await apiClient.post('/auth/forgot-password', { email });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Error al enviar el correo' };
    }
  };

  const resetPassword = async (resetToken, password) => {
    try {
      await apiClient.post('/auth/reset-password', { token: resetToken, password });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Error al restablecer la contraseña' };
    }
  };

  return (
    <AuthContext.Provider value={{
      token,
      user,
      loading,
      isAuthenticated: !!token,
      isAdmin: user?.role === 'admin',
      login,
      logout,
      register,
      forgotPassword,
      resetPassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
};
