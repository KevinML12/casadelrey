import { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';
import { Icon } from '../../components/ui/Glass';

const TYPE_LABELS = {
  hombres: { label: 'Hombres',   icon: 'man',     bg: 'bg-bg',      text: 'text-white' },
  mujeres: { label: 'Mujeres',   icon: 'woman',   bg: 'bg-rose',    text: 'text-white' },
  jovenes: { label: 'Jóvenes',   icon: 'school',  bg: 'bg-celeste', text: 'text-white' },
  prejus:  { label: 'Pre-jus',   icon: 'groups',  bg: 'bg-amber',   text: 'text-white' },
  ninos:   { label: 'Niños',     icon: 'child_care', bg: 'bg-emerald', text: 'text-white' },
};

export default function LeaderCellDirectory() {
  const [cells, setCells]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/leader/cell-directory')
      .then(r => setCells(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-sec-con flex items-center justify-center shrink-0">
          <Icon name="contacts" className="w-[22px] h-[22px] text-on-sec-con" stroke={1.8} />
        </div>
        <div>
          <h1 className="text-headline-s text-bg font-black leading-tight">Directorio de Células</h1>
          <p className="text-body-s text-bg/50 mt-0.5">Tu célula asignada</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-bg/10 border-t-pri animate-spin" />
        </div>
      ) : cells.length === 0 ? (
        <div className="glass-light rounded-[24px] card-spring flex flex-col items-center py-20 gap-4 text-bg/50">
          <Icon name="contacts" className="w-[48px] h-[48px]" stroke={1.8} />
          <p className="text-body-l text-bg font-medium">Sin células asignadas</p>
        </div>
      ) : (
        <div className="space-y-4">
          {cells.map(cell => {
            const typeInfo = TYPE_LABELS[cell.cell_type] || { label: cell.cell_type, icon: 'groups', bg: 'bg-bg/8', text: 'text-bg' };
            return (
              <div key={cell.id} className="glass-light rounded-[24px] card-spring p-5">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${typeInfo.bg}`}>
                    <Icon name={typeInfo.icon} className={`w-[22px] h-[22px] ${typeInfo.text}`} stroke={1.8} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-title-s text-bg font-bold">{cell.cell_code}</span>
                      <span className="text-label-s text-bg/50 px-2 py-0.5 rounded-full bg-bg/8">{typeInfo.label}</span>
                    </div>
                    <p className="text-body-s text-bg/50">{cell.member_count} miembro{cell.member_count !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="space-y-2 text-body-s text-bg/50">
                  <div className="flex items-center gap-2">
                    <Icon name="person" className="w-[16px] h-[16px]" stroke={1.8} />
                    <span className="text-bg">{cell.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon name="email" className="w-[16px] h-[16px]" stroke={1.8} />
                    <span>{cell.email}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
