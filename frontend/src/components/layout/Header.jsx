import { Menu, X, Moon, Sun, User, LogOut, Settings, LayoutDashboard } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDarkMode } from '../../hooks/useDarkMode';
import Button from '../ui/Button';

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const { isDark, toggle: toggleDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const publicLinks = [
    { label: 'Inicio', path: '/' },
    { label: 'Conócenos', path: '/about' },
    { label: 'Blog', path: '/blog' },
    { label: 'Eventos', path: '/events' },
    { label: 'Oración', path: '/prayer' },
    { label: 'Donaciones', path: '/donate' },
  ];

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;
  
  const headerBgClass = "bg-white/50 dark:bg-dark-bg/50 backdrop-blur-lg border-b border-gray-200/30 dark:border-white/5 shadow-sm hover:bg-white/90 dark:hover:bg-dark-bg/80 transition-colors duration-300";

  return (
    <header className={`${headerBgClass} sticky top-0 z-50 font-sans`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold text-primary dark:text-white transition-colors">
            Casa del Rey
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            {publicLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors duration-200 rounded-lg h-9 flex items-center px-4 ${
                  isActive(link.path)
                    ? 'text-primary dark:text-white bg-primary/10 dark:bg-white/10'
                    : 'text-text-secondary dark:text-dark-text-secondary hover:text-primary dark:hover:text-white hover:bg-primary/5 dark:hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* User/Admin Menu Dropdown */}
            {isAuthenticated && (
              <div className="relative ml-4" onMouseLeave={() => setUserMenuOpen(false)}>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="rounded-full !p-2 h-10 w-10"
                    onMouseEnter={() => setUserMenuOpen(true)}
                >
                    <User size={20} />
                </Button>
                
                {userMenuOpen && (
                    <div 
                      className="absolute right-0 mt-2 w-56 bg-white dark:bg-dark-card-bg rounded-lg shadow-lg py-2 z-50 border border-gray-200/50 dark:border-white/10"
                      onMouseLeave={() => setUserMenuOpen(false)}
                    >
                        <div className="px-4 py-2 border-b border-gray-200/50 dark:border-white/10">
                            <p className="text-sm font-semibold text-text-primary dark:text-dark-text-primary">{user?.name || 'Usuario'}</p>
                            <p className="text-xs text-text-secondary dark:text-dark-text-secondary truncate">{user?.email}</p>
                        </div>
                        <div className="py-1">
                          <Link
                              to="/profile"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-text-secondary dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-white/5"
                          >
                              <Settings size={16} /> Mi Perfil
                          </Link>
                          {user?.role === 'admin' && (
                            <Link
                                to="/dashboard"
                                onClick={() => setUserMenuOpen(false)}
                                className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-text-secondary dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-white/5"
                            >
                                <LayoutDashboard size={16} /> Dashboard
                            </Link>
                          )}
                        </div>
                        <div className="py-1 border-t border-gray-200/50 dark:border-white/10">
                          <button
                              onClick={handleLogout}
                              className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-500/10"
                          >
                              <LogOut size={16} /> Cerrar Sesión
                          </button>
                        </div>
                    </div>
                )}
              </div>
            )}

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 ml-2 rounded-full text-text-secondary dark:text-dark-text-secondary hover:bg-primary/10 dark:hover:bg-white/10 transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
             <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full text-text-secondary dark:text-dark-text-secondary"
              aria-label="Toggle dark mode"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              className="p-2 text-text-primary dark:text-dark-text-primary"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden pb-4 pt-2 border-t border-gray-200/50 dark:border-white/10">
            <div className="flex flex-col gap-1 py-2">
              {publicLinks.map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg font-medium ${
                    isActive(link.path)
                      ? 'bg-primary/10 text-primary'
                      : 'text-text-secondary hover:bg-primary/5 hover:text-primary'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {isAuthenticated && user?.role === 'admin' && (
                 <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-4 py-3 rounded-lg font-medium ${
                      isActive('/dashboard')
                        ? 'bg-primary/10 text-primary'
                        : 'text-text-secondary hover:bg-primary/5 hover:text-primary'
                    }`}
                  >
                    Dashboard
                  </Link>
              )}

              <div className="border-t border-gray-200/50 dark:border-white/10 mt-2 pt-2">
                {isAuthenticated ? (
                  <>
                    <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-text-secondary hover:bg-primary/5 hover:text-primary">
                      <Settings size={18} /> Mi Perfil
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 text-left mt-1 px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-lg font-medium"
                    >
                      <LogOut size={18} /> Cerrar Sesión
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}