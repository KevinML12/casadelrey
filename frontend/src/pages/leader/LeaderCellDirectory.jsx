import { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';

const TYPE_LABELS = {
  hombres: { label: 'Hombres',   icon: 'man',     bg: 'bg-pri-con',  text: 'text-on-pri-con' },
  mujeres: { label: 'Mujeres',   icon: 'woman',   bg: 'bg-sec-con',  text: 'text-on-sec-con' },
  jovenes: { label: 'Jóvenes',   icon: 'school',  bg: 'bg-ter-con',  text: 'text-on-ter-con' },
  prejus:  { label: 'Pre-jus',   icon: 'groups',  bg: 'bg-pri-con',  text: 'text-on-pri-con' },
  ninos:   { label: 'Niños',     icon: 'child_care', bg: 'bg-sec-con', text: 'text-on-sec-con' },
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
          <span className="ms text-on-sec-con" style={{ fontSize: 22 }}>contacts</span>
        </div>
        <div>
          <h1 className="text-headline-s text-on-surf font-black leading-tight">Directorio de Células</h1>
          <p className="text-body-s text-on-surf-var mt-0.5">Tu célula asignada</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-outline-var border-t-pri animate-spin" />
        </div>
      ) : cells.length === 0 ? (
        <div className="bg-surf-low border border-outline-var rounded-2xl flex flex-col items-center py-20 gap-4 text-on-surf-var">
          <span className="ms" style={{ fontSize: 48 }}>contacts</span>
          <p className="text-body-l text-on-surf font-medium">Sin células asignadas</p>
        </div>
      ) : (
        <div className="space-y-4">
          {cells.map(cell => {
            const typeInfo = TYPE_LABELS[cell.cell_type] || { label: cell.cell_type, icon: 'groups', bg: 'bg-surf-high', text: 'text-on-surf' };
            return (
              <div key={cell.id} className="bg-surf-low border border-outline-var rounded-2xl p-5">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${typeInfo.bg}`}>
                    <span className={`ms ${typeInfo.text}`} style={{ fontSize: 22 }}>{typeInfo.icon}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-title-s text-on-surf font-bold">{cell.cell_code}</span>
                      <span className="text-label-s text-on-surf-var px-2 py-0.5 rounded-full bg-surf-high">{typeInfo.label}</span>
                    </div>
                    <p className="text-body-s text-on-surf-var">{cell.member_count} miembro{cell.member_count !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="space-y-2 text-body-s text-on-surf-var">
                  <div className="flex items-center gap-2">
                    <span className="ms" style={{ fontSize: 16 }}>person</span>
                    <span className="text-on-surf">{cell.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="ms" style={{ fontSize: 16 }}>email</span>
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
