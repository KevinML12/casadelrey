import { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Button, { IconButton } from '../../components/ui/Button';
import Chip, { FilterChip } from '../../components/ui/Chip';
import { Icon } from '../../components/ui/Glass';

const CATEGORIES = [
  { value: 'convertido',   label: 'Convertido',   color: 'tertiary',  icon: 'church' },
  { value: 'reconciliado', label: 'Reconciliado',  color: 'primary',   icon: 'favorite' },
  { value: 'nuevo',        label: 'Nuevo',         color: 'secondary', icon: 'person_add' },
];

const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.value, c]));

const fieldCls = 'w-full px-4 py-2.5 rounded border border-bg/10 bg-transparent text-body-s text-bg placeholder:text-bg/50 hover:border-bg/20 focus:outline-none focus:border-pri focus:ring-2 focus:ring-pri/15 transition-all';
const EMPTY = { date: '', inviter_name: '', inviter_phone: '', guest_name: '', guest_phone: '', address: '', category: 'nuevo', notes: '' };

function FieldLabel({ children, required }) {
  return (
    <label className="block text-label-l text-bg/50 mb-1.5">
      {children}{required && <span className="text-err ml-0.5">*</span>}
    </label>
  );
}

function SectionHeader({ icon, children }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-7 h-7 rounded-lg bg-pri-con flex items-center justify-center">
        <Icon name={icon} className="w-[14px] h-[14px] text-on-pri-con" stroke={1.8} />
      </div>
      <p className="text-label-l text-bg font-semibold">{children}</p>
    </div>
  );
}

function BoletaForm({ onSave, onCancel }) {
  const [form, setForm] = useState({ ...EMPTY, date: new Date().toISOString().slice(0, 10) });
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.guest_name || !form.date || !form.category) {
      toast.error('Nombre del invitado, fecha y categoría son obligatorios');
      return;
    }
    setLoading(true);
    try {
      await apiClient.post('/admin/boletas', form);
      toast.success('Boleta registrada');
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Fecha + Categoría */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <FieldLabel required>Fecha</FieldLabel>
          <input type="date" value={form.date} onChange={set('date')} className={fieldCls} required />
        </div>
        <div>
          <FieldLabel required>Categoría</FieldLabel>
          <div className="flex gap-2 flex-wrap pt-1">
            {CATEGORIES.map(c => (
              <FilterChip key={c.value} selected={form.category === c.value}
                icon={c.icon} onClick={() => setForm(p => ({ ...p, category: c.value }))}>
                {c.label}
              </FilterChip>
            ))}
          </div>
        </div>
      </div>

      {/* Quien invitó */}
      <div className="space-y-3">
        <SectionHeader icon="person">Quien invitó</SectionHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel>Nombre</FieldLabel>
            <input value={form.inviter_name} onChange={set('inviter_name')} className={fieldCls} placeholder="Nombre del invitador" />
          </div>
          <div>
            <FieldLabel>Teléfono</FieldLabel>
            <input value={form.inviter_phone} onChange={set('inviter_phone')} className={fieldCls} placeholder="+502 5555 0000" />
          </div>
        </div>
      </div>

      {/* Invitado */}
      <div className="space-y-3">
        <SectionHeader icon="person_add">Invitado</SectionHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel required>Nombre</FieldLabel>
            <input value={form.guest_name} onChange={set('guest_name')} className={fieldCls} placeholder="Nombre del invitado" required />
          </div>
          <div>
            <FieldLabel>Teléfono</FieldLabel>
            <input value={form.guest_phone} onChange={set('guest_phone')} className={fieldCls} placeholder="+502 5555 0000" />
          </div>
        </div>
        <div>
          <FieldLabel>Dirección</FieldLabel>
          <input value={form.address} onChange={set('address')} className={fieldCls} placeholder="Zona, colonia, municipio…" />
        </div>
      </div>

      {/* Notas */}
      <div>
        <FieldLabel>Notas</FieldLabel>
        <textarea rows={2} value={form.notes} onChange={set('notes')}
          className={`${fieldCls} resize-none`} placeholder="Observaciones adicionales…" />
      </div>

      <div className="flex gap-3 pt-2 border-t border-bg/10">
        <Button type="submit" variant="filled" disabled={loading} className="flex-1 justify-center">
          <Icon name="save" className="w-[16px] h-[16px]" stroke={1.8} />
          {loading ? 'Guardando…' : 'Guardar boleta'}
        </Button>
        <Button type="button" variant="text" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  );
}

export default function AdminBoletas() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [boletas,   setBoletas]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [catFilter, setCatFilter] = useState('');

  const refresh = () => {
    setLoading(true);
    const params = catFilter ? `?category=${catFilter}` : '';
    apiClient.get(`/admin/boletas${params}`)
      .then(r => setBoletas(r.data?.data || r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, [catFilter]);

  const deleteBoleta = async (id) => {
    if (!confirm('¿Eliminar esta boleta?')) return;
    try {
      await apiClient.delete(`/admin/boletas/${id}`);
      toast.success('Boleta eliminada');
      refresh();
    } catch { toast.error('Error al eliminar'); }
  };

  const counts = CATEGORIES.reduce((acc, c) => {
    acc[c.value] = boletas.filter(b => b.category === c.value).length;
    return acc;
  }, {});
  const total = boletas.length;

  return (
    <div className="p-6 max-w-4xl mx-auto">

      {/* Page header */}
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sec-con flex items-center justify-center shrink-0">
            <Icon name="person_add" className="w-[22px] h-[22px] text-on-sec-con" stroke={1.8} />
          </div>
          <div>
            <h1 className="text-headline-s text-bg font-black leading-tight">Boletas de Nuevos</h1>
            <p className="text-body-s text-bg/50 mt-0.5">
              {total} registros · {counts.convertido || 0} conv. · {counts.reconciliado || 0} rec. · {counts.nuevo || 0} nuevos
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="filled" onClick={() => setShowForm(s => !s)}>
            <Icon name={showForm ? 'close' : 'add'} className="w-[18px] h-[18px]" stroke={1.8} />
            {showForm ? 'Cancelar' : 'Nueva boleta'}
          </Button>
        </div>
      </div>

      {/* Formulario inline */}
      {showForm && (
        <div className="glass-light rounded-[24px] card-spring mb-8 p-6">
          <p className="text-label-l text-bg/45 font-semibold uppercase tracking-widest mb-5">Registrar nuevo miembro</p>
          <BoletaForm onSave={() => { setShowForm(false); refresh(); }} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {/* Filter chips */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <FilterChip selected={catFilter === ''} onClick={() => setCatFilter('')} icon="apps">
          Todas
        </FilterChip>
        {CATEGORIES.map(c => (
          <FilterChip key={c.value} selected={catFilter === c.value} icon={c.icon}
            count={counts[c.value] || 0}
            onClick={() => setCatFilter(c.value)}>
            {c.label}
          </FilterChip>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-bg/10 border-t-pri animate-spin" />
        </div>
      ) : boletas.length === 0 ? (
        <div className="glass-light rounded-[24px] card-spring flex flex-col items-center py-20 gap-4 text-bg/50">
          <div className="w-16 h-16 rounded-[28px] bg-bg/8 flex items-center justify-center">
            <Icon name="person_add" className="w-[32px] h-[32px]" stroke={1.8} />
          </div>
          <div className="text-center">
            <p className="text-body-l text-bg font-medium">Sin boletas</p>
            <p className="text-body-s text-bg/50 mt-1">
              {catFilter ? `No hay registros con categoría "${catFilter}".` : 'Crea la primera boleta con el botón de arriba.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="glass-light rounded-[24px] card-spring overflow-hidden divide-y divide-bg/8">
          {boletas.map(b => {
            const cat = CAT_MAP[b.category];
            return (
              <div key={b.ID} className="flex items-start gap-4 p-5 hover:bg-bg/8 transition-colors">

                {/* Leading icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5
                  ${cat ? `bg-${cat.color === 'tertiary' ? 'ter' : cat.color === 'secondary' ? 'sec' : 'pri'}-con` : 'bg-bg/8'}`}
                  style={cat ? {} : {}}>
                  <Icon name={cat?.icon || 'person'} className="w-[18px] h-[18px] text-on-pri-con" stroke={1.8} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-body-l text-bg font-medium">{b.guest_name}</span>
                    {cat && <Chip color={cat.color}>{cat.label}</Chip>}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-body-s text-bg/50">
                    {b.guest_phone && (
                      <span className="flex items-center gap-1.5">
                        <Icon name="phone" className="w-[14px] h-[14px]" stroke={1.8} />{b.guest_phone}
                      </span>
                    )}
                    {b.address && (
                      <span className="flex items-center gap-1.5">
                        <Icon name="location_on" className="w-[14px] h-[14px]" stroke={1.8} />{b.address}
                      </span>
                    )}
                    {b.inviter_name && (
                      <span className="flex items-center gap-1.5">
                        <Icon name="person" className="w-[14px] h-[14px]" stroke={1.8} />
                        Invitado por <strong className="text-bg ml-1">{b.inviter_name}</strong>
                        {b.inviter_phone && ` · ${b.inviter_phone}`}
                      </span>
                    )}
                  </div>
                  {b.notes && (
                    <p className="text-body-s text-bg/50 mt-2 bg-bg/4 border border-bg/10 rounded-xl px-3 py-2 leading-relaxed">
                      {b.notes}
                    </p>
                  )}
                </div>

                {/* Trailing */}
                <div className="flex items-start gap-2 shrink-0">
                  <p className="text-label-s text-bg/50 whitespace-nowrap">
                    {b.date ? new Date(b.date + 'T12:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : '—'}
                  </p>
                  {isAdmin && (
                    <IconButton onClick={() => deleteBoleta(b.ID)} title="Eliminar"
                      className="text-bg/50 hover:text-err hover:bg-err-con transition-all">
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
