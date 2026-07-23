import { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';
import Paginator from '../../components/ui/Paginator';
import { FilterChip } from '../../components/ui/Chip';
import { Icon } from '../../components/ui/Glass';

const METHOD_LABEL = {
  transferencia: 'Transferencia',
  presencial:    'En persona',
  tigo_money:    'Tigo Money', // histórico (método removido)
};

const PURPOSE_LABEL = {
  general:   'Fondo General',
  celulas:   'Células',
  misionero: 'Misiones',
  jovenes:   'Ministerio Joven',
  edificio:  'Edificio',
};

const PURPOSES = Object.keys(PURPOSE_LABEL);

export default function AdminDonations() {
  const [donations, setDonations] = useState([]);
  const [meta,       setMeta]      = useState(null);
  const [page,       setPage]      = useState(1);
  const [loading,    setLoading]   = useState(true);
  const [purposeF,   setPurposeF]  = useState('');
  const [search,     setSearch]    = useState('');
  const [debounced,  setDebounced] = useState('');

  // Debounce simple: espera 400ms sin tipear antes de buscar en la API.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = (p = page) => {
    setLoading(true);
    const params = new URLSearchParams({ page: p, limit: 20 });
    if (purposeF) params.set('purpose', purposeF);
    if (debounced) params.set('q', debounced);
    apiClient.get(`/admin/donations?${params}`)
      .then(r => { setDonations(r.data?.data || []); setMeta(r.data?.meta || null); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(1); setPage(1); }, [purposeF, debounced]);
  useEffect(() => { load(page); }, [page]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-bg flex items-center justify-center shrink-0">
          <Icon name="payments" className="w-[22px] h-[22px] text-white" stroke={1.8} />
        </div>
        <div>
          <h1 className="text-headline-s text-bg font-black leading-tight">Donaciones</h1>
          <p className="text-body-s text-bg/50 mt-0.5">{meta?.total ?? 0} {meta?.total === 1 ? 'donación registrada' : 'donaciones registradas'}</p>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative mb-4">
        <Icon name="search" className="w-[16px] h-[16px] text-bg/40 absolute left-4 top-1/2 -translate-y-1/2" stroke={1.8} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre o correo…"
          className="w-full h-11 pl-11 pr-4 rounded-xl border border-bg/10 bg-transparent text-body-s text-bg placeholder:text-bg/40 focus:outline-none focus:border-pri focus:ring-2 focus:ring-pri/15 transition-all"
        />
      </div>

      {/* Filtro de destino */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <FilterChip selected={purposeF === ''} icon="apps" onClick={() => setPurposeF('')}>Todos</FilterChip>
        {PURPOSES.map(p => (
          <FilterChip key={p} selected={purposeF === p} onClick={() => setPurposeF(p)}>
            {PURPOSE_LABEL[p]}
          </FilterChip>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-bg/10 border-t-pri animate-spin" />
        </div>
      ) : donations.length === 0 ? (
        <div className="glass-light rounded-[24px] card-spring flex flex-col items-center py-20 gap-4 text-bg/50">
          <Icon name="payments" className="w-[48px] h-[48px]" stroke={1.5} />
          <p className="text-body-l text-bg font-medium">Sin donaciones</p>
          <p className="text-body-s">No hay registros que coincidan con este filtro.</p>
        </div>
      ) : (
        <div className="glass-light rounded-[24px] card-spring overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-bg/10">
                  {['#', 'Nombre', 'Destino', 'Monto', 'Método', 'Fecha'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-11 text-bg/45 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-bg/8">
                {donations.map(d => (
                  <tr key={d.ID} className="hover:bg-bg/4 transition-colors">
                    <td className="px-5 py-3.5 text-12 text-bg/40 font-mono">{d.ID}</td>
                    <td className="px-5 py-3.5 text-14 text-bg font-medium">
                      {d.name}
                      {d.email && <p className="text-12 text-bg/45">{d.email}</p>}
                    </td>
                    <td className="px-5 py-3.5 text-14 text-bg/55">{PURPOSE_LABEL[d.donation_purpose] || d.donation_purpose || '—'}</td>
                    <td className="px-5 py-3.5 text-14 text-bg font-bold">{d.currency} {Number(d.amount).toFixed(2)}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 h-7 px-3 rounded-full bg-bg/6 text-bg/60 text-12 font-medium">
                        {METHOD_LABEL[d.payment_method] || d.payment_method || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-14 text-bg/50 whitespace-nowrap">
                      {d.CreatedAt ? new Date(d.CreatedAt).toLocaleDateString('es-ES') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Paginator meta={meta} onPage={setPage} />
    </div>
  );
}
