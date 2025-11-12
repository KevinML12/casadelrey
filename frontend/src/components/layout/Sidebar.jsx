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
    <div className="w-64 min-h-screen bg-gray-800 text-white flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-xl font-bold">CR</span>
          </div>
          <span className="text-lg font-bold">Casa del Rey</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 p-3 rounded-lg transition duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-300 hover:bg-gray-700'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-gray-700">
        {/* User Email */}
        <div className="mb-3 px-3">
          <p className="text-xs text-gray-400 mb-1">Conectado como:</p>
          <p className="text-sm text-white truncate font-medium">
            {user?.email || 'usuario@ejemplo.com'}
          </p>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="w-full flex items-center space-x-3 p-3 rounded-lg text-gray-300 hover:bg-gray-700 transition duration-200"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          <span className="font-medium">Salir</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
