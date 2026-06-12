import { Outlet } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

// Public shell — Liquid Glass Light: lienzo blanco luminoso para que
// el cristal del navbar y de las tarjetas refracte correctamente.
export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-bg text-ink">
      <Header />
      <main className="flex-1 w-full">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
