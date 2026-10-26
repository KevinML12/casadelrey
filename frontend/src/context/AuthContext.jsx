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
  const saveToken = (t, rT) => { 
    localStorage.setItem('token', t); 
    if (rT) localStorage.setItem('refresh_token', rT);
    setToken(t); 
  };
  const clearToken = () => { 
    localStorage.removeItem('token'); 
    localStorage.removeItem('refresh_token');
    delete apiClient.defaults.headers.common.Authorization;
    setToken(null); 
  };

  // apiClient dispara este evento en un 401 — ya limpió localStorage,
  // pero el estado de React (token/user) necesita enterarse también.
  useEffect(() => {
    const onUnauthorized = () => setToken(null);
    const onRefreshed = () => setToken(localStorage.getItem('token'));
    window.addEventListener('auth:unauthorized', onUnauthorized);
    window.addEventListener('auth:refreshed', onRefreshed);
    return () => {
      window.removeEventListener('auth:unauthorized', onUnauthorized);
      window.removeEventListener('auth:refreshed', onRefreshed);
    };
  }, []);

  // ── Auth actions ─────────────────────────────────────────────

  const login = (newToken, newRefreshToken = null) => saveToken(newToken, newRefreshToken);

  const logout = () => clearToken();

  const register = async (email, password, name) => {
    try {
      await apiClient.post('/auth/register', { email, password, name });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Error al registrarse';
      return { success: false, error: msg };
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
      await apiClient.post('/auth/reset-password', { token: resetToken, newPassword: password });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || err.response?.data?.message || 'Error al restablecer la contraseña' };
    }
  };

  return (
    <AuthContext.Provider value={{
      token,
      user,
      loading,
      isAuthenticated: !!token,
      isAdmin:         user?.role === 'admin',
      isLeader:        user?.role === 'leader' || user?.role === 'admin',
      isVolunteer:     user?.role === 'volunteer',
      canAccessPanel:  user?.role === 'admin' || user?.role === 'leader',
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
