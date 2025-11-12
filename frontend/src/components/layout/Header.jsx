import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import Button from '../ui/Button';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

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
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <NavLink to="/" className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-blue-600">
              Casa del Rey
            </div>
          </NavLink>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors hover:text-blue-600 ${
                    isActive ? 'text-blue-600' : 'text-gray-700'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}
            <Button
              variant="primary"
              onClick={handleMemberAreaClick}
              className="ml-4"
            >
              Área de Miembros
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={({ isActive }) =>
                    `text-sm font-medium transition-colors hover:text-blue-600 ${
                      isActive ? 'text-blue-600' : 'text-gray-700'
                    }`
                  }
                >
                  {link.name}
                </NavLink>
              ))}
              <Button
                variant="primary"
                onClick={() => {
                  handleMemberAreaClick();
                  setIsMenuOpen(false);
                }}
                className="w-full"
              >
                Área de Miembros
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
