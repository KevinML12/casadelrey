import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Bars3Icon, XMarkIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import Button from '../ui/Button';
import { useSiteConfig } from '../../context/SiteConfigContext';
import { useTheme } from '../../contexts/ThemeProvider';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { config, isLoading } = useSiteConfig();
  const { theme, toggleTheme } = useTheme();

  const navLinks = [
    { name: 'Inicio', path: '/' },
    { name: 'Historia', path: '/historia' },
    { name: 'Eventos', path: '/eventos' },
    { name: 'Donaciones', path: '/donaciones' }
  ];

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleMemberAreaClick = () => {
    navigate('/login');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md transition-colors border-b border-gray-200/50 dark:border-gray-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo - Rivian style */}
          <NavLink to="/" className="flex items-center gap-3 group">
            {isLoading ? (
              <div className="h-8 w-40 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
            ) : (
              <>
                {config.logo_url && (
                  <img 
                    src={config.logo_url} 
                    alt={config.church_name || 'Casa del Rey'}
                    className="h-10 w-10 object-contain group-hover:scale-110 transition-transform"
                  />
                )}
                <div className="text-sm font-display font-bold text-dark-text dark:text-white tracking-wide transition-colors uppercase letter-spacing-tight">
                  {config.church_name || 'CASA DEL REY'}
                </div>
              </>
            )}
          </NavLink>

          {/* Desktop Navigation - Clean Rivian style */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `text-xs font-semibold uppercase tracking-widest px-4 py-2 transition-all rounded-lg ${
                    isActive 
                      ? 'text-accent-blue bg-accent-blue/10' 
                      : 'text-dark-text/70 dark:text-gray-300 hover:text-dark-text dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 text-dark-text/60 dark:text-gray-400 hover:text-dark-text dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </button>
            
            {/* Login Button - Minimal Rivian */}
            <button
              onClick={handleMemberAreaClick}
              className="hidden sm:block px-5 py-2 text-xs font-semibold uppercase tracking-widest text-dark-text dark:text-white border border-dark-text/20 dark:border-gray-600 hover:border-accent-blue dark:hover:border-accent-blue rounded-lg hover:bg-accent-blue/5 transition-all"
            >
              LOGIN
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMenu}
              className="md:hidden p-2.5 text-dark-text dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200/50 dark:border-gray-800/50 py-4 space-y-2 animate-in fade-in slide-in-from-top-2">
            <nav className="flex flex-col space-y-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={({ isActive }) =>
                    `text-xs font-semibold uppercase tracking-widest px-4 py-2.5 rounded-lg transition-all ${
                      isActive 
                        ? 'text-accent-blue bg-accent-blue/10' 
                        : 'text-dark-text/70 dark:text-gray-300'
                    }`
                  }
                >
                  {link.name}
                </NavLink>
              ))}
              <button
                onClick={() => {
                  handleMemberAreaClick();
                  setIsMenuOpen(false);
                }}
                className="w-full px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-dark-text dark:text-white border border-dark-text/20 dark:border-gray-600 rounded-lg hover:bg-accent-blue/5 transition-all mt-2"
              >
                LOGIN
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
