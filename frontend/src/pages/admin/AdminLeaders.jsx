// ============================================================
//  AdminLeaders — directorio de líderes (foto + contacto), NO
//  estático: alimenta el apartado "comunícate con tu líder" en
//  Células (público) y en el dashboard de voluntarios. Usa el
//  mismo sistema glass-light del resto del panel admin (ver
//  docs/DISENO_LIQUID_GLASS_ADMIN.md).
// ============================================================
import { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { compressImageIfNeeded } from '../../lib/compressImage';

const EMPTY = { name: '', area: '', phone: '', email: '', address: '', photo_url: '', is_active: true };

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
      const compressed = await compressImageIfNeeded(file);
      const fd = new FormData();
      fd.append('file', compressed);
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
        await apiClient.put(`/admin/leader-directory/${form.ID}`, form);
        toast.success('Líder actualizado');
      } else {
        await apiClient.post('/admin/leader-directory', form);
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
          <img src={form.photo_url} alt={form.name} className="w-16 h-16 rounded-full object-cover border border-bg/10" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-bg/8 border border-bg/10" />
        )}
        <label className="cursor-pointer">
          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-bg/10 text-body-s text-bg hover:border-bg/20 transition-colors">
            {uploading ? 'Subiendo…' : form.photo_url ? 'Cambiar foto' : 'Subir foto'}
          </span>
          <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} disabled={uploading} />
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label={<>Nombre <span className="text-rose">*</span></>}
          value={form.name} onChange={set('name')} placeholder="Ej. Cristian de León" required
        />
        <Input label="Área / célula" value={form.area} onChange={set('area')} placeholder="Ej. Célula Adolescentes, Alabanza" />
        <Input label="WhatsApp (con 502)" value={form.phone} onChange={set('phone')} placeholder="502XXXXXXXX" />
        <Input label="Correo" type="email" value={form.email} onChange={set('email')} placeholder="lider@casadelrey.org" />
        <div className="sm:col-span-2">
          <Input label="Dirección (privada, nunca pública)" value={form.address} onChange={set('address')} placeholder="Para ubicar al líder al asignar nuevos miembros cercanos" />
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.is_active}
          onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
          className="rounded" />
        <span className="text-body-s text-bg">Visible en el sitio (células y voluntarios)</span>
      </label>

      <div className="flex gap-3 pt-2 border-t border-bg/10">
        <Button type="submit" variant="filled" disabled={loading || uploading} className="flex-1 justify-center">
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
    apiClient.get('/admin/leader-directory')
      .then(r => setLeaders(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (l) => {
    try {
      await apiClient.put(`/admin/leader-directory/${l.ID}`, { is_active: !l.is_active });
      toast.success(l.is_active ? 'Ocultado del sitio' : 'Visible en el sitio');
      load();
    } catch { toast.error('Error al actualizar'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar a este líder del directorio?')) return;
    try {
      await apiClient.delete(`/admin/leader-directory/${id}`);
      toast.success('Eliminado');
      load();
    } catch { toast.error('Error al eliminar'); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-title-l text-bg mb-1">Directorio de líderes</h1>
          <p className="text-body-m text-bg/50">
            Foto y contacto de cada líder. Aparecen en Células (público) y en el
            dashboard de los voluntarios para que puedan comunicarse.
          </p>
        </div>
        <Button variant="filled" onClick={() => { setEditing(null); setShowForm(!showForm); }}>
          {showForm ? 'Cancelar' : 'Nuevo líder'}
        </Button>
      </div>

      {showForm && (
        <div className="glass-light rounded-[24px] card-spring p-4 sm:p-6">
          <h2 className="text-title-m mb-4">{editing ? 'Editar líder' : 'Agregar líder'}</h2>
          <LeaderForm
            initialData={editing}
            onSave={() => { setShowForm(false); setEditing(null); load(); }}
            onCancel={() => { setShowForm(false); setEditing(null); }}
          />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 rounded-full border-2 border-bg/10 border-t-acento animate-spin" />
        </div>
      ) : leaders.length === 0 ? (
        <div className="glass-light rounded-[24px] card-spring flex flex-col items-center py-16 gap-4">
          <p className="text-body-l text-bg font-medium">Aún no hay líderes en el directorio</p>
          <p className="text-body-s text-bg/50">Agrégalos con el botón "Nuevo líder".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {leaders.map(l => (
            <div key={l.ID} className={`glass-light rounded-[20px] card-spring p-4 flex gap-4 items-center ${l.is_active ? '' : 'opacity-60'}`}>
              {l.photo_url ? (
                <img src={l.photo_url} alt={l.name} className="w-14 h-14 rounded-full object-cover border border-bg/10 shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-bg/8 border border-bg/10 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-title-s text-bg font-medium truncate">{l.name}</p>
                {l.area  && <p className="text-body-s text-bg/50 truncate">{l.area}</p>}
                {l.phone && <p className="text-label-s text-bg/50 mt-0.5">{l.phone}</p>}
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0 text-13 font-semibold">
                <button onClick={() => { setEditing(l); setShowForm(true); }} className="text-bg/55 hover:text-bg transition-colors">
                  Editar
                </button>
                <button onClick={() => handleToggle(l)} className="text-bg/55 hover:text-bg transition-colors">
                  {l.is_active ? 'Ocultar' : 'Mostrar'}
                </button>
                <button onClick={() => handleDelete(l.ID)} className="text-bg/55 hover:text-rose transition-colors">
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
