// ============================================================
//  LeaderMyProfile — el lider edita su PROPIA ficha del directorio
//  publico (foto/telefono/correo/area) sin depender de un admin. Antes
//  solo /admin/leader-directory podia tocar estos campos -- pedido real
//  del usuario ("un lider no puede editar su propia ficha").
//  is_active queda fuera a proposito: publicarla en el sitio lo decide
//  un admin, no el propio lider (ver leader_directory.handler.go).
// ============================================================
import { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import { Icon } from '../../components/ui/Glass';
import { compressImageIfNeeded } from '../../lib/compressImage';

const fieldCls = 'w-full px-4 py-2.5 rounded border border-bg/10 bg-transparent text-body-s text-bg placeholder:text-bg/50 hover:border-bg/20 focus:outline-none focus:border-pri focus:ring-2 focus:ring-pri/15 transition-all';

export default function LeaderMyProfile() {
  const [form,       setForm]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [uploading,  setUploading]  = useState(false);

  const load = () => {
    setLoading(true);
    apiClient.get('/leader/my-directory-entry')
      .then(r => setForm(r.data))
      .catch(() => toast.error('No se pudo cargar tu ficha'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

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
    setSaving(true);
    try {
      await apiClient.put('/leader/my-directory-entry', {
        name: form.name, photo_url: form.photo_url, phone: form.phone,
        email: form.email, area: form.area,
      });
      toast.success('Ficha actualizada');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally { setSaving(false); }
  };

  if (loading || !form) {
    return (
      <div className="p-6 max-w-2xl mx-auto flex justify-center py-20">
        <div className="w-6 h-6 rounded-full border-2 border-bg/10 border-t-pri animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-2">
        <div className="w-12 h-12 rounded-2xl bg-bg flex items-center justify-center shrink-0">
          <Icon name="badge" className="w-[22px] h-[22px] text-white" stroke={1.8} />
        </div>
        <div>
          <h1 className="text-headline-s text-bg font-black leading-tight">Mi ficha de directorio</h1>
          <p className="text-body-s text-bg/50 mt-0.5">Lo que ven de ti en Células y el dashboard de voluntarios.</p>
        </div>
      </div>

      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-label-m font-medium mb-6 ${
        form.is_active ? 'bg-emerald text-white' : 'bg-bg/8 text-bg/60'
      }`}>
        <Icon name={form.is_active ? 'visibility' : 'schedule'} className="w-[14px] h-[14px]" stroke={1.8} />
        {form.is_active ? 'Visible en el sitio' : 'Pendiente de revisión por un admin'}
      </span>

      <form onSubmit={handleSubmit} className="space-y-4 p-5 sm:p-6 rounded-2xl bg-bg/4 border border-bg/10">
        <div className="flex items-center gap-4">
          {form.photo_url ? (
            <img src={form.photo_url} alt={form.name} className="w-16 h-16 rounded-full object-cover border border-bg/10" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-bg/8 border border-bg/10 grid place-items-center">
              <Icon name="person" className="w-[20px] h-[20px] text-bg/50" stroke={1.8} />
            </div>
          )}
          <label className="cursor-pointer">
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-bg/10 text-body-s text-bg hover:border-bg/20 transition-colors">
              <Icon name="photo_camera" className="w-[16px] h-[16px]" stroke={1.8} />
              {uploading ? 'Subiendo…' : form.photo_url ? 'Cambiar foto' : 'Subir foto'}
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} disabled={uploading} />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-label-l text-bg/50 mb-1.5">Nombre <span className="text-err">*</span></label>
            <input value={form.name || ''} onChange={set('name')} className={fieldCls} required />
          </div>
          <div>
            <label className="block text-label-l text-bg/50 mb-1.5">Área / célula</label>
            <input value={form.area || ''} onChange={set('area')} className={fieldCls} placeholder="Ej. Célula Adolescentes" />
          </div>
          <div>
            <label className="block text-label-l text-bg/50 mb-1.5">WhatsApp (con 502)</label>
            <input value={form.phone || ''} onChange={set('phone')} className={fieldCls} placeholder="502XXXXXXXX" />
          </div>
          <div>
            <label className="block text-label-l text-bg/50 mb-1.5">Correo de contacto</label>
            <input type="email" value={form.email || ''} onChange={set('email')} className={fieldCls} />
          </div>
        </div>

        <div className="flex pt-2 border-t border-bg/10">
          <Button type="submit" variant="filled" disabled={saving || uploading} className="justify-center">
            <Icon name="save" className="w-[16px] h-[16px]" stroke={1.8} />
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </div>
  );
}
