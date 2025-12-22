import { createBrowserRouter } from 'react-router-dom';
import App from './App';

// Layouts y Wrappers
import ProtectedRoute from './components/layout/ProtectedRoute';

// Páginas Públicas
import Home from './pages/public/Home';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import BlogPage from './pages/public/BlogPage';
import EventsPage from './pages/public/EventsPage';
// CRÍTICO: Usaremos PrayerPage y DonatePage para cargar los componentes del formulario MVP
import PrayerPage from './pages/public/PrayerPage'; 
import DonatePage from './pages/public/DonatePage'; 
import VolunteeringPage from './pages/public/VolunteeringPage';
import AboutPage from './pages/public/AboutPage';
import NotFound from './pages/NotFound';
import ForgotPassword from './pages/public/ForgotPassword';
import ResetPassword from './pages/public/ResetPassword';
import PaymentSuccess from './pages/public/PaymentSuccess';

// Páginas de Administración
import Dashboard from './pages/admin/Dashboard';
import AdminBlog from './pages/admin/AdminBlog';
import AdminEvents from './pages/admin/AdminEvents';
import AdminPetitions from './pages/admin/AdminPetitions';
import Profile from './pages/admin/Profile';

export const router = createBrowserRouter([
    {
        path: '/',
        element: <App />,
        errorElement: <NotFound />,
        children: [
            {
                index: true,
                element: <Home />,
            },
            // --- Rutas Públicas y de Auth ---
            { path: 'login', element: <Login /> },
            { path: 'register', element: <Register /> },
            { path: 'forgot-password', element: <ForgotPassword /> },
            { path: 'reset-password/:token', element: <ResetPassword /> },
            { path: 'blog', element: <BlogPage /> },
            { path: 'blog/:slug', element: <div>Post Detail (Próximamente)</div> },
            { path: 'events', element: <EventsPage /> },
            { path: 'events/:id', element: <div>Event Detail (Próximamente)</div> },

            // CRÍTICO: Rutas del MVP - Peticiones y Donaciones (Usando las páginas existentes)
            // Estas páginas deben contener el código del formulario PrayerFormPage/DonationFormPage
            { path: 'prayer', element: <PrayerPage /> },
            { path: 'donate', element: <DonatePage /> },
            
            { path: 'payment-success', element: <PaymentSuccess /> },
            { path: 'volunteering', element: <VolunteeringPage /> },
            { path: 'about', element: <AboutPage /> },

            // =================================================================
            // CRÍTICO: GRUPO DE RUTAS DE ADMINISTRACIÓN (Protegidas)
            // Agrupamos todas las rutas admin bajo el prefijo 'admin/' y usamos ProtectedRoute.
            // Esto corrige el error de 'dashboard' y 'profile' que estaban fuera del prefijo 'admin'.
            // =================================================================
            {
                path: 'admin',
                children: [
                    {
                        // /admin/dashboard - Usamos index para la raíz de /admin
                        index: true, 
                        element: (
                            <ProtectedRoute adminOnly={true}>
                                <Dashboard />
                            </ProtectedRoute>
                        ),
                    },
                    {
                        path: 'blog',
                        element: (
                            <ProtectedRoute adminOnly={true}>
                                <AdminBlog />
                            </ProtectedRoute>
                        ),
                    },
                    {
                        path: 'events',
                        element: (
                            <ProtectedRoute adminOnly={true}>
                                <AdminEvents />
                            </ProtectedRoute>
                        ),
                    },
                    {
                        path: 'petitions',
                        element: (
                            <ProtectedRoute adminOnly={true}>
                                <AdminPetitions />
                            </ProtectedRoute>
                        ),
                    },
                    {
                        path: 'profile',
                        element: (
                            <ProtectedRoute adminOnly={true}>
                                <Profile />
                            </ProtectedRoute>
                        ),
                    },
                ],
            },
            
            // Re-mapear rutas sueltas del original
            // Mueve las rutas dashboard y profile sueltas a /admin/dashboard y /admin/profile.
            // La ruta original 'dashboard' ahora es 'admin/dashboard'
            // La ruta original 'profile' ahora es 'admin/profile'
            
            {
                path: '*',
                element: <NotFound />,
            },
        ],
    },
]);