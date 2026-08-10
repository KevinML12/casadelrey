// ============================================================
//  AdminDonationPurposes — CRUD de los destinos de donación (Fondo
//  General, Células, Misiones...). Antes vivían en DOS arreglos
//  hardcodeados y desincronizados (IMPACT en DonatePage.jsx, PURPOSES
//  en DonationCard.jsx) -- ahora una sola fuente administrable, mismo
//  patrón que AdminVolunteerAreas.
// ============================================================
import { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import Input, { Textarea } from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const EMPTY = { value: '', title: '', description: '', sort_order: 0 };

function PurposeForm({ onSave, onCancel, initialData }) {
  const [form, setForm] = useState(initialData || EMPTY);
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.value.trim() || !form.title.trim()) {
      toast.error('Value y título son obligatorios');
      return;
    }
    setLoading(true);
    try {
      const payload = { ...form, sort_order: Number(form.sort_order) || 0 };
      if (form.ID) {
        await apiClient.put(`/admin/donation-purposes/${form.ID}`, payload);
        toast.success('Destino actualizado');
      } else {
        await apiClient.post('/admin/donation-purposes', payload);
        toast.success('Destino creado');
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label={<>Value (clave estable) <span className="text-rose">*</span></>}
          value={form.value} onChange={set('value')} placeholder="ej. general" required
          helperText="Sin espacios ni tildes -- es la clave que queda guardada en cada donación. No la cambies si ya hay donaciones con este destino."
        />
        <Input
          label={<>Título <span className="text-rose">*</span></>}
          value={form.title} onChange={set('title')} placeholder="ej. Fondo General" required
        />
        <Input label="Orden" type="number" value={form.sort_order} onChange={set('sort_order')} />
      </div>

      <Textarea label="Descripción" value={form.description} onChange={set('description')} rows={2}
        placeholder="A qué se destina esta siembra..." />

      <div className="flex gap-3 pt-2 border-t border-bg/10">
        <Button type="submit" variant="filled" disabled={loading} className="flex-1 justify-center">
          {loading ? 'Guardando…' : (form.ID ? 'Actualizar' : 'Crear destino')}
        </Button>
        <Button type="button" variant="text" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  );
}

export default function AdminDonationPurposes() {
  const [purposes, setPurposes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    setLoading(true);
    apiClient.get('/admin/donation-purposes')
      .then(res => setPurposes(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (p) => {
    try {
      await apiClient.put(`/admin/donation-purposes/${p.ID}`, { ...p, is_active: !p.is_active });
      toast.success(p.is_active ? 'Ocultado del sitio' : 'Visible en el sitio');
      load();
    } catch { toast.error('Error al actualizar'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este destino? Las donaciones ya registradas con este valor no se borran.')) return;
    try {
      await apiClient.delete(`/admin/donation-purposes/${id}`);
      toast.success('Eliminado');
      load();
    } catch { toast.error('Error al eliminar'); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-title-l text-bg mb-1">Donaciones — Destinos</h1>
          <p className="text-body-m text-bg/50">
            A dónde puede dirigir su siembra un donante -- se muestran en /donate, tanto en el
            selector de "Destino" como en las tarjetas de "¿A dónde va tu donación?".
          </p>
        </div>
        <Button variant="filled" onClick={() => { setEditing(null); setShowForm(!showForm); }}>
          {showForm ? 'Cancelar' : 'Nuevo destino'}
        </Button>
      </div>

      {showForm && (
        <div className="glass-light rounded-[24px] card-spring p-4 sm:p-6">
          <h2 className="text-title-m mb-4">{editing ? 'Editar destino' : 'Nuevo destino'}</h2>
          <PurposeForm
            initialData={editing}
            onSave={() => { setShowForm(false); setEditing(null); load(); }}
            onCancel={() => { setShowForm(false); setEditing(null); }}
          />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 rounded-full border-2 border-bg/10 border-t-celeste animate-spin" />
        </div>
      ) : purposes.length === 0 ? (
        <div className="glass-light rounded-[24px] card-spring flex flex-col items-center py-16 gap-4">
          <p className="text-body-l text-bg font-medium">Aún no hay destinos registrados</p>
          <p className="text-body-s text-bg/50">Agrégalos con el botón "Nuevo destino".</p>
        </div>
      ) : (
        <div className="glass-light rounded-[24px] card-spring overflow-hidden divide-y divide-bg/8">
          {purposes.map(p => (
            <div key={p.ID} className={`p-4 flex flex-col sm:flex-row gap-4 sm:items-center hover:bg-bg/6 transition-colors ${p.is_active ? '' : 'opacity-60'}`}>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                  <p className="text-title-s text-bg font-medium">{p.title}</p>
                  <span className="text-label-s text-bg/50 px-2 py-0.5 rounded-full bg-bg/8 font-mono">{p.value}</span>
                </div>
                {p.description && <p className="text-body-s text-bg/50">{p.description}</p>}
              </div>
              <div className="flex items-center gap-3 shrink-0 self-end sm:self-center text-13 font-semibold">
                <button onClick={() => { setEditing(p); setShowForm(true); }} className="text-bg/55 hover:text-bg transition-colors">
                  Editar
                </button>
                <span className="text-bg/20">·</span>
                <button onClick={() => handleToggle(p)} className="text-bg/55 hover:text-bg transition-colors">
                  {p.is_active ? 'Ocultar' : 'Mostrar'}
                </button>
                <span className="text-bg/20">·</span>
                <button onClick={() => handleDelete(p.ID)} className="text-bg/55 hover:text-rose transition-colors">
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
