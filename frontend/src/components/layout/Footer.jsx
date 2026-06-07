import { Link } from 'react-router-dom';

const COLS = [
  {
    title: 'MINISTERIOS',
    links: [
      { label: 'Blog & Enseñanzas', to: '/blog' },
      { label: 'Eventos',           to: '/events' },
      { label: 'Galería',           to: '/gallery' },
      { label: 'Oración',           to: '/prayer' },
      { label: 'Voluntariado',      to: '/volunteering' },
    ],
  },
  {
    title: 'IGLESIA',
    links: [
      { label: 'Conócenos',         to: '/about' },
      { label: 'Donaciones',        to: '/donate' },
      { label: 'Ingresar',          to: '/login' },
    ],
  },
  {
    title: 'CONTACTO',
    links: [
      { label: '7a. calle 12-66, zona 4', to: '/about' },
      { label: 'Huehuetenango, Guatemala', to: '/about' },
      { label: 'Domingos · 10:00 AM',     to: '/about' },
      { label: 'Miércoles · 7:00 PM',     to: '/about' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-[var(--surf-low)] border-t border-[var(--outline-var)]">
      <div className="max-w-[1440px] mx-auto px-6 md:px-16 pt-12 pb-8">

        {/* Brand + columns grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-10 mb-10">

          {/* Brand */}
          <div>
            <img
              src="/logo.png"
              alt="Casa del Rey"
              className="h-10 w-auto object-contain mb-4 opacity-90"
            />
            <p className="text-[13px] text-[var(--on-surf-var)] leading-relaxed max-w-[260px]">
              Iglesia cristiana de restauración familiar en Huehuetenango, Guatemala.
            </p>
            <div className="flex gap-2 mt-5">
              <a href="https://instagram.com/ig.casadelrey" target="_blank" rel="noreferrer"
                className="w-9 h-9 rounded-full bg-[var(--surf-dim)] flex items-center justify-center text-[var(--on-surf-var)] hover:bg-[var(--pri)] hover:text-[var(--on-pri)] transition-colors">
                <span className="ms" style={{ fontSize: 18 }}>photo_camera</span>
              </a>
              <a href="#" target="_blank" rel="noreferrer"
                className="w-9 h-9 rounded-full bg-[var(--surf-dim)] flex items-center justify-center text-[var(--on-surf-var)] hover:bg-[var(--pri)] hover:text-[var(--on-pri)] transition-colors">
                <span className="ms" style={{ fontSize: 18 }}>play_circle</span>
              </a>
              <a href="#" target="_blank" rel="noreferrer"
                className="w-9 h-9 rounded-full bg-[var(--surf-dim)] flex items-center justify-center text-[var(--on-surf-var)] hover:bg-[var(--pri)] hover:text-[var(--on-pri)] transition-colors">
                <span className="ms" style={{ fontSize: 18 }}>thumb_up</span>
              </a>
            </div>
          </div>

          {/* Columns */}
          {COLS.map(col => (
            <div key={col.title}>
              <p className="text-[11px] font-semibold text-[var(--outline)] mb-4 tracking-[1.2px]">
                {col.title}
              </p>
              <ul className="space-y-3">
                {col.links.map(link => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-[13px] text-[var(--on-surf-var)] hover:text-[var(--on-surf)] transition-colors duration-150"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-6 border-t border-[var(--outline-var)]">
          <span className="text-[12px] text-[var(--outline)]">© 2026 Casa del Rey — Luz para las Naciones</span>
          <span className="text-[12px] text-[var(--outline)]">Huehuetenango, Guatemala</span>
        </div>
      </div>
    </footer>
  );
}
