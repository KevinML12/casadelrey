import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';

const AdminLayout = () => {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 bg-gray-100 p-8">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;