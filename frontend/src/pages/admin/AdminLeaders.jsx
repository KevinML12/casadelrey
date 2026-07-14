// ============================================================
//  AdminLeaders — directorio de líderes (foto + contacto), NO
//  estático: alimenta el apartado "comunícate con tu líder" en
//  Células (público) y en el dashboard de voluntarios. Sistema de
//  diseño MD3 del panel admin (a propósito, no liquid-glass).
// ============================================================
import { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';

const fieldCls = 'w-full px-4 py-2.5 rounded border border-outline-var bg-transparent text-body-s text-on-surf placeholder:text-on-surf-var hover:border-on-surf-var focus:outline-none focus:border-pri focus:ring-2 focus:ring-pri/15 transition-all';

const EMPTY = { name: '', area: '', phone: '', email: '', photo_url: '', is_active: true };

function LeaderForm({ onSave, onCancel, initialData }) {
  const [form, setForm] = useState(initialData || EMPTY);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await apiClient.post('/upload?folder=lideres', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm(p => ({ ...p, photo_url: res.data.url }));
      toast.success('Foto subida');
    } catch {
      toast.error('Error al subir la foto');
    } finally { setUploading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) { toast.error('El nombre es obligatorio'); return; }
    setLoading(true);
    try {
      if (form.ID) {
        await apiClient.put(`/admin/leaders/${form.ID}`, form);
        toast.success('Líder actualizado');
      } else {
        await apiClient.post('/admin/leaders', form);
        toast.success('Líder agregado');
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-4">
        {form.photo_url ? (
          <img src={form.photo_url} alt={form.name} className="w-16 h-16 rounded-full object-cover border border-outline-var" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-surf-container border border-outline-var grid place-items-center">
            <span className="material-symbols-rounded text-on-surf-var">person</span>
          </div>
        )}
        <label className="cursor-pointer">
          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-outline-var text-body-s text-on-surf hover:border-on-surf-var transition-colors">
            <span className="material-symbols-rounded" style={{ fontSize: 16 }}>photo_camera</span>
            {uploading ? 'Subiendo…' : form.photo_url ? 'Cambiar foto' : 'Subir foto'}
          </span>
          <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} disabled={uploading} />
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-label-l text-on-surf-var mb-1.5">Nombre <span className="text-err">*</span></label>
          <input value={form.name} onChange={set('name')} className={fieldCls} placeholder="Ej. Cristian de León" required />
        </div>
        <div>
          <label className="block text-label-l text-on-surf-var mb-1.5">Área / célula</label>
          <input value={form.area} onChange={set('area')} className={fieldCls} placeholder="Ej. Célula Adolescentes, Alabanza" />
        </div>
        <div>
          <label className="block text-label-l text-on-surf-var mb-1.5">WhatsApp (con 502)</label>
          <input value={form.phone} onChange={set('phone')} className={fieldCls} placeholder="502XXXXXXXX" />
        </div>
        <div>
          <label className="block text-label-l text-on-surf-var mb-1.5">Correo</label>
          <input type="email" value={form.email} onChange={set('email')} className={fieldCls} placeholder="lider@casadelrey.org" />
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.is_active}
          onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
          className="rounded" />
        <span className="text-body-s text-on-surf">Visible en el sitio (células y voluntarios)</span>
      </label>

      <div className="flex gap-3 pt-2 border-t border-outline-var">
        <Button type="submit" variant="filled" disabled={loading || uploading} className="flex-1 justify-center">
          <span className="material-symbols-rounded" style={{ fontSize: 16 }}>save</span>
          {loading ? 'Guardando…' : (form.ID ? 'Actualizar' : 'Agregar líder')}
        </Button>
        <Button type="button" variant="text" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  );
}

export default function AdminLeaders() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    setLoading(true);
    apiClient.get('/admin/leaders')
      .then(r => setLeaders(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (l) => {
    try {
      await apiClient.put(`/admin/leaders/${l.ID}`, { is_active: !l.is_active });
      toast.success(l.is_active ? 'Ocultado del sitio' : 'Visible en el sitio');
      load();
    } catch { toast.error('Error al actualizar'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar a este líder del directorio?')) return;
    try {
      await apiClient.delete(`/admin/leaders/${id}`);
      toast.success('Eliminado');
      load();
    } catch { toast.error('Error al eliminar'); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-title-l text-on-surf mb-1">Directorio de líderes</h1>
          <p className="text-body-m text-on-surf-var">
            Foto y contacto de cada líder. Aparecen en Células (público) y en el
            dashboard de los voluntarios para que puedan comunicarse.
          </p>
        </div>
        <Button variant="filled" onClick={() => { setEditing(null); setShowForm(!showForm); }}>
          <span className="material-symbols-rounded">{showForm ? 'close' : 'add'}</span>
          {showForm ? 'Cancelar' : 'Nuevo líder'}
        </Button>
      </div>

      {showForm && (
        <div className="p-4 sm:p-6 rounded-2xl bg-surf border border-outline-var">
          <h2 className="text-title-m mb-4">{editing ? 'Editar líder' : 'Agregar líder'}</h2>
          <LeaderForm
            initialData={editing}
            onSave={() => { setShowForm(false); setEditing(null); load(); }}
            onCancel={() => { setShowForm(false); setEditing(null); }}
          />
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-on-surf-var">Cargando...</div>
      ) : leaders.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-dashed border-outline-var text-on-surf-var">
          Aún no hay líderes en el directorio. Agrégalos con "Nuevo líder".
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {leaders.map(l => (
            <div key={l.ID} className={`p-4 rounded-2xl border flex gap-4 items-center ${l.is_active ? 'bg-surf border-outline-var' : 'bg-surf-container border-outline/50 opacity-70'}`}>
              {l.photo_url ? (
                <img src={l.photo_url} alt={l.name} className="w-14 h-14 rounded-full object-cover border border-outline-var shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-surf-container border border-outline-var grid place-items-center shrink-0">
                  <span className="material-symbols-rounded text-on-surf-var">person</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-title-s text-on-surf font-medium truncate">{l.name}</p>
                {l.area  && <p className="text-body-s text-on-surf-var truncate">{l.area}</p>}
                {l.phone && <p className="text-label-s text-on-surf-var mt-0.5">{l.phone}</p>}
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <button onClick={() => { setEditing(l); setShowForm(true); }} title="Editar"
                  className="p-1.5 rounded-full hover:bg-surf-container text-on-surf-var hover:text-on-surf transition-colors">
                  <span className="material-symbols-rounded" style={{ fontSize: 18 }}>edit</span>
                </button>
                <button onClick={() => handleToggle(l)} title={l.is_active ? 'Ocultar' : 'Mostrar'}
                  className="p-1.5 rounded-full hover:bg-surf-container text-on-surf-var hover:text-on-surf transition-colors">
                  <span className="material-symbols-rounded" style={{ fontSize: 18 }}>{l.is_active ? 'visibility' : 'visibility_off'}</span>
                </button>
                <button onClick={() => handleDelete(l.ID)} title="Eliminar"
                  className="p-1.5 rounded-full hover:bg-surf-container text-on-surf-var hover:text-err transition-colors">
                  <span className="material-symbols-rounded" style={{ fontSize: 18 }}>delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
