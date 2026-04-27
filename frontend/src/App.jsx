import { Outlet } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

// Shell público: Header + contenido animado + Footer.
// Solo se usa para rutas públicas. El panel admin tiene su propio layout.
export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-surf text-on-surf">
      <Header />
      <main className="flex-1 w-full">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
