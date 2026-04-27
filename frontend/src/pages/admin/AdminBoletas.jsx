import { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';

const CATEGORIES = [
  { value: 'convertido',   label: 'Convertido',   cls: 'bg-ter-con text-on-ter-con' },
  { value: 'reconciliado', label: 'Reconciliado',  cls: 'bg-pri-con text-on-pri-con' },
  { value: 'nuevo',        label: 'Nuevo',         cls: 'bg-sec-con text-on-sec-con' },
];

const fieldCls = 'w-full px-4 py-2.5 rounded-xl border border-outline-var bg-transparent text-body-s text-on-surf placeholder:text-on-surf-var focus:outline-none focus:border-pri focus:ring-2 focus:ring-pri/15 transition-all';
const EMPTY = { date: '', inviter_name: '', inviter_phone: '', guest_name: '', guest_phone: '', address: '', category: 'nuevo', notes: '' };

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
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-label-l text-on-surf-var mb-1.5">Fecha *</label>
          <input type="date" value={form.date} onChange={set('date')} className={fieldCls} required />
        </div>
        <div>
          <label className="block text-label-l text-on-surf-var mb-1.5">Categoría *</label>
          <select value={form.category} onChange={set('category')} className={fieldCls} required>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-surf border border-outline-var space-y-3">
        <p className="text-label-l text-pri font-semibold uppercase tracking-widest">Quien invitó</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-label-l text-on-surf-var mb-1.5">Nombre</label>
            <input value={form.inviter_name} onChange={set('inviter_name')} className={fieldCls} placeholder="Nombre del invitador" />
          </div>
          <div>
            <label className="block text-label-l text-on-surf-var mb-1.5">Teléfono</label>
            <input value={form.inviter_phone} onChange={set('inviter_phone')} className={fieldCls} placeholder="+502 5555 0000" />
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-surf border border-outline-var space-y-3">
        <p className="text-label-l text-pri font-semibold uppercase tracking-widest">Invitado *</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-label-l text-on-surf-var mb-1.5">Nombre *</label>
            <input value={form.guest_name} onChange={set('guest_name')} className={fieldCls} placeholder="Nombre del invitado" required />
          </div>
          <div>
            <label className="block text-label-l text-on-surf-var mb-1.5">Teléfono</label>
            <input value={form.guest_phone} onChange={set('guest_phone')} className={fieldCls} placeholder="+502 5555 0000" />
          </div>
        </div>
        <div>
          <label className="block text-label-l text-on-surf-var mb-1.5">Dirección</label>
          <input value={form.address} onChange={set('address')} className={fieldCls} placeholder="Zona, colonia, municipio…" />
        </div>
      </div>

      <div>
        <label className="block text-label-l text-on-surf-var mb-1.5">Notas</label>
        <textarea rows={2} value={form.notes} onChange={set('notes')} className={`${fieldCls} resize-none`} placeholder="Observaciones adicionales…" />
      </div>

      <div className="flex gap-3">
        <Button type="submit" variant="filled" disabled={loading} className="flex-1 justify-center">
          <span className="ms" style={{ fontSize: 16 }}>save</span>
          {loading ? 'Guardando…' : 'Guardar boleta'}
        </Button>
        <Button type="button" variant="outlined" onClick={onCancel}>Cancelar</Button>
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
      .then(r => setBoletas(r.data || []))
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
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const counts = CATEGORIES.reduce((acc, c) => {
    acc[c.value] = boletas.filter(b => b.category === c.value).length;
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-headline-s text-on-surf font-black">Boletas de Nuevos</h1>
          <p className="text-body-s text-on-surf-var mt-1">
            {boletas.length} registros · {counts.convertido || 0} convertidos · {counts.reconciliado || 0} reconciliados · {counts.nuevo || 0} nuevos
          </p>
        </div>
        <Button variant="filled" onClick={() => setShowForm(s => !s)}>
          <span className="ms" style={{ fontSize: 18 }}>{showForm ? 'close' : 'add'}</span>
          {showForm ? 'Cancelar' : 'Nueva boleta'}
        </Button>
      </div>

      {showForm && (
        <div className="mb-8 p-6 rounded-2xl bg-surf-low border border-outline-var">
          <h2 className="text-title-l text-on-surf font-bold mb-5">Registrar nuevo miembro</h2>
          <BoletaForm onSave={() => { setShowForm(false); refresh(); }} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {/* Filtro por categoría */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[['', 'Todas'], ...CATEGORIES.map(c => [c.value, c.label])].map(([val, lbl]) => (
          <button key={val} onClick={() => setCatFilter(val)}
            className={`px-4 py-2 rounded-full text-label-m font-medium border transition-all ${
              catFilter === val
                ? 'border-pri bg-pri-con text-on-pri-con'
                : 'border-outline-var text-on-surf-var hover:border-pri/40 hover:text-pri'
            }`}>
            {lbl}
            {val && <span className="ml-1.5 text-label-s opacity-70">{counts[val] || 0}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-outline-var border-t-pri animate-spin" />
        </div>
      ) : boletas.length === 0 ? (
        <div className="text-center py-20 bg-surf-low border border-outline-var rounded-2xl">
          <span className="ms text-on-surf-var block mb-3" style={{ fontSize: 40 }}>person_add</span>
          <p className="text-body-s text-on-surf-var">No hay boletas registradas aún.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {boletas.map(b => {
            const cat = CATEGORIES.find(c => c.value === b.category);
            return (
              <div key={b.ID} className="bg-surf-low border border-outline-var rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className={`text-label-s px-2.5 py-1 rounded-full font-medium ${cat?.cls || 'bg-surf-high text-on-surf-var'}`}>
                        {cat?.label || b.category}
                      </span>
                      <span className="text-title-s text-on-surf font-semibold">{b.guest_name}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-body-s">
                      {b.guest_phone && (
                        <span className="flex items-center gap-1.5 text-on-surf-var">
                          <span className="ms" style={{ fontSize: 14 }}>phone</span>{b.guest_phone}
                        </span>
                      )}
                      {b.address && (
                        <span className="flex items-center gap-1.5 text-on-surf-var">
                          <span className="ms" style={{ fontSize: 14 }}>location_on</span>{b.address}
                        </span>
                      )}
                      {b.inviter_name && (
                        <span className="flex items-center gap-1.5 text-on-surf-var">
                          <span className="ms" style={{ fontSize: 14 }}>person</span>Invitado por: <strong className="text-on-surf ml-1">{b.inviter_name}</strong>
                        </span>
                      )}
                      {b.inviter_phone && (
                        <span className="flex items-center gap-1.5 text-on-surf-var">
                          <span className="ms" style={{ fontSize: 14 }}>call</span>{b.inviter_phone}
                        </span>
                      )}
                    </div>
                    {b.notes && (
                      <p className="text-body-s text-on-surf-var mt-2 bg-surf border border-outline-var rounded-lg px-3 py-2">{b.notes}</p>
                    )}
                  </div>
                  <div className="flex items-start gap-2 shrink-0">
                    <span className="text-label-s text-on-surf-var">
                      {b.date ? new Date(b.date + 'T12:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : '—'}
                    </span>
                    {isAdmin && (
                      <button onClick={() => deleteBoleta(b.ID)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-on-surf-var hover:text-err hover:bg-err-con transition-all">
                        <span className="ms" style={{ fontSize: 16 }}>delete</span>
                      </button>
                    )}
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
