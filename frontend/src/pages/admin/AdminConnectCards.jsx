import { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { IconButton } from '../../components/ui/Button';
import Chip, { FilterChip } from '../../components/ui/Chip';
import { Icon } from '../../components/ui/Glass';

const CATEGORIES = {
  primera_vez:  { label: 'Primera vez',    color: 'secondary' },
  reconciliado: { label: 'Reconciliado',   color: 'primary' },
  busco_celula: { label: 'Busca célula',   color: 'tertiary' },
};
const HOW_FOUND = {
  invitacion: 'Invitación', redes: 'Redes sociales', publicidad: 'Publicidad', otro: 'Otro',
};
const STATUS_FLOW = ['nuevo', 'contactado', 'integrado'];
const STATUS_LABEL = { nuevo: 'Nuevo', contactado: 'Contactado', integrado: 'Integrado' };
const STATUS_COLOR = { nuevo: 'error', contactado: 'secondary', integrado: 'primary' };

export default function AdminConnectCards() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [cards, setCards] = useState([]);
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const refresh = () => {
    setLoading(true);
    const params = statusFilter ? `?status=${statusFilter}` : '';
    apiClient.get(`/admin/connect-cards${params}`)
      .then(r => setCards(r.data?.data || r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, [statusFilter]);

  useEffect(() => {
    if (!isAdmin) return;
    apiClient.get('/admin/leaders').then(r => setLeaders(r.data || [])).catch(() => {});
  }, [isAdmin]);

  const updateCard = async (id, patch) => {
    try {
      await apiClient.put(`/admin/connect-cards/${id}`, patch);
      toast.success('Actualizado');
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al actualizar');
    }
  };

  const deleteCard = async (id) => {
    if (!confirm('¿Eliminar esta tarjeta?')) return;
    try {
      await apiClient.delete(`/admin/connect-cards/${id}`);
      toast.success('Tarjeta eliminada');
      refresh();
    } catch { toast.error('Error al eliminar'); }
  };

  const counts = STATUS_FLOW.reduce((acc, s) => {
    acc[s] = cards.filter(c => c.status === s).length;
    return acc;
  }, {});
  const total = cards.length;

  return (
    <div className="p-6 max-w-4xl mx-auto">

      {/* Page header */}
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-pri-con flex items-center justify-center shrink-0">
            <Icon name="contact_page" className="w-[22px] h-[22px] text-on-pri-con" stroke={1.8} />
          </div>
          <div>
            <h1 className="text-headline-s text-on-surf font-black leading-tight">Conéctate</h1>
            <p className="text-body-s text-on-surf-var mt-0.5">
              {total} registros · {counts.nuevo || 0} sin contactar · {counts.contactado || 0} en seguimiento · {counts.integrado || 0} integrados
            </p>
          </div>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <FilterChip selected={statusFilter === ''} onClick={() => setStatusFilter('')} icon="apps">
          Todas
        </FilterChip>
        {STATUS_FLOW.map(s => (
          <FilterChip key={s} selected={statusFilter === s} icon="circle"
            count={counts[s] || 0} onClick={() => setStatusFilter(s)}>
            {STATUS_LABEL[s]}
          </FilterChip>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-white/10 border-t-pri animate-spin" />
        </div>
      ) : cards.length === 0 ? (
        <div className="liquid-glass rounded-[24px] card-spring flex flex-col items-center py-20 gap-4 text-on-surf-var">
          <div className="w-16 h-16 rounded-[28px] bg-white/8 flex items-center justify-center">
            <Icon name="contact_page" className="w-[32px] h-[32px]" stroke={1.8} />
          </div>
          <div className="text-center">
            <p className="text-body-l text-on-surf font-medium">Sin tarjetas</p>
            <p className="text-body-s text-on-surf-var mt-1">
              {statusFilter ? `No hay registros con estado "${STATUS_LABEL[statusFilter]}".` : 'Aquí aparecerán los visitantes que se registren en /conectate.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="liquid-glass rounded-[24px] card-spring overflow-hidden divide-y divide-white/8">
          {cards.map(card => {
            const cat = CATEGORIES[card.category];
            const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(card.status) + 1];
            return (
              <div key={card.ID} className="flex items-start gap-4 p-5 hover:bg-white/8 transition-colors">

                <div className="w-10 h-10 rounded-xl bg-white/8 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon name="person" className="w-[18px] h-[18px] text-on-surf-var" stroke={1.8} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-body-l text-on-surf font-medium">{card.name}</span>
                    {cat && <Chip color={cat.color}>{cat.label}</Chip>}
                    <Chip color={STATUS_COLOR[card.status]}>{STATUS_LABEL[card.status]}</Chip>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-body-s text-on-surf-var">
                    {card.phone && (
                      <span className="flex items-center gap-1.5">
                        <Icon name="phone" className="w-[14px] h-[14px]" stroke={1.8} />{card.phone}
                      </span>
                    )}
                    {card.email && (
                      <span className="flex items-center gap-1.5">
                        <Icon name="mail" className="w-[14px] h-[14px]" stroke={1.8} />{card.email}
                      </span>
                    )}
                    {card.how_found && (
                      <span className="flex items-center gap-1.5">
                        <Icon name="campaign" className="w-[14px] h-[14px]" stroke={1.8} />
                        {HOW_FOUND[card.how_found] || card.how_found}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap mt-3">
                    {isAdmin && (
                      <select
                        value={card.leader_assigned_id || ''}
                        onChange={e => updateCard(card.ID, { leader_assigned_id: e.target.value ? Number(e.target.value) : null })}
                        className="text-label-m px-2.5 py-1.5 rounded-lg border border-white/10 bg-transparent text-on-surf-var focus:outline-none focus:border-pri"
                      >
                        <option value="">Sin asignar</option>
                        {leaders.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                      </select>
                    )}
                    {!isAdmin && card.leader_assigned && (
                      <span className="text-label-m text-on-surf-var">Asignado a {card.leader_assigned.name}</span>
                    )}
                    {nextStatus && (
                      <button
                        onClick={() => updateCard(card.ID, { status: nextStatus })}
                        className="text-label-m px-2.5 py-1.5 rounded-lg border border-white/10 text-pri hover:bg-pri-con transition-colors"
                      >
                        Marcar como {STATUS_LABEL[nextStatus].toLowerCase()}
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2 shrink-0">
                  <p className="text-label-s text-on-surf-var whitespace-nowrap">
                    {card.CreatedAt ? new Date(card.CreatedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : '—'}
                  </p>
                  {isAdmin && (
                    <IconButton onClick={() => deleteCard(card.ID)} title="Eliminar"
                      className="text-on-surf-var hover:text-err hover:bg-err-con transition-all">
                      <Icon name="delete" className="w-[16px] h-[16px]" stroke={1.8} />
                    </IconButton>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
