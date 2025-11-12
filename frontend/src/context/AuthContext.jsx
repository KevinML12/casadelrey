import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay un usuario autenticado en localStorage al cargar
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
    setIsLoading(false);
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      // Llamada al backend API
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al iniciar sesión');
      }

      const data = await response.json();
      
      // Guardar en estado
      setUser(data.user);
      setToken(data.token);
      
      // Guardar en localStorage
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
      
      setIsLoading(false);
      return { success: true };
    } catch (error) {
      setIsLoading(false);
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const register = async (email, password, name) => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/auth/register', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ email, password, name })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al registrarse');
      }

      const data = await response.json();
      setIsLoading(false);
      return { success: true, data };
    } catch (error) {
      setIsLoading(false);
      console.error('Register error:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    token,
    isLoading,
    login,
    logout,
    register,
    isAuthenticated: !!user && !!token,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export default AuthContext;
