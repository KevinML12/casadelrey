import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  UserIcon, 
  CurrencyDollarIcon, 
  UserGroupIcon, 
  ArrowRightOnRectangleIcon 
} from '@heroicons/react/24/outline';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: HomeIcon },
    { name: 'Mi Perfil', path: '/admin/profile', icon: UserIcon },
    { name: 'Mis Donaciones', path: '/admin/donations', icon: CurrencyDollarIcon },
    { name: 'Mis Grupos', path: '/admin/groups', icon: UserGroupIcon },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="w-64 min-h-screen bg-gray-800 text-white p-4">
      {/* Logo Placeholder */}
      <div className="mb-8 p-4">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-xl font-bold">CR</span>
          </div>
          <span className="text-lg font-bold">Casa del Rey</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 p-3 rounded-lg transition duration-200 ${
                isActive(item.path)
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}

        {/* Separador */}
        <div className="border-t border-gray-700 my-4"></div>

        {/* Salir */}
        <Link
          to="/login"
          className="flex items-center space-x-3 p-3 rounded-lg text-gray-300 hover:bg-gray-700 transition duration-200"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          <span>Salir</span>
        </Link>
      </nav>
    </div>
  );
};

export default Sidebar;
