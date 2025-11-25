import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  HomeIcon, 
  UserIcon, 
  CurrencyDollarIcon, 
  UserGroupIcon, 
  ArrowRightOnRectangleIcon 
} from '@heroicons/react/24/outline';

const Sidebar = () => {
  const { user, logout } = useAuth();

  const menuItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: HomeIcon },
    { name: 'Mi Perfil', path: '/admin/perfil', icon: UserIcon },
    { name: 'Mis Donaciones', path: '/admin/historial', icon: CurrencyDollarIcon },
    { name: 'Mis Grupos', path: '/admin/grupos', icon: UserGroupIcon },
  ];

  return (
    <div className="w-64 min-h-screen bg-dark-text text-white flex flex-col transition-colors">
      {/* Logo */}
      <div className="p-6 border-b border-gray-700 transition-colors">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-accent-blue flex items-center justify-center">
            <span className="text-xl font-black">CR</span>
          </div>
          <span className="text-lg font-black uppercase tracking-tight">Casa del Rey</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 p-4 transition-colors duration-200 ${
                  isActive
                    ? 'bg-accent-blue text-white font-black'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800 font-bold'
                }`
              }
            >
              <Icon className="w-6 h-6" />
              <span className="text-sm uppercase tracking-wide">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-gray-700">
        {/* User Email */}
        <div className="mb-4 px-4">
          <p className="text-xs text-gray-500 mb-2 font-black uppercase tracking-widest">Conectado como:</p>
          <p className="text-sm text-white truncate font-bold">
            {user?.email || 'usuario@ejemplo.com'}
          </p>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="w-full flex items-center space-x-3 p-4 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors duration-200"
        >
          <ArrowRightOnRectangleIcon className="w-6 h-6" />
          <span className="font-bold text-sm uppercase tracking-wide">Salir</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
