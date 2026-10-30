import { NavLink } from 'react-router-dom';

export default function CellAdminNav() {
  return <nav aria-label="Administrar células" className="flex flex-wrap gap-2 border-b border-bg/10 pb-4">
    {[
      ['/admin/cells', 'Células'], ['/admin/cell-categories', 'Categorías y fotos'],
      ['/admin/leaders', 'Directorio de líderes'],
    ].map(([to, label]) => <NavLink key={to} to={to} className={({ isActive }) => `focus-ring inline-flex min-h-11 items-center rounded-[10px] px-4 text-13 font-bold transition-colors ${isActive ? 'bg-bg text-white' : 'bg-white/50 text-bg/65 hover:bg-white'}`}>{label}</NavLink>)}
  </nav>;
}
